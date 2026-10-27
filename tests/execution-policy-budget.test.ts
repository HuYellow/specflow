import test from 'node:test';
import assert from 'node:assert/strict';
import { compileWorkflow, defaultWorkflow, type ExecutionPolicyOptions, type ExecutionRef } from '../packages/domain/index.ts';
import { createPolicy, remainingExecutionMs } from '../packages/specflow-core/execution-policy.ts';
import { aggregateUsage, markDispatch, recordUsage, reserveDispatch } from '../packages/specflow-core/budget-ledger.ts';
import { Store } from '../packages/specflow-core/store.ts';

function ledger(runOptions: ExecutionPolicyOptions = {}, attemptOptions: ExecutionPolicyOptions = {}) {
  const store = new Store(':memory:');
  const policy = createPolicy(attemptOptions);
  const run = store.create('runs', { workItemId: 'item', workflowId: 'flow', definition: { ...defaultWorkflow(), executionPolicy: runOptions }, rules: '', rulesHash: '', state: 'active' });
  const node = store.create('nodes', { workflowRunId: run.id, nodeId: 'implement', name: 'implement', type: 'agent', execution: 'running', gate: 'unchecked', freshness: 'fresh', acceptance: 'pending', blockers: [] });
  const attempt = store.create('attempts', { nodeRunId: node.id, number: 1, inputHash: 'input', inputs: [], target: { backend: 'maka', connectionId: 'test', connectionSlug: 'test', model: 'test' }, prompt: '', codeBaseline: '', execution: 'running', policy });
  const reserve = (key: string) => reserveDispatch(store, { actionKey: key, attemptId: attempt.id, workflowRunId: run.id, inputHash: 'input', policy });
  return { store, policy, run, node, attempt, reserve };
}
const ref: ExecutionRef = { backend: 'maka', rootId: 'runtime', sessionId: 'session', turnId: 'turn' };

test('policy snapshots validate limits and capabilities without promising unsupported monetary caps', () => {
  const capabilities = { available: true, version: '0.2.0', canResume: true, canInteract: true, readOnlyReview: true, stepLimit: 'native' as const };
  const policy = createPolicy({ maxSteps: 12, timeoutMs: 5000 }, capabilities);
  capabilities.version = 'changed';
  assert.equal(policy.capabilities?.version, '0.2.0');
  assert.equal(policy.limits.maxDispatches, 128);
  assert.equal(policy.limits.maxReservedSteps, undefined);
  assert.throws(() => createPolicy({ maxSteps: 0 }), /正安全整数/);
  assert.throws(() => createPolicy({ maxDispatches: Number.POSITIVE_INFINITY }), /正安全整数/);
  assert.throws(() => createPolicy({ maxCostUsd: 1, strictCostLimit: true }), /不支持严格费用上限/);
  assert.equal(remainingExecutionMs('2026-10-27T00:00:05Z', Date.parse('2026-10-27T00:00:06Z')), 0);
  assert.equal(remainingExecutionMs(undefined), undefined);
  const flow = defaultWorkflow(); flow.nodes[0].executionPolicy = { maxDispatches: -1 };
  assert.equal(compileWorkflow(flow).valid, false);
  assert.equal(compileWorkflow({ ...defaultWorkflow(), executionPolicy: { maxRunDispatches: 0 } }).valid, false);
});

test('reservations persist parent budgets and idempotency; a child cannot expand a run ceiling', () => {
  const f = ledger({ maxRunDispatches: 2 }, { maxDispatches: 3, maxRunDispatches: 100 });
  try {
    const first = f.reserve('first');
    assert.equal(f.reserve('first').id, first.id);
    assert.equal(f.store.list('dispatchIntents').length, 1);
    markDispatch(f.store, first.id, 'unknown');
    f.reserve('second');
    assert.throws(() => f.reserve('third'), /流程的累计派发次数/);
    assert.equal(f.store.get('runs', f.run.id).policy?.limits.maxRunDispatches, 2);
    assert.throws(() => reserveDispatch(f.store, { actionKey: 'first', attemptId: f.attempt.id, workflowRunId: f.run.id, inputHash: 'different', policy: f.policy }), /幂等键/);
    assert.throws(() => markDispatch(f.store, first.id, 'released', undefined, { neverDispatched: true }), /状态转移/);
  } finally { f.store.close(); }
});

