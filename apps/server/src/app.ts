import Fastify from 'fastify';
import staticFiles from '@fastify/static';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { DomainError, compileWorkflow, hash, type WorkflowDefinition } from '../../../packages/domain/index.ts';
import { EngineeringService } from './service.ts';
import { MakaBackend } from '../../../packages/maka-adapter/index.ts';

const target = z.object({ backend: z.enum(['maka', 'sandbox']), connectionId: z.string().min(1), connectionSlug: z.string().min(1), model: z.string().min(1), rootId: z.string().optional() });
const command = z.object({ id: z.string().regex(/^[a-z][a-z0-9_-]*$/), executable: z.string().min(1), args: z.array(z.string()), timeoutMs: z.number().int().min(100).max(600000) });
const workflowSchema = z.object({ schemaVersion: z.literal(1), id: z.string().min(1), name: z.string().min(1),
  nodes: z.array(z.object({ id: z.string().regex(/^[a-z][a-z0-9_-]*$/), name: z.string().min(1), type: z.enum(['agent', 'clarify', 'review', 'verify', 'gate', 'human']), role: z.enum(['analyst', 'architect', 'developer', 'reviewer']).optional(), prompt: z.string(), inputs: z.array(z.string()), outputs: z.array(z.string().regex(/^[a-z][a-z0-9_-]*$/)), target: target.optional(), requireAcceptance: z.boolean().optional(), taskMode: z.boolean().optional(), maxSteps: z.number().int().min(1).max(100).optional(), timeoutMs: z.number().int().min(1000).max(900000).optional() })).min(1),
  roles: z.object({ analyst: target.optional(), architect: target.optional(), developer: target.optional(), reviewer: target.optional() }), requiredVerification: z.array(z.string()), requireReview: z.boolean(), requireClarification: z.boolean().optional() });
const revisionBody = z.object({ expectedRevision: z.number().int().positive() });
const requirementDocument = z.object({ id: z.string().min(1).max(100), name: z.string().min(1).max(200), content: z.string().min(1), source: z.enum(['upload', 'repository', 'pasted']), repositoryPath: z.string().max(1000).optional() });
const param = (request: any, name = 'id'): string => String(request.params[name]);

