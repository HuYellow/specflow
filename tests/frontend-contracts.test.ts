import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createApp } from '../apps/server/src/app.ts';
import { UserCodeReview } from '../apps/server/src/user-review.ts';
import { fixture, acceptedDocuments, runNode } from './helpers.ts';

test('用户差异保留完整新增文本、二进制哈希、重命名和大文件分块，模型材料上限不变', async () => {
  const f = await fixture();
  try {
    const review = new UserCodeReview((workspace, args) => f.service.workspaces.git(workspace, args));
    const base = await f.service.workspaces.git(f.item.workspace, ['rev-parse', 'HEAD']);
    await f.service.workspaces.git(f.item.workspace, ['mv', 'csv.js', 'parser.js']);
    const text = '完整新增正文\n尾行';
    await writeFile(join(f.item.workspace, 'new.md'), text);
    const large = '汉字🙂'.repeat(80000);
    await writeFile(join(f.item.workspace, 'large.txt'), large);
    const binary = Buffer.from([0, 255, 33, 4]);
    await writeFile(join(f.item.workspace, 'raw.bin'), binary);
    await mkdir(join(f.item.workspace, '.tools'), { recursive: true });
    await writeFile(join(f.item.workspace, '.tools', 'hidden.txt'), 'excluded');
    const result = await review.diff('candidate', f.item.workspace, base);
    assert.equal(result.files.find(file => file.path === 'new.md')?.content, text);
    const renamed = result.files.find(file => file.path === 'parser.js')!;
    assert.equal(renamed.status, 'renamed'); assert.equal(renamed.oldPath, 'csv.js');
    const raw = result.files.find(file => file.path === 'raw.bin')!;
    assert.equal(raw.binary, true); assert.equal(raw.size, 4); assert.equal(raw.contentHash, createHash('sha256').update(binary).digest('hex'));
    assert.equal(raw.content, undefined);
    assert.ok(!result.files.some(file => file.path.includes('.tools')));
    const largeFile = result.files.find(file => file.path === 'large.txt')!;
    assert.equal(largeFile.truncated, true); assert.ok(largeFile.nextOffset);
    let content = largeFile.content!;
    let offset: number | undefined = largeFile.nextOffset;
    while (offset !== undefined) {
      const chunk = await review.chunk(f.item.workspace, base, 'large.txt', 'candidate', offset, 65536);
      assert.equal(chunk.candidateHash, result.candidateHash);
      assert.equal(chunk.contentHash, largeFile.contentHash);
      content += chunk.content; offset = chunk.nextOffset;
    }
    assert.equal(content, large);
    await assert.rejects(review.chunk(f.item.workspace, base, '../outside', 'candidate', 0, 64));
    await assert.rejects(review.chunk(f.item.workspace, base, '.tools/hidden.txt', 'candidate', 0, 64));
    await assert.rejects(review.chunk(f.item.workspace, base, 'large.txt', 'candidate', 1, 64), /字符边界/);
    await assert.rejects(f.service.workspaces.reviewDiff(f.item.workspace, base), /上限/);
  } finally { await f.cleanup(); }
});

test('事件兼容旧无范围数据、校验游标，并优先 Last-Event-ID 一次恢复超过 200 条', async () => {
  const f = await fixture(), app = await createApp(f.service);
  try {
    const start = f.store.eventCursor(0).latestSeq;
    for (let index = 0; index < 451; index++) f.store.emit(f.item.id, 'fixture.event', { index });
    f.store.db.prepare('INSERT INTO events(entityId,kind,payload,createdAt) VALUES(?,?,?,?)').run('legacy', 'legacy.event', '{}', new Date().toISOString());
    const latest = f.store.eventCursor(0).latestSeq;
    const batch = (await app.inject(`/api/events?after=${start}`)).json();
    assert.equal(batch.length, 200); assert.equal(batch[0].workItemId, f.item.id); assert.equal(batch[0].projectId, f.item.projectId);
    for (const cursor of ['-1', '1.5', 'NaN', '9007199254740992', '']) assert.equal((await app.inject(`/api/events?after=${cursor}`)).statusCode, 400);
    assert.equal((await app.inject(`/api/events?after=${latest + 10}`)).json().code, 'EVENT_RESYNC_REQUIRED');
    const address = await app.listen({ host: '127.0.0.1', port: 0 });
    const response = await fetch(`${address}/api/events?after=0`, { headers: { accept: 'text/event-stream', 'Last-Event-ID': String(start + 100) }, signal: AbortSignal.timeout(5000) });
    const reader = response.body!.getReader(), decoder = new TextDecoder(); let text = '';
    try { while (!text.includes(`id: ${latest}\n`)) { const value = await reader.read(); assert.equal(value.done, false); text += decoder.decode(value.value); } }
    finally { await reader.cancel(); }
    const ids = [...text.matchAll(/^id: (\d+)$/gm)].map(match => Number(match[1]));
    assert.equal(ids.length, 352); assert.equal(ids[0], start + 101); assert.equal(ids.at(-1), latest);
    assert.ok(text.includes('legacy.event'));
    const idle = await fetch(`${address}/api/events?after=${latest}`, { headers: { accept: 'text/event-stream' }, signal: AbortSignal.timeout(1500) });
    assert.equal(idle.status, 200); assert.match(idle.headers.get('content-type') || '', /text\/event-stream/);
    await idle.body!.cancel();
    const reset = await fetch(`${address}/api/events?after=${latest + 20}`, { headers: { accept: 'text/event-stream' } });
    assert.match(await reset.text(), /event: resync/);
    f.store.db.prepare('DELETE FROM events WHERE seq=?').run(start + 5);
    assert.equal((await app.inject(`/api/events?after=${start + 5}`)).statusCode, 409);
  } finally { await app.close(); await f.cleanup(); }
});

