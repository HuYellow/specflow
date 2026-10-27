import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { build } from 'vite';
import { createEngineeringRuntime } from '../packages/specflow-core/index.ts';
import { SandboxBackend } from '../packages/specflow-core/sandbox-backend.ts';
import { createApp } from '../apps/server/src/app.ts';
import { createPolicy } from '../packages/specflow-core/execution-policy.ts';
import { buildContextManifest } from '../packages/specflow-core/context.ts';

// Isolated UI acceptance. All model execution uses a deterministic local fixture.
class ControlledSandbox extends SandboxBackend {
  hold = false;
  controlled = new Map();
  async start(ref, input) {
    if (!this.hold) return super.start(ref, input);
    const snapshot = { state: 'running', ref };
    this.controlled.set(ref.sessionId, snapshot); return snapshot;
  }
  async query(ref) { return this.controlled.get(ref.sessionId) || super.query(ref); }
  async *observe(ref) {
    if (!this.controlled.has(ref.sessionId)) { yield* super.observe(ref); return; }
    while (this.controlled.get(ref.sessionId)?.state === 'running') await new Promise(resolve => setTimeout(resolve, 25));
    yield { kind: 'terminal', snapshot: await this.query(ref) };
  }
  async stop(ref) {
    if (this.controlled.has(ref.sessionId)) this.controlled.set(ref.sessionId, { state: 'cancelled', ref, terminalEventId: `${ref.turnId}:stopped` });
    else await super.stop(ref);
  }
}

