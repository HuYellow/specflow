import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
test('Maka 更新先准备完整包，保留旧包；准备失败时旧安装可继续使用', async () => {
  const { activateMakaPackage } = await import(pathToFileURL(resolve('scripts/maka-package-activation.mjs')).href);
  const root = await mkdtemp(join(tmpdir(), 'specflow-maka-activation-'));
  try {
    const stage = join(root, 'stage'), active = join(root, 'active'); await mkdir(stage); await mkdir(active);
    await writeFile(join(active, 'package.json'), 'old'); await writeFile(join(stage, 'package.json'), 'new');
    await assert.rejects(activateMakaPackage(join(root, 'missing'), active));
    assert.equal(await readFile(join(active, 'package.json'), 'utf8'), 'old');
    await activateMakaPackage(stage, active);
    assert.equal(await readFile(join(active, 'package.json'), 'utf8'), 'new');
    const backup = (await readdir(root)).find(name => name.startsWith('active.previous-'))!;
    assert.equal(await readFile(join(root, backup, 'package.json'), 'utf8'), 'old');
  } finally { await rm(root, { recursive: true, force: true }); }
});
