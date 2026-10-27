import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OpenCodeBackend, normalizeOpenCodeUrl } from '../packages/opencode-adapter/index.ts';
import type { ExecutionRef } from '../packages/domain/index.ts';
import type { FrozenInput } from '../packages/execution-contract/index.ts';

async function fixture(t: TestContext) {
  const root = await mkdtemp(join(tmpdir(), 'specflow-opencode-contract-'));
  const workspaceRoot = join(root, 'workspaces'), workspace = join(workspaceRoot, 'attempt'); await mkdir(workspace, { recursive: true });
  const calls: { path: string; directory: string | null; method: string; body: any; authorization?: string }[] = [];
  const sessions = new Map<string, any>(), messages = new Map<string, any[]>(), statuses: Record<string, { type: string }> = {};
  let dataRoot = join(root, 'opencode-data'), sequence = 0, dispatches = 0, loseDispatchReceipt = false, abortWritesTerminal = true, ignorePolicy = false;
  let fault: string | undefined, redirect: string | undefined;
  const permissions: any[] = [], questions: any[] = [], replies: any[] = [];
  const json = (response: ServerResponse, value: unknown, status = 200) => { response.writeHead(status, { 'content-type': 'application/json' }); response.end(JSON.stringify(value)); };
  const finish = (ref: ExecutionRef, text: string, info: any = {}) => {
    delete statuses[ref.sessionId];
    messages.get(ref.sessionId)!.push({ info: { id: `msg_assistant${++sequence}`, role: 'assistant', parentID: ref.turnId, sessionID: ref.sessionId, time: { completed: Date.now() }, finish: 'stop', tokens: { input: 30, output: 20 }, cost: 0.02, ...info }, parts: [{ type: 'text', text: text.slice(0, 20000) }, { type: 'text', text: text.slice(20000) }] });
  };
  const handler = async (request: IncomingMessage, response: ServerResponse) => {
    const url = new URL(request.url!, 'http://localhost'); let raw = ''; for await (const chunk of request) raw += chunk;
    const body = raw ? JSON.parse(raw) : undefined;
    calls.push({ path: url.pathname, directory: url.searchParams.get('directory'), method: request.method!, body, authorization: request.headers.authorization });
    if (url.pathname === fault) { json(response, { error: 'fixture unavailable' }, 503); return; }
    if (url.pathname === redirect) { response.writeHead(302, { location: '/global/health' }); response.end(); return; }
    const directory = url.searchParams.get('directory');
    if (url.pathname === '/global/health') { json(response, { healthy: true, version: '1.19.3' }); return; }
    if (url.pathname === '/path') { json(response, { state: dataRoot, config: join(root, 'opencode-config'), directory }); return; }
    if (url.pathname === '/provider') { json(response, { all: [{ id: 'local', name: 'Local model fixture', models: { 'fixture-model': { id: 'fixture-model', status: 'active' }, old: { status: 'deprecated' } } }, { id: 'offline', models: { hidden: {} } }], connected: ['local'], default: { local: 'fixture-model' } }); return; }
    if (url.pathname === '/session' && request.method === 'POST') {
      const session = { id: `ses_${++sequence}`, directory, permission: ignorePolicy ? [] : body.permission, title: body.title };
      sessions.set(session.id, session); messages.set(session.id, []); json(response, session); return;
    }
    if (url.pathname === '/session/status') { json(response, statuses); return; }
    if (url.pathname === '/permission') { json(response, permissions); return; }
    if (url.pathname === '/question') { json(response, questions); return; }
    const reply = url.pathname.match(/^\/(permission|question)\/([^/]+)\/reply$/);
    if (reply) { replies.push({ kind: reply[1], id: reply[2], body }); const list = reply[1] === 'permission' ? permissions : questions; const index = list.findIndex(p => p.id === reply[2]); if (index >= 0) list.splice(index, 1); json(response, true); return; }
    const path = url.pathname.match(/^\/session\/([^/]+)(?:\/(.+))?$/);
    if (path) {
      const session = sessions.get(path[1]); if (!session) { json(response, { error: 'not found' }, 404); return; }
      if (!path[2]) { json(response, session); return; }
      if (path[2] === 'message') { json(response, messages.get(path[1])); return; }
      if (path[2] === 'prompt_async') {
        dispatches++; statuses[path[1]] = { type: 'busy' }; messages.get(path[1])!.push({ info: { id: body.messageID, role: 'user', sessionID: path[1] }, parts: body.parts });
        if (loseDispatchReceipt) { request.socket.destroy(); return; }
        response.writeHead(204); response.end(); return;
      }
      if (path[2] === 'abort') {
        delete statuses[path[1]];
        if (abortWritesTerminal) {
          const user = messages.get(path[1])!.findLast(m => m.info.role === 'user');
          if (user) finish({ backend: 'opencode', rootId: '', sessionId: path[1], turnId: user.info.id }, '', { error: { name: 'MessageAbortedError', data: { message: 'aborted' } } });
        }
        json(response, true); return;
      }
    }
    json(response, { error: `unhandled ${url.pathname}` }, 404);
  };
  const server = createServer((request, response) => { void handler(request, response).catch(error => { response.writeHead(500); response.end(String(error)); }); });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const options = { baseUrl, stateDir: join(root, 'journals'), workspaceRoot, pollIntervalMs: 100000, username: 'local-user', password: 'secret-that-must-not-be-persisted' };
  const backends: OpenCodeBackend[] = [];
  const connect = () => { const backend = new OpenCodeBackend(options); backends.push(backend); return backend; };
  const backend = connect(), target = (await backend.listTargets())[0];
  const input = (patch: Partial<FrozenInput> = {}): FrozenInput => ({ attemptId: 'fixture-attempt', workspace, target, prompt: 'Return a complete StageOutput JSON artifact.', maxSteps: 8, inputHash: 'frozen-input', readOnly: false, artifacts: [], node: { id: 'specify', name: 'Specify', type: 'agent', prompt: '', inputs: [], outputs: ['spec'] }, ...patch });
  t.after(async () => { for (const b of backends) await b.close(); server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())); await rm(root, { recursive: true, force: true }); });
  return { root, workspaceRoot, workspace, options, backend, connect, calls, sessions, messages, statuses, permissions, questions, replies, input, finish, get dispatches() { return dispatches; }, set loseDispatchReceipt(value: boolean) { loseDispatchReceipt = value; }, set abortWritesTerminal(value: boolean) { abortWritesTerminal = value; }, set ignorePolicy(value: boolean) { ignorePolicy = value; }, set fault(value: string | undefined) { fault = value; }, set redirect(value: string | undefined) { redirect = value; }, set dataRoot(value: string) { dataRoot = value; } };
}

