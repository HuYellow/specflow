import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse, stringify } from 'yaml';

const root = resolve(import.meta.dirname, '..');
const stableVersion = /^\d+\.\d+\.\d+$/;
const expectedTargets = [
  { directory: 'SpecFlow-win-x64', platform: 'win', arch: 'x64', extensions: ['exe'], manifest: 'latest.yml' },
  { directory: 'SpecFlow-mac-x64', platform: 'mac', arch: 'x64', extensions: ['zip', 'dmg'], manifest: 'latest-mac.yml' },
  { directory: 'SpecFlow-mac-arm64', platform: 'mac', arch: 'arm64', extensions: ['zip', 'dmg'], manifest: 'latest-mac.yml' },
];

export function validateDesktopRelease(config) {
  const allowedKeys = ['schemaVersion', 'provider', 'owner', 'repo', 'channel', 'tagNamePrefix'];
  if (!config || Object.keys(config).some(key => !allowedKeys.includes(key)) || config.schemaVersion !== 1 || config.provider !== 'github' || config.channel !== 'latest' || config.tagNamePrefix !== 'desktop-v' || typeof config.owner !== 'string' || !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(config.owner) || typeof config.repo !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(config.repo)) {
    throw new Error('Desktop release config must declare an explicit public GitHub owner/repo, latest channel and desktop-v tag prefix; credentials do not belong in this file.');
  }
  return config;
}

export async function loadDesktopRelease(projectRoot = root) {
  return validateDesktopRelease(JSON.parse(await readFile(join(projectRoot, 'config/desktop-release.json'), 'utf8')));
}

export function desktopPublishConfiguration(config) {
  const { provider, owner, repo, channel, tagNamePrefix } = validateDesktopRelease(config);
  return { provider, owner, repo, channel, tagNamePrefix, releaseType: 'release', publishAutoUpdate: true };
}

export function desktopReleaseCapabilities(config, platform, env = process.env) {
  validateDesktopRelease(config);
  const macSigning = Boolean(env.CSC_LINK || (env.CSC_NAME && env.CSC_NAME !== '-')) && env.CSC_IDENTITY_AUTO_DISCOVERY !== 'false';
  const notarization = Boolean(
    (env.APPLE_ID && env.APPLE_APP_SPECIFIC_PASSWORD && env.APPLE_TEAM_ID) ||
    (env.APPLE_API_KEY && env.APPLE_API_KEY_ID && env.APPLE_API_ISSUER) ||
    (env.APPLE_KEYCHAIN && env.APPLE_KEYCHAIN_PROFILE)
  );
  return { ...config, automaticUpdates: platform === 'win32' || (platform === 'darwin' && macSigning && notarization) };
}

export function verifyDesktopReleaseTag(config, version, tag, repository) {
  validateDesktopRelease(config);
  if (!stableVersion.test(version)) throw new Error(`Desktop releases require a stable package version, got ${version}.`);
  const expectedTag = `${config.tagNamePrefix}${version}`;
  if (tag && tag !== expectedTag) throw new Error(`Release tag must match package.json exactly: ${expectedTag}.`);
  if (repository && repository.toLowerCase() !== `${config.owner}/${config.repo}`.toLowerCase()) throw new Error('The release repository differs from config/desktop-release.json.');
  return expectedTag;
}

const sha512 = payload => createHash('sha512').update(payload).digest('base64');
const artifactName = (version, target, extension) => `SpecFlow-${version}-${target.platform}-${target.arch}.${extension}`;

