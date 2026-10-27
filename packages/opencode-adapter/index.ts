import { randomBytes } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { DomainError, hash, type ExecutionRef, type ModelTarget } from '../domain/index.ts';
import type { BackendCapabilities, ExecutionBackend, ExecutionSnapshot, ExecutionUpdate, FrozenInput } from '../execution-contract/index.ts';
import { reportedSum, turnUsage, unknownTurnUsage } from '../execution-contract/measurements.ts';

export interface OpenCodeOptions { baseUrl: string; username?: string; password?: string; stateDir: string; workspaceRoot: string; pollIntervalMs?: number }
type Rule = { permission: string; pattern: string; action: 'allow' | 'deny' | 'ask' };
type Message = { info: { id: string; sessionID: string; role: string; parentID?: string; finish?: string; error?: { name?: string; data?: { message?: string } }; time?: { completed?: number }; tokens?: { input?: number; output?: number }; cost?: number }; parts: { type: string; text?: string; state?: { status?: string; error?: string } }[] };
type Permission = { id: string; sessionID: string; permission: string; patterns: string[]; metadata: Record<string, unknown>; tool?: { messageID: string } };
type Question = { id: string; sessionID: string; questions: { question: string; options: { label: string; description: string }[]; multiple?: boolean; custom?: boolean }[]; tool?: { messageID: string } };
type Journal = { version: 1; attemptId: string; inputHash: string; inputDigest: string; workspace: string; ref: ExecutionRef; readOnly: boolean; maxSteps: number; permission: Rule[]; dispatch: 'prepared' | 'intent' | 'accepted'; dispatchedAt?: number; stopRequested?: boolean; stopRequestedAt?: string; limitExceeded?: boolean; userDenied?: boolean; approvals: number; terminal?: ExecutionSnapshot };
const resumeReason = 'OpenCode HTTP API 没有原运行的安全恢复协议；可以重新核对原会话状态，继续执行需创建新尝试。';
const limitation = 'OpenCode 步数采用会话轮询监测和工具授权预算，非原生硬上限；自动允许的读取及两次轮询之间可能继续执行。';
const readOnlyBoundary = '只读执行依赖可信的用户级 OpenCode 工具与插件配置；HTTP API 无法辨认同名工具覆盖，用户级插件仍可能越过工具权限。工作区本地配置与扩展在激活前拒绝；工程阶段另有工作树变化检查阻塞异常写入。';
const object = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const samePath = (left: string, right: string) => process.platform === 'win32' ? resolve(left).toLowerCase() === resolve(right).toLowerCase() : resolve(left) === resolve(right);

