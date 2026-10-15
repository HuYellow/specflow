import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DomainError, hash, id, type ExecutionRef, type ModelTarget } from '../domain/index.ts';
import type { BackendCapabilities, ExecutionBackend, ExecutionSnapshot, ExecutionUpdate, FrozenInput } from '../execution-contract/index.ts';
import { applyWindowsCompatibility, MAKA_VERSION } from './compat.ts';
import { MAKA_RELEASE, MAKA_RELEASE_AVAILABLE } from './release-policy.ts';

export { MAKA_VERSION } from './compat.ts';
const MAKA_TURN_TEXT_MAX_BYTES = 48 * 1024;
function assertPromptSize(prompt: string) {
  const actualBytes = Buffer.byteLength(prompt, 'utf8');
  if (actualBytes > MAKA_TURN_TEXT_MAX_BYTES) throw new DomainError('INPUT_TOO_LARGE', '阶段输入超过 Maka 正式版 0.2.0 的 48 KiB UTF-8 文本上限。请缩小需求、产物或候选补丁后重试；完整审核依据不能截断。', 413, { actualBytes, maxBytes: MAKA_TURN_TEXT_MAX_BYTES });
}
type Host = { rootId: string; request(operation: string, input: unknown, timeout?: number): Promise<any>; status(): Promise<any>; openSessionSubscription(input: unknown): Promise<any>; close(): Promise<void> };
export class MakaBackend implements ExecutionBackend {
  private connection?: Host;
  private connecting?: Promise<Host>;
  constructor(readonly packageRoot: string, readonly rootPath: string, readonly workspaceRoot = join(dirname(rootPath), 'workspaces')) {}
  async connect(): Promise<Host> {
    if (!MAKA_RELEASE_AVAILABLE) throw new DomainError('MAKA_RELEASE_UNAVAILABLE', MAKA_RELEASE.reason, 503);
    if (this.connection) return this.connection;
    if (this.connecting) return this.connecting;
    this.connecting = (async () => {
      const base = join(this.packageRoot, 'node_modules', '@maka', 'runtime-host', 'dist');
      if (!existsSync(join(base, 'client', 'index.js'))) throw new DomainError('MAKA_NOT_INSTALLED', '请先运行 npm run maka:setup', 503);
      await applyWindowsCompatibility(this.packageRoot);
      const client = await import(pathToFileURL(join(base, 'client', 'index.js')).href);
      const protocol = await import(pathToFileURL(join(base, 'protocol', 'index.js')).href);
      const result = await client.connectOrSpawnRuntimeHost({ rootPath: resolve(this.rootPath),
        generation: MAKA_VERSION,
        protocol: { min: protocol.RUNTIME_HOST_PROTOCOL_VERSION, max: protocol.RUNTIME_HOST_PROTOCOL_VERSION },
        compositionId: protocol.INTERACTIVE_RUNTIME_HOST_COMPOSITION_ID,
        candidateEntrypoint: join(base, 'execution-candidate-main.js'), candidateExecutable: process.execPath,
        electionDeadlineMs: 45000, idleGraceMs: 1000, closeOnLauncherExit: true });
      if (result.kind !== 'connected') throw new DomainError('MAKA_UNAVAILABLE', `Maka Host 无法连接：${result.reason || result.kind}`, 503);
      try { await this.installWorkspaceTools(result.connection); }
      catch (error) {
        let diagnostic = '';
        try { const state = await result.connection.request('plugin.platform.query', { view: 'failures', limit: 8 }); diagnostic = JSON.stringify(state.items || state.failures || state).slice(0, 1800); } catch {}
        await result.connection.close();
        throw new DomainError('PLUGIN_UNAVAILABLE', `${(error as Error).message}${diagnostic ? `：${diagnostic}` : ''}`, 503);
      }
      this.connection = result.connection;
      return this.connection!;
    })().finally(() => { this.connecting = undefined; });
    return this.connecting;
  }
  private async installWorkspaceTools(host: Host) {
    const bundlePath = resolve(process.env.SPECFLOW_PLUGIN_BUNDLE || '.tools/workspace-plugin/index.mjs');
    if (!existsSync(bundlePath)) throw new DomainError('PLUGIN_NOT_BUILT', '请先运行 npm run build 生成工作区扩展', 503);
    const root = resolve(this.workspaceRoot); await mkdir(root, { recursive: true });
    const sourcePath = join(dirname(this.rootPath), `specflow-plugin-${hash(root).slice(0, 12)}`); await mkdir(sourcePath, { recursive: true });
    await writeFile(join(sourcePath, 'index.mjs'), await readFile(bundlePath));
    await writeFile(join(sourcePath, 'maka.extension.json'), await readFile(resolve(process.env.SPECFLOW_PLUGIN_MANIFEST || 'plugins/specflow-workspace/maka.extension.json')));
    await writeFile(join(sourcePath, 'maka.composition.json'), JSON.stringify([{ type: 'insert', rootId: 'profile', entry: { id: 'specflow-workspace-tools', packageId: 'specflow.workspace', config: { workspaceRoot: root } } }]));
    const receipt = await host.request('plugin.package.install', { sourcePath });
    if (receipt.convergence !== 'converged') throw new DomainError('PLUGIN_UNAVAILABLE', '工作空间工具扩展未就绪', 503);
  }
  async inspect(): Promise<BackendCapabilities> {
    try { const host = await this.connect(); await host.status(); return { available: true, version: MAKA_VERSION, rootId: host.rootId, canResume: true, canInteract: true, readOnlyReview: true, reason: '使用 Host plan/explore 只读策略；真实供应商验收待连接配置' }; }
    catch (error) { return { available: false, version: MAKA_VERSION, canResume: false, canInteract: false, readOnlyReview: false, reason: (error as Error).message }; }
  }
  async listTargets(): Promise<ModelTarget[]> {
    const host = await this.connect(); const items: any[] = [];
    let input: any = { kind: 'start' };
    for (let page = 0; page < 128; page++) {
      const result = await host.request('connection.catalog.query', input);
      if (result.kind === 'revision_changed') throw new DomainError('TARGET_CHANGED', '模型目录已变化，请刷新');
      items.push(...(result.items || []));
      if (!result.nextCursor) break;
      input = { kind: 'continue', revision: result.revision, cursor: result.nextCursor };
    }
    const connections = new Map<number, any>();
    for (const row of items) if (row.kind === 'connection') connections.set(row.connectionIndex, row);
    return items.filter(row => row.kind === 'enabled_model_id').flatMap(row => {
      const c = connections.get(row.connectionIndex);
      return c?.enabled ? [{ backend: 'maka' as const, rootId: host.rootId, connectionId: c.connectionId, connectionSlug: c.slug, model: row.modelId }] : [];
    });
  }
  async prepare(input: FrozenInput): Promise<ExecutionRef> {
    assertPromptSize(input.prompt);
    const host = await this.connect();
    const sessionId = input.attemptId, turnId = id();
    await host.request('session.create', { sessionId, workspace: { kind: 'host_path', path: input.workspace },
      name: `SpecFlow ${input.attemptId.slice(0, 8)}`, modelTarget: { kind: 'explicit', connectionId: input.target.connectionId, connectionSlug: input.target.connectionSlug, model: input.target.model },
      permissionMode: 'ask', collaborationMode: input.readOnly ? 'plan' : 'agent' }, 15000);
    return { backend: 'maka', rootId: host.rootId, sessionId, turnId };
  }
  async start(ref: ExecutionRef, input: FrozenInput): Promise<ExecutionSnapshot> {
    assertPromptSize(input.prompt);
    const host = await this.connect(); this.checkRoot(host, ref);
    const result = await host.request('turn.start', { sessionId: ref.sessionId, turnId: ref.turnId, content: { text: input.prompt, attachments: [] }, maxSteps: input.maxSteps });
    if (result.kind !== 'started') throw new DomainError('EXECUTION_BLOCKED', '底座拒绝启动阶段');
    return { state: 'running', ref: { ...ref, runId: result.turn.runId } };
  }
  private checkRoot(host: Host, ref: ExecutionRef) { if (host.rootId !== ref.rootId) throw new DomainError('BACKEND_IDENTITY_CHANGED', '执行底座身份已变化，不能继续原运行'); }
  async query(ref: ExecutionRef): Promise<ExecutionSnapshot> {
    const host = await this.connect(); this.checkRoot(host, ref);
    try {
      const result = await host.request('turn.query', { sessionId: ref.sessionId, turnId: ref.turnId });
      const turn = result.turn ?? result;
      let interactions: ExecutionSnapshot['interactions'];
      if (turn.status === 'waiting_for_user') {
        const subscription = await host.openSessionSubscription({ sessionId: ref.sessionId, transcript: { kind: 'none' } });
        try { interactions = subscription.snapshot.interactions.pending.map((i: any) => ({ id: i.interactionId, request: i.request })); }
        finally { await subscription.close(); }
      }
      return { state: ['completed', 'failed', 'cancelled', 'waiting_for_user'].includes(turn.status) ? (turn.status === 'waiting_for_user' ? 'waiting_interaction' : turn.status) : 'running',
        ref: { ...ref, runId: turn.runId || ref.runId }, terminalEventId: turn.terminalEventId, error: turn.failureMessage || turn.error, interactions };
    } catch (error) { return { state: 'unknown', ref, error: (error as Error).message }; }
  }
  async *observe(ref: ExecutionRef): AsyncIterable<ExecutionUpdate> {
    while (true) { const snapshot = await this.query(ref); yield { kind: ['completed', 'failed', 'cancelled'].includes(snapshot.state) ? 'terminal' : 'progress', snapshot };
      if (['completed', 'failed', 'cancelled', 'unknown'].includes(snapshot.state)) return;
      await new Promise(done => setTimeout(done, 1000)); }
  }
  async readResult(ref: ExecutionRef) {
    const snapshot = await this.query(ref); const host = await this.connect();
    const subscription = await host.openSessionSubscription({ sessionId: ref.sessionId, transcript: { kind: 'tail', maxBytes: 16384 } });
    try {
      const items = await subscription.loadTranscript((value: unknown) => value);
      const output = items.flatMap((value: any) => {
        if (value.type === 'assistant' && (!value.turnId || value.turnId === ref.turnId) && typeof value.text === 'string') return [value.text];
        if (value.role !== 'assistant' || (value.turnId && value.turnId !== ref.turnId)) return [];
        if (typeof value.content === 'string') return [value.content];
        return (value.content || []).filter((part: any) => part.type === 'text').map((part: any) => part.text || '');
      }).at(-1) || '';
      return { ...snapshot, output: output || snapshot.output || '' };
    } finally { await subscription.close?.(); }
  }
  async answer(ref: ExecutionRef, interactionId: string, answer: unknown) { const host = await this.connect(); this.checkRoot(host, ref); await host.request('interaction.answer', { sessionId: ref.sessionId, interactionId, answer }); }
  async stop(ref: ExecutionRef) { const host = await this.connect(); this.checkRoot(host, ref); await host.request('turn.stop', { sessionId: ref.sessionId, turnId: ref.turnId, runId: ref.runId }); }
  async planResume(ref: ExecutionRef) { const host = await this.connect(); this.checkRoot(host, ref); const plan = await host.request('turn.resume.query', { sessionId: ref.sessionId, sourceRunId: ref.runId }); return { possible: plan.disposition === 'ready', reason: plan.reason, data: plan }; }
  async resume(ref: ExecutionRef, data: any) { const host = await this.connect(); this.checkRoot(host, ref); const result = await host.request('turn.resume.start', { sessionId: ref.sessionId, turnId: id(), sourceRunId: data.sourceRunId, sourceRuntimeEventHighWater: data.sourceRuntimeEventHighWater }); if (result.kind !== 'started') throw new DomainError('RESUME_BLOCKED', result.plan?.reason || '无法恢复'); return { ...ref, turnId: result.turn.turnId, runId: result.turn.runId }; }
  async close() { await this.connection?.close(); this.connection = undefined; }
  async configureConnection(input: { slug: string; name: string; providerType: string; baseUrl?: string; protocol?: string; models: string[]; apiKey?: string }) {
    const host = await this.connect(); const catalog = await host.request('connection.catalog.query', { kind: 'start' });
    // The 0.2.0 release expresses compatible wire protocols as provider types.
    const providerType = input.providerType === 'custom' ? ({ 'openai-chat': 'openai-compatible', 'openai-responses': 'openai-responses-compatible', 'anthropic-messages': 'anthropic-compatible' }[input.protocol || 'openai-chat']) : input.providerType;
    if (!providerType) throw new DomainError('PROTOCOL_UNSUPPORTED', 'Maka 正式版不支持此连接协议', 400);
    const created = await host.request('connection.catalog.create', { expectedCatalogRevision: catalog.revision, connection: {
      slug: input.slug, name: input.name, providerType,
      ...(input.baseUrl ? { baseUrl: input.baseUrl } : {}),
      enabled: true, enabledModelIds: input.models,
    } });
    if (created.kind !== 'committed') throw new DomainError('CONNECTION_CONFLICT', '连接名称或模型目录已变化，请刷新');
    if (input.apiKey) await host.request('credential.vault.set', { locator: { scope: 'connection', connectionId: created.connection.connectionId, kind: 'api_key' }, expected: null, secret: input.apiKey });
    return { connectionId: created.connection.connectionId, slug: input.slug, models: input.models };
  }
}
