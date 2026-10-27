import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { link, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DshBackend, type DshHostContext } from '../src/backend.ts';
import { hash } from '../../../packages/domain/index.ts';
import type { FrozenInput } from '../../../packages/execution-contract/index.ts';

async function fixture(t: TestContext) {
  const root = await mkdtemp(join(tmpdir(), 'specflow-dsh-')), workspaceRoot = join(root, 'workspaces'), workspace = join(workspaceRoot, 'attempt');
  await mkdir(workspace, { recursive: true });
  const logs = new Map<string, { header: any; events: any[] }>(), live = new Map<string, any>(), scopes = new Map<string, any>();
  let dispatches = 0, creations = 0, flushes = 0, loseReceipt = false;
  const host = {
    llm: { listProviders: () => [{ id: 'deepseek', name: 'DeepSeek' }], listModels: async () => [{ id: 'deepseek-chat', name: 'DeepSeek Chat' }] },
    sessions: { flush: async () => { flushes++; return true; } },
    sessionPersistence: { open: async (id: string, access: string) => { assert.equal(access, 'read'); const log = logs.get(id); if (!log) throw new Error('session missing'); return { header: log.header, read: async () => ({ events: log.events }), close: async () => {} }; } },
    agents: {
      get: (id: string) => live.get(id),
      create: async (options: any) => {
        creations++; assert.equal(logs.has(options.sessionId), false);
        const header = { id: options.sessionId, cwd: options.meta.cwd }, events: any[] = [];
        const log = { header, events }, tools = new Map<string, any>(), listeners = new Map<string, any>();
        let finishIdle: (() => void) | undefined;
        const push = (type: string, data: any) => { events.push({ type, seq: events.length, data }); };
        const scope = { tools, listeners, restrictions: undefined as unknown, mode: '', guard: undefined as any };
        const agent = {
          id: options.sessionId, session: { id: options.sessionId, header }, status: 'idle',
          followup(message: any) { dispatches++; agent.status = 'running'; push('turn/start', { turn: 1 }); push('user/message', message); if (loseReceipt) throw new Error('receipt lost'); },
          cancel(cause: any) { if (agent.status !== 'running') return; push('turn/end', { turn: 1, reason: { kind: 'aborted', reason: cause } }); agent.status = 'idle'; finishIdle?.(); },
          whenIdle: () => agent.status === 'idle' ? Promise.resolve() : new Promise<void>(done => { const previous = finishIdle; finishIdle = () => { previous?.(); done(); }; }),
        };
        options.setup({ tools: { restrict: (value: any) => { scope.restrictions = value; }, presentAs: (mode: string) => { scope.mode = mode; }, register: (tool: any) => tools.set(tool.name, tool), guard: (guard: any) => { scope.guard = guard; } }, on: (name: string, listener: any) => listeners.set(name, listener) }, agent);
        scopes.set(options.sessionId, scope); logs.set(options.sessionId, log); live.set(options.sessionId, agent);
        return { agent, dispose: async () => { agent.cancel({ kind: 'disposed' }); live.delete(agent.id); } };
      },
    },
  };
  const options = { context: host as unknown as DshHostContext, stateDir: join(root, 'journals'), workspaceRoot, instanceId: 'fixture-profile', pollIntervalMs: 1 };
  const backends: DshBackend[] = [], connect = (patch: Partial<typeof options> = {}) => { const backend = new DshBackend({ ...options, ...patch }); backends.push(backend); return backend; }, backend = connect();
  const target = (await backend.listTargets())[0];
  const input = (patch: Partial<FrozenInput> = {}): FrozenInput => ({ attemptId: 'first', workspace, target, prompt: 'Return StageOutput JSON', maxSteps: 2, inputHash: 'frozen', readOnly: false, artifacts: [], node: { id: 'specify', name: 'Specify', type: 'agent', prompt: '', inputs: [], outputs: ['spec'] }, ...patch });
  function finish(id: string, output = '{"summary":"done","artifacts":[]}') {
    const log = logs.get(id)!, agent = live.get(id);
    log.events.push({ type: 'assistant/message', seq: log.events.length, data: { turn: 1, step: 1, message: { content: [{ type: 'text', text: output }] }, usage: { inputTokens: 20, outputTokens: 10 } } });
    log.events.push({ type: 'turn/end', seq: log.events.length, data: { turn: 1, reason: { kind: 'completed' } } });
    // Calling cancel only resolves the fake idle observers once status is idle.
    agent.cancel({ kind: 'user' }); log.events.pop();
  }
  const invoke = (id: string, name: string, args: unknown) => scopes.get(id).tools.get(name).execute(args, { signal: new AbortController().signal });
  t.after(async () => { await Promise.all(backends.map(backend => backend.close())); await rm(root, { recursive: true, force: true }); });
  return { root, workspaceRoot, workspace, options, backend, connect, input, scopes, live, logs, finish, invoke, get creations() { return creations; }, get dispatches() { return dispatches; }, get flushes() { return flushes; }, set loseReceipt(value: boolean) { loseReceipt = value; } };
}

