import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { SandboxBackend, sandboxTargets } from '../apps/server/src/sandbox-backend.ts';
import { EngineeringService } from '../apps/server/src/service.ts';
import type { ExecutionRef } from '../packages/domain/index.ts';
import type { FrozenInput, StageOutput } from '../packages/execution-contract/index.ts';
import { treeHash } from '../packages/verification-runner/index.ts';
import { acceptedDocuments, clarifySpec, fixture, runNode } from './helpers.ts';

type Fixture = Awaited<ReturnType<typeof fixture>>;

class ScriptedBackend extends SandboxBackend {
  readonly capturedInputs: FrozenInput[] = [];
  readonly refs: ExecutionRef[] = [];
  constructor(readonly rewrite: (input: FrozenInput, output: StageOutput) => void = () => {}) { super(); }
  override async prepare(input: FrozenInput) {
    this.capturedInputs.push(structuredClone(input));
    const ref = await super.prepare(input);
    this.refs.push(ref);
    return ref;
  }
  override async start(ref: ExecutionRef, input: FrozenInput) {
    const result = await super.start(ref, input);
    if (result.output) {
      const output: StageOutput = JSON.parse(result.output);
      this.rewrite(input, output);
      // Sandbox query/readResult returns this same snapshot, so the service sees the rewritten contract.
      result.output = JSON.stringify(output);
    }
    return result;
  }
}

class HeldAdversarialBackend extends SandboxBackend {
  private enter!: () => void;
  private releaseHold!: () => void;
  readonly entered = new Promise<void>(resolve => { this.enter = resolve; });
  private readonly hold = new Promise<void>(resolve => { this.releaseHold = resolve; });
  release() { this.releaseHold(); }
  override async start(ref: ExecutionRef, input: FrozenInput) {
    if (input.review?.perspective === 'adversarial') { this.enter(); await this.hold; }
    return super.start(ref, input);
  }
}

function artifact(f: Fixture, logicalId: string) {
  return f.store.list('artifacts', value => value.workItemId === f.item.id && value.logicalId === logicalId)[0];
}
function revision(f: Fixture, logicalId: string) { return f.store.get('artifactRevisions', artifact(f, logicalId).currentRevisionId); }
function reviewAttempts(f: Fixture, nodeId: string) {
  const node = f.store.list('nodes', value => value.nodeId === nodeId)[0];
  return f.store.list('attempts', value => value.nodeRunId === node.id);
}
async function preparedSpec(f: Fixture) { await runNode(f, 'specify'); await clarifySpec(f); }
async function preparedPlan(f: Fixture) {
  await preparedSpec(f); await runNode(f, 'review-spec');
  const spec = artifact(f, 'spec'); await f.service.acceptArtifact(spec.id, spec.revision);
  await runNode(f, 'plan');
}
function failReview(output: StageOutput, logicalId: string, body: string) {
  assert.ok(output.review);
  output.review.verdict = 'revise';
  output.review.summary = body;
  output.review.checks[0].result = 'fail';
  output.review.checks[0].explanation = body;
  output.review.checks[0].counterexample = { scenario: '输入未闭合引号的 CSV 文件', outcome: 'reproduced', reason: body };
  output.findings = [{ severity: 'blocker', targetLogicalId: logicalId, location: '错误输入验收', body }];
}
function resolveAll(output: StageOutput, fixed: boolean) {
  assert.ok(output.review);
  for (const resolution of output.review.resolutions) resolution.result = fixed ? 'fixed' : 'open';
  output.review.verdict = fixed ? 'pass' : 'revise';
  output.review.summary = fixed ? '按原失效场景核对当前版本，所有历史问题已修复。' : '历史问题仍然存在，需继续修订。';
}

