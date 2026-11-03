import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const { verifyMacApplication } = await import(pathToFileURL(resolve('scripts/desktop-macos.mjs')).href);

test('macOS validation accepts a complete ad-hoc bundle and rejects missing seals, altered resources and broken bundled executables', { skip: process.platform !== 'darwin' }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'specflow-signature-test-'));
  const application = join(directory, 'SpecFlow.app');
  const executable = join(application, 'Contents/MacOS/SpecFlow');
  const node = join(application, 'Contents/Resources/runtime/bin/node');
  const resource = join(application, 'Contents/Resources/message.txt');
  try {
    await mkdir(join(application, 'Contents/MacOS'), { recursive: true });
    await mkdir(join(application, 'Contents/Resources/runtime/bin'), { recursive: true });
    await writeFile(join(application, 'Contents/Info.plist'), '<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleExecutable</key><string>SpecFlow</string><key>CFBundleIdentifier</key><string>dev.specflow.signature-test</string><key>CFBundlePackageType</key><string>APPL</string></dict></plist>');
    await writeFile(join(directory, 'main.c'), 'int main(void) { return 0; }\n');
    await exec('clang', [join(directory, 'main.c'), '-o', executable]);
    await cp(executable, node);
    await writeFile(resource, 'original');
    await assert.rejects(verifyMacApplication(application), /code has no resources|not signed/);
    await exec('codesign', ['--force', '--sign', '-', node]);
    await exec('codesign', ['--force', '--sign', '-', application]);
    assert.deepEqual(await verifyMacApplication(application), { signed: false });
    await writeFile(resource, 'changed after signing');
    await assert.rejects(verifyMacApplication(application), /resource.*modified|sealed resource/i);
    await writeFile(resource, 'original');
    await exec('codesign', ['--remove-signature', node]);
    await exec('codesign', ['--force', '--sign', '-', application]);
    await assert.rejects(verifyMacApplication(application), /not signed/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