test('OpenCode URL 仅接受 loopback 根地址，不含凭据或重定向入口', () => {
  assert.equal(normalizeOpenCodeUrl('http://localhost:4096/'), 'http://localhost:4096');
  assert.equal(normalizeOpenCodeUrl('https://[::1]:4096'), 'https://[::1]:4096');
  for (const address of ['http://192.168.1.1:4096', 'https://example.com', 'file:///etc/passwd', 'http://user:secret@localhost', 'http://localhost:4096/foo', 'http://localhost:4096?token=secret', 'http://localhost:4096#fragment']) assert.throws(() => normalizeOpenCodeUrl(address), /本机|HTTP|根地址/);
});

test('OpenCode 检查能力、目录模型和 Basic Auth；秘密不写入 journal', async t => {
  const f = await fixture(t), capabilities = await f.backend.inspect(), targets = await f.backend.listTargets();
  assert.equal(capabilities.available, true); assert.equal(capabilities.canResume, false); assert.equal(capabilities.readOnlyReview, true); assert.equal(capabilities.stepLimit, 'observed'); assert.match(capabilities.reason!, /非原生硬上限/);
  assert.equal(capabilities.details?.stepLimit.enforcement, 'observed'); assert.equal(capabilities.details?.resume.mode, 'reconcile-only'); assert.equal(capabilities.details?.resume.preservesStepBudget, false);
  assert.match(capabilities.reason!, /可信的用户级/); assert.match(capabilities.reason!, /同名工具覆盖/);
  assert.equal(targets.length, 1); assert.equal(targets[0].connectionId, 'local'); assert.equal(targets[0].model, 'fixture-model');
  assert.ok(f.calls.every(c => c.authorization === `Basic ${Buffer.from('local-user:secret-that-must-not-be-persisted').toString('base64')}`));
  const ref = await f.backend.prepare(f.input()); assert.equal(ref.rootId, capabilities.rootId);
  for (const file of await readdir(f.options.stateDir)) assert.ok(!(await readFile(join(f.options.stateDir, file), 'utf8')).includes(f.options.password));
});