test('DSH advertises the host model catalog and binds each frozen attempt to its own identity', async t => {
  const f = await fixture(t), capabilities = await f.backend.inspect();
  assert.equal(capabilities.available, true); assert.equal(capabilities.canResume, false); assert.equal(capabilities.stepLimit, 'native'); assert.equal(capabilities.readOnlyReview, true);
  assert.equal(capabilities.details?.stepLimit.unit, 'host-step'); assert.equal(capabilities.details?.resume.mode, 'reconcile-only'); assert.equal(capabilities.details?.usage.cost, 'unknown');
  const input = f.input(), [ref, same] = await Promise.all([f.backend.prepare(input), f.backend.prepare(input)]);
  assert.deepEqual(ref, same); assert.equal(ref.backend, 'dsh'); assert.equal(f.creations, 0);
  const second = await f.backend.prepare(f.input({ attemptId: 'second' })); assert.notEqual(second.sessionId, ref.sessionId);
  await assert.rejects(f.backend.prepare(f.input({ prompt: 'changed' })), /冻结输入/);
  await assert.rejects(f.backend.prepare(f.input({ attemptId: 'outside', workspace: f.root })), /工作区目录/);
  await assert.rejects(f.backend.prepare(f.input({ attemptId: 'steps', maxSteps: 0 })), /正整数/);
  await assert.rejects(f.connect({ instanceId: 'different-profile' }).query(ref), /身份已变化/);
});

test('DSH dispatches once and reads the identified turn result after persistence flush and plugin restart', async t => {
  const f = await fixture(t), input = f.input(), ref = await f.backend.prepare(input);
  assert.equal((await f.backend.start(ref, input)).state, 'running');
  assert.equal((await f.backend.start(ref, input)).state, 'running'); assert.equal(f.creations, 1); assert.equal(f.dispatches, 1);
  f.finish(ref.sessionId);
  const result = await f.backend.readResult(ref);
  assert.equal(result.state, 'completed'); assert.match(result.output!, /done/); assert.equal(result.terminalEventId, `${ref.sessionId}:3`); assert.deepEqual(result.usage, { inputTokens: 20, outputTokens: 10, costUsd: null }); assert.ok(f.flushes > 0);
  assert.equal(result.termination?.reason, 'natural_completion'); assert.equal(result.termination?.confirmed, true); assert.equal(result.usageMeasurement?.completeness, 'partial'); assert.equal(result.usageMeasurement?.scope, 'turn'); assert.equal(result.usageMeasurement?.eventId, result.terminalEventId);
  const afterRestart = f.connect(); f.logs.clear(); f.live.clear();
  assert.deepEqual(await afterRestart.readResult(ref), result);
  assert.deepEqual(await afterRestart.start(ref, input), result); assert.equal(f.dispatches, 1);
  assert.equal((await afterRestart.planResume(ref)).possible, false);
  await assert.rejects(afterRestart.resume(ref, {}), /中断 turn/);
});

test('DSH ambiguous dispatch receipt and orphaned turns never cause automatic replay', async t => {
  const f = await fixture(t), input = f.input(), ref = await f.backend.prepare(input);
  f.loseReceipt = true;
  assert.equal((await f.backend.start(ref, input)).state, 'unknown');
  assert.equal((await f.backend.start(ref, input)).state, 'running'); assert.equal(f.dispatches, 1);
  f.live.delete(ref.sessionId);
  const afterRestart = f.connect();
  assert.equal((await afterRestart.start(ref, input)).state, 'unknown'); assert.equal(f.dispatches, 1); assert.equal(f.creations, 1);
  f.logs.get(ref.sessionId)!.events.push({ type: 'turn/end', seq: 2, data: { turn: 1, reason: { kind: 'interrupted' } } });
  assert.equal((await afterRestart.query(ref)).state, 'unknown');
});

