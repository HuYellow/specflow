import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { acquireProfile } from '../src/profile.ts';

async function temporaryProfile() {
  const root = await mkdtemp(join(tmpdir(), 'specflow-profile-test-'));
  return { root, async cleanup() {
    if (!resolve(root).startsWith(resolve(tmpdir())) || !basename(root).startsWith('specflow-profile-test-')) throw new Error('Refusing cleanup outside profile test directory');
    await rm(root, { recursive: true, force: true });
  } };
}

test('DSH profile has one writer and keeps its execution identity after clean reload', async () => {
  const temp = await temporaryProfile();
  try {
    const first = await acquireProfile(temp.root);
    assert.match(first.instanceId, /^[0-9a-f-]{36}$/);
    await assert.rejects(acquireProfile(temp.root), /profile is locked/);
    assert.equal(JSON.parse(await readFile(join(temp.root, 'host.lock'), 'utf8')).pid, process.pid);
    await first.release();
    const second = await acquireProfile(temp.root);
    assert.equal(second.instanceId, first.instanceId);
    await second.release();
    await second.release();
  } finally { await temp.cleanup(); }
});

test('DSH profile refuses an unowned database and never steals stale ownership records', async () => {
  const temp = await temporaryProfile();
  try {
    await writeFile(join(temp.root, 'engineering.sqlite'), 'existing desktop data');
    await assert.rejects(acquireProfile(temp.root), /refuses to adopt/);
    assert.equal(await readFile(join(temp.root, 'engineering.sqlite'), 'utf8'), 'existing desktop data');
    await writeFile(join(temp.root, 'host.lock'), JSON.stringify({ pid: 999_999_999, token: 'dead-owner' }));
    await assert.rejects(acquireProfile(temp.root), /profile is locked/);
    assert.equal(JSON.parse(await readFile(join(temp.root, 'host.lock'), 'utf8')).token, 'dead-owner');
  } finally { await temp.cleanup(); }
});

test('DSH default profile follows the official DSH_HOME resolver', async () => {
  const temp = await temporaryProfile(), previous = process.env.DSH_HOME;
  try {
    process.env.DSH_HOME = temp.root;
    const profile = await acquireProfile();
    assert.equal(profile.dataDir, join(temp.root, 'specflow'));
    await profile.release();
  } finally {
    if (previous === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = previous;
    await temp.cleanup();
  }
});