test('OpenCode 每个 attempt 使用独立目录会话；准备幂等且冻结输入不可替换', async t => {
  const f = await fixture(t), input = f.input();
  const [ref, again] = await Promise.all([f.backend.prepare(input), f.backend.prepare(input)]); assert.deepEqual(ref, again);
  const second = await f.backend.prepare(f.input({ attemptId: 'second' })); assert.notEqual(ref.sessionId, second.sessionId); assert.notEqual(ref.turnId, second.turnId);
  assert.equal(f.calls.filter(c => c.path === '/session').length, 2);
  // Windows runners may expose Temp through an 8.3 alias; the adapter binds its canonical directory.
  const canonicalWorkspace = await realpath(f.workspace);
  assert.ok(f.calls.filter(c => c.path === '/session').every(c => c.directory === canonicalWorkspace));
  await assert.rejects(f.backend.prepare(f.input({ prompt: 'changed' })), /冻结输入/);
  await assert.rejects(f.backend.start(ref, f.input({ prompt: 'changed after prepare' })), /冻结输入/);
  await assert.rejects(f.backend.prepare(f.input({ attemptId: 'outside', workspace: f.root })), /工作区目录/);
  await assert.rejects(f.backend.prepare(f.input({ attemptId: 'wrong-root', target: { ...input.target, rootId: 'other' } })), /其他 OpenCode/);
});

test('OpenCode start 立即异步派发，完整读取绑定本条消息的终态产物并跨进程读取', async t => {
  const f = await fixture(t), input = f.input(), ref = await f.backend.prepare(input);
  const started = await f.backend.start(ref, input); assert.equal(started.state, 'running'); assert.equal(f.dispatches, 1);
  assert.equal(ref.turnId.split('_')[1].length, 26);
  const dispatch = f.calls.find(c => c.path.endsWith('/prompt_async'))!;
  assert.equal(dispatch.body.messageID, ref.turnId); assert.deepEqual(dispatch.body.model, { providerID: 'local', modelID: 'fixture-model' }); assert.equal(dispatch.directory, await realpath(f.workspace));
  assert.equal((await f.backend.query(ref)).state, 'running');
  const output = `{"summary":"${'完整产物'.repeat(30000)}","artifacts":[]}`; f.finish(ref, output);
  const result = await f.backend.readResult(ref); assert.equal(result.state, 'completed'); assert.ok(result.output === output, '完整多段产物应保持字节内容，不能截断或插入换行'); assert.ok(result.terminalEventId); assert.deepEqual(result.usage, { inputTokens: 30, outputTokens: 20, costUsd: 0.02 });
  assert.equal(result.termination?.reason, 'natural_completion'); assert.equal(result.termination?.confirmed, true);
  assert.equal(result.usageMeasurement?.completeness, 'complete'); assert.equal(result.usageMeasurement?.scope, 'turn'); assert.equal(result.usageMeasurement?.mode, 'cumulative'); assert.equal(result.usageMeasurement?.costUsd, 0.02);
  await f.backend.close(); const restored = f.connect(); assert.deepEqual(await restored.readResult(ref), result);
  assert.equal((await restored.start(ref, input)).state, 'completed'); assert.equal(f.dispatches, 1);
});

test('OpenCode 不会把其他消息、idle、网络故障误认为完成或隐式重派', async t => {
  const f = await fixture(t), input = f.input(), ref = await f.backend.prepare(input); await f.backend.start(ref, input);
  f.finish(ref, 'unrelated', { parentID: 'msg_someone_else' });
  // Remove the short dispatch grace so an idle session without terminal evidence is unknown.
  const file = join(f.options.stateDir, `${ref.turnId}.json`); const journal = JSON.parse(await readFile(file, 'utf8')); journal.dispatchedAt = 1;
  const { writeFile } = await import('node:fs/promises'); await writeFile(file, JSON.stringify(journal));
  assert.equal((await f.backend.query(ref)).state, 'unknown');
  f.fault = '/session/status'; const unreachable = await f.backend.query(ref); assert.equal(unreachable.state, 'unknown'); assert.match(unreachable.error!, /HTTP 503/);
  await f.backend.start(ref, input); assert.equal(f.dispatches, 1);
});

