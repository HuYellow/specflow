import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readdir, readFile, rm, rmdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Artifacts } from '../apps/server/src/artifacts.ts';
import { createApp } from '../apps/server/src/app.ts';
import { SandboxBackend } from '../apps/server/src/sandbox-backend.ts';
import { Store } from '../apps/server/src/store.ts';
import { hash, type ExecutionRef, type HumanBrief, type WorkflowDefinition } from '../packages/domain/index.ts';
import { extractBrief, renderReadingHtml } from '../packages/document-presentation/index.ts';
import type { FrozenInput } from '../packages/execution-contract/index.ts';
import { fixture, runNode } from './helpers.ts';

const content = '# 执行契约\n\nFR001：请求包含稳定的记录 ID。重复 ID 返回 DUPLICATE_RECORD，不覆盖旧记录。\n\nAC001：正常请求返回创建的 ID；重复请求验证错误码及原记录内容。\n';
const brief: HumanBrief = {
  title: '记录创建：阅读简报',
  summary: '简报专用标记：新增记录时保持 ID 唯一。',
  sections: [
    { title: '决定', items: ['重复 ID 返回错误，并保留原记录。'] },
    { title: '验证', items: ['检查正常创建和重复 ID 两种结果。'] },
  ],
};

test('原文摘录保留类型、字段名和比较符号，HTML 仍将它们转义为文本', () => {
  const technical = '# 类型与字段\n\nAPI001：查询结果为 Map<string, User_Record>，字段 user_id 必填；重试键为 request_id。\n\nERR001：当 x < y && y > 0，返回 Invalid_Range。\n\n## 验收\n- AC001：验证 MAX_LENGTH 与 ~~ 标记不被当作格式删掉。\n';
  const extracted = extractBrief(technical, 'memo');
  assert.ok(extracted.summary.includes('Map<string, User_Record>'));
  assert.ok(extracted.summary.includes('user_id'));
  assert.ok(extracted.summary.includes('request_id'));
  const items = extracted.sections.flatMap(section => section.items);
  assert.ok(items.some(item => item.includes('x < y && y > 0')));
  assert.ok(items.some(item => item.includes('MAX_LENGTH') && item.includes('~~')));
  const html = renderReadingHtml({ schemaVersion: 1, sourceRevisionId: 'technical-fixture', sourceContentHash: hash(technical), brief: extracted, mode: 'extractive' }, 'memo');
  assert.match(html, /Map&lt;string, User_Record&gt;/);
  assert.match(html, /x &lt; y &amp;&amp; y &gt; 0/);
});

test('人类简报绑定原修订，后续 AI 接收完整契约及其哈希', async () => {
  class CapturingBackend extends SandboxBackend {
    captured: FrozenInput[] = [];
    override async start(ref: ExecutionRef, input: FrozenInput) { this.captured.push(input); return super.start(ref, input); }
  }
  const f = await fixture(), backend = new CapturingBackend();
  try {
    f.service.backends.sandbox = backend;
    const revision = f.service.artifacts.create(f.item.id, 'memo', content, [], undefined, undefined, { humanBrief: brief });
    const reading = f.service.artifacts.reading(revision.id);
    assert.equal(reading.schemaVersion, 1);
    assert.equal(reading.sourceRevisionId, revision.id);
    assert.equal(reading.sourceContentHash, hash(content));
    assert.equal(reading.mode, 'authored');
    assert.deepEqual(reading.brief, brief);
    assert.ok(!('markdown' in reading), '阅读简报不再派生人类 Markdown 文档');
    assert.equal(f.store.get('artifactRevisions', revision.id).content, content);
    assert.equal(f.store.get('artifactRevisions', revision.id).contentHash, hash(content));
    const artifact = f.store.get('artifacts', revision.artifactId);
    await f.service.artifacts.accept(artifact.id, artifact.revision, 'test', 'canonical input fixture', false);
    assert.deepEqual(f.service.artifacts.resolve(f.item.id, 'memo@accepted'), { logicalId: 'memo', artifactRevisionId: revision.id, contentHash: hash(content) });
    const definition: WorkflowDefinition = {
      schemaVersion: 1, id: 'reading-input-test', name: '读取契约', roles: {}, requiredVerification: [], requireReview: false,
      nodes: [{ id: 'consume', name: '消费执行契约', type: 'agent', role: 'analyst', prompt: '读取完整执行契约。', inputs: ['memo@accepted'], outputs: ['result'] }],
    };
    const workflow = f.store.list('workflows')[0];
    f.service.updateWorkflow(workflow.id, definition, workflow.revision);
    f.service.createRun(workflow.id);
    const node = await runNode(f, 'consume');
    assert.equal(node.execution, 'completed', node.error);
    assert.equal(backend.captured.length, 1);
    assert.deepEqual(backend.captured[0].artifacts, [{ logicalId: 'memo', content, contentHash: hash(content) }]);
    assert.ok(backend.captured[0].prompt.includes(content));
    assert.ok(!backend.captured[0].prompt.includes('简报专用标记'), '人类简报不进入 AI 的执行上下文');
  } finally { await f.cleanup(); }
});