const root = resolve(import.meta.dirname, '..');
const output = join(root, 'docs/implementation/agent-loop-qa');
const dataDir = await mkdtemp(join(tmpdir(), 'specflow-agent-loop-ui-'));
const report = { testedAt: new Date().toISOString(), modelCalls: 0, browser: 'installed Chrome (headless)', screenshotRedaction: { selectors: ['.workspace-directory', '.workspace-option small'], reason: 'Mask machine-specific temporary workspace paths in published screenshots only.' }, checks: [], surfaces: [], requests: [], errors: [] };
async function capture(page, path) {
  await page.screenshot({ path, fullPage: true, mask: [page.locator('.workspace-directory, .workspace-option small')], maskColor: '#dfe6df' });
}
await mkdir(output, { recursive: true });
const backend = new ControlledSandbox();
const runtime = await createEngineeringRuntime({ dataDir, backends: { sandbox: backend }, defaultBackend: 'sandbox' });
let app, browser;
try {
  await build({ configFile: join(root, 'vite.config.ts'), logLevel: 'error', build: { outDir: join(dataDir, 'web'), emptyOutDir: true } });
  const { service, store } = runtime;
  await service.seedDemo('en');
  const item = store.list('workItems')[0], project = store.get('projects', item.projectId);
  const workflowRun = target => store.list('runs', run => run.workItemId === target.id).at(-1);
  const nodeFor = (target, id) => store.list('nodes', node => node.workflowRunId === workflowRun(target).id && node.nodeId === id)[0];
  const runNode = async (target, id) => { const node = nodeFor(target, id); await service.startNode(node.id, node.revision); await service.waitForIdle(); return store.get('nodes', node.id); };
  const accept = async (target, logicalId) => { const artifact = store.list('artifacts', artifact => artifact.workItemId === target.id && artifact.logicalId === logicalId)[0]; await service.acceptArtifact(artifact.id, artifact.revision); };
  await runNode(item, 'specify'); await runNode(item, 'clarify');
  const clarification = store.list('clarifications', value => value.workItemId === item.id).at(-1);
  await service.answerClarification(clarification.id, clarification.revision, clarification.questions.map(question => ({ questionId: question.id, answer: question.options[0] })));
  await service.waitForIdle();
  for (const [review, artifact, next] of [['review-spec', 'spec', 'plan'], ['review-plan', 'plan', 'tasks'], ['review-tasks', 'tasks', 'implement']]) {
    await runNode(item, review); await accept(item, artifact); await runNode(item, next);
  }
  const implementation = nodeFor(item, 'implement');
  assert.equal(implementation.execution, 'completed');
  const originalAttempt = store.get('attempts', implementation.currentAttemptId);
  const { id: ignoredId, revision: ignoredRevision, createdAt: ignoredCreatedAt, updatedAt: ignoredUpdatedAt, ...attemptData } = originalAttempt;
  const displayAttempt = store.create('attempts', { ...attemptData, number: originalAttempt.number + 1, execution: 'reconciling', output: undefined,
    target: { backend: 'opencode', connectionId: 'ui-fixture', connectionSlug: 'UI fixture', model: 'No model calls' },
    stopReason: 'user_cancelled', stopRequestedAt: new Date().toISOString(), terminalConfirmedAt: undefined, verificationPending: true,
    deadlineAt: new Date(Date.now() + 120000).toISOString(),
    policy: createPolicy({}, { available: true, version: 'ui-fixture', canResume: false, canInteract: true, readOnlyReview: true, stepLimit: 'observed' }),
    usageSummary: { inputTokens: 120, outputTokens: null, costUsd: null, known: { inputTokens: 120, outputTokens: 0, costUsd: 0 }, unknownCounts: { inputTokens: 1, outputTokens: 2, costUsd: 2 }, completeness: 'partial', executions: 2, meters: 2 },
    contextManifest: buildContextManifest([{ sourceId: 'requirements', content: 'Handle empty input without losing records.' }], { prompt: 'Handle empty input without losing records.' }),
  });
  // A historical display-only record; it has no provider connection or running process.
  store.update('attempts', displayAttempt.id, { candidateId: undefined, bindingId: undefined, writeOccupancy: 'released' });
  app = await createApp(service, { staticRoot: join(dataDir, 'web') });
  const origin = await app.listen({ host: '127.0.0.1', port: 0 });
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-US' });
  await context.addInitScript(() => localStorage.setItem('specflow-locale', 'en'));
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  page.on('pageerror', error => report.errors.push(String(error)));
  page.on('request', request => { if (request.method() === 'POST' && /(?:repair|automation|stop-verification|confirm-verification-stopped)/.test(request.url())) report.requests.push({ path: new URL(request.url()).pathname, body: request.postDataJSON() }); });
  const url = (target, view, extra = {}) => `${origin}/?${new URLSearchParams({ project: project.id, item: target.id, view, ...extra })}`;
  async function ready(target) { await expect(page.locator('.workitem-heading h1')).toHaveText(target.name); await expect(page.locator('.sync-bar')).toHaveCount(0); }
  async function audit(name) {
    const result = await page.evaluate(() => {
      const chinese = [], walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node; (node = walker.nextNode());) {
        const element = node.parentElement;
        if (!element || element.closest('script,style,pre,code,textarea,input,option') || !element.checkVisibility()) continue;
        if (/\p{Script=Han}/u.test(node.textContent)) chinese.push(node.textContent.trim());
      }
      return { viewport: { width: innerWidth, height: innerHeight }, bodyWidth: document.documentElement.scrollWidth, chinese };
    });
    assert.ok(result.bodyWidth <= result.viewport.width + 1, `${name}: horizontal overflow ${result.bodyWidth}`);
    assert.deepEqual(result.chinese, [], `${name}: untranslated app UI`);
    await capture(page, join(output, `${name}.png`));
    report.surfaces.push({ name, ...result, screenshot: `${name}.png` });
  }
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(url(item, 'runs', { attempt: displayAttempt.id })); await ready(item);
    await expect(page.getByRole('region', { name: 'Run details' })).toContainText('120 + 1 unknown measurements');
    await expect(page.locator('.execution-facts')).toContainText('Requesting a stop');
    await expect(page.locator('.execution-facts')).not.toContainText('$0');
    await expect(page.getByRole('button', { name: 'Resume original execution', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Confirm all verification processes have ended', exact: true })).toBeVisible();
    await page.getByText('Context manifest for this attempt', { exact: true }).click();
    await audit(`execution-facts-${width}`);
  }
  report.checks.push('1440px and 390px show partial token counts, unknown cost, unconfirmed stop, context manifest, and explicit process confirmation without horizontal overflow.');
  // Remove the synthetic occupancy before testing real isolated verification.
  store.update('attempts', displayAttempt.id, { verificationPending: false, execution: 'cancelled', terminalConfirmedAt: new Date().toISOString() });
  const currentProject = store.get('projects', project.id);
  store.update('projects', project.id, { commands: [{ id: 'test', executable: 'node', args: ['-e', 'setInterval(() => {}, 1000)'], timeoutMs: 120000 }] }, currentProject.revision);
  let verifyNode = nodeFor(item, 'verify');
  await service.startNode(verifyNode.id, verifyNode.revision);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(url(item, 'flow', { node: verifyNode.id, mode: 'pinned' })); await ready(item);
  await expect(page.getByRole('button', { name: 'Stop verification commands', exact: true })).toBeEnabled();
  await audit('verification-running-1440');
  await page.getByRole('button', { name: 'Stop verification commands', exact: true }).click();
  await expect.poll(() => store.get('nodes', verifyNode.id).execution).toBe('cancelled');
  await service.waitForIdle();
  report.checks.push('The standalone verification stop button cancels an actual local Node timer process; no subsequent command starts.');
  store.update('nodes', verifyNode.id, { execution: 'reconciling', verificationUnconfirmed: true, gate: 'blocked', blockers: ['验证期间中断，请核对本机验证进程停止后再重新验证'] });
  await page.reload(); await ready(item);
  const confirmButton = page.getByRole('button', { name: 'Confirm all verification processes have ended', exact: true });
  await expect(confirmButton).toBeEnabled();
  await page.setViewportSize({ width: 390, height: 1000 });
  await audit('verification-unconfirmed-390');
  const confirmationsBefore = report.requests.filter(request => request.path.includes('confirm-verification-stopped')).length;
  page.once('dialog', dialog => dialog.dismiss()); await confirmButton.click();
  assert.equal(report.requests.filter(request => request.path.includes('confirm-verification-stopped')).length, confirmationsBefore);
  assert.equal(store.get('nodes', verifyNode.id).verificationUnconfirmed, true);
  page.once('dialog', dialog => dialog.accept()); await confirmButton.click();
  await expect.poll(() => store.get('nodes', verifyNode.id).verificationUnconfirmed).toBe(false);
  assert.ok(report.requests.at(-1).body.reason.includes('all their child processes have ended'));
  report.checks.push('Dismissing process confirmation sends no request; accepting submits the current revision and explicit reason, and only then clears the unresolved verification block.');
  backend.hold = true;
  for (const width of [1440, 390]) {
    const target = await service.createWorkItem(project.id, `Automation UI ${width}`, 'Verify the automatic progression controls.', 'feature', [], 'en');
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(url(target, 'flow')); await ready(target);
    const controls = page.locator('.automation-controls');
    await controls.locator('summary').click();
    const repairCheckbox = controls.getByRole('checkbox', { name: 'Allow bounded repair during progression' });
    await expect(repairCheckbox).not.toBeChecked();
    assert.equal(store.list('automationRuns', run => run.workItemId === target.id).length, 0);
    await audit(`automation-manual-${width}`);
    await repairCheckbox.check();
    await controls.getByRole('button', { name: 'Run until input is needed', exact: true }).click();
    await expect(controls.getByRole('button', { name: 'Stop automatic progression', exact: true })).toBeEnabled();
    const manualDispatch = page.getByRole('button', { name: 'Run this step', exact: true });
    if (await manualDispatch.count()) await expect(manualDispatch).toBeDisabled();
    assert.equal(store.list('automationRuns', run => run.workItemId === target.id).at(-1).settings.autoRepair, true);
    await audit(`automation-active-${width}`);
    await controls.getByRole('button', { name: 'Stop automatic progression', exact: true }).click();
    await expect.poll(() => store.list('automationRuns', run => run.workItemId === target.id).at(-1).state).toBe('cancelled');
    await service.waitForIdle();
  }
  report.checks.push('Both viewport sizes default to manual operation. Enabling bounded repair is an explicit checkbox choice; starting sends autoRepair=true and stopping cancels the controller and its controlled local execution.');
  backend.hold = false;
  const repairItem = await service.createWorkItem(project.id, 'Repair UI', 'Verify repair controls.', 'feature', [], 'en');
  const produced = await runNode(repairItem, 'specify');
  store.update('nodes', produced.id, { gate: 'blocked', blockers: ['A repair is needed in this controlled fixture.'] });
  backend.hold = true;
  await page.goto(url(repairItem, 'flow', { node: produced.id, mode: 'pinned' })); await ready(repairItem);
  const controls = page.locator('.automation-controls'); await controls.locator('summary').click();
  await expect(controls.getByRole('button', { name: 'Repair the current artifact', exact: true })).toBeEnabled();
  await controls.getByRole('button', { name: 'Repair the current artifact', exact: true }).click();
  await expect(controls.getByRole('button', { name: 'Stop automatic repair', exact: true })).toBeEnabled();
  await controls.getByRole('button', { name: 'Stop automatic repair', exact: true }).click();
  await expect.poll(() => store.list('repairCycles', cycle => cycle.workItemId === repairItem.id).at(-1).state).toBe('cancelled');
  await service.waitForIdle();
  report.checks.push('The repair action creates a bounded cycle for the failed producer; the separate stop action cancels that cycle. The UI leaves repair mode selection to the service.');
  assert.deepEqual(report.errors, []);
  report.success = true;
  await rm(join(output, 'failure.png'), { force: true });
  console.log(`Agent loop UI smoke passed: ${report.surfaces.length} surfaces. ${join(output, 'report.json')}`);
} catch (error) {
  report.success = false; report.failure = error.stack || String(error); process.exitCode = 1;
  const page = browser?.contexts()[0]?.pages()[0];
  if (page && !page.isClosed()) await capture(page, join(output, 'failure.png')).catch(() => {});
  console.error(report.failure);
} finally {
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
  for (const snapshot of backend.controlled.values()) if (snapshot.state === 'running') await backend.stop(snapshot.ref);
  await browser?.close(); await app?.close(); await runtime.close();
  const resolved = resolve(dataDir);
  assert.ok(resolved.startsWith(resolve(tmpdir())) && basename(resolved).startsWith('specflow-agent-loop-ui-'));
  await rm(resolved, { recursive: true, force: true });
}