test('同一模型通过两个全新会话从覆盖与反例视角独立复核，第二会话不接收第一结论', async () => {
  const f = await fixture();
  try {
    await preparedSpec(f);
    const secret = 'FIRST_REVIEW_PRIVATE_5cdd28';
    const backend = new ScriptedBackend((input, output) => { if (input.review?.perspective === 'coverage') output.review!.summary = secret; });
    f.service.backends.sandbox = backend;
    const target = sandboxTargets[0];
    const result = await runNode(f, 'review-spec', target);
    assert.equal(result.gate, 'passed', result.error);
    assert.equal(backend.capturedInputs.length, 2);
    const [coverage, adversarial] = backend.capturedInputs;
    assert.deepEqual(coverage.target, target); assert.deepEqual(adversarial.target, target);
    assert.notEqual(backend.refs[0].sessionId, backend.refs[1].sessionId);
    assert.notEqual(coverage.attemptId, adversarial.attemptId);
    assert.equal(coverage.review!.perspective, 'coverage'); assert.equal(adversarial.review!.perspective, 'adversarial');
    assert.equal(coverage.review!.groupId, adversarial.review!.groupId);
    assert.deepEqual(coverage.review!.subjects, adversarial.review!.subjects);
    assert.deepEqual(coverage.review!.sources, adversarial.review!.sources);
    assert.notEqual(coverage.prompt, adversarial.prompt);
    assert.ok(!adversarial.prompt.includes(secret), '覆盖视角的结论不得进入反例视角上下文');
    assert.ok(!JSON.stringify(adversarial).includes(secret));
    const attempts = reviewAttempts(f, 'review-spec');
    assert.equal(attempts.length, 2); assert.ok(attempts.every(value => value.reviewReport?.verdict === 'pass'));
    assert.equal(revision(f, 'spec').reviewed, true);
    assert.equal(revision(f, 'spec').reviewGroupId, coverage.review!.groupId);
  } finally { await f.cleanup(); }
});

test('第一视角通过后，第二视角的无效或失败报告都阻塞当前版本', async t => {
  for (const mode of ['invalid', 'fail'] as const) await t.test(mode, async () => {
    const f = await fixture();
    try {
      await preparedSpec(f);
      const backend = new ScriptedBackend((input, output) => {
        if (input.review?.perspective !== 'adversarial') return;
        if (mode === 'invalid') delete output.review;
        else failReview(output, 'spec', '反例视角发现未闭合引号缺少明确验收约束');
      });
      f.service.backends.sandbox = backend;
      const result = await runNode(f, 'review-spec');
      assert.equal(result.gate, 'blocked');
      assert.equal(reviewAttempts(f, 'review-spec')[0].reviewReport?.verdict, 'pass');
      assert.equal(backend.capturedInputs.length, 2);
      assert.equal(revision(f, 'spec').reviewed, false);
      assert.equal(revision(f, 'spec').reviewGroupId, undefined);
      const spec = artifact(f, 'spec'); await assert.rejects(f.service.acceptArtifact(spec.id, spec.revision), /复核|阻塞/);
    } finally { await f.cleanup(); }
  });
});

test('复核必须显式提交结构化 review 和 findings，缺少任何一项都不能默认通过', async t => {
  for (const missing of ['review', 'findings'] as const) await t.test(missing, async () => {
    const f = await fixture();
    try {
      await preparedSpec(f);
      f.service.backends.sandbox = new ScriptedBackend((input, output) => { if (input.review) delete output[missing]; });
      const result = await runNode(f, 'review-spec');
      assert.equal(result.gate, 'blocked');
      assert.equal(revision(f, 'spec').reviewed, false);
      assert.equal(reviewAttempts(f, 'review-spec')[0].reviewReport, undefined);
    } finally { await f.cleanup(); }
  });
});

test('设计复核只认证 plan，作为参考材料的已接纳 spec 不能获得该批次认证', async () => {
  const f = await fixture();
  try {
    await preparedPlan(f);
    const spec = revision(f, 'spec');
    const result = await runNode(f, 'review-plan');
    assert.equal(result.gate, 'passed', result.error);
    const attempts = reviewAttempts(f, 'review-plan');
    assert.ok(attempts.every(value => value.inputs.some(input => input.logicalId === 'spec')));
    assert.ok(attempts.every(value => value.review!.subjects.length === 1 && value.review!.subjects[0].logicalId === 'plan'));
    assert.equal(revision(f, 'plan').reviewed, true);
    assert.equal(f.store.get('artifactRevisions', spec.id).reviewed, spec.reviewed);
    assert.equal(f.store.get('artifactRevisions', spec.id).reviewGroupId, spec.reviewGroupId);
    assert.notEqual(revision(f, 'plan').reviewGroupId, spec.reviewGroupId);
  } finally { await f.cleanup(); }
});