test('编辑后重新提取简报，历史修订仍使用自己的原文与简报', async () => {
  const f = await fixture();
  try {
    const original = f.service.artifacts.create(f.item.id, 'memo', content, [], undefined, undefined, { humanBrief: brief });
    const artifact = f.store.get('artifacts', original.artifactId);
    const updatedContent = '# 新执行契约\n\nFR002：取消记录创建，改为只读查询；不存在的 ID 返回 NOT_FOUND。\n\nAC002：查询不会改变任何记录。\n';
    const edited = f.service.artifacts.create(f.item.id, 'memo', updatedContent, [], undefined, artifact.revision);
    assert.equal(edited.humanBrief, undefined, '不继承已不匹配正文的旧简报');
    const current = f.service.artifacts.reading(edited.id), historical = f.service.artifacts.reading(original.id);
    assert.equal(current.mode, 'extractive');
    assert.equal(current.sourceRevisionId, edited.id);
    assert.equal(current.sourceContentHash, hash(updatedContent));
    assert.ok(JSON.stringify(current.brief).includes('FR002'));
    assert.ok(!JSON.stringify(current.brief).includes('简报专用标记'));
    assert.equal(historical.mode, 'authored');
    assert.equal(historical.sourceRevisionId, original.id);
    assert.equal(historical.sourceContentHash, hash(content));
    assert.deepEqual(historical.brief, brief);
    assert.ok(historical.brief.summary.includes('简报专用标记'));
    assert.deepEqual(f.service.artifacts.reading(edited.id), current, '同一修订的提取结果确定且可重建');
    f.store.update('artifactRevisions', edited.id, { humanBrief: brief, humanBriefSourceHash: original.contentHash });
    assert.deepEqual(f.service.artifacts.reading(edited.id), current, '来源哈希不匹配时拒绝使用旧简报');
  } finally { await f.cleanup(); }
});

test('接纳仅导出执行 Markdown 与人类 HTML，阅读文件变更不修改执行契约', async () => {
  const f = await fixture(), app = await createApp(f.service);
  try {
    const revision = f.service.artifacts.create(f.item.id, 'memo', content, [], undefined, undefined, { humanBrief: brief });
    const artifact = f.store.get('artifacts', revision.artifactId), directory = join(f.item.workspace, '.specflow', 'work-items', f.item.id);
    await f.service.artifacts.accept(artifact.id, artifact.revision, 'test', 'export fixture', false);
    assert.equal(await readFile(join(directory, 'memo.md'), 'utf8'), content);
    assert.deepEqual((await readdir(directory)).sort(), ['memo.human.html', 'memo.md']);
    await assert.rejects(readFile(join(directory, 'memo.human.md'), 'utf8'), { code: 'ENOENT' });
    const html = await readFile(join(directory, 'memo.human.html'), 'utf8');
    assert.equal(html, (await app.inject(`/api/artifact-revisions/${revision.id}/reading.html`)).body);
    assert.ok(html.includes(revision.id));
    assert.ok(html.includes(hash(content)));
    await writeFile(join(directory, 'memo.human.html'), '<!doctype html><title>人类修改了阅读副本</title>\n');
    await f.service.artifacts.scanExternalChanges(f.item.id);
    assert.equal(f.store.get('artifacts', artifact.id).currentRevisionId, revision.id);
    assert.equal(f.store.get('artifactRevisions', revision.id).content, content);
    assert.equal(f.store.list('decisions', d => d.targetId === revision.id)[0].targetHash, hash(content));
  } finally { await app.close(); await f.cleanup(); }
});

