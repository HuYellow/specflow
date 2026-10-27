import { randomBytes } from 'node:crypto';
import { isUtf8 } from 'node:buffer';
import { constants } from 'node:fs';
import { mkdir, open, readFile, readdir, realpath, rename, writeFile, type FileHandle } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { DomainError, hash, type ExecutionRef, type ModelTarget } from '../../../packages/domain/index.ts';
import type { BackendCapabilities, ExecutionBackend, ExecutionSnapshot, ExecutionUpdate, FrozenInput } from '../../../packages/execution-contract/index.ts';
import { reportedSum, turnUsage, unknownTurnUsage } from '../../../packages/execution-contract/measurements.ts';

/** The public DSH 0.2.1-rc.2 service APIs used by this adapter, kept structural
 * so the shared core and its tests do not load a second copy of the host SDK. */
export interface DshHostContext {
  agents: { create(options: { sessionId: string; meta: { cwd: string }; agentOptions: { provider: string; model: string }; setup(ctx: DshAgentContext, agent: DshAgent): void }): Promise<DshAgentHandle>; get(id: string): DshAgent | undefined };
  llm: { listProviders(): { id: string; name: string }[]; listModels(provider: string): Promise<{ id: string; name: string }[]> };
  sessions: { flush(session: DshSession): Promise<boolean> };
  sessionPersistence: { open(id: string, access: 'read'): Promise<{ header: { id: string; cwd?: string }; read(): Promise<{ events: readonly DshEvent[] }>; close(): Promise<void> }> };
}
interface DshAgentContext {
  tools: { restrict(filter: { allow: string[] }): unknown; presentAs(mode: 'native'): unknown; register(tool: DshTool): unknown; guard(guard: (exec: { name: string }) => string | undefined): unknown };
  on(name: 'agent/pre-step', listener: (payload: { agent: DshAgent; step: number }, next: () => Promise<unknown>) => Promise<unknown>): unknown;
}
interface DshSession { id: string; header: { id: string; cwd?: string } }
interface DshAgent { id: string; session: DshSession; status: 'idle' | 'running'; followup(message: { id: string; role: 'user'; content: { type: 'text'; text: string }[]; source: { kind: 'user' } }): void; cancel(cause: { kind: 'user' } | { kind: 'hook'; reason: string } | { kind: 'disposed' }): void; whenIdle(): Promise<void> }
interface DshAgentHandle { agent: DshAgent; dispose(): Promise<void> }
interface DshEvent { type: string; seq: number; data: any }
interface DshTool { name: string; description: string; parameters: Record<string, unknown>; output: { schema: { type: 'string' }; render(args: unknown, value: string): { type: 'text'; text: string }[] }; execute(args: unknown, exec: { signal: AbortSignal }): Promise<string>; isConcurrencySafe(): boolean }
export interface DshBackendOptions { context: DshHostContext; stateDir: string; workspaceRoot: string; instanceId: string; version?: string; pollIntervalMs?: number }
interface Journal { version: 1; ref: ExecutionRef; attemptId: string; digest: string; workspace: string; readOnly: boolean; maxSteps: number; target: ModelTarget; dispatch: 'prepared' | 'intent' | 'accepted'; stopRequested?: boolean; stopRequestedAt?: string; limitExceeded?: boolean; terminal?: ExecutionSnapshot }
const resumeReason = 'DSH 不支持继续原来的中断 turn；重启后只核对持久会话，不自动恢复或重复派发。';
const maxFileBytes = 1024 * 1024;
const samePath = (a: string, b: string) => process.platform === 'win32' ? resolve(a).toLowerCase() === resolve(b).toLowerCase() : resolve(a) === resolve(b);
const within = (root: string, path: string) => { const rel = relative(root, path); return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel); };

/** An in-process harness bridge, independent of Maka and OpenCode. Each frozen
 * attempt owns one DSH agent, one session and exactly one identified message. */
