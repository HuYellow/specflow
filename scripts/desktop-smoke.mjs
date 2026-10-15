import { _electron as electron } from '@playwright/test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { cp, mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const root = resolve(import.meta.dirname, '..');
const makaRelease = JSON.parse(await readFile(join(root, 'config/maka-release.json'), 'utf8'));
const approvedMaka = makaRelease.status === 'approved' && typeof makaRelease.packageVersion === 'string';
const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);
const executableIndex = process.argv.indexOf('--executable');
const explicitExecutable = executableIndex === -1 ? undefined : process.argv[executableIndex + 1];
if (executableIndex !== -1 && (!explicitExecutable || !isAbsolute(explicitExecutable))) throw new Error('--executable requires an absolute path to an installed SpecFlow executable.');
const packaged = process.argv.includes('--packaged') || !!explicitExecutable;
const arch = process.argv.includes('--arm64') ? 'arm64' : process.argv.includes('--x64') ? 'x64' : process.arch;
const sourceBinary = explicitExecutable || (packaged ? (process.platform === 'win32' ? join(root, 'release/win-unpacked/SpecFlow.exe') : join(root, `release/${arch === 'arm64' ? 'mac-arm64' : 'mac'}/SpecFlow.app/Contents/MacOS/SpecFlow`)) : require('electron'));
let binary = sourceBinary;
const userData = await mkdtemp(join(tmpdir(), 'specflow-desktop-test-'));
const env = { ...process.env, SPECFLOW_DESKTOP_USER_DATA: userData };
delete env.SPECFLOW_DATA_DIR; delete env.SPECFLOW_MAKA_ROOT; delete env.ELECTRON_RUN_AS_NODE;
delete env.NODE_OPTIONS; delete env.NODE_PATH;
const launch = () => electron.launch({ executablePath: binary, args: packaged ? [] : [root], cwd: tmpdir(), env, timeout: 90000 });
let application;
const record = { platform: process.platform, arch, packaged, sourceExecutablePath: sourceBinary, executablePath: binary, userData, checks: [], testedAt: new Date().toISOString() };
try {
  if (packaged && !explicitExecutable) {
    // A package below this repository can accidentally resolve missing modules from
    // the development node_modules. Exercise the full package outside that tree.
    const isolationDirectory = await mkdtemp(join(tmpdir(), 'specflow-packaged-test-'));
    const fromWorkspace = relative(root, isolationDirectory);
    assert.ok(isAbsolute(fromWorkspace) || fromWorkspace === '..' || fromWorkspace.startsWith(`..${sep}`), 'The packaged smoke directory must be outside the workspace');
    const sourceApplication = process.platform === 'win32' ? dirname(sourceBinary) : resolve(sourceBinary, '../../..');
    const isolatedApplication = join(isolationDirectory, basename(sourceApplication));
    record.isolatedPackageDirectory = isolatedApplication;
    await cp(sourceApplication, isolatedApplication, { recursive: true, verbatimSymlinks: true });
    binary = join(isolatedApplication, relative(sourceApplication, sourceBinary));
    record.executablePath = binary;
    record.checks.push('complete packaged application copied outside the workspace before launch');
  }
  const resourceDirectory = packaged
    ? (process.platform === 'win32' ? join(dirname(binary), 'resources') : resolve(dirname(binary), '../Resources'))
    : join(root, '.tools/desktop');
  const backendDirectory = join(resourceDirectory, packaged ? 'specflow' : 'resources');
  const runtimeDirectory = join(resourceDirectory, 'runtime');
  const nodeBinary = join(runtimeDirectory, process.platform === 'win32' ? 'node.exe' : 'bin/node');
  const npmCli = join(runtimeDirectory, process.platform === 'win32' ? 'node_modules/npm/bin/npm-cli.js' : 'lib/node_modules/npm/bin/npm-cli.js');
  // Resolve and load with the shipped Node, from the same directory as server.mjs.
  // Check ownership as well as loading, even when testing a development package.
  const dependencyProbe = await execFileAsync(nodeBinary, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import { realpathSync } from 'node:fs';
    import { isAbsolute, join, relative, sep } from 'node:path';
    import { fileURLToPath } from 'node:url';
    const dependencyRoot = realpathSync(join(process.cwd(), 'node_modules'));
    const dependencies = {};
    for (const name of ['fastify', '@fastify/static', 'yaml', 'zod']) {
      const url = import.meta.resolve(name);
      const path = realpathSync(fileURLToPath(url));
      const local = relative(dependencyRoot, path);
      assert.ok(local && !isAbsolute(local) && local !== '..' && !local.startsWith('..' + sep), name + ' must resolve inside bundled node_modules: ' + path);
      await import(url);
      dependencies[name] = path;
    }
    console.log(JSON.stringify({ node: process.version, dependencies }));
  `], { cwd: backendDirectory, env, windowsHide: true, timeout: 30000 });
  const npmProbe = await execFileAsync(nodeBinary, [npmCli, '--version'], { cwd: backendDirectory, env, windowsHide: true, timeout: 30000 });
  record.bundledRuntime = { nodeBinary, npmCli, ...JSON.parse(dependencyProbe.stdout), npmVersion: npmProbe.stdout.trim() };
  assert.match(record.bundledRuntime.npmVersion, /^\d+\.\d+\.\d+$/);
  record.checks.push('bundled Node loads backend dependencies from its own package; bundled npm CLI and dependencies execute');
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
  const updateMenus = await application.evaluate(({ Menu }) => {
    const menu = Menu.getApplicationMenu();
    return ['specflow-update-check', 'specflow-update-download', 'specflow-update-install'].map(id => {
      const item = menu?.getMenuItemById(id);
      return { id, label: item?.label, enabled: item?.enabled };
    });
  });
  assert.deepEqual(updateMenus, [
    { id: 'specflow-update-check', label: '检查更新…', enabled: true },
    { id: 'specflow-update-download', label: '下载更新…', enabled: false },
    { id: 'specflow-update-install', label: '重启并安装更新…', enabled: false },
  ]);
  record.checks.push('native update menu is available; downloading and installation require an available/verified update');
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
  await page.locator('summary[aria-label="更多工作项操作"]').click();
  await page.getByRole('button', { name: '导出工程记录' }).click();
  await page.waitForTimeout(500);
  const exported = JSON.parse(await readFile(exportPath, 'utf8'));
  assert.equal(exported.format, 'specflow-evidence-v1');
  assert.equal(exported.item.status, 'accepted');
  record.checks.push('native save dialog bridge and evidence export (dialog selection stubbed)');
  await page.locator('summary[aria-label="更多工作项操作"]').click();
  await page.getByRole('button', { name: '查看交付证据', exact: true }).waitFor();
  assert.equal(await page.locator('.flow-conditions').count(), 0);
  await page.getByRole('tab', { name: /^文档产物/ }).click();
  assert.equal(await page.getByRole('button', { name: '导入文档', exact: true }).isDisabled(), true);
  assert.equal(await page.getByRole('textbox', { name: '评论内容', exact: true }).getAttribute('readonly'), '');
  await page.getByRole('button', { name: 'AI 执行文档', exact: true }).click();
  await page.getByRole('button', { name: '查看原文', exact: true }).click();
  assert.equal(await page.getByRole('textbox', { name: '文档正文', exact: true }).getAttribute('readonly'), '');
  await page.getByRole('tab', { name: '代码与验证', exact: true }).click();
  await page.getByRole('status', { name: '代码已接纳', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: '重新验证', exact: true }).isDisabled(), true);
  await page.getByRole('tab', { name: '开发流程', exact: true }).click();
  record.checks.push('accepted item is read-only: no dispatch readiness, document writes or verification; reading, original text and delivery evidence remain available');
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
