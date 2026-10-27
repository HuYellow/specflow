import { assert, hash, type BackendId, type DispatchIntent, type DispatchState, type ExecutionPolicy, type ExecutionRef, type UsageCompleteness, type UsageRecord, type UsageSummary, type UsageValues } from '../domain/index.ts';
import type { Store } from './store.ts';
import { createPolicy, validatePolicyOptions } from './execution-policy.ts';

export interface ReserveDispatchInput {
  actionKey: string;
  attemptId: string;
  workflowRunId: string;
  policy: ExecutionPolicy;
  inputHash: string;
  steps?: number;
  backend?: BackendId;
  ref?: ExecutionRef;
  repairCycleId?: string;
  parentOperationId?: string;
}

/** Reservation and parent-policy freezing share one SQLite transaction. Unknown dispatches stay charged. */
export function reserveDispatch(store: Store, input: ReserveDispatchInput): DispatchIntent {
  return store.tx(() => {
    assert(input.actionKey.trim() && input.inputHash.trim(), 'DISPATCH_INVALID', '派发意图缺少幂等键或输入哈希');
    assert(!validatePolicyOptions(input.policy.limits).length, 'POLICY_INVALID', '派发策略含无效预算');
    const previous = store.list('dispatchIntents', record => record.actionKey === input.actionKey)[0];
    const reservedSteps = input.steps ?? input.policy.limits.maxSteps;
    assert(Number.isSafeInteger(reservedSteps) && reservedSteps > 0, 'POLICY_INVALID', '预留步数必须为正安全整数');
    if (previous) {
      assert(previous.attemptId === input.attemptId && previous.workflowRunId === input.workflowRunId && previous.inputHash === input.inputHash && previous.policyHash === input.policy.policyHash && previous.reservedSteps === reservedSteps,
        'IDEMPOTENCY_CONFLICT', '派发幂等键已用于不同的输入或策略');
      assert(previous.state !== 'released', 'DISPATCH_RELEASED', '已释放的派发意图不能重复使用');
      return previous;
    }
    const run = store.get('runs', input.workflowRunId);
    const attempt = store.get('attempts', input.attemptId);
    assert(store.get('nodes', attempt.nodeRunId).workflowRunId === run.id, 'DISPATCH_INVALID', '派发尝试不属于指定流程');
    if (attempt.policy) assert(attempt.policy.policyHash === input.policy.policyHash, 'POLICY_CHANGED', '不能更改尝试冻结的执行策略');
    const parentPolicy = run.policy || createPolicy(run.definition.executionPolicy || {}, input.policy.capabilities);
    const backend = input.backend || input.ref?.backend || attempt.target.backend;
    const stepUnit = `${backend}:${input.policy.capabilities?.stepUnit || input.policy.capabilities?.details?.stepLimit.unit || 'runtime-step'}`;
    const records = store.list('dispatchIntents', record => record.workflowRunId === run.id && record.state !== 'released');
    const own = records.filter(record => record.attemptId === input.attemptId);
    const chargedSteps = (record: DispatchIntent) => record.actualSteps ?? record.reservedSteps;
    assert(own.length < input.policy.limits.maxDispatches, 'ATTEMPT_LIMIT_REACHED', '本次尝试的累计派发次数已用完');
    assert(records.length < parentPolicy.limits.maxRunDispatches, 'RUN_LIMIT_REACHED', '本流程的累计派发次数已用完');
    if (input.policy.limits.maxReservedSteps !== undefined) {
      assert(own.every(record => record.stepUnit === stepUnit), 'BUDGET_UNIT_MISMATCH', '无法将不同底座的步数相加为同一预算');
      assert(own.reduce((sum, record) => sum + chargedSteps(record), 0) + reservedSteps <= input.policy.limits.maxReservedSteps, 'STEP_BUDGET_REACHED', '本次尝试的累计预留步数已用完');
    }
    if (parentPolicy.limits.maxRunReservedSteps !== undefined) {
      assert(records.every(record => record.stepUnit === stepUnit), 'BUDGET_UNIT_MISMATCH', '无法在不同计量单位间兑现流程步数上限，请使用派发次数限制');
      assert(records.reduce((sum, record) => sum + chargedSteps(record), 0) + reservedSteps <= parentPolicy.limits.maxRunReservedSteps, 'STEP_BUDGET_REACHED', '本流程的累计预留步数已用完');
    }
    for (const [policy, selection] of [[input.policy, (record: UsageRecord) => record.attemptIds.includes(input.attemptId)], [parentPolicy, (record: UsageRecord) => record.workflowRunId === run.id]] as const) {
      if (policy.limits.maxCostUsd !== undefined) {
        const summary = aggregateUsage(store.list('usageRecords', selection));
        assert(summary.known.costUsd < policy.limits.maxCostUsd, 'COST_BUDGET_REACHED', '已知费用达到观测阈值，停止后续派发');
      }
    }
    if (!run.policy) store.update('runs', run.id, { policy: structuredClone(parentPolicy) });
    return store.create('dispatchIntents', { actionKey: input.actionKey, attemptId: input.attemptId, workflowRunId: run.id,
      inputHash: input.inputHash, policyHash: input.policy.policyHash, reservedSteps, stepUnit, backend, state: 'reserved',
      ...(input.ref ? { ref: input.ref } : {}), ...(input.repairCycleId ? { repairCycleId: input.repairCycleId } : {}),
      ...(input.parentOperationId ? { parentOperationId: input.parentOperationId } : {}) });
  });
}