test('历史 blocker 跨轻微修订保留并进入作者提示，只有双方明确复验修复才关闭', async () => {
  const f = await fixture();
  try {
    await preparedPlan(f);
    const body = 'PLAN_BLOCKER_911a：未定义未闭合引号输入的异常接口与验收条件';
    f.service.backends.sandbox = new ScriptedBackend((input, output) => {
      if (input.review?.perspective === 'coverage') failReview(output, 'plan', body);
    });
    assert.equal((await runNode(f, 'review-plan')).gate, 'blocked');
    const finding = f.store.list('findings', value => value.body === body)[0];
    assert.ok(finding); assert.equal(finding.status, 'open');
    const old = revision(f, 'plan');
    const author = new ScriptedBackend((input, output) => {
      if (input.node.id === 'plan') output.artifacts[0].content = `${old.content}\n调整排版，不更改设计行为。\n`;
    });
    f.service.backends.sandbox = author;
    await runNode(f, 'plan');
    assert.match(author.capturedInputs[0].prompt, /PLAN_BLOCKER_911a/);
    assert.ok(author.capturedInputs[0].prompt.includes(finding.id));
    assert.notEqual(revision(f, 'plan').contentHash, old.contentHash);
    assert.equal(f.store.get('findings', finding.id).status, 'open');
    const disputed = new ScriptedBackend((input, output) => { if (input.review) resolveAll(output, input.review.perspective === 'coverage'); });
    f.service.backends.sandbox = disputed;
    assert.equal((await runNode(f, 'review-plan')).gate, 'blocked');
    assert.ok(disputed.capturedInputs.every(input => input.review!.priorFindings.some(value => value.id === finding.id && value.body === body)));
    assert.equal(f.store.get('findings', finding.id).status, 'open', '单个视角声称修复不能关闭历史问题');
    assert.equal(revision(f, 'plan').reviewed, false);
    const confirmed = new ScriptedBackend((input, output) => { if (input.review) resolveAll(output, true); });
    f.service.backends.sandbox = confirmed;
    const result = await runNode(f, 'review-plan');
    assert.equal(result.gate, 'passed', result.error);
    assert.equal(f.store.get('findings', finding.id).status, 'resolved');
    const resolver = f.store.get('attempts', f.store.get('findings', finding.id).resolvedByAttemptId!);
    assert.equal(resolver.review?.perspective, 'adversarial');
    assert.equal(revision(f, 'plan').reviewGroupId, resolver.review?.groupId);
    assert.ok(confirmed.capturedInputs.every(input => input.review!.priorFindings.some(value => value.id === finding.id)));
  } finally { await f.cleanup(); }
});

test('第一视角通过后变更需求，整批复核不能认证旧规格', { timeout: 30000 }, async () => {
  const f = await fixture(), backend = new HeldAdversarialBackend();
  try {
    await preparedSpec(f); f.service.backends.sandbox = backend;
    const node = f.store.list('nodes', value => value.nodeId === 'review-spec')[0];
    await f.service.startNode(node.id, node.revision); await backend.entered;
    assert.equal(reviewAttempts(f, 'review-spec')[0].reviewReport?.verdict, 'pass');
    assert.equal(revision(f, 'spec').reviewed, false, '第一个视角结束时不得提前放行');
    const current = f.service.requirements.current(f.item.id);
    f.service.saveRequirements(f.item.id, current.id, `${current.request}\n新增约束：超过 100 行必须拒绝导入。`, current.documents);
    backend.release(); await f.service.waitForIdle();
    const result = f.store.get('nodes', node.id);
    assert.equal(result.gate, 'blocked'); assert.equal(revision(f, 'spec').reviewed, false);
    assert.match(result.error!, /变更|变化/);
  } finally { backend.release(); await f.cleanup(); }
});

