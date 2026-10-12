import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { SandboxBackend } from '../apps/server/src/sandbox-backend.ts';
import type { ExecutionRef, ModelTarget } from '../packages/domain/index.ts';
import type { ExecutionSnapshot, FrozenInput } from '../packages/execution-contract/index.ts';
import { fixture, acceptedDocuments, runNode } from './helpers.ts';

class LostReceiptBackend extends SandboxBackend {
  starts = 0;
  async listTargets(): Promise<ModelTarget[]> { return [{ backend: 'maka', connectionId: 'contract-host', connectionSlug: 'contract-host', model: 'local-model-fixture' }]; }
  async prepare(input: FrozenInput): Promise<ExecutionRef> { return { ...await super.prepare(input), backend: 'maka' }; }
  async start(ref: ExecutionRef, input: FrozenInput): Promise<ExecutionSnapshot> { this.starts++; await super.start(ref, input); throw new Error('启动回执在工具执行后丢失'); }
}
test('回执丢失后查询原身份，不能重复派发工具执行', async () => {
  const backend = new LostReceiptBackend(), f = await fixture(backend);
  try {
    await acceptedDocuments(f);
    const target = (await backend.listTargets())[0]; await runNode(f, 'implement', target);
    const attempt = f.store.list('attempts', a => a.target.backend === 'maka')[0]; assert.equal(attempt.execution, 'reconciling');
    assert.equal(backend.starts, 1); await f.service.reconcile(attempt.id); assert.equal(backend.starts, 1);
    assert.equal(f.store.get('attempts', attempt.id).execution, 'completed');
    assert.ok((await f.service.snapshot(f.item.id)).bindings.some(b => b.attemptId === attempt.id));
  } finally { await f.cleanup(); }
});
test('停止确认后恢复添加新身份绑定，保留原身份', async () => {
  const f = await fixture(); try {
    const node = f.store.list('nodes')[0]; const attempt: any = await f.service.startNode(node.id, node.revision);
    await new Promise(done => setTimeout(done, 20)); await f.service.stopAttempt(attempt.id); await f.service.waitForIdle();
    assert.equal(f.store.get('attempts', attempt.id).execution, 'cancelled');
    await f.service.resumeAttempt(attempt.id); await f.service.waitForIdle();
    const bindings = f.store.list('bindings', b => b.attemptId === attempt.id); assert.equal(bindings.length, 2); assert.equal(bindings[1].parentBindingId, bindings[0].id); assert.notEqual(bindings[0].ref.turnId, bindings[1].ref.turnId);
    assert.equal(f.store.get('attempts', attempt.id).execution, 'completed');
  } finally { await f.cleanup(); }
});
test('源分支被外部提交改变时，接纳拒绝集成且保留候选', async () => {
  const f = await fixture(); try {
    await acceptedDocuments(f); await runNode(f, 'implement'); await runNode(f, 'verify'); await runNode(f, 'review-code'); await runNode(f, 'converge'); await runNode(f, 'review-converge');
    const report = f.store.list('artifacts', a => a.logicalId === 'convergence')[0]; await f.service.acceptArtifact(report.id, report.revision);
    await writeFile(join(f.item.workspace, 'external-change.txt'), '由用户编辑的文件'); await f.service.workspaces.checkpoint(f.item.workspace, 'External commit');
    await assert.rejects(f.service.acceptCode(f.item.id, 'test'), /基线/); assert.notEqual(f.store.list('candidates').at(-1)!.status, 'accepted');
  } finally { await f.cleanup(); }
});
