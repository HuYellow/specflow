import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse, stringify } from 'yaml';

const release = await import(pathToFileURL(resolve('scripts/desktop-release.mjs')).href);
const config = { schemaVersion: 1, provider: 'github', owner: 'HuYellow', repo: 'specflow', channel: 'latest', tagNamePrefix: 'desktop-v' };

test('desktop release source is explicit and tags cannot advertise a different package version or repository', () => {
  assert.deepEqual(release.desktopPublishConfiguration(config), { provider: 'github', owner: 'HuYellow', repo: 'specflow', channel: 'latest', tagNamePrefix: 'desktop-v', releaseType: 'release', publishAutoUpdate: true });
  assert.equal(release.verifyDesktopReleaseTag(config, '1.2.3', 'desktop-v1.2.3', 'HuYellow/specflow'), 'desktop-v1.2.3');
  assert.throws(() => release.verifyDesktopReleaseTag(config, '1.2.3', 'desktop-v1.2.4'), /match package.json/);
  assert.throws(() => release.verifyDesktopReleaseTag(config, '1.2.3', 'desktop-v1.2.3', 'someone/fork'), /repository differs/);
  assert.throws(() => release.verifyDesktopReleaseTag(config, '1.2.3-beta.1'), /stable/);
  for (const invalid of [{ ...config, owner: null }, { ...config, repo: null }, { ...config, token: 'do-not-embed' }, { ...config, channel: 'beta' }]) assert.throws(() => release.validateDesktopRelease(invalid), /release config/);
});

test('unsigned macOS packages expose manual updates; in-place updates require signing and notarization', () => {
  assert.equal(release.desktopReleaseCapabilities(config, 'win32', {}).automaticUpdates, true);
  assert.equal(release.desktopReleaseCapabilities(config, 'darwin', {}).automaticUpdates, false);
  assert.equal(release.desktopReleaseCapabilities(config, 'darwin', { CSC_LINK: 'certificate' }).automaticUpdates, false);
  const signed = { CSC_LINK: 'certificate', APPLE_ID: 'apple-id', APPLE_APP_SPECIFIC_PASSWORD: 'password', APPLE_TEAM_ID: 'team' };
  assert.equal(release.desktopReleaseCapabilities(config, 'darwin', signed).automaticUpdates, true);
  assert.equal(release.desktopReleaseCapabilities(config, 'darwin', { ...signed, CSC_LINK: '', CSC_NAME: '-' }).automaticUpdates, false);
  assert.equal(release.desktopReleaseCapabilities(config, 'darwin', { ...signed, CSC_IDENTITY_AUTO_DISCOVERY: 'false' }).automaticUpdates, false);
});

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'specflow-release-'));
  const input = join(directory, 'input'), output = join(directory, 'output');
  for (const [platform, arch, extensions] of [['win', 'x64', ['exe']], ['mac', 'x64', ['zip', 'dmg']], ['mac', 'arm64', ['zip', 'dmg']]] as const) {
    const target = join(input, `SpecFlow-${platform}-${arch}`);
    await mkdir(target, { recursive: true });
    const files = [];
    for (const extension of extensions) {
      const name = `SpecFlow-1.2.3-${platform}-${arch}.${extension}`;
      const payload = Buffer.from(`installer-${name}`);
      await writeFile(join(target, name), payload);
      await writeFile(join(target, `${name}.blockmap`), 'blockmap');
      files.push({ url: name, sha512: createHash('sha512').update(payload).digest('base64'), size: payload.length });
    }
    await writeFile(join(target, platform === 'win' ? 'latest.yml' : 'latest-mac.yml'), stringify({ version: '1.2.3', files, path: files[0].url, sha512: files[0].sha512, releaseDate: '2026-10-15T00:00:00.000Z' }));
    await writeFile(join(target, `desktop-smoke-${platform === 'win' ? 'win32' : 'darwin'}-${arch}.json`), JSON.stringify({ passed: true, packaged: true, platform: platform === 'win' ? 'win32' : 'darwin', arch }));
  }
  return { directory, input, output, version: '1.2.3', config, tag: 'desktop-v1.2.3', repository: 'HuYellow/specflow' };
}

test('release assembly keeps both macOS architectures and checksums while preserving legacy x64 fields', async () => {
  const data = await fixture();
  try {
    const result = await release.assembleDesktopRelease(data);
    const info = parse(await readFile(join(data.output, 'latest-mac.yml'), 'utf8'));
    assert.equal(info.files.length, 4);
    assert.equal(info.path, 'SpecFlow-1.2.3-mac-x64.zip');
    assert.ok(info.files.some((file: { url: string }) => file.url === 'SpecFlow-1.2.3-mac-arm64.zip'));
    assert.ok(result.assets.includes('SHA256SUMS.txt'));
    assert.equal((await readFile(join(data.output, 'SHA256SUMS.txt'), 'utf8')).trim().split('\n').length, result.assets.length - 1);
    await assert.rejects(release.assembleDesktopRelease(data), /output must be empty/);
  } finally { await rm(data.directory, { recursive: true, force: true }); }
});

test('release assembly rejects altered installers, failed package smoke tests and missing architecture assets', async () => {
  const data = await fixture();
  try {
    const path = join(data.input, 'SpecFlow-mac-arm64/SpecFlow-1.2.3-mac-arm64.zip');
    const payload = await readFile(path);
    await writeFile(path, 'altered installer');
    await assert.rejects(release.assembleDesktopRelease(data), /checksum\/size/);
    await writeFile(path, payload);
    const smoke = join(data.input, 'SpecFlow-win-x64/desktop-smoke-win32-x64.json');
    await writeFile(smoke, JSON.stringify({ passed: false, packaged: true, platform: 'win32', arch: 'x64' }));
    await assert.rejects(release.assembleDesktopRelease(data), /smoke test did not pass/);
    await writeFile(smoke, JSON.stringify({ passed: true, packaged: true, platform: 'win32', arch: 'x64' }));
    const blockmap = `${path}.blockmap`;
    await rm(blockmap);
    await assert.rejects(release.assembleDesktopRelease(data), /blockmap is missing/);
    await writeFile(blockmap, 'blockmap');
    await rm(path);
    await assert.rejects(release.assembleDesktopRelease(data), /Missing release installer/);
  } finally { await rm(data.directory, { recursive: true, force: true }); }
});