const allowedTransitions: Record<DispatchState, DispatchState[]> = {
  reserved: ['prepared', 'dispatched', 'unknown', 'released'], prepared: ['dispatched', 'unknown', 'released'],
  dispatched: ['terminal', 'unknown'], unknown: ['prepared', 'dispatched', 'terminal'], terminal: [], released: [],
};
export function markDispatch(store: Store, id: string, state: DispatchState, ref?: ExecutionRef, options: { actualSteps?: number; terminalEventId?: string; neverDispatched?: boolean } = {}) {
  return store.tx(() => {
    const current = store.get('dispatchIntents', id);
    assert(current.state === state || allowedTransitions[current.state].includes(state), 'DISPATCH_STATE_INVALID', '派发意图状态转移无效');
    if (state === 'released') assert(options.neverDispatched === true, 'DISPATCH_RELEASE_UNPROVEN', '只有确认从未派发的操作才可释放预算');
    if (options.actualSteps !== undefined) assert(state === 'terminal' && Number.isSafeInteger(options.actualSteps) && options.actualSteps >= 0, 'USAGE_INVALID', '实际步数必须来自已确认终态且为非负整数');
    if (current.ref && ref) assert(current.ref.backend === ref.backend && current.ref.rootId === ref.rootId && current.ref.sessionId === ref.sessionId && current.ref.turnId === ref.turnId, 'EXECUTION_IDENTITY_CHANGED', '派发意图不能替换原执行身份');
    return store.update('dispatchIntents', id, { state, ...(ref ? { ref } : {}), ...(options.actualSteps === undefined ? {} : { actualSteps: options.actualSteps }), ...(options.terminalEventId ? { terminalEventId: options.terminalEventId } : {}) });
  });
}

export interface RecordUsageInput {
  workflowRunId: string;
  attemptId: string;
  bindingId: string;
  repairCycleId?: string;
  ref: ExecutionRef;
  meterId: string;
  scope?: 'turn' | 'session';
  mode: 'cumulative' | 'delta';
  eventId?: string;
  sequence?: number;
  values: UsageValues;
  completeness?: UsageCompleteness;
}

function validateUsage(values: UsageValues) {
  for (const key of ['inputTokens', 'outputTokens', 'costUsd'] as const) assert(values[key] === null || (typeof values[key] === 'number' && Number.isFinite(values[key]) && values[key] >= 0 && (key === 'costUsd' || Number.isSafeInteger(values[key]))), 'USAGE_INVALID', `用量 ${key} 必须是非负数或 null`);
}
const keys = ['inputTokens', 'outputTokens', 'costUsd'] as const;
function completeness(values: UsageValues, requested?: UsageCompleteness): UsageCompleteness {
  if (keys.every(key => values[key] === null)) return 'unknown';
  if (keys.some(key => values[key] === null) || requested === 'partial' || requested === 'unknown') return 'partial';
  return 'complete';
}

