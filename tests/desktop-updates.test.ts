import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { DesktopUpdates, type DesktopUpdater, type DesktopUpdateState } from '../apps/desktop/updates.ts';

type CheckResult = Awaited<ReturnType<DesktopUpdater['checkForUpdates']>>;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

class FakeUpdater extends EventEmitter implements DesktopUpdater {
  autoDownload = true;
  autoInstallOnAppQuit = true;
  allowPrerelease = true;
  allowDowngrade = true;
  disableWebInstaller = false;
  checks = 0;
  downloads = 0;
  installs: [boolean | undefined, boolean | undefined][] = [];
  checkResult: () => Promise<CheckResult> = async () => ({ isUpdateAvailable: true, updateInfo: { version: '0.2.0' } });
  downloadResult: () => Promise<unknown> = async () => { this.emit('update-downloaded', { version: '0.2.0' }); };

  checkForUpdates() { this.checks++; return this.checkResult(); }
  downloadUpdate() { this.downloads++; return this.downloadResult(); }
  quitAndInstall(isSilent?: boolean, isForceRunAfter?: boolean) { this.installs.push([isSilent, isForceRunAfter]); }
}

function setup(automaticUpdates = true, disabledReason?: string) {
  const updater = new FakeUpdater();
  const states: Readonly<DesktopUpdateState>[] = [];
  const updates = new DesktopUpdates(updater, automaticUpdates, state => { states.push(state); }, disabledReason);
  return { updater, updates, states };
}

test('桌面更新关闭自动下载、退出安装、预发布与降级，检查后等待用户操作', async () => {
  const { updater, updates, states } = setup();
  assert.equal(updater.autoDownload, false);
  assert.equal(updater.autoInstallOnAppQuit, false);
  assert.equal(updater.allowPrerelease, false);
  assert.equal(updater.allowDowngrade, false);
  assert.equal(updater.disableWebInstaller, true);
  assert.equal(updates.state.status, 'idle');

  const state = await updates.check();
  assert.equal(state.status, 'available');
  assert.equal(state.version, '0.2.0');
  assert.ok(state.checkedAt && Number.isFinite(Date.parse(state.checkedAt)));
  assert.equal(updater.downloads, 0);
  assert.deepEqual(updater.installs, []);
  assert.deepEqual(states.map(value => value.status), ['checking', 'available']);
  assert.ok(Object.isFrozen(state));
});

test('并发检查共用一次请求，检查期间不会启动下载，最新版本返回 idle', async () => {
  const { updater, updates, states } = setup();
  const pending = deferred<CheckResult>();
  updater.checkResult = () => pending.promise;
  const first = updates.check();
  assert.equal(updates.state.status, 'checking');
  assert.equal(updates.check(), first);
  assert.equal(updates.download(), first);
  assert.equal(updater.checks, 1);
  assert.equal(updater.downloads, 0);
  pending.resolve({ isUpdateAvailable: false, updateInfo: { version: '0.1.0' } });
  assert.equal((await first).status, 'idle');
  assert.deepEqual(states.map(value => value.status), ['checking', 'idle']);
  assert.equal((await updates.check()).status, 'idle');
  assert.equal(updater.checks, 2);
});

test('检查失败与无检查结果均可重试，错误提示不暴露底层网络诊断', async () => {
  const { updater, updates } = setup();
  updater.checkResult = async () => { throw new Error('https://secret:credential@updates.invalid HTTP 403'); };
  assert.equal((await updates.check()).status, 'error');
  assert.ok(!updates.state.message?.includes('credential'));
  updater.checkResult = async () => null;
  assert.equal((await updates.check()).status, 'error');
  updater.checkResult = async () => ({ isUpdateAvailable: true, updateInfo: { version: '0.2.1' } });
  assert.equal((await updates.check()).version, '0.2.1');
  assert.equal(updates.state.status, 'available');
  assert.equal(updater.checks, 3);
});

