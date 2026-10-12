import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultWorkflow, hash } from '../packages/domain/index.ts';
import { EngineeringService } from '../apps/server/src/service.ts';
import { SandboxBackend } from '../apps/server/src/sandbox-backend.ts';
import { fixture, runNode, clarifySpec } from './helpers.ts';
import type { ExecutionRef } from '../packages/domain/index.ts';
import type { FrozenInput } from '../packages/execution-contract/index.ts';

test('澄清提问、记录答复、修订规格并放行复核与设计，旧尝试保留固定问答', async () => {
  const f = await fixture();
  try {
    await runNode(f, 'specify');
    const spec = f.store.list('artifacts', a => a.logicalId === 'spec')[0], original = spec.currentRevisionId;
    const review = f.store.list('nodes', n => n.nodeId === 'review-spec')[0];
    await assert.rejects(f.service.acceptArtifact(spec.id, spec.revision), /澄清/);
    assert.equal((await f.service.readiness(review.id)).ready, false);
    const node = await runNode(f, 'clarify'); assert.equal(node.execution, 'waiting_interaction');
    const session = f.store.list('clarifications')[0], before = f.store.get('attempts', session.attemptIds[0]);
    assert.equal(session.state, 'waiting_answers'); assert.equal(session.questions.length, 1);
    await assert.rejects(f.service.answerClarification(session.id, session.revision, []), /所有问题/);
    await f.service.answerClarification(session.id, session.revision, [{ questionId: session.questions[0].id, answer: '抛出明确错误' }]); await f.service.waitForIdle();
    const completed = f.store.get('clarifications', session.id);
    assert.equal(completed.state, 'completed');
    const result = f.store.get('artifactRevisions', completed.resultSpecRevisionId!);
    assert.equal(result.supersedesRevisionId, original); assert.ok(result.content.includes('FR01'));
    assert.match(result.content, /澄清记录/); assert.match(result.content, /CSV 引号未闭合时应如何处理/); assert.match(result.content, /答复：抛出明确错误/);
    assert.doesNotThrow(() => f.service.artifacts.resolve(f.item.id, 'spec'), '修订规格不能因引用自身旧版本而过期');
    assert.deepEqual(f.store.get('attempts', before.id).clarificationQuestions, []);
    const after = f.store.get('attempts', completed.attemptIds.at(-1)!);
    assert.equal(after.clarificationQuestions![0].answer, '抛出明确错误'); assert.notEqual(before.inputHash, after.inputHash);
    assert.equal((await f.service.readiness(review.id)).ready, true);
    const current = f.store.get('artifacts', spec.id); await assert.rejects(f.service.acceptArtifact(current.id, current.revision), /复核/);
    await runNode(f, 'review-spec'); const reviewed = f.store.get('artifacts', spec.id); await f.service.acceptArtifact(reviewed.id, reviewed.revision);
    const plan = f.store.list('nodes', n => n.nodeId === 'plan')[0]; assert.equal((await f.service.readiness(plan.id)).ready, true);
  } finally { await f.cleanup(); }
});

test('应用重启后可继续待答复澄清，不重派已完成的分析尝试', async () => {
  const f = await fixture();
  try {
    await runNode(f, 'specify'); await runNode(f, 'clarify');
    const session = f.store.list('clarifications')[0], count = f.store.list('attempts').length;
    const restarted = new EngineeringService(f.store, f.root, { sandbox: new SandboxBackend(), maka: new SandboxBackend() });
    await restarted.initialize(); assert.equal(f.store.list('attempts').length, count);
    assert.equal(f.store.get('nodes', session.nodeRunId).execution, 'waiting_interaction');
    await restarted.answerClarification(session.id, session.revision, [{ questionId: 'Q001', answer: '抛出明确错误' }]); await restarted.waitForIdle();
    assert.equal(f.store.get('clarifications', session.id).state, 'completed'); assert.equal(f.store.list('attempts').length, count + 1);
  } finally { await f.cleanup(); }
});

test('答复草稿保存到工程数据库，重启可恢复，保存草稿不派发模型且检查编辑冲突', async () => {
  const f = await fixture();
  try {
    await runNode(f, 'specify'); await runNode(f, 'clarify');
    const session = f.store.list('clarifications')[0], count = f.store.list('attempts').length;
    const draft = f.service.saveClarificationDraft(session.id, 0, { Q001: '抛出明确错误' });
    assert.equal(f.store.get('clarifications', session.id).revision, session.revision);
    assert.equal(f.store.get('clarifications', session.id).questions[0].answer, undefined);
    assert.equal(f.store.list('attempts').length, count);
    assert.throws(() => f.service.saveClarificationDraft(session.id, 0, { Q001: '旧草稿覆盖' }), /更新|比较/);
    assert.throws(() => f.service.saveClarificationDraft(session.id, draft.revision, { OTHER: '未知问题' }), /本会话/);
    const restarted = new EngineeringService(f.store, f.root, { sandbox: new SandboxBackend(), maka: new SandboxBackend() }); await restarted.initialize();
    assert.equal((await restarted.snapshot(f.item.id)).clarificationDrafts[0].answers.Q001, '抛出明确错误');
    assert.equal(f.store.list('attempts').length, count);
  } finally { await f.cleanup(); }
});

