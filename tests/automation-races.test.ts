import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, runNode } from './helpers.ts';

function barrier() {
  let enter!: () => void, release!: () => void;
  const entered = new Promise<void>(done => { enter = done; });
  const gate = new Promise<void>(done => { release = done; });
  return { enter, release, gate, wait: async () => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { await Promise.race([entered, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Expected asynchronous boundary was not reached')), 15000); })]); }
    finally { clearTimeout(timer); }
  } };
}

test('automation cancellation during asynchronous readiness prevents an attempt and preserves cancelled state', async () => {
  const f = await fixture(), boundary = barrier();
  try {
    const backend = f.service.registry.require('sandbox'), start = backend.start.bind(backend); let starts = 0;
    backend.start = async (ref, input) => { starts++; return start(ref, input); };
    const readiness = f.service.readiness.bind(f.service); let first = true;
    f.service.readiness = async id => {
      const result = await readiness(id);
      if (first) { first = false; boundary.enter(); await boundary.gate; }
      return result;
    };
    const run = f.store.list('runs')[0];
    const automation = await f.service.automation.startAutomation(run.id, run.revision, { autoAdvance: true, autoRepair: false, maxRepairRounds: 2 });
    await boundary.wait(); await f.service.automation.stopAutomation(automation.id);
    boundary.release(); await f.service.waitForIdle();
    assert.equal(starts, 0);
    assert.equal(f.store.list('attempts').length, 0);
    assert.equal(f.store.get('automationRuns', automation.id).state, 'cancelled');
    assert.equal(f.store.get('automationRuns', automation.id).pauseReason, 'user_cancelled');
  } finally { boundary.release(); await f.cleanup(); }
});

test('replacing a workflow during backend inspection cannot dispatch the paused run', async () => {
  const f = await fixture(), boundary = barrier();
  try {
    const backend = f.service.registry.require('sandbox'), inspect = backend.inspect.bind(backend), start = backend.start.bind(backend); let starts = 0;
    backend.start = async (ref, input) => { starts++; return start(ref, input); };
    let first = true;
    backend.inspect = async () => {
      const result = await inspect();
      if (first) { first = false; boundary.enter(); await boundary.gate; }
      return result;
    };
    const run = f.store.list('runs')[0];
    await f.service.automation.startAutomation(run.id, run.revision, { autoAdvance: true, autoRepair: false, maxRepairRounds: 2 });
    await boundary.wait();
    let replacementBlocked = false;
    try { f.service.createRun(run.workflowId); }
    catch (error) { replacementBlocked = (error as { code?: string }).code === 'WORKSPACE_BUSY'; }
    boundary.release(); await f.service.waitForIdle();
    if (!replacementBlocked) {
      assert.equal(starts, 0);
      const oldNodeIds = new Set(f.store.list('nodes', n => n.workflowRunId === run.id).map(n => n.id));
      assert.equal(f.store.list('attempts', a => oldNodeIds.has(a.nodeRunId)).length, 0);
    }
  } finally { boundary.release(); await f.cleanup(); }
});

test('stopping automation while a repair is being prepared cannot create a cycle or overwrite cancellation', async () => {
  const f = await fixture(), boundary = barrier();
  try {
    const backend = f.service.registry.require('sandbox'), start = backend.start.bind(backend); let starts = 0;
    backend.start = async (ref, input) => {
      starts++; const result = await start(ref, input);
      if (input.node.id === 'specify') result.output = 'invalid output contract';
      return result;
    };
    await runNode(f, 'specify');
    const refresh = f.service.guidance.refresh.bind(f.service.guidance); let first = true;
    f.service.guidance.refresh = async projectId => {
      const result = await refresh(projectId);
      if (first) { first = false; boundary.enter(); await boundary.gate; }
      return result;
    };
    const run = f.store.list('runs')[0];
    const automation = await f.service.automation.startAutomation(run.id, run.revision, { autoAdvance: false, autoRepair: true, maxRepairRounds: 2 });
    await boundary.wait(); await f.service.automation.stopAutomation(automation.id);
    boundary.release(); await f.service.waitForIdle();
    assert.equal(starts, 1);
    assert.equal(f.store.list('repairCycles').length, 0);
    assert.equal(f.store.get('automationRuns', automation.id).state, 'cancelled');
    assert.equal(f.store.get('automationRuns', automation.id).pauseReason, 'user_cancelled');
  } finally { boundary.release(); await f.cleanup(); }
});

test('stopping repair during Git seed creation preserves the journal without activating or dispatching the candidate', async () => {
  const f = await fixture(), boundary = barrier();
  try {
    const workflow = f.store.list('workflows')[0];
    f.service.updateWorkflow(workflow.id, { ...workflow.definition, requireReview: false, requireClarification: false,
      nodes: workflow.definition.nodes.filter(node => ['implement', 'verify'].includes(node.id)).map(node => node.id === 'implement' ? { ...node, inputs: [], taskMode: false } : node) }, workflow.revision);
    f.service.createRun(workflow.id);
    const backend = f.service.registry.require('sandbox'), start = backend.start.bind(backend); let starts = 0;
    backend.start = async (ref, input) => {
      starts++; const result = await start(ref, input);
      if (input.node.id === 'implement') result.output = 'invalid output contract';
      return result;
    };
    const failed = await runNode(f, 'implement'), original = f.service.latestCandidate(f.item.id)!;
    const seed = f.service.workspaces.createFromSnapshot.bind(f.service.workspaces);
    f.service.workspaces.createFromSnapshot = async (...args) => {
      const result = await seed(...args); boundary.enter(); await boundary.gate; return result;
    };
    const cycle = await f.service.automation.startRepair(failed.id, failed.revision);
    await boundary.wait(); await f.service.automation.stopRepair(cycle.id);
    boundary.release(); await f.service.waitForIdle();
    assert.equal(starts, 1);
    assert.equal(f.store.get('repairCycles', cycle.id).state, 'cancelled');
    assert.equal(f.service.latestCandidate(f.item.id)?.id, original.id);
    assert.equal(f.store.list('attempts', a => a.repairCycleId === cycle.id).length, 0);
    const operation = f.store.list('candidateSnapshotOperations', op => op.repairCycleId === cycle.id)[0];
    assert.equal(operation.state, 'seeded', '已完成 Git 操作的事实保留，不能伪装激活或丢失现场');
    assert.ok(operation.workspace && operation.seedCommit);
    assert.equal(operation.candidateId, undefined);
  } finally { boundary.release(); await f.cleanup(); }
});

test('resuming automation at a clarification checkpoint keeps its owner and frozen settings', async () => {
  const f = await fixture();
  try {
    const run = f.store.list('runs')[0], settings = { autoAdvance: true, autoRepair: false, maxRepairRounds: 2 };
    const owner = await f.service.automation.startAutomation(run.id, run.revision, settings);
    await f.service.waitForIdle();
    assert.equal(f.store.get('automationRuns', owner.id).pauseReason, 'waiting_for_input');
    const currentRun = f.store.get('runs', run.id);
    await assert.rejects(f.service.automation.startAutomation(run.id, currentRun.revision, { ...settings, maxRepairRounds: 3 }), error => (error as { code?: string }).code === 'AUTOMATION_SCOPE_LOCKED');
    const resumed = await f.service.automation.startAutomation(run.id, currentRun.revision, settings);
    assert.equal(resumed.id, owner.id);
    await f.service.waitForIdle();
    assert.equal(f.store.list('automationRuns').length, 1);
    assert.equal(f.store.list('attempts').length, 2, '等待答复时恢复控制器不会重跑规格或澄清');
    assert.equal(f.store.get('automationRuns', owner.id).state, 'paused');
  } finally { await f.cleanup(); }
});

test('pausing a repair owner during Git preparation preserves its round and resumes the same journal', async () => {
  const f = await fixture(), boundary = barrier();
  try {
    const workflow = f.store.list('workflows')[0];
    f.service.updateWorkflow(workflow.id, { ...workflow.definition, requireReview: false, requireClarification: false,
      nodes: workflow.definition.nodes.filter(node => ['implement', 'verify'].includes(node.id)).map(node => node.id === 'implement' ? { ...node, inputs: [], taskMode: false } : node) }, workflow.revision);
    const run = f.service.createRun(workflow.id);
    const backend = f.service.registry.require('sandbox'), start = backend.start.bind(backend); let starts = 0;
    backend.start = async (ref, input) => {
      starts++; const result = await start(ref, input);
      if (starts === 1) result.output = 'invalid output contract';
      return result;
    };
    await runNode(f, 'implement'); const original = f.service.latestCandidate(f.item.id)!;
    const seed = f.service.workspaces.createFromSnapshot.bind(f.service.workspaces); let first = true;
    f.service.workspaces.createFromSnapshot = async (...args) => {
      const result = await seed(...args);
      if (first) { first = false; boundary.enter(); await boundary.gate; }
      return result;
    };
    const settings = { autoAdvance: false, autoRepair: true, maxRepairRounds: 1 };
    const owner = await f.service.automation.startAutomation(run.id, f.store.get('runs', run.id).revision, settings);
    await boundary.wait();
    f.store.update('automationRuns', owner.id, { state: 'paused', pauseReason: 'waiting_for_input' });
    boundary.release(); await f.service.waitForIdle();
    const cycle = f.store.list('repairCycles')[0], operation = f.store.list('candidateSnapshotOperations')[0];
    assert.equal(cycle.state, 'active'); assert.equal(cycle.rounds.length, 1);
    assert.equal(operation.state, 'seeded'); assert.equal(starts, 1);
    assert.equal(f.service.latestCandidate(f.item.id)?.id, original.id);
    const resumed = await f.service.automation.startAutomation(run.id, f.store.get('runs', run.id).revision, settings);
    assert.equal(resumed.id, owner.id); await f.service.waitForIdle();
    assert.equal(f.store.get('repairCycles', cycle.id).state, 'completed');
    assert.equal(f.store.get('repairCycles', cycle.id).rounds.length, 1);
    assert.equal(f.store.list('automationRuns').length, 1);
    assert.equal(f.store.list('candidateSnapshotOperations').length, 1);
    assert.equal(f.store.get('candidateSnapshotOperations', operation.id).state, 'activated');
    assert.equal(starts, 2);
  } finally { boundary.release(); await f.cleanup(); }
});
