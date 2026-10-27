import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SandboxBackend } from '../packages/specflow-core/sandbox-backend.ts';
import type { ExecutionRef } from '../packages/domain/index.ts';
import type { FrozenInput } from '../packages/execution-contract/index.ts';
import { acceptedDocuments, fixture, runNode } from './helpers.ts';
import { appendRepairRound, updateRepairRound } from '../packages/specflow-core/repair.ts';

class FailFirstCode extends SandboxBackend {
  codeCalls: { workspace: string; readOnly: boolean; taskId?: string }[] = [];
  override async start(ref: ExecutionRef, input: FrozenInput) {
    const result = await super.start(ref, input);
    if (input.node.role === 'developer') {
      this.codeCalls.push({ workspace: input.workspace, readOnly: input.readOnly, taskId: input.task?.taskId });
      if (this.codeCalls.length === 1) {
        await writeFile(join(input.workspace, 'csv.js'), 'export function parseCsv() { return []; }\n');
        await writeFile(join(input.workspace, 'failed-context.txt'), 'Keep this untracked context for the repair.\n');
      } else assert.equal(await readFile(join(input.workspace, 'failed-context.txt'), 'utf8'), 'Keep this untracked context for the repair.\n');
    }
    return result;
  }
}
test('失败测试修订从失败候选派生，完整验证与新双视角复核后就绪但不接纳', async () => {
  const f = await fixture(), backend = new FailFirstCode(); f.service.backends.sandbox = backend;
  try {
    await acceptedDocuments(f);
    const failed = await runNode(f, 'implement'); assert.equal(failed.gate, 'blocked', JSON.stringify({ calls: backend.codeCalls, tasks: f.store.list('tasks'), evidence: f.store.list('evidence') }));
    const original = f.service.latestCandidate(f.item.id)!;
    const cycle = await f.service.automation.startRepair(failed.id, failed.revision);
    await f.service.waitForIdle();
    const done = f.store.get('repairCycles', cycle.id);
    assert.equal(done.state, 'completed', JSON.stringify(done));
    assert.equal(done.rounds.length, 1);
    const candidate = f.service.latestCandidate(f.item.id)!;
    assert.equal(candidate.parentCandidateId, original.id);
    assert.equal(candidate.baseCommit, f.store.get('workItems', f.item.id).acceptedCommit);
    assert.notEqual(candidate.seedCommit, candidate.baseCommit);
    assert.equal(f.store.get('candidates', original.id).attemptId, original.attemptId);
    assert.equal(await readFile(join(original.workspace, 'csv.js'), 'utf8'), 'export function parseCsv() { return []; }\n');
    assert.equal(backend.codeCalls.length, 2, '一次原实现加一次修复，不重放原任务实现');
    assert.equal(backend.codeCalls[1].taskId, undefined, '修订使用独立修复入口');
    const reviews = f.store.list('attempts', a => a.repairCycleId === cycle.id && !!a.review);
    assert.equal(reviews.length, 2); assert.equal(reviews[0].review?.groupId, reviews[1].review?.groupId);
    assert.equal(f.store.get('workItems', f.item.id).status, 'active');
    assert.notEqual(candidate.status, 'accepted');
    assert.ok(f.store.list('evidence', e => e.candidateId === candidate.id).every(e => e.status === 'passed'));
    assert.equal(f.store.list('candidateSnapshotOperations')[0].state, 'activated');
    await runNode(f, 'converge'); await runNode(f, 'review-converge');
    const report = f.store.list('artifacts', a => a.logicalId === 'convergence')[0];
    await f.service.acceptArtifact(report.id, report.revision);
    const accepted = await f.service.acceptCode(f.item.id, 'test', candidate.id);
    assert.equal(accepted.status, 'accepted');
    assert.equal(await readFile(join(accepted.workspace, 'failed-context.txt'), 'utf8'), 'Keep this untracked context for the repair.\n', '接纳应包含原失败轮的有效改动');
    assert.match(await readFile(join(accepted.workspace, 'csv.js'), 'utf8'), /Unclosed quoted field/);
  } finally { await f.cleanup(); }
});
test('Git 快照成功但 DB 仍 prepared 的重启窗口恢复同一候选，不重复修复', async () => {
  const f = await fixture(), backend = new FailFirstCode(); f.service.backends.sandbox = backend;
  try {
    await acceptedDocuments(f); const failed = await runNode(f, 'implement');
    const originalSchedule = f.service.schedule.bind(f.service);
    f.service.schedule = () => {};
    const cycle = await f.service.automation.startRepair(failed.id, failed.revision);
    f.service.schedule = originalSchedule;
    const prepared = f.store.update('repairCycles', cycle.id, appendRepairRound(cycle));
    const source = f.service.latestCandidate(f.item.id)!;
    const op = f.store.create('candidateSnapshotOperations', { workItemId: f.item.id, repairCycleId: cycle.id, round: 1, parentCandidateId: source.id, parentCodeHash: cycle.initialProgress.targetHash, baseCommit: cycle.acceptedCommit, state: 'prepared' });
    f.store.update('repairCycles', cycle.id, updateRepairRound(prepared, { snapshotOperationId: op.id }));
    const beforeCrash = await f.service.workspaces.snapshotCandidate(source.workspace, op.parentCodeHash, op.id);
    await f.service.automation.recover(); await f.service.waitForIdle();
    assert.equal(f.store.get('repairCycles', cycle.id).state, 'completed');
    const recovered = f.store.get('candidateSnapshotOperations', op.id);
    assert.equal(recovered.state, 'activated'); assert.equal(recovered.seedCommit, beforeCrash.seedCommit);
    assert.equal(f.store.list('candidateSnapshotOperations', o => o.repairCycleId === cycle.id).length, 1);
    assert.equal(f.store.list('candidates', c => c.repairCycleId === cycle.id).length, 1);
    assert.equal(backend.codeCalls.length, 2);
  } finally { await f.cleanup(); }
});
test('自动推进在澄清答复和人工接纳前暂停，默认不开启自动修订', async () => {
  const f = await fixture();
  try {
    const run = f.store.list('runs').at(-1)!;
    const auto = await f.service.automation.startAutomation(run.id, run.revision, { autoAdvance: true, autoRepair: false, maxRepairRounds: 2 });
    await f.service.waitForIdle();
    const clarify = f.store.list('nodes', n => n.nodeId === 'clarify')[0];
    assert.equal(clarify.execution, 'waiting_interaction');
    assert.equal(f.store.get('automationRuns', auto.id).state, 'paused');
    assert.equal(f.store.list('repairCycles').length, 0);
    assert.equal(f.store.list('attempts', a => f.store.get('nodes', a.nodeRunId).nodeId === 'plan').length, 0);
    assert.equal(f.store.get('workItems', f.item.id).status, 'active');
    await f.service.automation.stopAutomation(auto.id);
    assert.equal(f.store.get('automationRuns', auto.id).state, 'cancelled');
  } finally { await f.cleanup(); }
});
test('输出契约修订冻结只读权限，派生新候选且不重绑旧候选身份', async () => {
  class InvalidFirstOutput extends SandboxBackend {
    producerInputs: FrozenInput[] = [];
    override async start(ref: ExecutionRef, input: FrozenInput) {
      const result = await super.start(ref, input);
      if (input.node.role === 'developer') {
        this.producerInputs.push(input);
        if (this.producerInputs.length === 1) result.output = 'The code is finished, but this is not the required JSON.';
      }
      return result;
    }
  }
  const f = await fixture(), backend = new InvalidFirstOutput(); f.service.backends.sandbox = backend;
  try {
    await acceptedDocuments(f); const failed = await runNode(f, 'implement');
    assert.equal(failed.gate, 'blocked');
    const original = f.service.latestCandidate(f.item.id)!, originalAttempt = f.store.get('attempts', original.attemptId);
    assert.equal(originalAttempt.errorCode, 'OUTPUT_INVALID');
    const cycle = await f.service.automation.startRepair(failed.id, failed.revision);
    assert.equal(cycle.mode, 'output');
    await f.service.waitForIdle();
    const done = f.store.get('repairCycles', cycle.id);
    assert.equal(done.state, 'completed', JSON.stringify(done));
    assert.equal(backend.producerInputs.length, 2);
    assert.equal(backend.producerInputs[1].readOnly, true);
    const candidate = f.service.latestCandidate(f.item.id)!;
    assert.notEqual(candidate.id, original.id);
    assert.equal(candidate.parentCandidateId, original.id);
    assert.equal(candidate.contentHash, original.contentHash, '只读修订不得改变代码内容');
    assert.equal(f.store.get('candidates', original.id).attemptId, original.attemptId);
  } finally { await f.cleanup(); }
});
test('自动修订达到一轮上限后暂停自动化，不以新周期绕过轮数限制', async () => {
  class AlwaysBroken extends SandboxBackend {
    codeCalls = 0;
    override async start(ref: ExecutionRef, input: FrozenInput) {
      const result = await super.start(ref, input);
      if (input.node.role === 'developer') { this.codeCalls++; await writeFile(join(input.workspace, 'csv.js'), 'export function parseCsv() { return []; }\n'); }
      return result;
    }
  }
  const f = await fixture(), backend = new AlwaysBroken(); f.service.backends.sandbox = backend;
  try {
    await acceptedDocuments(f); await runNode(f, 'implement');
    const run = f.store.list('runs').at(-1)!;
    const auto = await f.service.automation.startAutomation(run.id, run.revision, { autoAdvance: false, autoRepair: true, maxRepairRounds: 1 });
    await f.service.waitForIdle();
    const cycles = f.store.list('repairCycles');
    assert.equal(cycles.length, 1);
    assert.equal(cycles[0].rounds.length, 1);
    assert.equal(cycles[0].stopReason, 'round_limit');
    assert.equal(cycles[0].state, 'paused');
    assert.equal(f.store.get('automationRuns', auto.id).state, 'paused');
    assert.equal(backend.codeCalls, 2);
  } finally { await f.cleanup(); }
});
test('自动修订开始后人工编辑目标文档会暂停，不能用下一轮覆盖人工版本', async () => {
  const f = await fixture(), backend = new FailFirstCode(); f.service.backends.sandbox = backend;
  try {
    await acceptedDocuments(f); const failed = await runNode(f, 'implement');
    const schedule = f.service.schedule.bind(f.service); f.service.schedule = () => {};
    const cycle = await f.service.automation.startRepair(failed.id, failed.revision); f.service.schedule = schedule;
    const artifact = f.store.list('artifacts', a => a.logicalId === 'implementation')[0];
    const revision = f.store.get('artifactRevisions', artifact.currentRevisionId);
    const edited = f.service.artifacts.create(f.item.id, 'implementation', revision.content + '\n人工补充的边界说明。', revision.inputs, undefined, artifact.revision);
    await f.service.automation.tickWorkItem(f.item.id); await f.service.waitForIdle();
    assert.equal(f.store.get('repairCycles', cycle.id).stopReason, 'candidate_drift');
    assert.equal(backend.codeCalls.length, 1);
    assert.equal(f.store.get('artifacts', artifact.id).currentRevisionId, edited.id);
  } finally { await f.cleanup(); }
});
test('从失败代码复核启动修订会定位原生成者，并建立新的独立复核批次', async () => {
  class RejectInitialReview extends SandboxBackend {
    codeCalls = 0;
    override async start(ref: ExecutionRef, input: FrozenInput) {
      const result = await super.start(ref, input);
      if (input.node.role === 'developer') {
        this.codeCalls++;
        if (this.codeCalls > 1) {
          const output = JSON.parse(result.output!);
          output.findings = [{ severity: 'blocker', location: 'CSV boundary', body: 'Producer requests an independent boundary recheck.', targetLogicalId: 'implementation' }];
          result.output = JSON.stringify(output);
        }
      }
      if (input.node.id === 'review-code' && this.codeCalls === 1) {
        const output = JSON.parse(result.output!);
        output.findings = [{ severity: 'blocker', location: 'CSV boundary', body: 'Repair fixture requires a producer revision.', targetLogicalId: 'implementation' }];
        output.review.verdict = 'revise';
        output.review.checks[0].result = 'fail';
        output.review.checks[0].counterexample.outcome = 'reproduced';
        result.output = JSON.stringify(output);
      }
      return result;
    }
  }
  const f = await fixture(), backend = new RejectInitialReview(); f.service.backends.sandbox = backend;
  try {
    await acceptedDocuments(f); const producer = await runNode(f, 'implement'); await runNode(f, 'verify');
    const failedReview = await runNode(f, 'review-code'); assert.equal(failedReview.gate, 'blocked');
    const oldReview = f.store.get('attempts', failedReview.currentAttemptId!);
    const cycle = await f.service.automation.startRepair(failedReview.id, failedReview.revision);
    assert.equal(cycle.sourceAttemptId, producer.currentAttemptId);
    assert.equal(cycle.producerNodeRunId, producer.id);
    await f.service.waitForIdle();
    const result = f.store.get('repairCycles', cycle.id);
    assert.equal(result.state, 'completed', JSON.stringify(result));
    assert.equal(backend.codeCalls, 2);
    assert.equal(f.store.get('nodes', producer.id).gate, 'passed', '已解决发现不能保留旧blocked门禁触发无限修订');
    assert.notEqual(result.rounds[0].reviewGroupIds[0], oldReview.review?.groupId);
    assert.equal(f.store.list('findings', finding => finding.status === 'open' && finding.severity === 'blocker').length, 0);
  } finally { await f.cleanup(); }
});