test('需求或规格变化使问答失效，旧答复不能派发模型或放行规格', async () => {
  const f = await fixture();
  try {
    await runNode(f, 'specify'); await runNode(f, 'clarify');
    const session = f.store.list('clarifications')[0], count = f.store.list('attempts').length, requirements = f.service.requirements.current(f.item.id);
    f.service.saveRequirements(f.item.id, requirements.id, '要求支持更严格的 CSV 错误输入验证', []);
    assert.equal(f.store.get('clarifications', session.id).state, 'stale');
    assert.equal(f.store.get('nodes', session.nodeRunId).execution, 'pending');
    await assert.rejects(f.service.answerClarification(session.id, session.revision, [{ questionId: 'Q001', answer: '旧答复' }]), /更新|变化/);
    assert.equal(f.store.list('attempts').length, count);
    await runNode(f, 'specify'); await clarifySpec(f);
    const spec = f.store.list('artifacts', a => a.logicalId === 'spec')[0], revision = f.store.get('artifactRevisions', spec.currentRevisionId);
    f.service.artifacts.create(f.item.id, 'spec', revision.content + '\n新增功能边界，需要重新检查。', revision.inputs, undefined, spec.revision);
    const review = f.store.list('nodes', n => n.nodeId === 'review-spec')[0]; assert.equal((await f.service.readiness(review.id)).ready, false);
  } finally { await f.cleanup(); }
});

test('显式重新分析保留旧问答，新会话使用当前规格', async () => {
  const f = await fixture();
  try {
    await runNode(f, 'specify'); await runNode(f, 'clarify');
    const session = f.store.list('clarifications')[0]; f.service.restartClarification(session.id, session.revision);
    assert.equal(f.store.get('clarifications', session.id).questions[0].question, session.questions[0].question);
    await runNode(f, 'clarify'); assert.equal(f.store.list('clarifications').length, 2); assert.equal(f.store.list('clarifications').at(-1)!.state, 'waiting_answers');
  } finally { await f.cleanup(); }
});

test('暂停旧运行不会绕过待答复阶段并启动同一工作项的新运行', async () => {
  const f = await fixture();
  try {
    await runNode(f, 'specify'); await runNode(f, 'clarify');
    const run = f.store.list('runs')[0], workflow = f.store.list('workflows')[0];
    f.store.update('runs', run.id, { state: 'paused' });
    assert.throws(() => f.service.createRun(workflow.id), /等待答复|执行/);
    assert.equal(f.store.list('runs').length, 1);
  } finally { await f.cleanup(); }
});

test('拒绝带未决标记的完成结果，不把模型结束当作澄清完成', async () => {
  const f = await fixture();
  class InvalidCompletion extends SandboxBackend {
    override async start(ref: ExecutionRef, input: FrozenInput) {
      const result = await super.start(ref, input);
      if (input.node.type === 'clarify') result.output = JSON.stringify({ summary: '声称已完成', artifacts: [{ logicalId: 'spec', type: 'spec', content: '# 需求规格\n\n[NEEDS CLARIFICATION] 输入文件上限仍未确定。' }], clarification: { status: 'complete', questions: [] } });
      return result;
    }
  }
  try {
    await runNode(f, 'specify'); f.service.backends.sandbox = new InvalidCompletion();
    const node = await runNode(f, 'clarify'); assert.equal(node.gate, 'blocked'); assert.match(node.error!, /未决/);
    assert.equal(f.store.list('artifacts')[0].revisionIds.length, 1);
    assert.notEqual(f.store.list('clarifications')[0].state, 'completed');
  } finally { await f.cleanup(); }
});

test('问答累计上限是整个会话 5 个，不能通过多轮绕过', async () => {
  const f = await fixture();
  class TooManyRounds extends SandboxBackend {
    override async start(ref: ExecutionRef, input: FrozenInput) {
      const result = await super.start(ref, input);
      if (input.node.type === 'clarify') { const offset = input.clarification?.questions.length || 0; result.output = JSON.stringify({ summary: '请求澄清', artifacts: [], clarification: { status: 'needs_answers', questions: Array.from({ length: 3 }, (_, i) => ({ id: `Q${offset + i + 1}`, question: `需要确认关键边界 ${offset + i + 1}？`, reason: '影响验收边界', options: [] })) } }); }
      return result;
    }
  }
  try {
    await runNode(f, 'specify'); f.service.backends.sandbox = new TooManyRounds(); await runNode(f, 'clarify');
    const session = f.store.list('clarifications')[0];
    await f.service.answerClarification(session.id, session.revision, session.questions.map(q => ({ questionId: q.id, answer: '已确认' }))); await f.service.waitForIdle();
    assert.equal(f.store.get('clarifications', session.id).questions.length, 3);
    const node = f.store.get('nodes', session.nodeRunId); assert.equal(node.gate, 'blocked'); assert.match(node.error!, /5/);
  } finally { await f.cleanup(); }
});

test('默认模板升级仅改未启动运行，已启动运行保留原定义', async () => {
  for (const started of [false, true]) {
    const f = await fixture();
    try {
      const workflow = f.store.list('workflows')[0], run = f.store.list('runs')[0], newNode = f.store.list('nodes', n => n.nodeId === 'clarify')[0];
      const legacy = { ...defaultWorkflow(), requireClarification: false, nodes: defaultWorkflow().nodes.filter(n => n.type !== 'clarify') };
      f.store.update('workflows', workflow.id, { definition: legacy, definitionHash: hash(JSON.stringify(legacy)) }); f.store.update('runs', run.id, { definition: legacy });
      f.store.db.prepare("DELETE FROM entities WHERE kind='nodes' AND id=?").run(newNode.id);
      if (started) await runNode(f, 'specify');
      await f.service.initialize();
      assert.equal(f.store.get('workflows', workflow.id).definition.nodes.length, 13);
      assert.equal(f.store.get('runs', run.id).definition.nodes.length, started ? 12 : 13);
      if (!started) assert.deepEqual((await f.service.snapshot(f.item.id)).nodes.slice(0, 3).map(n => n.nodeId), ['specify', 'clarify', 'review-spec']);
    } finally { await f.cleanup(); }
  }
});
