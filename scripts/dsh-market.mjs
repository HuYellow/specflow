import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual, parseArgs } from 'node:util';

const root = resolve(import.meta.dirname, '..');
export const marketIndexUrl = 'https://raw.githubusercontent.com/HuYellow/specflow/main/market/dsh/index.json';
export const marketIndexPath = join(root, 'market', 'dsh', 'index.json');
export const repositoryUrl = 'https://github.com/HuYellow/specflow.git';
export const supportedDshVersion = '0.2.1-rc.2';

function assertCommit(commit) {
  if (!/^[0-9a-f]{40}$/.test(commit ?? '') || /^0{40}$/.test(commit)) {
    throw new Error('Provide the real distribution commit with --commit <lowercase 40-hex SHA>.');
  }
}

function packagePath(value) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !value || value.split('/').some(part => part === '.' || part === '..' || !/^[A-Za-z0-9._@+-]+$/.test(part))) {
    throw new Error('The package path must be a relative POSIX directory without . or .. segments.');
  }
  return value;
}

function publicationTimestamp(publishedAt) {
  if (typeof publishedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(publishedAt)) {
    throw new Error('Provide the release publication time with --published-at <ISO timestamp including timezone>.');
  }
  const timestamp = Date.parse(publishedAt);
  if (!Number.isFinite(timestamp) || timestamp < 0 || timestamp >= 1e14) throw new Error('The publication time is outside the market format range.');
  return Math.floor(timestamp / 1000);
}

export function createMarketIndex({ manifest, commit, publishedAt, path }) {
  assertCommit(commit);
  const directory = packagePath(path);
  if (manifest.name !== 'dsh-plugin-specflow' || !manifest.version || manifest.engines?.dsh !== supportedDshVersion || !manifest.dsh?.bundle?.patch) {
    throw new Error(`Expected the Specflow bundle manifest with exact DSH compatibility ${supportedDshVersion}.`);
  }
  return {
    format: 1,
    title: { en: 'Specflow plugins', zh: 'Specflow 插件市场' },
    description: {
      en: 'Official distribution index maintained by the Specflow project.',
      zh: '由 Specflow 项目维护的官方插件分发索引。',
    },
    metadata: {
      categories: { engineering: { title: { en: 'Software engineering', zh: '软件工程' } } },
    },
    plugins: [{
      name: manifest.name,
      title: { en: 'Specflow', zh: 'Specflow 工程流程工作台' },
      description: {
        en: 'Requirements, specifications, tasks, independent review and human acceptance in a DSH sidebar.',
        zh: '在 DSH 侧栏管理需求、规格、任务、独立复核与人工验收。',
      },
      author: typeof manifest.author === 'string' ? manifest.author : manifest.author?.name,
      homepage: 'https://github.com/HuYellow/specflow/tree/main/plugins/deepseek-specflow',
      repository: { url: 'https://github.com/HuYellow/specflow', directory: 'plugins/deepseek-specflow' },
      metadata: { category: 'engineering', keywords: manifest.keywords ?? [] },
      versions: [{
        version: manifest.version,
        publishTimestamp: publicationTimestamp(publishedAt),
        source: { type: 'git', url: repositoryUrl, commit, ...(directory ? { path: directory } : {}) },
        engines: { dsh: supportedDshVersion },
      }],
    }],
  };
}

export async function loadMarketValidator(runtimeDirectory = join(root, '.tools', 'dsh-validation')) {
  const require = createRequire(join(resolve(runtimeDirectory), 'package.json'));
  let manifestPath;
  try { manifestPath = require.resolve('@deepseek-ai/dsh-plugin-market-index/package.json'); }
  catch { throw new Error(`Install @deepseek-ai/dsh@${supportedDshVersion} in ${runtimeDirectory} before validating the market index.`); }
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.version !== supportedDshVersion) throw new Error(`The official market validator must be ${supportedDshVersion}, received ${manifest.version}.`);
  return import(pathToFileURL(require.resolve('@deepseek-ai/dsh-plugin-market-index')).href);
}

export function validateMarketIndex(value, manifest, validator, indexUrl = marketIndexUrl) {
  const parsed = validator.parseMarketIndex(value, indexUrl);
  if (parsed.plugins.length !== 1) throw new Error('The Specflow index must describe exactly one plugin.');
  const plugin = parsed.plugins[0];
  if (plugin.name !== manifest.name) throw new Error('The market package name differs from the plugin manifest.');
  const version = plugin.versions.find(entry => entry.version === manifest.version);
  if (!version || version.engines.dsh !== manifest.engines.dsh || version.engines.dsh !== supportedDshVersion) {
    throw new Error('The market version or exact DSH compatibility differs from the plugin manifest.');
  }
  if (version.source.type !== 'git' || version.source.url !== repositoryUrl) throw new Error('The install source must be the public Specflow Git repository.');
  assertCommit(version.source.commit);
  return { index: parsed, plugin, version, install: validator.marketInstallTarget(plugin.name, version) };
}