test('摘要分页省去历史大正文，按需详情保留原运行材料和身份', async () => {
  const f = await fixture(), app = await createApp(f.service);
  try {
    await runNode(f, 'specify'); await runNode(f, 'specify');
    const full = (await app.inject(`/api/work-items/${f.item.id}`)).json();
    const summary = (await app.inject(`/api/work-items/${f.item.id}?history=summary`)).json();
    assert.equal(summary.attempts.length, full.attempts.length);
    assert.equal(summary.attempts[0].output, undefined); assert.equal(summary.attempts[0].guidance, undefined);
    assert.ok(JSON.stringify(summary).length < JSON.stringify(full).length);
    assert.deepEqual(summary.revisions, full.revisions);
    const page = (await app.inject(`/api/work-items/${f.item.id}/attempts?offset=0&limit=1`)).json();
    assert.equal(page.total, 2); assert.equal(page.nextOffset, 1); assert.equal(page.items.length, 1); assert.equal(page.items[0].prompt, undefined);
    const detail = (await app.inject(`/api/attempts/${page.items[0].id}`)).json();
    assert.ok(detail.prompt); assert.ok(detail.output); assert.ok(detail.guidance); assert.ok(detail.bindings.length);
    assert.equal((await app.inject(`/api/work-items/${f.item.id}/attempts?limit=101`)).statusCode, 400);
    assert.equal((await app.inject(`/api/work-items/${f.item.id}/attempts?state=unknown`)).statusCode, 400);
    assert.equal((await app.inject(`/api/work-items/${f.item.id}/attempts?nodeRunId=other-item-node`)).statusCode, 400);
    const filtered = (await app.inject(`/api/work-items/${f.item.id}/attempts?nodeRunId=${detail.nodeRunId}&state=completed&offset=1&limit=1`)).json();
    assert.equal(filtered.total, 2); assert.equal(filtered.items.length, 1); assert.equal(filtered.nextOffset, undefined);
    assert.equal((await app.inject(`/api/work-items/${f.item.id}/attempts?state=running`)).json().total, 0);
  } finally { await app.close(); await f.cleanup(); }
});

