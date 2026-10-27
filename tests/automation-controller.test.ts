import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { defaultWorkflow, type NodeRun, type WorkflowRun } from '../packages/domain/index.ts';
import type { RepairCycle } from '../packages/domain/automation.ts';
import { createRepairCycleData, appendRepairRound, updateRepairRound, assessRepairRound, decideRepairAction, hasRepairProgress } from '../packages/specflow-core/repair.ts';
import { selectNextAutomationAction } from '../packages/specflow-core/automation.ts';
import { Store } from '../packages/specflow-core/store.ts';

const entity = { revision: 1, createdAt: '2026-10-27T00:00:00Z', updatedAt: '2026-10-27T00:00:00Z' };
const progress = { targetHash: 'failed-code', unresolvedFindingIds: ['finding-original'], failedChecks: ['test:empty-file'] };
function cycle(): RepairCycle {
  return { id: 'cycle', ...entity, ...createRepairCycleData({ workItemId: 'item', workflowRunId: 'run', producerNodeRunId: 'implement', sourceAttemptId: 'failed', sourceCandidateId: 'candidate', acceptedCommit: 'accepted', upstreamHash: 'inputs-v1', target: { backend: 'sandbox', connectionId: 'local', connectionSlug: 'local', model: 'test' }, targetLogicalIds: ['implementation'], mode: 'code', initialProgress: progress }) };
}
function finishRound(value: RepairCycle, nextProgress = progress, passed = false) {
  let current = { ...value, ...appendRepairRound(value) };
  for (const phase of ['producing', 'verifying', 'reviewing'] as const) current = { ...current, ...updateRepairRound(current, { phase }) };
  return { ...current, ...assessRepairRound(current, { progress: nextProgress, outputValid: true, verificationPassed: passed, reviewPassed: passed }) };
}
const facts = { upstreamFresh: true, candidateUnchanged: true, executionConfirmed: true, budgetAvailable: true, permissionGranted: true, repairable: true };

test('修订上限和无进展状态跨 Store 重启保留，不再派发第三轮', async () => {
  const root = await mkdtemp(join(tmpdir(), 'specflow-repair-test-'));
  let store = new Store(join(root, 'state.sqlite'));
  try {
    const initial = cycle();
    const { id: _id, revision: _revision, createdAt: _created, updatedAt: _updated, ...data } = initial;
    const stored = store.create('repairCycles', data);
    const first = finishRound(stored);
    store.update('repairCycles', stored.id, { rounds: first.rounds, state: first.state, stopReason: first.stopReason });
    store.close(); store = new Store(join(root, 'state.sqlite'));
    const recovered = store.get('repairCycles', stored.id);
    assert.equal(recovered.rounds.length, 1);
    assert.equal(decideRepairAction(recovered, facts).kind, 'prepare');
    const exhausted = finishRound(recovered, { ...progress, targetHash: 'rewritten-but-still-failing' });
    store.update('repairCycles', stored.id, { rounds: exhausted.rounds, state: exhausted.state, stopReason: exhausted.stopReason });
    store.close(); store = new Store(join(root, 'state.sqlite'));
    const stopped = store.get('repairCycles', stored.id);
    assert.equal(stopped.stopReason, 'no_progress');
    assert.deepEqual(decideRepairAction(stopped, facts), { kind: 'block', reason: 'no_progress' });
    assert.throws(() => appendRepairRound(stopped), /活动/);
    assert.throws(() => appendRepairRound({ ...stopped, state: 'active' }), /耗尽/);
  } finally {
    store.close();
    assert.ok(resolve(root).startsWith(resolve(tmpdir())) && basename(root).startsWith('specflow-repair-test-'));
    await rm(root, { recursive: true, force: true });
  }
});
test('代码或问题措辞变化不代表修复进展，新 blocker 不能抵消旧 blocker', () => {
  assert.equal(hasRepairProgress(progress, { ...progress, targetHash: 'different-code' }), false);
  assert.equal(hasRepairProgress(progress, { targetHash: 'new-code', unresolvedFindingIds: ['new-finding'], failedChecks: [] }), false);
  assert.equal(hasRepairProgress(progress, { ...progress, failedChecks: [] }), true);
  const evaluated = finishRound(cycle(), { targetHash: 'new-code', unresolvedFindingIds: [], failedChecks: [] }, false);
  assert.equal(evaluated.state, 'active', '空问题列表不能替代真实验证与复核通过');
  const complete = finishRound(cycle(), { targetHash: 'new-code', unresolvedFindingIds: [], failedChecks: [] }, true);
  assert.equal(complete.state, 'completed');
});
test('修订不能跳过验证、替换本轮执行身份、重试未知执行或越过范围/预算', () => {
  const initial = cycle(), prepared = { ...initial, ...appendRepairRound(initial) };
  assert.throws(() => updateRepairRound(prepared, { phase: 'reviewing' }), /跳过/);
  const producing = { ...prepared, ...updateRepairRound(prepared, { phase: 'producing', attemptId: 'original-execution' }) };
  assert.throws(() => updateRepairRound(producing, { attemptId: 'replacement-execution' }), /身份/);
  assert.equal(decideRepairAction(producing, { ...facts, executionConfirmed: false }).kind, 'block');
  assert.equal(decideRepairAction(producing, { ...facts, activeExecution: true, executionConfirmed: false }).kind, 'observe');
  for (const key of ['upstreamFresh', 'candidateUnchanged', 'permissionGranted', 'budgetAvailable'] as const) assert.equal(decideRepairAction(initial, { ...facts, [key]: false }).kind, 'block');
});