test('DSH read-only review has no mutation tools or inherited capabilities', async t => {
  const f = await fixture(t), input = f.input({ readOnly: true }), ref = await f.backend.prepare(input); await f.backend.start(ref, input);
  const scope = f.scopes.get(ref.sessionId)!;
  assert.deepEqual(scope.restrictions, { allow: [] }); assert.equal(scope.mode, 'native');
  assert.deepEqual([...scope.tools.keys()], ['specflow_list_files', 'specflow_read_file']);
  assert.equal(typeof scope.guard({ name: 'bash' }), 'string'); assert.equal(typeof scope.guard({ name: 'run_code' }), 'string'); assert.equal(scope.guard({ name: 'specflow_read_file' }), undefined);
  await writeFile(join(f.workspace, 'example.txt'), 'hello');
  const output = JSON.parse(await f.invoke(ref.sessionId, 'specflow_read_file', { path: 'example.txt' })); assert.equal(output.content, 'hello'); assert.equal(output.sha256, hash('hello'));
  await assert.rejects(f.invoke(ref.sessionId, 'specflow_read_file', { path: '../outside.txt' }), /越过工作区/);
  await writeFile(join(f.workspace, '.git'), 'gitdir: elsewhere');
  await assert.rejects(f.invoke(ref.sessionId, 'specflow_read_file', { path: '.git' }), /特殊路径/);
  await f.backend.stop(ref); assert.equal((await f.backend.query(ref)).state, 'cancelled');
});