test('读取 API 提供可追溯的 JSON 和下载格式，导入正文可按原修订安全阅读', async () => {
  const f = await fixture(), app = await createApp(f.service);
  try {
    const bootstrap = (await app.inject('/api/bootstrap')).json();
    const imported = await app.inject({ method: 'POST', url: `/api/work-items/${f.item.id}/import`, headers: { 'x-specflow-token': bootstrap.token, 'idempotency-key': 'import-reading-test' }, payload: { artifacts: [{ logicalId: 'memo', content }] } });
    assert.equal(imported.statusCode, 200, imported.body);
    const revision = imported.json().revisions[0];
    const json = await app.inject(`/api/artifact-revisions/${revision.id}/reading`);
    assert.equal(json.statusCode, 200, json.body);
    assert.match(String(json.headers['content-type']), /application\/json/);
    assert.deepEqual(json.json(), f.service.artifacts.reading(revision.id));
    assert.equal(json.json().mode, 'extractive');
    assert.ok(!('markdown' in json.json()), 'JSON 不提供已移除的人类 Markdown 格式');
    assert.equal(json.headers['cache-control'], 'no-store');
    const html = await app.inject(`/api/artifact-revisions/${revision.id}/reading.html`);
    assert.equal(html.statusCode, 200, html.body);
    assert.ok(String(html.headers['content-type']).startsWith('text/html'));
    assert.match(String(html.headers['content-disposition']), /attachment;.*memo.*human/);
    assert.equal(html.headers['x-content-type-options'], 'nosniff');
    assert.equal((await app.inject(`/api/artifact-revisions/${revision.id}/reading.md`)).statusCode, 404);
    const source = await app.inject(`/api/artifact-revisions/${revision.id}/source.md`);
    assert.equal(source.statusCode, 200, source.body);
    assert.equal(source.body, content);
    assert.ok(String(source.headers['content-type']).startsWith('text/markdown'));
    assert.match(String(source.headers['content-disposition']), /attachment;.*memo/);
    assert.equal(source.headers['x-content-type-options'], 'nosniff');
    assert.equal((await app.inject('/api/artifact-revisions/nonexistent/reading')).statusCode, 404);
    const artifact = f.store.get('artifacts', revision.artifactId);
    assert.equal(artifact.acceptedRevisionId, undefined, '生成阅读文档不等同于接纳');
  } finally { await app.close(); await f.cleanup(); }
});