function workflow() {
  const run: WorkflowRun = { id: 'run', ...entity, workItemId: 'item', workflowId: 'flow', definition: defaultWorkflow(), rules: '', rulesHash: 'rules', state: 'active' };
  const nodes: NodeRun[] = run.definition.nodes.map(def => ({ id: `node-${def.id}`, ...entity, workflowRunId: run.id, nodeId: def.id, name: def.name, type: def.type, execution: 'pending', gate: 'unchecked', freshness: 'fresh', acceptance: 'pending', blockers: [] }));
  const readiness = Object.fromEntries(nodes.map(n => [n.id, { ready: true, reasons: [] as string[] }]));
  return { run, nodes, readiness };
}
function complete(node: NodeRun, acceptance: NodeRun['acceptance'] = 'accepted') { Object.assign(node, { execution: 'completed', gate: 'passed', acceptance }); }

test('自动推进先完成澄清/复核，再等待产物接纳，不自动触发 human', () => {
  const input = workflow();
  complete(input.nodes[0], 'pending'); input.nodes[0].gate = 'unchecked';
  assert.equal(selectNextAutomationAction(input).kind, 'dispatch');
  assert.equal((selectNextAutomationAction(input) as { nodeRunId: string }).nodeRunId, 'node-clarify');
  input.nodes[1].execution = 'waiting_interaction';
  assert.equal(selectNextAutomationAction(input).kind, 'await_input');
  complete(input.nodes[1]);
  assert.equal((selectNextAutomationAction(input) as { nodeRunId: string }).nodeRunId, 'node-review-spec');
  complete(input.nodes[2]);
  assert.deepEqual(selectNextAutomationAction(input), { kind: 'await_acceptance', nodeRunId: 'node-specify', reason: 'artifact_acceptance_required' });
  for (const node of input.nodes.slice(0, -1)) complete(node);
  assert.deepEqual(selectNextAutomationAction(input), { kind: 'await_acceptance', nodeRunId: 'node-accept', reason: 'human_action_required' });
});
test('自动推进遇到过期、失败、核对中和未知 readiness 时不派发下一步', () => {
  for (const patch of [{ freshness: 'stale' }, { execution: 'failed' }, { execution: 'cancelled' }] as const) {
    const input = workflow(); Object.assign(input.nodes[0], patch);
    assert.equal(selectNextAutomationAction(input).kind, 'block');
  }
  const input = workflow(); input.nodes[0].execution = 'reconciling';
  assert.equal(selectNextAutomationAction(input).kind, 'observe');
  input.nodes[0].execution = 'pending'; delete input.readiness[input.nodes[0].id];
  assert.equal(selectNextAutomationAction(input).kind, 'block');
  input.readiness[input.nodes[0].id] = { ready: true, reasons: [] };
  input.run.state = 'paused'; assert.equal(selectNextAutomationAction(input).kind, 'block');
});