test('下载共用一次请求，进度限制在 0 到 100，校验完成后也不会自动安装', async () => {
  const { updater, updates } = setup();
  await updates.check();
  const pending = deferred<unknown>();
  updater.downloadResult = () => pending.promise;
  const download = updates.download();
  assert.equal(updates.state.status, 'downloading');
  assert.equal(updates.state.percent, 0);
  assert.equal(updates.download(), download);
  assert.equal(updates.check(), download);
  assert.equal(updater.downloads, 1);
  for (const [value, expected] of [[35.5, 35.5], [-1, 0], [110, 100], [NaN, 0], [Infinity, 0]]) {
    updater.emit('download-progress', { percent: value });
    assert.equal(updates.state.percent, expected);
  }
  updater.emit('update-downloaded', { version: '0.2.0' });
  assert.equal(updates.state.status, 'downloaded');
  assert.equal(updates.state.percent, 100);
  updater.emit('download-progress', { percent: 12 });
  assert.equal(updates.state.percent, 100);
  pending.resolve([]);
  assert.equal((await download).status, 'downloaded');
  assert.equal((await updates.check()).status, 'downloaded');
  assert.equal(updater.checks, 1);
  assert.deepEqual(updater.installs, []);
});

test('下载校验失败阻止安装，重新检查后可以重新下载', async () => {
  const { updater, updates } = setup();
  await updates.check();
  const pending = deferred<unknown>();
  updater.downloadResult = () => pending.promise;
  const download = updates.download();
  updater.emit('error', new Error('sha512 checksum mismatch'));
  updater.emit('update-downloaded', { version: '0.2.0' });
  pending.reject(new Error('sha512 checksum mismatch'));
  assert.equal((await download).status, 'error');
  let shutdowns = 0;
  await updates.install(async () => { shutdowns++; });
  assert.equal(shutdowns, 0);
  assert.deepEqual(updater.installs, []);

  await updates.check();
  updater.downloadResult = async () => { updater.emit('update-downloaded', { version: '0.2.0' }); };
  assert.equal((await updates.download()).status, 'downloaded');
  assert.equal(updater.downloads, 2);
});

test('下载 Promise 完成但未收到校验完成事件时不能安装，网络失败也可重试', async () => {
  const { updater, updates } = setup();
  await updates.check();
  updater.downloadResult = async () => [];
  assert.equal((await updates.download()).status, 'error');
  await updates.install(async () => { assert.fail('未经校验的更新不能关闭后台'); });
  await updates.check();
  updater.downloadResult = async () => { throw new Error('Connection reset'); };
  assert.equal((await updates.download()).status, 'error');
  await updates.check();
  updater.downloadResult = async () => { updater.emit('update-downloaded', { version: '0.2.0' }); };
  assert.equal((await updates.download()).status, 'downloaded');
  assert.equal(updater.downloads, 3);
  assert.deepEqual(updater.installs, []);
});

test('安装等待后台完全关闭，并发安装只执行一次且不启动额外更新操作', async () => {
  const { updater, updates } = setup();
  await updates.check();
  await updates.download();
  const shutdown = deferred<void>();
  let shutdowns = 0;
  const installing = updates.install(() => { shutdowns++; return shutdown.promise; });
  assert.equal(updates.state.status, 'installing');
  await updates.install(async () => { assert.fail('并发安装不应再次关闭后台'); });
  assert.equal((await updates.check()).status, 'installing');
  assert.equal((await updates.download()).status, 'installing');
  assert.equal(shutdowns, 1);
  assert.equal(updater.checks, 1);
  assert.equal(updater.downloads, 1);
  assert.deepEqual(updater.installs, []);
  shutdown.resolve();
  await installing;
  assert.deepEqual(updater.installs, [[false, true]]);
});

test('尚未下载或处于下载中的更新不能安装，孤立下载完成事件无效', async () => {
  const { updater, updates } = setup();
  const unexpectedShutdown = async () => { assert.fail('没有已下载更新时不能关闭后台'); };
  updater.emit('update-downloaded', { version: '0.2.0' });
  assert.equal(updates.state.status, 'idle');
  await updates.install(unexpectedShutdown);
  await updates.check();
  await updates.install(unexpectedShutdown);
  const pending = deferred<unknown>();
  updater.downloadResult = () => pending.promise;
  const download = updates.download();
  await updates.install(unexpectedShutdown);
  assert.deepEqual(updater.installs, []);
  pending.reject(new Error('Cancelled'));
  await download;
});

