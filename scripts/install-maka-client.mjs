import { cp, mkdir, readFile, writeFile, realpath } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { runtimeClosure } from './maka-source.mjs';

const root = resolve(import.meta.dirname, '..');
const release = JSON.parse(await readFile(join(root, 'config/maka-release.json'), 'utf8'));
const source = join(root, '.tools/maka-source', `apache-maka-${release.source.releaseVersion}`);
const archive = join(root, '.tools/maka-source', `apache-maka-${release.source.releaseVersion}-src.tar.gz`);
if (createHash('sha512').update(await readFile(archive)).digest('hex') !== release.source.sha512) throw new Error('Maka official source archive mismatch');
const desktop = join(source, 'apps/desktop');
if (!existsSync(join(desktop, 'dist/main/main.js')) || !existsSync(join(desktop, 'dist-renderer/index.html'))) throw new Error('Build the official source desktop client first.');
const install = join(process.env.LOCALAPPDATA, 'Programs', `Maka-${release.packageVersion}-Source`);
const application = join(install, 'app');
const profile = join(process.env.APPDATA, `Maka-SpecFlow-${release.packageVersion}`);
await mkdir(application, { recursive: true });
for (const entry of ['dist', 'dist-renderer', 'resources', 'build']) if (existsSync(join(desktop, entry))) await cp(join(desktop, entry), join(application, entry), { recursive: true });
const policy = await import(pathToFileURL(join(source, 'scripts/release-cli-file-policy.mjs')).href);
const workspaces = policy.resolveReleaseWorkspacePackages(source, '@maka/desktop');
const internal = new Map(workspaces.map(w => [w.name, w]));
const closure = await runtimeClosure(source, '@maka/desktop');
for (const entry of closure) {
  if (entry.pkg.name === '@maka/desktop') continue;
  let target;
  if (internal.has(entry.pkg.name)) target = join(application, 'node_modules', ...entry.pkg.name.split('/'));
  else {
    const r = relative(join(source, 'node_modules'), entry.path);
    if (!r.startsWith('..') && !isAbsolute(r)) target = join(application, 'node_modules', r);
    else for (const w of workspaces) { const nested = relative(join(w.directory, 'node_modules'), entry.path); if (!nested.startsWith('..') && !isAbsolute(nested)) { target = w.name === '@maka/desktop' ? join(application, 'node_modules', nested) : join(application, 'node_modules', ...w.name.split('/'), 'node_modules', nested); break; } }
  }
  if (!target) throw new Error(`Cannot preserve Maka client dependency resolution: ${entry.pkg.name}`);
  if (internal.has(entry.pkg.name)) {
    await mkdir(target, { recursive: true });
    await writeFile(join(target, 'package.json'), JSON.stringify(policy.workspaceReleaseManifest(entry.pkg), null, 2));
    for (const file of policy.resolveWorkspaceReleaseFiles(entry.path, entry.pkg)) await cp(join(entry.path, file), join(target, file), { recursive: true, filter: path => !policy.isMakaDevelopmentArtifact(relative(entry.path, path)) });
  } else await cp(entry.path, target, { recursive: true, dereference: true, filter: path => path === entry.path || (!relative(entry.path, path).split(/[\\/]/).includes('node_modules') && !policy.isThirdPartyDevelopmentArtifact(relative(entry.path, path))) });
}
const manifest = JSON.parse(await readFile(join(desktop, 'package.json'), 'utf8'));
delete manifest.devDependencies; delete manifest.scripts;
manifest.name = 'maka'; manifest.main = 'bootstrap.cjs';
manifest.makaUpdateChannel = 'release';
manifest.runtimeHostSetupPackage = `maka-agent@${release.packageVersion}`;
await writeFile(join(application, 'package.json'), JSON.stringify(manifest, null, 2));
await mkdir(profile, { recursive: true });
await writeFile(join(application, 'bootstrap.cjs'), `const { app } = require('electron');\napp.setName('Maka');\napp.setPath('userData', ${JSON.stringify(profile)});\nimport('./dist/main/main.js').catch(error => { console.error(error); app.exit(1); });\n`);
await cp(join(root, 'node_modules/electron/dist'), join(install, 'electron'), { recursive: true });
await cp(join(install, 'electron/electron.exe'), join(install, 'electron/Maka.exe'));
if (existsSync(join(desktop, 'assets'))) await cp(join(desktop, 'assets'), join(install, 'electron/resources/assets'), { recursive: true });
const compatibility = JSON.parse(await readFile(join(root, '.tools/maka/node_modules/maka-agent/specflow-compatibility.json'), 'utf8'));
for (const item of compatibility.files) {
  const target = join(application, 'node_modules/@maka/runtime-host/dist/server', item.file);
  if (createHash('sha256').update(await readFile(target)).digest('hex') !== item.originalHash) throw new Error(`Maka client compatibility source differs: ${item.file}`);
  await cp(join(root, '.tools/maka/node_modules/maka-agent/node_modules/@maka/runtime-host/dist/server', item.file), target);
}
for (const file of ['LICENSE', 'NOTICE', 'DISCLAIMER-WIP']) await cp(join(source, file), join(install, file));
await writeFile(join(install, 'source-release.json'), JSON.stringify({ source: release.source, version: release.packageVersion, installedAt: new Date().toISOString(), kind: 'local-desktop-build-from-official-source', profile, dependencies: closure.map(e => ({ name: e.pkg.name, version: e.pkg.version })) }, null, 2));
await writeFile(join(install, 'Maka.cmd'), `@echo off\r\nstart "Maka" "%~dp0electron\\Maka.exe" "%~dp0app"\r\n`);
console.log(JSON.stringify({ install, application, profile, version: release.packageVersion, packages: closure.length }, null, 2));
