import { _electron as electron, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..'), require = createRequire(import.meta.url);
const packaged = process.argv.includes('--packaged');
const binary = packaged ? process.platform === 'win32' ? join(root, 'release/win-unpacked/SpecFlow.exe') : join(root, `release/${process.arch === 'arm64' ? 'mac-arm64' : 'mac'}/SpecFlow.app/Contents/MacOS/SpecFlow`) : require('electron');
const userData = await mkdtemp(join(tmpdir(), 'specflow-clarify-test-'));
const env = { ...process.env, SPECFLOW_DESKTOP_USER_DATA: userData };
delete env.SPECFLOW_DATA_DIR; delete env.SPECFLOW_MAKA_ROOT; delete env.ELECTRON_RUN_AS_NODE;
const launch = () => electron.launch({ executablePath: binary, args: packaged ? [] : [root], env, cwd: tmpdir(), timeout: 90000 });
let app = await launch();
const report = { packaged, platform: process.platform, testedAt: new Date().toISOString(), userData, checks: [] };
try {
  let page = await app.firstWindow(); const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.getByRole('heading', { name: '为现有项目增加 CSV 导入' }).waitFor({ timeout: 60000 });
  const itemId = await page.evaluate(async () => (await (await fetch('/api/bootstrap')).json()).workItems[0].id);
  const snapshot = () => page.evaluate(async id => (await (await fetch(`/api/work-items/${id}`)).json()), itemId);
  const post = (path, body) => page.evaluate(async input => {
    const boot = await (await fetch('/api/bootstrap')).json();
    const response = await fetch(`/api${input.path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Specflow-Token': boot.token, 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(input.body) });
    const result = await response.json(); if (!response.ok) throw new Error(JSON.stringify(result)); return result;
  }, { path, body });
  const wait = async predicate => { const deadline = Date.now() + 30000; while (Date.now() < deadline) { const state = await snapshot(); if (predicate(state)) return state; await new Promise(done => setTimeout(done, 100)); } throw new Error('Desktop clarification state did not settle'); };
  const select = async name => {
    const stage = page.locator('.flow-stage-select').filter({ hasText: new RegExp(`${name}$`) });
    const group = page.locator('.flow-step-group').filter({ has: stage });
    if (!await group.evaluate(element => element.open)) await group.locator(':scope > summary').click();
    await stage.click();
  };
  const run = async (id, name) => { await select(name); await page.getByRole('button', { name: /^(运行此步骤|运行所选步骤|创建新尝试|基于当前依据重新运行)$/ }).click(); return wait(state => { const node = state.nodes.find(n => n.nodeId === id); if (node.execution === 'failed' || (node.execution === 'completed' && node.gate === 'blocked')) throw new Error(JSON.stringify(node)); return node.execution === 'completed' || node.execution === 'waiting_interaction'; }); };
  await expect(page.locator('.flow-stage-select')).toHaveCount(13);
  report.checks.push('new default workflow has 13 stages, including independent clarification before specification review');

  await page.getByRole('button', { name: /工程设置/ }).first().click();
  let dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('项目章程文件', { exact: true })).toHaveValue('AGENT.md');
  const firstGuidance = '# 项目章程\n\nPOLICY-UI-101：CSV 错误输入必须抛出明确错误，并有独立测试。\n';
  await dialog.getByRole('textbox', { name: '项目章程正文', exact: true }).fill(firstGuidance);
  await dialog.getByRole('button', { name: '保存项目章程', exact: true }).click();
  await expect(dialog.getByRole('button', { name: '保存项目章程', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: '关闭对话框' }).click();
  let state = await snapshot(); assert.equal(state.project.guidance.files[0].content, firstGuidance);
  await run('specify', '需求规格');
  state = await snapshot(); assert.ok(state.attempts[0].prompt.includes('POLICY-UI-101'));
  assert.ok(state.attempts[0].guidance.files[0].name === 'AGENT.md');
  const review = state.nodes.find(n => n.nodeId === 'review-spec');
  const blocked = await page.evaluate(async id => (await (await fetch(`/api/node-runs/${id}/readiness`)).json()), review.id); assert.equal(blocked.ready, false);
  report.checks.push('guidance editor saves AGENT.md to the selected repository; model input includes its exact content; unclarified specification blocks review');

  await run('clarify', '需求澄清');
  const answerBox = () => page.getByRole('textbox', { name: '澄清答复 Q001', exact: true });
  await answerBox().waitFor();
  await expect(page.getByRole('button', { name: '提交答复并继续澄清' })).toBeDisabled();
  await answerBox().fill('抛出明确错误');
  // Leave immediately, before the 400 ms debounce, so the old mount flushes its draft.
  await page.getByRole('tab', { name: '需求输入', exact: true }).click();
  await page.getByRole('tab', { name: '开发流程', exact: true }).click();
  await expect(answerBox()).toHaveValue('抛出明确错误');
  await expect(page.getByText(/其他编辑者已更新答复草稿/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: '提交答复并继续澄清' })).toBeEnabled();
  await page.getByText('答复草稿已保存到工程记录', { exact: true }).waitFor();
  await expect(page.getByText(/其他编辑者已更新答复草稿/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: '提交答复并继续澄清' })).toBeEnabled();
  report.checks.push('rapid navigation before draft debounce retains answers, shares the pending session write across mounts and keeps submission enabled without a false revision conflict');
  await page.reload(); await answerBox().waitFor(); await expect(answerBox()).toHaveValue('抛出明确错误');
  const beforeRestart = await snapshot(), sessionId = beforeRestart.clarifications.at(-1).id;
  await app.close(); app = await launch(); page = await app.firstWindow(); page.on('pageerror', error => errors.push(String(error)));
  await answerBox().waitFor({ timeout: 60000 });
  await expect(answerBox()).toHaveValue('抛出明确错误');
  state = await snapshot(); assert.equal(state.clarifications.at(-1).id, sessionId); assert.equal(state.attempts.length, beforeRestart.attempts.length);
  report.checks.push('answer drafts survive page reload; desktop restart restores pending questions without another model dispatch');

  await answerBox().fill('抛出明确错误');
  await page.getByRole('button', { name: /工程设置/ }).first().click(); dialog = page.getByRole('dialog');
  const secondGuidance = firstGuidance + '\nPOLICY-UI-102：所有需求必须记录澄清决策。\n';
  await dialog.getByRole('textbox', { name: '项目章程正文', exact: true }).fill(secondGuidance);
  await dialog.getByRole('button', { name: '保存项目章程', exact: true }).click();
  await expect(dialog.getByRole('button', { name: '保存项目章程', exact: true })).toBeDisabled();
  await dialog.getByRole('button', { name: '关闭对话框' }).click();
  await page.getByText('旧问答依据已更新', { exact: true }).waitFor();
  await page.getByText('查看历史问答与答复草稿', { exact: true }).click();
  await page.getByText('抛出明确错误', { exact: true }).first().waitFor();
  state = await snapshot(); assert.equal(state.clarifications.find(s => s.id === sessionId).state, 'stale');
  assert.equal(state.attempts[0].guidance.files[0].content, firstGuidance);
  report.checks.push('guidance change invalidates pending questions and prior analysis while keeping original guidance and local answer draft readable');

  await run('specify', '需求规格'); await run('clarify', '需求澄清'); await answerBox().waitFor();
  await page.getByRole('button', { name: '抛出明确错误', exact: true }).click();
  if (await page.getByRole('button', { name: '关闭通知' }).isVisible()) await page.getByRole('button', { name: '关闭通知' }).click();
  await page.screenshot({ path: join(root, `release/clarification-${packaged ? 'packaged' : 'dev'}.png`), fullPage: true });
  await page.getByRole('button', { name: '提交答复并继续澄清' }).click();
  state = await wait(s => s.clarifications.at(-1).state === 'completed');
  const session = state.clarifications.at(-1), spec = state.revisions.find(r => r.id === session.resultSpecRevisionId);
  assert.ok(spec.content.includes('澄清记录') && spec.content.includes('答复：抛出明确错误'));
  assert.ok(state.attempts.at(-1).prompt.includes('POLICY-UI-102'));
  await run('review-spec', '规格复核');
  state = await snapshot(); const artifact = state.artifacts.find(a => a.logicalId === 'spec');
  await post(`/artifacts/${artifact.id}/accept`, { expectedRevision: artifact.revision });
  const plan = (await snapshot()).nodes.find(n => n.nodeId === 'plan');
  const ready = await page.evaluate(async id => (await (await fetch(`/api/node-runs/${id}/readiness`)).json()), plan.id); assert.equal(ready.ready, true);
  report.checks.push('UI answers are written to a new specification revision; review and human acceptance unlock engineering design');
  for (const width of [1440, 1000]) { await page.setViewportSize({ width, height: 940 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)); }
  assert.deepEqual(errors, []); report.checks.push('no renderer errors or horizontal overflow at supported desktop widths');
  await writeFile(join(root, `release/clarify-smoke-${packaged ? 'packaged' : 'dev'}.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} catch (error) { const page = await app.firstWindow().catch(() => undefined); if (page) await page.screenshot({ path: join(root, 'release/clarify-smoke-failure.png'), fullPage: true }).catch(() => undefined); throw error; }
finally { await app.close(); }