test('unknown dispatches retain full step reservations; only proved undispatched intents release budget', () => {
  const f = ledger({}, { maxSteps: 4, maxReservedSteps: 5, maxDispatches: 2 });
  try {
    const first = f.reserve('first');
    assert.throws(() => f.reserve('second'), /预留步数/);
    assert.throws(() => markDispatch(f.store, first.id, 'released'), /确认从未派发/);
    markDispatch(f.store, first.id, 'released', undefined, { neverDispatched: true });
    const second = f.reserve('second');
    markDispatch(f.store, second.id, 'dispatched', ref);
    markDispatch(f.store, second.id, 'terminal', ref, { actualSteps: 1, terminalEventId: 'terminal' });
    assert.equal(f.reserve('third').reservedSteps, 4);
  } finally { f.store.close(); }
});

test('three task measurements aggregate without overwrite, duplicate counting, or zero-filled unknown cost', () => {
  const f = ledger();
  try {
    for (const [index, tokens] of [10, 20, 30].entries()) {
      const input = { workflowRunId: f.run.id, attemptId: f.attempt.id, bindingId: `binding-${index}`, ref: { ...ref, turnId: `turn-${index}` }, meterId: 'usage', mode: 'cumulative' as const,
        values: { inputTokens: tokens, outputTokens: tokens / 2, costUsd: index === 1 ? null : 0.1 } };
      recordUsage(f.store, input); recordUsage(f.store, input);
    }
    const total = aggregateUsage(f.store.list('usageRecords'));
    assert.equal(total.inputTokens, 60); assert.equal(total.outputTokens, 30);
    assert.equal(total.costUsd, 0.2); assert.equal(total.unknownCounts.costUsd, 1);
    assert.equal(total.completeness, 'partial'); assert.equal(total.executions, 3);
    assert.equal(f.store.list('usageRecords').length, 3);
    const missing = aggregateUsage(f.store.list('usageRecords'), ['binding-0', 'binding-1', 'binding-2', 'lost-binding']);
    assert.equal(missing.unknownCounts.inputTokens, 1);
    assert.equal(aggregateUsage([]).inputTokens, null);
  } finally { f.store.close(); }
});

test('session cumulative usage survives resume and out-of-order observations without double billing', () => {
  const f = ledger();
  try {
    const base = { workflowRunId: f.run.id, attemptId: f.attempt.id, bindingId: 'initial', ref, meterId: 'session-usage', scope: 'session' as const, mode: 'cumulative' as const };
    recordUsage(f.store, { ...base, sequence: 1, values: { inputTokens: 10, outputTokens: 5, costUsd: null } });
    recordUsage(f.store, { ...base, bindingId: 'resumed', ref: { ...ref, turnId: 'resumed' }, sequence: 2, values: { inputTokens: 25, outputTokens: 8, costUsd: 0.5 } });
    recordUsage(f.store, { ...base, sequence: 1, values: { inputTokens: 10, outputTokens: 5, costUsd: null } });
    const total = aggregateUsage(f.store.list('usageRecords'), ['initial', 'resumed']);
    assert.equal(total.inputTokens, 25); assert.equal(total.costUsd, 0.5);
    assert.equal(total.executions, 2); assert.equal(total.meters, 1);
    assert.equal(total.completeness, 'complete');
  } finally { f.store.close(); }
});

test('delta usage needs stable events and observed cost blocks subsequent dispatch', () => {
  const f = ledger({ maxCostUsd: 0.5 });
  try {
    const input = { workflowRunId: f.run.id, attemptId: f.attempt.id, bindingId: 'b', ref, meterId: 'deltas', mode: 'delta' as const, eventId: 'event-1', values: { inputTokens: 10, outputTokens: 1, costUsd: 0.5 } };
    recordUsage(f.store, input); recordUsage(f.store, input);
    assert.equal(aggregateUsage(f.store.list('usageRecords')).costUsd, 0.5);
    assert.throws(() => recordUsage(f.store, { ...input, eventId: undefined }), /事件 ID/);
    assert.throws(() => recordUsage(f.store, { ...input, values: { ...input.values, costUsd: 1 } }), /不同数据/);
    assert.throws(() => f.reserve('after-cost'), /已知费用达到观测阈值/);
  } finally { f.store.close(); }
});
