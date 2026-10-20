import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const automation = await import(pathToFileURL(resolve('scripts/desktop-ci.mjs')).href);
const config = { schemaVersion: 1, provider: 'github', owner: 'HuYellow', repo: 'specflow', channel: 'latest', tagNamePrefix: 'desktop-v' };
const sourceSha = 'a'.repeat(40);
const base = { config, version: '0.1.4', lockVersion: '0.1.4', rootLockVersion: '0.1.4', repository: 'HuYellow/specflow', sourceSha, eventName: 'push', refType: 'branch', refName: 'main', releases: [{ tag_name: 'desktop-v0.1.3', draft: false, prerelease: false }] };

test('Windows signature inspection loads native modules even with an incompatible inherited search path', { skip: process.platform !== 'win32' }, async () => {
  const original = process.env.PSModulePath;
  process.env.PSModulePath = resolve('.tools/nonexistent-powershell-modules');
  try {
    assert.equal(typeof await automation.readWindowsSignature(process.execPath), 'boolean');
    await assert.rejects(automation.readWindowsSignature(resolve('.tools/no-such-installer.exe')));
  } finally {
    if (original == null) delete process.env.PSModulePath;
    else process.env.PSModulePath = original;
  }
});

test('main only publishes a new stable version, with the previous public release as changelog baseline', () => {
  const plan = automation.planDesktopRelease({ ...base, releases: [...base.releases,
    { tag_name: 'desktop-v0.1.99', draft: true, prerelease: false },
    { tag_name: 'desktop-v0.1.98', draft: false, prerelease: true },
    { tag_name: 'desktop-v0.1.4-rc.1', draft: false, prerelease: true },
    { tag_name: 'unrelated-9.9.9', draft: false, prerelease: false },
  ] });
  assert.equal(plan.build, true);
  assert.equal(plan.publish, true);
  assert.equal(plan.sourceSha, sourceSha);
  assert.equal(plan.tag, 'desktop-v0.1.4');
  assert.equal(plan.previousTag, 'desktop-v0.1.3');
  const ordinary = automation.planDesktopRelease({ ...base, releases: [...base.releases, { tag_name: 'desktop-v0.1.4', draft: false, prerelease: false }], tagSha: 'b'.repeat(40) });
  assert.equal(ordinary.build, false);
  assert.equal(ordinary.publish, false);
  assert.equal(automation.planDesktopRelease({ ...base, releases: [] }).previousTag, '');
});

test('manual runs preview by default; publishing checks version, repo, branch, lockfile and immutable tag', () => {
  const preview = automation.planDesktopRelease({ ...base, eventName: 'workflow_dispatch' });
  assert.equal(preview.build, true);
  assert.equal(preview.publish, false);
  assert.equal(automation.planDesktopRelease({ ...base, eventName: 'workflow_dispatch', publishRequested: true }).publish, true);
  assert.throws(() => automation.planDesktopRelease({ ...base, version: '0.1.2', lockVersion: '0.1.2', rootLockVersion: '0.1.2' }), /newer/);
  assert.throws(() => automation.planDesktopRelease({ ...base, lockVersion: '0.1.3' }), /versions must agree/);
  assert.throws(() => automation.planDesktopRelease({ ...base, rootLockVersion: '0.1.3' }), /versions must agree/);
  assert.throws(() => automation.planDesktopRelease({ ...base, repository: 'other/fork' }), /repository differs/);
  assert.throws(() => automation.planDesktopRelease({ ...base, refName: 'feature' }), /only allowed/);
  assert.throws(() => automation.planDesktopRelease({ ...base, tagSha: 'b'.repeat(40) }), /another commit/);
  assert.throws(() => automation.planDesktopRelease({ ...base, refType: 'tag', refName: 'desktop-v0.1.4', tagSha: 'b'.repeat(40) }), /exact build commit/);
  assert.equal(automation.planDesktopRelease({ ...base, refType: 'tag', refName: 'desktop-v0.1.4', tagSha: sourceSha }).publish, true);
  assert.throws(() => automation.planDesktopRelease({ ...base, refType: 'tag', refName: 'desktop-v0.1.5', tagSha: sourceSha }), /match package.json/);
  assert.equal(automation.compareVersions('0.10.0', '0.9.99'), 1);
  assert.throws(() => automation.compareVersions('0.1.4-beta.1', '0.1.3'), /stable/);
});

test('only matching drafts can be resumed; a newer published version can never be demoted', () => {
  const draft = { draft: true, prerelease: false, tag_name: 'desktop-v0.1.4' };
  const input = { release: draft, releases: base.releases, version: base.version, tag: draft.tag_name, sourceSha, tagSha: sourceSha };
  assert.doesNotThrow(() => automation.assertDraftPublication(input));
  assert.throws(() => automation.assertDraftPublication({ ...input, release: { ...draft, draft: false } }), /never overwritten/);
  assert.throws(() => automation.assertDraftPublication({ ...input, release: { ...draft, tag_name: 'desktop-v0.1.5' } }), /matching/);
  assert.throws(() => automation.assertDraftPublication({ ...input, tagSha: 'b'.repeat(40) }), /another source/);
  assert.throws(() => automation.assertDraftPublication({ ...input, releases: [...base.releases, { tag_name: 'desktop-v0.2.0', draft: false, prerelease: false }] }), /downgrade/);
});

test('publication requires every uploaded asset, size and server checksum to match assembled files', () => {
  const expected = [{ name: 'installer.exe', size: 100, sha256: '1'.repeat(64) }];
  const asset = { name: 'installer.exe', size: 100, digest: `sha256:${'1'.repeat(64)}`, state: 'uploaded' };
  assert.doesNotThrow(() => automation.verifyUploadedAssets([asset], expected));
  for (const altered of [{ ...asset, size: 99 }, { ...asset, digest: 'sha256:altered' }, { ...asset, state: 'new' }]) assert.throws(() => automation.verifyUploadedAssets([altered], expected), /checksum\/size/);
  assert.throws(() => automation.verifyUploadedAssets([], expected), /incomplete/);
  assert.throws(() => automation.verifyUploadedAssets([asset, { ...asset, name: 'stale.exe' }], expected), /stale/);
});

test('GitHub metadata paginates releases and resolves annotated tags; authorization failures stay failures', async () => {
  const github = new automation.GitHub('HuYellow/specflow', 'test-token');
  const calls: string[] = [];
  github.request = async (path: string) => {
    calls.push(path);
    if (path === 'releases?per_page=100&page=1') return Array.from({ length: 100 }, () => ({ draft: true }));
    if (path === 'releases?per_page=100&page=2') return base.releases;
    if (path.startsWith('git/ref/tags/')) return { object: { type: 'tag', sha: 'b'.repeat(40) } };
    if (path.startsWith('git/tags/')) return { object: { type: 'commit', sha: sourceSha } };
    throw new Error('Unexpected request');
  };
  assert.equal((await github.releases()).length, 101);
  assert.equal(await github.tagSha('desktop-v0.1.3'), sourceSha);
  assert.ok(calls.includes('releases?per_page=100&page=2'));
  github.request = async () => { throw new Error('GitHub failed (403)'); };
  await assert.rejects(github.releases(), /403/);
});
