import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { loadDesktopRelease, verifyDesktopReleaseTag } from './desktop-release.mjs';
import { renderDesktopChangelog } from './desktop-changelog.mjs';

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, '..');
const stable = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const commitId = /^[a-f0-9]{40}$/;

export function compareVersions(left, right) {
  if (!stable.test(left) || !stable.test(right)) throw new Error('Desktop automation requires stable numeric versions.');
  const a = left.split('.').map(BigInt), b = right.split('.').map(BigInt);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  return 0;
}

export function publishedDesktopReleases(releases, prefix = 'desktop-v') {
  return releases.filter(item => !item.draft && !item.prerelease && typeof item.tag_name === 'string' && item.tag_name.startsWith(prefix) && stable.test(item.tag_name.slice(prefix.length)))
    .sort((a, b) => compareVersions(b.tag_name.slice(prefix.length), a.tag_name.slice(prefix.length)));
}

export function planDesktopRelease({ config, version, lockVersion, rootLockVersion, repository, sourceSha, eventName, refType, refName, publishRequested = false, releases, tagSha }) {
  const tag = verifyDesktopReleaseTag(config, version, refType === 'tag' ? refName : undefined, repository);
  compareVersions(version, version);
  if (lockVersion !== version || rootLockVersion !== version) throw new Error('package.json and package-lock.json versions must agree before building.');
  if (!commitId.test(sourceSha)) throw new Error('Build source must be a full Git commit SHA.');
  const publish = eventName === 'push' || publishRequested;
  if (publish && !((refType === 'branch' && refName === 'main') || (refType === 'tag' && refName === tag))) throw new Error('Publishing is only allowed from main or the matching desktop version tag.');
  const published = publishedDesktopReleases(releases, config.tagNamePrefix);
  const previous = published.find(item => compareVersions(item.tag_name.slice(config.tagNamePrefix.length), version) < 0);
  const result = { build: true, publish, tag, version, sourceSha, previousTag: previous?.tag_name || '' };
  if (!publish) return { ...result, reason: 'Build preview requested; no GitHub Release will be changed.' };
  if (refType === 'tag' && tagSha !== sourceSha) throw new Error('The release tag must resolve to the exact build commit.');
  if (published.some(item => item.tag_name === tag)) return { ...result, build: false, publish: false, reason: `${tag} is already published; ordinary commits only run CI.` };
  if (published[0] && compareVersions(version, published[0].tag_name.slice(config.tagNamePrefix.length)) <= 0) throw new Error('A new release must be newer than every published desktop version.');
  if (tagSha && tagSha !== sourceSha) throw new Error('The existing release tag points to another commit. Increment the version; tags are never moved.');
  return { ...result, reason: `Build and publish ${tag} from ${sourceSha}.` };
}

