import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { createApp } from '../apps/server/src/app.ts';
import { fixture, acceptedDocuments, runNode } from './helpers.ts';
test('桌面会话保护 bootstrap 与静态资源，允许随机本地端口并拒绝其他来源', async () => {
  const f = await fixture(), app = await createApp(f.service, { desktopSecret: 'desktop-test-secret' });
  try {
    assert.equal((await app.inject('/api/bootstrap')).statusCode, 403);
    assert.equal((await app.inject('/')).statusCode, 403);
    const headers = { host: '127.0.0.1:58429', origin: 'http://127.0.0.1:58429', 'x-specflow-desktop-secret': 'desktop-test-secret' };
    const authenticated = await app.inject({ url: '/api/bootstrap', headers });
    assert.equal(authenticated.statusCode, 200);
    assert.match(String(authenticated.headers['content-security-policy']), /script-src 'self'/);
    assert.equal((await app.inject({ url: '/api/bootstrap', headers: { ...headers, origin: 'http://127.0.0.1:4318' } })).statusCode, 403);
    assert.equal((await app.inject({ url: '/api/bootstrap', headers: { ...headers, origin: 'https://untrusted.example' } })).statusCode, 403);
    assert.equal((await app.inject({ url: '/api/bootstrap', headers: { ...headers, host: 'untrusted.example' } })).statusCode, 403);
  } finally { await app.close(); await f.cleanup(); }
});
test('本地写接口拒绝无会话和跨来源请求；启动具有幂等身份', async () => {
  const f = await fixture(), app = await createApp(f.service);
  try {
    const bootstrap = (await app.inject('/api/bootstrap')).json(); const node = f.store.list('nodes')[0];
    const url = `/api/node-runs/${node.id}/attempts`, payload = { expectedRevision: node.revision };
    assert.equal((await app.inject({ method: 'POST', url, payload })).statusCode, 403);
    const headers = { 'x-specflow-token': bootstrap.token, 'idempotency-key': 'same-start-key' };
    assert.equal((await app.inject({ method: 'POST', url, payload, headers: { ...headers, origin: 'https://untrusted.example' } })).statusCode, 403);
    const first = await app.inject({ method: 'POST', url, payload, headers }); assert.equal(first.statusCode, 200, first.body);
    const repeated = await app.inject({ method: 'POST', url, payload, headers }); assert.equal(repeated.json().id, first.json().id);
    await f.service.waitForIdle(); assert.equal(f.store.list('attempts').length, 1);
    const conflict = await app.inject({ method: 'POST', url, payload: { expectedRevision: 999 }, headers }); assert.equal(conflict.statusCode, 409);
  } finally { await app.close(); await f.cleanup(); }
});
test('导入不继承接纳，导出包含版本与运行身份且不包含会话凭据', async () => {
  const f = await fixture(), app = await createApp(f.service);
  try {
    const bootstrap = (await app.inject('/api/bootstrap')).json();
    const result = await app.inject({ method: 'POST', url: `/api/work-items/${f.item.id}/import`, headers: { 'x-specflow-token': bootstrap.token, 'idempotency-key': 'import-1' }, payload: { artifacts: [{ logicalId: 'spec', content: '# 导入需求\n\n验收：支持正常输入并验证结果。' }] } }); assert.equal(result.statusCode, 200);
    const artifact = f.store.list('artifacts')[0]; assert.equal(artifact.acceptedRevisionId, undefined);
    const exported = await app.inject(`/api/work-items/${f.item.id}/export`); assert.equal(exported.statusCode, 200); assert.equal(exported.json().format, 'specflow-evidence-v1'); assert.ok(!exported.body.includes(bootstrap.token));
  } finally { await app.close(); await f.cleanup(); }
});
test('工作空间登记仅使用目录名，改名保留目录与工作项且重开不覆盖名称', async () => {
  const f = await fixture(), app = await createApp(f.service);
  try {
    const rootPath = join(f.root, 'workspace-project');
    await mkdir(rootPath); await writeFile(join(rootPath, 'README.md'), '# Workspace');
    await f.service.workspaces.git(rootPath, ['init']);
    await f.service.workspaces.checkpoint(rootPath, 'Initialize workspace fixture');
    // Opening a project is independent of creating an item and permits local edits.
    await writeFile(join(rootPath, 'draft.md'), 'uncommitted draft');
    const workItems = f.store.list('workItems'), worktrees = await readdir(join(f.root, 'workspaces'));
    const token = (await app.inject('/api/bootstrap')).json().token;
    const headers = { 'x-specflow-token': token, 'idempotency-key': 'register-workspace' };
    const opened = await app.inject({ method: 'POST', url: '/api/projects', headers, payload: { rootPath } });
    assert.equal(opened.statusCode, 200, opened.body);
    const project = opened.json();
    assert.equal(project.name, basename(rootPath));
    assert.deepEqual(f.store.list('workItems'), workItems);
    assert.deepEqual(await readdir(join(f.root, 'workspaces')), worktrees);
    const url = `/api/projects/${project.id}/rename`, payload = { name: '  我的大项目  ', expectedRevision: project.revision };
    assert.equal((await app.inject({ method: 'POST', url, payload })).statusCode, 403);
    const renameHeaders = { ...headers, 'idempotency-key': 'rename-workspace' };
    const renamed = await app.inject({ method: 'POST', url, headers: renameHeaders, payload });
    assert.equal(renamed.statusCode, 200, renamed.body);
    const changed = renamed.json();
    assert.equal(changed.name, '我的大项目');
    assert.deepEqual(changed, { ...project, name: changed.name, revision: project.revision + 1, updatedAt: changed.updatedAt });
    const replayed = await app.inject({ method: 'POST', url, headers: renameHeaders, payload });
    assert.deepEqual(replayed.json(), changed);
    const invalid = await app.inject({ method: 'POST', url, headers: { ...headers, 'idempotency-key': 'empty-workspace-name' }, payload: { name: ' \n ', expectedRevision: changed.revision } });
    assert.equal(invalid.statusCode, 400);
    const stale = await app.inject({ method: 'POST', url, headers: { ...headers, 'idempotency-key': 'stale-workspace-name' }, payload: { name: '旧页面修改', expectedRevision: project.revision } });
    assert.equal(stale.statusCode, 409); assert.equal(stale.json().code, 'REVISION_CONFLICT');
    const reopened = await app.inject({ method: 'POST', url: '/api/projects', headers: { ...headers, 'idempotency-key': 'reopen-workspace' }, payload: { rootPath } });
    assert.deepEqual(reopened.json(), changed);
    assert.equal((await app.inject('/api/bootstrap')).json().projects.find((value: { id: string }) => value.id === project.id).name, changed.name);
    assert.deepEqual(f.store.list('workItems'), workItems);
    assert.deepEqual(await readdir(join(f.root, 'workspaces')), worktrees);
  } finally { await app.close(); await f.cleanup(); }
});
