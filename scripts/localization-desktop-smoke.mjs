import { _electron as electron, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path';

// Run after desktop:prepare. This exercises the built desktop and its bundled runtime as shipped.
const root = resolve(import.meta.dirname, '..');
const output = join(root, '.tools', 'localization-qa');
const require = createRequire(import.meta.url);
const executablePath = require('electron');
const temporaryRoot = await realpath(tmpdir());
const userData = await mkdtemp(join(temporaryRoot, 'specflow-localization-desktop-'));
const localePath = join(userData, 'locale.json');
const env = { ...process.env, SPECFLOW_DESKTOP_USER_DATA: userData };
for (const name of ['ELECTRON_RUN_AS_NODE', 'SPECFLOW_DATA_DIR', 'SPECFLOW_MAKA_ROOT', 'MAKA_ROOT', 'NODE_OPTIONS', 'NODE_PATH']) delete env[name];

await mkdir(output, { recursive: true });
await writeFile(localePath, JSON.stringify({ locale: 'en' }));
const reportPath = join(output, 'desktop-native-report.json');
const report = { platform: process.platform, arch: process.arch, executablePath, testedAt: new Date().toISOString(), checks: [], launches: [], screenshots: [], pageErrors: [], passed: false };
let application;
let page;

async function launch() {
  application = await electron.launch({ executablePath, args: [root], cwd: temporaryRoot, env, timeout: 90000 });
  application.process().stderr?.on('data', chunk => { report.desktopStderr = (report.desktopStderr || '') + chunk.toString(); });
  page = await application.firstWindow({ timeout: 60000 });
  page.on('pageerror', error => report.pageErrors.push(String(error)));
  await page.getByRole('heading', { name: 'Add CSV import to an existing project', exact: true }).waitFor({ timeout: 60000 });
  await expect(page.getByRole('combobox', { name: 'Interface language', exact: true })).toHaveValue('en');
  const origin = new URL(page.url()).origin;
  assert.match(origin, /^http:\/\/127\.0\.0\.1:\d+$/);
  const desktop = await page.evaluate(async () => ({ initialLocale: window.specflowDesktop?.initialLocale, readLocale: await window.specflowDesktop?.readLocale(), documentLanguage: document.documentElement.lang, require: typeof window.require, process: typeof window.process }));
  assert.deepEqual(desktop, { initialLocale: 'en', readLocale: 'en', documentLanguage: 'en', require: 'undefined', process: 'undefined' });
  const activeProfile = await application.evaluate(({ app }) => app.getPath('userData'));
  assert.equal(await realpath(activeProfile), await realpath(userData));
  report.launches.push({ origin, desktop, profileIsIsolated: true });
  return origin;
}

async function nativeMenus() {
  return application.evaluate(({ Menu }) => {
    const menu = Menu.getApplicationMenu();
    const tree = items => items.map(item => ({ label: item.label, id: item.id, role: item.role, enabled: item.enabled, type: item.type, submenu: item.submenu ? tree(item.submenu.items) : undefined }));
    return tree(menu?.items || []);
  });
}

async function assertMenus(locale) {
  const expected = locale === 'en'
    ? { top: ['File', 'Edit', 'View', 'Help'], updates: ['Check for Updates…', 'Download Update…', 'Restart and Install Update…', 'Downloads and Release Notes'], about: 'About SpecFlow', undo: 'Undo', reload: 'Reload' }
    : { top: ['文件', '编辑', '视图', '帮助'], updates: ['检查更新…', '下载更新…', '重启并安装更新…', '下载与发行说明'], about: '关于 SpecFlow', undo: '撤销', reload: '重新加载' };
  const expectedTop = process.platform === 'darwin' ? ['SpecFlow', ...expected.top] : expected.top;
  await expect.poll(async () => (await nativeMenus()).map(item => item.label), { timeout: 10000 }).toEqual(expectedTop);
  const menus = await nativeMenus();
  const help = menus.find(item => item.label === expected.top[3]);
  const edit = menus.find(item => item.label === expected.top[1]);
  const view = menus.find(item => item.label === expected.top[2]);
  const updates = help.submenu.filter(item => item.id?.startsWith('specflow-update-'));
  assert.deepEqual(updates.map(item => item.label), expected.updates);
  assert.deepEqual(updates.map(item => item.enabled), [true, false, false, true]);
  assert.ok(help.submenu.some(item => item.label === expected.about));
  assert.ok(edit.submenu.some(item => item.label === expected.undo));
  assert.ok(view.submenu.some(item => item.label === expected.reload));
  return menus;
}

async function screenshot(name) {
  const path = join(output, `desktop-native-${name}.png`);
  await page.screenshot({ path, fullPage: true });
  report.screenshots.push(path);
}

async function closeAndCheckServer(origin) {
  await application.close();
  application = undefined;
  page = undefined;
  await expect.poll(async () => {
    try { await fetch(`${origin}/api/bootstrap`, { signal: AbortSignal.timeout(1000) }); return false; }
    catch { return true; }
  }, { timeout: 15000 }).toBe(true);
}

async function safeCleanup() {
  // Validate both the resolved absolute target and its real location before any recursive removal.
  const target = resolve(userData), actual = await realpath(userData);
  const insideTemporaryRoot = path => {
    const local = relative(temporaryRoot, path);
    return !!local && !isAbsolute(local) && local !== '..' && !local.startsWith(`..${sep}`);
  };
  assert.ok(isAbsolute(target) && insideTemporaryRoot(target) && insideTemporaryRoot(actual));
  assert.ok(basename(actual).startsWith('specflow-localization-desktop-'));
  assert.equal(actual, await realpath(target));
  await rm(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  report.temporaryProfileRemoved = true;
}

try {
  await Promise.all(['dist/desktop/main.cjs', 'dist/desktop/preload.cjs', '.tools/desktop/resources/server.mjs'].map(path => readFile(join(root, path))));
  const firstOrigin = await launch();
  const seed = await page.evaluate(async () => {
    const response = await fetch('/api/bootstrap', { headers: { 'Accept-Language': 'en' } });
    if (!response.ok) throw new Error(`Bootstrap failed: ${response.status}`);
    const bootstrap = await response.json();
    const item = bootstrap.workItems[0];
    const snapshotResponse = await fetch(`/api/work-items/${encodeURIComponent(item.id)}`, { headers: { 'Accept-Language': 'en' } });
    if (!snapshotResponse.ok) throw new Error(`Snapshot failed: ${snapshotResponse.status}`);
    const snapshot = await snapshotResponse.json();
    return { projectName: bootstrap.projects[0].name, itemName: item.name, itemId: item.id, workflowName: snapshot.runs.at(-1).definition.name, workflowLocale: snapshot.runs.at(-1).definition.locale, firstNodeName: snapshot.nodes[0].name };
  });
  assert.equal(seed.projectName, 'CSV import demo');
  assert.equal(seed.itemName, 'Add CSV import to an existing project');
  assert.equal(seed.workflowLocale, 'en');
  assert.equal(seed.workflowName, 'Spec-driven development');
  assert.equal(seed.firstNodeName, 'Requirements specification');
  report.seed = seed;
  report.initialMenus = await assertMenus('en');
  await screenshot('english-first-launch');
  report.checks.push('English saved preference initializes preload, renderer, first-run seed, workflow and native File/Edit/View/Help/update menus');

  await page.getByRole('combobox', { name: 'Interface language', exact: true }).selectOption('zh-CN');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await expect(page.getByRole('combobox', { name: '界面语言', exact: true })).toHaveValue('zh-CN');
  assert.equal(await page.evaluate(() => window.specflowDesktop.readLocale()), 'zh-CN');
  assert.equal(await page.evaluate(() => window.specflowDesktop.initialLocale), 'en');
  assert.deepEqual(JSON.parse(await readFile(localePath, 'utf8')), { locale: 'zh-CN' });
  report.chineseMenus = await assertMenus('zh-CN');
  await page.getByRole('heading', { name: '需求规格', exact: true }).first().waitFor();
  await screenshot('chinese-live-switch');
  report.checks.push('UI language selection updates renderer and native menus immediately, persists zh-CN, and displays English-seeded default step labels in Chinese');

  await page.getByRole('combobox', { name: '界面语言', exact: true }).selectOption('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('combobox', { name: 'Interface language', exact: true })).toHaveValue('en');
  assert.equal(await page.evaluate(() => window.specflowDesktop.readLocale()), 'en');
  assert.deepEqual(JSON.parse(await readFile(localePath, 'utf8')), { locale: 'en' });
  report.englishMenusAfterSwitch = await assertMenus('en');
  await screenshot('english-live-switch');
  await closeAndCheckServer(firstOrigin);
  report.checks.push('UI selection persists English and normal application exit stops its backend');

  const restartedOrigin = await launch();
  assert.notEqual(restartedOrigin, firstOrigin, 'Restart should exercise a new randomly assigned server port');
  report.restartedMenus = await assertMenus('en');
  const restoredItemId = await page.evaluate(async () => (await (await fetch('/api/bootstrap', { headers: { 'Accept-Language': 'en' } })).json()).workItems[0].id);
  assert.equal(restoredItemId, seed.itemId);
  assert.deepEqual(JSON.parse(await readFile(localePath, 'utf8')), { locale: 'en' });
  await screenshot('english-relaunch');
  await closeAndCheckServer(restartedOrigin);
  report.checks.push('Same desktop profile restores English across a new backend port and retains its original seeded work item');
  assert.deepEqual(report.pageErrors, []);
  report.passed = true;
} catch (error) {
  report.error = String(error.stack || error);
  if (page && !page.isClosed()) await screenshot('failure').catch(() => {});
  console.error(error);
  process.exitCode = 1;
} finally {
  if (application) {
    try { await application.close(); application = undefined; }
    catch (error) { report.closeError = String(error); report.passed = false; process.exitCode = 1; }
  }
  if (!application) {
    try { await safeCleanup(); }
    catch (error) { report.cleanupError = String(error); report.passed = false; process.exitCode = 1; }
  }
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks, screenshots: report.screenshots, reportPath, temporaryProfileRemoved: report.temporaryProfileRemoved, error: report.error, closeError: report.closeError, cleanupError: report.cleanupError }, null, 2));
}
