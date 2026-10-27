import { assert, hash, type Entity, type ModelTarget } from '../domain/index.ts';
import type { RepairCycle, RepairProgress, RepairRound, RepairStopReason } from '../domain/automation.ts';

export const defaultAutomationSettings = { autoAdvance: false, autoRepair: false, maxRepairRounds: 2 } as const;
export function progressFingerprint(progress: RepairProgress) {
  return hash(JSON.stringify({ targetHash: progress.targetHash, unresolvedFindingIds: [...new Set(progress.unresolvedFindingIds)].sort(), failedChecks: [...new Set(progress.failedChecks)].sort() }));
}
/** Changing prose, regenerating identifiers, or changing code alone is not
 * evidence of improvement. Only an actually reduced failure set qualifies. */
export function hasRepairProgress(previous: RepairProgress, current: RepairProgress) {
  const before = new Set([...previous.unresolvedFindingIds.map(x => `finding:${x}`), ...previous.failedChecks.map(x => `check:${x}`)]);
  const after = new Set([...current.unresolvedFindingIds.map(x => `finding:${x}`), ...current.failedChecks.map(x => `check:${x}`)]);
  return after.size < before.size && [...after].every(x => before.has(x));
}
export function createRepairCycleData(input: {
  workItemId: string; workflowRunId: string; producerNodeRunId: string; sourceAttemptId: string;
  sourceCandidateId?: string; acceptedCommit: string; upstreamHash: string; target: ModelTarget;
  targetLogicalIds: string[]; mode: 'code' | 'output'; initialProgress: RepairProgress;
  maxRounds?: number; noProgressLimit?: number;
}): Omit<RepairCycle, keyof Entity> {
  const maxRounds = input.maxRounds ?? 2, noProgressLimit = input.noProgressLimit ?? 2;
  assert(Number.isSafeInteger(maxRounds) && maxRounds > 0 && maxRounds <= 10, 'REPAIR_POLICY_INVALID', '修订轮数必须为 1 到 10 的整数');
  assert(Number.isSafeInteger(noProgressLimit) && noProgressLimit > 0, 'REPAIR_POLICY_INVALID', '无进展上限必须为正整数');
  assert(input.mode !== 'code' || input.sourceCandidateId, 'CANDIDATE_MISSING', '代码修订必须绑定失败候选');
  assert(input.targetLogicalIds.length && input.upstreamHash && input.acceptedCommit, 'REPAIR_POLICY_INVALID', '修订必须固定目标、上游和接纳基线');
  return { ...structuredClone(input), maxRounds, noProgressLimit, rounds: [], state: 'active' };
}
export function repairActionKey(cycle: RepairCycle, action: string, round = cycle.rounds.at(-1)?.number ?? 1) {
  return `${cycle.id}:${round}:${action}:${cycle.upstreamHash}`;
}
export function appendRepairRound(cycle: RepairCycle): Pick<RepairCycle, 'rounds' | 'pendingActionKey'> {
  assert(cycle.state === 'active', 'REPAIR_NOT_ACTIVE', '修订周期未处于活动状态');
  const last = cycle.rounds.at(-1);
  assert(!last || last.phase === 'evaluated' && last.passed === false, 'REPAIR_ROUND_ACTIVE', '前一轮尚未完成或已经通过');
  assert(cycle.rounds.length < cycle.maxRounds, 'REPAIR_ROUND_LIMIT', '修订轮数已耗尽');
  const round: RepairRound = { number: cycle.rounds.length + 1, phase: 'preparing', evidenceIds: [], reviewAttemptIds: [], reviewGroupIds: [] };
  return { rounds: [...structuredClone(cycle.rounds), round], pendingActionKey: repairActionKey(cycle, 'prepare', round.number) };
}
const phaseOrder: RepairRound['phase'][] = ['preparing', 'producing', 'verifying', 'reviewing', 'evaluated'];
/** The caller saves this patch with the cycle's expected revision. Replaying a
 * recorded phase is safe; moving backwards or skipping phases is refused. */