export async function createApp(service: EngineeringService, options: { staticRoot?: string; token?: string; desktopSecret?: string } = {}) {
  const app = Fastify({ logger: false, bodyLimit: 5 * 1024 * 1024 });
  const token = options.token || randomBytes(32).toString('hex');
  if (options.desktopSecret) app.addHook('onSend', async (_request, reply, payload) => {
    if (!reply.hasHeader('Content-Security-Policy')) reply.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    return payload;
  });
  app.addHook('onRequest', async (request, reply) => {
    // Desktop requests are authenticated by the main process, including bootstrap and assets.
    if (options.desktopSecret && request.headers['x-specflow-desktop-secret'] !== options.desktopSecret) return reply.code(403).send({ code: 'DESKTOP_SESSION_REQUIRED', message: '请通过 SpecFlow 桌面应用访问' });
    if (!request.url.startsWith('/api/')) return;
    const origin = request.headers.origin;
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(request.hostname)) return reply.code(403).send({ code: 'HOST_REJECTED', message: '请通过本地地址访问' });
    const localOrigin = `http://${request.headers.host}`;
    const developmentOrigins = options.desktopSecret ? [] : ['http://127.0.0.1:4318', 'http://localhost:4318'];
    if (origin && origin !== localOrigin && !developmentOrigins.includes(origin)) return reply.code(403).send({ code: 'ORIGIN_REJECTED', message: '本地工程接口不接受此来源' });
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers['x-specflow-token'] !== token) return reply.code(403).send({ code: 'SESSION_REQUIRED', message: '本地应用会话已过期，请刷新页面' });
  });
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof DomainError) return reply.code(error.status).send({ code: error.code, message: error.message, details: error.details });
    if (error instanceof z.ZodError) return reply.code(400).send({ code: 'INVALID_REQUEST', message: '请求字段不符合契约', details: error.issues });
    return reply.code(500).send({ code: 'INTERNAL_FAILURE', message: error instanceof Error ? error.message : '内部操作失败' });
  });
  const commandRoute = (url: string, handler: (request: any) => Promise<unknown> | unknown) => {
    app.post(url, async request => {
      const key = request.headers['idempotency-key'];
      if (typeof key !== 'string' || !key || key.length > 128) throw new DomainError('IDEMPOTENCY_REQUIRED', '写操作需要幂等键', 400);
      const operation = `${request.url}:${hash(JSON.stringify(request.body || {}))}`;
      const stored = service.store.receipt(key, operation); if (stored !== undefined) return stored;
      // An in-flight duplicate is rejected before invoking asynchronous workspace operations.
      if (inFlight.has(key)) throw new DomainError('REQUEST_IN_PROGRESS', '同一个操作正在执行');
      inFlight.add(key);
      try { const result = await handler(request); service.store.saveReceipt(key, operation, result ?? {}); return result ?? {}; }
      finally { inFlight.delete(key); }
    });
  };
  const inFlight = new Set<string>();
  app.get('/api/bootstrap', async () => ({ token, projects: service.store.list('projects'), workItems: service.store.list('workItems'), version: '0.1.0' }));
  app.get('/api/backend/targets', async () => {
    const capability = await service.backends.maka.inspect(); const makaTargets = capability.available ? await service.backends.maka.listTargets().catch(() => []) : [];
    return { maka: capability, sandbox: await service.backends.sandbox.inspect(), targets: [...makaTargets, ...await service.backends.sandbox.listTargets()] };
  });
  commandRoute('/api/backend/connections', async request => {
    const body = z.object({ slug: z.string().regex(/^[a-z][a-z0-9_-]{0,63}$/), name: z.string().min(1), providerType: z.enum(['custom', 'anthropic', 'google', 'openai', 'deepseek']), baseUrl: z.string().url().optional(), protocol: z.enum(['openai-chat', 'openai-responses', 'anthropic-messages']).optional(), models: z.array(z.string().min(1)).min(1), apiKey: z.string().optional() }).parse(request.body);
    const backend = service.backends.maka;
    if (!(backend instanceof MakaBackend)) throw new DomainError('BACKEND_UNAVAILABLE', '当前后端不支持连接管理', 503);
    return backend.configureConnection(body);
  });
  app.get('/api/projects', async () => service.store.list('projects'));
  commandRoute('/api/projects/:id/guidance/refresh', request => service.guidance.refresh(param(request)));
  commandRoute('/api/projects/:id/guidance', async request => {
    const body = z.object({ name: z.enum(['AGENT.md', 'AGENTS.md']), content: z.string().min(1), expectedHash: z.string().nullable() }).parse(request.body);
    return service.saveProjectGuidance(param(request), body.name, body.content, body.expectedHash);
  });
  commandRoute('/api/projects', async request => { const body = z.object({ rootPath: z.string().min(1), name: z.string().optional() }).parse(request.body); return service.registerProject(body.rootPath, body.name); });
  commandRoute('/api/projects/:id/configure', async request => {
    const body = z.object({ expectedRevision: z.number().int().positive(), rules: z.string(), commands: z.array(command).min(1), defaults: z.object({ analyst: target.optional(), architect: target.optional(), developer: target.optional(), reviewer: target.optional() }) }).parse(request.body);
    const { expectedRevision, ...patch } = body;
    service.store.update('projects', param(request), patch, expectedRevision);
    await service.guidance.refresh(param(request)); return service.store.get('projects', param(request));
  });
  commandRoute('/api/work-items', async request => { const body = z.object({ projectId: z.string(), name: z.string().min(1), request: z.string().default(''), documents: z.array(requirementDocument).max(20).default([]), kind: z.enum(['feature', 'bug', 'refactor']).default('feature') }).parse(request.body); return service.createWorkItem(body.projectId, body.name, body.request, body.kind, body.documents); });
  app.get('/api/work-items/:id', request => service.snapshot(param(request)));
  commandRoute('/api/work-items/:id/requirements', request => {
    const body = z.object({ expectedRevisionId: z.string().min(1), request: z.string(), documents: z.array(requirementDocument).max(20) }).parse(request.body);
    return service.saveRequirements(param(request), body.expectedRevisionId, body.request, body.documents);
  });
  commandRoute('/api/work-items/:id/requirements/repository', request => {
    const body = z.object({ path: z.string().min(1).max(1000) }).parse(request.body);
    return service.requirements.readRepository(param(request), body.path);
  });
  app.get('/api/work-items/:id/export', async (request, reply) => { const snapshot = await service.snapshot(param(request)); return reply.header('content-disposition', `attachment; filename="specflow-${snapshot.item.id}.json"`).send({ format: 'specflow-evidence-v1', exportedAt: new Date().toISOString(), ...snapshot }); });
  commandRoute('/api/work-items/:id/import', request => {
    const body = z.object({ artifacts: z.array(z.object({ logicalId: z.string(), content: z.string() })), comments: z.array(z.object({ logicalId: z.string(), author: z.string(), body: z.string(), anchor: z.string().default('') })).default([]) }).parse(request.body);
    const revisions = body.artifacts.map(a => service.artifacts.create(param(request), a.logicalId, a.content));
    for (const comment of body.comments) { const artifact = service.store.list('artifacts', a => a.workItemId === param(request) && a.logicalId === comment.logicalId)[0]; if (artifact) service.store.create('comments', { artifactRevisionId: artifact.currentRevisionId, author: comment.author, body: comment.body, anchor: comment.anchor }); }
    return { revisions, message: '导入内容保持候选状态，需在本机重新复核与接纳' };
  });
  commandRoute('/api/workflows/validate', request => { const body = z.object({ definition: workflowSchema, existing: z.array(z.string()).default([]) }).parse(request.body); return compileWorkflow(body.definition, body.existing); });
  commandRoute('/api/workflows/:id/save', request => { const body = z.object({ expectedRevision: z.number().int().positive(), definition: workflowSchema }).parse(request.body); return service.updateWorkflow(param(request), body.definition, body.expectedRevision); });
  app.get('/api/workflows/:id/yaml', request => ({ yaml: stringifyYaml(service.store.get('workflows', param(request)).definition) }));
  commandRoute('/api/workflows/:id/yaml', request => { const body = z.object({ expectedRevision: z.number().int().positive(), yaml: z.string() }).parse(request.body); return service.updateWorkflow(param(request), workflowSchema.parse(parseYaml(body.yaml)), body.expectedRevision); });
  commandRoute('/api/workflow-runs', request => { const body = z.object({ workflowId: z.string() }).parse(request.body); return service.createRun(body.workflowId); });
  commandRoute('/api/workflow-runs/:id/state', request => { const body = z.object({ expectedRevision: z.number().int().positive(), state: z.enum(['active', 'paused', 'cancelled']) }).parse(request.body); return service.store.update('runs', param(request), { state: body.state }, body.expectedRevision); });
  app.get('/api/node-runs/:id/readiness', request => service.readiness(param(request)));
  commandRoute('/api/clarifications/:id/answers', request => {
    const body = z.object({ expectedRevision: z.number().int().positive(), answers: z.array(z.object({ questionId: z.string(), answer: z.string().min(1).max(4000) })).min(1).max(5), target: target.optional() }).parse(request.body);
    return service.answerClarification(param(request), body.expectedRevision, body.answers, body.target);
  });
  commandRoute('/api/clarifications/:id/restart', request => { const body = revisionBody.parse(request.body); return service.restartClarification(param(request), body.expectedRevision); });
  commandRoute('/api/clarifications/:id/draft', request => {
    const body = z.object({ expectedRevision: z.number().int().min(0), answers: z.record(z.string(), z.string().max(4000)) }).parse(request.body);
    return service.saveClarificationDraft(param(request), body.expectedRevision, body.answers);
  });
  commandRoute('/api/node-runs/:id/attempts', async request => { const body = z.object({ expectedRevision: z.number().int().positive(), target: target.optional() }).parse(request.body); return service.startNode(param(request), body.expectedRevision, body.target); });
  commandRoute('/api/attempts/:id/stop', request => service.stopAttempt(param(request)));
  commandRoute('/api/attempts/:id/reconcile', async request => { await service.reconcile(param(request)); return service.store.get('attempts', param(request)); });
  commandRoute('/api/attempts/:id/resume', request => service.resumeAttempt(param(request)));
  commandRoute('/api/interactions/:id/answer', request => { const body = z.object({ answer: z.unknown() }).parse(request.body); return service.answerInteraction(param(request), body.answer); });
  commandRoute('/api/artifacts/:id/revisions', request => { const body = z.object({ expectedRevision: z.number().int().positive(), content: z.string() }).parse(request.body); const a = service.store.get('artifacts', param(request)); const current = service.store.get('artifactRevisions', a.currentRevisionId); return service.artifacts.create(a.workItemId, a.logicalId, body.content, current.inputs, undefined, body.expectedRevision); });
  app.get('/api/artifact-revisions/:id/reading', (request, reply) => reply.header('Cache-Control', 'no-store').send(service.artifacts.reading(param(request))));
  app.get('/api/artifact-revisions/:id/reading.html', (request, reply) => {
    const revision = service.store.get('artifactRevisions', param(request)), artifact = service.store.get('artifacts', revision.artifactId);
    reply.header('Cache-Control', 'no-store').header('X-Content-Type-Options', 'nosniff')
      .header('Content-Disposition', `attachment; filename="${artifact.logicalId}.human.html"`)
      .header('Content-Security-Policy', "default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    return reply.type('text/html; charset=utf-8').send(service.artifacts.readingHtml(revision.id));
  });
  app.get('/api/artifact-revisions/:id/source.md', (request, reply) => {
    const revision = service.store.get('artifactRevisions', param(request)), artifact = service.store.get('artifacts', revision.artifactId);
    return reply.type('text/markdown; charset=utf-8').header('Cache-Control', 'no-store').header('X-Content-Type-Options', 'nosniff')
      .header('Content-Disposition', `attachment; filename="${artifact.logicalId}.md"`).send(revision.content);
  });
  commandRoute('/api/artifacts/:id/accept', request => { const body = z.object({ expectedRevision: z.number().int().positive(), actor: z.string().default('local'), reason: z.string().default('') }).parse(request.body); return service.acceptArtifact(param(request), body.expectedRevision, body.actor, body.reason); });
  commandRoute('/api/artifacts/:id/owner', request => { const body = z.object({ expectedRevision: z.number().int().positive(), owner: z.string().min(1) }).parse(request.body); return service.store.update('artifacts', param(request), { owner: body.owner }, body.expectedRevision); });
  commandRoute('/api/comments', request => { const body = z.object({ artifactRevisionId: z.string(), author: z.string().min(1), body: z.string().min(1), anchor: z.string().default('') }).parse(request.body); service.store.get('artifactRevisions', body.artifactRevisionId); return service.store.create('comments', body); });
  commandRoute('/api/findings/:id/resolve', request => { const body = z.object({ status: z.enum(['resolved', 'waived']), reason: z.string(), evidenceId: z.string().optional() }).parse(request.body); return service.resolveFinding(param(request), body.status, body.reason, body.evidenceId); });
  app.get('/api/candidates/:id/diff', async request => { const c = service.store.get('candidates', param(request)); return { diff: await service.workspaces.diff(c.workspace, c.baseCommit), candidate: c }; });
  commandRoute('/api/candidates/:id/verify', async request => service.verifyCandidate(param(request)));
  commandRoute('/api/code-candidates/:id/accept', request => { const c = service.store.get('candidates', param(request)); return service.acceptCode(c.workItemId, 'local'); });
  app.get('/api/events', (request, reply) => {
    const after = Number((request.query as any).after || 0);
    if (request.headers.accept !== 'text/event-stream') return service.store.events(after);
    reply.hijack(); reply.raw.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    let cursor = after;
    const send = () => { for (const event of service.store.events(cursor)) { reply.raw.write(`id: ${event.seq}\ndata: ${JSON.stringify(event)}\n\n`); cursor = event.seq; } };
    send(); const timer = setInterval(send, 700); request.raw.on('close', () => clearInterval(timer));
  });
  if (options.staticRoot && existsSync(join(options.staticRoot, 'index.html'))) {
    await app.register(staticFiles, { root: options.staticRoot, wildcard: false });
    app.setNotFoundHandler((request, reply) => request.url.startsWith('/api/') ? reply.code(404).send({ code: 'NOT_FOUND', message: '接口不存在' }) : reply.sendFile('index.html'));
  }
  return app;
}
