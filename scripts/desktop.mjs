import { cp, mkdir, readFile, rm, writeFile, chmod } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
import { loadDesktopRelease, desktopPublishConfiguration, desktopReleaseCapabilities, verifyDesktopReleaseTag } from './desktop-release.mjs';

const root = resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const command = process.argv[2] || 'start';
const platform = process.argv.includes('--mac') ? 'darwin' : process.argv.includes('--win') ? 'win32' : process.platform;
const arch = process.argv.includes('--arm64') ? 'arm64' : process.argv.includes('--x64') ? 'x64' : process.arch;
const runtimeVersion = '24.19.0';
const staging = join(root, '.tools/desktop');
const resources = join(staging, 'resources');
const runtime = join(staging, 'runtime');
const packageArgs = process.argv.slice(3);
if (packageArgs.some(argument => !['--win', '--mac', '--x64', '--arm64', '--dir'].includes(argument))) throw new Error('Desktop package arguments are limited to --win, --mac, --x64, --arm64 and --dir. Publishing is handled only by the release workflow.');
if ((packageArgs.includes('--win') && packageArgs.includes('--mac')) || (packageArgs.includes('--x64') && packageArgs.includes('--arm64'))) throw new Error('Build one desktop platform and architecture per invocation.');
function run(binary, args, cwd = root, extraEnv = {}) {
  return new Promise((done, reject) => {
    const child = spawn(binary, args, { cwd, env: { ...process.env, ...extraEnv }, stdio: 'inherit', windowsHide: true });
    child.on('error', reject); child.on('exit', code => code === 0 ? done() : reject(new Error(`${binary} exited ${code}`)));
  });
}
async function download(url, path) {
  const response = await fetch(url, { signal: AbortSignal.timeout(180000) });
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
}
async function prepareRuntime() {
  if (!['win32', 'darwin'].includes(platform) || !['x64', 'arm64'].includes(arch)) throw new Error('Desktop supports Windows/macOS x64/arm64.');
  const label = `node-v${runtimeVersion}-${platform === 'win32' ? 'win' : 'darwin'}-${arch}`;
  const archiveName = `${label}.${platform === 'win32' ? 'zip' : 'tar.gz'}`;
  const cache = join(root, '.tools/desktop-cache'); await mkdir(cache, { recursive: true });
  const archivePath = join(cache, archiveName);
  const checksums = await (await fetch(`https://nodejs.org/dist/v${runtimeVersion}/SHASUMS256.txt`)).text();
  const expected = checksums.split('\n').find(line => line.endsWith(`  ${archiveName}`))?.split(' ')[0];
  if (!expected || !/^[a-f0-9]{64}$/.test(expected)) throw new Error('Official Node checksum not found.');
  const digest = async () => createHash('sha256').update(await readFile(archivePath)).digest('hex');
  if (!existsSync(archivePath) || await digest() !== expected) await download(`https://nodejs.org/dist/v${runtimeVersion}/${archiveName}`, archivePath);
  if (await digest() !== expected) throw new Error('Node archive failed checksum verification.');
  const extraction = join(cache, label);
  if (!existsSync(join(extraction, '.specflow-extracted'))) {
    await run('tar', ['-xf', archivePath, '-C', cache]);
    await writeFile(join(extraction, '.specflow-extracted'), expected);
  }
  // Only delete fixed staging paths under this project, never a user data directory.
  await rm(runtime, { recursive: true, force: true });
  await cp(extraction, runtime, { recursive: true });
  await writeFile(join(staging, 'runtime-integrity.json'), JSON.stringify({ node: runtimeVersion, platform, arch, archiveName, sha256: expected }, null, 2));
}
async function prepare() {
  if (platform !== process.platform || arch !== process.arch) throw new Error('Desktop packages must be built on the matching Windows/macOS architecture so native files, executable modes and signatures are preserved. Use .github/workflows/desktop.yml for all three targets.');
  const release = await loadDesktopRelease();
  const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  verifyDesktopReleaseTag(release, version, process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : undefined, process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REPOSITORY : undefined);
  const capabilities = desktopReleaseCapabilities(release, platform);
  if (platform === 'darwin' && process.env.SPECFLOW_REQUIRE_SIGNED_RELEASE === 'true' && !capabilities.automaticUpdates) throw new Error('Public macOS releases require Developer ID signing and notarization credentials so installed applications can update.');
  const { verifyMakaRelease, MAKA_RELEASE_AVAILABLE, MAKA_RELEASE } = await import('../packages/maka-adapter/release-policy.ts');
  if (!MAKA_RELEASE_AVAILABLE) throw new Error(`Cannot package without an approved official Maka release: ${MAKA_RELEASE.reason}`);
  const maka = join(root, '.tools/maka/node_modules/maka-agent');
  if (!existsSync(join(maka, 'package.json'))) throw new Error('Run npm run maka:setup first.');
  const verifiedMaka = await verifyMakaRelease(maka);
  if (MAKA_RELEASE.distribution === 'source' && (verifiedMaka.provenance.build.platform !== platform || verifiedMaka.provenance.build.arch !== arch)) throw new Error('Rebuild the approved Maka source runtime on this desktop platform and architecture with npm run maka:setup.');
  await run(process.execPath, ['scripts/toolchain.mjs', 'build']);
  await build({ entryPoints: ['apps/desktop/main.ts'], outfile: 'dist/desktop/main.cjs', bundle: true, platform: 'node', format: 'cjs', external: ['electron'], target: 'node24' });
  await build({ entryPoints: ['apps/desktop/preload.ts'], outfile: 'dist/desktop/preload.cjs', bundle: true, platform: 'node', format: 'cjs', external: ['electron'], target: 'node24' });
  await prepareRuntime();
  await rm(resources, { recursive: true, force: true }); await mkdir(resources, { recursive: true });
  await cp(join(root, 'dist/server.mjs'), join(resources, 'server.mjs'));
  await cp(join(root, 'dist/web'), join(resources, 'web'), { recursive: true });
  await cp(join(root, '.tools/workspace-plugin'), join(resources, 'workspace-plugin'), { recursive: true });
  await cp(join(root, 'plugins/specflow-workspace/maka.extension.json'), join(resources, 'workspace-plugin/maka.extension.json'));
  await cp(maka, join(resources, 'maka'), { recursive: true });
  await writeFile(join(resources, 'maka-release-policy.json'), JSON.stringify(MAKA_RELEASE, null, 2));
  await writeFile(join(resources, 'desktop-release.json'), JSON.stringify(capabilities, null, 2));
  // The same reviewed release source is embedded in the app and updater metadata.
  await writeFile(join(staging, 'electron-builder.json'), JSON.stringify({
    extends: join(root, 'electron-builder.yml'),
    publish: desktopPublishConfiguration(release),
    ...(platform === 'darwin' ? { forceCodeSigning: capabilities.automaticUpdates, mac: { notarize: capabilities.automaticUpdates } } : {}),
  }, null, 2));
  // Runtime deps use the workspace lock; Electron/build tools stay outside the shipped backend.
  await cp(join(root, 'package.json'), join(resources, 'package.json'));
  await cp(join(root, 'package-lock.json'), join(resources, 'package-lock.json'));
  const npm = process.env.npm_execpath;
  if (!npm) throw new Error('Run desktop commands through npm.');
  await run(process.execPath, [npm, 'ci', '--omit=dev', '--ignore-scripts', '--prefix', resources, '--registry=https://registry.npmjs.org']);
  await rm(join(resources, 'package-lock.json'));
  if (platform === 'win32') {
    // Patch during packaging so installed Program Files / macOS app resources stay immutable.
    const { applyWindowsCompatibility } = await import('../packages/maka-adapter/compat.ts');
    await applyWindowsCompatibility(join(resources, 'maka'));
  }
  if (platform === 'darwin') {
    await chmod(join(runtime, 'bin/node'), 0o755);
    await chmod(join(runtime, 'bin/npm'), 0o755);
    await chmod(join(runtime, 'bin/npx'), 0o755);
  }
  await cp(join(staging, 'runtime-integrity.json'), join(resources, 'runtime-integrity.json'));
  await rm(join(runtime, '.specflow-extracted'), { force: true });
  console.log(`Desktop resources ready: ${platform}/${arch}`);
}

try {
  if (command === 'prepare') await prepare();
  else if (command === 'start') {
    await prepare();
    await run(require('electron'), ['.']);
  } else if (command === 'package') {
    await prepare();
    const electronPackage = JSON.parse(await readFile(require.resolve('electron/package.json'), 'utf8'));
    const localElectron = join(dirname(require.resolve('electron/package.json')), 'dist');
    const localVersion = await readFile(join(localElectron, 'version'), 'utf8').catch(() => '');
    const localDist = localVersion.trim() === electronPackage.version ? ['--config.electronDist', localElectron] : [];
    await run(process.execPath, [require.resolve('electron-builder/cli.js'), '--config', join(staging, 'electron-builder.json'), '--publish', 'never', ...localDist, ...(packageArgs.length ? packageArgs : [platform === 'darwin' ? '--mac' : '--win', `--${arch}`])]);
  } else throw new Error(`Unknown desktop command: ${command}`);
} catch (error) { console.error(error); process.exitCode = 1; }
