import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BackendRegistry } from '../packages/execution-contract/registry.ts';
import { RuntimeConfiguration } from '../apps/server/src/runtime-configuration.ts';
import { EngineeringService } from '../apps/server/src/service.ts';
import { SandboxBackend } from '../apps/server/src/sandbox-backend.ts';
import { createApp } from '../apps/server/src/app.ts';
import type { ExecutionRef, ModelTarget } from '../packages/domain/index.ts';
import type { ExecutionSnapshot, FrozenInput } from '../packages/execution-contract/index.ts';
import { acceptedDocuments, clarifySpec, fixture, runNode } from './helpers.ts';

class OpenCodeFixture extends SandboxBackend {
  starts = 0;
  toolInstructions() { return '使用 OpenCode 原生 read、glob、grep；写入仅由已授权实现角色执行。'; }
  override async inspect() { return { ...await super.inspect(), rootId: 'opencode-fixture', version: 'protocol-fixture' }; }
  override async listTargets(): Promise<ModelTarget[]> { return [{ backend: 'opencode', connectionId: 'fixture-provider', connectionSlug: 'fixture-provider', model: 'fixture-model', rootId: 'opencode-fixture' }]; }
  override async prepare(input: FrozenInput): Promise<ExecutionRef> { return { ...await super.prepare(input), backend: 'opencode', rootId: 'opencode-fixture' }; }
  override async start(ref: ExecutionRef, input: FrozenInput) { this.starts++; return super.start(ref, input); }
}

test('注册底座发现互相隔离；一个离线底座不会隐藏其他目录', async () => {
  const maka = new SandboxBackend(), opencode = new OpenCodeFixture();
  maka.inspect = async () => { throw new Error('offline'); };
  const registry = new BackendRegistry({ maka, sandbox: new SandboxBackend() });
  registry.register('opencode', opencode);
  assert.throws(() => registry.register('opencode', opencode), /已注册/);
  assert.throws(() => registry.require('unregistered' as any), /未注册/);
  const catalog = await registry.catalog();
  assert.equal(catalog.backends.find(row => row.id === 'maka')!.capabilities.available, false);
  assert.equal(catalog.backends.find(row => row.id === 'opencode')!.capabilities.available, true);
  assert.deepEqual(catalog.targets.filter(target => target.backend === 'opencode'), await opencode.listTargets());
});

test('工程切换使用新底座并跳过旧流程目标，旧尝试与旧产物保留原身份', async () => {
  const f = await fixture(), backend = new OpenCodeFixture();
  try {
    f.service.registry.register('opencode', backend);
    await runNode(f, 'specify');
    const original = f.store.list('attempts')[0], artifact = f.store.list('artifacts')[0];
    const target = (await backend.listTargets())[0], project = f.store.list('projects')[0];
    const run = f.store.list('runs')[0];
    f.store.update('runs', run.id, { definition: { ...run.definition, nodes: run.definition.nodes.map(node => node.id === 'specify' ? { ...node, target: original.target } : node) } });
    await f.service.configureProject(project.id, project.revision, { rules: project.rules, commands: project.commands, executionBackend: 'opencode', defaults: { analyst: target } });
    await runNode(f, 'specify');
    const attempts = f.store.list('attempts');
    assert.equal(attempts.length, 2);
    assert.deepEqual(f.store.get('attempts', original.id).target, original.target);
    assert.equal(attempts[1].target.backend, 'opencode');
    assert.equal(f.store.list('bindings').at(-1)!.ref.backend, 'opencode');
    assert.equal(backend.starts, 1);
    assert.equal(f.store.get('artifacts', artifact.id).revisionIds.length, 2);
    assert.throws(() => f.service.resolveTarget({ ...project, demo: false }, run.definition, run.definition.nodes[0], original.target), /验收后端/);
    const switched = f.store.get('projects', project.id);
    await assert.rejects(f.service.configureProject(project.id, switched.revision, { rules: switched.rules, commands: switched.commands, executionBackend: 'opencode', defaults: { analyst: original.target } }), /必须属于/);
  } finally { await f.cleanup(); }
});