export class GitHub {
  constructor(repository, token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN) {
    if (!token) throw new Error('A GitHub token is required for release metadata access.');
    this.repository = repository;
    this.token = token;
  }
  async request(path, { method = 'GET', body, missing = false } = {}) {
    const response = await fetch(`https://api.github.com/repos/${this.repository}/${path}`, {
      method, headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${this.token}`, 'X-GitHub-Api-Version': '2022-11-28', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(60000),
    });
    if (missing && response.status === 404) return null;
    if (!response.ok) throw new Error(`GitHub ${method} ${path} failed (${response.status}): ${(await response.json()).message || response.statusText}`);
    return response.status === 204 ? null : response.json();
  }
  async releases() {
    const results = [];
    for (let page = 1; ; page++) {
      const batch = await this.request(`releases?per_page=100&page=${page}`);
      results.push(...batch);
      if (batch.length < 100) return results;
    }
  }
  async tagSha(tag) {
    let object = (await this.request(`git/ref/tags/${encodeURIComponent(tag)}`, { missing: true }))?.object;
    for (let depth = 0; object?.type === 'tag' && depth < 8; depth++) object = (await this.request(`git/tags/${object.sha}`)).object;
    if (!object) return undefined;
    if (object.type !== 'commit' || !commitId.test(object.sha)) throw new Error('Release tag does not resolve to a Git commit.');
    return object.sha;
  }
}

export function assertDraftPublication({ release, releases, version, tag, sourceSha, tagSha }) {
  if (release && (!release.draft || release.prerelease || release.tag_name !== tag)) throw new Error('Only a matching stable draft may be uploaded. Published releases are never overwritten.');
  if (tagSha && tagSha !== sourceSha) throw new Error('Release tag changed or points to another source commit.');
  const latest = publishedDesktopReleases(releases)[0];
  if (latest && compareVersions(version, latest.tag_name.slice('desktop-v'.length)) <= 0) throw new Error('Publishing would overwrite or downgrade a released version.');
}

export function verifyUploadedAssets(assets, expected) {
  if (assets.length !== expected.length) throw new Error('Uploaded release assets are incomplete or contain stale files.');
  for (const item of expected) {
    const uploaded = assets.find(asset => asset.name === item.name);
    if (!uploaded || uploaded.state !== 'uploaded' || uploaded.size !== item.size || uploaded.digest !== `sha256:${item.sha256}`) throw new Error(`Uploaded release checksum/size differs: ${item.name}`);
  }
}

async function context() {
  const config = await loadDesktopRelease(root);
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'));
  const sourceSha = (await exec('git', ['rev-parse', 'HEAD'], { cwd: root, windowsHide: true })).stdout.trim();
  const repository = process.env.GITHUB_REPOSITORY || `${config.owner}/${config.repo}`;
  verifyDesktopReleaseTag(config, pkg.version, process.env.DESKTOP_RELEASE_TAG, repository);
  return { config, version: pkg.version, lockVersion: lock.version, rootLockVersion: lock.packages?.['']?.version, repository, sourceSha };
}

async function notes(ctx, previousTag, output) {
  if (previousTag && !/^desktop-v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/.test(previousTag)) throw new Error('Invalid release notes baseline tag.');
  const range = previousTag ? `${previousTag}..${ctx.sourceSha}` : ctx.sourceSha;
  const log = (await exec('git', ['log', '--no-merges', '--format=%H%x00%B%x1e', range, '--'], { cwd: root, windowsHide: true, maxBuffer: 16 * 1024 * 1024 })).stdout;
  const commits = log.split('\x1e').filter(record => record.trim()).map(record => {
    const [sha, message] = record.trim().split('\0');
    const [subject, ...body] = message.split(/\r?\n/);
    return { sha, subject, body: body.join('\n') };
  });
  const tag = verifyDesktopReleaseTag(ctx.config, ctx.version);
  const capabilities = {};
  // All three native jobs report the actual build capabilities, not CI secrets.
  for (const [target, key] of [['win-x64', 'win'], ['mac-x64', 'macX64'], ['mac-arm64', 'macArm64']]) {
    const record = JSON.parse(await readFile(join(root, '.tools/desktop-artifacts', `SpecFlow-${target}`, 'desktop-build.json'), 'utf8'));
    if (record.sourceSha !== ctx.sourceSha || record.version !== ctx.version || record.platform !== (key === 'win' ? 'win32' : 'darwin') || record.arch !== target.split('-')[1] || typeof record.signed !== 'boolean' || typeof record.notarized !== 'boolean') throw new Error(`Release build provenance differs: ${target}`);
    capabilities[key] = record;
  }
  capabilities.winSigned = capabilities.win.signed;
  capabilities.macSigned = capabilities.macX64.signed && capabilities.macArm64.signed;
  capabilities.macNotarized = capabilities.macX64.notarized && capabilities.macArm64.notarized;
  const body = renderDesktopChangelog({ version: ctx.version, tag, repository: ctx.repository, sourceSha: ctx.sourceSha, previousTag, commits, capabilities });
  await mkdir(resolve(output, '..'), { recursive: true });
  await writeFile(output, body);
  return body;
}

async function publish(ctx) {
  if (process.env.DESKTOP_SOURCE_SHA !== ctx.sourceSha) throw new Error('Publish checkout differs from the prepared source SHA.');
  const tag = verifyDesktopReleaseTag(ctx.config, ctx.version, process.env.DESKTOP_RELEASE_TAG, ctx.repository);
  if (ctx.lockVersion !== ctx.version || ctx.rootLockVersion !== ctx.version) throw new Error('Package and lockfile versions differ.');
  const github = new GitHub(ctx.repository);
  let draft = await github.request(`releases/tags/${encodeURIComponent(tag)}`, { missing: true });
  const guard = async () => assertDraftPublication({ release: draft, releases: await github.releases(), version: ctx.version, tag, sourceSha: ctx.sourceSha, tagSha: await github.tagSha(tag) });
  await guard();
  const output = join(root, 'release/publish');
  const names = (await readdir(output)).sort();
  const checksums = new Map((await readFile(join(output, 'SHA256SUMS.txt'), 'utf8')).trim().split('\n').map(line => [line.slice(66), line.slice(0, 64)]));
  if (checksums.size !== names.length - 1) throw new Error('Release checksum manifest is incomplete.');
  const expected = [];
  for (const name of names) {
    const bytes = await readFile(join(output, name));
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    if (name !== 'SHA256SUMS.txt' && checksums.get(name) !== sha256) throw new Error(`Release asset changed after assembly: ${name}`);
    expected.push({ name, size: bytes.length, sha256 });
  }
  const body = await notes(ctx, process.env.DESKTOP_PREVIOUS_TAG || '', join(root, '.tools/desktop-release-notes.md'));
  if (!await github.tagSha(tag)) await github.request('git/refs', { method: 'POST', body: { ref: `refs/tags/${tag}`, sha: ctx.sourceSha } });
  await guard();
  if (!draft) draft = await github.request('releases', { method: 'POST', body: { tag_name: tag, target_commitish: ctx.sourceSha, name: `SpecFlow ${ctx.version}`, body, draft: true, prerelease: false } });
  else await github.request(`releases/${draft.id}`, { method: 'PATCH', body: { name: `SpecFlow ${ctx.version}`, body } });
  // Stale partial uploads may only be replaced while the release is still a draft.
  draft = await github.request(`releases/${draft.id}`);
  await guard();
  for (const asset of draft.assets) if (!names.includes(asset.name)) await github.request(`releases/assets/${asset.id}`, { method: 'DELETE' });
  await exec('gh', ['release', 'upload', tag, ...names.map(name => join(output, name)), '--repo', ctx.repository, '--clobber'], { cwd: root, windowsHide: true, maxBuffer: 4 * 1024 * 1024 });
  draft = await github.request(`releases/${draft.id}`);
  await guard();
  verifyUploadedAssets(draft.assets, expected);
  const released = await github.request(`releases/${draft.id}`, { method: 'PATCH', body: { draft: false, make_latest: 'true' } });
  verifyUploadedAssets(released.assets, expected);
  if (released.draft || (await github.request('releases/latest')).tag_name !== tag) throw new Error('Published release is not the expected Latest release.');
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `Published [SpecFlow ${ctx.version}](${released.html_url}) with ${expected.length} verified assets.\n\n${body}`);
  console.log(`Published ${released.html_url}; uploaded SHA-256 checksums verified.`);
}

async function recordBuild(ctx) {
  const record = { version: ctx.version, sourceSha: ctx.sourceSha, platform: process.platform, arch: process.arch, signed: false, notarized: false };
  if (process.platform === 'win32') {
    const installer = join(root, 'release', `SpecFlow-${ctx.version}-win-${process.arch}.exe`);
    const status = await exec('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '$signature = Get-AuthenticodeSignature -LiteralPath $env:SPECFLOW_INSTALLER; $signature.Status.ToString()'], { windowsHide: true, env: { ...process.env, SPECFLOW_INSTALLER: installer } });
    record.signed = status.stdout.trim() === 'Valid';
  } else if (process.platform === 'darwin') {
    const application = join(root, `release/${process.arch === 'arm64' ? 'mac-arm64' : 'mac'}/SpecFlow.app`);
    const signature = await exec('codesign', ['-dv', '--verbose=4', application]).catch(() => ({ stderr: '' }));
    record.signed = signature.stderr.includes('Authority=Developer ID Application:');
    if (record.signed) {
      await exec('codesign', ['--verify', '--deep', '--strict', application]);
      record.notarized = await exec('xcrun', ['stapler', 'validate', application]).then(() => true, () => false);
    }
  } else throw new Error('Build provenance requires a native Windows or macOS runner.');
  await writeFile(join(root, 'release/desktop-build.json'), `${JSON.stringify(record, null, 2)}\n`);
  console.log(JSON.stringify(record, null, 2));
}

async function main() {
  const ctx = await context();
  if (process.argv[2] === 'plan') {
    const github = new GitHub(ctx.repository);
    const plan = planDesktopRelease({ ...ctx, eventName: process.env.GITHUB_EVENT_NAME || 'workflow_dispatch', refType: process.env.GITHUB_REF_TYPE || 'branch', refName: process.env.GITHUB_REF_NAME || 'main', publishRequested: process.env.INPUT_PUBLISH === 'true', releases: await github.releases(), tagSha: await github.tagSha(verifyDesktopReleaseTag(ctx.config, ctx.version)) });
    if (process.env.GITHUB_SHA && process.env.GITHUB_SHA !== ctx.sourceSha) throw new Error('Prepared checkout differs from the triggering commit.');
    if (process.env.GITHUB_OUTPUT) for (const [key, value] of Object.entries(plan)) await appendFile(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${plan.reason}\n`);
    console.log(JSON.stringify(plan, null, 2));
  } else if (process.argv[2] === 'publish') await publish(ctx);
  else if (process.argv[2] === 'record') await recordBuild(ctx);
  else throw new Error('Use desktop-ci.mjs plan, record or publish.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