test('DSH edits are workspace contained, hash guarded and reject hard links or external directory aliases', async t => {
  const f = await fixture(t), input = f.input(), ref = await f.backend.prepare(input); await f.backend.start(ref, input);
  await f.invoke(ref.sessionId, 'specflow_write_file', { path: 'new.txt', expected_hash: '', content: 'hello' });
  await assert.rejects(f.invoke(ref.sessionId, 'specflow_write_file', { path: 'new.txt', expected_hash: '', content: 'clobber' }), /内容已变化/);
  await f.invoke(ref.sessionId, 'specflow_edit_file', { path: 'new.txt', expected_hash: hash('hello'), old_text: 'hello', new_text: 'goodbye' });
  assert.equal(await readFile(join(f.workspace, 'new.txt'), 'utf8'), 'goodbye');
  await assert.rejects(f.invoke(ref.sessionId, 'specflow_write_file', { path: '../escape.txt', expected_hash: '', content: 'bad' }), /越过工作区/);
  await mkdir(join(f.root, 'outside')); await writeFile(join(f.root, 'outside', 'secret.txt'), 'secret');
  await symlink(join(f.root, 'outside'), join(f.workspace, 'alias'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(f.invoke(ref.sessionId, 'specflow_read_file', { path: 'alias/secret.txt' }), /工作区之外/);
  await assert.rejects(f.invoke(ref.sessionId, 'specflow_write_file', { path: 'alias/new.txt', expected_hash: '', content: 'bad' }), /工作区之外/);
  await link(join(f.root, 'outside', 'secret.txt'), join(f.workspace, 'hardlink.txt'));
  await assert.rejects(f.invoke(ref.sessionId, 'specflow_read_file', { path: 'hardlink.txt' }), /硬链接/);
  await assert.rejects(f.invoke(ref.sessionId, 'specflow_write_file', { path: 'hardlink.txt', expected_hash: hash('secret'), content: 'bad' }), /硬链接/);
  assert.equal(await readFile(join(f.root, 'outside', 'secret.txt'), 'utf8'), 'secret');
  await mkdir(join(f.workspace, '.git')); await writeFile(join(f.workspace, '.git', 'config'), 'git config');
  await symlink(join(f.workspace, '.git'), join(f.workspace, 'git-alias'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(f.invoke(ref.sessionId, 'specflow_read_file', { path: 'git-alias/config' }), /实际路径指向 .git/);
});

test('DSH pre-step rejects the next model step at maxSteps and records a failed terminal result', async t => {
  const f = await fixture(t), input = f.input({ maxSteps: 1 }), ref = await f.backend.prepare(input); await f.backend.start(ref, input);
  const listener = f.scopes.get(ref.sessionId).listeners.get('agent/pre-step'), agent = f.live.get(ref.sessionId); let admitted = 0;
  const next = async () => { admitted++; return { kind: 'enter', messages: [] }; };
  assert.equal((await listener({ agent, step: 1 }, next)).kind, 'enter');
  assert.equal((await listener({ agent, step: 2 }, next)).kind, 'reject'); assert.equal(admitted, 1);
  const result = await f.backend.query(ref); assert.equal(result.state, 'failed'); assert.match(result.error!, /最大 1 步/);
  assert.equal(result.termination?.reason, 'step_limit'); assert.equal(result.termination?.confirmed, true);
});

test('DSH query refuses a session whose persistent workspace identity changed', async t => {
  const f = await fixture(t), input = f.input(), ref = await f.backend.prepare(input); await f.backend.start(ref, input);
  f.logs.get(ref.sessionId)!.header.cwd = f.root;
  const result = await f.backend.query(ref); assert.equal(result.state, 'unknown'); assert.match(result.error!, /工作区/);
});

test('DSH close drains in-flight agent creation without releasing a prompt', async t => {
  const f = await fixture(t), input = f.input(), ref = await f.backend.prepare(input);
  const create = f.options.context.agents.create.bind(f.options.context.agents);
  let entered!: () => void, release!: () => void;
  const creationEntered = new Promise<void>(done => { entered = done; }), creationGate = new Promise<void>(done => { release = done; });
  f.options.context.agents.create = async options => { entered(); await creationGate; return create(options); };
  const starting = f.backend.start(ref, input); await creationEntered;
  const closing = f.backend.close(), closingAgain = f.backend.close(); release();
  const result = await starting; await Promise.all([closing, closingAgain]);
  assert.equal(result.state, 'cancelled'); assert.equal(f.creations, 1); assert.equal(f.dispatches, 0); assert.equal(f.live.size, 0);
  assert.equal((await f.connect().query(ref)).state, 'cancelled');
  await assert.rejects(f.backend.start(ref, input), /正在关闭/);
});

test('DSH stop before dispatch persists cancellation and cannot create or wake an agent', async t => {
  const f = await fixture(t), input = f.input(), ref = await f.backend.prepare(input);
  await f.backend.stop(ref);
  assert.equal((await f.backend.query(ref)).state, 'cancelled');
  assert.equal((await f.backend.start(ref, input)).state, 'cancelled');
  assert.equal((await f.connect().start(ref, input)).state, 'cancelled');
  assert.equal(f.creations, 0); assert.equal(f.dispatches, 0);
});

test('DSH stop without its own live handle stays unconfirmed until the original turn ends', async t => {
  const f = await fixture(t), input = f.input(), ref = await f.backend.prepare(input); await f.backend.start(ref, input);
  const observer = f.connect(); await observer.stop(ref);
  const pending = await observer.query(ref);
  assert.equal(pending.state, 'running'); assert.equal(pending.termination?.confirmed, false); assert.ok(pending.termination?.requestedAt);
  await f.backend.stop(ref);
  const stopped = await observer.query(ref);
  assert.equal(stopped.state, 'cancelled'); assert.equal(stopped.termination?.confirmed, true);
  assert.equal(stopped.usageMeasurement?.completeness, 'unknown'); assert.equal(stopped.usageMeasurement?.inputTokens, null);
});

test('DSH assistant messages without usage do not report zero token consumption', async t => {
  const f = await fixture(t), input = f.input(), ref = await f.backend.prepare(input); await f.backend.start(ref, input);
  f.finish(ref.sessionId);
  const assistant = f.logs.get(ref.sessionId)!.events.find(event => event.type === 'assistant/message'); delete assistant.data.usage;
  const result = await f.backend.readResult(ref);
  assert.equal(result.state, 'completed'); assert.equal(result.usage, undefined);
  assert.equal(result.usageMeasurement?.completeness, 'unknown'); assert.equal(result.usageMeasurement?.inputTokens, null); assert.equal(result.usageMeasurement?.outputTokens, null);
});
