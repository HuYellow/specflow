import { z } from 'zod';
import { DomainError, hash } from '../../../packages/domain/index.ts';
import type { EngineeringService } from '../../../packages/specflow-core/index.ts';
import { clientRequestSchema, type ConnectionFetchRoute } from '@deepseek-ai/dsh-client-connection';
import { commandOperations, COMMAND_ENDPOINT, PLUGIN_VERSION, READ_ENDPOINT, readResources } from './protocol.ts';
import type { SpecflowBootstrap } from './protocol.ts';
import { normalizeLocale, translate, type Locale } from '../../../packages/i18n/index.ts';
import { localizeApiResponse } from '../../../apps/server/src/localization.ts';

const entityId = z.string().min(1).max(256);
const revision = z.number().int().positive();
const target = z.object({ backend: z.literal('dsh'), connectionId: entityId, connectionSlug: entityId, model: entityId, rootId: entityId.optional() }).strict();
const document = z.object({ id: entityId, name: z.string().min(1).max(200), content: z.string().min(1).max(2_000_000), source: z.enum(['upload', 'repository', 'pasted']), repositoryPath: z.string().max(1000).optional() }).strict();
const localeField = z.enum(['zh-CN', 'en']).optional();
const readRequest = z.object({ resource: z.enum(readResources), id: entityId.optional(), after: z.number().int().nonnegative().safe().optional(), locale: localeField }).strict();
const commandRequest = z.object({ operation: z.enum(commandOperations), id: entityId.optional(), input: z.unknown().optional(), idempotencyKey: z.string().min(1).max(128), locale: localeField }).strict();
const inputRevision = z.object({ expectedRevision: revision }).strict();
const empty = z.object({}).strict();

/** The same domain service and gates used by the desktop application. */
export class SpecflowApi {
  private readonly inFlight = new Set<string>();
  private closing = false;
  private readonly requests = new Set<Promise<unknown>>();
  constructor(readonly service: EngineeringService) {}

  /** Stop admitting new calls and drain already admitted domain operations. */
  async close(): Promise<void> {
    this.closing = true;
    await Promise.allSettled([...this.requests]);
  }
  private track<T>(operation: () => Promise<T>): Promise<T> {
    if (this.closing) return Promise.reject(new DomainError('PLUGIN_STOPPING', 'Specflow 插件正在停用', 503));
    const request = operation();
    this.requests.add(request);
    void request.finally(() => this.requests.delete(request)).catch(() => {});
    return request;
  }

  read(raw: unknown, fallbackLocale: Locale = 'zh-CN'): Promise<unknown> {
    return this.track(async () => {
      const request = readRequest.parse(raw);
      const locale = request.locale || fallbackLocale;
      const localize = (path: string, value: unknown) => localizeApiResponse(path, 200, value, locale);
      const id = () => entityId.parse(request.id);
      switch (request.resource) {
        case 'bootstrap': return { version: PLUGIN_VERSION, canWrite: true, projects: this.service.store.list('projects'), workItems: this.service.store.list('workItems'), catalog: localize('/api/backend/targets', await this.service.backendCatalog()) as SpecflowBootstrap['catalog'] } satisfies SpecflowBootstrap;
        case 'snapshot': return localize(`/api/work-items/${id()}`, await this.service.snapshot(id()));
        case 'artifact': return this.service.artifacts.reading(id(), locale);
        case 'readiness': return localize(`/api/node-runs/${id()}/readiness`, await this.service.readiness(id()));
        case 'attempt': return localize(`/api/attempts/${id()}`, this.service.attemptDetail(id()));
        case 'candidateDiff': {
          const candidate = this.service.store.get('candidates', id());
          return { candidate, diff: await this.service.workspaces.diff(candidate.workspace, candidate.baseCommit) };
        }
        case 'acceptancePrecheck': return localize(`/api/code-candidates/${id()}/acceptance-precheck`, await this.service.acceptancePrecheck(id()));
        case 'events': {
          const after = request.after ?? 0;
          const cursor = this.service.store.eventCursor(after);
          if (!cursor.recoverable) throw new DomainError('EVENT_RESYNC_REQUIRED', '请重新读取 Specflow 快照', 409, cursor);
          return { ...cursor, events: this.service.store.events(after) };
        }
      }
    });
  }

  command(raw: unknown, fallbackLocale: Locale = 'zh-CN'): Promise<unknown> {
    return this.track(async () => {
      const request = commandRequest.parse(raw);
      const signature = `${request.operation}:${request.id ?? ''}:${hash(JSON.stringify(request.input ?? {}))}`;
      const previous = this.service.store.receipt(request.idempotencyKey, signature);
      if (previous !== undefined) return previous;
      if (this.inFlight.has(request.idempotencyKey)) throw new DomainError('REQUEST_IN_PROGRESS', '相同命令正在执行');
      this.inFlight.add(request.idempotencyKey);
      try {
        const result = await this.execute(request.operation, request.id, request.input ?? {}, request.locale || fallbackLocale);
        this.service.store.saveReceipt(request.idempotencyKey, signature, result ?? {});
        return result ?? {};
      } finally { this.inFlight.delete(request.idempotencyKey); }
    });
  }