test('HTML 将导入与旧数据中的恶意文本作为文本展示，桌面会话仍执行严格阅读策略', async () => {
  const f = await fixture(), app = await createApp(f.service, { desktopSecret: 'reading-test-secret' });
  try {
    const unsafe = '<script>globalThis.pwned=1</script><img src=x onerror=alert(1)> [打开](javascript:alert(1))';
    const revision = f.service.artifacts.create(f.item.id, 'memo', `# 导入文档\n\n${unsafe}\n\n应保留为文本。`);
    // Stored legacy data can predate validation, so the presentation boundary must also escape it.
    const unsafeBrief = { title: unsafe, summary: unsafe, sections: [{ title: unsafe, items: [unsafe] }, { title: '边界', items: ['不执行原文中的任何命令。'] }] };
    f.store.update('artifactRevisions', revision.id, { humanBrief: unsafeBrief, humanBriefSourceHash: revision.contentHash });
    assert.equal((await app.inject(`/api/artifact-revisions/${revision.id}/reading.html`)).statusCode, 403);
    const response = await app.inject({ url: `/api/artifact-revisions/${revision.id}/reading.html`, headers: { 'x-specflow-desktop-secret': 'reading-test-secret' } });
    assert.equal(response.statusCode, 200, response.body);
    assert.doesNotMatch(response.body, /<(?:script|iframe|object|embed|img)\b/i);
    assert.doesNotMatch(response.body, /(?:href|src)\s*=\s*["']?javascript:/i);
    const rendered = renderReadingHtml({ ...f.service.artifacts.reading(revision.id), brief: unsafeBrief }, 'memo');
    assert.match(rendered, /&lt;script&gt;/, '渲染边界独立转义，不能只依赖写入时验证');
    assert.doesNotMatch(rendered, /<(?:script|iframe|object|embed|img)\b/i);
    assert.doesNotMatch(rendered, /(?:href|src)\s*=\s*["']?javascript:/i);
    assert.match(String(response.headers['content-security-policy']), /script-src 'none'/);
    assert.match(String(response.headers['content-security-policy']), /default-src 'none'/);
  } finally { await app.close(); await f.cleanup(); }
});

test('写入后恢复接纳并重建阅读文件，已提交记录也能补齐丢失的阅读副本', async () => {
  const f = await fixture();
  let reopened: Store | undefined;
  try {
    const revision = f.service.artifacts.create(f.item.id, 'memo', content, [], undefined, undefined, { humanBrief: brief });
    const directory = join(f.item.workspace, '.specflow', 'work-items', f.item.id), targetPath = join(directory, 'memo.md');
    await mkdir(directory, { recursive: true });
    await writeFile(targetPath, content);
    const op = f.store.create('fileOperations', { artifactId: revision.artifactId, revisionId: revision.id, targetPath, previousHash: null, nextHash: hash(content), state: 'written', actor: 'test', reason: 'interrupted after canonical write' });
    reopened = new Store(join(f.root, 'engineering.sqlite'));
    const artifacts = new Artifacts(reopened);
    await artifacts.recover();
    assert.equal(reopened.get('fileOperations', op.id).state, 'committed');
    assert.equal(reopened.get('artifacts', revision.artifactId).acceptedRevisionId, revision.id);
    await assert.rejects(readFile(join(directory, 'memo.human.md'), 'utf8'), { code: 'ENOENT' });
    assert.ok((await readFile(join(directory, 'memo.human.html'), 'utf8')).includes(hash(content)));
    await rm(join(directory, 'memo.human.html'));
    await artifacts.recover();
    await assert.rejects(readFile(join(directory, 'memo.human.md'), 'utf8'), { code: 'ENOENT' });
    assert.ok((await readFile(join(directory, 'memo.human.html'), 'utf8')).includes(revision.id));
    assert.equal(await readFile(targetPath, 'utf8'), content);
  } finally { reopened?.close(); await f.cleanup(); }
});

test('阅读副本写入失败后，重试同一接纳操作能完成已写入原文的修订', async () => {
  const f = await fixture();
  try {
    const original = f.service.artifacts.create(f.item.id, 'memo', content, [], undefined, undefined, { humanBrief: brief });
    let artifact = f.store.get('artifacts', original.artifactId);
    await f.service.artifacts.accept(artifact.id, artifact.revision, 'test', 'initial acceptance', false);
    artifact = f.store.get('artifacts', artifact.id);
    const updated = f.service.artifacts.create(f.item.id, 'memo', `${content}\nFR002：新增记录后记录操作时间。\n`, [], undefined, artifact.revision);
    artifact = f.store.get('artifacts', artifact.id);
    const directory = join(f.item.workspace, '.specflow', 'work-items', f.item.id), obstacle = join(directory, 'memo.human.html');
    await rm(obstacle);
    await mkdir(obstacle);
    await assert.rejects(f.service.artifacts.accept(artifact.id, artifact.revision, 'test', 'retry acceptance', false));
    assert.equal(await readFile(join(directory, 'memo.md'), 'utf8'), updated.content);
    assert.equal(f.store.get('artifacts', artifact.id).acceptedRevisionId, original.id);
    const interrupted = f.store.list('fileOperations', op => op.revisionId === updated.id);
    assert.equal(interrupted.length, 1);
    assert.equal(interrupted[0].state, 'written');
    await rmdir(obstacle);
    const accepted = await f.service.artifacts.accept(artifact.id, artifact.revision, 'test', 'retry acceptance', false);
    assert.equal(accepted.acceptedRevisionId, updated.id);
    assert.equal(f.store.get('fileOperations', interrupted[0].id).state, 'committed');
    assert.equal(f.store.list('fileOperations', op => op.revisionId === updated.id).length, 1, '复用原文件操作，避免把自己的原文写入视为外部冲突');
    assert.equal(f.store.list('decisions', decision => decision.targetId === updated.id).length, 1);
    assert.equal(await readFile(obstacle, 'utf8'), f.service.artifacts.readingHtml(updated.id));
  } finally { await f.cleanup(); }
});

test('恢复时阅读文件障碍不会阻止启动，保留待接纳操作供后续重试', async () => {
  const f = await fixture();
  try {
    const stable = f.service.artifacts.create(f.item.id, 'stable', content, [], undefined, undefined, { humanBrief: brief });
    const stableArtifact = f.store.get('artifacts', stable.artifactId);
    await f.service.artifacts.accept(stableArtifact.id, stableArtifact.revision, 'test', 'accepted fixture', false);
    const directory = join(f.item.workspace, '.specflow', 'work-items', f.item.id), stableObstacle = join(directory, 'stable.human.html'), pendingObstacle = join(directory, 'memo.human.html');
    await rm(stableObstacle);
    await mkdir(stableObstacle);
    const pending = f.service.artifacts.create(f.item.id, 'memo', content, [], undefined, undefined, { humanBrief: brief });
    const targetPath = join(directory, 'memo.md');
    await writeFile(targetPath, content);
    await mkdir(pendingObstacle);
    const op = f.store.create('fileOperations', { artifactId: pending.artifactId, revisionId: pending.id, targetPath, previousHash: null, nextHash: hash(content), state: 'written', actor: 'test', reason: 'interrupted acceptance with blocked reading path' });
    await assert.doesNotReject(f.service.artifacts.recover());
    assert.ok(['prepared', 'written'].includes(f.store.get('fileOperations', op.id).state));
    assert.equal(f.store.get('artifacts', pending.artifactId).acceptedRevisionId, undefined);
    assert.equal(f.store.get('artifacts', stable.artifactId).acceptedRevisionId, stable.id);
    const failures = f.store.events(0).filter(event => event.kind === 'artifact.reading-export-failed');
    assert.ok(failures.length >= 2, '记录待接纳与已接纳阅读文件的导出障碍');
    await rmdir(stableObstacle);
    await rmdir(pendingObstacle);
    await f.service.artifacts.recover();
    assert.equal(f.store.get('fileOperations', op.id).state, 'committed');
    assert.equal(f.store.get('artifacts', pending.artifactId).acceptedRevisionId, pending.id);
    assert.equal(await readFile(stableObstacle, 'utf8'), f.service.artifacts.readingHtml(stable.id));
    assert.equal(await readFile(pendingObstacle, 'utf8'), f.service.artifacts.readingHtml(pending.id));
  } finally { await f.cleanup(); }
});

test('代码集成期间拒绝文档修订与接纳，释放锁后恢复正常操作', async () => {
  const f = await fixture();
  let unlock: (() => void) | undefined;
  try {
    const original = f.service.artifacts.create(f.item.id, 'memo', content, [], undefined, undefined, { humanBrief: brief });
    const artifact = f.store.get('artifacts', original.artifactId);
    unlock = f.service.artifacts.lockWorkItem(f.item.id);
    assert.throws(() => f.service.artifacts.create(f.item.id, 'other', content), /集成/);
    assert.throws(() => f.service.artifacts.create(f.item.id, 'memo', `${content}\n新增约束。`, [], undefined, artifact.revision), /集成/);
    await assert.rejects(f.service.artifacts.accept(artifact.id, artifact.revision, 'test', 'blocked integration race', false), /集成/);
    assert.equal(f.store.get('artifacts', artifact.id).currentRevisionId, original.id);
    assert.equal(f.store.list('fileOperations').length, 0);
    unlock(); unlock = undefined;
    const edited = f.service.artifacts.create(f.item.id, 'memo', `${content}\n新增约束。`, [], undefined, artifact.revision);
    const current = f.store.get('artifacts', artifact.id);
    assert.equal((await f.service.artifacts.accept(current.id, current.revision, 'test', 'released integration lock', false)).acceptedRevisionId, edited.id);
  } finally { unlock?.(); await f.cleanup(); }
});
