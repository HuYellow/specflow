import { _electron as electron } from '@playwright/test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const makaRelease = JSON.parse(await readFile(join(root, 'config/maka-release.json'), 'utf8'));
const approvedMaka = makaRelease.status === 'approved' && typeof makaRelease.packageVersion === 'string';
const require = createRequire(import.meta.url);
const packaged = process.argv.includes('--packaged');
const arch = process.argv.includes('--arm64') ? 'arm64' : process.argv.includes('--x64') ? 'x64' : process.arch;
const binary = packaged ? (process.platform === 'win32' ? join(root, 'release/win-unpacked/SpecFlow.exe') : join(root, `release/${arch === 'arm64' ? 'mac-arm64' : 'mac'}/SpecFlow.app/Contents/MacOS/SpecFlow`)) : require('electron');
const userData = await mkdtemp(join(tmpdir(), 'specflow-desktop-test-'));
const env = { ...process.env, SPECFLOW_DESKTOP_USER_DATA: userData };
delete env.SPECFLOW_DATA_DIR; delete env.SPECFLOW_MAKA_ROOT; delete env.ELECTRON_RUN_AS_NODE;
const launch = () => electron.launch({ executablePath: binary, args: packaged ? [] : [root], cwd: tmpdir(), env, timeout: 90000 });
let application;
const record = { platform: process.platform, arch, packaged, userData, checks: [], testedAt: new Date().toISOString() };
try {
  application = await launch();
  let page = await application.firstWindow();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.getByRole('heading', { name: '为现有项目增加 CSV 导入' }).waitFor({ timeout: 60000 });
  const url = new URL(page.url()).origin;
  assert.match(url, /^http:\/\/127\.0\.0\.1:\d+$/);
  assert.equal((await fetch(`${url}/api/bootstrap`)).status, 403);
  assert.equal((await fetch(`${url}/`)).status, 403);
  assert.deepEqual(await page.evaluate(() => ({ require: typeof window.require, node: typeof window.process, bridge: typeof window.specflowDesktop?.pickRepository })), { require: 'undefined', node: 'undefined', bridge: 'function' });
  record.checks.push('bundled runtime launch from unrelated cwd; renderer isolation; backend authentication');
  // The second launch must focus the existing instance and exit without another backend.
  const second = spawn(binary, packaged ? [] : [root], { env, cwd: tmpdir(), windowsHide: true, stdio: 'ignore' });
  await new Promise((done, reject) => {
    const timer = setTimeout(() => { second.kill(); reject(new Error('Second instance did not exit')); }, 15000);
    second.on('error', reject); second.on('exit', () => { clearTimeout(timer); done(); });
  });
  assert.equal((await application.windows()).length, 1);
  record.checks.push('single instance');
  const bootstrap = await page.evaluate(async () => await (await fetch('/api/bootstrap')).json());
  const repositoryPath = bootstrap.projects[0].rootPath;
  await application.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, repositoryPath);
  await page.getByRole('button', { name: '打开 Git 仓库', exact: true }).click();
  await page.getByRole('button', { name: '选择仓库文件夹' }).click();
  const repositoryInput = page.getByRole('dialog').getByRole('textbox').first();
  await repositoryInput.waitFor();
  assert.equal(await repositoryInput.inputValue(), repositoryPath);
  await page.getByRole('button', { name: '关闭对话框' }).click();
  record.checks.push('native repository selection bridge (dialog selection stubbed)');
  if (!approvedMaka) {
    await page.getByRole('button', { name: /工程设置/ }).first().click();
    const settings = page.getByRole('dialog');
    await settings.getByText(makaRelease.reason, { exact: true }).waitFor();
    assert.equal(await settings.getByRole('button', { name: '添加连接' }).isDisabled(), true);
    await settings.getByRole('button', { name: '关闭对话框' }).click();
    record.checks.push('runtime unavailability is visible and connection creation is disabled');
  }
  const completed = await page.evaluate(async () => {
    const get = async path => { const r = await fetch(`/api${path}`); const body = await r.json(); if (!r.ok) throw new Error(JSON.stringify(body)); return body; };
    const boot = await get('/bootstrap');
    const itemId = boot.workItems[0].id;
    const post = async (path, body = {}) => { const r = await fetch(`/api${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Specflow-Token': boot.token, 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(body) }); const result = await r.json(); if (!r.ok) throw new Error(JSON.stringify(result)); return result; };
    const snapshot = () => get(`/work-items/${itemId}`);
    const run = async nodeId => {
      const state = await snapshot(); const node = state.nodes.find(n => n.nodeId === nodeId);
      await post(`/node-runs/${node.id}/attempts`, { expectedRevision: node.revision });
      const deadline = Date.now() + 60000;
      while (Date.now() < deadline) {
        const current = (await snapshot()).nodes.find(n => n.id === node.id);
        if (current.execution === 'completed') { if (current.gate === 'blocked') throw new Error(JSON.stringify(current)); return current; }
        if (current.execution === 'waiting_interaction' && nodeId === 'clarify') return current;
        if (current.execution === 'failed') throw new Error(JSON.stringify(current));
        await new Promise(done => setTimeout(done, 150));
      }
      throw new Error(`Stage ${nodeId} timed out`);
    };
    const accept = async logicalId => { const a = (await snapshot()).artifacts.find(a => a.logicalId === logicalId); await post(`/artifacts/${a.id}/accept`, { expectedRevision: a.revision }); };
    const clarify = async () => {
      const node = await run('clarify');
      for (let round = 0; round < 5; round++) {
        let state = await snapshot(), session = state.clarifications.filter(s => s.nodeRunId === node.id).at(-1);
        if (session.state === 'completed') return;
        if (session.state === 'waiting_answers') await post('/clarifications/' + session.id + '/answers', { expectedRevision: session.revision, answers: session.questions.filter(q => !q.answer).map(q => ({ questionId: q.id, answer: q.options[0] || '确认按规格执行' })) });
        const deadline = Date.now() + 30000;
        while (Date.now() < deadline) {
          state = await snapshot(); session = state.clarifications.find(s => s.id === session.id);
          const current = state.nodes.find(n => n.id === node.id);
          if (current.gate === 'blocked' && current.execution === 'completed') throw new Error(JSON.stringify(current));
          if (session.state !== 'analyzing') break;
          await new Promise(done => setTimeout(done, 150));
        }
      }
      throw new Error('Clarification did not finish');
    };
    for (const [stage, review, artifact] of [['specify', 'review-spec', 'spec'], ['plan', 'review-plan', 'plan'], ['tasks', 'review-tasks', 'tasks']]) { await run(stage); if (stage === 'specify') await clarify(); await run(review); await accept(artifact); }
    for (const stage of ['implement', 'verify', 'review-code', 'converge', 'review-converge']) await run(stage);
    await accept('convergence');
    const state = await snapshot(); await post(`/code-candidates/${state.candidates.at(-1).id}/accept`);
    const final = await snapshot();
    return { item: final.item, evidence: final.evidence, run: final.runs[0] };
  });
  assert.equal(completed.item.status, 'accepted');
  assert.equal(completed.run.state, 'completed');
  assert.ok(completed.evidence.length > 0);
  assert.ok(completed.evidence.every(e => e.status === 'passed' && e.exitCode === 0));
  assert.ok(completed.evidence.every(e => e.environment.includes('Node v24.19.0')));
  const code = await readFile(join(completed.item.workspace, 'csv.js'), 'utf8');
  assert.ok(code.includes('Unclosed quoted field'));
  record.checks.push('complete CSV engineering workflow; bundled Node tests; Git acceptance');
  const maka = await page.evaluate(async () => await (await fetch('/api/backend/targets')).json());
  if (approvedMaka) {
    assert.equal(maka.maka.available, true, JSON.stringify(maka.maka));
    record.checks.push('bundled official Maka Host startup and plugin install');
  } else {
    assert.equal(maka.maka.available, false);
    assert.ok(maka.maka.reason.includes('正式 npm'));
    record.checks.push('unavailable formal Maka is reported; no dev fallback');
  }
  const exportPath = join(userData, 'evidence.json');
  await application.evaluate(({ dialog }, path) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: path }); }, exportPath);
  await page.getByRole('button', { name: '导出工程记录' }).click();
  await page.waitForTimeout(500);
  const exported = JSON.parse(await readFile(exportPath, 'utf8'));
  assert.equal(exported.format, 'specflow-evidence-v1');
  assert.equal(exported.item.status, 'accepted');
  record.checks.push('native save dialog bridge and evidence export (dialog selection stubbed)');
  await mkdir(join(root, 'release'), { recursive: true });
  await page.screenshot({ path: join(root, `release/desktop-${process.platform}-${arch}.png`) });
  assert.deepEqual(errors, []);
  await application.close(); application = undefined;
  await assert.rejects(fetch(`${url}/api/bootstrap`));
  record.checks.push('normal exit closes backend listener');
  application = await launch(); page = await application.firstWindow();
  await page.getByRole('heading', { name: '为现有项目增加 CSV 导入' }).waitFor({ timeout: 60000 });
  const persisted = await page.evaluate(async () => await (await fetch('/api/bootstrap')).json());
  assert.equal(persisted.workItems[0].id, completed.item.id);
  assert.equal(persisted.workItems[0].status, 'accepted');
  const restartedUrl = new URL(page.url()).origin;
  const desktopPid = await application.evaluate(() => process.pid);
  record.desktopPid = desktopPid;
  record.launcherPid = application.process().pid;
  process.kill(desktopPid, 'SIGKILL');
  const crashDeadline = Date.now() + 15000;
  let listenerClosed = false;
  while (Date.now() < crashDeadline) {
    try { await fetch(`${restartedUrl}/api/bootstrap`, { signal: AbortSignal.timeout(1000) }); }
    catch { listenerClosed = true; break; }
    await new Promise(done => setTimeout(done, 150));
  }
  assert.equal(listenerClosed, true, 'Backend must shut down when its desktop parent dies');
  application = undefined;
  record.checks.push('restart retains accepted work item');
  record.checks.push('desktop crash closes backend listener through owner watchdog or IPC disconnect');
  record.passed = true;
} catch (error) {
  record.passed = false; record.error = String(error.stack || error);
  console.error(error);
  process.exitCode = 1;
} finally {
  if (application) await application.close().catch(() => {});
  await mkdir(join(root, 'release'), { recursive: true });
  await writeFile(join(root, `release/desktop-smoke-${process.platform}-${arch}.json`), JSON.stringify(record, null, 2));
  console.log(JSON.stringify(record, null, 2));
}
