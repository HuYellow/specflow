import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fixture, acceptedDocuments, runNode } from './helpers.ts';

test('automation cancellation during asynchronous readiness prevents the next attempt', async () => {
  const f = await fixture();
  let release!: () => void, entered!: () => void;
  const waiting = new Promise<void>(done => { entered = done; });
  const gate = new Promise<void>(done => { release = done; });
  try {
    const backend = f.service.registry.require('sandbox'), start = backend.start.bind(backend); let starts = 0;
    backend.start = async (ref, input) => { starts++; return start(ref, input); };
    const readiness = f.service.readiness.bind(f.service);
    let first = true;
    f.service.readiness = async id => {
      const result = await readiness(id);
      if (first) { first = false; entered(); await gate; }
      return result;
    };
    const run = f.store.list('runs')[0];
    const automation = await f.service.automation.startAutomation(run.id, run.revision, { autoAdvance: true, autoRepair: false, maxRepairRounds: 2 });
    await waiting;
    await f.service.automation.stopAutomation(automation.id);
    release();
    await f.service.waitForIdle();
    const attempts = f.store.list('attempts');
    assert.equal(starts, 0, JSON.stringify({ automation: f.store.get('automationRuns', automation.id), attempts: attempts.map(a => ({ id: a.id, execution: a.execution, automationRunId: a.automationRunId })) }));
  } finally { release(); await f.cleanup(); }
});

test('replacing the workflow during awaited backend inspection cannot dispatch the paused run', async () => {
  const f = await fixture();
  let release!: () => void, entered!: () => void;
  const waiting = new Promise<void>(done => { entered = done; });
  const gate = new Promise<void>(done => { release = done; });
  try {
    const backend = f.service.registry.require('sandbox'), inspect = backend.inspect.bind(backend), start = backend.start.bind(backend); let starts = 0;
    backend.start = async (ref, input) => { starts++; return start(ref, input); };
    let first = true;
    backend.inspect = async () => {
      const result = await inspect();
      if (first) { first = false; entered(); await gate; }
      return result;
    };
    const run = f.store.list('runs')[0];
    await f.service.automation.startAutomation(run.id, run.revision, { autoAdvance: true, autoRepair: false, maxRepairRounds: 2 });
    await waiting;
    let replacementBlocked = false;
    try { f.service.createRun(run.workflowId); }
    catch (error) { replacementBlocked = (error as { code?: string }).code === 'WORKSPACE_BUSY'; }
    release(); await f.service.waitForIdle();
    if (!replacementBlocked) {
      const oldNodeIds = new Set(f.store.list('nodes', n => n.workflowRunId === run.id).map(n => n.id));
      assert.equal(starts, 0, `paused workflow dispatched after replacement: ${JSON.stringify(f.store.list('attempts', a => oldNodeIds.has(a.nodeRunId)).map(a => ({ execution: a.execution, error: a.error })))}`);
    }
  } finally { release(); await f.cleanup(); }
});

test('stopping automation cancels its active verification and prevents the next command', { timeout: 20000 }, async () => {
  const f = await fixture();
  try {
    await acceptedDocuments(f); await runNode(f, 'implement');
    const first = join(f.root, 'first-started'), second = join(f.root, 'second-started');
    const project = f.store.list('projects')[0];
    f.store.update('projects', project.id, { commands: [
      { id: 'test', executable: 'node', args: ['-e', `require('fs').writeFileSync(${JSON.stringify(first)},'started');setTimeout(()=>{},1000)`], timeoutMs: 3000 },
      { id: 'second', executable: 'node', args: ['-e', `require('fs').writeFileSync(${JSON.stringify(second)},'started')`], timeoutMs: 1000 },
    ] });
    const run = f.store.list('runs')[0];
    const auto = await f.service.automation.startAutomation(run.id, run.revision, { autoAdvance: true, autoRepair: false, maxRepairRounds: 2 });
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) { try { await readFile(first); break; } catch { await new Promise(done => setTimeout(done, 10)); } }
    await access(first);
    await f.service.automation.stopAutomation(auto.id);
    await f.service.waitForIdle();
    await assert.rejects(access(second));
  } finally { await f.cleanup(); }
});