test('第一视角通过后变更候选代码，旧测试和第二视角结论不能认证新代码', { timeout: 30000 }, async () => {
  const f = await fixture(), backend = new HeldAdversarialBackend();
  try {
    await acceptedDocuments(f); await runNode(f, 'implement'); await runNode(f, 'verify');
    const candidate = f.store.list('candidates').at(-1)!;
    f.service.backends.sandbox = backend;
    const node = f.store.list('nodes', value => value.nodeId === 'review-code')[0];
    await f.service.startNode(node.id, node.revision); await backend.entered;
    assert.equal(reviewAttempts(f, 'review-code')[0].reviewReport?.verdict, 'pass');
    assert.equal(f.store.get('candidates', candidate.id).reviewedHash, undefined);
    const file = join(candidate.workspace, 'csv.js');
    await writeFile(file, `${await readFile(file, 'utf8')}\n// 修改发生于两个复核视角之间。\n`);
    backend.release(); await f.service.waitForIdle();
    const result = f.store.get('nodes', node.id);
    assert.equal(result.gate, 'blocked'); assert.match(result.error!, /代码发生变更/);
    assert.equal(f.store.get('candidates', candidate.id).reviewedHash, undefined);
    assert.equal(f.store.get('candidates', candidate.id).reviewGroupId, undefined);
    assert.ok(f.store.list('tasks', value => value.attemptId === candidate.attemptId).every(value => value.state !== 'verified'));
  } finally { backend.release(); await f.cleanup(); }
});

test('同工作项既有的通过测试不能代替双视角复验关闭文档 blocker', async () => {
  const f = await fixture();
  try {
    await acceptedDocuments(f); await runNode(f, 'implement');
    const proof = f.store.list('evidence', value => value.status === 'passed' && !value.stale)[0];
    assert.ok(proof, '使用真实执行产生的通过测试证据');
    const node = f.store.list('nodes', value => value.nodeId === 'review-plan')[0], plan = revision(f, 'plan');
    const finding = f.store.create('findings', { workItemId: f.item.id, nodeRunId: node.id, targetLogicalId: 'plan', targetHash: plan.contentHash, severity: 'blocker', location: '异常接口', body: '旧测试未证明设计定义了异常接口', status: 'open' });
    assert.throws(() => f.service.resolveFinding(finding.id, 'resolved', '之前测试成功，所以设计问题已解决', proof.id), /复核|复验|证据|解决/);
    assert.equal(f.store.get('findings', finding.id).status, 'open');
  } finally { await f.cleanup(); }
});

test('重启安全派发尚未 prepare 的第二视角，不重复已经完成的覆盖复核', async () => {
  const f = await fixture();
  let recovered: EngineeringService | undefined;
  try {
    await preparedSpec(f); await runNode(f, 'review-spec');
    const [coverage, previousSecond] = reviewAttempts(f, 'review-spec');
    assert.equal(coverage.execution, 'completed'); assert.equal(coverage.reviewReport?.verdict, 'pass');
    const subject = revision(f, 'spec');
    // Restore the exact durable state after coverage commits its report and queues the second view.
    // No execution is active while this isolated database snapshot is prepared.
    const queued = f.store.tx(() => {
      for (const binding of f.store.list('bindings', value => value.attemptId === previousSecond.id)) {
        f.store.db.prepare('DELETE FROM entities WHERE kind=? AND id=?').run('bindings', binding.id);
      }
      f.store.db.prepare('DELETE FROM entities WHERE kind=? AND id=?').run('attempts', previousSecond.id);
      const pending = f.store.create('attempts', {
        nodeRunId: previousSecond.nodeRunId, number: previousSecond.number, inputHash: previousSecond.inputHash,
        inputs: previousSecond.inputs, requirementRevisionId: previousSecond.requirementRevisionId,
        guidance: previousSecond.guidance, review: previousSecond.review, target: previousSecond.target,
        prompt: previousSecond.prompt, codeBaseline: previousSecond.codeBaseline, execution: 'pending',
      });
      f.store.update('artifactRevisions', subject.id, { reviewed: false, reviewGroupId: undefined });
      f.store.update('nodes', coverage.nodeRunId, { currentAttemptId: pending.id, execution: 'starting', gate: 'unchecked', acceptance: 'pending' });
      return pending;
    });
    assert.equal(queued.bindingId, undefined);
    const backend = new ScriptedBackend();
    recovered = new EngineeringService(f.store, f.root, { sandbox: backend, maka: backend });
    await recovered.initialize(); await recovered.waitForIdle();
    assert.equal(backend.capturedInputs.length, 1);
    assert.equal(backend.capturedInputs[0].attemptId, queued.id);
    assert.equal(backend.capturedInputs[0].review?.perspective, 'adversarial');
    const attempts = reviewAttempts(f, 'review-spec');
    assert.equal(attempts.length, 2);
    assert.deepEqual(f.store.get('attempts', coverage.id), coverage, '已完成的覆盖复核保持原记录和执行身份');
    assert.equal(f.store.get('attempts', queued.id).execution, 'completed');
    assert.equal(f.store.get('nodes', coverage.nodeRunId).gate, 'passed');
    assert.equal(revision(f, 'spec').reviewGroupId, coverage.review!.groupId);
    await recovered.initialize(); await recovered.waitForIdle();
    assert.equal(backend.capturedInputs.length, 1, '再次初始化不能重复派发已经完成的第二视角');
  } finally { await recovered?.waitForIdle(); await f.cleanup(); }
});