test('OpenCode 派发 receipt 丢失后重启可查询相同 message，但绝不自动重新发送', async t => {
  const f = await fixture(t), input = f.input(), ref = await f.backend.prepare(input); f.loseDispatchReceipt = true;
  const start = await f.backend.start(ref, input); assert.equal(start.state, 'unknown'); assert.match(start.error!, /不会自动重新发送/); assert.equal(f.dispatches, 1);
  await f.backend.close(); const restored = f.connect(); assert.equal((await restored.query(ref)).state, 'running'); assert.equal((await restored.start(ref, input)).state, 'running'); assert.equal(f.dispatches, 1);
  f.finish(ref, '{"summary":"reconciled","artifacts":[]}'); assert.equal((await restored.readResult(ref)).state, 'completed'); assert.equal(f.dispatches, 1);
});

test('OpenCode 权限、问题经现有交互格式映射，拒绝跨会话和永久授权', async t => {
  const f = await fixture(t), input = f.input(), ref = await f.backend.prepare(input); await f.backend.start(ref, input);
  f.permissions.push({ id: 'per_tool', sessionID: ref.sessionId, permission: 'bash', patterns: ['git status'], metadata: { command: 'git status' } }, { id: 'per_other', sessionID: 'ses_other', permission: 'bash', patterns: ['rm'], metadata: {} });
  f.questions.push({ id: 'que_fixture', sessionID: ref.sessionId, questions: [{ question: '选择验收范围', options: [{ label: '本地', description: '只验收本地' }], custom: false }] });
  const snapshot = await f.backend.query(ref); assert.equal(snapshot.state, 'waiting_interaction'); assert.equal(snapshot.interactions!.length, 2); assert.deepEqual((snapshot.interactions![0].request as any).prompt.args, { command: 'git status' });
  await assert.rejects(f.backend.answer(ref, 'permission:per_other', { kind: 'permission', decision: 'allow' }), /不属于当前运行/);
  await assert.rejects(f.backend.answer(ref, 'permission:per_tool', { kind: 'permission', decision: 'allow', rememberForTurn: true }), /本次允许/);
  await f.backend.answer(ref, 'permission:per_tool', { kind: 'permission', decision: 'allow', rememberForTurn: false }); assert.deepEqual(f.replies[0].body, { reply: 'once' });
  await assert.rejects(f.backend.answer(ref, 'question:que_fixture', { kind: 'question', answers: ['任意'] }), /给定选项/);
  await f.backend.answer(ref, 'question:que_fixture', { kind: 'question', answers: ['本地'] }); assert.deepEqual(f.replies[1].body, { answers: [['本地']] });
  assert.equal((await f.backend.query(ref)).state, 'running');
});

test('OpenCode 只读权限由服务端 deny 白名单实施，不允许 bash/task/custom 工具', async t => {
  const f = await fixture(t), input = f.input({ readOnly: true }), ref = await f.backend.prepare(input); await f.backend.start(ref, input);
  const rules = f.sessions.get(ref.sessionId).permission;
  const action = (name: string) => rules.findLast((r: any) => r.permission === '*' || r.permission === name).action;
  for (const tool of ['bash', 'edit', 'write', 'task', 'custom_tool', 'mcp__write', 'external_directory']) assert.equal(action(tool), 'deny');
  for (const tool of ['read', 'glob', 'grep', 'list', 'question']) assert.equal(action(tool), 'allow');
  f.permissions.push({ id: 'per_unexpected', sessionID: ref.sessionId, permission: 'edit', patterns: ['README.md'], metadata: {} });
  const snapshot = await f.backend.query(ref); assert.equal(snapshot.state, 'unknown'); assert.match(snapshot.error!, /只读/); assert.deepEqual(f.replies[0].body, { reply: 'reject' });
});

test('OpenCode 已完成工具错误可判定失败，明确拒绝权限结束的原会话判取消', async t => {
  const f = await fixture(t);
  for (const denied of [false, true]) {
    const input = f.input({ attemptId: `tool-error-${denied}`, readOnly: !denied }), ref = await f.backend.prepare(input); await f.backend.start(ref, input);
    if (denied) {
      f.permissions.push({ id: 'per_denied', sessionID: ref.sessionId, permission: 'bash', patterns: ['echo'], metadata: {} });
      await f.backend.answer(ref, 'permission:per_denied', { kind: 'permission', decision: 'deny' });
    }
    f.finish(ref, '', { finish: 'tool-calls' });
    f.messages.get(ref.sessionId)!.at(-1)!.parts = [{ type: 'tool', state: { status: 'error', error: denied ? 'The user rejected permission to use this specific tool call.' : 'Tool write is not available.' } }];
    const terminal = await f.backend.query(ref); assert.equal(terminal.state, denied ? 'cancelled' : 'failed'); assert.ok(terminal.terminalEventId); assert.match(terminal.error!, denied ? /用户拒绝/ : /Tool write is not available/);
  }
});