  private async execute(operation: typeof commandOperations[number], rawId: string | undefined, input: unknown, locale: Locale): Promise<unknown> {
    const id = () => entityId.parse(rawId);
    switch (operation) {
      case 'registerProject': {
        const body = z.object({ rootPath: z.string().min(1).max(4000), name: z.string().min(1).max(200).optional() }).strict().parse(input);
        return this.service.registerProject(body.rootPath, body.name, false, locale);
      }
      case 'configureProject': {
        const body = z.object({ expectedRevision: revision, executionBackend: z.literal('dsh').optional(), rules: z.string().max(100_000), commands: z.array(z.object({ id: z.string().regex(/^[a-z][a-z0-9_-]*$/), executable: z.string().min(1).max(4000), args: z.array(z.string().max(4000)).max(100), timeoutMs: z.number().int().min(100).max(600_000) }).strict()).min(1).max(20), defaults: z.object({ analyst: target.optional(), architect: target.optional(), developer: target.optional(), reviewer: target.optional() }).strict() }).strict().parse(input);
        const { expectedRevision, ...patch } = body;
        return this.service.configureProject(id(), expectedRevision, { ...patch, executionBackend: 'dsh' });
      }
      case 'createWorkItem': {
        const body = z.object({ projectId: entityId, name: z.string().min(1).max(200), request: z.string().max(2_000_000).default(''), kind: z.enum(['feature', 'bug', 'refactor']).default('feature'), documents: z.array(document).max(20).default([]) }).strict().parse(input);
        return this.service.createWorkItem(body.projectId, body.name, body.request, body.kind, body.documents, locale);
      }
      case 'saveRequirements': {
        const body = z.object({ expectedRevisionId: entityId, request: z.string().max(2_000_000), documents: z.array(document).max(20) }).strict().parse(input);
        return this.service.saveRequirements(id(), body.expectedRevisionId, body.request, body.documents);
      }
      case 'createRun': {
        const body = z.object({ workflowId: entityId }).strict().parse(input);
        return this.service.createRun(body.workflowId);
      }
      case 'startNode': {
        const body = z.object({ expectedRevision: revision, target: target.optional() }).strict().parse(input);
        return this.service.startNode(id(), body.expectedRevision, body.target);
      }
      case 'stopAttempt': empty.parse(input); return this.service.stopAttempt(id());
      case 'stopVerification': empty.parse(input); return this.service.stopVerification(id());
      case 'confirmVerificationStopped': {
        const body = z.object({ expectedRevision: revision, reason: z.string().trim().min(1).max(4000) }).strict().parse(input);
        return this.service.confirmVerificationStopped(id(), body.expectedRevision, body.reason);
      }
      case 'confirmNodeVerificationStopped': {
        const body = z.object({ expectedRevision: revision, reason: z.string().trim().min(1).max(4000) }).strict().parse(input);
        return this.service.confirmNodeVerificationStopped(id(), body.expectedRevision, body.reason);
      }
      case 'startRepair': {
        const body = z.object({ expectedRevision: revision, maxRounds: z.number().int().min(1).max(10).optional(), mode: z.enum(['code', 'output']).optional() }).strict().parse(input);
        return this.service.automation.startRepair(id(), body.expectedRevision, { maxRounds: body.maxRounds, mode: body.mode });
      }
      case 'stopRepair': empty.parse(input); return this.service.automation.stopRepair(id());
      case 'startAutomation': {
        const body = z.object({ expectedRevision: revision, autoAdvance: z.boolean(), autoRepair: z.boolean(), maxRepairRounds: z.number().int().min(1).max(10) }).strict().parse(input);
        return this.service.automation.startAutomation(id(), body.expectedRevision, { autoAdvance: body.autoAdvance, autoRepair: body.autoRepair, maxRepairRounds: body.maxRepairRounds });
      }
      case 'stopAutomation': empty.parse(input); return this.service.automation.stopAutomation(id());
      case 'reconcileAttempt': empty.parse(input); await this.service.reconcile(id()); return this.service.store.get('attempts', id());
      case 'resumeAttempt': empty.parse(input); return this.service.resumeAttempt(id());
      case 'answerInteraction': {
        const body = z.object({ answer: z.unknown() }).strict().parse(input);
        return this.service.answerInteraction(id(), body.answer);
      }
      case 'answerClarification': {
        const body = z.object({ expectedRevision: revision, answers: z.array(z.object({ questionId: entityId, answer: z.string().min(1).max(4000) }).strict()).min(1).max(5), target: target.optional() }).strict().parse(input);
        return this.service.answerClarification(id(), body.expectedRevision, body.answers, body.target);
      }
      case 'saveClarificationDraft': {
        const body = z.object({ expectedRevision: z.number().int().nonnegative(), answers: z.record(z.string(), z.string().max(4000)) }).strict().parse(input);
        return this.service.saveClarificationDraft(id(), body.expectedRevision, body.answers);
      }
      case 'restartClarification': {
        const body = inputRevision.parse(input);
        return this.service.restartClarification(id(), body.expectedRevision);
      }
      case 'editArtifact': {
        const body = z.object({ expectedRevision: revision, content: z.string().max(2_000_000) }).strict().parse(input);
        const artifact = this.service.store.get('artifacts', id());
        const current = this.service.store.get('artifactRevisions', artifact.currentRevisionId);
        return this.service.artifacts.create(artifact.workItemId, artifact.logicalId, body.content, current.inputs, undefined, body.expectedRevision);
      }
      case 'acceptArtifact': {
        const body = z.object({ expectedRevision: revision, reason: z.string().max(4000).default('') }).strict().parse(input);
        return this.service.acceptArtifact(id(), body.expectedRevision, 'dsh-owner', body.reason);
      }
      case 'verifyCandidate': empty.parse(input); return this.service.verifyCandidate(id());
      case 'acceptCode': {
        empty.parse(input);
        const candidate = this.service.store.get('candidates', id());
        return this.service.acceptCode(candidate.workItemId, 'dsh-owner', candidate.id);
      }
      case 'resolveFinding': {
        const body = z.object({ status: z.enum(['resolved', 'waived']), reason: z.string().min(1).max(4000), evidenceId: entityId.optional() }).strict().parse(input);
        return this.service.resolveFinding(id(), body.status, body.reason, body.evidenceId);
      }
    }
  }
}

