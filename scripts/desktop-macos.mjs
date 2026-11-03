import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export async function verifyMacApplication(application) {
  // Ad-hoc builds need a complete resource seal too. A linker signature on the
  // Electron executable alone is insufficient, even when the app starts locally.
  await exec('codesign', ['--verify', '--deep', '--strict', application]);
  await exec('codesign', ['--verify', '--strict', join(application, 'Contents/Resources/runtime/bin/node')]);
  const signature = await exec('codesign', ['-dv', '--verbose=4', application]);
  return { signed: signature.stderr.includes('Authority=Developer ID Application:') };
}

export async function verifyMacArtifacts(directory, version, arch) {
  const application = join(directory, arch === 'arm64' ? 'mac-arm64' : 'mac', 'SpecFlow.app');
  const { signed } = await verifyMacApplication(application);
  const notarized = signed && await exec('xcrun', ['stapler', 'validate', application]).then(() => true, () => false);
  const artifacts = [];
  for (const extension of ['dmg', 'zip']) {
    const name = `SpecFlow-${version}-mac-${arch}.${extension}`;
    const artifact = join(directory, name);
    const temporary = await mkdtemp(join(tmpdir(), 'specflow-mac-signature-'));
    const mountpoint = join(temporary, 'image');
    let mounted = false;
    try {
      if (extension === 'dmg') {
        await exec('hdiutil', ['verify', artifact]);
        await mkdir(mountpoint);
        await exec('hdiutil', ['attach', '-readonly', '-nobrowse', '-noautoopen', '-mountpoint', mountpoint, artifact]);
        mounted = true;
      } else await exec('ditto', ['-x', '-k', artifact, temporary]);
      const packagedApplication = join(extension === 'dmg' ? mountpoint : temporary, 'SpecFlow.app');
      await verifyMacApplication(packagedApplication);
      const packagedVersion = await exec('plutil', ['-extract', 'CFBundleShortVersionString', 'raw', '-o', '-', join(packagedApplication, 'Contents/Info.plist')]);
      if (packagedVersion.stdout.trim() !== version) throw new Error(`macOS artifact version differs: ${name}`);
      await exec('lipo', ['-verify_arch', arch === 'x64' ? 'x86_64' : arch, join(packagedApplication, 'Contents/MacOS/SpecFlow')]);
      artifacts.push({ name, sha256: createHash('sha256').update(await readFile(artifact)).digest('hex') });
    } finally {
      if (mounted) await exec('hdiutil', ['detach', mountpoint]);
      await rm(temporary, { recursive: true, force: true });
    }
  }
  return { signed, notarized, signatureVerified: true, artifacts };
}