/** A cumulative meter replaces its prior observation; delta events require unique identities. */
export function recordUsage(store: Store, input: RecordUsageInput): UsageRecord {
  return store.tx(() => {
    validateUsage(input.values);
    assert(input.meterId.trim(), 'USAGE_INVALID', '用量必须声明计量器范围');
    if (input.mode === 'delta') assert(input.eventId?.trim(), 'USAGE_INVALID', '增量用量必须提供稳定事件 ID');
    if (input.sequence !== undefined) assert(Number.isSafeInteger(input.sequence) && input.sequence >= 0, 'USAGE_INVALID', '累计用量序号必须是非负整数');
    const scope = input.scope || 'turn';
    const meterKey = hash(JSON.stringify([input.ref.backend, input.ref.rootId, input.ref.sessionId, scope, scope === 'turn' ? input.ref.turnId : '', input.meterId]));
    const peers = store.list('usageRecords', record => record.meterKey === meterKey);
    assert(peers.every(record => record.mode === input.mode), 'USAGE_INVALID', '同一计量器不能混合累计与增量读数');
    const previous = peers.find(record => input.mode === 'cumulative' || record.eventId === input.eventId);
    if (previous) {
      if (input.mode === 'delta') {
        assert(JSON.stringify(previous.values) === JSON.stringify(input.values), 'IDEMPOTENCY_CONFLICT', '同一用量事件返回不同数据');
        return previous;
      }
      if (input.sequence !== undefined && previous.sequence !== undefined && input.sequence < previous.sequence) return previous;
      const values = Object.fromEntries(keys.map(key => [key, input.values[key] === null ? previous.values[key] : previous.values[key] === null ? input.values[key] : Math.max(previous.values[key]!, input.values[key]!)])) as unknown as UsageValues;
      return store.update('usageRecords', previous.id, { values, completeness: completeness(values, input.completeness),
        attemptIds: [...new Set([...previous.attemptIds, input.attemptId])], bindingIds: [...new Set([...previous.bindingIds, input.bindingId])],
        ...(input.sequence === undefined ? {} : { sequence: input.sequence }) });
    }
    return store.create('usageRecords', { workflowRunId: input.workflowRunId, attemptId: input.attemptId, bindingId: input.bindingId,
      attemptIds: [input.attemptId], bindingIds: [input.bindingId], ref: input.ref, meterKey, meterId: input.meterId, scope, mode: input.mode,
      values: { ...input.values }, completeness: completeness(input.values, input.completeness),
      ...(input.eventId ? { eventId: input.eventId } : {}), ...(input.sequence === undefined ? {} : { sequence: input.sequence }),
      ...(input.repairCycleId ? { repairCycleId: input.repairCycleId } : {}) });
  });
}

/** expectedBindingIds also accounts for executions whose backend supplied no measurement. */
export function aggregateUsage(records: UsageRecord[], expectedBindingIds: string[] = []): UsageSummary {
  const meters = new Map<string, UsageRecord>();
  for (const record of records) {
    const key = `${record.meterKey}:${record.mode === 'delta' ? record.eventId : 'cumulative'}`;
    const previous = meters.get(key);
    if (!previous) meters.set(key, record);
    else if (record.mode === 'cumulative') {
      const values = Object.fromEntries(keys.map(key => [key, previous.values[key] === null ? record.values[key] : record.values[key] === null ? previous.values[key] : Math.max(previous.values[key]!, record.values[key]!)])) as unknown as UsageValues;
      meters.set(key, { ...record, values, bindingIds: [...new Set([...previous.bindingIds, ...record.bindingIds])] });
    }
  }
  const known = { inputTokens: 0, outputTokens: 0, costUsd: 0 }, unknownCounts = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  const observedBindings = new Set(records.flatMap(record => record.bindingIds));
  const missing = [...new Set(expectedBindingIds)].filter(id => !observedBindings.has(id)).length;
  for (const key of keys) {
    unknownCounts[key] = missing;
    for (const record of meters.values()) if (record.values[key] === null) unknownCounts[key]++; else known[key] += record.values[key]!;
  }
  const count = meters.size + missing;
  const allUnknown = !count || keys.every(key => unknownCounts[key] === count);
  const partial = missing > 0 || [...meters.values()].some(record => record.completeness !== 'complete') || keys.some(key => unknownCounts[key] > 0);
  return { ...Object.fromEntries(keys.map(key => [key, !count || unknownCounts[key] === count ? null : known[key]])) as unknown as UsageValues,
    known, unknownCounts, completeness: allUnknown ? 'unknown' : partial ? 'partial' : 'complete',
    executions: new Set([...expectedBindingIds, ...observedBindings]).size, meters: meters.size };
}
