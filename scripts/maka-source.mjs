import { mkdir, readFile, writeFile, cp, rm, realpath } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { dirname, join, resolve, relative, isAbsolute, delimiter } from 'node:path';
import { pathToFileURL } from 'node:url';

const digest = buffer => createHash('sha512').update(buffer).digest('hex');
function run(binary, args, cwd, env, capture = false) {
  return new Promise((done, reject) => {
    const child = spawn(binary, args, { cwd, env, windowsHide: true, stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit' });
    let output = '', errors = '';
    if (capture) { child.stdout.on('data', data => { output += data; }); child.stderr.on('data', data => { errors += data; }); }
    child.on('error', reject); child.on('exit', code => code === 0 ? done(output) : reject(new Error(`${binary} failed (${code}): ${errors.slice(-4000)}`)));
  });
}
async function download(url, path) {
  const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`Maka official release download failed (${response.status}): ${url}`);
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
}
const inside = (parent, target) => { const r = relative(parent, target); return !r.startsWith('..') && !isAbsolute(r); };

// Resolve the installed, lockfile-controlled production graph. Optional TypeScript peers and
// development workspaces are excluded rather than relying on npm ls's development diagnostics.
export async function runtimeClosure(source, entryName) {
  const queue = [];
  const visited = new Map();
  async function findPackage(from, name, optional) {
    let current = from;
    while (inside(source, current)) {
      const candidate = join(current, 'node_modules', ...name.split('/'));
      if (existsSync(join(candidate, 'package.json'))) {
        const actual = await realpath(candidate);
        if (!inside(source, actual)) throw new Error(`Maka dependency escapes source tree: ${name}`);
        return actual;
      }
      if (current === source) break;
      current = dirname(current);
    }
    if (optional) return undefined;
    throw new Error(`Required Maka runtime dependency missing: ${name}`);
  }
  async function visit(path) {
    if (visited.has(path)) return;
    const pkg = JSON.parse(await readFile(join(path, 'package.json'), 'utf8'));
    const dependencies = { ...pkg.dependencies, ...pkg.optionalDependencies };
    for (const [name, version] of Object.entries(pkg.peerDependencies || {})) if (!pkg.peerDependenciesMeta?.[name]?.optional) dependencies[name] ??= version;
    const entry = { path, pkg, dependencies: [] }; visited.set(path, entry); queue.push(entry);
    for (const name of Object.keys(dependencies).sort()) {
      const next = await findPackage(path, name, !!pkg.optionalDependencies?.[name]);
      if (!next) continue;
      entry.dependencies.push({ name, path: next }); await visit(next);
    }
  }
  await visit(await findPackage(source, entryName, false));
  return queue;
}

export async function buildSourceRelease(root, release) {
  if (release.status !== 'approved' || release.channel !== 'official-release-only' || !release.allowSourceBuild || !/^\d+\.\d+\.\d+$/.test(release.packageVersion) || !release.source?.sha512) throw new Error('Only an approved official Maka source release may be built.');
  const cache = join(root, '.tools/maka-source'); await mkdir(cache, { recursive: true });
  const archiveName = `apache-maka-${release.source.releaseVersion}-src.tar.gz`;
  const archive = join(cache, archiveName);
  const previousArchive = join(root, '.tools/unused-maka-source-reference', archiveName);
  if (!existsSync(archive) && existsSync(previousArchive)) await cp(previousArchive, archive);
  if (!existsSync(archive)) await download(release.source.url, archive);
  if (digest(await readFile(archive)) !== release.source.sha512) throw new Error('Official Maka source SHA-512 differs from pinned release.');
  const signature = `${archive}.asc`, keys = join(cache, 'KEYS');
  await download(`${release.source.url}.asc`, signature); await download(release.source.keysUrl, keys);
  const keyring = join(cache, 'gnupg'); await mkdir(keyring, { recursive: true });
  const gitGpg = join(process.env.ProgramFiles || 'C:/Program Files', 'Git/usr/bin/gpg.exe');
  const gpg = process.env.SPECFLOW_GPG || (process.platform === 'win32' && existsSync(gitGpg) ? gitGpg : 'gpg');
  const env = { ...process.env, PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH || ''}`, ELECTRON_SKIP_BINARY_DOWNLOAD: '1' };
  // Relative paths also work with Git for Windows' MSYS GPG and avoid agent path translation.
  await run(gpg, ['--homedir', 'gnupg', '--batch', '--no-autostart', '--import', 'KEYS'], cache, env, true);
  const verified = await run(gpg, ['--homedir', 'gnupg', '--batch', '--no-autostart', '--status-fd', '1', '--verify', `${archiveName}.asc`, archiveName], cache, env, true);
  if (!verified.includes(`[GNUPG:] VALIDSIG ${release.source.signerFingerprint} `)) throw new Error('Official Maka signer does not match pinned release key.');
  console.log(`Verified official Apache Maka ${release.packageVersion}: SHA-512 and release signature`);

  const source = join(cache, `apache-maka-${release.source.releaseVersion}`);
  await run('tar', ['-xf', archive, '-C', cache], cache, env);
  const sourceManifest = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'));
  if (sourceManifest.version !== release.packageVersion || sourceManifest.packageManager !== `npm@${release.source.npmVersion}`) throw new Error('Official source identity or npm toolchain differs from approval.');
  const systemNpm = process.env.npm_execpath;
  if (!systemNpm) throw new Error('Run this command through npm run maka:setup.');
  const toolchain = join(cache, 'toolchain'); await mkdir(toolchain, { recursive: true });
  const npmCli = join(toolchain, 'node_modules/npm/bin/npm-cli.js');
  const installedNpm = await readFile(join(toolchain, 'node_modules/npm/package.json'), 'utf8').then(JSON.parse).catch(() => undefined);
  if (installedNpm?.version !== release.source.npmVersion) await run(process.execPath, [systemNpm, 'install', '--prefix', toolchain, '--ignore-scripts', '--no-audit', '--no-fund', '--save-exact', `npm@${release.source.npmVersion}`, '--registry=https://registry.npmjs.org'], root, env);
  const policy = await import(pathToFileURL(join(source, 'scripts/release-cli-file-policy.mjs')).href);
  const workspaces = policy.resolveReleaseWorkspacePackages(source, '@maka/runtime-host');
  const buildKey = `${release.source.sha512}:${release.source.npmVersion}:${process.version}:${process.platform}:${process.arch}`;
  const stampPath = join(cache, 'runtime-build.json');
  const previousBuild = await readFile(stampPath, 'utf8').then(JSON.parse).catch(() => undefined);
  if (previousBuild?.key !== buildKey || !existsSync(join(source, 'packages/runtime-host/dist/client/index.js'))) {
    await run(process.execPath, [npmCli, 'ci', '--ignore-scripts', '--no-audit', '--no-fund', '--registry=https://registry.npmjs.org'], source, env);
    await run(process.execPath, [join(source, 'scripts/apply-dependency-patches.mjs')], source, env);
    for (const name of policy.orderWorkspaceBuilds(workspaces)) await run(process.execPath, [npmCli, '--workspace', name, 'run', 'build'], source, env);
    await writeFile(stampPath, JSON.stringify({ key: buildKey, builtAt: new Date().toISOString() }));
  } else {
    await run(process.execPath, [join(source, 'scripts/apply-dependency-patches.mjs')], source, env);
    console.log('Reusing the verified release build for this Node version and platform.');
  }
  const closure = await runtimeClosure(source, '@maka/runtime-host');
  const stage = join(cache, 'runtime-stage'); await rm(stage, { recursive: true, force: true }); await mkdir(stage, { recursive: true });
  const internal = new Map(workspaces.map(w => [w.name, w]));
  const destinations = new Map();
  for (const entry of closure) {
    let target;
    if (internal.has(entry.pkg.name)) target = join(stage, 'node_modules', ...entry.pkg.name.split('/'));
    else {
      const rel = relative(join(source, 'node_modules'), entry.path);
      if (!rel.startsWith('..') && !isAbsolute(rel)) target = join(stage, 'node_modules', rel);
      else {
        for (const workspace of workspaces) {
          const nested = relative(join(workspace.directory, 'node_modules'), entry.path);
          if (!nested.startsWith('..') && !isAbsolute(nested)) { target = join(stage, 'node_modules', ...workspace.name.split('/'), 'node_modules', nested); break; }
        }
        if (!target) throw new Error(`Unexpected nested Maka production dependency: ${entry.pkg.name}`);
      }
    }
    destinations.set(entry.path, target);
    if (internal.has(entry.pkg.name)) {
      await mkdir(target, { recursive: true });
      await writeFile(join(target, 'package.json'), JSON.stringify(policy.workspaceReleaseManifest(entry.pkg), null, 2));
      for (const file of policy.resolveWorkspaceReleaseFiles(entry.path, entry.pkg)) await cp(join(entry.path, file), join(target, file), { recursive: true, filter: path => !policy.isMakaDevelopmentArtifact(relative(entry.path, path)) });
    } else {
      await cp(entry.path, target, { recursive: true, dereference: true, filter: path => path === entry.path || (!relative(entry.path, path).split(/[\\/]/).includes('node_modules') && !policy.isThirdPartyDevelopmentArtifact(relative(entry.path, path))) });
    }
  }
  // Nested third-party packages keep their original resolution paths. Assert all dependencies
  // remain reachable after pruning so missing runtime modules cannot silently ship.
  for (const entry of closure) for (const dependency of entry.dependencies) if (!destinations.has(dependency.path)) throw new Error(`Maka closure incomplete: ${dependency.name}`);
  await writeFile(join(stage, 'package.json'), JSON.stringify({ name: release.packageName, version: release.packageVersion, private: true, type: 'module', license: sourceManifest.license, description: 'SpecFlow Runtime Host build of the official Apache Maka source release', dependencies: { '@maka/runtime-host': JSON.parse(await readFile(join(stage, 'node_modules/@maka/runtime-host/package.json'), 'utf8')).version } }, null, 2));
  for (const name of ['LICENSE', 'NOTICE', 'DISCLAIMER-WIP']) await cp(join(source, name), join(stage, name));
  const notices = join(source, 'packages/cli/THIRD_PARTY_NOTICES.txt'); if (existsSync(notices)) await cp(notices, join(stage, 'THIRD_PARTY_NOTICES.txt'));
  await writeFile(join(stage, 'specflow-release.json'), JSON.stringify({ ...release, build: { kind: 'runtime-host-production-closure', signatureVerified: true, builtAt: new Date().toISOString(), node: process.version, npm: release.source.npmVersion, platform: process.platform, arch: process.arch, packages: closure.map(e => ({ name: e.pkg.name, version: e.pkg.version })) } }, null, 2));
  const { applyWindowsCompatibility } = await import('../packages/maka-adapter/compat.ts'); await applyWindowsCompatibility(stage);
  const destination = join(root, '.tools/maka/node_modules/maka-agent');
  const { activateMakaPackage } = await import('./maka-package-activation.mjs'); await activateMakaPackage(stage, destination);
  await writeFile(join(root, '.tools/maka/package.json'), JSON.stringify({ private: true, description: 'SpecFlow-owned runtime from the signed Apache Maka source release', release: release.packageVersion, distribution: 'source' }, null, 2));
  console.log(`Installed Maka ${release.packageVersion} runtime: ${closure.length} production packages; source, compiler, CLI and Eval excluded.`);
}
