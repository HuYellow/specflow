import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, realpath, symlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { assertMakaReleaseVersion, verifyMakaRelease, MAKA_RELEASE } from '../packages/maka-adapter/release-policy.ts';

test('源码目录别名和内部依赖链接可解析，外部依赖链接仍被拒绝', async () => {
  const { runtimeClosure } = await import(pathToFileURL(resolve('scripts/maka-source.mjs')).href);
  const root = await mkdtemp(join(tmpdir(), 'specflow-maka-closure-alias-'));
  const source = join(root, 'source'), alias = join(root, 'source-alias');
  const entry = join(source, 'node_modules/@maka/runtime-host');
  const internal = join(source, 'packages/dependency'), external = join(root, 'outside');
  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  try {
    for (const [path, pkg] of [
      [entry, { name: '@maka/runtime-host', version: '0.1.0', dependencies: { dependency: '1' } }],
      [internal, { name: 'dependency', version: '1.0.0' }],
      [external, { name: 'escaped', version: '1.0.0' }],
    ] as const) { await mkdir(path, { recursive: true }); await writeFile(join(path, 'package.json'), JSON.stringify(pkg)); }
    await symlink(source, alias, linkType);
    await symlink(internal, join(source, 'node_modules/dependency'), linkType);
    const closure = await runtimeClosure(alias, '@maka/runtime-host');
    assert.deepEqual(closure.map((e: any) => e.pkg.name), ['@maka/runtime-host', 'dependency']);
    assert.equal(closure[0].path, await realpath(entry));
    assert.equal(closure[0].dependencies[0].path, await realpath(internal));

    await symlink(external, join(source, 'node_modules/escaped'), linkType);
    await writeFile(join(entry, 'package.json'), JSON.stringify({ name: '@maka/runtime-host', version: '0.1.0', dependencies: { escaped: '1' } }));
    await assert.rejects(runtimeClosure(alias, '@maka/runtime-host'), /Maka dependency escapes source tree: escaped/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('Maka 发布策略拒绝 dev、nightly、alpha、beta、RC 与占位版本', () => {
  for (const version of ['0.2.0-dev.78.20261010', '0.2.0-nightly.1', '0.0.0-alpha.0', '0.1.0-beta.1', '0.2.0-rc.1', '0.0.0-placeholder.2', 'latest', '^0.2.0']) assert.throws(() => assertMakaReleaseVersion(version, '0.2.0'), /禁止使用/);
  assert.doesNotThrow(() => assertMakaReleaseVersion('0.2.0', '0.2.0'));
  assert.throws(() => assertMakaReleaseVersion('0.1.0', '0.2.0'), /不匹配/);
});
test('源码运行包只收集可解析的生产依赖，保留嵌套版本并忽略开发与可选类型 peer', async () => {
  const { runtimeClosure } = await import(pathToFileURL(resolve('scripts/maka-source.mjs')).href);
  const root = await mkdtemp(join(tmpdir(), 'specflow-maka-closure-'));
  const entry = join(root, 'node_modules/@maka/runtime-host');
  const first = join(root, 'node_modules/dependency');
  const nested = join(first, 'node_modules/nested');
  try {
    for (const [path, pkg] of [
      [entry, { name: '@maka/runtime-host', version: '0.1.0', dependencies: { dependency: '1' }, devDependencies: { compiler: '1' }, peerDependencies: { typescript: '5' }, peerDependenciesMeta: { typescript: { optional: true } } }],
      [first, { name: 'dependency', version: '1.0.0', dependencies: { nested: '2' }, optionalDependencies: { absent: '1' } }],
      [nested, { name: 'nested', version: '2.0.0' }],
    ] as const) { await mkdir(path, { recursive: true }); await writeFile(join(path, 'package.json'), JSON.stringify(pkg)); }
    const closure = await runtimeClosure(root, '@maka/runtime-host');
    assert.deepEqual(closure.map((e: any) => e.pkg.name), ['@maka/runtime-host', 'dependency', 'nested']);
    assert.equal(closure[1].dependencies[0].path, await realpath(nested));
    await writeFile(join(first, 'package.json'), JSON.stringify({ name: 'dependency', dependencies: { requiredMissing: '1' } }));
    await assert.rejects(runtimeClosure(root, '@maka/runtime-host'), /Required Maka runtime dependency missing/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('安装残留的 Maka dev 包不能通过正式发布校验', async () => {
  const root = await mkdtemp(join(tmpdir(), 'specflow-maka-release-'));
  try {
    await writeFile(join(root, 'package.json'), JSON.stringify({ version: '0.2.0-dev.78.20261010' }));
    await assert.rejects(verifyMakaRelease(root), /禁止使用/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('正式源码构建必须保留批准来源与签名验证记录', async () => {
  const root = await mkdtemp(join(tmpdir(), 'specflow-maka-release-'));
  try {
    await writeFile(join(root, 'package.json'), JSON.stringify({ version: MAKA_RELEASE.packageVersion }));
    const receipt = { ...MAKA_RELEASE, source: { ...MAKA_RELEASE.source }, build: { kind: 'runtime-host-production-closure', signatureVerified: true } };
    await writeFile(join(root, 'specflow-release.json'), JSON.stringify(receipt));
    assert.equal((await verifyMakaRelease(root)).version, MAKA_RELEASE.packageVersion);
    receipt.source.sha512 = '0'.repeat(128);
    await writeFile(join(root, 'specflow-release.json'), JSON.stringify(receipt));
    await assert.rejects(verifyMakaRelease(root), /正式源码来源校验失败/);
    receipt.source = { ...MAKA_RELEASE.source }; receipt.build.signatureVerified = false;
    await writeFile(join(root, 'specflow-release.json'), JSON.stringify(receipt));
    await assert.rejects(verifyMakaRelease(root), /构建验证记录不完整/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
