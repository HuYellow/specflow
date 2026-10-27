import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { EngineeringService } from '../packages/specflow-core/service.ts';
import { SandboxBackend } from '../packages/specflow-core/sandbox-backend.ts';
import type { Attempt, ExecutionRef, ModelTarget, WorkflowNode } from '../packages/domain/index.ts';
import type { ExecutionSnapshot, ExecutionUpdate, FrozenInput } from '../packages/execution-contract/index.ts';
import { turnUsage } from '../packages/execution-contract/measurements.ts';
import { acceptedDocuments, fixture, runNode } from './helpers.ts';

const target: ModelTarget = { backend: 'maka', rootId: 'control-fixture', connectionId: 'control-fixture', connectionSlug: 'control-fixture', model: 'fixture' };
async function until(predicate: () => boolean | Promise<boolean>, message: string) {
  const end = Date.now() + 8000;
  while (Date.now() < end) { if (await predicate()) return; await new Promise(done => setTimeout(done, 15)); }
  assert.fail(message);
}
function node(f: Awaited<ReturnType<typeof fixture>>, nodeId = 'specify') { return f.store.list('nodes', value => value.nodeId === nodeId).at(-1)!; }
function configureNode(f: Awaited<ReturnType<typeof fixture>>, id: string, patch: Partial<WorkflowNode>) {
  const run = f.store.list('runs').at(-1)!;
  f.store.update('runs', run.id, { definition: { ...run.definition, nodes: run.definition.nodes.map(value => value.id === id ? { ...value, ...patch } : value) } });
}

class MeterBackend extends SandboxBackend {
  starts = 0;
  queries: ExecutionRef[] = [];
  meters = new Map<string, number>();
  override async inspect() { return { ...await super.inspect(), rootId: target.rootId, stepLimit: 'native' as const, stepUnit: 'runtime-step' }; }
  override async listTargets() { return [target]; }
  override async prepare(input: FrozenInput) { const ref = { ...await super.prepare(input), backend: 'maka' as const, rootId: target.rootId! }; this.meters.set(ref.turnId, this.meters.size + 1); return ref; }
  override async start(ref: ExecutionRef, input: FrozenInput) { this.starts++; return this.measure(await super.start(ref, input)); }
  override async query(ref: ExecutionRef) { this.queries.push(ref); return this.measure(await super.query(ref)); }
  private measure(snapshot: ExecutionSnapshot): ExecutionSnapshot {
    if (snapshot.state !== 'completed') return snapshot;
    const count = this.meters.get(snapshot.ref.turnId) ?? 1;
    return { ...snapshot, usage: undefined, termination: { reason: 'natural_completion', confirmed: true }, usageMeasurement: turnUsage(snapshot.ref, { inputTokens: count * 10, outputTokens: count * 2, costUsd: count * 0.01 }, snapshot.terminalEventId) };
  }
}

class UncertainBackend extends SandboxBackend {
  starts = 0;
  prepareEntered = false;
  holdPrepare = false;
  releasePrepare: () => void = () => {};
  private prepareGate = new Promise<void>(done => { this.releasePrepare = done; });
  stops: ExecutionRef[] = [];
  queries: ExecutionRef[] = [];
  private snapshots = new Map<string, ExecutionSnapshot>();
  override async inspect() { return { ...await super.inspect(), rootId: target.rootId }; }
  override async listTargets() { return [target]; }
  override async prepare(input: FrozenInput): Promise<ExecutionRef> {
    this.prepareEntered = true;
    if (this.holdPrepare) await this.prepareGate;
    const ref: ExecutionRef = { backend: 'maka', rootId: target.rootId!, sessionId: input.attemptId, turnId: `turn-${input.attemptId}` };
    this.snapshots.set(ref.turnId, { state: 'unknown', ref, error: 'Prepared; input not sent' });
    return ref;
  }
  override async start(ref: ExecutionRef, _input: FrozenInput): Promise<ExecutionSnapshot> {
    this.starts++; this.snapshots.set(ref.turnId, { state: 'running', ref });
    throw new Error('The start receipt was lost after dispatch');
  }
  override async query(ref: ExecutionRef) { this.queries.push(ref); return this.snapshots.get(ref.turnId)!; }
  override async readResult(ref: ExecutionRef) { return this.query(ref); }
  override async *observe(ref: ExecutionRef): AsyncIterable<ExecutionUpdate> { yield { kind: 'progress', snapshot: await this.query(ref) }; }
  override async stop(ref: ExecutionRef) {
    this.stops.push(ref);
    this.snapshots.set(ref.turnId, { state: 'unknown', ref, error: 'Stop requested; terminal evidence is unavailable', termination: { reason: 'user_cancelled', confirmed: false } });
  }
}

