import { readFile, mkdir, cp, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
const root = resolve(import.meta.dirname, '..');
const release = JSON.parse(await readFile(join(root, 'config/maka-release.json'), 'utf8'));
if (release.distribution === 'source') {
  const { buildSourceRelease } = await import('./maka-source.mjs');
  await buildSourceRelease(root, release);
  process.exit(0);
}
if (release.status !== 'approved' || !release.packageVersion || !/^\d+\.\d+\.\d+$/.test(release.packageVersion) || !release.integrity || !release.releaseUrl || !release.tarballUrl) {
  throw new Error(`${release.reason} 没有已批准的正式包时，maka:setup 不安装任何替代版本。`);
}
if (release.allowSourceBuild !== false || release.channel !== 'official-release-only') throw new Error('Maka source builds and development channels are forbidden.');
const receipt = await fetch(`${release.registry}/${release.packageName}/${release.packageVersion}`, { signal: AbortSignal.timeout(30000) });
if (!receipt.ok) throw new Error('Approved Maka npm release is unavailable.');
const pkg = await receipt.json();
if (pkg.name !== release.packageName || pkg.version !== release.packageVersion || pkg.dist?.integrity !== release.integrity || pkg.dist?.tarball !== release.tarballUrl) throw new Error('Maka release metadata differs from the pinned approval.');
const tarball = await fetch(release.tarballUrl, { signal: AbortSignal.timeout(120000) });
if (!tarball.ok) throw new Error('Maka release tarball download failed.');
const payload = Buffer.from(await tarball.arrayBuffer());
const parts = release.integrity.match(/^(sha512)-([A-Za-z0-9+/=]+)$/);
if (!parts || createHash(parts[1]).update(payload).digest('base64') !== parts[2]) throw new Error('Maka release integrity verification failed.');
const cache = join(root, '.tools/maka-approved-package'); await mkdir(cache, { recursive: true });
const archive = join(cache, 'maka-agent.tgz'); await writeFile(archive, payload);
await rm(join(cache, 'package'), { recursive: true, force: true });
await new Promise((done, reject) => { const child = spawn('tar', ['-xf', archive, '-C', cache], { windowsHide: true, stdio: 'inherit' }); child.on('error', reject); child.on('exit', code => code === 0 ? done() : reject(new Error(`Maka extraction failed (${code})`))); });
const stage = join(cache, 'package');
if (JSON.parse(await readFile(join(stage, 'package.json'), 'utf8')).version !== release.packageVersion) throw new Error('Extracted Maka version differs from approved release.');
await writeFile(join(stage, 'specflow-release.json'), JSON.stringify(release, null, 2));
const { applyWindowsCompatibility } = await import('../packages/maka-adapter/compat.ts'); await applyWindowsCompatibility(stage);
const destination = join(root, '.tools/maka/node_modules/maka-agent'); await mkdir(join(root, '.tools/maka/node_modules'), { recursive: true });
const { activateMakaPackage } = await import('./maka-package-activation.mjs'); await activateMakaPackage(stage, destination);
console.log(`Installed formal Maka ${release.packageVersion}`);
