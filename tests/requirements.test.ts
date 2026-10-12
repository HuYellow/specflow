import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createApp } from '../apps/server/src/app.ts';
import { SandboxBackend } from '../apps/server/src/sandbox-backend.ts';
import { fixture, acceptedDocuments, clarifySpec, runNode } from './helpers.ts';
import type { ExecutionRef, RequirementDocument } from '../packages/domain/index.ts';
import type { FrozenInput } from '../packages/execution-contract/index.ts';

const document: RequirementDocument = { id: 'prd-1', name: '导入需求.md', content: '# 产品需求\n必须拒绝超过 100 行的文件，并保留 FR-CSV-101 验收编号。', source: 'upload' };

test('需求正文与文档传到实际执行上下文，版本进入导出，旧尝试保持原输入', async () => {
  const f = await fixture(), app = await createApp(f.service);
  try {
    const boot = (await app.inject('/api/bootstrap')).json();
    const current = f.service.requirements.current(f.item.id);
    const post = (payload: object, key: string) => app.inject({ method: 'POST', url: `/api/work-items/${f.item.id}/requirements`, headers: { 'x-specflow-token': boot.token, 'idempotency-key': key }, payload });
    const saved = await post({ expectedRevisionId: current.id, request: '以附加 PRD 为准', documents: [document] }, 'save-requirement');
    assert.equal(saved.statusCode, 200, saved.body);
    assert.equal((await post({ expectedRevisionId: current.id, request: '覆盖旧版本', documents: [] }, 'conflict')).statusCode, 409);
    let received: FrozenInput | undefined;
    class RecordingBackend extends SandboxBackend {
      override async prepare(input: FrozenInput) { received = input; return super.prepare(input); }
    }
    f.service.backends.sandbox = new RecordingBackend();
    const originalRun = f.store.list('runs', r => r.workItemId === f.item.id)[0];
    const originalNode = f.store.list('nodes', n => n.workflowRunId === originalRun.id && n.nodeId === 'specify')[0];
    await f.service.startNode(originalNode.id, originalNode.revision); await f.service.waitForIdle();
    assert.ok(received?.readOnly);
    assert.match(received!.prompt, /以附加 PRD 为准/);
    assert.match(received!.prompt, /导入需求.md/);
    assert.match(received!.prompt, /FR-CSV-101/);
    const oldAttempt = f.store.list('attempts')[0];
    assert.equal(oldAttempt.requirementRevisionId, saved.json().id);
    assert.equal(f.store.list('artifactRevisions')[0].requirementRevisionId, saved.json().id);
    const next = f.service.saveRequirements(f.item.id, saved.json().id, '更新为新需求', []);
    await runNode(f, 'specify');
    const attempts = f.store.list('attempts');
    assert.equal(attempts[0].prompt, oldAttempt.prompt);
    assert.notEqual(attempts[0].inputHash, attempts[1].inputHash);
    assert.equal(attempts[1].requirementRevisionId, next.id);
    assert.ok(!attempts[1].prompt.includes('FR-CSV-101'));
    const exported = (await app.inject(`/api/work-items/${f.item.id}/export`)).json();
    assert.equal(exported.requirements.history.length, 3);
    assert.equal(exported.requirements.history[1].documents[0].content, document.content);
  } finally { await app.close(); await f.cleanup(); }
});

test('需求更新让旧规格、复核和下游过期，重新分析后才能接纳', async () => {
  const f = await fixture();
  try {
    await acceptedDocuments(f);
    const source = f.service.requirements.current(f.item.id);
    const spec = f.store.list('artifacts', a => a.logicalId === 'spec')[0];
    f.service.saveRequirements(f.item.id, source.id, '新增导入记录数上限，需要补充验收条件', [document]);
    assert.equal(f.store.list('nodes', n => n.nodeId === 'specify')[0].freshness, 'stale');
    assert.equal(f.store.list('nodes', n => n.nodeId === 'plan')[0].freshness, 'stale');
    assert.throws(() => f.service.artifacts.resolve(f.item.id, 'spec@accepted'), /需求|变化/);
    await assert.rejects(f.service.acceptArtifact(spec.id, spec.revision), /需求|过期/);
    const plan = f.store.list('nodes', n => n.nodeId === 'plan')[0];
    assert.equal((await f.service.readiness(plan.id)).ready, false);
    await runNode(f, 'specify'); await clarifySpec(f); await runNode(f, 'review-spec');
    const updated = f.store.get('artifacts', spec.id);
    await f.service.acceptArtifact(updated.id, updated.revision);
    assert.equal((await f.service.readiness(plan.id)).ready, true);
  } finally { await f.cleanup(); }
});