export async function verifyRemoteMarketIndex({ localIndex, manifest, validator, indexUrl = marketIndexUrl, fetchImpl = globalThis.fetch }) {
  validateMarketIndex(localIndex, manifest, validator, indexUrl);
  let response;
  try {
    response = await fetchImpl(indexUrl, {
      redirect: 'error',
      headers: { accept: 'application/json', 'cache-control': 'no-cache' },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (cause) {
    throw new Error(`Could not fetch the public market index without redirects: ${cause.message}`, { cause });
  }
  if (response.status !== 200) throw new Error(`The public market index returned HTTP ${response.status}; expected HTTP 200.`);
  const text = await response.text();
  if (Buffer.byteLength(text) > 2 * 1024 * 1024) throw new Error('The public market index exceeds 2 MiB.');
  let remote;
  try { remote = JSON.parse(text); }
  catch (cause) { throw new Error('The public market index is not valid JSON.', { cause }); }
  const result = validateMarketIndex(remote, manifest, validator, indexUrl);
  if (!isDeepStrictEqual(remote, localIndex)) throw new Error('The public market index differs from the local index; publication or cache propagation is incomplete.');
  return { ...result, status: response.status, indexUrl };
}

// Format validation cannot verify the package behind a Git SHA. Inspect the actual
// pinned tree as well, so publishing an index cannot accidentally point at a
// source-only checkout or a differently versioned bundle.
export function verifyDistributionSource(version, expectedManifest, directory = root) {
  const source = version.source;
  assertCommit(source.commit);
  const prefix = packagePath(source.path);
  function blob(path) {
    const clean = path.replace(/^\.\//, '');
    packagePath(clean);
    const relative = prefix ? `${prefix}/${clean}` : clean;
    try { return execFileSync('git', ['show', `${source.commit}:${relative}`], { cwd: directory, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 }); }
    catch { throw new Error(`The distribution commit does not contain ${relative}.`); }
  }
  const actual = JSON.parse(blob('package.json').toString('utf8'));
  if (actual.name !== expectedManifest.name || actual.version !== version.version || actual.engines?.dsh !== version.engines.dsh) {
    throw new Error('The package at the distribution commit has a different name, version or DSH compatibility.');
  }
  if (!actual.dsh?.bundle?.patch || !actual.main || typeof actual.exports?.['./client'] !== 'string') {
    throw new Error('The distribution package must declare the DSH bundle and both prebuilt entry points.');
  }
  blob(actual.dsh.bundle.patch);
  const info = JSON.parse(blob('dist/build-info.json').toString('utf8'));
  if (info.name !== actual.name || info.version !== actual.version || info.compatibility?.dsh !== version.engines.dsh) {
    throw new Error('The distribution build-info does not match the published package.');
  }
  for (const path of [actual.main, actual.exports['./client']]) {
    const bytes = blob(path);
    const record = info.artifacts?.[path.replace(/^\.\/dist\//, '')];
    if (!record || record.bytes !== bytes.length || record.sha256 !== createHash('sha256').update(bytes).digest('hex')) {
      throw new Error(`The distribution artifact ${path} differs from its build-info checksum.`);
    }
  }
  return actual;
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      commit: { type: 'string' }, 'published-at': { type: 'string' }, path: { type: 'string' },
      output: { type: 'string', default: marketIndexPath },
      'validator-dir': { type: 'string', default: join(root, '.tools', 'dsh-validation') },
    },
  });
  const command = positionals[0];
  if (!['generate', 'validate', 'verify-remote'].includes(command) || positionals.length !== 1) {
    throw new Error('Usage: node scripts/dsh-market.mjs generate --commit <SHA> --published-at <ISO> [--path <directory>] | validate | verify-remote [--output <index.json>]');
  }
  const manifest = JSON.parse(await readFile(join(root, 'plugins', 'deepseek-specflow', 'package.json'), 'utf8'));
  const validator = await loadMarketValidator(values['validator-dir']);
  const value = command === 'generate'
    ? createMarketIndex({ manifest, commit: values.commit, publishedAt: values['published-at'], path: values.path })
    : JSON.parse(await readFile(resolve(values.output), 'utf8'));
  const result = command === 'verify-remote'
    ? await verifyRemoteMarketIndex({ localIndex: value, manifest, validator })
    : validateMarketIndex(value, manifest, validator);
  if (command !== 'verify-remote') verifyDistributionSource(result.version, manifest);
  if (command === 'generate') {
    await mkdir(dirname(resolve(values.output)), { recursive: true });
    await writeFile(resolve(values.output), `${JSON.stringify(value, null, 2)}\n`);
  }
  console.log(`${command === 'generate' ? 'Generated and validated' : 'Validated'} ${resolve(values.output)} with the official DSH ${supportedDshVersion} validator.`);
  if (command === 'verify-remote') console.log(`HTTP ${result.status}: public index matches the local index.`);
  console.log(`Source commit: ${result.version.source.commit}`);
  console.log(`Install source: ${result.install.spec}`);
  console.log(`Public index: ${marketIndexUrl}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
