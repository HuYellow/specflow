// Uses the released DSH SDK and a local scripted model adapter: no API key,
// network provider, user profile or installed Harness service is involved.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { DshBackend } from '../plugins/deepseek-specflow/src/backend.ts';
import { createEngineeringRuntime } from '../packages/specflow-core/index.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const runtimeDirIndex = process.argv.indexOf('--runtimeDir');
const runtimeDir = runtimeDirIndex < 0 ? undefined : process.argv[runtimeDirIndex + 1];
if (runtimeDirIndex >= 0 && (!runtimeDir || runtimeDir.startsWith('--'))) throw new Error('--runtimeDir requires a DSH installation directory');
const sdkRoot = resolve(runtimeDir || process.env.SPECFLOW_DSH_SDK_ROOT || join(root, '.tools', 'dsh-validation'));
const sdkRequire = createRequire(join(sdkRoot, 'package.json'));
const fromSdk = name => import(pathToFileURL(sdkRequire.resolve(name)).href);
const sdkVersion = JSON.parse(await readFile(sdkRequire.resolve('@deepseek-ai/dsh/package.json'), 'utf8')).version;
assert.equal(sdkVersion, '0.2.1-rc.2', 'The release smoke must run against the pinned DSH SDK');
const [cordis, llm, session, projections, systemPrompt, tools, agents, loop, persistence] = await Promise.all([
  '@deepseek-ai/cordis', '@deepseek-ai/dsh-llm', '@deepseek-ai/dsh-session', '@deepseek-ai/dsh-session-projection',
  '@deepseek-ai/dsh-system-prompt', '@deepseek-ai/dsh-tools', '@deepseek-ai/dsh-agent', '@deepseek-ai/dsh-agent-loop', '@deepseek-ai/dsh-session-persistence-jsonl',
].map(fromSdk));
const temporary = await mkdtemp(join(tmpdir(), 'specflow-dsh-real-')), workspaceRoot = join(temporary, 'workspaces'), workspace = join(workspaceRoot, 'attempt');
await mkdir(workspace, { recursive: true }); await writeFile(join(workspace, 'input.txt'), 'real DSH fixture');
const ctx = new cordis.Context();
const backends = [];
let engineeringRuntime;
function textResponse(text) {
  return [{ type: 'block-start', index: 0, blockType: 'text' }, { type: 'text-delta', index: 0, text }, { type: 'block-end', index: 0, block: { type: 'text', text } }, { type: 'usage', usage: { inputTokens: 11, cacheReadTokens: 4, outputTokens: 7 } }, { type: 'finish', reason: { kind: 'stop' } }];
}
let call = 0;
function toolResponse(name, args) {
  const id = llm.ToolCallId(`call_${++call}`), argumentsJson = JSON.stringify(args);
  return [{ type: 'block-start', index: 0, blockType: 'tool-call' }, { type: 'tool-call-delta', index: 0, id, name, argumentsDelta: argumentsJson }, { type: 'block-end', index: 0, block: { type: 'tool-call', id, name, arguments: argumentsJson } }, { type: 'finish', reason: { kind: 'tool-calls' } }];
}
class ScriptedAdapter extends llm.LlmAdapter {
  script = [];
  requests = [];
  listModels(provider) { return Promise.resolve([{ provider, id: 'fixture', name: 'Local smoke fixture' }]); }
  resolveModel(provider, model) { return Promise.resolve({ provider, id: model, name: model }); }
  async *stream(request) {
    this.requests.push(request);
    const entry = this.script.shift(); if (!entry) throw new Error('No scripted response remains');
    if (entry === 'hang') {
      yield { type: 'block-start', index: 0, blockType: 'text' };
      yield { type: 'text-delta', index: 0, text: 'in progress' };
      await new Promise((_, reject) => { if (request.signal.aborted) { reject(request.signal.reason); return; } request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true }); });
      return;
    }
    for (const chunk of entry) { request.signal?.throwIfAborted(); yield chunk; }
  }
}
const adapter = new ScriptedAdapter();
const options = { context: ctx, stateDir: join(temporary, 'journal'), workspaceRoot, instanceId: 'real-sdk-smoke', pollIntervalMs: 10, version: sdkVersion };
const connect = () => { const backend = new DshBackend(options); backends.push(backend); return backend; };
async function waitTerminal(backend, ref) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const snapshot = await backend.query(ref);
    if (snapshot.state !== 'running') return snapshot;
    await new Promise(done => setTimeout(done, 10));
  }
  throw new Error('DSH execution did not settle within 10 seconds');
}
try {
  for (const [plugin, config] of [[llm.default], [session.default], [projections.default], [systemPrompt.default, {}], [tools.default, { mode: 'native' }], [agents.default], [persistence, { root: join(temporary, 'sessions'), compression: 'none' }], [loop.default, { agents: [] }]]) await ctx.plugin(plugin, config);
  ctx.llm.registerAdapter(['smoke'], adapter);
  ctx.tools.register({ name: 'dangerous_host_tool', description: 'Must never be exposed to a Specflow attempt', parameters: { type: 'object', properties: {}, additionalProperties: false }, output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] }, execute: async () => { throw new Error('Inherited capability escaped the scope'); } });
  const backend = connect(), target = (await backend.listTargets())[0];
  const capabilities = await backend.inspect(); assert.equal(capabilities.available, true, JSON.stringify(capabilities));
  const input = (attemptId, extra = {}) => ({ attemptId, workspace, target, prompt: 'Return the structured stage output', maxSteps: 4, inputHash: `frozen-${attemptId}`, readOnly: false, artifacts: [], node: { id: 'specify', name: 'Specify', type: 'agent', prompt: '', inputs: [], outputs: ['spec'] }, ...extra });
  const output = JSON.stringify({ summary: 'Real DSH completed', artifacts: [] });

  const readOnly = input('read-only', { readOnly: true });
  adapter.script = [toolResponse('specflow_read_file', { path: 'input.txt' }), textResponse(output)];
  const ref = await backend.prepare(readOnly); assert.equal((await backend.start(ref, readOnly)).state, 'running');
  const result = await waitTerminal(backend, ref); assert.equal(result.state, 'completed', JSON.stringify(result)); assert.equal(result.output, output);
  // The tool-only scripted response reports no usage. A known final-step count
  // cannot stand in for the whole turn or silently turn missing counters into 0.
  assert.ok(result.usageMeasurement, 'The terminal result must expose its meter and completeness');
  assert.equal(result.usageMeasurement.scope, 'turn'); assert.equal(result.usageMeasurement.mode, 'cumulative');
  assert.equal(result.usageMeasurement.eventId, result.terminalEventId);
  assert.equal(result.usageMeasurement.inputTokens, null); assert.equal(result.usageMeasurement.outputTokens, null);
  assert.equal(result.usageMeasurement.costUsd, null); assert.equal(result.usageMeasurement.completeness, 'unknown');
  assert.equal(result.usage, undefined, 'Incomplete turn counters must not appear as a complete legacy usage total');
  for (const request of adapter.requests) assert.deepEqual(request.tools.map(tool => tool.name).sort(), ['specflow_list_files', 'specflow_read_file']);
  const reader = await ctx.sessionPersistence.open(ref.sessionId, 'read');
  const saved = (await reader.read()).events; await reader.close();
  assert.ok(saved.some(event => event.type === 'tool/result' && !event.data.message.content.some(block => block.type === 'text' && block.text.includes('UNKNOWN_TOOL'))));
  assert.ok(saved.some(event => event.type === 'turn/end' && event.data.reason.kind === 'completed'));

  // Drop only the adapter's cached terminal, then reconstruct from DSH's own
  // persisted event log through a fresh adapter. This exercises cold query.
  await backend.close();
  const journalPath = join(options.stateDir, `${ref.sessionId}.json`), journal = JSON.parse(await readFile(journalPath, 'utf8')); delete journal.terminal; await writeFile(journalPath, JSON.stringify(journal));
  const restarted = connect(); assert.equal((await restarted.query(ref)).state, 'completed'); assert.equal((await restarted.start(ref, readOnly)).state, 'completed'); assert.equal(adapter.requests.length, 2);

  const writing = input('writing'); adapter.script = [toolResponse('specflow_make_directory', { path: 'new-directory' }), toolResponse('specflow_write_file', { path: 'new-directory/result.txt', expected_hash: '', content: 'created by DSH' }), textResponse(output)];
  const writingRef = await restarted.prepare(writing); await restarted.start(writingRef, writing); assert.equal((await waitTerminal(restarted, writingRef)).state, 'completed'); assert.equal(await readFile(join(workspace, 'new-directory/result.txt'), 'utf8'), 'created by DSH');

  const limited = input('limited', { maxSteps: 1 }); adapter.script = [toolResponse('specflow_read_file', { path: 'input.txt' }), textResponse('must not execute')];
  const beforeLimit = adapter.requests.length, limitedRef = await restarted.prepare(limited); await restarted.start(limitedRef, limited); const limitResult = await waitTerminal(restarted, limitedRef); assert.equal(limitResult.state, 'failed', JSON.stringify(limitResult)); assert.match(limitResult.error, /最大 1 步/); assert.equal(adapter.requests.length - beforeLimit, 1);

  const stopping = input('stopping'); adapter.script = ['hang']; const stopRef = await restarted.prepare(stopping); await restarted.start(stopRef, stopping);
  await new Promise(done => setTimeout(done, 20)); await restarted.stop(stopRef); assert.equal((await restarted.query(stopRef)).state, 'cancelled');
  assert.equal((await restarted.planResume(stopRef)).possible, false);

  // Exercise the same host-neutral core used by the DSH plugin, including
  // project registration, role routing, a real isolated Git worktree, frozen
  // attempt dispatch and structured artifact persistence.
  const sourceRepository = join(temporary, 'source-repository'), emptyHooks = join(temporary, 'empty-hooks');
  await mkdir(sourceRepository); await mkdir(emptyHooks);
  const runGit = args => promisify(execFile)('git', ['-c', `core.hooksPath=${emptyHooks}`, '-c', 'commit.gpgsign=false', '-c', 'core.autocrlf=false', ...args], { cwd: sourceRepository, windowsHide: true });
  await runGit(['init', '--initial-branch=main']);
  await writeFile(join(sourceRepository, 'README.md'), '# DSH engineering core smoke\n\nA clean baseline repository.\n');
  await runGit(['add', 'README.md']);
  await runGit(['-c', 'user.name=Specflow Smoke', '-c', 'user.email=specflow-smoke@localhost', 'commit', '-m', 'Create smoke baseline']);
  engineeringRuntime = await createEngineeringRuntime({ dataDir: temporary, backends: { dsh: restarted }, defaultBackend: 'dsh' });
  const { service, store } = engineeringRuntime;
  let project = await service.registerProject(sourceRepository, 'Real DSH core integration');
  assert.equal(project.executionBackend, 'dsh');
  project = await service.configureProject(project.id, project.revision, { rules: project.rules, commands: project.commands, defaults: { analyst: target, architect: target, developer: target, reviewer: target }, executionBackend: 'dsh' });
  const item = await service.createWorkItem(project.id, 'Verify DSH specification routing', 'FR-001: Produce a complete specification that records the DSH integration boundary and a checkable acceptance condition.');
  assert.notEqual(item.workspace, sourceRepository); assert.equal(dirname(item.workspace), workspaceRoot);
  const specification = '# DSH integration specification\n\n## FR-001 — Specification routing\nThe Specflow engineering core dispatches the specification stage to the configured DSH analyst model inside the work item Git worktree. The resulting spec retains its original attempt and DSH execution identity.\n\n## AC-001 — Acceptance\nThe stage completes and stores a spec artifact revision linked to its DSH attempt. No source files are modified during this read-only stage.\n';
  const stageOutput = { summary: 'Specification completed through the shared core and real DSH agent', artifacts: [{ logicalId: 'spec', type: 'spec', content: specification, humanBrief: { title: 'DSH integration specification', summary: 'The specification stage routes through the selected DSH analyst and stores an attributable artifact.', sections: [{ title: 'Requirement', items: ['FR-001: Dispatch the specification stage to the configured DSH analyst in its isolated Git worktree.'] }, { title: 'Acceptance', items: ['AC-001: Store the spec revision and preserve its originating DSH attempt identity.'] }] } }], findings: [] };
  adapter.script = [textResponse(JSON.stringify(stageOutput))];
  const workflowRun = store.list('runs', run => run.workItemId === item.id && run.state === 'active')[0];
  const specifyNode = store.list('nodes', node => node.workflowRunId === workflowRun.id && node.nodeId === 'specify')[0];
  const attempt = await service.startNode(specifyNode.id, specifyNode.revision);
  await service.waitForIdle();
  const completedAttempt = store.get('attempts', attempt.id); assert.equal(completedAttempt.execution, 'completed', JSON.stringify(completedAttempt)); assert.equal(completedAttempt.target.backend, 'dsh');
  const binding = store.get('bindings', completedAttempt.bindingId); assert.equal(binding.ref.backend, 'dsh'); assert.equal(binding.ref.rootId, restarted.rootId);
  const measured = (await restarted.readResult(binding.ref)).usageMeasurement;
  assert.ok(measured, 'The text-only response reports known token usage through the canonical meter');
  assert.equal(measured.scope, 'turn'); assert.equal(measured.mode, 'cumulative');
  assert.equal(measured.inputTokens, 15); assert.equal(measured.outputTokens, 7);
  assert.equal(measured.costUsd, null); assert.equal(measured.completeness, 'partial');
  assert.equal(completedAttempt.usageSummary.inputTokens, 15); assert.equal(completedAttempt.usageSummary.outputTokens, 7);
  assert.equal(completedAttempt.usageSummary.costUsd, null); assert.equal(completedAttempt.usageSummary.completeness, 'partial');
  const artifact = store.list('artifacts', value => value.workItemId === item.id && value.logicalId === 'spec')[0]; assert.ok(artifact, 'The shared core must persist a specification artifact');
  const revision = store.get('artifactRevisions', artifact.currentRevisionId); assert.equal(revision.originAttemptId, completedAttempt.id); assert.equal(revision.content, specification); assert.equal(store.get('nodes', specifyNode.id).execution, 'completed');
  assert.equal(await readFile(join(item.workspace, 'README.md'), 'utf8'), '# DSH engineering core smoke\n\nA clean baseline repository.\n');
  process.stdout.write(JSON.stringify({ sdkVersion, passed: ['real agent create and identified followup', 'scoped read-only tools and inherited capability exclusion', 'unknown usage is preserved and complete token meters reach the core', 'JSONL terminal and cold reconciliation', 'workspace directory and file tools', 'native pre-step maxSteps', 'cancel and terminal persistence', 'resume explicitly unsupported', 'shared engineering core, isolated Git worktree, real DSH dispatch and persisted spec artifact'], providerRequests: adapter.requests.length }) + '\n');
} finally {
  await engineeringRuntime?.close(); await Promise.allSettled(backends.map(backend => backend.close())); await ctx.fiber.dispose(); await rm(temporary, { recursive: true, force: true });
}
