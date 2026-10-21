import { _electron as electron, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..'), require = createRequire(import.meta.url);
const packaged = process.argv.includes('--packaged');
const userData = await mkdtemp(join(tmpdir(), 'specflow-requirements-test-'));
// Keep this Chinese regression fixture independent of the host system language.
await writeFile(join(userData, 'locale.json'), JSON.stringify({ locale: 'zh-CN' }));
const env = { ...process.env, SPECFLOW_DESKTOP_USER_DATA: userData };
delete env.SPECFLOW_MAKA_ROOT; delete env.SPECFLOW_DATA_DIR; delete env.ELECTRON_RUN_AS_NODE;
const executable = packaged ? (process.platform === 'win32' ? join(root, 'release/win-unpacked/SpecFlow.exe') : join(root, `release/${process.arch === 'arm64' ? 'mac-arm64' : 'mac'}/SpecFlow.app/Contents/MacOS/SpecFlow`)) : require('electron');
const app = await electron.launch({ executablePath: executable, args: packaged ? [] : [root], env, cwd: tmpdir(), timeout: 90000 });
const report = { packaged, platform: process.platform, testedAt: new Date().toISOString(), userData, checks: [] };
await mkdir(join(root, 'release'), { recursive: true });
try {
  const page = await app.firstWindow(), errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.getByRole('heading', { name: '为现有项目增加 CSV 导入' }).waitFor({ timeout: 60000 });
  await expect(page.locator('.flow-task-bar')).toBeVisible();
  const readinessRoute = '**/api/node-runs/*/readiness';
  const failReadiness = route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ code: 'READINESS_SMOKE_FAILURE', message: '验收注入：运行条件读取暂时失败' }) });
  await page.route(readinessRoute, failReadiness);
  try {
    await page.reload();
    await expect(page.getByRole('button', { name: '重试运行条件检查', exact: true })).toBeEnabled();
    await expect(page.locator('.flow-conditions')).toContainText('验收注入：运行条件读取暂时失败');
    await expect(page.locator('.flow-conditions').getByText('读取失败', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '运行所选步骤', exact: true })).toBeDisabled();
  } finally { await page.unroute(readinessRoute, failReadiness); }
  await page.getByRole('button', { name: '重试运行条件检查', exact: true }).click();
  await expect(page.getByRole('button', { name: '运行此步骤', exact: true })).toBeEnabled();
  report.checks.push('readiness read failure is explained with a retry action; removing the failure and retrying restores dispatch readiness');
  const boot = await page.evaluate(async () => (await fetch('/api/bootstrap')).json());
  const itemId = boot.workItems[0].id;
  const sourceContent = '# CSV 产品需求\nFR-CSV-101：引号内的逗号必须保留，支持 CRLF。\n';
  const repository = boot.projects[0].rootPath;
  assert.ok(resolve(repository).startsWith(resolve(userData)), 'Repository fixture must belong to the isolated desktop profile');
  await writeFile(join(repository, 'README.md'), '# CSV 需求背景\n需求文档用于验证仓库导入功能。\n');
  for (const args of [['add', '--', 'README.md'], ['-c', 'user.name=SpecFlow', '-c', 'user.email=specflow@localhost', 'commit', '-m', 'Add repository requirements fixture']]) {
    const result = spawnSync('git', args, { cwd: repository, encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0, result.stderr);
  }
  await page.getByRole('tab', { name: '需求输入', exact: true }).click();
  assert.ok((await page.getByRole('textbox', { name: '需求正文', exact: true }).inputValue()).includes('CRLF'));
  await page.getByLabel('上传需求文档', { exact: true }).setInputFiles({ name: 'CSV-PRD.md', mimeType: 'text/markdown', buffer: Buffer.from(sourceContent) });
  await page.getByText('CSV-PRD.md', { exact: true }).first().waitFor();
  await page.getByRole('button', { name: '保存需求', exact: true }).click();
  await page.getByText('需求已保存；新的分析将读取此版本', { exact: true }).waitFor();
  let state = await page.evaluate(async id => (await fetch(`/api/work-items/${id}`)).json(), itemId);
  assert.equal(state.requirements.current.number, 2);
  assert.equal(state.requirements.current.documents[0].content, sourceContent);
  report.checks.push('desktop: original work-item text migrates; UTF-8 file upload and immutable source save');

  await page.getByRole('textbox', { name: '需求正文', exact: true }).fill('临时草稿，随后撤回');
  await page.getByRole('textbox', { name: '需求正文', exact: true }).fill(state.requirements.current.request);
  await page.getByRole('button', { name: '返回开发流程' }).click();
  await expect(page.getByRole('button', { name: '运行此步骤' })).toBeEnabled();
  await page.getByRole('tab', { name: '需求输入', exact: true }).click();
  report.checks.push('reverting an edit removes the draft and restores execution readiness');

  await page.getByRole('textbox', { name: '需求正文', exact: true }).fill('尚未保存的需求草稿');
  await page.getByRole('button', { name: '返回开发流程' }).click();
  await expect(page.getByRole('button', { name: '处理需求草稿', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: '运行所选步骤', exact: true })).toBeDisabled();
  await page.reload();
  await page.getByRole('tab', { name: '需求输入', exact: true }).click();
  assert.equal(await page.getByRole('textbox', { name: '需求正文', exact: true }).inputValue(), '尚未保存的需求草稿');
  await page.evaluate(async id => {
    const boot = await (await fetch('/api/bootstrap')).json(), state = await (await fetch(`/api/work-items/${id}`)).json();
    const response = await fetch(`/api/work-items/${id}/requirements`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Specflow-Token': boot.token, 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ expectedRevisionId: state.requirements.current.id, request: '另一个编辑者保存的新需求', documents: state.requirements.current.documents }) });
    if (!response.ok) throw new Error(await response.text());
  }, itemId);
  await page.getByText('需求已有新版本，当前草稿已保留', { exact: true }).waitFor();
  assert.equal(await page.getByRole('textbox', { name: '需求正文', exact: true }).inputValue(), '尚未保存的需求草稿');
  assert.equal(await page.getByRole('button', { name: '保存需求', exact: true }).isDisabled(), true);
  await page.getByRole('button', { name: '丢弃草稿，载入最新需求' }).click();
  assert.equal(await page.getByRole('textbox', { name: '需求正文', exact: true }).inputValue(), '另一个编辑者保存的新需求');
  report.checks.push('draft survives navigation/reload; unsaved requirements block execution; concurrent save preserves draft and requires comparison');

  await page.getByRole('textbox', { name: '仓库需求文档路径' }).fill('README.md');
  await page.getByRole('button', { name: '从仓库导入' }).click();
  await page.getByText('README.md', { exact: true }).first().waitFor();
  await page.getByRole('button', { name: '保存需求', exact: true }).click();
  await page.getByText('需求已保存；新的分析将读取此版本', { exact: true }).waitFor();
  await page.getByRole('button', { name: '返回开发流程' }).click();
  const specify = page.locator('.flow-stage-select').filter({ hasText: /需求规格$/ });
  const requirementGroup = page.locator('.flow-step-group').filter({ has: specify });
  if (!await requirementGroup.evaluate(group => group.open)) await requirementGroup.locator(':scope > summary').click();
  await specify.click();
  await page.getByRole('button', { name: '运行此步骤' }).click();
  await page.getByRole('button', { name: '阅读产物与接纳条件', exact: true }).waitFor({ timeout: 30000 });
  state = await page.evaluate(async id => (await fetch(`/api/work-items/${id}`)).json(), itemId);
  const attempt = state.attempts.at(-1);
  assert.ok(attempt.prompt.includes(sourceContent));
  assert.ok(attempt.prompt.includes('README.md'));
  assert.ok(attempt.prompt.includes('另一个编辑者保存的新需求'));
  assert.equal(attempt.requirementRevisionId, state.requirements.current.id);
  report.checks.push('repository import is snapshotted; UI dispatch sends saved document body and revision to the execution backend');
  await page.getByRole('tab', { name: '需求输入', exact: true }).click();
  await page.getByRole('textbox', { name: '需求正文', exact: true }).fill('支持 CSV 引号和 CRLF，增加记录数上限。');
  await page.getByRole('button', { name: '保存需求', exact: true }).click();
  await page.getByText('需求已保存；新的分析将读取此版本', { exact: true }).waitFor();
  await page.getByRole('button', { name: '返回开发流程' }).click();
  await page.locator('.flow-task-bar').getByText('上游已变更', { exact: true }).waitFor();
  await expect(page.getByRole('button', { name: '基于当前依据重新运行', exact: true })).toBeEnabled();
  report.checks.push('changing saved source visibly invalidates the analysis and offers a new attempt');

  await page.getByRole('button', { name: '新建工作项', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: '工作项名称', exact: true }).fill('附件驱动的需求');
  await dialog.getByLabel('上传需求文档', { exact: true }).setInputFiles({ name: '附件需求.txt', mimeType: 'text/plain', buffer: Buffer.from('需要支持 CSV 导入，请产出验收标准。') });
  await dialog.getByRole('button', { name: '粘贴文档', exact: true }).click();
  await dialog.getByRole('textbox', { name: '需求文档 2 正文' }).pressSequentially('补充一份需求');
  assert.equal(await dialog.getByRole('textbox', { name: '需求文档 2 正文' }).isVisible(), true);
  await dialog.getByRole('button', { name: '移除此文档', exact: true }).last().click();
  await dialog.getByRole('button', { name: '创建工作项' }).click();
  await page.getByRole('heading', { name: '附件驱动的需求' }).waitFor();
  report.checks.push('new work item accepts a requirements document without a separate request text');
  await page.getByRole('tab', { name: '需求输入', exact: true }).click();
  await page.screenshot({ path: join(root, 'release/requirements-input-desktop.png'), fullPage: true });
  for (const width of [1440, 1000]) {
    await page.setViewportSize({ width, height: 940 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Horizontal overflow at ${width}px`);
  }
  assert.deepEqual(errors, []);
  report.checks.push('desktop layouts at 1440/1000px: no horizontal overflow or renderer errors');
  await writeFile(join(root, 'release/requirements-smoke.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  const page = await app.firstWindow().catch(() => undefined);
  if (page) await page.screenshot({ path: join(root, 'release/requirements-smoke-failure.png'), fullPage: true }).catch(() => undefined);
  throw error;
} finally { await app.close(); }
