import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { acceptedDocuments, clarifySpec, fixture, runNode } from './helpers.ts';
import { SandboxBackend } from '../apps/server/src/sandbox-backend.ts';
import type { ExecutionRef } from '../packages/domain/index.ts';
import type { FrozenInput } from '../packages/execution-contract/index.ts';
import { hash } from '../packages/domain/index.ts';
import { treeHash } from '../packages/verification-runner/index.ts';

test('完整工程链修改隔离仓库，实际测试通过后接纳代码', async () => {
  const f = await fixture();
  try {
    await acceptedDocuments(f);
    const implemented = await runNode(f, 'implement'); assert.equal(implemented.execution, 'completed', implemented.error);
    assert.equal(f.store.list('tasks')[0].state, 'tested');
    assert.equal((await runNode(f, 'verify')).gate, 'passed');
    assert.equal((await runNode(f, 'review-code')).gate, 'passed');
    assert.equal(f.store.list('tasks')[0].state, 'verified');
    await runNode(f, 'converge'); await runNode(f, 'review-converge');
    const report = f.store.list('artifacts', a => a.logicalId === 'convergence')[0]; await f.service.acceptArtifact(report.id, report.revision);
    const item = await f.service.acceptCode(f.item.id, 'test'); assert.equal(item.status, 'accepted');
    assert.equal(f.store.list('runs')[0].state, 'completed');
    const trackedDocuments = (await f.service.workspaces.git(item.workspace, ['ls-files', '--', `.specflow/work-items/${item.id}`])).split(/\r?\n/);
    for (const artifact of f.store.list('artifacts', a => a.workItemId === item.id && a.acceptedRevisionId === a.currentRevisionId)) {
      for (const suffix of ['md', 'human.html']) assert.ok(trackedDocuments.includes(`.specflow/work-items/${item.id}/${artifact.logicalId}.${suffix}`), `${artifact.logicalId}.${suffix} 应随已接纳工程文档进入 Git`);
      assert.ok(!trackedDocuments.includes(`.specflow/work-items/${item.id}/${artifact.logicalId}.human.md`), `${artifact.logicalId}.human.md 不再作为人类阅读产物进入 Git`);
    }
    const code = await readFile(join(item.workspace, 'csv.js'), 'utf8'); assert.ok(code.includes('Unclosed quoted field'));
    assert.ok(f.store.list('evidence').every(e => e.exitCode === 0 && e.status === 'passed'));
    const source = await readFile(join(f.store.list('projects')[0].rootPath, 'csv.js'), 'utf8'); assert.ok(!source.includes('Unclosed quoted field'), '源仓库不被直接改写');
  } finally { await f.cleanup(); }
});
test('未复核文档不能接纳；旧编辑版本产生冲突', async () => {
  const f = await fixture(); try {
    await runNode(f, 'specify'); await clarifySpec(f); const artifact = f.store.list('artifacts')[0];
    await assert.rejects(f.service.acceptArtifact(artifact.id, artifact.revision), /复核/);
    const rev = f.store.get('artifactRevisions', artifact.currentRevisionId);
    f.service.artifacts.create(f.item.id, 'spec', rev.content + '\n新增约束。', [], undefined, artifact.revision);
    assert.throws(() => f.service.artifacts.create(f.item.id, 'spec', '旧客户端覆盖', [], undefined, artifact.revision), /版本|变化/);
  } finally { await f.cleanup(); }
});
test('规格更新使下游结果过期；复核发现阻塞接纳', async () => {
  const f = await fixture(); try {
    await acceptedDocuments(f); const spec = f.store.list('artifacts', a => a.logicalId === 'spec')[0];
    f.service.artifacts.create(f.item.id, 'spec', '# 新需求\n\nFR005：文件上限为 100 行，超过上限必须抛出明确错误。', [], undefined, spec.revision);
    const reviewNode = f.store.list('nodes', n => n.nodeId === 'review-spec')[0];
    assert.equal((await f.service.readiness(reviewNode.id)).ready, false, '规格修改后需要重新澄清');
    await clarifySpec(f);
    class BlockerReviewer extends SandboxBackend { override async start(ref: ExecutionRef, input: FrozenInput) { const result = await super.start(ref, input); if (input.node.type === 'review') result.output = JSON.stringify({ summary: '仍有验收缺口', artifacts: [], findings: [{ severity: 'blocker', location: 'FR005', body: '缺少边界验收条件', targetLogicalId: 'spec' }] }); return result; } }
    f.service.backends.sandbox = new BlockerReviewer();
    const reviewed = await runNode(f, 'review-spec'); assert.equal(reviewed.gate, 'blocked');
    const latest = f.store.get('artifacts', spec.id); await assert.rejects(f.service.acceptArtifact(latest.id, latest.revision), /未决|复核|完整/);
    assert.ok(f.store.list('nodes', n => n.nodeId === 'plan').some(n => n.freshness === 'stale'));
    assert.throws(() => f.service.artifacts.resolve(f.item.id, 'spec@accepted'), /当前版本/);
  } finally { await f.cleanup(); }
});
test('应用外的文档修改会被导入为候选并阻塞旧输入', async () => {
  const f = await fixture(); try {
    await acceptedDocuments(f);
    await writeFile(join(f.item.workspace, '.specflow', 'work-items', f.item.id, 'spec.md'), '# 外部修改\n\n验收条件已改变，需要重新复核。');
    await f.service.snapshot(f.item.id);
    const artifact = f.store.list('artifacts', a => a.logicalId === 'spec')[0]; assert.notEqual(artifact.acceptedRevisionId, artifact.currentRevisionId);
    assert.throws(() => f.service.artifacts.resolve(f.item.id, 'spec@accepted'));
  } finally { await f.cleanup(); }
});
test('验证失败阻塞阶段；不能把模型完成当作工程完成', async () => {
  const f = await fixture(); try {
    await acceptedDocuments(f); const project = f.store.list('projects')[0];
    f.store.update('projects', project.id, { commands: [{ id: 'test', executable: 'node', args: ['-e', 'process.exit(1)'], timeoutMs: 2000 }] });
    const node = await runNode(f, 'implement'); assert.equal(node.gate, 'blocked'); assert.equal(f.store.list('tasks')[0].state, 'failed');
    assert.equal((await runNode(f, 'verify')).gate, 'blocked');
    await assert.rejects(f.service.acceptCode(f.item.id, 'test'));
  } finally { await f.cleanup(); }
});
test('代码变更使旧测试与复核证据失效', async () => {
  const f = await fixture(); try {
    await acceptedDocuments(f); await runNode(f, 'implement'); await runNode(f, 'verify'); await runNode(f, 'review-code');
    const candidate = f.store.list('candidates').at(-1)!; const before = await treeHash(candidate.workspace);
    await writeFile(join(candidate.workspace, 'csv.js'), 'export function parseCsv() { return []; }\n');
    assert.notEqual(await treeHash(candidate.workspace), before);
    await assert.rejects(f.service.acceptCode(f.item.id, 'test'), /复核/);
  } finally { await f.cleanup(); }
});
test('换模型产生新尝试，并保留旧产物与固定配置', async () => {
  const f = await fixture(); try {
    await runNode(f, 'specify'); await runNode(f, 'specify', { backend: 'sandbox', connectionId: 'local-contract-fixture', connectionSlug: '本地验收后端', model: 'reviewer' });
    const attempts = f.store.list('attempts'); assert.equal(attempts.length, 2); assert.notEqual(attempts[0].target.model, attempts[1].target.model);
    assert.equal(f.store.list('artifacts')[0].revisionIds.length, 2);
    const w = f.store.list('workflows')[0], frozen = f.store.list('runs')[0].definition;
    f.service.updateWorkflow(w.id, { ...w.definition, name: '修改后模板' }, w.revision); assert.deepEqual(f.store.list('runs')[0].definition, frozen);
  } finally { await f.cleanup(); }
});
test('接纳文件的操作日志可在写入后崩溃场景恢复', async () => {
  const f = await fixture(); try {
    await runNode(f, 'specify'); await clarifySpec(f); await runNode(f, 'review-spec');
    const a = f.store.list('artifacts')[0], revision = f.store.get('artifactRevisions', a.currentRevisionId);
    const path = join(f.item.workspace, 'recovery.md'); await writeFile(path, revision.content);
    const op = f.store.create('fileOperations', { artifactId: a.id, revisionId: revision.id, targetPath: path, previousHash: null, nextHash: hash(revision.content), state: 'written', actor: 'test', reason: 'crash recovery' });
    await f.service.artifacts.recover(); assert.equal(f.store.get('fileOperations', op.id).state, 'committed'); assert.equal(f.store.get('artifacts', a.id).acceptedRevisionId, revision.id);
  } finally { await f.cleanup(); }
});
