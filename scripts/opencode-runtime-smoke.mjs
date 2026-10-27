import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { OpenCodeBackend } from '../packages/opencode-adapter/index.ts';

// Run with: SPECFLOW_OPENCODE_CLI=/path/to/opencode node --import tsx scripts/opencode-runtime-smoke.mjs
// The executable is supplied by the operator. This script never installs a runtime or uses a real model.
const executable = process.env.SPECFLOW_OPENCODE_CLI;
if (!executable) throw new Error('Set SPECFLOW_OPENCODE_CLI to an official OpenCode CLI executable.');
const root = await mkdtemp(join(tmpdir(), 'specflow-opencode-smoke-'));
const directories = Object.fromEntries(await Promise.all(['config', 'data', 'cache', 'state', 'workspace', 'journal'].map(async name => {
  const path = join(root, name); await mkdir(path); return [name, path];
})));
const requests = [];
const sockets = new Set();
const output = { summary: 'OpenCode runtime smoke passed', artifacts: [] };
let sequence = 0;
const provider = createServer(async (request, response) => {
  try {
    let raw = ''; for await (const chunk of request) raw += chunk;
    const body = JSON.parse(raw || '{}');
    requests.push(body);
    const prompt = body.messages?.findLast(message => message.role === 'user')?.content || '';
    const hasToolResult = body.messages?.some(message => message.role === 'tool');
    if (prompt.includes('SPECFLOW_SMOKE_CANCEL')) { response.writeHead(200, { 'content-type': 'text/event-stream' }); response.write(': waiting for abort\n\n'); return; }
    let tool;
    if (!hasToolResult && prompt.includes('SPECFLOW_SMOKE_PERMISSION')) tool = { name: 'bash', arguments: { command: 'echo specflow-local-smoke', description: 'Local smoke permission check' } };
    if (!hasToolResult && prompt.includes('SPECFLOW_SMOKE_ALLOW_WRITE')) tool = { name: 'write', arguments: { filePath: join(directories.workspace, 'allowed-write.txt'), content: 'Explicit local smoke approval.' } };
    if (!hasToolResult && prompt.includes('SPECFLOW_SMOKE_QUESTION')) tool = { name: 'question', arguments: { questions: [{ header: 'Smoke', question: 'Complete the local smoke?', options: [{ label: 'Continue', description: 'Finish the local test' }] }] } };
    if (!hasToolResult && prompt.includes('SPECFLOW_SMOKE_READONLY')) tool = { name: 'write', arguments: { filePath: join(directories.workspace, 'must-not-exist.txt'), content: 'A read-only review must reject this write.' } };
    const id = `smoke_${++sequence}`;
    const delta = tool ? { role: 'assistant', tool_calls: [{ index: 0, id, type: 'function', function: { name: tool.name, arguments: JSON.stringify(tool.arguments) } }] } : { role: 'assistant', content: JSON.stringify(output) };
    const frame = (delta, finish_reason, usage) => `data: ${JSON.stringify({ id, object: 'chat.completion.chunk', created: Math.floor(Date.now() / 1000), model: 'fake', choices: [{ index: 0, delta, finish_reason }], ...(usage ? { usage } : {}) })}\n\n`;
    response.writeHead(200, { 'content-type': 'text/event-stream' });
    response.end(frame(delta, null) + frame({}, tool ? 'tool_calls' : 'stop', { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }) + 'data: [DONE]\n\n');
  } catch (error) { response.writeHead(500); response.end(String(error)); }
});
provider.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
provider.listen(0, '127.0.0.1'); await once(provider, 'listening');
const configPath = join(directories.config, 'opencode.json');
await writeFile(configPath, JSON.stringify({
  '$schema': 'https://opencode.ai/config.json', autoupdate: false, share: 'disabled', lsp: false, formatter: false,
  enabled_providers: ['specflow-smoke'], model: 'specflow-smoke/fake',
  provider: { 'specflow-smoke': { npm: '@ai-sdk/openai-compatible', name: 'Local protocol smoke', options: { baseURL: `http://127.0.0.1:${provider.address().port}/v1`, apiKey: 'local-fake-key' }, models: { fake: { name: 'Local fake', tool_call: true, limit: { context: 32768, output: 8192 } } } } },
  permission: { '*': 'deny' },
}));
const env = {
  PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, WINDIR: process.env.WINDIR, COMSPEC: process.env.COMSPEC,
  TEMP: root, TMP: root, XDG_CONFIG_HOME: directories.config, XDG_DATA_HOME: directories.data, XDG_STATE_HOME: directories.state, XDG_CACHE_HOME: directories.cache,
  OPENCODE_CONFIG: configPath, OPENCODE_CONFIG_DIR: directories.config, OPENCODE_DISABLE_PROJECT_CONFIG: '1', OPENCODE_DISABLE_MODELS_FETCH: '1',
  OPENCODE_DISABLE_AUTOUPDATE: '1', OPENCODE_EXPERIMENTAL_DISABLE_FILEWATCHER: '1', OPENCODE_PURE: '1', OPENCODE_SERVER_PASSWORD: 'specflow-local-smoke',
};
const child = spawn(resolve(executable), ['serve', '--hostname', '127.0.0.1', '--port', '0'], { cwd: directories.workspace, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
let logs = '', baseUrl, launchError, latestRef;
child.on('error', error => { launchError = error; });
for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { logs = (logs + data).slice(-20000); baseUrl ||= logs.match(/opencode server listening on (http:\/\/127\.0\.0\.1:\d+)/)?.[1]; });
const backends = [];
async function until(action, predicate, message, timeout = 30000) {
  const deadline = Date.now() + timeout; let result;
  do { result = await action(); if (predicate(result)) return result; await delay(75); } while (Date.now() < deadline);
  throw new Error(`${message}: ${JSON.stringify(result)}`);
}
function backend() {
  const instance = new OpenCodeBackend({ baseUrl, password: 'specflow-local-smoke', stateDir: directories.journal, workspaceRoot: directories.workspace, pollIntervalMs: 75 });
  backends.push(instance); return instance;
}
try {
  await until(async () => { if (launchError) throw launchError; if (child.exitCode !== null) throw new Error(`OpenCode exited: ${logs}`); return baseUrl; }, Boolean, 'OpenCode server did not start');
  const first = backend();
  const capabilities = await first.inspect(); assert.equal(capabilities.available, true, capabilities.reason);
  const targets = await first.listTargets(); const target = targets.find(target => target.connectionId === 'specflow-smoke' && target.model === 'fake'); assert.ok(target, 'Local fake provider was not discoverable');
  const input = marker => ({ prompt: `Return a StageOutput JSON object. ${marker}`, workspace: directories.workspace, target, readOnly: marker === 'SPECFLOW_SMOKE_READONLY', attemptId: `smoke-${marker}-${Date.now()}`, maxSteps: 12, inputHash: `smoke-${marker}`, node: { id: 'smoke', name: 'Smoke', type: 'agent', prompt: '', inputs: [], outputs: [] }, artifacts: [] });
  const run = async marker => { const frozen = input(marker); const ref = await first.prepare(frozen); latestRef = ref; assert.deepEqual(await first.prepare(frozen), ref, 'Preparation must be idempotent'); assert.equal((await first.start(ref, frozen)).state, 'running'); return { frozen, ref }; };
  const terminal = ref => until(() => first.query(ref), snapshot => ['completed', 'cancelled', 'failed', 'unknown'].includes(snapshot.state), 'Execution did not terminate');
  const normal = await run('SPECFLOW_SMOKE_NORMAL');
  const completed = await terminal(normal.ref); assert.equal(completed.state, 'completed', JSON.stringify(completed)); assert.deepEqual(JSON.parse(completed.output), output);
  const measured = completed.usageMeasurement;
  assert.ok(measured, 'The terminal result must expose a canonical usage meter');
  assert.equal(measured.scope, 'turn'); assert.equal(measured.mode, 'cumulative');
  assert.equal(measured.eventId, completed.terminalEventId);
  assert.equal(measured.inputTokens, 10); assert.equal(measured.outputTokens, 20);
  assert.ok(measured.costUsd === null || Number.isFinite(measured.costUsd) && measured.costUsd >= 0, 'Cost is either reported or explicitly unknown');
  assert.equal(measured.completeness, measured.costUsd === null ? 'partial' : 'complete');
  const restored = backend(); assert.deepEqual(await restored.readResult(normal.ref), completed, 'A new adapter instance must recover the original terminal result'); assert.equal((await restored.planResume(normal.ref)).possible, false);
  const permission = await run('SPECFLOW_SMOKE_PERMISSION');
  const pending = await until(() => first.query(permission.ref), snapshot => snapshot.state === 'waiting_interaction' || snapshot.state === 'unknown', 'Tool permission did not appear'); assert.equal(pending.state, 'waiting_interaction', JSON.stringify(pending));
  assert.equal(pending.interactions[0].request.kind, 'permission'); await first.answer(permission.ref, pending.interactions[0].id, { kind: 'permission', decision: 'deny' }); const permissionResult = await terminal(permission.ref); assert.equal(permissionResult.state, 'cancelled', JSON.stringify(permissionResult));
  const allowWrite = await run('SPECFLOW_SMOKE_ALLOW_WRITE');
  const writePending = await until(() => first.query(allowWrite.ref), snapshot => snapshot.state === 'waiting_interaction' || snapshot.state === 'unknown', 'Write permission did not appear'); assert.equal(writePending.state, 'waiting_interaction', JSON.stringify(writePending));
  assert.equal(writePending.interactions[0].request.kind, 'permission'); await first.answer(allowWrite.ref, writePending.interactions[0].id, { kind: 'permission', decision: 'allow' });
  const writeResult = await terminal(allowWrite.ref); assert.equal(writeResult.state, 'completed', JSON.stringify(writeResult)); assert.equal(await readFile(join(directories.workspace, 'allowed-write.txt'), 'utf8'), 'Explicit local smoke approval.');
  const question = await run('SPECFLOW_SMOKE_QUESTION');
  const questionPending = await until(() => first.query(question.ref), snapshot => snapshot.state === 'waiting_interaction' || snapshot.state === 'unknown', 'Question did not appear'); assert.equal(questionPending.state, 'waiting_interaction', JSON.stringify(questionPending));
  assert.equal(questionPending.interactions[0].request.kind, 'question'); await first.answer(question.ref, questionPending.interactions[0].id, { kind: 'question', answers: ['Continue'] }); const questionResult = await terminal(question.ref); assert.equal(questionResult.state, 'completed', JSON.stringify(questionResult));
  const readonly = await run('SPECFLOW_SMOKE_READONLY'); const readonlyResult = await terminal(readonly.ref); assert.ok(['completed', 'failed'].includes(readonlyResult.state), JSON.stringify(readonlyResult));
  const readonlyRequest = requests.find(body => body.messages?.some(message => message.role === 'user' && String(message.content).includes('SPECFLOW_SMOKE_READONLY')));
  assert.ok(readonlyRequest); assert.ok(!readonlyRequest.tools?.some(tool => ['bash', 'write', 'edit', 'apply_patch', 'task'].includes(tool.function.name)), 'Read-only sessions must withhold mutating tools');
  await assert.rejects(readFile(join(directories.workspace, 'must-not-exist.txt')), { code: 'ENOENT' });
  const cancelled = await run('SPECFLOW_SMOKE_CANCEL'); await until(async () => requests.some(body => body.messages?.some(message => message.role === 'user' && String(message.content).includes('SPECFLOW_SMOKE_CANCEL'))), Boolean, 'Cancellation request never reached the local fake provider'); await first.stop(cancelled.ref); assert.equal((await terminal(cancelled.ref)).state, 'cancelled');
  const requestCount = requests.length;
  await mkdir(join(directories.workspace, '.opencode', 'tools'), { recursive: true });
  await writeFile(join(directories.workspace, '.opencode', 'tools', 'read.js'), "export default { description: 'Override fixture', args: {}, execute() { throw new Error('A project tool override must never run'); } };\n");
  await assert.rejects(first.prepare({ ...input('SPECFLOW_SMOKE_UNTRUSTED'), readOnly: true }), { code: 'OPENCODE_UNTRUSTED_CONFIG' });
  assert.equal(requests.length, requestCount, 'Reject project extensions before invoking the model');
  console.log(JSON.stringify({ ok: true, version: capabilities.version, provider: 'local fake HTTP only', checks: ['health and model discovery', 'idempotent preparation', 'async completion and usage', 'persisted result recovery', 'permission rejection', 'approved workspace write', 'question answer', 'read-only write rejection', 'abort', 'project tool override rejection'], requests: requests.length }));
} catch (error) {
  console.error(logs);
  if (latestRef) {
    const url = new URL(`/session/${latestRef.sessionId}/message`, baseUrl); url.searchParams.set('directory', directories.workspace);
    const response = await fetch(url, { headers: { authorization: `Basic ${Buffer.from('opencode:specflow-local-smoke').toString('base64')}` } });
    console.error('Last local smoke session:', await response.text());
  }
  throw error;
}
finally {
  await Promise.all(backends.map(instance => instance.close()));
  child.kill(); if (child.exitCode === null) await Promise.race([once(child, 'exit'), delay(5000)]);
  for (const socket of sockets) socket.destroy(); provider.close();
  await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