test('multiple task executions accumulate usage and repeated terminal reconciliation cannot double-charge', { timeout: 30000 }, async () => {
  const backend = new MeterBackend(), f = await fixture(backend);
  try {
    await acceptedDocuments(f);
    const artifact = f.store.list('artifacts', value => value.logicalId === 'tasks')[0], previous = f.store.get('artifactRevisions', artifact.currentRevisionId);
    f.service.artifacts.create(f.item.id, 'tasks', `${previous.content}\n- [ ] T002 验收：既有解析测试全部通过。\n- [ ] T003 验收：错误输入测试全部通过。`, previous.inputs, undefined, artifact.revision);
    await runNode(f, 'review-tasks'); const tasks = f.store.get('artifacts', artifact.id); await f.service.acceptArtifact(tasks.id, tasks.revision);
    const implemented = await runNode(f, 'implement', target);
    assert.equal(implemented.execution, 'completed', implemented.error); assert.equal(backend.starts, 3);
    const attempt = f.store.get('attempts', implemented.currentAttemptId!);
    assert.deepEqual(attempt.usageSummary?.known, { inputTokens: 60, outputTokens: 12, costUsd: 0.06 });
    assert.equal(attempt.usageSummary?.completeness, 'complete'); assert.equal(attempt.usageSummary?.executions, 3);
    assert.equal(f.store.list('usageRecords', record => record.attemptIds.includes(attempt.id)).length, 3);
    await f.service.reconcile(attempt.id); await f.service.reconcile(attempt.id); await f.service.waitForIdle();
    const rechecked = f.store.get('attempts', attempt.id);
    assert.deepEqual(rechecked.usageSummary, attempt.usageSummary);
    assert.equal(f.store.list('usageRecords', record => record.attemptIds.includes(attempt.id)).length, 3);
    assert.equal(backend.starts, 3);
  } finally { await f.cleanup(); }
});

test('initialize discovers reconciling attempts and reads the exact original execution without dispatching again', { timeout: 20000 }, async () => {
  class LostMeterReceipt extends MeterBackend {
    override async start(ref: ExecutionRef, input: FrozenInput): Promise<ExecutionSnapshot> { await super.start(ref, input); throw new Error('receipt lost'); }
  }
  const backend = new LostMeterReceipt(), f = await fixture(backend);
  let restored: EngineeringService | undefined;
  try {
    await runNode(f, 'specify', target);
    const attempt = f.store.list('attempts')[0], binding = f.store.get('bindings', attempt.bindingId!);
    assert.equal(attempt.execution, 'reconciling');
    restored = new EngineeringService(f.store, f.root, f.service.registry);
    await restored.initialize(); await restored.waitForIdle();
    assert.equal(f.store.get('attempts', attempt.id).execution, 'completed');
    assert.equal(f.store.get('attempts', attempt.id).deadlineAt, attempt.deadlineAt);
    assert.ok(backend.queries.some(ref => JSON.stringify(ref) === JSON.stringify(binding.ref)));
    assert.equal(backend.starts, 1); assert.equal(f.store.list('bindings', value => value.attemptId === attempt.id).length, 1);
  } finally { restored?.beginShutdown(); await restored?.waitForIdle(); await f.cleanup(); }
});

test('an expired persisted deadline survives restart and stops the old identity before any new dispatch', { timeout: 20000 }, async () => {
  const backend = new UncertainBackend(), f = await fixture(backend);
  let restored: EngineeringService | undefined;
  try {
    await runNode(f, 'specify', target);
    const attempt = f.store.list('attempts')[0], binding = f.store.get('bindings', attempt.bindingId!);
    const expired = new Date(Date.now() - 1000).toISOString(); f.store.update('attempts', attempt.id, { deadlineAt: expired });
    restored = new EngineeringService(f.store, f.root, f.service.registry);
    await restored.initialize(); await restored.waitForIdle();
    const rechecked = f.store.get('attempts', attempt.id);
    assert.equal(rechecked.deadlineAt, expired); assert.equal(rechecked.stopReason, 'deadline'); assert.ok(rechecked.stopRequestedAt);
    assert.equal(rechecked.terminalConfirmedAt, undefined); assert.equal(rechecked.execution, 'reconciling');
    assert.ok(backend.stops.some(ref => JSON.stringify(ref) === JSON.stringify(binding.ref)));
    const current = node(f); await assert.rejects(restored.startNode(current.id, current.revision, target));
    assert.equal(backend.starts, 1); assert.equal(f.store.list('attempts').length, 1);
  } finally { restored?.beginShutdown(); await restored?.waitForIdle(); await f.cleanup(); }
});