test('执行期间变更需求，旧模型输出不能放行', async () => {
  const f = await fixture();
  let release!: () => void, started!: () => void;
  const hold = new Promise<void>(resolve => { release = resolve; });
  const entered = new Promise<void>(resolve => { started = resolve; });
  class DelayedBackend extends SandboxBackend {
    override async start(ref: ExecutionRef, input: FrozenInput) { started(); await hold; return super.start(ref, input); }
  }
  f.service.backends.sandbox = new DelayedBackend();
  try {
    const node = f.store.list('nodes', n => n.nodeId === 'specify')[0];
    await f.service.startNode(node.id, node.revision); await entered;
    const current = f.service.requirements.current(f.item.id);
    f.service.saveRequirements(f.item.id, current.id, '变更后的需求', [document]);
    release(); await f.service.waitForIdle();
    const result = f.store.get('nodes', node.id);
    assert.equal(result.gate, 'blocked'); assert.equal(result.freshness, 'stale');
    assert.match(result.error!, /需求|变更/);
    assert.equal(f.store.list('artifacts').length, 0);
  } finally { release(); await f.cleanup(); }
});

test('仓库导入读取受限的文本快照，拒绝越界、二进制、超限和空需求', async () => {
  const f = await fixture();
  try {
    const project = f.store.list('projects')[0];
    await writeFile(join(project.rootPath, 'requirements.md'), document.content);
    const imported = await f.service.requirements.readRepository(f.item.id, 'requirements.md');
    assert.equal(imported.content, document.content); assert.equal(imported.source, 'repository');
    const current = f.service.requirements.current(f.item.id);
    f.service.saveRequirements(f.item.id, current.id, '', [imported]);
    await writeFile(join(project.rootPath, 'requirements.md'), '应用外的新文档内容');
    assert.equal(f.service.requirements.current(f.item.id).documents[0].content, document.content);
    await assert.rejects(f.service.requirements.readRepository(f.item.id, '../outside.md'), /越出/);
    await assert.rejects(f.service.requirements.readRepository(f.item.id, 'csv.js'), /Markdown/);
    await writeFile(join(project.rootPath, 'binary.txt'), Buffer.from([0xff, 0x00]));
    await assert.rejects(f.service.requirements.readRepository(f.item.id, 'binary.txt'), /UTF-8/);
    await writeFile(join(project.rootPath, 'big.md'), 'a'.repeat(512 * 1024 + 1));
    await assert.rejects(f.service.requirements.readRepository(f.item.id, 'big.md'), /512 KiB/);
    const latest = f.service.requirements.current(f.item.id);
    assert.throws(() => f.service.saveRequirements(f.item.id, latest.id, '', []), /需求/);
    assert.throws(() => f.service.saveRequirements(f.item.id, latest.id, '有效需求', [{ ...document, content: 'a'.repeat(512 * 1024 + 1) }]), /512 KiB/);
    assert.throws(() => f.service.saveRequirements(f.item.id, latest.id, '有效需求', [document, document]), /唯一/);
    assert.throws(() => f.service.saveRequirements(f.item.id, latest.id, 'a'.repeat(1024 * 1024 + 1), []), /1 MiB/);
  } finally { await f.cleanup(); }
});

test('新工作项可以只提供文档；旧工作项升级保留原需求并绑定历史记录', async () => {
  const f = await fixture();
  try {
    const created = await f.service.createWorkItem(f.item.projectId, '只有附件的工作项', '', 'feature', [document]);
    assert.equal(f.service.requirements.current(created.id).number, 1);
    assert.equal((await f.service.snapshot(created.id)).requirements.current.documents[0].content, document.content);
    const originalRun = f.store.list('runs', r => r.workItemId === f.item.id)[0];
    const originalNode = f.store.list('nodes', n => n.workflowRunId === originalRun.id && n.nodeId === 'specify')[0];
    await f.service.startNode(originalNode.id, originalNode.revision); await f.service.waitForIdle();
    f.store.update('workItems', f.item.id, { requirementRevisionId: undefined });
    const attempt = f.store.list('attempts')[0], artifact = f.store.list('artifactRevisions')[0];
    f.store.update('attempts', attempt.id, { requirementRevisionId: undefined });
    f.store.update('artifactRevisions', artifact.id, { requirementRevisionId: undefined });
    await f.service.initialize();
    const source = f.service.requirements.current(f.item.id);
    assert.equal(source.request, f.item.request);
    assert.equal(f.store.get('attempts', attempt.id).requirementRevisionId, source.id);
    assert.equal(f.store.get('artifactRevisions', artifact.id).requirementRevisionId, source.id);
    assert.equal(f.store.get('attempts', attempt.id).prompt, attempt.prompt);
  } finally { await f.cleanup(); }
});