test('OpenCode 派发回执丢失后保留原身份核对，绝不重新派发', async () => {
  class LostReceipt extends OpenCodeFixture {
    override async start(ref: ExecutionRef, input: FrozenInput): Promise<ExecutionSnapshot> { await super.start(ref, input); throw new Error('lost receipt'); }
  }
  const f = await fixture(), backend = new LostReceipt();
  try {
    f.service.registry.register('opencode', backend);
    await runNode(f, 'specify', (await backend.listTargets())[0]);
    const attempt = f.store.list('attempts')[0];
    assert.equal(attempt.execution, 'reconciling');
    await f.service.reconcile(attempt.id);
    assert.equal(f.store.get('attempts', attempt.id).execution, 'completed');
    assert.equal(backend.starts, 1);
  } finally { await f.cleanup(); }
});

test('本机 OpenCode 配置经鉴权保存、重启可读取，API和导出不泄露密码', async () => {
  const f = await fixture();
  const configuration = new RuntimeConfiguration(f.root, f.service.registry);
  await configuration.initialize();
  const service = new EngineeringService(f.store, f.root, f.service.registry, configuration), app = await createApp(service);
  try {
    const url = '/api/backend/opencode/configure', password = 'local-test-password-do-not-export';
    const payload = { baseUrl: 'http://127.0.0.1:4096', username: 'opencode', password };
    assert.equal((await app.inject({ method: 'POST', url, payload })).statusCode, 403);
    const token = (await app.inject('/api/bootstrap')).json().token;
    const headers = { 'x-specflow-token': token, 'idempotency-key': 'configure-opencode' };
    const result = await app.inject({ method: 'POST', url, payload, headers });
    assert.equal(result.statusCode, 200, result.body);
    assert.equal(result.json().hasPassword, true);
    assert.ok(!result.body.includes(password));
    const newRegistry = new BackendRegistry({ maka: new SandboxBackend(), sandbox: new SandboxBackend() });
    const restored = new RuntimeConfiguration(f.root, newRegistry); await restored.initialize();
    assert.deepEqual(restored.describeOpenCode(), configuration.describeOpenCode());
    // No model/network access is needed to inspect the catalog's privacy contract.
    service.registry.register('opencode', new OpenCodeFixture(), true);
    assert.ok(!(await app.inject('/api/backend/targets')).body.includes(password));
    assert.ok(!(await app.inject(`/api/work-items/${f.item.id}/export`)).body.includes(password));
    assert.ok(!JSON.stringify(f.store.db.prepare('SELECT * FROM requests').all()).includes(password));
    await configuration.configureOpenCode({ baseUrl: payload.baseUrl });
    assert.equal(configuration.describeOpenCode().hasPassword, true);
    await configuration.configureOpenCode({ baseUrl: 'http://127.0.0.1:4097' });
    assert.equal(configuration.describeOpenCode().hasPassword, false, '换地址不应转发旧密码');
    await assert.rejects(configuration.configureOpenCode({ baseUrl: 'https://example.com' }), /本机|loopback|localhost|地址/);
    await assert.rejects(configuration.configureOpenCode({ baseUrl: 'http://user:secret@127.0.0.1:4096' }));
    const stored = JSON.parse(await readFile(join(f.root, 'runtime-connections.json'), 'utf8'));
    assert.equal(stored.baseUrl, 'http://127.0.0.1:4097');
  } finally { await app.close(); await f.cleanup(); }
});

test('仍有待核对的 OpenCode 运行时拒绝替换连接配置', async () => {
  const f = await fixture(), configuration = new RuntimeConfiguration(f.root, f.service.registry);
  await configuration.initialize();
  const service = new EngineeringService(f.store, f.root, f.service.registry, configuration);
  try {
    await runNode(f, 'specify');
    const attempt = f.store.list('attempts')[0];
    f.store.update('attempts', attempt.id, { execution: 'reconciling', target: { ...attempt.target, backend: 'opencode' } });
    await assert.rejects(service.configureOpenCode({ baseUrl: 'http://127.0.0.1:4097' }), /待核对/);
    assert.equal(configuration.describeOpenCode().baseUrl, 'http://127.0.0.1:4096');
  } finally { await f.cleanup(); }
});