/** This connection addresses a user-started local server, never an arbitrary remote URL. */
export function normalizeOpenCodeUrl(value: string): string {
  let url: URL; try { url = new URL(value); } catch { throw new DomainError('OPENCODE_URL_INVALID', 'OpenCode 服务地址必须是有效的本机 HTTP(S) 地址', 400); }
  const host = url.hostname.toLowerCase();
  if (!['http:', 'https:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(host) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) {
    throw new DomainError('OPENCODE_URL_INVALID', 'OpenCode 服务地址只支持 localhost、127.0.0.1 或 [::1] 的 HTTP(S) 根地址，不接受内嵌凭据、路径或查询参数', 400);
  }
  return url.origin;
}

export class OpenCodeBackend implements ExecutionBackend {
  readonly baseUrl: string;
  readonly rootId: string;
  private readonly locks = new Map<string, Promise<unknown>>();
  private readonly timers = new Map<string, ReturnType<typeof setInterval>>();
  private closed = false;
  constructor(readonly options: OpenCodeOptions) {
    this.baseUrl = normalizeOpenCodeUrl(options.baseUrl);
    this.rootId = `opencode-${hash(JSON.stringify([this.baseUrl, resolve(options.stateDir), resolve(options.workspaceRoot), options.username || 'opencode'])).slice(0, 32)}`;
  }
  toolInstructions(input: { readOnly: boolean; clarification: boolean; locale?: 'zh-CN' | 'en' }): string {
    if (input.locale === 'en') return [
      'The execution backend is OpenCode. Use its native read, glob, grep, and list tools to read and search within the current isolated workspace; available tools are determined by the current session catalog.',
      input.readOnly ? 'This stage is read-only. Under the trusted user-level tool configuration, permission rules prohibit shell, editing, writing, tools outside the read allowlist, and subagents. Do not modify any files. Return the complete structured stage result directly.' : 'Use the edit, write, apply_patch, or bash tools provided by the current session for changes; operations may require the user to authorize them for this attempt. Restrict all files and commands to the current isolated workspace. Do not change to external directories or invoke subagents. Do not create or modify .opencode, opencode.json, or opencode.jsonc, to prevent executable configuration injection in the execution directory.',
      input.clarification ? 'Place requirements clarification questions in clarification.questions in the final stage JSON, following the specified structure. Do not substitute the question tool for requirements clarification records that must be saved.' : 'Use the question tool when the user must provide additional information during execution. The final result must be complete JSON following the stage contract.',
    ].join('\n');
    return [
      '执行底座为 OpenCode。使用其原生 read、glob、grep、list 工具在当前隔离工作区内读取和搜索；工具是否提供以当前会话工具目录为准。',
      input.readOnly ? '本阶段为只读阶段；在可信用户级工具配置下，权限规则禁止 shell、编辑、写入以及读取白名单以外的工具和子代理。不得修改任何文件；请直接输出要求的完整结构化阶段结果。' : '需要修改时使用当前会话提供的 edit、write、apply_patch 或 bash 工具，操作可能要求用户本次授权；所有文件和命令必须限制在当前隔离工作区内，禁止切换到外部目录或调用子代理。不得创建或修改 .opencode、opencode.json 或 opencode.jsonc，避免在执行目录注入可执行配置。',
      input.clarification ? '需求澄清问题应放在最终阶段 JSON 的 clarification.questions 中，遵守给定问题结构；避免用 question 工具替代需要保存的需求澄清记录。' : '执行过程中确需用户补充信息时可使用 question 工具；最终结果必须按阶段约定输出完整 JSON。',
    ].join('\n');
  }
  private async locked<T>(key: string, action: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(key) || Promise.resolve();
    const current = previous.catch(() => {}).then(action); this.locks.set(key, current);
    try { return await current; } finally { if (this.locks.get(key) === current) this.locks.delete(key); }
  }
  private async save(path: string, value: unknown) {
    await mkdir(resolve(this.options.stateDir), { recursive: true });
    const temp = `${path}.${randomBytes(6).toString('hex')}.tmp`;
    await writeFile(temp, JSON.stringify(value), { mode: 0o600 }); await rename(temp, path);
  }
  private file(ref: ExecutionRef) {
    if (ref.backend !== 'opencode' || ref.rootId !== this.rootId) throw new DomainError('BACKEND_IDENTITY_CHANGED', 'OpenCode 服务或配置来源已变化，不能继续原运行', 409);
    if (!/^msg_[a-zA-Z0-9]+$/.test(ref.turnId)) throw new DomainError('EXECUTION_REF_INVALID', 'OpenCode 执行引用无效', 400);
    return join(resolve(this.options.stateDir), `${ref.turnId}.json`);
  }
  private async workspace(path: string) {
    const root = await realpath(this.options.workspaceRoot), actual = await realpath(path), rel = relative(root, actual);
    if (rel === '..' || rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) || isAbsolute(rel)) throw new DomainError('WORKSPACE_OUTSIDE_ROOT', 'OpenCode 工作区必须位于 SpecFlow 工作区目录内', 400);
    return actual;
  }
  private async exists(path: string) {
    try { await lstat(path); return true; }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT' || (error as NodeJS.ErrnoException).code === 'ENOTDIR') return false; throw error; }
  }
  private async assertLocalConfigurationTrusted(workspace: string) {
    // OpenCode loads project configuration while initializing an instance, including
    // on /path. Inspect on disk before ANY directory-scoped HTTP request so plugins
    // cannot execute before we discover them. A tool named `read` may otherwise be
    // overridden by arbitrary local code while retaining the read permission name.
    let current = await realpath(workspace);
    const userHome = await realpath(homedir());
    while (true) {
      const candidates = ['opencode.json', 'opencode.jsonc'];
      // ~/.opencode is OpenCode's documented user-level configuration, explicitly
      // trusted with the user-started server, rather than inherited project code.
      if (!samePath(current, userHome)) candidates.push('.opencode');
      for (const name of candidates) {
        if (await this.exists(join(current, name))) throw new DomainError('OPENCODE_UNTRUSTED_CONFIG', `OpenCode 执行目录或其项目祖先包含本地配置/扩展 ${join(current, name)}；为避免在权限建立前加载代码，已阻止工作区连接。请将经过信任审查的 OpenCode 配置移至用户级配置目录。`, 409);
      }
      // Do not trust a repository-controlled .git marker as a scanning boundary:
      // an invalid marker may be ignored by OpenCode's project discovery. Checking
      // every ancestor is conservative and avoids activating an inherited plugin.
      const parent = dirname(current); if (parent === current) return; current = parent;
    }
  }
  private async load(ref: ExecutionRef): Promise<Journal> {
    let journal: Journal; try { journal = JSON.parse(await readFile(this.file(ref), 'utf8')); } catch (error) { if (error instanceof DomainError) throw error; throw new DomainError('EXECUTION_NOT_FOUND', '没有此 OpenCode 执行的持久化记录，不能接管或重新派发', 409); }
    if (journal.version !== 1 || journal.ref.rootId !== ref.rootId || journal.ref.sessionId !== ref.sessionId || journal.ref.turnId !== ref.turnId) throw new DomainError('EXECUTION_REF_INVALID', 'OpenCode 会话引用与持久化记录不匹配', 409);
    if (await this.workspace(journal.workspace) !== journal.workspace) throw new DomainError('WORKSPACE_CHANGED', 'OpenCode 工作区路径已变化，不能继续原运行', 409);
    return journal;
  }
  private async request(path: string, workspace?: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<any> {
    if (this.closed) throw new DomainError('OPENCODE_CLOSED', 'OpenCode 连接已关闭', 503);
    if (workspace) await this.assertLocalConfigurationTrusted(workspace);
    const url = new URL(path, this.baseUrl); if (workspace) url.searchParams.set('directory', workspace);
    const headers: Record<string, string> = { accept: 'application/json' };
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (this.options.password) headers.authorization = `Basic ${Buffer.from(`${this.options.username || 'opencode'}:${this.options.password}`).toString('base64')}`;
    let response: Response;
    try { response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'error', signal: AbortSignal.timeout(10000) }); }
    catch { throw new DomainError('OPENCODE_UNREACHABLE', 'OpenCode 请求未确认：服务不可达、超时或返回了重定向；请核对原运行状态', 503); }
    if (!response.ok) throw new DomainError('OPENCODE_HTTP_ERROR', `OpenCode 请求失败（HTTP ${response.status}）`, response.status === 401 || response.status === 403 ? 401 : 503);
    if (response.status === 204) return undefined;
    try { return await response.json(); } catch { throw new DomainError('OPENCODE_PROTOCOL_ERROR', 'OpenCode 返回了无效的 JSON 响应', 503); }
  }
  private async identity(workspace: string) {
    const path = await this.request('/path', workspace);
    // OpenCode 1.19 exposes `state`; earlier releases call this location `data`.
    const dataPath = object(path) ? path.state ?? path.data : undefined;
    if (!object(path) || typeof dataPath !== 'string' || typeof path.config !== 'string' || typeof path.directory !== 'string') throw new DomainError('OPENCODE_PROTOCOL_ERROR', 'OpenCode 没有返回可核对的服务路径身份', 503);
    if (!samePath(path.directory, workspace)) throw new DomainError('WORKSPACE_CHANGED', 'OpenCode 服务返回的执行目录与 SpecFlow 工作区不符', 409);
    const identity = hash(JSON.stringify([this.rootId, dataPath, path.config]));
    await this.locked('identity', async () => {
      const file = join(resolve(this.options.stateDir), `identity-${this.rootId}.json`); let previous: { identity: string; rootId: string } | undefined;
      try { previous = JSON.parse(await readFile(file, 'utf8')); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      // Changing the configured endpoint is allowed, but old execution references remain bound to their root.
      if (previous?.rootId === this.rootId && previous.identity !== identity) throw new DomainError('BACKEND_IDENTITY_CHANGED', 'OpenCode 服务的数据或配置目录身份已变化，不能继续原运行', 409);
      if (!previous || previous.rootId !== this.rootId) await this.save(file, { identity, rootId: this.rootId });
    });
  }
  async inspect(): Promise<BackendCapabilities> {
    try {
      const health = await this.request('/global/health');
      if (health?.healthy !== true || typeof health.version !== 'string') throw new DomainError('OPENCODE_PROTOCOL_ERROR', 'OpenCode 健康检查响应无效', 503);
      await mkdir(this.options.workspaceRoot, { recursive: true }); await this.identity(await realpath(this.options.workspaceRoot));
      return { available: true, version: health.version, rootId: this.rootId, canResume: false, canInteract: true, readOnlyReview: true, stepLimit: 'observed', stepUnit: 'observed-step', usageCompleteness: 'partial', details: {
        sourceVersion: health.version,
        stepLimit: { enforcement: 'observed', scope: 'turn', unit: 'observed-step' },
        resume: { mode: 'reconcile-only', preservesStepBudget: false },
        usage: { availability: 'terminal', cost: 'reported' },
        readOnly: { enforcement: 'tool-allowlist', trustBoundary: readOnlyBoundary },
      }, reason: `${resumeReason} ${limitation} ${readOnlyBoundary}` };
    } catch (error) { return { available: false, version: 'unknown', rootId: this.rootId, canResume: false, canInteract: false, readOnlyReview: false, stepLimit: 'observed', reason: (error as Error).message }; }
  }
  async listTargets(): Promise<ModelTarget[]> {
    const workspace = await realpath(this.options.workspaceRoot); await this.identity(workspace);
    const catalog = await this.request('/provider', workspace);
    if (!Array.isArray(catalog?.all) || !Array.isArray(catalog?.connected)) throw new DomainError('OPENCODE_PROTOCOL_ERROR', 'OpenCode 模型目录响应无效', 503);
    return catalog.all.filter((p: any) => typeof p.id === 'string' && catalog.connected.includes(p.id) && object(p.models)).flatMap((p: any) => Object.entries(p.models).filter(([, m]) => object(m) && m.status !== 'deprecated').map(([model]) => ({ backend: 'opencode' as const, rootId: this.rootId, connectionId: p.id, connectionSlug: typeof p.name === 'string' ? p.name : p.id, model })));
  }
  private digest(input: FrozenInput) { return hash(JSON.stringify({ prompt: input.prompt, inputHash: input.inputHash, workspace: resolve(input.workspace), target: input.target, readOnly: input.readOnly, maxSteps: input.maxSteps })); }
  async prepare(input: FrozenInput): Promise<ExecutionRef> {
    return this.locked(`attempt:${input.attemptId}`, async () => {
      if (input.target.backend !== 'opencode' || input.target.rootId !== this.rootId) throw new DomainError('BACKEND_IDENTITY_CHANGED', '模型目标属于其他 OpenCode 服务，请刷新模型列表', 409);
      if (!Number.isSafeInteger(input.maxSteps) || input.maxSteps <= 0) throw new DomainError('STEP_LIMIT_INVALID', '执行步数必须为正整数', 400);
      const workspace = await this.workspace(input.workspace); await this.identity(workspace);
      const attemptFile = join(resolve(this.options.stateDir), `attempt-${hash(input.attemptId)}.json`);
      let previous: { turnId: string } | undefined; try { previous = JSON.parse(await readFile(attemptFile, 'utf8')); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      if (previous) {
        const old: Journal = JSON.parse(await readFile(join(resolve(this.options.stateDir), `${previous.turnId}.json`), 'utf8'));
        if (old.inputDigest !== this.digest(input) || old.ref.rootId !== this.rootId) throw new DomainError('EXECUTION_INPUT_CHANGED', '原 OpenCode 尝试的冻结输入或底座身份已变化', 409);
        if (!old.ref.sessionId) throw new DomainError('PREPARE_UNCERTAIN', 'OpenCode 会话创建结果未确认；请核对后创建新尝试', 409);
        await this.load(old.ref); return old.ref;
      }
      // Match OpenCode's ascending message-ID timestamp layout: its loop compares message IDs.
      const time = (BigInt(Date.now()) * 0x1000n & ((1n << 48n) - 1n)).toString(16).padStart(12, '0');
      const turnId = `msg_${time}${randomBytes(7).toString('hex')}`;
      const permission: Rule[] = [{ permission: '*', pattern: '*', action: input.readOnly ? 'deny' : 'ask' }, ...['read', 'glob', 'grep', 'list', 'question'].map(permission => ({ permission, pattern: '*', action: 'allow' as const })), { permission: 'external_directory', pattern: '*', action: 'deny' }, { permission: 'task', pattern: '*', action: 'deny' }];
      const ref: ExecutionRef = { backend: 'opencode', rootId: this.rootId, sessionId: '', turnId };
      const journal: Journal = { version: 1, attemptId: input.attemptId, inputHash: input.inputHash, inputDigest: this.digest(input), workspace, ref, readOnly: input.readOnly, maxSteps: input.maxSteps, permission, dispatch: 'prepared', approvals: 0 };
      await this.save(this.file(ref), journal); await this.save(attemptFile, { turnId });
      const session = await this.request('/session', workspace, { title: `SpecFlow ${input.attemptId}`, permission });
      if (typeof session?.id !== 'string' || !session.id.startsWith('ses') || typeof session.directory !== 'string' || JSON.stringify(session.permission) !== JSON.stringify(permission) || !samePath(session.directory, workspace)) throw new DomainError('OPENCODE_POLICY_UNCONFIRMED', 'OpenCode 未确认隔离会话的执行目录和权限规则，阶段未派发', 503);
      ref.sessionId = session.id; await this.save(this.file(ref), journal); return { ...ref };
    });
  }
  private watch(ref: ExecutionRef) {
    if (this.timers.has(ref.turnId) || this.closed) return;
    const timer = setInterval(() => { void this.query(ref).then(snapshot => { if (['completed', 'failed', 'cancelled', 'unknown'].includes(snapshot.state)) this.unwatch(ref); }).catch(() => this.unwatch(ref)); }, Math.max(50, this.options.pollIntervalMs || 1000));
    timer.unref(); this.timers.set(ref.turnId, timer);
  }
  private unwatch(ref: ExecutionRef) { const timer = this.timers.get(ref.turnId); if (timer) clearInterval(timer); this.timers.delete(ref.turnId); }
  async start(ref: ExecutionRef, input: FrozenInput): Promise<ExecutionSnapshot> {
    return this.locked(ref.turnId, async () => {
      const journal = await this.load(ref); if (journal.inputDigest !== this.digest(input)) throw new DomainError('EXECUTION_INPUT_CHANGED', 'OpenCode 阶段冻结输入已变化', 409);
      if (journal.terminal) return journal.terminal;
      if (journal.dispatch !== 'prepared') return this.queryJournal(journal);
      await this.identity(journal.workspace);
      journal.dispatch = 'intent'; journal.dispatchedAt = Date.now(); await this.save(this.file(ref), journal);
      try {
        await this.request(`/session/${encodeURIComponent(ref.sessionId)}/prompt_async`, journal.workspace, { messageID: ref.turnId, agent: 'build', model: { providerID: input.target.connectionId, modelID: input.target.model }, parts: [{ type: 'text', text: input.prompt }] });
        journal.dispatch = 'accepted'; await this.save(this.file(ref), journal); this.watch(ref); return { state: 'running', ref };
      } catch (error) { return { state: 'unknown', ref, error: `${(error as Error).message}；派发意图已保存，不会自动重新发送。` }; }
    });
  }
  private async terminal(journal: Journal, snapshot: ExecutionSnapshot) {
    snapshot.termination ??= { reason: journal.limitExceeded ? 'step_limit' : journal.userDenied ? 'permission_denied' : snapshot.state === 'completed' ? 'natural_completion' : snapshot.state === 'cancelled' && journal.stopRequested ? 'user_cancelled' : 'unknown', confirmed: !!snapshot.terminalEventId, ...(journal.stopRequestedAt ? { requestedAt: journal.stopRequestedAt } : {}), confirmedAt: new Date().toISOString() };
    snapshot.usageMeasurement ??= unknownTurnUsage(snapshot.ref, snapshot.terminalEventId);
    journal.terminal = snapshot; await this.save(this.file(journal.ref), journal); this.unwatch(journal.ref); return snapshot;
  }
  private async queryJournal(journal: Journal): Promise<ExecutionSnapshot> {
    const { ref, workspace } = journal;
    if (journal.terminal) return { ...journal.terminal, termination: journal.terminal.termination || { reason: 'unknown', confirmed: !!journal.terminal.terminalEventId }, usageMeasurement: journal.terminal.usageMeasurement || unknownTurnUsage(ref, journal.terminal.terminalEventId) };
    try {
      await this.identity(workspace);
      const session = await this.request(`/session/${encodeURIComponent(ref.sessionId)}`, workspace);
      if (session.id !== ref.sessionId || typeof session.directory !== 'string' || !samePath(session.directory, workspace) || JSON.stringify(session.permission) !== JSON.stringify(journal.permission)) throw new DomainError('OPENCODE_POLICY_CHANGED', 'OpenCode 原会话的目录或权限规则已变化，无法继续接管', 409);
      const messages: Message[] = await this.request(`/session/${encodeURIComponent(ref.sessionId)}/message`, workspace);
      const status = await this.request('/session/status', workspace);
      if (!Array.isArray(messages) || !object(status)) throw new DomainError('OPENCODE_PROTOCOL_ERROR', 'OpenCode 会话消息或状态响应无效', 503);
      const assistants = messages.filter(m => m.info?.role === 'assistant' && m.info.parentID === ref.turnId && m.info.sessionID === ref.sessionId);
      const ids = new Set(assistants.map(m => m.info.id));
      const last = assistants.at(-1); const active = ['busy', 'retry'].includes(status[ref.sessionId]?.type);
      const steps = assistants.reduce((sum, m) => sum + Math.max(1, m.parts.filter(p => p.type === 'step-start').length), 0);
      if (steps > journal.maxSteps && !journal.limitExceeded) { journal.limitExceeded = true; journal.stopRequested = true; journal.stopRequestedAt ??= new Date().toISOString(); await this.save(this.file(ref), journal); await this.request(`/session/${encodeURIComponent(ref.sessionId)}/abort`, workspace, {}); }
      const usageMeasurement = turnUsage(ref, { inputTokens: reportedSum(assistants.map(m => m.info.tokens?.input), true), outputTokens: reportedSum(assistants.map(m => m.info.tokens?.output), true), costUsd: reportedSum(assistants.map(m => m.info.cost)) });
      const usage = usageMeasurement.inputTokens !== null && usageMeasurement.outputTokens !== null ? { inputTokens: usageMeasurement.inputTokens, outputTokens: usageMeasurement.outputTokens, costUsd: usageMeasurement.costUsd } : undefined;
      // Never infer success merely from an idle server: completion must belong to our exact message.
      if (!active && last?.info.time?.completed && last.info.error) {
        const aborted = last.info.error.name === 'MessageAbortedError';
        return this.terminal(journal, { state: journal.limitExceeded ? 'failed' : aborted ? 'cancelled' : 'failed', ref, terminalEventId: `${last.info.id}:${last.info.time.completed}`, usage, usageMeasurement: { ...usageMeasurement, eventId: `${last.info.id}:${last.info.time.completed}`, sequence: last.info.time.completed }, error: journal.limitExceeded ? 'OpenCode 观测步数超过阶段预算，已停止原会话' : last.info.error.data?.message || last.info.error.name || 'OpenCode 执行失败' });
      }
      if (!active && last?.info.time?.completed && last.info.finish && !['tool-calls', 'unknown'].includes(last.info.finish)) {
        const output = last.parts.filter(p => p.type === 'text' && typeof p.text === 'string').map(p => p.text).join('');
        return this.terminal(journal, { state: journal.limitExceeded ? 'failed' : 'completed', ref, terminalEventId: `${last.info.id}:${last.info.time.completed}`, output, ...(journal.limitExceeded ? { error: 'OpenCode 观测步数超过阶段预算' } : {}), usage, usageMeasurement: { ...usageMeasurement, eventId: `${last.info.id}:${last.info.time.completed}`, sequence: last.info.time.completed } });
      }
      const permissions: Permission[] = await this.request('/permission', workspace), questions: Question[] = await this.request('/question', workspace);
      if (!Array.isArray(permissions) || !Array.isArray(questions)) throw new DomainError('OPENCODE_PROTOCOL_ERROR', 'OpenCode 交互响应无效', 503);
      const owns = (p: Permission | Question) => p.sessionID === ref.sessionId && (!p.tool || ids.has(p.tool.messageID));
      const pending = permissions.filter(owns);
      if (journal.readOnly && pending.some(p => !['read', 'glob', 'grep', 'list', 'question'].includes(p.permission))) {
        for (const p of pending) await this.request(`/permission/${encodeURIComponent(p.id)}/reply`, workspace, { reply: 'reject' });
        throw new DomainError('OPENCODE_READONLY_VIOLATION', '只读 OpenCode 会话出现不允许的工具授权请求，已拒绝', 409);
      }
      const interactions = [...pending.map(p => ({ id: `permission:${p.id}`, request: { kind: 'permission', prompt: { toolName: p.permission, args: p.metadata, hint: `允许执行 ${p.permission}：${p.patterns.join(', ')}` } } })), ...questions.filter(owns).map(q => ({ id: `question:${q.id}`, request: { kind: 'question', questions: q.questions } }))];
      if (interactions.length) return { state: 'waiting_interaction', ref, interactions };
      // Permission rejection can end OpenCode's loop with finish=tool-calls, without
      // a second assistant message. Completed tool errors + idle are terminal failure
      // evidence, never a successful stage result.
      const toolErrors = last?.parts.filter(p => p.type === 'tool' && p.state?.status === 'error').map(p => p.state?.error || '工具调用失败') || [];
      if (!active && last?.info.time?.completed && last.info.finish === 'tool-calls' && toolErrors.length) return this.terminal(journal, { state: journal.userDenied ? 'cancelled' : 'failed', ref, terminalEventId: `${last.info.id}:${last.info.time.completed}`, usage, usageMeasurement: { ...usageMeasurement, eventId: `${last.info.id}:${last.info.time.completed}`, sequence: last.info.time.completed }, error: journal.userDenied ? '用户拒绝了 OpenCode 工具操作，原会话已终止' : `OpenCode 工具调用失败：${toolErrors.join('\n')}` });
      if (active || (journal.dispatch === 'accepted' && Date.now() - (journal.dispatchedAt || 0) < 2000)) return { state: 'running', ref };
      return { state: 'unknown', ref, error: journal.dispatch === 'prepared' ? 'OpenCode 会话已准备，阶段尚未派发' : 'OpenCode 会话空闲，但缺少绑定本次消息的终止凭据；不会自动重新发送或恢复' };
    } catch (error) { return { state: 'unknown', ref, error: (error as Error).message }; }
  }
  async query(ref: ExecutionRef): Promise<ExecutionSnapshot> {
    return this.locked(ref.turnId, async () => {
      const journal = await this.load(ref), snapshot = await this.queryJournal(journal);
      if (!snapshot.termination && journal.stopRequested) snapshot.termination = { reason: journal.limitExceeded ? 'step_limit' : 'user_cancelled', confirmed: false, requestedAt: journal.stopRequestedAt };
      return snapshot;
    });
  }
  async readResult(ref: ExecutionRef) { return this.query(ref); }
  async *observe(ref: ExecutionRef): AsyncIterable<ExecutionUpdate> {
    while (!this.closed) { const snapshot = await this.query(ref); yield { kind: ['completed', 'failed', 'cancelled'].includes(snapshot.state) ? 'terminal' : snapshot.state === 'waiting_interaction' ? 'interaction' : 'progress', snapshot }; if (!['running', 'waiting_interaction'].includes(snapshot.state)) return; await new Promise(done => setTimeout(done, Math.max(50, this.options.pollIntervalMs || 1000))); }
  }
  async answer(ref: ExecutionRef, interactionId: string, answer: unknown): Promise<void> {
    return this.locked(ref.turnId, async () => {
      const journal = await this.load(ref); const snapshot = await this.queryJournal(journal);
      if (!snapshot.interactions?.some(i => i.id === interactionId)) throw new DomainError('INTERACTION_NOT_PENDING', '此 OpenCode 请求已结束或不属于当前运行', 409);
      if (!object(answer)) throw new DomainError('INTERACTION_ANSWER_INVALID', 'OpenCode 交互答复无效', 400);
      const [kind, requestId] = interactionId.split(':');
      if (kind === 'permission') {
        if (answer.kind !== 'permission' || !['allow', 'deny'].includes(answer.decision) || answer.rememberForTurn === true) throw new DomainError('INTERACTION_ANSWER_INVALID', 'OpenCode 仅支持本次允许或拒绝工具授权', 400);
        if (answer.decision === 'allow' && journal.approvals >= journal.maxSteps) throw new DomainError('STEP_LIMIT_REACHED', 'OpenCode 工具授权预算已用完，请停止原尝试', 409);
        if (answer.decision === 'allow') journal.approvals++; else journal.userDenied = true;
        await this.save(this.file(ref), journal);
        await this.request(`/permission/${encodeURIComponent(requestId)}/reply`, journal.workspace, { reply: answer.decision === 'allow' ? 'once' : 'reject' });
      } else if (kind === 'question') {
        const questions: Question[] = await this.request('/question', journal.workspace); const question = questions.find(q => q.id === requestId && q.sessionID === ref.sessionId);
        if (!question || answer.kind !== 'question' || !Array.isArray(answer.answers) || answer.answers.length !== question.questions.length || answer.answers.some((a: unknown) => typeof a !== 'string' || !a.trim())) throw new DomainError('INTERACTION_ANSWER_INVALID', '请按顺序完整回答 OpenCode 问题', 400);
        if (question.questions.some((q, i) => q.custom === false && !q.options.some(o => o.label === answer.answers[i]))) throw new DomainError('INTERACTION_ANSWER_INVALID', 'OpenCode 问题要求选择给定选项', 400);
        await this.request(`/question/${encodeURIComponent(requestId)}/reply`, journal.workspace, { answers: answer.answers.map((a: string) => [a]) });
      } else throw new DomainError('INTERACTION_ANSWER_INVALID', 'OpenCode 交互类型无效', 400);
      this.watch(ref);
    });
  }
  async stop(ref: ExecutionRef): Promise<void> {
    return this.locked(ref.turnId, async () => { const journal = await this.load(ref); if (journal.terminal) return; await this.identity(journal.workspace); journal.stopRequested = true; journal.stopRequestedAt ??= new Date().toISOString(); await this.save(this.file(ref), journal); if (journal.dispatch === 'prepared') { await this.terminal(journal, { state: 'cancelled', ref, terminalEventId: `${ref.turnId}:not-dispatched`, usageMeasurement: turnUsage(ref, { inputTokens: 0, outputTokens: 0, costUsd: 0 }, `${ref.turnId}:not-dispatched`) }); return; } await this.request(`/session/${encodeURIComponent(ref.sessionId)}/abort`, journal.workspace, {}); this.watch(ref); });
  }
  async planResume(ref: ExecutionRef) { await this.load(ref); return { possible: false, reason: resumeReason }; }
  async resume(ref: ExecutionRef, _plan: unknown): Promise<ExecutionRef> { await this.load(ref); throw new DomainError('RESUME_UNSUPPORTED', resumeReason, 409); }
  async close() { this.closed = true; for (const timer of this.timers.values()) clearInterval(timer); this.timers.clear(); }
}
