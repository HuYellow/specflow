import { _electron as electron, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..'), require = createRequire(import.meta.url);
const packaged = process.argv.includes('--packaged');
const binary = packaged ? process.platform === 'win32' ? join(root, 'release/win-unpacked/SpecFlow.exe') : join(root, `release/${process.arch === 'arm64' ? 'mac-arm64' : 'mac'}/SpecFlow.app/Contents/MacOS/SpecFlow`) : require('electron');
const userData = await mkdtemp(join(tmpdir(), 'specflow-workspaces-test-'));
const env = { ...process.env, SPECFLOW_DESKTOP_USER_DATA: userData };
delete env.SPECFLOW_DATA_DIR; delete env.SPECFLOW_MAKA_ROOT; delete env.ELECTRON_RUN_AS_NODE;
for (const name of ['team-a', 'team-b', 'empty']) {
  const dir = join(userData, 'repos', name, 'app'); await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'README.md'), `# ${name}\n\nWorkspace navigation fixture.\n`);
  for (const args of [['init'], ['add', '--all'], ['-c', 'user.name=SpecFlow', '-c', 'user.email=specflow@localhost', 'commit', '-m', 'Initialize workspace fixture']]) { const result = spawnSync('git', args, { cwd: dir, windowsHide: true, encoding: 'utf8' }); assert.equal(result.status, 0, result.stderr); }
}
const app = await electron.launch({ executablePath: binary, args: packaged ? [] : [root], env, cwd: tmpdir(), timeout: 90000 });
const report = { packaged, platform: process.platform, testedAt: new Date().toISOString(), checks: [] };
try {
  const page = await app.firstWindow(), errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.getByRole('heading', { name: '为现有项目增加 CSV 导入' }).waitFor({ timeout: 60000 });
  await expect(page.locator('.add-project')).toHaveCount(0);
  await page.locator('.workspace-label').getByRole('button', { name: '打开 Git 仓库', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('textbox', { name: '仓库绝对路径', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '关闭对话框', exact: true }).click();
  const fixtures = await page.evaluate(async input => {
    const boot = await (await fetch('/api/bootstrap')).json();
    const post = async (path, body) => { const r = await fetch(`/api${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Specflow-Token': boot.token, 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(body) }); const result = await r.json(); if (!r.ok) throw new Error(JSON.stringify(result)); return result; };
    const a = await post('/projects', { rootPath: input.a, name: '工程空间 A' }), b = await post('/projects', { rootPath: input.b, name: '工程空间 B' }), empty = await post('/projects', { rootPath: input.empty, name: '空工程空间' });
    const a1 = await post('/work-items', { projectId: a.id, name: 'A 的导入功能', request: '实现 A 的导入功能，并补充验收条件。' }), a2 = await post('/work-items', { projectId: a.id, name: 'A 的权限修复', request: '修复 A 的权限边界，并添加相关验证。' }), b1 = await post('/work-items', { projectId: b.id, name: 'B 的接口开发', request: '实现 B 的接口功能，明确输入和输出。' });
    await post(`/work-items/${a1.id}/import`, { artifacts: [{ logicalId: 'spec', content: '# A 的规格\n\nA-SPEC-101：仅属于 A 的导入功能。' }, { logicalId: 'custom_note', content: '# A 的自定义说明\n\n这个产物属于 A 的导入工作项。' }] });
    await post(`/work-items/${a2.id}/import`, { artifacts: [{ logicalId: 'plan', content: '# A 的设计\n\nA-PLAN-102：仅属于 A 的权限修复。' }] });
    await post(`/work-items/${b1.id}/import`, { artifacts: [{ logicalId: 'tasks', content: '# B 的任务\n\n- [ ] T001 B-TASK-201：完成 B 的接口验收。' }] });
    return { a, b, empty, a1, a2, b1 };
  }, { a: join(userData, 'repos/team-a/app'), b: join(userData, 'repos/team-b/app'), empty: join(userData, 'repos/empty/app') });
  await page.getByRole('button', { name: '刷新', exact: true }).click();
  const chooser = page.getByRole('button', { name: '工程工作空间', exact: true });
  const menu = page.getByRole('listbox', { name: '工程工作空间选项', exact: true });
  const clickCenter = async locator => {
    await expect(locator).toBeVisible();
    const bounds = await locator.boundingBox(); assert.ok(bounds);
    await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  };
  const openWithArrow = async () => {
    await expect(chooser).toBeEnabled();
    await clickCenter(chooser.getByTestId('workspace-toggle-arrow'));
    await expect(menu).toBeVisible(); await expect(chooser).toHaveAttribute('aria-expanded', 'true');
  };
  const selectWorkspace = async id => {
    await openWithArrow();
    await menu.locator(`[data-project-id="${id}"]`).click();
    await expect(menu).toHaveCount(0); await expect(chooser).toHaveAttribute('data-current-workspace', id);
    await expect(chooser).toHaveAttribute('aria-expanded', 'false');
  };
  await openWithArrow(); await expect(menu.getByRole('option')).toHaveCount(4);
  await page.screenshot({ path: join(root, `release/workspaces-switcher-open-${packaged ? 'packaged' : 'dev'}.png`), fullPage: true });
  await clickCenter(chooser.getByTestId('workspace-toggle-arrow')); await expect(menu).toHaveCount(0);
  await clickCenter(chooser.locator('.workspace-selected-name')); await expect(menu).toBeVisible();
  await page.keyboard.press('Escape'); await expect(menu).toHaveCount(0); await expect(chooser).toBeFocused();
  await clickCenter(chooser.locator(':scope > svg')); await expect(menu).toBeVisible();
  await page.getByRole('heading', { name: '为现有项目增加 CSV 导入', exact: true }).click(); await expect(menu).toHaveCount(0);
  await chooser.focus(); await page.keyboard.press('ArrowDown'); await expect(menu).toBeVisible();
  await page.keyboard.press('End'); await expect(menu.locator(`[data-project-id="${fixtures.empty.id}"]`)).toBeFocused();
  await page.keyboard.press('Home'); await page.keyboard.press('ArrowDown');
  await expect(menu.locator(`[data-project-id="${fixtures.a.id}"]`)).toBeFocused();
  await page.keyboard.press('Enter'); await expect(chooser).toHaveAttribute('data-current-workspace', fixtures.a.id); await expect(menu).toHaveCount(0);
  report.checks.push('real mouse clicks on arrow, workspace name, and folder icon open the menu; arrow toggles it, outside click and Escape dismiss it; keyboard navigation selects an option');
  await selectWorkspace(fixtures.a.id);
  const items = page.getByLabel('当前空间的工作项', { exact: true }), artifacts = page.getByLabel('当前工作项的工程产物', { exact: true });
  await expect(items.getByRole('button')).toHaveCount(2); await expect(items.getByRole('button', { name: 'B 的接口开发' })).toHaveCount(0);
  await items.getByRole('button', { name: 'A 的导入功能', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A 的导入功能', exact: true })).toBeVisible();
  await expect(artifacts.getByRole('button')).toHaveCount(2); await expect(artifacts.getByRole('button', { name: '需求规格', exact: true })).toBeVisible(); await expect(artifacts.getByRole('button', { name: 'custom_note', exact: true })).toBeVisible();
  await artifacts.getByRole('button', { name: '需求规格', exact: true }).click(); await page.getByRole('textbox', { name: '文档正文' }).waitFor();
  assert.ok((await page.getByRole('textbox', { name: '文档正文' }).inputValue()).includes('A-SPEC-101'));
  report.checks.push('workspace chooser scopes work items; sidebar shows only existing artifacts of the selected item, including custom artifacts');

  await page.getByRole('button', { name: '新建工作项', exact: true }).click();
  let createDialog = page.getByRole('dialog');
  await expect(createDialog.getByRole('heading', { name: '新建工程工作项', exact: true })).toBeVisible();
  await expect(createDialog.getByText('工程空间 A', { exact: true })).toBeVisible();
  await expect(createDialog.getByRole('textbox', { name: '工作项名称', exact: true })).toBeVisible();
  await createDialog.getByRole('button', { name: '关闭对话框', exact: true }).click();
  report.checks.push('work item list has no redundant repository button; workspace header opens repository registration and work item header opens creation for the current workspace');

  await items.getByRole('button', { name: 'A 的权限修复', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A 的权限修复', exact: true })).toBeVisible(); await expect(artifacts.getByRole('button')).toHaveCount(1); await expect(artifacts.getByRole('button', { name: '工程设计', exact: true })).toBeVisible();
  await selectWorkspace(fixtures.b.id); await expect(items.getByRole('button')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'B 的接口开发', exact: true })).toBeVisible(); await expect(artifacts.getByRole('button')).toHaveCount(1); await expect(artifacts.getByRole('button', { name: '任务拆解', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: '文档正文' })).toHaveCount(0);
  await selectWorkspace(fixtures.a.id); await expect(page.getByRole('heading', { name: 'A 的权限修复', exact: true })).toBeVisible();
  report.checks.push('item switches and workspace switches reset detail selection; returning to a workspace restores its selected item');

  let release; const hold = new Promise(done => { release = done; });
  let intercepted; const requested = new Promise(done => { intercepted = done; });
  const pattern = `**/api/work-items/${fixtures.a1.id}`;
  await page.route(pattern, async route => { intercepted(); await hold; await route.continue(); });
  await items.getByRole('button', { name: 'A 的导入功能', exact: true }).click(); await requested;
  await selectWorkspace(fixtures.b.id); await expect(page.getByRole('heading', { name: 'B 的接口开发', exact: true })).toBeVisible();
  const lateResponse = page.waitForResponse(response => response.url().endsWith(`/api/work-items/${fixtures.a1.id}`));
  release(); await page.unrouteAll({ behavior: 'wait' }); await lateResponse; await page.waitForTimeout(400);
  await expect(chooser).toHaveAttribute('data-current-workspace', fixtures.b.id); await expect(page.getByRole('heading', { name: 'B 的接口开发', exact: true })).toBeVisible(); await expect(artifacts.getByRole('button', { name: '任务拆解', exact: true })).toBeVisible(); await expect(artifacts.getByRole('button', { name: '需求规格', exact: true })).toHaveCount(0);
  report.checks.push('late response from the previous workspace cannot overwrite the current workspace or its artifacts');

  await selectWorkspace(fixtures.empty.id); await expect(page.getByRole('heading', { name: '该工作空间还没有工作项', exact: true })).toBeVisible(); await expect(items.getByRole('button')).toHaveCount(0); await expect(artifacts.getByRole('button')).toHaveCount(0);
  await page.getByRole('button', { name: /工程设置/ }).first().click(); let dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('textbox', { name: '项目章程正文', exact: true })).toBeVisible(); await expect(dialog.getByText(`${fixtures.empty.rootPath}/AGENT.md`, { exact: true })).toBeVisible(); await dialog.getByRole('button', { name: '关闭对话框' }).click();
  await page.getByRole('button', { name: '在此空间新建工作项', exact: true }).click(); dialog = page.getByRole('dialog');
  await expect(dialog.getByText('空工程空间', { exact: true })).toBeVisible(); await expect(dialog.getByRole('combobox', { name: '项目', exact: true })).toHaveCount(0);
  await dialog.getByRole('textbox', { name: '工作项名称', exact: true }).fill('空空间的第一个工作项'); await dialog.getByRole('textbox', { name: '需求正文', exact: true }).fill('在这个工程空间实现初始功能，并记录验收条件。'); await dialog.getByRole('button', { name: '创建工作项' }).click();
  await expect(page.getByRole('heading', { name: '空空间的第一个工作项', exact: true })).toBeVisible(); await expect(items.getByRole('button')).toHaveCount(1); await expect(artifacts.getByRole('button')).toHaveCount(0); await expect(chooser).toHaveAttribute('data-current-workspace', fixtures.empty.id);
  report.checks.push('empty workspace retains its identity, supports project settings, and creates an item in that workspace');
  await page.reload(); await expect(chooser).toHaveAttribute('data-current-workspace', fixtures.empty.id); await expect(page.getByRole('heading', { name: '空空间的第一个工作项', exact: true })).toBeVisible();
  await selectWorkspace(fixtures.a.id); await expect(page.getByRole('heading', { name: 'A 的导入功能', exact: true })).toBeVisible();
  for (const width of [1440, 1000]) { await page.setViewportSize({ width, height: 940 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)); }
  await page.screenshot({ path: join(root, `release/workspaces-${packaged ? 'packaged' : 'dev'}.png`), fullPage: true }); assert.deepEqual(errors, []);
  report.checks.push('reload retains workspace selection; desktop widths have no horizontal overflow or renderer errors');
  await writeFile(join(root, `release/workspaces-smoke-${packaged ? 'packaged' : 'dev'}.json`), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
} catch (error) { const page = await app.firstWindow().catch(() => undefined); if (page) await page.screenshot({ path: join(root, 'release/workspaces-smoke-failure.png'), fullPage: true }).catch(() => undefined); throw error; }
finally { await app.close(); }