test('作者和双视角复核使用对应底座的工具指令，第一任务prepare与start使用相同冻结材料', async () => {
  class StrictInputBackend extends OpenCodeFixture {
    prepared = new Map<string, string>();
    override async prepare(input: FrozenInput) { const ref = await super.prepare(input); this.prepared.set(ref.turnId, JSON.stringify(input)); return ref; }
    override async start(ref: ExecutionRef, input: FrozenInput) {
      assert.equal(JSON.stringify(input), this.prepared.get(ref.turnId));
      assert.match(input.prompt, /OpenCode 原生 read/);
      assert.doesNotMatch(input.prompt, /tool_search|SpecFlowWrite|SpecFlowRead/);
      return super.start(ref, input);
    }
  }
  const f = await fixture(), backend = new StrictInputBackend();
  try {
    f.service.registry.register('opencode', backend); const target = (await backend.listTargets())[0];
    await runNode(f, 'specify', target); await clarifySpec(f); await runNode(f, 'review-spec', target);
    assert.equal(f.store.list('attempts', attempt => !!attempt.review && attempt.target.backend === 'opencode').length, 2);
    const spec = f.store.list('artifacts', artifact => artifact.logicalId === 'spec')[0];
    await f.service.acceptArtifact(spec.id, spec.revision);
    for (const [node, review, logical] of [['plan', 'review-plan', 'plan'], ['tasks', 'review-tasks', 'tasks']]) {
      await runNode(f, node); await runNode(f, review);
      const artifact = f.store.list('artifacts', value => value.logicalId === logical)[0];
      await f.service.acceptArtifact(artifact.id, artifact.revision);
    }
    const implemented = await runNode(f, 'implement', target);
    assert.equal(implemented.execution, 'completed', implemented.error);
    assert.equal(implemented.gate, 'passed', implemented.error);
    const taskBinding = f.store.list('bindings').at(-1)!;
    assert.equal(taskBinding.taskId, 'T001');
    assert.equal(f.store.list('tasks')[0].state, 'tested');
  } finally { await f.cleanup(); }
});

test('多任务阶段回执丢失时只核对当前任务，未执行的任务不能被标成完成', async () => {
  class LostTaskReceipt extends OpenCodeFixture {
    override async start(ref: ExecutionRef, input: FrozenInput): Promise<ExecutionSnapshot> { await super.start(ref, input); throw new Error('lost task receipt'); }
  }
  const f = await fixture(), backend = new LostTaskReceipt();
  try {
    await acceptedDocuments(f);
    const artifact = f.store.list('artifacts', value => value.logicalId === 'tasks')[0];
    const previous = f.store.get('artifactRevisions', artifact.currentRevisionId);
    f.service.artifacts.create(f.item.id, 'tasks', `${previous.content}\n- [ ] T002 依赖 T001，核实导入错误处理。`, previous.inputs, undefined, artifact.revision);
    await runNode(f, 'review-tasks');
    const tasks = f.store.get('artifacts', artifact.id); await f.service.acceptArtifact(tasks.id, tasks.revision);
    f.service.registry.register('opencode', backend);
    await runNode(f, 'implement', (await backend.listTargets())[0]);
    const attempt = f.store.list('attempts', value => value.target.backend === 'opencode')[0];
    assert.equal(attempt.execution, 'reconciling');
    await f.service.reconcile(attempt.id);
    const node = f.store.get('nodes', attempt.nodeRunId), candidate = f.store.get('candidates', attempt.candidateId!);
    assert.equal(node.execution, 'failed');
    assert.equal(node.gate, 'blocked');
    assert.notEqual(candidate.status, 'ready');
    assert.equal(backend.starts, 1);
    assert.deepEqual(f.store.list('tasks', task => task.attemptId === attempt.id).map(task => [task.taskId, task.state]), [['T001', 'tested'], ['T002', 'pending']]);
  } finally { await f.cleanup(); }
});

test('中断任务返回无效产物时结束为失败，用户可以创建新尝试', async () => {
  class InvalidReceipt extends OpenCodeFixture {
    override async start(ref: ExecutionRef, input: FrozenInput): Promise<ExecutionSnapshot> {
      const snapshot = await super.start(ref, input); snapshot.output = 'invalid JSON'; throw new Error('lost receipt');
    }
  }
  const f = await fixture(), backend = new InvalidReceipt();
  try {
    await acceptedDocuments(f); f.service.registry.register('opencode', backend);
    await runNode(f, 'implement', (await backend.listTargets())[0]);
    const attempt = f.store.list('attempts', value => value.target.backend === 'opencode')[0];
    assert.equal(attempt.execution, 'reconciling');
    await f.service.reconcile(attempt.id);
    assert.equal(f.store.get('attempts', attempt.id).execution, 'failed');
    assert.equal(f.store.get('nodes', attempt.nodeRunId).gate, 'blocked');
    assert.equal((await f.service.readiness(attempt.nodeRunId)).ready, true);
  } finally { await f.cleanup(); }
});
