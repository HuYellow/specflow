import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, basename } from 'node:path';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { MakaBackend } from '../packages/maka-adapter/index.ts';
import type { FrozenInput } from '../packages/execution-contract/index.ts';
import { execute } from '../packages/verification-runner/index.ts';
import { MAKA_RELEASE_AVAILABLE } from '../packages/maka-adapter/release-policy.ts';
const packageRoot = resolve('.tools/maka/node_modules/maka-agent');
test('真实 Maka Host 的连接、连接目录、派发与结果读取（本地协议夹具，无云端 API）', { skip: !MAKA_RELEASE_AVAILABLE ? '没有符合正式发布策略的 Maka 运行时；未使用 dev 代替' : !existsSync(packageRoot), timeout: 60000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'specflow-host-test-'));
  const workspace = join(root, 'workspace'); await mkdir(workspace);
  await writeFile(join(workspace, 'README.md'), '# Local Maka contract fixture\n');
  await execute('git', ['init'], workspace); await execute('git', ['add', '--all'], workspace);
  await execute('git', ['-c', 'user.name=SpecFlow', '-c', 'user.email=specflow@localhost', 'commit', '-m', 'Initialize fixture'], workspace);
  let requests = 0;
  let readOnlyCalls = 0, writeCalls = 0, permissionCalls = 0;
  const fixtureOutput = JSON.stringify({ summary: '本地协议夹具完成', artifacts: [{ logicalId: 'spec', type: 'spec', content: '# 本地契约规格\n\n确认 Host 请求、会话身份和结果读取。' }], findings: [] });
  const server = createServer(async (request, response) => {
    let text = ''; for await (const chunk of request) text += chunk;
    const body = JSON.parse(text || '{}'); requests++;
    if (request.url?.endsWith('/models')) { response.setHeader('content-type', 'application/json'); response.end(JSON.stringify({ data: [{ id: 'specflow-fixture-model' }] })); return; }
    const history = JSON.stringify(body.messages || []);
    const isReadOnly = history.includes('READONLY_TOOL_PROBE');
    const isWrite = history.includes('WRITE_TOOL_PROBE');
    const isPermission = history.includes('PERMISSION_TOOL_PROBE');
    const probeStep = isReadOnly ? ++readOnlyCalls : isWrite ? ++writeCalls : isPermission ? ++permissionCalls : 0;
    const toolProbe = probeStep === 1 || probeStep === 2;
    if (body.stream) {
      response.writeHead(200, { 'content-type': 'text/event-stream' });
      const frame = (delta: unknown, finish_reason: string | null = null) => `data: ${JSON.stringify({ id: 'fixture-response', object: 'chat.completion.chunk', created: 1, model: body.model, choices: [{ index: 0, delta, finish_reason }] })}\n\n`;
      if (toolProbe) {
        const toolName = isPermission ? 'SpecFlowQuestion' : 'SpecFlowWrite';
        response.write(frame({ role: 'assistant', tool_calls: [{ index: 0, id: `fixture-tool-${probeStep}`, type: 'function', function: { name: probeStep === 1 ? 'tool_search' : toolName, arguments: JSON.stringify(probeStep === 1 ? { query: toolName } : isPermission ? { question: 'Confirm isolated protocol fixture', options: ['确认', '取消'] } : { path: 'README.md', expectedHash: createHash('sha256').update('# Local Maka contract fixture\n').digest('hex'), content: isReadOnly ? 'Readonly mutation must be denied' : 'Approved local fixture mutation' }) } }] }));
        response.write(frame({}, 'tool_calls'));
      } else { response.write(frame({ role: 'assistant', content: fixtureOutput })); response.write(frame({}, 'stop')); }
      response.end('data: [DONE]\n\n');
    } else { response.setHeader('content-type', 'application/json'); response.end(JSON.stringify({ id: 'fixture-response', object: 'chat.completion', model: body.model, choices: [{ index: 0, message: { role: 'assistant', content: fixtureOutput }, finish_reason: 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 10 } })); }
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const port = (server.address() as { port: number }).port;
  const backend = new MakaBackend(packageRoot, join(root, 'host'), workspace);
  try {
    console.log('P0: Host 连接');
    const capability = await backend.inspect(); assert.equal(capability.available, true, capability.reason);
    console.log('P0: 模型目录查询');
    assert.equal((await backend.listTargets()).length, 0);
    console.log('P0: 配置本地协议连接');
    await backend.configureConnection({ slug: 'local-fixture', name: 'Local protocol fixture', providerType: 'custom', baseUrl: `http://127.0.0.1:${port}/v1`, protocol: 'openai-chat', models: ['specflow-fixture-model'], apiKey: 'local-contract-fixture' });
    console.log('P0: 查询显式模型目标');
    const target = (await backend.listTargets())[0]; assert.equal(target.connectionSlug, 'local-fixture');
    const input: FrozenInput = { attemptId: 'specflow-host-contract', workspace, target, readOnly: true, prompt: '返回简单契约规格。', maxSteps: 8, inputHash: 'fixture', node: { id: 'specify', name: 'specify', type: 'agent', role: 'analyst', prompt: '', inputs: [], outputs: ['spec'] }, artifacts: [] };
    console.log('P0: 创建阶段会话');
    const ref = await backend.prepare(input);
    console.log('P0: 启动 Turn');
    const started = await backend.start(ref, input);
    let final = started;
    for (let probe = 0; probe < 15 && ['running', 'waiting_interaction'].includes(final.state); probe++) {
      await new Promise(done => setTimeout(done, 500)); final = await backend.query(started.ref);
    }
    assert.equal(final.state, 'completed', final.error);
    const result = await backend.readResult(final.ref); assert.ok(result.output?.includes('本地契约规格'), JSON.stringify(result));
    assert.ok(requests > 0); assert.ok(final.terminalEventId);
    console.log('P0: 只读策略拒绝模型写入');
    const original = await readFile(join(workspace, 'README.md'), 'utf8');
    const readOnlyInput = { ...input, attemptId: 'readonly-host-contract', prompt: 'READONLY_TOOL_PROBE' };
    const readonlyRef = await backend.prepare(readOnlyInput); let readonly = await backend.start(readonlyRef, readOnlyInput);
    for (let probe = 0; probe < 30 && ['running', 'waiting_interaction'].includes(readonly.state); probe++) { await new Promise(done => setTimeout(done, 250)); readonly = await backend.query(readonly.ref); }
    assert.ok(['completed', 'failed'].includes(readonly.state), JSON.stringify(readonly));
    assert.ok(readOnlyCalls >= 1); assert.equal(await readFile(join(workspace, 'README.md'), 'utf8'), original);
    console.log('P0: 正常阶段的真实文件工具');
    const writeInput = { ...input, attemptId: 'write-host-contract', prompt: 'WRITE_TOOL_PROBE', readOnly: false };
    const writeRef = await backend.prepare(writeInput); let written = await backend.start(writeRef, writeInput);
    for (let probe = 0; probe < 30 && ['running', 'waiting_interaction'].includes(written.state); probe++) { await new Promise(done => setTimeout(done, 250)); written = await backend.query(written.ref); }
    assert.equal(written.state, 'completed', JSON.stringify(written));
    const diagnosticSubscription = await (await backend.connect()).openSessionSubscription({ sessionId: written.ref.sessionId, transcript: { kind: 'tail', maxBytes: 16384 } });
    const diagnosticMessages = await diagnosticSubscription.loadTranscript((value: unknown) => value);
    assert.ok(diagnosticMessages.some((m: any) => m.type === 'tool_result' && !m.isError && m.content?.value?.path === 'README.md'));
    await diagnosticSubscription.close();
    assert.equal(await readFile(join(workspace, 'README.md'), 'utf8'), 'Approved local fixture mutation');
    console.log('P0: 用户授权经正式通道放行本地工具');
    const permissionInput = { ...input, attemptId: 'permission-host-contract', prompt: 'PERMISSION_TOOL_PROBE', readOnly: false };
    const permissionRef = await backend.prepare(permissionInput); let permission = await backend.start(permissionRef, permissionInput); let approvals = 0;
    for (let probe = 0; probe < 40 && ['running', 'waiting_interaction'].includes(permission.state); probe++) {
      await new Promise(done => setTimeout(done, 250)); permission = await backend.query(permission.ref);
      for (const interaction of permission.interactions || []) { const request = interaction.request as any;
        assert.ok(['permission', 'sandbox_boundary', 'question'].includes(request.kind), JSON.stringify(request));
        await backend.answer(permission.ref, interaction.id, request.kind === 'question' ? { kind: 'question', answers: ['确认'] } : { kind: request.kind, decision: 'allow', ...(request.kind === 'permission' ? { rememberForTurn: false } : {}) }); approvals++;
      }
    }
    assert.equal(permission.state, 'completed', JSON.stringify(permission)); assert.ok(approvals > 0);
    console.log('P0: 正式版的兼容协议连接');
    for (const [slug, protocol] of [['local-responses', 'openai-responses'], ['local-anthropic', 'anthropic-messages']] as const) {
      const created = await backend.configureConnection({ slug, name: slug, providerType: 'custom', baseUrl: `http://127.0.0.1:${port}/v1`, protocol, models: ['specflow-fixture-model'] });
      assert.ok((await backend.listTargets()).some(t => t.connectionId === created.connectionId && t.connectionSlug === slug));
    }
  } catch (error) { console.log('P0 接入诊断:', (error as Error).message); throw error; }
  finally {
    await Promise.race([backend.close(), new Promise<void>(done => setTimeout(done, 2000))]); console.log('P0: 连接关闭'); server.closeAllConnections(); await new Promise<void>(done => server.close(() => done())); console.log('P0: HTTP 夹具关闭');
    // Let the detached ephemeral host release its root lease before removing the named fixture.
    if (basename(root).startsWith('specflow-host-test-')) await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 }); console.log('P0: 临时目录已清理');
  }
});