export function updateRepairRound(cycle: RepairCycle, patch: Partial<Omit<RepairRound, 'number'>>) {
  assert(cycle.state === 'active' && cycle.rounds.length, 'REPAIR_NOT_ACTIVE', '当前没有活动修订轮');
  const rounds = structuredClone(cycle.rounds), current = rounds.at(-1)!;
  const nextPhase = patch.phase ?? current.phase;
  const distance = phaseOrder.indexOf(nextPhase) - phaseOrder.indexOf(current.phase);
  assert(distance >= 0 && distance <= 1, 'REPAIR_PHASE_INVALID', '修订步骤不能倒退或跳过验证与复核');
  assert(nextPhase !== 'evaluated', 'REPAIR_PHASE_INVALID', '修订评估必须通过 assessRepairRound');
  for (const key of ['attemptId', 'candidateId', 'snapshotOperationId'] as const) assert(!current[key] || patch[key] === undefined || current[key] === patch[key], 'REPAIR_IDENTITY_CHANGED', '同一轮修订的执行身份不能替换');
  Object.assign(current, patch);
  return { rounds, pendingActionKey: repairActionKey(cycle, nextPhase) };
}
export function assessRepairRound(cycle: RepairCycle, result: {
  progress: RepairProgress; verificationPassed: boolean; reviewPassed: boolean; outputValid: boolean;
}): Pick<RepairCycle, 'rounds' | 'state' | 'stopReason' | 'pendingActionKey'> {
  const phase = cycle.rounds.at(-1)?.phase;
  assert(cycle.state === 'active' && (phase === 'reviewing' || phase === 'verifying' && (!result.outputValid || !result.verificationPassed)), 'REPAIR_PHASE_INVALID', '成功修订必须完成验证和复核；输出或验证失败时可直接评估失败');
  const rounds = structuredClone(cycle.rounds), round = rounds.at(-1)!;
  const passed = result.outputValid && result.verificationPassed && result.reviewPassed && !result.progress.failedChecks.length && !result.progress.unresolvedFindingIds.length;
  Object.assign(round, { phase: 'evaluated', progress: structuredClone(result.progress), passed,
    ...(phase === 'verifying' ? { reviewSkippedReason: result.outputValid ? 'verification_failed' : 'output_invalid' } : {}) });
  let unchanged = 0;
  for (let index = rounds.length - 1; index >= 0; index--) {
    const previous = index === 0 ? cycle.initialProgress : rounds[index - 1].progress;
    if (!previous || !rounds[index].progress || hasRepairProgress(previous, rounds[index].progress!)) break;
    unchanged++;
  }
  const stopReason = passed ? 'completed' : unchanged >= cycle.noProgressLimit ? 'no_progress' : rounds.length >= cycle.maxRounds ? 'round_limit' : undefined;
  return { rounds, state: passed ? 'completed' : stopReason ? 'paused' : 'active', stopReason, pendingActionKey: undefined };
}
export interface RepairFacts {
  upstreamFresh: boolean; candidateUnchanged: boolean; executionConfirmed: boolean;
  budgetAvailable: boolean; permissionGranted: boolean; repairable: boolean;
  activeExecution?: boolean; waitingForInput?: boolean; stopRequested?: boolean;
}
export type RepairAction = { kind: 'prepare' | 'produce' | 'verify' | 'review' | 'assess'; actionKey: string; round: number }
  | { kind: 'observe' | 'await_input' | 'complete'; reason: string }
  | { kind: 'block'; reason: RepairStopReason };
export function decideRepairAction(cycle: RepairCycle, facts: RepairFacts): RepairAction {
  if (cycle.state === 'completed') return { kind: 'complete', reason: 'completed' };
  if (cycle.state !== 'active') return { kind: 'block', reason: cycle.stopReason ?? 'user_cancelled' };
  if (facts.stopRequested) return { kind: 'block', reason: 'user_cancelled' };
  if (!facts.upstreamFresh) return { kind: 'block', reason: 'input_stale' };
  if (!facts.candidateUnchanged) return { kind: 'block', reason: 'candidate_drift' };
  if (facts.waitingForInput) return { kind: 'await_input', reason: 'waiting_for_input' };
  if (facts.activeExecution) return { kind: 'observe', reason: 'execution_active' };
  if (!facts.executionConfirmed) return { kind: 'block', reason: 'execution_unknown' };
  if (!facts.permissionGranted) return { kind: 'block', reason: 'permission_denied' };
  if (!facts.repairable) return { kind: 'block', reason: 'unrepairable' };
  const round = cycle.rounds.at(-1);
  if (round?.phase === 'evaluated' && round.passed) return { kind: 'complete', reason: 'completed' };
  if (!round || round.phase === 'evaluated') {
    if (cycle.rounds.length >= cycle.maxRounds) return { kind: 'block', reason: 'round_limit' };
    if (!facts.budgetAvailable) return { kind: 'block', reason: 'budget_exhausted' };
    const next = cycle.rounds.length + 1;
    return { kind: 'prepare', actionKey: repairActionKey(cycle, 'prepare', next), round: next };
  }
  const kind = { preparing: 'produce', producing: 'verify', verifying: 'review', reviewing: 'assess' }[round.phase] as 'produce' | 'verify' | 'review' | 'assess';
  if (kind !== 'assess' && !facts.budgetAvailable) return { kind: 'block', reason: 'budget_exhausted' };
  return { kind, actionKey: repairActionKey(cycle, kind), round: round.number };
}