test('手动更新模式只检查版本，禁用模式不触发检查、下载或安装', async () => {
  const manual = setup(false);
  assert.equal((await manual.updates.check()).status, 'available');
  assert.equal((await manual.updates.download()).status, 'available');
  manual.updater.emit('update-downloaded', { version: '0.2.0' });
  await manual.updates.install(async () => { assert.fail('手动更新不能关闭后台安装'); });
  assert.equal(manual.updater.downloads, 0);
  assert.deepEqual(manual.updater.installs, []);

  const disabled = setup(true, '源码运行模式');
  assert.equal((await disabled.updates.check()).status, 'disabled');
  assert.equal((await disabled.updates.download()).status, 'disabled');
  await disabled.updates.install(async () => { assert.fail('禁用更新不能关闭后台安装'); });
  assert.equal(disabled.updater.checks, 0);
  assert.equal(disabled.updater.downloads, 0);
  assert.deepEqual(disabled.updater.installs, []);
});

test('后台关闭失败或者安装前收到错误时，不执行 quitAndInstall', async () => {
  const { updater, updates } = setup();
  await updates.check();
  await updates.download();
  await updates.install(async () => { throw new Error('Backend shutdown failed'); });
  assert.equal(updates.state.status, 'error');
  assert.deepEqual(updater.installs, []);

  await updates.check();
  await updates.download();
  const shutdown = deferred<void>();
  const installing = updates.install(() => shutdown.promise);
  updater.emit('error', new Error('Installation unavailable'));
  shutdown.resolve();
  await installing;
  assert.equal(updates.state.status, 'error');
  assert.deepEqual(updater.installs, []);
});

test('dispose 忽略后续事件与未结束检查的成功结果', async () => {
  const { updater, updates, states } = setup();
  const pending = deferred<CheckResult>();
  updater.checkResult = () => pending.promise;
  const check = updates.check();
  updates.dispose();
  const previous = updates.state;
  updater.emit('error', new Error('Late network error'));
  updater.emit('download-progress', { percent: 80 });
  updater.emit('update-downloaded', { version: '0.2.0' });
  pending.resolve({ isUpdateAvailable: true, updateInfo: { version: '0.2.0' } });
  assert.equal(await check, previous);
  assert.equal(await updates.check(), previous);
  assert.equal(await updates.download(), previous);
  await updates.install(async () => { assert.fail('dispose 后不能安装'); });
  assert.equal(states.length, 1);
  assert.equal(updater.checks, 1);
  assert.equal(updater.downloads, 0);
  assert.deepEqual(updater.installs, []);
});

test('dispose 忽略尚未结束的检查失败与下载失败', async () => {
  const checking = setup();
  const checkPending = deferred<CheckResult>();
  checking.updater.checkResult = () => checkPending.promise;
  const check = checking.updates.check();
  checking.updates.dispose();
  checkPending.reject(new Error('Late check failure'));
  assert.equal((await check).status, 'checking');
  assert.equal(checking.states.length, 1);

  const downloading = setup();
  await downloading.updates.check();
  const downloadPending = deferred<unknown>();
  downloading.updater.downloadResult = () => downloadPending.promise;
  const download = downloading.updates.download();
  downloading.updates.dispose();
  downloading.updater.emit('download-progress', { percent: 75 });
  downloading.updater.emit('update-downloaded', { version: '0.2.0' });
  downloadPending.reject(new Error('Late download failure'));
  assert.equal((await download).status, 'downloading');
  assert.equal(downloading.updates.state.percent, 0);
  assert.equal(downloading.states.length, 3);
});

test('dispose 发生在等待后台关闭期间时，不再安装或上报延迟失败', async () => {
  for (const failShutdown of [false, true]) {
    const { updater, updates, states } = setup();
    await updates.check();
    await updates.download();
    const shutdown = deferred<void>();
    const installing = updates.install(() => shutdown.promise);
    updates.dispose();
    const count = states.length;
    if (failShutdown) shutdown.reject(new Error('Late shutdown failure'));
    else shutdown.resolve();
    await installing;
    assert.equal(updates.state.status, 'installing');
    assert.equal(states.length, count);
    assert.deepEqual(updater.installs, []);
  }
});
