import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { BackendId, ModelTarget, Project } from '../packages/domain/index.ts';
import { backendInfo, currentTargetOverride, defaultsForBackend, openCodeConfiguration, projectBackend, projectBackendOptions, selectBackendTarget, serializeTarget, targetLabel, targetsForBackend, type BackendCatalog } from '../apps/web/src/backendSelection.ts';
import { Dialogs } from '../apps/web/src/Dialogs.tsx';
import { Workspace, type WorkspaceContext } from '../apps/web/src/context.tsx';

const maka: ModelTarget = { backend: 'maka', connectionId: 'maka-provider', connectionSlug: 'maka-only', model: 'same-model' };
const opencode: ModelTarget = { backend: 'opencode', connectionId: 'opencode-provider', connectionSlug: 'opencode-only', model: 'same-model' };
const sandbox: ModelTarget = { backend: 'sandbox', connectionId: 'demo', connectionSlug: 'sandbox-only', model: 'demo' };
const capabilities = { available: true, version: 'test', canResume: false, canInteract: true, readOnlyReview: true };
const catalog: BackendCatalog = {
  maka: capabilities, opencode: { ...capabilities, available: false, reason: 'OpenCode 服务未启动' }, sandbox: capabilities,
  backends: (['maka', 'opencode', 'sandbox'] as BackendId[]).map(id => ({ id, name: id === 'opencode' ? 'OpenCode' : id, capabilities: id === 'opencode' ? { ...capabilities, available: false, reason: 'OpenCode 服务未启动' } : capabilities, configurable: id !== 'sandbox' })),
  targets: [maka, opencode, sandbox], configuration: { opencode: { baseUrl: 'http://127.0.0.1:4096', username: 'opencode', hasPassword: true } },
};

test('旧真实项目默认 Maka，示例默认 sandbox，显式选择优先且目录严格按底座过滤', () => {
  assert.equal(projectBackend(), 'maka');
  assert.equal(projectBackend({ demo: false }), 'maka');
  assert.equal(projectBackend({ demo: true }), 'sandbox');
  assert.equal(projectBackend({ demo: true, executionBackend: 'opencode' }), 'opencode');
  assert.deepEqual(targetsForBackend(catalog.targets, 'opencode'), [opencode]);
  assert.deepEqual(targetsForBackend(catalog.targets, 'maka'), [maka]);
  assert.deepEqual(targetsForBackend([], 'opencode'), []);
  assert.deepEqual(projectBackendOptions(catalog, { demo: false }).map(backend => backend.id), ['maka', 'opencode']);
  assert.deepEqual(projectBackendOptions({ ...catalog, backends: catalog.backends.filter(backend => backend.id === 'maka') }, { demo: true }).map(backend => backend.id), ['maka'], '选择入口以已注册底座为准');
});

test('切换底座清理角色默认，不把旧流程的目标和尚未清空的覆盖继续用于新尝试', () => {
  const defaults: Project['defaults'] = { analyst: maka, developer: opencode, reviewer: sandbox };
  assert.deepEqual(defaultsForBackend(defaults, 'opencode'), { developer: opencode });
  assert.deepEqual(defaultsForBackend(defaultsForBackend(defaults, 'opencode'), 'maka'), {});
  assert.deepEqual(defaults.analyst, maka, '切换不能修改原项目对象');
  assert.equal(selectBackendTarget('opencode', maka, sandbox, opencode), opencode);
  assert.equal(selectBackendTarget('opencode', maka, sandbox), undefined);
  const nodeTarget = { ...opencode, model: 'node-override' };
  assert.equal(selectBackendTarget('opencode', nodeTarget, opencode), nodeTarget);
  assert.equal(currentTargetOverride(serializeTarget(maka), 'opencode'), undefined);
  assert.deepEqual(currentTargetOverride(serializeTarget(opencode), 'opencode'), opencode);
  for (const value of ['broken', 'null', '{"backend":"opencode"}', '']) assert.equal(currentTargetOverride(value, 'opencode'), undefined);
});

test('同名模型的记录可辨认底座，状态和不可用原因跟随所选底座', () => {
  assert.notEqual(targetLabel(maka), targetLabel(opencode));
  assert.match(targetLabel(opencode), /OpenCode/);
  assert.equal(backendInfo(catalog, 'opencode').capabilities?.reason, 'OpenCode 服务未启动');
  assert.equal(backendInfo(catalog, 'maka').capabilities?.available, true);
  assert.equal(backendInfo(undefined, 'opencode').name, 'OpenCode');
  assert.equal(backendInfo(undefined, 'opencode').capabilities, undefined);
});

test('OpenCode 配置区分保留、替换和清除密码，保留输入密码中的空格', () => {
  assert.deepEqual(openCodeConfiguration(' http://127.0.0.1:4096/ ', ' opencode ', undefined), { baseUrl: 'http://127.0.0.1:4096/', username: 'opencode' });
  assert.equal(Object.hasOwn(openCodeConfiguration('http://localhost:4096', '', undefined), 'password'), false);
  assert.equal(openCodeConfiguration('http://localhost:4096', '', '').password, '');
  assert.equal(openCodeConfiguration('http://localhost:4096', '', ' secret ').password, ' secret ');
});

function settings(backend: BackendId, demo = false): string {
  const project: Project = { id: 'project', revision: 1, createdAt: '', updatedAt: '', name: 'Project', rootPath: '/project', baseCommit: 'base', rules: '', defaults: { analyst: backend === 'opencode' ? opencode : maka }, commands: [], demo, executionBackend: backend };
  const context = { project, backend: catalog, isPending: () => false, perform: async () => {}, refresh: async () => {} } as unknown as WorkspaceContext;
  return renderToStaticMarkup(createElement(Workspace.Provider, { value: context }, createElement(Dialogs, { modal: 'settings', close() {}, open() {}, projects: [project], setBackend() {}, returnFocus: { current: null } })));
}

test('工程设置呈现当前底座连接与模型，真实工程不提供 sandbox，认证不回显密码', () => {
  const html = settings('opencode');
  assert.match(html, /OpenCode 服务地址/);
  assert.match(html, /opencode serve/);
  assert.match(html, /OpenCode 服务未启动/);
  assert.match(html, /已保存；留空保留原密码/);
  assert.doesNotMatch(html, /添加 Maka 连接|maka-only|sandbox-only|value="sandbox"/);
  const roleOptions = [...html.matchAll(/<select[^>]*>(.*?)<\/select>/g)].map(match => match[1]).filter(value => value.includes('opencode-only'));
  assert.equal(roleOptions.length, 4, '四种角色都只显示当前底座目录');
  assert.match(settings('maka'), /添加 Maka 连接/);
  assert.doesNotMatch(settings('maka'), /OpenCode 服务地址|opencode-only/);
  assert.match(settings('sandbox', true), /value="sandbox"/);
});