test('an unconfirmed stop holds the work item and blocks replacement execution', { timeout: 15000 }, async () => {
  const backend = new UncertainBackend(), f = await fixture(backend);
  try {
    await runNode(f, 'specify', target);
    const attempt = f.store.list('attempts')[0];
    await f.service.stopAttempt(attempt.id); await f.service.waitForIdle();
    const stopped = f.store.get('attempts', attempt.id);
    assert.ok(stopped.stopRequestedAt); assert.equal(stopped.terminalConfirmedAt, undefined);
    assert.equal(stopped.execution, 'reconciling'); assert.equal(stopped.stopReason, 'user_cancelled');
    const current = node(f); await assert.rejects(f.service.startNode(current.id, current.revision, target));
    assert.equal(backend.starts, 1); assert.equal(f.store.list('attempts').length, 1);
  } finally { await f.cleanup(); }
});

test('an explicitly unconfirmed terminal snapshot cannot settle a dispatch or publish artifacts', { timeout: 15000 }, async () => {
  class UnconfirmedTerminal extends MeterBackend {
    override async start(ref: ExecutionRef, input: FrozenInput) { return { ...await super.start(ref, input), termination: { reason: 'unknown' as const, confirmed: false } }; }
    override async query(ref: ExecutionRef) { return { ...await super.query(ref), termination: { reason: 'unknown' as const, confirmed: false } }; }
  }
  const backend = new UnconfirmedTerminal(), f = await fixture(backend);
  try {
    await runNode(f, 'specify', target);
    const attempt = f.store.list('attempts')[0];
    assert.equal(attempt.execution, 'reconciling'); assert.equal(attempt.terminalConfirmedAt, undefined);
    assert.equal(f.store.list('artifactRevisions', value => value.originAttemptId === attempt.id).length, 0);
    assert.ok(f.store.list('dispatchIntents', value => value.attemptId === attempt.id).every(value => value.state !== 'terminal'));
  } finally { await f.cleanup(); }
});

test('an unconfirmed task terminal cannot trigger verification, the next task or a completed artifact', { timeout: 30000 }, async () => {
  class UnconfirmedTaskTerminal extends MeterBackend {
    override async start(ref: ExecutionRef, input: FrozenInput) { return { ...await super.start(ref, input), termination: { reason: 'unknown' as const, confirmed: false } }; }
    override async query(ref: ExecutionRef) { return { ...await super.query(ref), termination: { reason: 'unknown' as const, confirmed: false } }; }
  }
  const backend = new UnconfirmedTaskTerminal(), f = await fixture(backend);
  try {
    await acceptedDocuments(f);
    const artifact = f.store.list('artifacts', value => value.logicalId === 'tasks')[0], previous = f.store.get('artifactRevisions', artifact.currentRevisionId);
    f.service.artifacts.create(f.item.id, 'tasks', `${previous.content}\n- [ ] T002 验收：错误输入测试全部通过。`, previous.inputs, undefined, artifact.revision);
    await runNode(f, 'review-tasks'); const tasks = f.store.get('artifacts', artifact.id); await f.service.acceptArtifact(tasks.id, tasks.revision);
    const implemented = await runNode(f, 'implement', target), attempt = f.store.get('attempts', implemented.currentAttemptId!);
    assert.equal(attempt.execution, 'reconciling'); assert.equal(attempt.terminalConfirmedAt, undefined);
    assert.equal(backend.starts, 1);
    assert.equal(f.store.list('evidence', value => value.candidateId === attempt.candidateId).length, 0);
    assert.equal(f.store.list('artifactRevisions', value => value.originAttemptId === attempt.id).length, 0);
    assert.equal(f.store.list('tasks', value => value.attemptId === attempt.id && value.taskId === 'T002')[0].state, 'pending');
    assert.ok(f.store.list('dispatchIntents', value => value.attemptId === attempt.id).every(value => value.state !== 'terminal'));
  } finally { await f.cleanup(); }
});

test('stop during prepare persists before a binding exists and never releases the model prompt', { timeout: 15000 }, async () => {
  const backend = new UncertainBackend(); backend.holdPrepare = true;
  const f = await fixture(backend);
  try {
    const current = node(f), started = await f.service.startNode(current.id, current.revision, target) as Attempt;
    await until(() => backend.prepareEntered, 'prepare did not start');
    assert.equal(f.store.get('attempts', started.id).bindingId, undefined);
    await f.service.stopAttempt(started.id);
    assert.ok(f.store.get('attempts', started.id).stopRequestedAt);
    backend.releasePrepare(); await f.service.waitForIdle();
    assert.equal(backend.starts, 0);
    assert.notEqual(f.store.get('nodes', current.id).gate, 'passed');
    assert.equal(f.store.list('artifactRevisions', value => value.originAttemptId === started.id).length, 0);
  } finally { backend.releasePrepare(); await f.cleanup(); }
});