test('接纳预检共享断言且不写状态，真实接纳重查候选、命令、基线与需求', async () => {
  const f = await fixture();
  try {
    await acceptedDocuments(f); await runNode(f, 'implement'); await runNode(f, 'verify'); await runNode(f, 'review-code');
    await runNode(f, 'converge'); await runNode(f, 'review-converge');
    const report = f.store.list('artifacts', artifact => artifact.logicalId === 'convergence')[0];
    await f.service.acceptArtifact(report.id, report.revision);
    const candidate = f.store.list('candidates').at(-1)!;
    const before = JSON.stringify(f.store.db.prepare('SELECT * FROM entities ORDER BY kind,id').all());
    const events = f.store.eventCursor(0).latestSeq;
    const refresh = f.service.guidance.refresh, scan = f.service.artifacts.scanExternalChanges, checkpoint = f.service.workspaces.checkpoint;
    f.service.guidance.refresh = async () => { throw new Error('precheck must not refresh'); };
    f.service.artifacts.scanExternalChanges = async () => { throw new Error('precheck must not scan'); };
    f.service.workspaces.checkpoint = async () => { throw new Error('precheck must not checkpoint'); };
    try { for (let index = 0; index < 3; index++) { const check = await f.service.acceptancePrecheck(candidate.id); assert.equal(check.ready, true, JSON.stringify(check)); } }
    finally { f.service.guidance.refresh = refresh; f.service.artifacts.scanExternalChanges = scan; f.service.workspaces.checkpoint = checkpoint; }
    assert.equal(JSON.stringify(f.store.db.prepare('SELECT * FROM entities ORDER BY kind,id').all()), before);
    assert.equal(f.store.eventCursor(0).latestSeq, events);
    const projectRoot = f.store.get('projects', f.item.projectId).rootPath;
    await writeFile(join(projectRoot, 'AGENTS.md'), '# 外部章程变更\n后续执行必须重新读取此版本。');
    assert.equal((await f.service.acceptancePrecheck(candidate.id)).blockers[0].code, 'SYNC_REQUIRED');
    assert.equal(JSON.stringify(f.store.db.prepare('SELECT * FROM entities ORDER BY kind,id').all()), before);
    await rm(join(projectRoot, 'AGENTS.md'));
    const specPath = join(f.item.workspace, '.specflow', 'work-items', f.item.id, 'spec.md'), spec = await readFile(specPath, 'utf8');
    await writeFile(specPath, spec + '\n外部变更');
    assert.equal((await f.service.acceptancePrecheck(candidate.id)).blockers[0].code, 'SYNC_REQUIRED');
    assert.equal(JSON.stringify(f.store.db.prepare('SELECT * FROM entities ORDER BY kind,id').all()), before);
    assert.equal(f.store.eventCursor(0).latestSeq, events);
    await writeFile(specPath, spec);
    const original = await readFile(join(candidate.workspace, 'csv.js'), 'utf8');
    await writeFile(join(candidate.workspace, 'csv.js'), original + '\n// changed after preview\n');
    await assert.rejects(f.service.acceptCode(f.item.id, 'test'), /复核/);
    await writeFile(join(candidate.workspace, 'csv.js'), original);
    const project = f.store.get('projects', f.item.projectId);
    f.store.update('projects', project.id, { commands: project.commands.map(command => ({ ...command, timeoutMs: command.timeoutMs + 1 })) });
    await assert.rejects(f.service.acceptCode(f.item.id, 'test'), /验证/);
    f.store.update('projects', project.id, { commands: project.commands });
    f.service.workspaces.checkpoint = async (workspace, message) => {
      const result = await checkpoint.call(f.service.workspaces, workspace, message);
      const node = f.store.list('nodes', node => node.nodeId === 'specify')[0];
      await assert.rejects(f.service.startNode(node.id, node.revision), /集成/);
      assert.throws(() => f.service.assertProjectWritable(project.id), /接纳/);
      f.store.update('projects', project.id, { commands: project.commands.map(command => ({ ...command, timeoutMs: command.timeoutMs + 1 })) });
      return result;
    };
    try { await assert.rejects(f.service.acceptCode(f.item.id, 'test'), /验证/); }
    finally { f.service.workspaces.checkpoint = checkpoint; f.store.update('projects', project.id, { commands: project.commands }); }
    await writeFile(join(f.item.workspace, 'unreviewed.txt'), 'changed source baseline');
    await assert.rejects(f.service.acceptCode(f.item.id, 'test'), /基线/);
    await rm(join(f.item.workspace, 'unreviewed.txt'));
    f.store.update('projects', project.id, { commands: [{ id: 'test', executable: 'node', args: ['-e', 'setTimeout(() => {}, 500)'], timeoutMs: 2000 }] });
    const verifying = f.service.verifyCandidate(candidate.id);
    assert.equal((await f.service.acceptancePrecheck(candidate.id)).blockers[0].code, 'WORKSPACE_BUSY');
    await assert.rejects(f.service.acceptCode(f.item.id, 'test'), /候选验证/);
    await verifying;
    f.store.update('projects', project.id, { commands: project.commands });
    const current = f.service.requirements.current(f.item.id);
    f.service.saveRequirements(f.item.id, current.id, current.request + '\n新增需求', current.documents);
    await assert.rejects(f.service.acceptCode(f.item.id, 'test'), /输入/);
    assert.equal(f.store.list('codeOperations').length, 0);
  } finally { await f.cleanup(); }
});