test('代码复核冻结材料包含实现期间新增且仍未跟踪的文件正文', async () => {
  const f = await fixture();
  try {
    const workflow = f.store.list('workflows')[0];
    const definition = structuredClone(workflow.definition);
    definition.nodes.find(node => node.id === 'implement')!.taskMode = false;
    f.service.updateWorkflow(workflow.id, definition, workflow.revision); f.service.createRun(workflow.id);
    await acceptedDocuments(f);
    const name = 'import-policy.js', body = "export const importPolicyMarker = 'UNTRACKED_SOURCE_4b118';\n";
    class NewFileDeveloper extends ScriptedBackend {
      override async start(ref: ExecutionRef, input: FrozenInput) {
        const result = await super.start(ref, input);
        if (input.node.id === 'implement') await writeFile(join(input.workspace, name), body);
        return result;
      }
    }
    f.service.backends.sandbox = new NewFileDeveloper();
    const implementation = await runNode(f, 'implement');
    assert.equal(implementation.execution, 'completed', implementation.error);
    const candidate = f.store.list('candidates').at(-1)!;
    assert.equal(await f.service.workspaces.git(candidate.workspace, ['ls-files', '--', name]), '', '新文件在复核时仍未进入 Git 索引');
    assert.match(await f.service.workspaces.git(candidate.workspace, ['status', '--porcelain', '--', name]), /\?\?/);
    assert.equal(revision(f, 'implementation').codeHash, await treeHash(candidate.workspace));
    assert.equal((await runNode(f, 'verify')).gate, 'passed');
    const reviewer = new ScriptedBackend(); f.service.backends.sandbox = reviewer;
    const result = await runNode(f, 'review-code');
    assert.equal(result.gate, 'passed', result.error);
    assert.equal(reviewer.capturedInputs.length, 2);
    for (const input of reviewer.capturedInputs) {
      const code = input.review!.sources.filter(source => source.kind === 'code').map(source => source.content).join('\n');
      assert.ok(code.includes(name), '冻结材料标明新增文件名');
      assert.ok(code.includes(body.trim()), '两个视角都必须看到新增文件正文，不能只看到文件清单');
    }
    assert.equal(f.store.get('candidates', candidate.id).reviewedHash, await treeHash(candidate.workspace));
  } finally { await f.cleanup(); }
});