test('a lost resume receipt keeps the workspace occupied and cannot be reconciled through the old binding', { timeout: 15000 }, async () => {
  class LostResumeReceipt extends MeterBackend {
    resumes = 0;
    override async resume(ref: ExecutionRef): Promise<never> { this.resumes++; await super.resume(ref); throw new Error('resume receipt lost after execution started'); }
  }
  const backend = new LostResumeReceipt(), f = await fixture(backend);
  try {
    const current = node(f), started = await f.service.startNode(current.id, current.revision, target) as Attempt;
    await until(() => backend.starts === 1, 'initial execution did not start');
    await f.service.stopAttempt(started.id); await f.service.waitForIdle();
    assert.equal(f.store.get('attempts', started.id).execution, 'cancelled');
    await assert.rejects(f.service.resumeAttempt(started.id), /resume receipt lost/);
    assert.equal(backend.resumes, 1); assert.equal(backend.starts, 2);
    const uncertain = f.store.get('attempts', started.id);
    assert.equal(uncertain.execution, 'reconciling'); assert.equal(uncertain.writeOccupancy, 'held');
    assert.ok(f.store.list('dispatchIntents', value => value.attemptId === started.id).some(value => ['dispatched', 'unknown'].includes(value.state) && !value.ref));
    await assert.rejects(f.service.reconcile(started.id), error => (error as { code?: string }).code === 'EXECUTION_UNKNOWN'); await f.service.waitForIdle();
    assert.equal(f.store.get('attempts', started.id).execution, 'reconciling');
    assert.equal(f.store.get('attempts', started.id).writeOccupancy, 'held');
    const latest = node(f); await assert.rejects(f.service.startNode(latest.id, latest.revision, target));
    await assert.rejects(f.service.resumeAttempt(started.id));
    assert.equal(backend.resumes, 1); assert.equal(backend.starts, 2);
  } finally { await f.cleanup(); }
});

test('persisted verification occupancy blocks replacement even if a legacy node says failed', { timeout: 15000 }, async () => {
  const f = await fixture();
  try {
    await runNode(f, 'specify'); const current = node(f), attempt = f.store.get('attempts', current.currentAttemptId!);
    f.store.update('attempts', attempt.id, { execution: 'failed', writeOccupancy: 'held', verificationPending: true });
    f.store.update('nodes', current.id, { execution: 'failed', gate: 'blocked' });
    const readiness = await f.service.readiness(current.id);
    assert.equal(readiness.ready, false); assert.match(readiness.reasons.join(' '), /停止|验证|执行/);
    await assert.rejects(f.service.startNode(current.id, f.store.get('nodes', current.id).revision));
    assert.equal(f.store.list('attempts').length, 1);
  } finally { await f.cleanup(); }
});

test('stopping during task verification kills the command and cannot start the next command', { timeout: 30000 }, async () => {
  const f = await fixture();
  try {
    await acceptedDocuments(f);
    const startedPath = join(f.root, 'verification-started'), unexpectedPath = join(f.root, 'unexpected-second-command');
    const project = f.store.list('projects')[0];
    f.store.update('projects', project.id, { commands: [
      { id: 'test', executable: 'node', args: ['-e', `require('fs').writeFileSync(${JSON.stringify(startedPath)},'ready');setInterval(()=>{},1000)`], timeoutMs: 15000 },
      { id: 'second', executable: 'node', args: ['-e', `require('fs').writeFileSync(${JSON.stringify(unexpectedPath)},'ran')`], timeoutMs: 1000 },
    ] });
    configureNode(f, 'implement', { timeoutMs: 20000 });
    const current = node(f, 'implement'), started = await f.service.startNode(current.id, current.revision) as Attempt;
    await until(async () => { try { return (await readFile(startedPath, 'utf8')) === 'ready'; } catch { return false; } }, 'task verification did not start');
    await f.service.stopAttempt(started.id); await f.service.waitForIdle();
    await assert.rejects(access(unexpectedPath));
    const attempt = f.store.get('attempts', started.id), evidence = f.store.list('evidence', value => value.candidateId === attempt.candidateId);
    assert.equal(evidence.length, 1); assert.equal(evidence[0].status, 'failed'); assert.equal(evidence[0].terminationReason, 'cancelled'); assert.equal(evidence[0].terminationConfirmed, true);
    assert.notEqual(f.store.get('nodes', current.id).gate, 'passed');
    assert.ok(f.store.list('tasks', value => value.attemptId === attempt.id).every(value => value.state !== 'tested' && value.state !== 'verified'));
  } finally { await f.cleanup(); }
});
