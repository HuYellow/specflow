import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createMarketIndex, loadMarketValidator, marketIndexUrl, validateMarketIndex, verifyDistributionSource, verifyRemoteMarketIndex } from './dsh-market.mjs';

const manifest = JSON.parse(await readFile(resolve('plugins/deepseek-specflow/package.json'), 'utf8'));
const validator = await loadMarketValidator();
const commit = '1234567890abcdef1234567890abcdef12345678';
const publishedAt = '2026-10-21T12:00:00+08:00';

test('official DSH reader accepts the bilingual index and derives the exact Git subdirectory install target', () => {
  const value = createMarketIndex({ manifest, commit, publishedAt, path: 'plugins/deepseek-specflow' });
  const result = validateMarketIndex(value, manifest, validator);
  assert.equal(result.index.format, 1);
  assert.equal(result.plugin.title.en, 'Specflow');
  assert.equal(result.plugin.title.zh, 'Specflow 工程流程工作台');
  assert.equal(result.version.publishTimestamp, Date.parse(publishedAt) / 1000);
  assert.equal(result.version.engines.dsh, '0.2.1-rc.2');
  assert.equal(result.install.spec, `git+https://github.com/HuYellow/specflow.git#${commit}&path:/plugins/deepseek-specflow`);
  const root = validateMarketIndex(createMarketIndex({ manifest, commit, publishedAt }), manifest, validator);
  assert.equal(root.install.spec, `git+https://github.com/HuYellow/specflow.git#${commit}`);
  assert.equal(validator.parseMarketIndex(value, marketIndexUrl).plugins[0].repository.directory, 'plugins/deepseek-specflow');
});

test('generation requires an explicit SHA and zoned publication time, and validation rejects incompatible identity', () => {
  for (const sha of [undefined, 'main', '1234567', '0'.repeat(40), commit.toUpperCase()]) {
    assert.throws(() => createMarketIndex({ manifest, commit: sha, publishedAt }), /real distribution commit/);
  }
  for (const time of [undefined, '2026-10-21', '2026-10-21T12:00:00', 'not-a-date']) {
    assert.throws(() => createMarketIndex({ manifest, commit, publishedAt: time }), /publication time/);
  }
  assert.throws(() => createMarketIndex({ manifest, commit, publishedAt, path: '../plugin' }), /relative POSIX/);
  const wrongVersion = structuredClone(createMarketIndex({ manifest, commit, publishedAt }));
  wrongVersion.plugins[0].versions[0].engines.dsh = '>=0.2.1-rc.2';
  assert.throws(() => validateMarketIndex(wrongVersion, manifest, validator), /exact DSH compatibility/);
  const invalid = structuredClone(wrongVersion);
  invalid.plugins[0].versions[0].source.commit = 'main';
  assert.throws(() => validator.parseMarketIndex(invalid, marketIndexUrl), /40-hex-digit/);
});

test('the pinned Git tree must contain matching prebuilt artifacts, not only a valid index declaration', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'specflow-dsh-market-'));
  const packageDirectory = join(directory, 'plugins', 'deepseek-specflow');
  const git = (...args) => execFileSync('git', args, { cwd: directory, windowsHide: true, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const buildInfo = { name: manifest.name, version: manifest.version, compatibility: { dsh: manifest.engines.dsh }, artifacts: {} };
  try {
    await mkdir(join(packageDirectory, 'dist'), { recursive: true });
    await writeFile(join(packageDirectory, 'package.json'), JSON.stringify(manifest));
    await writeFile(join(packageDirectory, 'cordis.patch.yml'), 'plugins: {}\n');
    for (const name of ['index.mjs', 'client.js']) {
      // The actual host bundle exceeds execFileSync's default 1 MiB buffer.
      const bytes = name === 'index.mjs' ? Buffer.alloc(1_600_000, 'x') : Buffer.from(`prebuilt ${name}`);
      await writeFile(join(packageDirectory, 'dist', name), bytes);
      buildInfo.artifacts[name] = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
    }
    await writeFile(join(packageDirectory, 'dist', 'build-info.json'), JSON.stringify(buildInfo));
    git('init', '--quiet');
    git('add', '.');
    git('-c', 'user.name=Specflow Test', '-c', 'user.email=test@example.invalid', 'commit', '--quiet', '-m', 'prebuilt plugin');
    const first = git('rev-parse', 'HEAD');
    const value = createMarketIndex({ manifest, commit: first, publishedAt, path: 'plugins/deepseek-specflow' });
    const { version } = validateMarketIndex(value, manifest, validator);
    assert.equal(verifyDistributionSource(version, manifest, directory).version, manifest.version);
    await writeFile(join(packageDirectory, 'dist', 'client.js'), 'changed without rebuild');
    git('add', '.');
    git('-c', 'user.name=Specflow Test', '-c', 'user.email=test@example.invalid', 'commit', '--quiet', '-m', 'stale checksum');
    assert.throws(() => verifyDistributionSource({ ...version, source: { ...version.source, commit: git('rev-parse', 'HEAD') } }, manifest, directory), /build-info checksum/);
    assert.throws(() => verifyDistributionSource({ ...version, source: { ...version.source, path: undefined } }, manifest, directory), /does not contain package.json/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('remote verification accepts the published document and rejects redirects, HTTP failures and stale content', async () => {
  const localIndex = createMarketIndex({ manifest, commit, publishedAt, path: 'plugins/deepseek-specflow' });
  let remote = structuredClone(localIndex);
  const server = createServer((request, response) => {
    if (request.url === '/redirect') {
      response.writeHead(302, { location: '/index.json' }).end();
    } else if (request.url === '/missing') {
      response.writeHead(404).end('not published');
    } else {
      response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(remote));
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const verify = path => verifyRemoteMarketIndex({ localIndex, manifest, validator, indexUrl: `${origin}${path}` });
  try {
    const result = await verify('/index.json');
    assert.equal(result.status, 200);
    assert.equal(result.version.source.commit, commit);
    assert.equal(result.install.spec, `git+https://github.com/HuYellow/specflow.git#${commit}&path:/plugins/deepseek-specflow`);
    await assert.rejects(verify('/redirect'), /without redirects/);
    await assert.rejects(verify('/missing'), /HTTP 404/);
    remote.plugins[0].versions[0].source.commit = 'abcdef1234567890abcdef1234567890abcdef12';
    await assert.rejects(verify('/index.json'), /differs from the local index/);
    remote = structuredClone(localIndex);
    remote.format = 2;
    await assert.rejects(verify('/index.json'), /format.*must be 1/);
  } finally {
    server.closeAllConnections();
    await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
  }
});