test('OpenCode 服务未确认或运行中修改权限时，拒绝派发和接管', async t => {
  const f = await fixture(t); f.ignorePolicy = true;
  await assert.rejects(f.backend.prepare(f.input()), /未确认/); assert.equal(f.dispatches, 0);
  await assert.rejects(f.backend.prepare(f.input()), /创建结果未确认/);
  f.ignorePolicy = false; const input = f.input({ attemptId: 'valid' }), ref = await f.backend.prepare(input); await f.backend.start(ref, input);
  f.sessions.get(ref.sessionId).permission = [{ permission: '*', action: 'allow', pattern: '*' }];
  const snapshot = await f.backend.query(ref); assert.equal(snapshot.state, 'unknown'); assert.match(snapshot.error!, /权限规则已变化/);
});

test('OpenCode 在首次工作区 HTTP 之前拒绝本地工具、插件和配置，不能先激活再检查', async t => {
  const f = await fixture(t);
  const cases = ['.opencode/tools/read.ts', '.opencode/tool/read.js', '.opencode/plugins/bootstrap.ts', '.opencode/plugin/bootstrap.js', '.opencode/opencode.json', 'opencode.json', 'opencode.jsonc'];
  for (const [index, file] of cases.entries()) {
    const target = join(f.workspace, file); const { dirname } = await import('node:path'); await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.endsWith('.json') || file.endsWith('.jsonc') ? '{"plugin":["./untrusted-plugin.js"]}' : 'throw new Error("must never load");');
    const before = f.calls.length;
    await assert.rejects(f.backend.prepare(f.input({ attemptId: `untrusted-${index}`, readOnly: true })), error => (error as { code: string }).code === 'OPENCODE_UNTRUSTED_CONFIG');
    assert.equal(f.calls.length, before, `检测 ${file} 之前不得发出 /path 等任何工作区 HTTP`); assert.equal(f.dispatches, 0);
    await rm(join(f.workspace, '.opencode'), { recursive: true, force: true }); if (!file.startsWith('.opencode/')) await rm(target);
  }
  // JSONC parsing and provider modules can themselves introduce executable inputs;
  // this release deliberately blocks all local config, even ordinary-looking JSON.
  await writeFile(join(f.workspace, 'opencode.json'), '{"model":"local/fixture-model"}');
  const before = f.calls.length; await assert.rejects(f.backend.prepare(f.input()), /本地配置\/扩展/); assert.equal(f.calls.length, before);
});

test('OpenCode 拒绝项目祖先扩展及 prepare 后新注入配置，检查模型目录也不会激活本地扩展', async t => {
  const f = await fixture(t), input = f.input(), ref = await f.backend.prepare(input);
  await writeFile(join(f.workspace, '.git'), 'invalid repository marker must not hide inherited extensions');
  const extension = join(f.workspaceRoot, '.opencode'); await mkdir(join(extension, 'tools'), { recursive: true }); await writeFile(join(extension, 'tools', 'read.js'), 'export default {};');
  const before = f.calls.length;
  await assert.rejects(f.backend.start(ref, input), error => (error as { code: string }).code === 'OPENCODE_UNTRUSTED_CONFIG');
  await assert.rejects(f.backend.listTargets(), error => (error as { code: string }).code === 'OPENCODE_UNTRUSTED_CONFIG');
  assert.equal(f.calls.length, before); assert.equal(f.dispatches, 0);
  const snapshot = await f.backend.query(ref); assert.equal(snapshot.state, 'unknown'); assert.match(snapshot.error!, /本地配置\/扩展/); assert.equal(f.calls.length, before);
});

