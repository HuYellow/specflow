import { assert, DomainError, hash, reviewSubjects, type Attempt, type Candidate, type ModelTarget } from '../domain/index.ts';
import type { AutomationRun, AutomationSettings, RepairCycle, RepairProgress, RepairRound, RepairStopReason } from '../domain/automation.ts';
import type { EngineeringService } from './service.ts';
import { requirementFresh } from './requirements.ts';
import { guidanceFresh } from './guidance.ts';
import { openReviewFindings } from './reviews.ts';
import { treeHash } from '../verification-runner/index.ts';
import { appendRepairRound, assessRepairRound, createRepairCycleData, defaultAutomationSettings, updateRepairRound } from './repair.ts';
import { selectNextAutomationAction } from './automation.ts';

const activeStates = new Set(['pending', 'starting', 'running', 'waiting_interaction', 'reconciling']);
const budgetCodes = new Set(['ATTEMPT_LIMIT_REACHED', 'RUN_LIMIT_REACHED', 'STEP_BUDGET_REACHED', 'COST_BUDGET_REACHED', 'EXECUTION_TIMEOUT']);
/** Durable engineering orchestration. Model calls remain owned by EngineeringService;
 * this class never starts an unjournaled alternate execution after an uncertain one. */
export class EngineeringAutomation {
  private ticking = new Set<string>();
  private dirty = new Set<string>();
  private starting = new Set<string>();
  constructor(readonly service: EngineeringService) {}
  private get store() { return this.service.store; }
  private attempts(workItemId: string) {
    const runIds = new Set(this.store.list('runs', r => r.workItemId === workItemId).map(r => r.id));
    const nodeIds = new Set(this.store.list('nodes', n => runIds.has(n.workflowRunId)).map(n => n.id));
    return this.store.list('attempts', a => nodeIds.has(a.nodeRunId));
  }
  private occupied(attempt: Attempt) { return activeStates.has(attempt.execution) || attempt.writeOccupancy === 'held' || attempt.verificationPending === true; }
  private queue(workItemId: string) { this.service.schedule(`automation:${workItemId}`, () => this.tickWorkItem(workItemId)); }
  private activeAutomation(automationId: string) {
    const current = this.store.get('automationRuns', automationId);
    return current.state === 'active' ? current : undefined;
  }
  /** Cancellation wins over any asynchronous completion. This check and update
   * have no await between them and share a transaction for other Store writers. */
  private updateActiveAutomation(automationId: string, patch: Partial<AutomationRun>) {
    return this.store.tx(() => {
      const current = this.activeAutomation(automationId);
      return current ? this.store.update('automationRuns', automationId, patch, current.revision) : this.store.get('automationRuns', automationId);
    });
  }
  private assertRepairOwner(workflowRunId: string, workItemId: string, automationRunId?: string) {
    const run = this.store.get('runs', workflowRunId);
    assert(run.state === 'active' && run.workItemId === workItemId && this.store.get('workItems', workItemId).status !== 'accepted', 'INPUT_STALE', '修订所属流程已暂停或结束');
    if (automationRunId) {
      const owner = this.activeAutomation(automationRunId);
      assert(owner && owner.workflowRunId === workflowRunId && owner.workItemId === workItemId && owner.settings.autoRepair, 'AUTOMATION_STOPPED', '所属自动修订已停止，不能创建或派发修订');
    }
  }
  private activeCycle(cycleId: string) {
    const current = this.store.get('repairCycles', cycleId);
    assert(current.state === 'active', 'REPAIR_CANCELLED', '修订周期已经停止');
    if (current.automationRunId) assert(this.store.get('automationRuns', current.automationRunId).state !== 'paused', 'AUTOMATION_PAUSED', '自动化已暂停，保留当前修订轮等待恢复');
    this.assertRepairOwner(current.workflowRunId, current.workItemId, current.automationRunId);
    return current;
  }
  private ownsLiveWork(automation: AutomationRun) {
    const cycles = this.store.list('repairCycles', cycle => cycle.automationRunId === automation.id);
    if (cycles.some(cycle => cycle.state === 'active')) return true;
    const cycleIds = new Set(cycles.map(cycle => cycle.id));
    if (this.store.list('nodes', node => node.type === 'verify' && ['running', 'reconciling'].includes(node.execution) && (node.automationRunId === automation.id || !!node.repairCycleId && cycleIds.has(node.repairCycleId))).length) return true;
    return this.store.list('attempts', attempt => attempt.automationRunId === automation.id || !!attempt.repairCycleId && cycleIds.has(attempt.repairCycleId))
      .some(attempt => this.occupied(attempt) || this.store.get('nodes', attempt.nodeRunId).currentAttemptId === attempt.id && this.store.get('nodes', attempt.nodeRunId).execution === 'waiting_interaction');
  }
  private pause(cycle: RepairCycle, reason: RepairStopReason, message?: string) {
    const current = this.store.get('repairCycles', cycle.id);
    if (current.state !== 'active') return current;
    const paused = this.store.update('repairCycles', cycle.id, { state: 'paused', stopReason: reason, pendingActionKey: undefined });
    this.store.emit(cycle.id, 'repair.paused', { reason, ...(message ? { message } : {}) });
    return paused;
  }
  private failureReason(error: unknown): RepairStopReason {
    if (!(error instanceof DomainError)) return 'unrepairable';
    if (budgetCodes.has(error.code)) return 'budget_exhausted';
    if (['INPUT_STALE', 'REQUIREMENTS_STALE', 'GUIDANCE_STALE'].includes(error.code)) return 'input_stale';
    if (['CANDIDATE_DRIFT', 'CODE_STALE', 'SNAPSHOT_CONFLICT', 'SNAPSHOT_CONTENT_MISMATCH'].includes(error.code)) return 'candidate_drift';
    if (['EXECUTION_UNKNOWN', 'WORKSPACE_BUSY', 'REPAIR_IDENTITY_CHANGED'].includes(error.code)) return 'execution_unknown';
    if (['REPAIR_CANCELLED', 'AUTOMATION_STOPPED'].includes(error.code)) return 'user_cancelled';
    return 'unrepairable';
  }
  /** A review/verification retry must repair its producer, never ask a reviewer to
   * modify source or count a second reviewer verdict as a new implementation. */
  private sourceFor(nodeRunId: string) {
    const context = this.service.nodeContext(nodeRunId);
    let source: Attempt | undefined;
    if (context.def.type === 'agent') source = context.node.currentAttemptId ? this.store.get('attempts', context.node.currentAttemptId) : undefined;
    else if (context.def.type === 'verify') {
      const candidate = this.service.latestCandidate(context.item.id);
      source = candidate?.attemptId ? this.store.get('attempts', candidate.attemptId) : undefined;
    } else if (context.def.type === 'review') {
      const producers = new Set(reviewSubjects(context.def).flatMap(logicalId => {
        const artifact = this.store.list('artifacts', a => a.workItemId === context.item.id && a.logicalId === logicalId)[0];
        const attemptId = artifact && this.store.get('artifactRevisions', artifact.currentRevisionId).originAttemptId;
        return attemptId ? [attemptId] : [];
      }));
      assert(producers.size === 1, 'REPAIR_SOURCE_AMBIGUOUS', '请选择需要修订的生成阶段；复核对象没有唯一生成尝试');
      source = this.store.get('attempts', [...producers][0]);
    }
    assert(source, 'REPAIR_SOURCE_MISSING', '当前阶段没有可修订的生成尝试');
    const producer = this.service.nodeContext(source.nodeRunId);
    assert(producer.run.id === context.run.id && producer.def.type === 'agent' && !source.review, 'REPAIR_SOURCE_INVALID', '修订必须指向当前流程中的生成阶段');
    return { ...producer, source, requestedNode: context.node };
  }
  private upstreamHash(source: Attempt) {
    const { item, project, run } = this.service.nodeContext(source.nodeRunId);
    const requirement = this.service.requirements.current(item.id);
    return hash(JSON.stringify({ acceptedCommit: item.acceptedCommit, requirementRevisionId: requirement.id, requirementHash: requirement.contentHash,
      guidanceHash: project.guidance?.contentHash, inputs: source.inputs, commands: project.commands, definition: run.definition, target: source.target }));
  }
  private async assertFresh(cycle: RepairCycle) {
    const source = this.store.get('attempts', cycle.sourceAttemptId), { item } = this.service.nodeContext(source.nodeRunId);
    this.activeCycle(cycle.id);
    await this.service.guidance.refresh(item.projectId);
    this.activeCycle(cycle.id);
    await this.service.artifacts.scanExternalChanges(item.id);
    this.activeCycle(cycle.id);
    assert(requirementFresh(this.store, source.requirementRevisionId) && guidanceFresh(this.store, item.id, source.guidance?.contentHash) && this.service.artifacts.isFresh(source.inputs), 'INPUT_STALE', '修订的需求、章程或上游已变化');
    assert(this.upstreamHash(source) === cycle.upstreamHash && item.acceptedCommit === cycle.acceptedCommit, 'INPUT_STALE', '修订的输入、验证配置或接纳基线已变化');
  }
  private targetRevisions(cycle: Pick<RepairCycle, 'workItemId' | 'targetLogicalIds'>) {
    return cycle.targetLogicalIds.map(logicalId => {
      const artifact = this.store.list('artifacts', a => a.workItemId === cycle.workItemId && a.logicalId === logicalId)[0];
      return { logicalId, revision: artifact ? this.store.get('artifactRevisions', artifact.currentRevisionId) : undefined };
    });
  }
  private revisionIds(cycle: Pick<RepairCycle, 'workItemId' | 'targetLogicalIds'>) {
    return Object.fromEntries(this.targetRevisions(cycle).map(entry => [entry.logicalId, entry.revision?.id ?? null]));
  }
  private assertRevisionIds(cycle: RepairCycle, expected: Record<string, string | null> | undefined) {
    assert(expected && JSON.stringify(this.revisionIds(cycle)) === JSON.stringify(expected), 'CANDIDATE_DRIFT', '修订目标文档在自动化期间被其他操作修改');
  }
  private async targetHash(cycle: Pick<RepairCycle, 'workItemId' | 'targetLogicalIds'>, candidateId?: string) {
    if (candidateId) return treeHash(this.store.get('candidates', candidateId).workspace);
    return hash(JSON.stringify(this.targetRevisions(cycle).map(x => [x.logicalId, x.revision?.id, x.revision?.contentHash])));
  }
  private reviewNodes(cycle: Pick<RepairCycle, 'workflowRunId' | 'targetLogicalIds'>) {
    const run = this.store.get('runs', cycle.workflowRunId);
    return run.definition.nodes.filter(def => def.type === 'review' && reviewSubjects(def).some(id => cycle.targetLogicalIds.includes(id)))
      .map(def => ({ def, node: this.store.list('nodes', n => n.workflowRunId === run.id && n.nodeId === def.id)[0] }));
  }
  private freezeReviewTargets(source: Attempt, targetLogicalIds: string[]) {
    const { project, run } = this.service.nodeContext(source.nodeRunId), result: Record<string, ModelTarget> = {};
    for (const { node, def } of this.reviewNodes({ workflowRunId: run.id, targetLogicalIds })) {
      assert(node, 'REPAIR_SOURCE_INVALID', '修订缺少复核阶段记录');
      const previous = this.store.list('attempts', a => a.nodeRunId === node.id && !!a.review && a.target.backend === source.target.backend).at(-1)?.target;
      const target = [previous, def.target, def.role && run.definition.roles[def.role], def.role && project.defaults[def.role]].find((value): value is ModelTarget => !!value && value.backend === source.target.backend);
      assert(target, 'TARGET_UNAVAILABLE', '修订底座缺少复核模型，请先配置同一底座的复核角色');
      result[node.id] = structuredClone(target);
    }
    return result;
  }
  private evidenceFor(candidateId: string, codeHash: string) {
    const candidate = this.store.get('candidates', candidateId), item = this.store.get('workItems', candidate.workItemId), project = this.store.get('projects', item.projectId);
    return project.commands.map(command => ({ command, evidence: this.store.list('evidence', e => e.candidateId === candidateId && e.command.id === command.id).at(-1) }))
      .map(entry => ({ ...entry, valid: !!entry.evidence && entry.evidence.status === 'passed' && !entry.evidence.stale && entry.evidence.targetHash === codeHash && entry.evidence.commandHash === hash(JSON.stringify(entry.command)) }));
  }
  private async progress(cycle: Pick<RepairCycle, 'workItemId' | 'targetLogicalIds'>, candidateId?: string, invalidOutput = false, reviewFailures: string[] = []): Promise<RepairProgress> {
    const targetHash = await this.targetHash(cycle, candidateId);
    const failedChecks = candidateId ? this.evidenceFor(candidateId, targetHash).filter(e => !e.valid).map(e => `verification:${e.command.id}`) : [];
    if (invalidOutput) failedChecks.push('output:invalid');
    failedChecks.push(...reviewFailures.map(id => `review:${id}:incomplete`));
    return { targetHash, unresolvedFindingIds: openReviewFindings(this.store, cycle.workItemId, cycle.targetLogicalIds).filter(f => f.severity === 'blocker').map(f => f.id).sort(), failedChecks: [...new Set(failedChecks)].sort() };
  }
  async startRepair(nodeRunId: string, expectedRevision: number, options: { maxRounds?: number; mode?: 'code' | 'output'; automationRunId?: string } = {}) {
    const context = this.sourceFor(nodeRunId), { source, item, def, run } = context;
    this.assertRepairOwner(run.id, item.id, options.automationRunId);
    assert(context.requestedNode.revision === expectedRevision, 'REVISION_CONFLICT', '阶段状态已变化，请刷新后重新选择修订');
    assert(!this.starting.has(item.id), 'WORKSPACE_BUSY', '当前工作项正在准备自动化');
    this.starting.add(item.id);
    try {
      assert(!this.store.list('repairCycles', c => c.workItemId === item.id && c.state === 'active').length, 'REPAIR_ACTIVE', '工作项已有活动修订周期');
      assert(!this.attempts(item.id).some(a => this.occupied(a)), 'EXECUTION_UNKNOWN', '工作项仍有活动或未确认执行，不能另建修订尝试');
      assert(source.execution === 'completed' && !!source.finishedAt && !source.stopRequestedAt, 'REPAIR_SOURCE_INVALID', '只有已确认完成的生成尝试可以修订；先核对失败或取消的执行');
      assert(!['CODE_STALE', 'TASK_SCOPE_VIOLATION', 'INPUT_STALE'].includes(source.errorCode || ''), 'REPAIR_SCOPE_INVALID', '原尝试修改了只读或范围外内容，或其依据已过期；必须先核对现场，不能从新基线自动修订');
      assert(!['permission_denied', 'user_cancelled', 'deadline', 'provider_error', 'unknown'].includes(source.stopReason || ''), 'REPAIR_SOURCE_INVALID', '执行因权限、取消、时限或底座故障停止，不能自动修改代码');
      await this.service.guidance.refresh(item.projectId);
      this.assertRepairOwner(run.id, item.id, options.automationRunId);
      assert(requirementFresh(this.store, source.requirementRevisionId) && guidanceFresh(this.store, item.id, source.guidance?.contentHash) && this.service.artifacts.isFresh(source.inputs), 'INPUT_STALE', '原尝试的冻结输入已过期');
      const mode = options.mode ?? (def.role === 'developer' && source.errorCode !== 'OUTPUT_INVALID' ? 'code' : 'output');
      assert(mode !== 'code' || def.role === 'developer', 'REPAIR_MODE_INVALID', '只有代码实现阶段可以创建代码修订');
      const sourceCandidate = source.candidateId ? this.store.get('candidates', source.candidateId) : undefined;
      if (sourceCandidate) {
        assert(this.service.latestCandidate(item.id)?.id === sourceCandidate.id, 'CODE_STALE', '失败候选已被替换');
        const expectedHash = sourceCandidate.contentHash || this.store.list('evidence', e => e.candidateId === sourceCandidate.id && !e.stale).at(-1)?.targetHash;
        assert(expectedHash && await treeHash(sourceCandidate.workspace) === expectedHash, 'CANDIDATE_DRIFT', '失败候选没有稳定终态快照或已被外部修改，请先核对');
        this.assertRepairOwner(run.id, item.id, options.automationRunId);
      }
      const scope = { workItemId: item.id, targetLogicalIds: def.outputs };
      const invalidOutput = !def.outputs.every(logicalId => this.targetRevisions(scope).some(entry => entry.logicalId === logicalId && entry.revision?.originAttemptId === source.id));
      const initialProgress = await this.progress(scope, source.candidateId, invalidOutput);
      this.assertRepairOwner(run.id, item.id, options.automationRunId);
      assert(initialProgress.unresolvedFindingIds.length || initialProgress.failedChecks.length || context.requestedNode.gate === 'blocked' || !!source.error, 'REPAIR_NOT_NEEDED', '当前没有已记录的失败证据需要修订');
      const data = createRepairCycleData({ workItemId: item.id, workflowRunId: run.id, producerNodeRunId: source.nodeRunId, sourceAttemptId: source.id,
        ...(source.candidateId ? { sourceCandidateId: source.candidateId } : {}), acceptedCommit: item.acceptedCommit, upstreamHash: this.upstreamHash(source), target: source.target,
        targetLogicalIds: def.outputs, mode, initialProgress, maxRounds: options.maxRounds });
      const reviewTargets = this.freezeReviewTargets(source, def.outputs);
      const cycle = this.store.tx(() => {
        this.assertRepairOwner(run.id, item.id, options.automationRunId);
        assert(this.store.get('nodes', nodeRunId).revision === expectedRevision, 'REVISION_CONFLICT', '修订准备期间阶段发生变化');
        assert(!this.store.list('repairCycles', c => c.workItemId === item.id && c.state === 'active').length, 'REPAIR_ACTIVE', '工作项已有活动修订周期');
        return this.store.create('repairCycles', { ...data, initialTargetRevisionIds: this.revisionIds(scope), reviewTargets, ...(options.automationRunId ? { automationRunId: options.automationRunId } : {}) });
      });
      this.queue(item.id); return cycle;
    } finally { this.starting.delete(item.id); }
  }
  async stopRepair(cycleId: string) {
    const cycle = this.store.get('repairCycles', cycleId);
    if (cycle.state === 'completed' || cycle.state === 'cancelled') return cycle;
    const stopped = this.store.update('repairCycles', cycleId, { state: 'cancelled', stopReason: 'user_cancelled', pendingActionKey: undefined });
    for (const node of this.store.list('nodes', n => n.repairCycleId === cycleId && n.type === 'verify' && ['running', 'reconciling'].includes(n.execution))) this.service.stopVerification(node.id);
    for (const attempt of this.store.list('attempts', a => a.repairCycleId === cycleId && this.occupied(a))) await this.service.stopAttempt(attempt.id);
    return stopped;
  }
  private async seedCandidate(cycle: RepairCycle, round: RepairRound): Promise<Candidate | undefined> {
    this.activeCycle(cycle.id);
    if (!cycle.sourceCandidateId) return undefined;
    return this.service.withWorkspaceLock(cycle.workItemId, async () => {
      this.activeCycle(cycle.id);
      let op = this.store.list('candidateSnapshotOperations', operation => operation.repairCycleId === cycle.id && operation.round === round.number)[0];
      if (op?.state === 'activated') return this.store.get('candidates', op.candidateId!);
      assert(op?.state !== 'conflict', 'SNAPSHOT_CONFLICT', '修订快照已发生冲突，不能自动重试');
      const previousRound = cycle.rounds.filter(r => r.number < round.number).at(-1);
      const parent = this.store.get('candidates', previousRound?.candidateId || cycle.sourceCandidateId!);
      const expectedHash = previousRound?.progress?.targetHash || cycle.initialProgress.targetHash;
      assert(this.service.latestCandidate(cycle.workItemId)?.id === parent.id, 'CODE_STALE', '失败候选已被另一候选替换');
      assert(await treeHash(parent.workspace) === expectedHash, 'CANDIDATE_DRIFT', '失败候选在修订开始前被修改');
      this.activeCycle(cycle.id);
      await this.assertFresh(cycle);
      if (!op) op = this.store.tx(() => {
        const current = this.activeCycle(cycle.id);
        const created = this.store.create('candidateSnapshotOperations', { workItemId: cycle.workItemId, repairCycleId: cycle.id, round: round.number,
          parentCandidateId: parent.id, parentCodeHash: expectedHash, baseCommit: cycle.acceptedCommit, state: 'prepared' });
        this.store.update('repairCycles', current.id, updateRepairRound(current, { snapshotOperationId: created.id }));
        return created;
      });
      try {
        if (op.state === 'prepared') {
          const snapshot = await this.service.workspaces.snapshotCandidate(parent.workspace, op.parentCodeHash, op.id);
          op = this.store.update('candidateSnapshotOperations', op.id, { seedCommit: snapshot.seedCommit, snapshotRef: snapshot.snapshotRef, state: 'snapshotted' });
          this.activeCycle(cycle.id);
        }
        this.activeCycle(cycle.id);
        const project = this.store.get('projects', this.store.get('workItems', cycle.workItemId).projectId);
        const seeded = await this.service.workspaces.createFromSnapshot(project.rootPath, op.seedCommit!, op.id, op.parentCodeHash);
        op = this.store.update('candidateSnapshotOperations', op.id, { workspace: seeded.workspace, branch: seeded.branch, state: 'seeded' });
        this.activeCycle(cycle.id);
        await this.assertFresh(cycle);
        assert(await treeHash(parent.workspace) === op.parentCodeHash, 'CANDIDATE_DRIFT', '派生期间原候选发生变化');
        this.activeCycle(cycle.id);
        const operation = op;
        return this.store.tx(() => {
          const current = this.activeCycle(cycle.id);
          assert(this.service.latestCandidate(cycle.workItemId)?.id === parent.id, 'CODE_STALE', '候选激活前已被其他操作替换');
          const candidate = this.store.create('candidates', { workItemId: cycle.workItemId, workspace: seeded.workspace, branch: seeded.branch,
            baseCommit: cycle.acceptedCommit, seedCommit: seeded.seedCommit, checkpointCommit: seeded.seedCommit, attemptId: '', status: 'working', activation: 'active',
            contentHash: operation.parentCodeHash, parentCandidateId: parent.id, parentCodeHash: operation.parentCodeHash, repairCycleId: cycle.id, repairRound: round.number, snapshotOperationId: operation.id });
          this.store.update('candidateSnapshotOperations', operation.id, { candidateId: candidate.id, state: 'activated' });
          this.store.update('repairCycles', cycle.id, updateRepairRound(current, { candidateId: candidate.id, snapshotOperationId: operation.id }));
          return candidate;
        });
      } catch (error) {
        const stopped = error instanceof DomainError && ['REPAIR_CANCELLED', 'AUTOMATION_STOPPED', 'AUTOMATION_PAUSED'].includes(error.code);
        this.store.update('candidateSnapshotOperations', op.id, { ...(stopped ? {} : { state: 'conflict' as const }), error: (error as Error).message });
        throw error;
      }
    });
  }
  private roundOutputValid(cycle: RepairCycle, attempt: Attempt) { return this.targetRevisions(cycle).every(entry => entry.revision?.originAttemptId === attempt.id); }
  private updateVerificationNodes(cycle: RepairCycle, passed: boolean) {
    if (!cycle.sourceCandidateId) return;
    const run = this.store.get('runs', cycle.workflowRunId);
    for (const def of run.definition.nodes.filter(def => def.type === 'verify' && def.inputs.some(i => cycle.targetLogicalIds.includes(i.split('@')[0])))) {
      const node = this.store.list('nodes', n => n.workflowRunId === run.id && n.nodeId === def.id)[0];
      if (node) this.store.update('nodes', node.id, { execution: 'completed', freshness: 'fresh', gate: passed ? 'passed' : 'blocked', acceptance: passed ? 'accepted' : 'pending', blockers: passed ? [] : ['修订候选的当前版本验证未通过'] });
    }
  }
  async tickRepair(cycleId: string) {
    let cycle = this.store.get('repairCycles', cycleId);
    if (cycle.state !== 'active') return;
    try {
      await this.assertFresh(cycle);
      cycle = this.activeCycle(cycleId);
      const occupied = this.attempts(cycle.workItemId).filter(a => this.occupied(a));
      if (occupied.some(a => a.execution === 'reconciling' || a.writeOccupancy === 'held' && !activeStates.has(a.execution))) { this.pause(cycle, 'execution_unknown'); return; }
      if (occupied.length) return;
      const cycleAttempts = this.store.list('attempts', a => a.repairCycleId === cycle.id);
      const stopped = cycleAttempts.find(a => a.stopRequestedAt || a.execution === 'cancelled' || a.stopReason === 'permission_denied');
      if (stopped) { this.pause(cycle, stopped.stopReason === 'permission_denied' ? 'permission_denied' : stopped.stopReason === 'deadline' ? 'budget_exhausted' : 'user_cancelled'); return; }
      let round = cycle.rounds.at(-1);
      if (!round || round.phase === 'evaluated') {
        if (cycle.rounds.length >= cycle.maxRounds) { this.pause(cycle, 'round_limit'); return; }
        const expected = round?.outputRevisionIds ?? cycle.initialTargetRevisionIds;
        this.assertRevisionIds(cycle, expected);
        cycle = this.store.tx(() => {
          cycle = this.activeCycle(cycleId);
          const appended = this.store.update('repairCycles', cycle.id, appendRepairRound(cycle), cycle.revision);
          return this.store.update('repairCycles', cycle.id, updateRepairRound(appended, { inputRevisionIds: expected }));
        }); round = cycle.rounds.at(-1)!;
      }
      if (round.phase === 'preparing') {
        this.assertRevisionIds(cycle, round.inputRevisionIds ?? cycle.initialTargetRevisionIds);
        const candidate = await this.seedCandidate(cycle, round);
        cycle = this.activeCycle(cycle.id); round = cycle.rounds.at(-1)!;
        await this.assertFresh(cycle);
        cycle = this.activeCycle(cycle.id); round = cycle.rounds.at(-1)!;
        await this.service.dispatchRepairAttempt(cycle, round, candidate?.id);
        return;
      }
      assert(round.attemptId, 'EXECUTION_UNKNOWN', '修订步骤缺少已持久化的执行身份');
      const producer = this.store.get('attempts', round.attemptId);
      if (['CODE_STALE', 'TASK_SCOPE_VIOLATION', 'INPUT_STALE'].includes(producer.errorCode || '')) {
        this.pause(cycle, producer.errorCode === 'CODE_STALE' ? 'candidate_drift' : producer.errorCode === 'INPUT_STALE' ? 'input_stale' : 'unrepairable', producer.error);
        return;
      }
      if (producer.execution !== 'completed' || !producer.finishedAt || producer.writeOccupancy === 'held') { this.pause(cycle, budgetCodes.has(producer.errorCode || '') ? 'budget_exhausted' : producer.execution === 'failed' ? 'unrepairable' : 'execution_unknown', producer.error); return; }
      const candidateId = round.candidateId || producer.candidateId;
      if (candidateId) {
        const candidate = this.store.get('candidates', candidateId);
        assert(this.service.latestCandidate(cycle.workItemId)?.id === candidateId && candidate.contentHash && await treeHash(candidate.workspace) === candidate.contentHash, 'CANDIDATE_DRIFT', '修订结束后的候选内容发生变化');
        cycle = this.activeCycle(cycle.id); round = cycle.rounds.at(-1)!;
      }
      if (round.phase === 'producing') {
        for (const entry of this.targetRevisions(cycle)) {
          const artifact = this.store.list('artifacts', a => a.workItemId === cycle.workItemId && a.logicalId === entry.logicalId)[0];
          const produced = artifact && this.store.list('artifactRevisions', r => r.artifactId === artifact.id && r.originAttemptId === producer.id).at(-1);
          assert((entry.revision?.id ?? null) === (produced?.id ?? round.inputRevisionIds?.[entry.logicalId] ?? null), 'CANDIDATE_DRIFT', '生成期间目标文档被其他操作替换');
        }
        cycle = this.store.update('repairCycles', cycle.id, updateRepairRound(cycle, { phase: 'verifying', outputRevisionIds: this.revisionIds(cycle) })); round = cycle.rounds.at(-1)!;
      } else this.assertRevisionIds(cycle, round.outputRevisionIds);
      const outputValid = this.roundOutputValid(cycle, producer), codeHash = await this.targetHash(cycle, candidateId);
      cycle = this.activeCycle(cycle.id); round = cycle.rounds.at(-1)!;
      const evidence = candidateId ? this.evidenceFor(candidateId, codeHash) : [];
      const requiredVerification = this.store.get('runs', cycle.workflowRunId).definition.requiredVerification;
      const verificationPassed = !candidateId || evidence.length > 0 && evidence.every(entry => entry.valid) && requiredVerification.every(id => evidence.some(entry => entry.command.id === id));
      if (round.phase === 'verifying') {
        cycle = this.store.update('repairCycles', cycle.id, updateRepairRound(cycle, { evidenceIds: evidence.flatMap(e => e.evidence ? [e.evidence.id] : []) }));
        this.updateVerificationNodes(cycle, verificationPassed);
        if (!outputValid || !verificationPassed) {
          const progress = await this.progress(cycle, candidateId, !outputValid);
          cycle = this.activeCycle(cycle.id);
          this.store.update('repairCycles', cycle.id, assessRepairRound(cycle, { progress, outputValid, verificationPassed, reviewPassed: false }));
          this.dirty.add(cycle.workItemId); return;
        }
        cycle = this.store.update('repairCycles', cycle.id, updateRepairRound(cycle, { phase: 'reviewing' })); round = cycle.rounds.at(-1)!;
      }
      const reviewers = this.reviewNodes(cycle), failedReviews: string[] = [];
      assert(reviewers.length || !this.store.get('runs', cycle.workflowRunId).definition.requireReview, 'REPAIR_REVIEW_MISSING', '当前目标缺少必需独立复核');
      for (const { node } of reviewers) {
        assert(node, 'REPAIR_REVIEW_MISSING', '复核阶段记录缺失');
        const attempts = this.store.list('attempts', a => a.nodeRunId === node.id && a.repairCycleId === cycle.id && a.repairRound === round!.number && !!a.review);
        if (!attempts.length) {
          cycle = this.activeCycle(cycle.id);
          await this.service.startNode(node.id, this.store.get('nodes', node.id).revision, cycle.reviewTargets?.[node.id], { repairCycleId: cycle.id, repairRound: round.number });
          return;
        }
        if (attempts.some(a => this.occupied(a))) return;
        const coverage = attempts.find(a => a.review?.perspective === 'coverage'), adversarial = attempts.find(a => a.review?.perspective === 'adversarial');
        const currentNode = this.store.get('nodes', node.id);
        if (!coverage?.reviewReport || !adversarial?.reviewReport || coverage.review?.groupId !== adversarial.review?.groupId || currentNode.currentAttemptId !== adversarial.id || currentNode.gate !== 'passed' || currentNode.freshness !== 'fresh') failedReviews.push(node.id);
      }
      const reviews = this.store.list('attempts', a => a.repairCycleId === cycle.id && a.repairRound === round!.number && !!a.review);
      cycle = this.activeCycle(cycle.id);
      cycle = this.store.update('repairCycles', cycle.id, updateRepairRound(cycle, { reviewAttemptIds: reviews.map(a => a.id), reviewGroupIds: [...new Set(reviews.flatMap(a => a.review ? [a.review.groupId] : []))] }));
      const progress = await this.progress(cycle, candidateId, false, failedReviews);
      cycle = this.activeCycle(cycle.id);
      const assessed = this.store.update('repairCycles', cycle.id, assessRepairRound(cycle, { progress, outputValid, verificationPassed, reviewPassed: !failedReviews.length }));
      if (assessed.state === 'completed') {
        const { node, def } = this.service.nodeContext(cycle.producerNodeRunId);
        // A resolved producer finding must not leave an obsolete blocked gate
        // that auto-repair would mistake for a fresh failure and repair forever.
        if (node.currentAttemptId === producer.id) this.store.update('nodes', node.id, { gate: def.requireAcceptance ? 'unchecked' : 'passed', freshness: 'fresh', blockers: def.requireAcceptance ? ['独立复核已通过，等待人工接纳当前产物'] : [], error: undefined });
      }
      this.store.emit(cycle.id, 'repair.round-assessed', { round: round.number, state: assessed.state, stopReason: assessed.stopReason });
      this.dirty.add(cycle.workItemId);
    } catch (error) {
      if (error instanceof DomainError && error.code === 'AUTOMATION_PAUSED') return;
      const reason = this.failureReason(error);
      this.pause(this.store.get('repairCycles', cycleId), reason, (error as Error).message);
      if (reason === 'input_stale' || reason === 'candidate_drift') for (const attempt of this.store.list('attempts', a => a.repairCycleId === cycleId && this.occupied(a))) {
        try { await this.service.requestAttemptStop(attempt.id, 'input_stale'); }
        catch (stopError) { this.store.emit(cycleId, 'repair.stop-unconfirmed', { attemptId: attempt.id, message: (stopError as Error).message }); }
      }
    }
  }
  async startAutomation(runId: string, expectedRevision: number, settings: AutomationSettings = defaultAutomationSettings) {
    const run = this.store.get('runs', runId);
    assert(run.revision === expectedRevision, 'REVISION_CONFLICT', '流程已经变化，请刷新');
    assert(run.state === 'active', 'WORKFLOW_INACTIVE', '只有活动流程可以开启自动推进');
    assert(typeof settings.autoAdvance === 'boolean' && typeof settings.autoRepair === 'boolean' && (settings.autoAdvance || settings.autoRepair), 'AUTOMATION_INVALID', '请选择自动推进或自动修订');
    assert(Number.isSafeInteger(settings.maxRepairRounds) && settings.maxRepairRounds > 0 && settings.maxRepairRounds <= 10, 'AUTOMATION_INVALID', '修订轮数必须为 1 到 10 的整数');
    const automation = this.store.tx(() => {
      assert(!this.store.list('automationRuns', a => a.workItemId === run.workItemId && a.state === 'active').length, 'AUTOMATION_ACTIVE', '工作项已有活动自动化');
      const occupiedOwners = this.store.list('automationRuns', a => a.workItemId === run.workItemId && this.ownsLiveWork(a));
      assert(!occupiedOwners.some(owner => owner.state === 'cancelled' || owner.workflowRunId !== run.id), 'AUTOMATION_STOP_UNCONFIRMED', '原自动化仍有待停止或待核对的执行，请先确认结束');
      const paused = occupiedOwners.filter(owner => owner.state === 'paused');
      assert(paused.length <= 1, 'AUTOMATION_OWNER_CONFLICT', '工作项存在多个活动执行的自动化身份，请先核对');
      if (paused.length) {
        const owner = paused[0];
        assert(owner.settings.autoAdvance === settings.autoAdvance && owner.settings.autoRepair === settings.autoRepair && owner.settings.maxRepairRounds === settings.maxRepairRounds,
          'AUTOMATION_SCOPE_LOCKED', '恢复尚有执行的自动化必须沿用原设置和修订轮数；先完成或停止原执行后再调整');
        this.store.update('runs', run.id, { automation: structuredClone(owner.settings) }, expectedRevision);
        return this.store.update('automationRuns', owner.id, { state: 'active', pauseReason: undefined }, owner.revision);
      }
      this.store.update('runs', run.id, { automation: structuredClone(settings) }, expectedRevision);
      return this.store.create('automationRuns', { workItemId: run.workItemId, workflowRunId: run.id, settings: structuredClone(settings), state: 'active', startedNodeRunIds: [] });
    });
    this.queue(run.workItemId); return automation;
  }
  async stopAutomation(automationId: string) {
    const automation = this.store.get('automationRuns', automationId);
    if (['completed', 'cancelled'].includes(automation.state)) return automation;
    const stopped = this.store.update('automationRuns', automationId, { state: 'cancelled', pauseReason: 'user_cancelled', pendingActionKey: undefined });
    for (const node of this.store.list('nodes', n => n.automationRunId === automationId && n.type === 'verify' && ['running', 'reconciling'].includes(n.execution))) this.service.stopVerification(node.id);
    for (const cycle of this.store.list('repairCycles', c => c.automationRunId === automationId && c.state === 'active')) await this.stopRepair(cycle.id);
    for (const attempt of this.store.list('attempts', a => a.automationRunId === automationId && this.occupied(a))) await this.service.stopAttempt(attempt.id);
    return stopped;
  }
  private async tickAutomation(automation: AutomationRun) {
    const active = this.activeAutomation(automation.id);
    if (!active) return;
    automation = active;
    const run = this.store.get('runs', automation.workflowRunId);
    if (run.state !== 'active') { this.updateActiveAutomation(automation.id, { state: run.state === 'completed' ? 'completed' : 'paused', pauseReason: 'workflow_inactive' }); return; }
    const nodes = this.store.list('nodes', n => n.workflowRunId === run.id);
    const waiting = nodes.find(n => ['reconciling', 'waiting_interaction'].includes(n.execution));
    if (waiting) { this.updateActiveAutomation(automation.id, { state: 'paused', pauseReason: waiting.execution === 'waiting_interaction' ? 'waiting_for_input' : 'execution_unknown' }); return; }
    if (nodes.some(n => ['starting', 'running'].includes(n.execution))) return;
    const failed = nodes.find(n => n.gate === 'blocked' && n.execution === 'completed');
    if (failed && automation.settings.autoRepair) {
      const priorCycles = this.store.list('repairCycles', c => c.automationRunId === automation.id && c.workflowRunId === run.id);
      if (priorCycles.some(c => c.state === 'paused' || c.state === 'cancelled')) { this.updateActiveAutomation(automation.id, { state: 'paused', pauseReason: 'repair_stopped' }); return; }
      try {
        await this.startRepair(failed.id, failed.revision, { maxRounds: automation.settings.maxRepairRounds, automationRunId: automation.id });
        if (!this.activeAutomation(automation.id)) return;
        this.dirty.add(run.workItemId); return;
      } catch (error) {
        this.updateActiveAutomation(automation.id, { state: 'paused', pauseReason: (error as Error).message }); return;
      }
    }
    if (!automation.settings.autoAdvance) { this.updateActiveAutomation(automation.id, { state: 'paused', pauseReason: 'no_repairable_failure' }); return; }
    const readiness: Record<string, { ready: boolean; reasons: string[] }> = {};
    for (const node of nodes) if (node.execution === 'pending') {
      readiness[node.id] = await this.service.readiness(node.id);
      const current = this.activeAutomation(automation.id);
      if (!current) return;
      automation = current;
      if (this.store.get('runs', run.id).state !== 'active') { this.updateActiveAutomation(automation.id, { state: 'paused', pauseReason: 'workflow_inactive' }); return; }
    }
    if (!this.activeAutomation(automation.id)) return;
    const action = selectNextAutomationAction({ run: this.store.get('runs', run.id), nodes: this.store.list('nodes', n => n.workflowRunId === run.id), readiness, automation,
      existingLogicalIds: this.store.list('artifacts', a => a.workItemId === run.workItemId).map(a => a.logicalId) });
    if (action.kind === 'dispatch') {
      if (this.updateActiveAutomation(automation.id, { pendingActionKey: action.actionKey }).state !== 'active') return;
      try {
        const node = this.store.get('nodes', action.nodeRunId);
        await this.service.startNode(node.id, node.revision, undefined, { automationRunId: automation.id });
        const current = this.activeAutomation(automation.id);
        if (!current) return;
        this.updateActiveAutomation(automation.id, { pendingActionKey: undefined, startedNodeRunIds: [...new Set([...current.startedNodeRunIds, node.id])] });
        if (this.store.get('nodes', node.id).execution === 'completed') this.dirty.add(run.workItemId);
      } catch (error) { this.updateActiveAutomation(automation.id, { state: 'paused', pauseReason: (error as Error).message }); }
    } else if (action.kind === 'complete') this.updateActiveAutomation(automation.id, { state: 'completed', pendingActionKey: undefined });
    else if (action.kind !== 'observe') this.updateActiveAutomation(automation.id, { state: 'paused', pauseReason: action.reason, pendingActionKey: undefined });
  }
  async tickWorkItem(workItemId: string) {
    if (this.ticking.has(workItemId)) { this.dirty.add(workItemId); return; }
    this.ticking.add(workItemId);
    try {
      do {
        this.dirty.delete(workItemId);
        const cycles = this.store.list('repairCycles', c => c.workItemId === workItemId && c.state === 'active');
        for (const cycle of cycles) await this.tickRepair(cycle.id);
        if (!this.store.list('repairCycles', c => c.workItemId === workItemId && c.state === 'active').length) for (const automation of this.store.list('automationRuns', a => a.workItemId === workItemId && a.state === 'active')) await this.tickAutomation(automation);
      } while (this.dirty.has(workItemId));
    } finally { this.ticking.delete(workItemId); }
  }
  async recover() {
    const workItems = new Set<string>();
    for (const cycle of this.store.list('repairCycles', c => c.state === 'active')) {
      const operations = this.store.list('candidateSnapshotOperations', o => o.repairCycleId === cycle.id);
      if (operations.some(o => o.state === 'conflict')) this.pause(cycle, 'candidate_drift', '修订快照操作需要人工核对');
      else workItems.add(cycle.workItemId);
    }
    for (const automation of this.store.list('automationRuns', a => a.state === 'active')) workItems.add(automation.workItemId);
    for (const workItemId of workItems) this.queue(workItemId);
  }
}