export function failureOf(error: unknown, locale: Locale = 'zh-CN'): { code: string; message: string; details: object } {
  if (error instanceof DomainError) {
    const translated = localizeApiResponse('/api/plugin', error.status, { code: error.code, message: error.message, details: error.details }, locale) as { message: string; details: unknown };
    return { code: error.code, message: translated.message, details: { status: error.status, ...(error.details === undefined ? {} : { cause: translated.details }) } };
  }
  if (error instanceof z.ZodError) return { code: 'INVALID_REQUEST', message: translate('请求字段不符合 Specflow 契约', locale), details: { issues: error.issues } };
  return { code: 'SPECFLOW_FAILURE', message: translate(error instanceof Error ? error.message : 'Specflow 操作失败', locale), details: {} };
}

/** Exact shared Fetch routes are authenticated by Connection on HTTP and IPC;
 * Connection rejects every non-owner Peer before invoking their callbacks.
 * The Gateway owns the single /api interceptor, so plugins must not claim it.
 */
export function createSpecflowFetchRoute(api: SpecflowApi, endpoint: typeof READ_ENDPOINT | typeof COMMAND_ENDPOINT): ConnectionFetchRoute {
  return {
    path: `/api/${endpoint}`, methods: ['POST'], requestBody: 'buffered',
    async fetch(request) {
      let locale = normalizeLocale(request.headers.get('accept-language'));
      const response = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Content-Language': locale, Vary: 'Accept-Language' } });
      let raw: unknown;
      try { raw = await request.json(); } catch { return response({ code: 'INVALID_REQUEST', message: translate('请求必须为 JSON', locale) }, 400); }
      const parsed = clientRequestSchema.safeParse(raw);
      if (!parsed.success) return response({ code: 'INVALID_REQUEST', message: translate('Connection RPC envelope 无效', locale) }, 400);
      const message = parsed.data;
      const explicit = message.payload && typeof message.payload === 'object' && 'locale' in message.payload ? message.payload.locale : undefined;
      if (explicit === 'en' || explicit === 'zh-CN') locale = explicit;
      const fail = (error: unknown) => response({ type: 'server-response', rpcId: message.rpcId, result: { ok: false, error: failureOf(error, locale) } });
      if (message.method !== endpoint) return fail(new DomainError('INVALID_REQUEST', 'RPC endpoint 与 method 不一致', 400));
      if (request.signal.aborted) return fail(new DomainError('REQUEST_CANCELLED', '请求已取消', 400));
      try {
        const value = endpoint === READ_ENDPOINT ? await api.read(message.payload, locale) : await api.command(message.payload, locale);
        return response({ type: 'server-response', rpcId: message.rpcId, result: { ok: true, value } });
      } catch (error) { return fail(error); }
    },
  };
}