export class DshBackend implements ExecutionBackend {
  readonly rootId: string;
  private readonly locks = new Map<string, Promise<unknown>>();
  private readonly handles = new Map<string, DshAgentHandle>();
  private readonly settlements = new Set<Promise<void>>();
  private closed = false;
  private closing: Promise<void> | undefined;
  constructor(readonly options: DshBackendOptions) {
    if (!options.instanceId.trim()) throw new Error('DSH instanceId must identify the persistent host profile');
    this.rootId = `dsh-${hash(JSON.stringify([options.instanceId, resolve(options.stateDir), resolve(options.workspaceRoot)])).slice(0, 32)}`;
  }
  toolInstructions(input: { readOnly: boolean; clarification: boolean; locale?: 'zh-CN' | 'en' }): string {
    if (input.locale === 'en') return [
      'The execution backend is DeepSeek Harness. This session only provides Specflow workspace tools: specflow_list_files, specflow_read_file, and, for stages allowed to write, specflow_make_directory, specflow_write_file, and specflow_edit_file. Paths are relative to the current isolated workspace. Access to .git or external directories is prohibited.',
      input.readOnly ? 'This stage only has read access. Do not modify files.' : 'Read a file before modifying it and use the returned SHA-256 as expected_hash. For new files, expected_hash is an empty string. Specflow runs command verification in the verification stage; shell tools and subagents are prohibited.',
      input.clarification ? 'Place questions requiring clarification in clarification.questions in the final JSON.' : 'The final output must be the complete JSON required by the stage.',
    ].join('\n');
    return [
      '执行底座为 DeepSeek Harness。当前会话仅提供 Specflow 工作区工具：specflow_list_files、specflow_read_file，以及写入阶段的 specflow_make_directory、specflow_write_file、specflow_edit_file。路径相对当前隔离工作区，不允许访问 .git 或外部目录。',
      input.readOnly ? '本阶段只有读取能力，禁止修改文件。' : '修改文件时先读取并用返回的 SHA-256 作为 expected_hash；新文件 expected_hash 为空字符串。命令验证由 Specflow 的验证阶段运行，不能用 shell 或子代理。',
      input.clarification ? '需要澄清的问题放入最终 JSON 的 clarification.questions。' : '最终输出必须是阶段要求的完整 JSON。',
    ].join('\n');
  }
  private async locked<T>(key: string, action: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(key) || Promise.resolve();
    const current = previous.catch(() => {}).then(action); this.locks.set(key, current);
    try { return await current; } finally { if (this.locks.get(key) === current) this.locks.delete(key); }
  }
  private file(ref: ExecutionRef) {
    if (ref.backend !== 'dsh' || ref.rootId !== this.rootId) throw new DomainError('BACKEND_IDENTITY_CHANGED', 'DSH profile 或执行身份已变化，不能接管原运行', 409);
    if (!/^sf_[a-f0-9]{32}$/.test(ref.sessionId) || ref.turnId !== `${ref.sessionId}_input`) throw new DomainError('EXECUTION_REF_INVALID', 'DSH 执行引用无效', 400);
    return join(resolve(this.options.stateDir), `${ref.sessionId}.json`);
  }
  private async save(path: string, value: unknown) {
    await mkdir(resolve(this.options.stateDir), { recursive: true });
    const temp = `${path}.${randomBytes(6).toString('hex')}.tmp`;
    await writeFile(temp, JSON.stringify(value), { mode: 0o600 }); await rename(temp, path);
  }
  private digest(input: FrozenInput) { return hash(JSON.stringify(input)); }
  private async workspace(path: string) {
    const root = await realpath(this.options.workspaceRoot), actual = await realpath(path);
    if (!within(root, actual)) throw new DomainError('WORKSPACE_OUTSIDE_ROOT', 'DSH 工作区必须位于 Specflow 的隔离工作区目录内', 400);
    return actual;
  }
  private async load(ref: ExecutionRef): Promise<Journal> {
    const file = this.file(ref); let journal: Journal;
    try { journal = JSON.parse(await readFile(file, 'utf8')); }
    catch { throw new DomainError('EXECUTION_NOT_FOUND', '没有原 DSH 执行的持久记录，不能重新派发', 409); }
    if (journal.version !== 1 || journal.ref.backend !== ref.backend || journal.ref.rootId !== ref.rootId || journal.ref.sessionId !== ref.sessionId || journal.ref.turnId !== ref.turnId || journal.ref.runId !== ref.runId) throw new DomainError('EXECUTION_REF_INVALID', 'DSH 引用与持久记录不匹配', 409);
    if (!samePath(await this.workspace(journal.workspace), journal.workspace)) throw new DomainError('WORKSPACE_CHANGED', 'DSH 隔离工作区身份已变化', 409);
    return journal;
  }
  async inspect(): Promise<BackendCapabilities> {
    const version = this.options.version || '0.2.1-rc.2';
    const base: Omit<BackendCapabilities, 'available' | 'readOnlyReview'> = { version, rootId: this.rootId, canResume: false, canInteract: false, stepLimit: 'native', stepUnit: 'host-step', usageCompleteness: 'partial', details: {
      sourceVersion: version,
      stepLimit: { enforcement: 'native', scope: 'turn', unit: 'host-step' },
      resume: { mode: 'reconcile-only', preservesStepBudget: false },
      usage: { availability: 'terminal', cost: 'unknown' },
      readOnly: { enforcement: 'tool-allowlist', trustBoundary: 'DSH scoped Specflow tools with monotonic guard; no shell or subagents; not an operating-system sandbox' },
    } };
    try {
      const ctx = this.options.context;
      if (!ctx.agents?.create || !ctx.llm?.listProviders || !ctx.llm?.listModels || !ctx.sessions?.flush || !ctx.sessionPersistence?.open) throw new Error('DSH 缺少 agents、llm、sessions 或 sessionPersistence 服务');
      await mkdir(this.options.workspaceRoot, { recursive: true });
      const targets = await this.listTargets();
      return { ...base, available: targets.length > 0, readOnlyReview: true, reason: targets.length ? resumeReason : '请先在 DSH 中配置可用的模型提供方。' };
    } catch (error) { return { ...base, available: false, readOnlyReview: false, reason: (error as Error).message }; }
  }
  async listTargets(): Promise<ModelTarget[]> {
    const providers = this.options.context.llm.listProviders();
    const results = await Promise.allSettled(providers.map(async provider => (await this.options.context.llm.listModels(provider.id)).map(model => ({ backend: 'dsh' as const, rootId: this.rootId, connectionId: provider.id, connectionSlug: provider.name, model: model.id }))));
    return results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  }
  async prepare(input: FrozenInput): Promise<ExecutionRef> {
    return this.locked(`attempt:${input.attemptId}`, async () => {
      if (this.closed) throw new DomainError('DSH_CLOSED', 'DSH 插件正在关闭', 503);
      if (input.target.backend !== 'dsh' || input.target.rootId !== this.rootId) throw new DomainError('BACKEND_IDENTITY_CHANGED', '模型目标属于其他 DSH profile，请刷新模型目录', 409);
      if (!Number.isSafeInteger(input.maxSteps) || input.maxSteps <= 0) throw new DomainError('STEP_LIMIT_INVALID', '最大步数必须为正整数', 400);
      const workspace = await this.workspace(input.workspace);
      const sessionId = `sf_${hash(JSON.stringify([this.rootId, input.attemptId])).slice(0, 32)}`;
      const ref: ExecutionRef = { backend: 'dsh', rootId: this.rootId, sessionId, turnId: `${sessionId}_input` };
      const file = this.file(ref);
      let old: Journal | undefined;
      try { old = JSON.parse(await readFile(file, 'utf8')); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      if (old) {
        await this.load(ref);
        if (old.digest !== this.digest(input)) throw new DomainError('EXECUTION_INPUT_CHANGED', '原 DSH 尝试的冻结输入已变化', 409);
        return ref;
      }
      await this.save(file, { version: 1, ref, attemptId: input.attemptId, digest: this.digest(input), workspace, target: input.target, readOnly: input.readOnly, maxSteps: input.maxSteps, dispatch: 'prepared' } satisfies Journal);
      return ref;
    });
  }
  async start(ref: ExecutionRef, input: FrozenInput): Promise<ExecutionSnapshot> {
    return this.locked(ref.sessionId, async () => {
      if (this.closed) throw new DomainError('DSH_CLOSED', 'DSH 插件正在关闭', 503);
      const journal = await this.load(ref);
      if (journal.digest !== this.digest(input)) throw new DomainError('EXECUTION_INPUT_CHANGED', '原 DSH 尝试的冻结输入已变化', 409);
      if (journal.terminal) return journal.terminal;
      if (journal.dispatch !== 'prepared') return this.queryUnlocked(ref, journal);
      journal.dispatch = 'intent'; await this.save(this.file(ref), journal);
      // Persist intent BEFORE calling the host. A crash or lost receipt can
      // never cause a second create/followup for the same frozen attempt.
      let handle: DshAgentHandle | undefined;
      try {
        handle = await this.options.context.agents.create({ sessionId: ref.sessionId, meta: { cwd: journal.workspace }, agentOptions: { provider: journal.target.connectionId, model: journal.target.model }, setup: (ctx, agent) => this.setup(ctx, agent, journal) });
        this.assertSession(handle.agent.session, journal);
        this.handles.set(ref.sessionId, handle);
        // Agent creation awaits host setup. Plugin unload may have started
        // during that await; never release a prompt after close() began.
        if (this.closed) {
          journal.terminal = { state: 'cancelled', ref, terminalEventId: `${ref.sessionId}:closed-before-dispatch`, termination: { reason: 'unknown', confirmed: true, confirmedAt: new Date().toISOString() }, usageMeasurement: turnUsage(ref, { inputTokens: 0, outputTokens: 0, costUsd: 0 }, `${ref.sessionId}:closed-before-dispatch`) };
          await this.save(this.file(ref), journal); await handle.dispose(); this.handles.delete(ref.sessionId);
          return journal.terminal;
        }
        handle.agent.followup({ id: ref.turnId, role: 'user', content: [{ type: 'text', text: input.prompt }], source: { kind: 'user' } });
        journal.dispatch = 'accepted'; await this.save(this.file(ref), journal);
      } catch (error) {
        // Creation or dispatch may already have committed. Preserve uncertainty
        // and the original identity, including if the caller invokes start again.
        if (handle && this.handles.get(ref.sessionId) === handle) this.trackSettlement(ref, handle);
        else if (handle) await handle.dispose().catch(() => {});
        return { state: 'unknown', ref, error: `DSH 派发未确认，请核对原会话：${(error as Error).message}` };
      }
      this.trackSettlement(ref, handle);
      return { state: 'running', ref };
    });
  }
  private assertSession(session: DshSession, journal: Journal) {
    if (session.id !== journal.ref.sessionId || session.header.id !== journal.ref.sessionId || !session.header.cwd || !samePath(session.header.cwd, journal.workspace)) throw new DomainError('WORKSPACE_CHANGED', 'DSH 会话的工作区与原尝试不符', 409);
  }
  private setup(ctx: DshAgentContext, agent: DshAgent, journal: Journal) {
    // Scoped registrations remain visible through DSH's global tool mask. The
    // monotonic guard also excludes tools installed by other scoped plugins.
    ctx.tools.restrict({ allow: [] }); ctx.tools.presentAs('native');
    const tools = this.tools(journal);
    const allowed = new Set(tools.map(tool => tool.name));
    ctx.tools.guard(exec => allowed.has(exec.name) ? undefined : 'Specflow 会话只允许当前隔离工作区的专用工具');
    for (const tool of tools) ctx.tools.register(tool);
    let admittedSteps = 0;
    ctx.on('agent/pre-step', async ({ agent: subject }, next) => {
      if (subject !== agent) return next();
      if (admittedSteps >= journal.maxSteps) {
        await this.locked(journal.ref.sessionId, async () => { const current = await this.load(journal.ref); current.limitExceeded = true; current.stopRequested = true; current.stopRequestedAt ??= new Date().toISOString(); await this.save(this.file(journal.ref), current); });
        agent.cancel({ kind: 'hook', reason: 'Specflow maxSteps exceeded' });
        return { kind: 'reject' };
      }
      admittedSteps++;
      return next();
    });
  }
  private async settle(ref: ExecutionRef, handle: DshAgentHandle) {
    await handle.agent.whenIdle();
    await this.options.context.sessions.flush(handle.agent.session);
    await this.locked(ref.sessionId, async () => { await this.queryUnlocked(ref, await this.load(ref)); });
    if ((await this.load(ref)).terminal) { await handle.dispose(); this.handles.delete(ref.sessionId); }
  }
  private trackSettlement(ref: ExecutionRef, handle: DshAgentHandle) {
    const settled = this.settle(ref, handle).catch(() => {}).finally(() => this.settlements.delete(settled));
    this.settlements.add(settled);
  }
  private async events(journal: Journal): Promise<readonly DshEvent[]> {
    const live = this.options.context.agents.get(journal.ref.sessionId);
    if (live) { this.assertSession(live.session, journal); await this.options.context.sessions.flush(live.session); }
    const reader = await this.options.context.sessionPersistence.open(journal.ref.sessionId, 'read');
    try {
      if (reader.header.id !== journal.ref.sessionId || !reader.header.cwd || !samePath(reader.header.cwd, journal.workspace)) throw new DomainError('WORKSPACE_CHANGED', 'DSH 持久会话与隔离工作区不匹配', 409);
      return (await reader.read()).events;
    } finally { await reader.close(); }
  }
  private async queryUnlocked(ref: ExecutionRef, journal: Journal): Promise<ExecutionSnapshot> {
    if (journal.terminal) return { ...journal.terminal, termination: journal.terminal.termination || { reason: 'unknown', confirmed: !!journal.terminal.terminalEventId }, usageMeasurement: journal.terminal.usageMeasurement || unknownTurnUsage(ref, journal.terminal.terminalEventId) };
    if (journal.dispatch === 'prepared') return { state: 'unknown', ref, error: 'DSH 尝试尚未派发。' };
    let events: readonly DshEvent[];
    try { events = await this.events(journal); }
    catch (error) { return { state: 'unknown', ref, error: `无法核对原 DSH 会话：${(error as Error).message}` }; }
    const messageIndex = events.findIndex(event => event.type === 'user/message' && event.data.id === ref.turnId);
    if (messageIndex < 0) return { state: 'unknown', ref, error: '原 DSH 输入尚无持久接收凭据，不会自动重发。' };
    const start = events.slice(0, messageIndex).findLast(event => event.type === 'turn/start');
    const turn = start?.data.turn;
    if (typeof turn !== 'number') return { state: 'unknown', ref, error: 'DSH 输入缺少可核对的 turn 身份。' };
    const tail = events.slice(messageIndex + 1);
    const end = tail.find(event => event.type === 'turn/end' && event.data.turn === turn);
    const live = this.options.context.agents.get(ref.sessionId);
    if (!end) return live?.status === 'running' ? { state: 'running', ref } : { state: 'unknown', ref, error: '原 DSH turn 没有终态；请核对会话，不会自动重发。' };
    const messages = tail.filter(event => event.type === 'assistant/message' && event.data.turn === turn);
    const final = messages.findLast(event => !event.data.interrupted);
    const output = final?.data.message?.content?.filter((block: any) => block.type === 'text').map((block: any) => block.text).join('') || '';
    const terminalEventId = `${ref.sessionId}:${end.seq}`;
    const usageMeasurement = turnUsage(ref, { inputTokens: reportedSum(messages.map(event => reportedSum([event.data.usage?.inputTokens, event.data.usage?.cacheReadTokens ?? 0, event.data.usage?.cacheWriteTokens ?? 0], true)), true), outputTokens: reportedSum(messages.map(event => event.data.usage?.outputTokens), true), costUsd: null }, terminalEventId, end.seq);
    const usage = usageMeasurement.inputTokens !== null && usageMeasurement.outputTokens !== null ? { inputTokens: usageMeasurement.inputTokens, outputTokens: usageMeasurement.outputTokens, costUsd: null } : undefined;
    const reason = end.data.reason;
    let state: ExecutionSnapshot['state'] = 'failed', error: string | undefined;
    if (journal.limitExceeded) error = `DSH 执行达到最大 ${journal.maxSteps} 步，已停止。`;
    else if (reason?.kind === 'completed') { state = output ? 'completed' : 'failed'; if (!output) error = 'DSH turn 完成但未返回阶段结果。'; }
    else if (reason?.kind === 'aborted' && (journal.stopRequested || reason.reason?.kind === 'user')) state = 'cancelled';
    else if (reason?.kind === 'interrupted' || reason?.kind === 'forked' || (reason?.kind === 'aborted' && reason.reason?.kind === 'disposed')) return { state: 'unknown', ref, error: '原 DSH turn 被宿主中断；保留原身份，需人工核对后创建新尝试。' };
    else error = reason?.error?.message || `DSH turn 未成功完成（${reason?.kind || 'unknown'}）。`;
    const snapshot: ExecutionSnapshot = { state, ref, terminalEventId, output, ...(error ? { error } : {}), usage, usageMeasurement, termination: { reason: journal.limitExceeded ? 'step_limit' : reason?.kind === 'completed' ? 'natural_completion' : state === 'cancelled' ? 'user_cancelled' : 'unknown', confirmed: true, ...(journal.stopRequestedAt ? { requestedAt: journal.stopRequestedAt } : {}), confirmedAt: new Date().toISOString() } };
    journal.terminal = snapshot; await this.save(this.file(ref), journal);
    return snapshot;
  }
  async query(ref: ExecutionRef): Promise<ExecutionSnapshot> {
    return this.locked(ref.sessionId, async () => {
      const journal = await this.load(ref), snapshot = await this.queryUnlocked(ref, journal);
      if (!snapshot.termination && journal.stopRequested) snapshot.termination = { reason: journal.limitExceeded ? 'step_limit' : 'user_cancelled', confirmed: false, requestedAt: journal.stopRequestedAt };
      return snapshot;
    });
  }
  async *observe(ref: ExecutionRef): AsyncIterable<ExecutionUpdate> {
    let previous = '';
    while (!this.closed) {
      const snapshot = await this.query(ref), encoded = JSON.stringify(snapshot);
      if (encoded !== previous) { previous = encoded; yield { kind: ['completed', 'failed', 'cancelled'].includes(snapshot.state) ? 'terminal' : 'progress', snapshot }; }
      if (snapshot.state !== 'running' && snapshot.state !== 'waiting_interaction') return;
      await new Promise<void>(done => { const timer = setTimeout(done, this.options.pollIntervalMs ?? 750); timer.unref?.(); });
    }
  }
  async answer(_ref: ExecutionRef, _interactionId: string, _answer: unknown): Promise<void> { throw new DomainError('DSH_INTERACTION_UNSUPPORTED', '此版本把澄清问题保存在阶段产物中，不提供会话外的授权或问题回复', 409); }
  async stop(ref: ExecutionRef): Promise<void> {
    let handle: DshAgentHandle | undefined;
    await this.locked(ref.sessionId, async () => {
      const journal = await this.load(ref); if (journal.terminal) return;
      journal.stopRequested = true; journal.stopRequestedAt ??= new Date().toISOString(); await this.save(this.file(ref), journal);
      if (journal.dispatch === 'prepared') {
        journal.terminal = { state: 'cancelled', ref, terminalEventId: `${ref.sessionId}:cancel-before-dispatch`, termination: { reason: 'user_cancelled', confirmed: true, requestedAt: journal.stopRequestedAt, confirmedAt: new Date().toISOString() }, usageMeasurement: turnUsage(ref, { inputTokens: 0, outputTokens: 0, costUsd: 0 }, `${ref.sessionId}:cancel-before-dispatch`) };
        await this.save(this.file(ref), journal); return;
      }
      handle = this.handles.get(ref.sessionId);
      // Only the live handle held by this plugin grants cancellation authority.
      if (!handle) return;
      handle.agent.cancel({ kind: 'user' });
    });
    if (handle) { await handle.agent.whenIdle(); await this.query(ref); }
  }
  async planResume(ref: ExecutionRef): Promise<{ possible: boolean; reason?: string }> { await this.load(ref); return { possible: false, reason: resumeReason }; }
  async resume(_ref: ExecutionRef, _plan: unknown): Promise<ExecutionRef> { throw new DomainError('DSH_RESUME_UNSUPPORTED', resumeReason, 409); }
  async readResult(ref: ExecutionRef): Promise<ExecutionSnapshot> { return this.query(ref); }
  async close(): Promise<void> {
    if (this.closing) return this.closing;
    this.closed = true;
    this.closing = (async () => {
      // Includes any create() still awaiting unpublished host setup, and file
      // mutations already admitted before shutdown. Starts recheck closed after
      // create resolves and cannot dispatch while this drain is in progress.
      await Promise.allSettled([...this.locks.values()]);
      const handles = [...this.handles.values()];
      for (const handle of handles) handle.agent.cancel({ kind: 'disposed' });
      await Promise.allSettled(handles.map(handle => handle.dispose()));
      await Promise.allSettled([...this.settlements]); this.handles.clear();
    })();
    return this.closing;
  }
  private tools(journal: Journal): DshTool[] {
    const tool = (name: string, description: string, properties: Record<string, unknown>, required: string[], execute: (args: any, signal: AbortSignal) => Promise<string>, writes = false): DshTool => ({
      name, description, parameters: { type: 'object', properties, required, additionalProperties: false }, output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] }, isConcurrencySafe: () => !writes,
      execute: async (args, exec) => { exec.signal.throwIfAborted(); if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('工具参数必须为对象'); for (const key of required) if (typeof (args as any)[key] !== 'string') throw new Error(`${key} 必须为字符串`); return execute(args, exec.signal); },
    });
    const pathProperty = { type: 'string', description: 'Path relative to this attempt workspace.' };
    const tools = [
      tool('specflow_list_files', 'List a workspace directory, excluding .git and symbolic links. Returns at most 2000 entries.', { path: pathProperty }, ['path'], async (args, signal) => {
        const path = await this.toolPath(journal.workspace, args.path || '.');
        const entries = await readdir(path, { withFileTypes: true }); signal.throwIfAborted();
        return JSON.stringify(entries.filter(entry => entry.name.toLowerCase() !== '.git' && !entry.isSymbolicLink()).slice(0, 2000).map(entry => ({ name: entry.name, directory: entry.isDirectory() })));
      }),
      tool('specflow_read_file', 'Read a UTF-8 workspace file (maximum 1 MiB). Returns SHA-256 for guarded edits.', { path: pathProperty }, ['path'], async (args, signal) => {
        const path = await this.toolPath(journal.workspace, args.path), content = await this.readText(path, signal);
        return JSON.stringify({ path: relative(journal.workspace, path), sha256: hash(content), content });
      }),
    ];
    if (!journal.readOnly) {
      tools.push(tool('specflow_make_directory', 'Create one workspace directory. Its parent directory must already exist.', { path: pathProperty }, ['path'], async (args, signal) => {
        const path = await this.toolPath(journal.workspace, args.path, true); signal.throwIfAborted();
        await mkdir(path); return relative(journal.workspace, path);
      }, true));
      tools.push(tool('specflow_write_file', 'Write a UTF-8 file with an exact expected SHA-256. Empty expected_hash means create a new file. Parent directory must exist.', { path: pathProperty, expected_hash: { type: 'string' }, content: { type: 'string' } }, ['path', 'expected_hash', 'content'], async (args, signal) => this.mutate(journal.workspace, args.path, args.expected_hash, signal, () => args.content), true));
      tools.push(tool('specflow_edit_file', 'Replace one unique exact string in a previously read file, guarded by its SHA-256.', { path: pathProperty, expected_hash: { type: 'string' }, old_text: { type: 'string' }, new_text: { type: 'string' } }, ['path', 'expected_hash', 'old_text', 'new_text'], async (args, signal) => this.mutate(journal.workspace, args.path, args.expected_hash, signal, content => {
        if (!args.old_text || content.indexOf(args.old_text) < 0 || content.indexOf(args.old_text) !== content.lastIndexOf(args.old_text)) throw new Error('old_text 必须在文件中出现且只出现一次');
        return content.replace(args.old_text, () => args.new_text);
      }), true));
    }
    return tools;
  }
  private async toolPath(workspace: string, input: string, mayCreate = false): Promise<string> {
    if (isAbsolute(input) || input.includes('\0')) throw new Error('只允许工作区相对路径');
    const path = resolve(workspace, input), segments = relative(workspace, path).split(/[\\/]/);
    if (!within(workspace, path) || segments.some(segment => segment.toLowerCase() === '.git' || segment.includes(':'))) throw new Error('路径越过工作区或指向 .git/特殊路径');
    try {
      const actual = await realpath(path);
      if (!within(workspace, actual)) throw new Error('符号链接指向工作区之外');
      if (relative(workspace, actual).split(/[\\/]/).some(segment => segment.toLowerCase() === '.git')) throw new Error('实际路径指向 .git');
      return actual;
    }
    catch (error) {
      if (!mayCreate || (error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const parent = await realpath(dirname(path)); if (!within(workspace, parent)) throw new Error('父目录位于工作区之外');
      if (relative(workspace, parent).split(/[\\/]/).some(segment => segment.toLowerCase() === '.git')) throw new Error('父目录指向 .git');
      return join(parent, path.slice(dirname(path).length + 1));
    }
  }
  private async readText(path: string, signal: AbortSignal) {
    const handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
    try {
      // Work with the opened inode, rather than check one pathname and then
      // reopen a potentially different target for the actual read or write.
      if (!samePath(await realpath(path), path)) throw new Error('文件路径在打开时发生变化');
      return await this.readOpenedText(handle, signal);
    } finally { await handle.close(); }
  }
  private async readOpenedText(handle: FileHandle, signal: AbortSignal) {
    const info = await handle.stat(); if (!info.isFile() || info.nlink > 1 || info.size > maxFileBytes) throw new Error('只支持不超过 1 MiB 的普通 UTF-8 文件，拒绝硬链接');
    const bytes = await handle.readFile({ signal });
    if (!isUtf8(bytes) || bytes.includes(0) || bytes.length > maxFileBytes) throw new Error('文件不是支持的 UTF-8 文本或超出大小限制');
    return bytes.toString('utf8');
  }
  private async mutate(workspace: string, input: string, expected: string, signal: AbortSignal, change: (content: string) => string): Promise<string> {
    return this.locked(`file:${resolve(workspace, input)}`, async () => {
      if (expected !== '' && !/^[a-f0-9]{64}$/.test(expected)) throw new Error('expected_hash 必须为读取返回的 SHA-256，新文件使用空字符串');
      const validate = (next: string) => { if (typeof next !== 'string' || Buffer.byteLength(next) > maxFileBytes || next.includes('\0')) throw new Error('只能写入不超过 1 MiB 的 UTF-8 文本'); return next; };
      const newContent = expected === '' ? validate(change('')) : undefined;
      const path = await this.toolPath(workspace, input, true);
      signal.throwIfAborted();
      let handle: FileHandle;
      try { handle = await open(path, constants.O_RDWR | (constants.O_NOFOLLOW || 0) | (expected === '' ? constants.O_CREAT | constants.O_EXCL : 0), 0o600); }
      catch (error) { if (['ENOENT', 'EEXIST'].includes((error as NodeJS.ErrnoException).code || '')) throw new Error('文件内容已变化，请重新读取并确认 expected_hash'); throw error; }
      try {
        if (!samePath(await this.toolPath(workspace, input), path)) throw new Error('文件路径在打开时发生变化');
        const content = expected === '' ? '' : await this.readOpenedText(handle, signal);
        const info = await handle.stat(); if (!info.isFile() || info.nlink > 1) throw new Error('拒绝修改非普通文件或硬链接文件');
        if (expected !== '' && hash(content) !== expected) throw new Error('文件内容已变化，请重新读取并确认 expected_hash');
        const next = newContent ?? validate(change(content)), bytes = Buffer.from(next);
        let offset = 0;
        while (offset < bytes.length) { signal.throwIfAborted(); const result = await handle.write(bytes, offset, bytes.length - offset, offset); if (result.bytesWritten === 0) throw new Error('文件写入未取得进展'); offset += result.bytesWritten; }
        signal.throwIfAborted(); await handle.truncate(bytes.length); await handle.sync();
        return JSON.stringify({ path: relative(workspace, path), sha256: hash(next) });
      }
      finally { await handle.close(); }
    });
  }
}
