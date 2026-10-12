import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fixture, runNode, acceptedDocuments } from './helpers.ts';
import { SandboxBackend } from '../apps/server/src/sandbox-backend.ts';
import type { FrozenInput } from '../packages/execution-contract/index.ts';

test('根目录 AGENT.md 和 AGENTS.md 均进入各角色的固定上下文和导出', async () => {
  const f = await fixture(), received: FrozenInput[] = [];
  class RecordingBackend extends SandboxBackend { override async prepare(input: FrozenInput) { received.push(input); return super.prepare(input); } }
  f.service.backends.sandbox = new RecordingBackend();
  try {
    const project = f.store.list('projects')[0];
    await writeFile(join(project.rootPath, 'AGENT.md'), '# 项目章程\nRULE-101：错误输入必须有明确的测试和复核。');
    await writeFile(join(project.rootPath, 'AGENTS.md'), '# 项目规范\nRULE-102：不得静默丢弃 CSV 字段。');
    await acceptedDocuments(f); await runNode(f, 'implement');
    for (const input of received) { assert.match(input.prompt, /RULE-101/); assert.match(input.prompt, /RULE-102/); }
    assert.ok(received.some(i => i.node.type === 'clarify')); assert.ok(received.some(i => i.node.role === 'developer')); assert.ok(received.some(i => i.node.type === 'review'));
    const snapshot = await f.service.snapshot(f.item.id); assert.equal(snapshot.project.guidance!.files.length, 2);
    assert.equal(snapshot.attempts[0].guidance!.files[0].name, 'AGENT.md');
  } finally { await f.cleanup(); }
});

test('章程更新使产物和待答复问答过期，旧尝试保持原始章程', async () => {
  const f = await fixture();
  try {
    const project = f.store.list('projects')[0], path = join(project.rootPath, 'AGENT.md');
    await writeFile(path, '# 项目章程\nPOLICY-OLD：错误必须可验证。');
    await runNode(f, 'specify'); await runNode(f, 'clarify');
    const session = f.store.list('clarifications')[0], old = f.store.list('attempts')[0];
    await writeFile(path, '# 项目章程\nPOLICY-NEW：CSV 超过 100 行时必须拒绝导入。');
    await f.service.snapshot(f.item.id);
    assert.equal(f.store.get('clarifications', session.id).state, 'stale'); assert.equal(f.store.get('nodes', session.nodeRunId).execution, 'pending');
    assert.throws(() => f.service.artifacts.resolve(f.item.id, 'spec'), /章程|变化/);
    assert.match(f.store.get('attempts', old.id).guidance!.files[0].content, /POLICY-OLD/);
    await assert.rejects(f.service.answerClarification(session.id, session.revision, [{ questionId: 'Q001', answer: '旧答复' }]), /更新|变化/);
    await runNode(f, 'specify'); assert.match(f.store.list('attempts').at(-1)!.prompt, /POLICY-NEW/);
  } finally { await f.cleanup(); }
});

test('章程保存校验内容哈希，不覆盖外部修改，并阻止无效文本进入执行', async () => {
  const f = await fixture();
  try {
    const project = f.store.list('projects')[0];
    const initial = await f.service.saveProjectGuidance(project.id, 'AGENT.md', '# 项目章程\n所有代码改动必须有测试。', null);
    const path = join(project.rootPath, 'AGENT.md'); await writeFile(path, '# 外部修订\n需求需要稳定编号。');
    await assert.rejects(f.service.saveProjectGuidance(project.id, 'AGENT.md', '# 旧编辑覆盖\n不能覆盖外部修改。', initial.files[0].contentHash), /更新|比较/);
    assert.match(await readFile(path, 'utf8'), /外部修订/);
    await writeFile(path, Buffer.from([0xff, 0x00])); await f.service.initialize();
    const snapshot = await f.service.snapshot(f.item.id); assert.match(snapshot.project.guidanceError!, /UTF-8/);
    const node = f.store.list('nodes', n => n.nodeId === 'specify')[0]; const ready = await f.service.readiness(node.id);
    assert.equal(ready.ready, false); assert.ok(ready.reasons.some(r => r.includes('章程读取失败')));
    assert.equal(f.store.list('attempts').length, 0);
    await assert.rejects(f.service.saveProjectGuidance(project.id, 'AGENTS.md', 'a'.repeat(128 * 1024 + 1), null), /128/);
  } finally { await f.cleanup(); }
});