export async function assembleDesktopRelease({ input, output, version, config, tag, repository }) {
  const releaseTag = verifyDesktopReleaseTag(config, version, tag, repository);
  if (resolve(input) === resolve(output)) throw new Error('Release assembly needs separate input and output directories.');
  const assets = new Map();
  const manifests = new Map();
  for (const target of expectedTargets) {
    const directory = join(input, target.directory);
    const entries = await readdir(directory);
    const expected = target.extensions.map(extension => artifactName(version, target, extension));
    for (const name of expected) {
      if (!entries.includes(name)) throw new Error(`Missing release installer: ${target.directory}/${name}`);
      assets.set(name, join(directory, name));
    }
    // Blockmaps are update assets, never the extracted applications or test data.
    for (const name of entries.filter(name => expected.some(asset => name === `${asset}.blockmap`))) assets.set(name, join(directory, name));
    for (const name of expected) if (!assets.has(`${name}.blockmap`)) throw new Error(`Differential update blockmap is missing: ${name}.blockmap`);
    const info = parse(await readFile(join(directory, target.manifest), 'utf8'));
    if (info?.version !== version || !Array.isArray(info.files) || info.files.length !== expected.length) throw new Error(`Invalid release update metadata: ${target.directory}/${target.manifest}`);
    const seen = new Set();
    for (const file of info.files) {
      if (typeof file.url !== 'string' || file.url !== basename(file.url) || !expected.includes(file.url) || seen.has(file.url)) throw new Error(`Unexpected update artifact: ${file.url}`);
      seen.add(file.url);
      const payload = await readFile(join(directory, file.url));
      if (file.sha512 !== sha512(payload) || (file.size != null && file.size !== payload.length)) throw new Error(`Update checksum/size does not match installer: ${file.url}`);
    }
    if (!expected.includes(info.path) || info.sha512 !== info.files.find(file => file.url === info.path)?.sha512) throw new Error(`Legacy update metadata does not match files: ${target.manifest}`);
    const smoke = JSON.parse(await readFile(join(directory, `desktop-smoke-${target.platform === 'win' ? 'win32' : 'darwin'}-${target.arch}.json`), 'utf8'));
    if (smoke.passed !== true || smoke.packaged !== true || smoke.arch !== target.arch || smoke.platform !== (target.platform === 'win' ? 'win32' : 'darwin')) throw new Error(`Packaged smoke test did not pass: ${target.directory}`);
    const existing = manifests.get(target.manifest);
    if (existing) existing.files.push(...info.files);
    else manifests.set(target.manifest, { ...info, files: [...info.files] });
  }
  await mkdir(output, { recursive: true });
  if ((await readdir(output)).length) throw new Error('Release assembly output must be empty to avoid publishing stale assets.');
  for (const [name, path] of assets) await cp(path, join(output, name));
  for (const [name, info] of manifests) {
    // Keep x64 zip first for old clients; modern MacUpdater selects arm64 from files[].
    info.files.sort((a, b) => Number(!a.url.endsWith('.zip')) - Number(!b.url.endsWith('.zip')) || Number(a.url.includes('-arm64.')) - Number(b.url.includes('-arm64.')) || a.url.localeCompare(b.url));
    info.path = info.files[0].url;
    info.sha512 = info.files[0].sha512;
    await writeFile(join(output, name), stringify(info));
  }
  const names = (await readdir(output)).sort();
  const checksums = await Promise.all(names.map(async name => `${createHash('sha256').update(await readFile(join(output, name))).digest('hex')}  ${name}`));
  await writeFile(join(output, 'SHA256SUMS.txt'), `${checksums.join('\n')}\n`);
  return { tag: releaseTag, version, assets: [...names, 'SHA256SUMS.txt'] };
}

async function main() {
  const config = await loadDesktopRelease();
  const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const tag = process.env.GITHUB_REF_TYPE === 'tag' ? process.env.GITHUB_REF_NAME : undefined;
  const repository = tag ? process.env.GITHUB_REPOSITORY : undefined;
  const command = process.argv[2] || 'verify';
  if (command === 'verify') {
    const expectedTag = verifyDesktopReleaseTag(config, version, tag, repository);
    console.log(`Desktop release source: ${config.owner}/${config.repo}; version ${version}; tag ${expectedTag}. No release was published.`);
  } else if (command === 'assemble') {
    const result = await assembleDesktopRelease({ input: resolve(root, process.argv[3] || '.tools/desktop-artifacts'), output: resolve(root, process.argv[4] || 'release/publish'), version, config, tag, repository });
    console.log(JSON.stringify(result, null, 2));
  } else throw new Error(`Unknown desktop release command: ${command}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error(error); process.exitCode = 1; });