test('OpenCode stop 要求绑定消息的终止凭据，单独 abort receipt 加 idle 不冒充取消成功', async t => {
  const f = await fixture(t), input = f.input(), ref = await f.backend.prepare(input); await f.backend.start(ref, input); await f.backend.stop(ref);
  assert.equal((await f.backend.query(ref)).state, 'cancelled');
  const secondInput = f.input({ attemptId: 'no-terminal' }), second = await f.backend.prepare(secondInput); await f.backend.start(second, secondInput); f.abortWritesTerminal = false; await f.backend.stop(second);
  const result = await f.backend.query(second); assert.notEqual(result.state, 'cancelled'); assert.notEqual(result.state, 'completed');
  assert.equal(result.termination?.confirmed, false); assert.ok(result.termination?.requestedAt);
  const preparedInput = f.input({ attemptId: 'cancel-before-start' }), prepared = await f.backend.prepare(preparedInput); await f.backend.stop(prepared);
  const dispatches = f.dispatches; assert.equal((await f.backend.start(prepared, preparedInput)).state, 'cancelled'); assert.equal(f.dispatches, dispatches);
});

test('OpenCode 观测步数超限停止原会话且标失败，工具授权预算不可超额', async t => {
  const f = await fixture(t), input = f.input({ maxSteps: 1 }), ref = await f.backend.prepare(input); await f.backend.start(ref, input);
  f.messages.get(ref.sessionId)!.push(...[1, 2].map(n => ({ info: { id: `msg_step${n}`, role: 'assistant', parentID: ref.turnId, sessionID: ref.sessionId }, parts: [{ type: 'step-start' }] })));
  await f.backend.query(ref); const stopped = await f.backend.query(ref); assert.equal(stopped.state, 'failed'); assert.match(stopped.error!, /步数超过/); assert.ok(f.calls.some(c => c.path.endsWith('/abort')));
  assert.equal(stopped.termination?.reason, 'step_limit'); assert.equal(stopped.termination?.confirmed, true);
  const nextInput = f.input({ attemptId: 'approval-budget', maxSteps: 1 }), next = await f.backend.prepare(nextInput); await f.backend.start(next, nextInput);
  const permission = (id: string) => ({ id, sessionID: next.sessionId, permission: 'bash', patterns: ['echo'], metadata: {} });
  f.permissions.push(permission('per_one')); await f.backend.answer(next, 'permission:per_one', { kind: 'permission', decision: 'allow' });
  f.permissions.push(permission('per_two')); await assert.rejects(f.backend.answer(next, 'permission:per_two', { kind: 'permission', decision: 'allow' }), /预算已用完/);
});

test('OpenCode 数据目录身份变更、篡改引用、服务替换均拒绝原运行；不假称可恢复', async t => {
  const f = await fixture(t), input = f.input(), ref = await f.backend.prepare(input); await f.backend.start(ref, input);
  assert.equal((await f.backend.planResume(ref)).possible, false); await assert.rejects(f.backend.resume(ref, {}), /安全恢复协议/);
  await assert.rejects(f.backend.query({ ...ref, rootId: 'other' }), /配置来源已变化/);
  await assert.rejects(f.backend.query({ ...ref, sessionId: 'ses_other' }), /引用与持久化记录不匹配/);
  f.dataRoot = join(f.root, 'replacement-data'); const changed = await f.connect().query(ref); assert.equal(changed.state, 'unknown'); assert.match(changed.error!, /身份已变化/);
  const changedConnection = new OpenCodeBackend({ ...f.options, baseUrl: 'http://127.0.0.1:41999' }); await assert.rejects(changedConnection.query(ref), /配置来源已变化/); await changedConnection.close();
});

test('OpenCode 不跟随本机重定向，服务端错误不泄露凭据', async t => {
  const f = await fixture(t); f.redirect = '/global/health'; const result = await f.backend.inspect();
  assert.equal(result.available, false); assert.match(result.reason!, /重定向/); assert.ok(!result.reason!.includes(f.options.password));
});

test('OpenCode missing or malformed usage remains unknown and never becomes a zero bill', async t => {
  const f = await fixture(t);
  for (const [index, tokens] of [undefined, { input: -1, output: 20 }, { input: 1.5, output: 20 }, { output: 20 }].entries()) {
    const input = f.input({ attemptId: `missing-usage-${index}` }), ref = await f.backend.prepare(input); await f.backend.start(ref, input);
    f.finish(ref, '{"summary":"done","artifacts":[]}', { tokens, cost: undefined });
    const result = await f.backend.readResult(ref);
    assert.equal(result.usage, undefined);
    assert.equal(result.usageMeasurement?.inputTokens, null);
    assert.equal(result.usageMeasurement?.costUsd, null);
    assert.equal(result.usageMeasurement?.completeness, tokens ? 'partial' : 'unknown');
    assert.deepEqual((await f.connect().readResult(ref)).usageMeasurement, result.usageMeasurement);
  }
});
