import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const { verifyMacApplication, verifyMacArtifacts } = await import(pathToFileURL(resolve('scripts/desktop-macos.mjs')).href);

test('macOS validation accepts a complete ad-hoc bundle and rejects missing seals, altered resources and broken bundled executables', { skip: process.platform !== 'darwin' }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'specflow-signature-test-'));
  const applicationDirectory = join(directory, process.arch === 'arm64' ? 'mac-arm64' : 'mac');
  const application = join(applicationDirectory, 'SpecFlow.app');
  const executable = join(application, 'Contents/MacOS/SpecFlow');
  const node = join(application, 'Contents/Resources/runtime/bin/node');
  const resource = join(application, 'Contents/Resources/message.txt');
  try {
    await mkdir(join(application, 'Contents/MacOS'), { recursive: true });
    await mkdir(join(application, 'Contents/Resources/runtime/bin'), { recursive: true });
    await writeFile(join(application, 'Contents/Info.plist'), '<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleExecutable</key><string>SpecFlow</string><key>CFBundleIdentifier</key><string>dev.specflow.signature-test</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleShortVersionString</key><string>1.2.3</string></dict></plist>');
    await writeFile(join(directory, 'main.c'), 'int main(void) { return 0; }\n');
    await exec('clang', [join(directory, 'main.c'), '-o', executable]);
    await cp(executable, node);
    await writeFile(resource, 'original');
    await assert.rejects(verifyMacApplication(application), /code has no resources|not signed/);
    await exec('codesign', ['--force', '--sign', '-', node]);
    await exec('codesign', ['--force', '--sign', '-', application]);
    assert.deepEqual(await verifyMacApplication(application), { signed: false });
    await exec('hdiutil', ['create', '-srcfolder', applicationDirectory, '-format', 'UDZO', join(directory, `SpecFlow-1.2.3-mac-${process.arch}.dmg`)]);
    await exec('ditto', ['-c', '-k', '--keepParent', application, join(directory, `SpecFlow-1.2.3-mac-${process.arch}.zip`)]);
    const verified = await verifyMacArtifacts(directory, '1.2.3', process.arch);
    assert.equal(verified.signatureVerified, true);
    assert.equal(verified.signed, false);
    assert.equal(verified.notarized, false);
    assert.equal(verified.artifacts.length, 2);
    await writeFile(resource, 'changed after signing');
    await assert.rejects(verifyMacApplication(application), /resource.*modified|sealed resource/i);
    await writeFile(resource, 'original');
    await exec('codesign', ['--remove-signature', node]);
    await exec('codesign', ['--force', '--sign', '-', application]);
    await assert.rejects(verifyMacApplication(application), /not signed/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
