import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const root = resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const bundled = join(homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'bin', process.platform === 'win32' ? 'node.exe' : 'node');
const binary = process.env.SPECFLOW_NODE || (Number(process.versions.node.split('.')[0]) >= 24 ? process.execPath : existsSync(bundled) ? bundled : undefined);
if (!binary) throw new Error('SpecFlow requires Node.js 24+. Set SPECFLOW_NODE to its executable.');
const env = { ...process.env, PATH: `${dirname(binary)}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH}` };
const children = new Set();
const viteCli = () => join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');
async function buildWorkspacePlugin() {
  const { build } = await import('esbuild');
  await build({ entryPoints: ['plugins/specflow-workspace/index.ts'], outfile: '.tools/workspace-plugin/index.mjs', bundle: true, platform: 'node', format: 'esm', target: 'node24' });
}
function run(args, cwd = root) {
  return new Promise((done, reject) => {
    const child = spawn(binary, args, { cwd, env, stdio: 'inherit', windowsHide: true });
    children.add(child);
    child.on('error', reject);
    child.on('exit', code => { children.delete(child); code === 0 ? done() : reject(new Error(`Command failed (${code}): ${args.join(' ')}`)); });
  });
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { for (const child of children) child.kill(); process.exit(0); });
const command = process.argv[2];
try {
  if (command === 'dev') { await buildWorkspacePlugin(); await Promise.all([run([require.resolve('tsx/cli'), 'apps/server/src/main.ts']), run([viteCli()])]); }
  else if (command === 'typecheck') await run([require.resolve('typescript/bin/tsc'), '--noEmit']);
  else if (command === 'build') {
    await run([require.resolve('typescript/bin/tsc'), '--noEmit']);
    await run([viteCli(), 'build']);
    const { build } = await import('esbuild');
    await build({ entryPoints: ['apps/server/src/main.ts'], outfile: 'dist/server.mjs', bundle: true, platform: 'node', format: 'esm', packages: 'external', target: 'node24' });
    await buildWorkspacePlugin();
  } else if (command === 'desktop') {
    await run(['scripts/desktop.mjs', ...process.argv.slice(3)]);
  } else if (command === 'desktop-smoke') {
    await run(['scripts/desktop-smoke.mjs', ...process.argv.slice(3)]);
  } else if (command === 'requirements-smoke') {
    await run(['scripts/requirements-smoke.mjs', ...process.argv.slice(3)]);
  } else if (command === 'clarify-smoke') {
    await run(['scripts/clarify-smoke.mjs', ...process.argv.slice(3)]);
  } else if (command === 'workspaces-smoke') {
    await run(['scripts/workspaces-smoke.mjs', ...process.argv.slice(3)]);
  } else if (command === 'start') await run(['dist/server.mjs']);
  else if (command === 'test') { await buildWorkspacePlugin(); await run(['--import', 'tsx', '--test', '--test-concurrency=1', ...(process.argv.slice(3).length ? process.argv.slice(3) : ['tests/*.test.ts'])]); }
  else if (command === 'maka-probe') { await buildWorkspacePlugin(); await run([require.resolve('tsx/cli'), 'scripts/maka-probe.ts']); }
  else if (command === 'maka-setup') {
    await run(['scripts/maka-setup.mjs']);
  } else throw new Error(`Unknown command: ${command}`);
} catch (error) { console.error(error.message); for (const child of children) child.kill(); process.exitCode = 1; }
