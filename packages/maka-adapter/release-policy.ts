import release from '../../config/maka-release.json' with { type: 'json' };
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const MAKA_RELEASE = Object.freeze(release);
export const MAKA_VERSION: string = release.packageVersion || 'release-unavailable';
export const MAKA_RELEASE_AVAILABLE = release.status === 'approved' && typeof release.packageVersion === 'string';
export function assertMakaReleaseVersion(version: string, approvedVersion: string | null = release.packageVersion) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`禁止使用 Maka 开发或预发布版本：${version}；内置运行时只接受正式 release`);
  if (!approvedVersion) throw new Error(release.reason);
  if (version !== approvedVersion) throw new Error(`Maka 版本不匹配：需要正式 release ${approvedVersion}，当前 ${version}`);
}
export async function verifyMakaRelease(packageRoot: string) {
  const pkg = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
  assertMakaReleaseVersion(pkg.version);
  if (!MAKA_RELEASE_AVAILABLE || !release.releaseUrl) throw new Error(release.reason);
  if (release.distribution === 'source') {
    if (!release.allowSourceBuild || !/^[a-f0-9]{128}$/.test(release.source.sha512)) throw new Error('Maka 正式源码批准信息不完整');
  } else if (!release.integrity || !release.tarballUrl) throw new Error('Maka 正式 npm 批准信息不完整');
  const provenance = JSON.parse(await readFile(join(packageRoot, 'specflow-release.json'), 'utf8'));
  for (const key of ['schemaVersion', 'packageName', 'packageVersion', 'channel', 'distribution', 'registry', 'integrity', 'tarballUrl', 'releaseUrl'] as const) {
    if (provenance[key] !== MAKA_RELEASE[key]) throw new Error(`Maka 正式发布来源校验失败：${key}`);
  }
  if (release.distribution === 'source') {
    for (const key of ['releaseVersion', 'url', 'sha512', 'signerFingerprint', 'keysUrl', 'npmVersion'] as const) if (provenance.source?.[key] !== release.source[key]) throw new Error(`Maka 正式源码来源校验失败：${key}`);
    if (provenance.build?.kind !== 'runtime-host-production-closure' || provenance.build?.signatureVerified !== true) throw new Error('Maka 源码构建验证记录不完整');
  }
  return { version: pkg.version, provenance };
}
