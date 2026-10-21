import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join, resolve, relative } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const plugin = join(root, 'plugins', 'deepseek-specflow');
const output = join(plugin, 'dist');
const require = createRequire(import.meta.url);
const manifest = JSON.parse(await readFile(join(plugin, 'package.json'), 'utf8'));
const command = process.argv[2] || 'build';

function run(args, options = {}) {
  return new Promise((done, reject) => {
    const child = spawn(process.execPath, args, { cwd: options.cwd || root, env: process.env, stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', windowsHide: true });
    let stdout = '', stderr = '';
    if (options.capture) {
      child.stdout.on('data', data => { stdout += data; });
      child.stderr.on('data', data => { stderr += data; });
    }
    child.on('error', reject);
    child.on('exit', code => code === 0 ? done(stdout) : reject(new Error(`Command failed (${code}): ${args.join(' ')}\n${stderr}`)));
  });
}

export async function buildPlugin() {
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('The Specflow plugin build requires Node.js 24+.');
  if (manifest.dependencies?.specflow) throw new Error('Do not publish a dependency on the desktop checkout.');
  await mkdir(output, { recursive: true });
  const host = await build({
    absWorkingDir: root, entryPoints: ['plugins/deepseek-specflow/src/host.ts'],
    outfile: join(output, 'index.mjs'), bundle: true, format: 'esm', platform: 'node',
    target: 'node24', external: ['@deepseek-ai/*'], metafile: true,
  });
  const forbidden = Object.keys(host.metafile.inputs).filter(path => /(?:^|\/)(?:maka-adapter|opencode-adapter|desktop|tests|\.tools)\//.test(path.replaceAll('\\', '/')));
  if (forbidden.length) throw new Error(`The plugin contains desktop/runtime/test code: ${forbidden.join(', ')}`);
  const client = await build({
    absWorkingDir: root, entryPoints: ['plugins/deepseek-specflow/src/client.tsx'],
    outfile: join(output, 'client.js'), write: false, bundle: true, format: 'cjs',
    platform: 'browser', target: 'es2022', jsx: 'automatic',
    external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'],
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [{
      name: 'specflow-inline-styles',
      setup(builder) {
        builder.onResolve({ filter: /\.css\?inline$/ }, args => ({ path: resolve(args.resolveDir, args.path.slice(0, -7)), namespace: 'inline-styles' }));
        builder.onLoad({ filter: /.*/, namespace: 'inline-styles' }, async args => ({ contents: await readFile(args.path, 'utf8'), loader: 'text' }));
      },
    }],
    metafile: true,
  });
  const runtimeImports = Object.values(client.metafile.outputs).flatMap(row => row.imports).map(row => row.path);
  if (runtimeImports.some(path => !['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'].includes(path))) throw new Error(`Unsupported browser external: ${runtimeImports.join(', ')}`);
  const browserCode = `window.__ModuleLoader__.load({ id: ${JSON.stringify(manifest.name)}, factory: (require) => {\nconst module = { exports: {} };\nconst exports = module.exports;\n${client.outputFiles[0].text}\nreturn module.exports;\n} });\n`;
  await writeFile(join(output, 'client.js'), browserCode);
  await copyFile(join(root, 'LICENSE'), join(plugin, 'LICENSE'));
  await copyFile(join(dirname(require.resolve('zod/package.json')), 'LICENSE'), join(output, 'ZOD_LICENSE'));
  const info = {
    schemaVersion: 1, name: manifest.name, version: manifest.version,
    compatibility: { dsh: manifest.engines.dsh, node: manifest.engines.node },
    artifacts: {},
  };
  for (const file of ['index.mjs', 'client.js']) {
    const bytes = await readFile(join(output, file));
    info.artifacts[file] = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  }
  await writeFile(join(output, 'build-info.json'), `${JSON.stringify(info, null, 2)}\n`);
  console.log(`Built ${manifest.name}@${manifest.version}: Host ${info.artifacts['index.mjs'].bytes} bytes, Client ${info.artifacts['client.js'].bytes} bytes; DSH ${manifest.engines.dsh}.`);
  return info;
}

async function packPlugin() {
  await buildPlugin();
  const npm = process.env.npm_execpath;
  if (!npm) throw new Error('Run npm run dsh:pack so the npm CLI path is available.');
  const destination = join(root, 'release', 'dsh');
  await mkdir(destination, { recursive: true });
  const result = JSON.parse(await run([npm, 'pack', '--json', '--ignore-scripts', '--pack-destination', destination], { cwd: plugin, capture: true }))[0];
  const permitted = new Set(['package.json', 'README.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'cordis.patch.yml', 'dist/index.mjs', 'dist/client.js', 'dist/ZOD_LICENSE', 'dist/build-info.json']);
  const files = result.files.map(file => file.path);
  for (const file of files) if (!permitted.has(file)) throw new Error(`Unexpected file in release tarball: ${file}`);
  for (const file of permitted) if (!files.includes(file)) throw new Error(`Missing release file: ${file}`);
  const tarball = join(destination, result.filename);
  const digest = createHash('sha256').update(await readFile(tarball)).digest('hex');
  await writeFile(join(destination, 'SHA256SUMS.txt'), `${digest}  ${result.filename}\n`);
  console.log(`Packed ${relative(root, tarball)} (${result.size} bytes, ${files.length} files).\nSHA-256 ${digest}`);
  return tarball;
}

if (command === 'build') await buildPlugin();
else if (command === 'pack') await packPlugin();
else if (command === 'typecheck') await run([require.resolve('typescript/bin/tsc'), '--noEmit', '-p', join(plugin, 'tsconfig.json')]);
else if (command === 'test') await run(['--import', 'tsx', '--test', '--test-concurrency=1', 'plugins/deepseek-specflow/tests/*.test.ts']);
else if (command === 'smoke') {
  const tarball = await packPlugin();
  const smokeArgs = process.argv.slice(3);
  // A positional runtime directory also works through Windows npm launchers
  // that consume an unknown option name while forwarding its value.
  if (smokeArgs[0] && !smokeArgs[0].startsWith('--')) smokeArgs.unshift('--runtimeDir');
  await run(['scripts/dsh-host-smoke.mjs', '--package', tarball, ...smokeArgs]);
  await run(['--import', 'tsx', 'scripts/dsh-backend-smoke.mjs', ...smokeArgs]);
  await run(['scripts/dsh-client-smoke.mjs']);
} else throw new Error(`Unknown DSH plugin command: ${command}`);