test('候选代码改变后，已复核的旧收敛报告不能接纳或再次复核放行', async () => {
  const f = await fixture();
  try {
    await acceptedDocuments(f); await runNode(f, 'implement'); await runNode(f, 'verify'); await runNode(f, 'review-code');
    await runNode(f, 'converge'); assert.equal((await runNode(f, 'review-converge')).gate, 'passed');
    const report = artifact(f, 'convergence'), reportRevision = revision(f, 'convergence');
    const candidate = f.store.list('candidates').at(-1)!;
    assert.equal(reportRevision.candidateId, candidate.id);
    assert.equal(reportRevision.codeHash, await treeHash(candidate.workspace));
    assert.equal(reportRevision.reviewed, true, '先建立已经双视角复核、原本可接纳的报告');
    const reviewNode = f.store.list('nodes', node => node.nodeId === 'review-converge')[0];
    assert.equal((await f.service.readiness(reviewNode.id)).ready, true);
    const file = join(candidate.workspace, 'csv.js');
    await writeFile(file, `${await readFile(file, 'utf8')}\n// 收敛报告生成后发生的代码修改。\n`);
    assert.notEqual(reportRevision.codeHash, await treeHash(candidate.workspace));
    await assert.rejects(f.service.acceptArtifact(report.id, report.revision), error => {
      assert.equal((error as { code: string }).code, 'CODE_STALE'); return true;
    });
    const readiness = await f.service.readiness(reviewNode.id);
    assert.equal(readiness.ready, false);
    assert.ok(readiness.reasons.some(reason => /代码依据已变更/.test(reason)));
    assert.equal(f.store.get('artifacts', report.id).acceptedRevisionId, undefined);
    await assert.rejects(f.service.startNode(reviewNode.id, f.store.get('nodes', reviewNode.id).revision), /代码依据已变更/);
  } finally { await f.cleanup(); }
});

test('设计作者回溯发现规格 blocker 时持久化到上游并阻塞当前及后续阶段', async () => {
  const f = await fixture();
  try {
    await acceptedDocuments(f);
    const spec = revision(f, 'spec'), body = 'UPSTREAM_SPEC_BLOCKER_c733：原始需求的错误输入边界存在冲突，需要重新澄清';
    f.service.backends.sandbox = new ScriptedBackend((input, output) => {
      if (input.node.id === 'plan') output.findings = [{ targetLogicalId: 'spec', severity: 'blocker', location: 'FR04 错误输入', body }];
    });
    const result = await runNode(f, 'plan');
    assert.equal(result.gate, 'blocked');
    const finding = f.store.list('findings', value => value.body === body)[0];
    assert.ok(finding, '作者发现的上游问题不能只保留在原始输出中');
    assert.equal(finding.targetLogicalId, 'spec'); assert.equal(finding.targetHash, spec.contentHash);
    assert.equal(finding.originAttemptId, result.currentAttemptId); assert.equal(finding.status, 'open');
    assert.throws(() => f.service.artifacts.resolve(f.item.id, 'spec@accepted'), /复核发现/);
    assert.equal((await f.service.readiness(result.id)).ready, false);
    const tasks = f.store.list('nodes', node => node.nodeId === 'tasks')[0];
    assert.equal((await f.service.readiness(tasks.id)).ready, false);
    await assert.rejects(f.service.startNode(tasks.id, tasks.revision), /复核发现|尚未接纳/);
  } finally { await f.cleanup(); }
});

test('手工修订收敛报告继承上游输入与候选代码依据，不能通过改文本擦除复核义务', async () => {
  const f = await fixture();
  try {
    await acceptedDocuments(f); await runNode(f, 'implement'); await runNode(f, 'verify'); await runNode(f, 'review-code');
    await runNode(f, 'converge');
    const report = artifact(f, 'convergence'), previous = revision(f, 'convergence');
    assert.ok(previous.inputs.some(input => input.logicalId === 'implementation'));
    assert.ok(previous.candidateId); assert.ok(previous.codeHash);
    const edited = f.service.artifacts.create(f.item.id, 'convergence', `${previous.content}\n补充人工检查说明。\n`, [], undefined, report.revision);
    assert.notEqual(edited.id, previous.id);
    assert.deepEqual(edited.inputs, previous.inputs);
    assert.equal(edited.candidateId, previous.candidateId); assert.equal(edited.codeHash, previous.codeHash);
    assert.equal(edited.reviewed, false); assert.equal(edited.acceptance, 'candidate');
    const candidate = f.store.get('candidates', previous.candidateId!);
    const file = join(candidate.workspace, 'csv.js');
    await writeFile(file, `${await readFile(file, 'utf8')}\n// 人工改稿后代码也发生修改。\n`);
    const review = f.store.list('nodes', node => node.nodeId === 'review-converge')[0];
    assert.equal((await f.service.readiness(review.id)).ready, false);
    const current = artifact(f, 'convergence');
    await assert.rejects(f.service.acceptArtifact(current.id, current.revision), error => {
      assert.equal((error as { code: string }).code, 'CODE_STALE'); return true;
    });
  } finally { await f.cleanup(); }
});
