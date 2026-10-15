import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../apps/server/src/app.ts';
import { SandboxBackend } from '../apps/server/src/sandbox-backend.ts';
import { DomainError, type ExecutionRef } from '../packages/domain/index.ts';
import type { FrozenInput, StageOutput } from '../packages/execution-contract/index.ts';
import { acceptedDocuments, fixture, runNode } from './helpers.ts';

test('首次导入收敛报告缺少代码依据时，即使已有真实候选也不能派发复核或接纳', async () => {
  const f = await fixture(), app = await createApp(f.service);
  try {
    await acceptedDocuments(f);
    assert.equal((await runNode(f, 'implement')).execution, 'completed');
    assert.ok(f.service.latestCandidate(f.item.id), '先创建真实执行产生的候选代码');
    assert.equal(f.store.list('artifacts', artifact => artifact.logicalId === 'convergence').length, 0);
    const bootstrap = (await app.inject('/api/bootstrap')).json();
    const imported = await app.inject({ method: 'POST', url: `/api/work-items/${f.item.id}/import`, headers: { 'x-specflow-token': bootstrap.token, 'idempotency-key': 'first-import-convergence' }, payload: { artifacts: [{ logicalId: 'convergence', content: '# 首次导入的对齐报告\n\n声称所有验收标准与实现和测试已完成，但未绑定本机候选。' }] } });
    assert.equal(imported.statusCode, 200, imported.body);
    const artifact = f.store.list('artifacts', value => value.logicalId === 'convergence')[0];
    const revision = f.store.get('artifactRevisions', artifact.currentRevisionId);
    assert.deepEqual(revision.inputs, []);
    assert.equal(revision.candidateId, undefined);
    const review = f.store.list('nodes', node => node.nodeId === 'review-converge')[0];
    const attemptCount = f.store.list('attempts').length;
    const ready = await f.service.readiness(review.id);
    assert.equal(ready.ready, false);
    assert.ok(ready.reasons.some(reason => /缺少候选代码依据/.test(reason)));
    await assert.rejects(f.service.startNode(review.id, review.revision), error => {
      assert.ok(error instanceof DomainError);
      assert.equal(error.code, 'NODE_BLOCKED');
      assert.match(error.message, /缺少候选代码依据/);
      return true;
    });
    assert.equal(f.store.list('attempts').length, attemptCount, '不得为无代码依据的报告创建审核会话');
    await assert.rejects(f.service.acceptArtifact(artifact.id, artifact.revision), error => {
      assert.ok(error instanceof DomainError);
      assert.equal(error.code, 'CODE_STALE');
      return true;
    });
    assert.equal(f.store.get('artifacts', artifact.id).acceptedRevisionId, undefined);
    assert.equal(f.store.get('artifactRevisions', revision.id).reviewed, false);
  } finally { await app.close(); await f.cleanup(); }
});

class InvalidFindingBackend extends SandboxBackend {
  override async start(ref: ExecutionRef, input: FrozenInput) {
    const result = await super.start(ref, input);
    if (input.node.id === 'specify') {
      const output: StageOutput = JSON.parse(result.output!);
      output.findings = [{ targetLogicalId: 'undeclared-artifact', severity: 'blocker', location: '原始需求', body: '该问题指向没有声明的产物，整个阶段结果必须拒绝。' }];
      result.output = JSON.stringify(output);
    }
    return result;
  }
}

test('作者返回非法发现目标时，整份输出被拒绝且不会留下新产物或替换已有版本', async t => {
  for (const existing of [false, true]) await t.test(existing ? '已有产物保持原版本' : '首次产物不被创建', async () => {
    const f = await fixture();
    try {
      if (existing) await runNode(f, 'specify');
      const artifacts = f.store.list('artifacts'), revisions = f.store.list('artifactRevisions');
      f.service.backends.sandbox = new InvalidFindingBackend();
      const result = await runNode(f, 'specify');
      assert.equal(result.gate, 'blocked');
      assert.match(result.error!, /发现必须指向当前产物或冻结的上游产物/);
      assert.deepEqual(f.store.list('artifacts'), artifacts, '无效结果不能创建或更新逻辑产物');
      assert.deepEqual(f.store.list('artifactRevisions'), revisions, '无效结果不能留下候选版本');
      assert.deepEqual(f.store.list('findings'), [], '无效目标不能创建孤立的发现');
      const attempt = f.store.get('attempts', result.currentAttemptId!);
      assert.ok(attempt.error);
    } finally { await f.cleanup(); }
  });
});
