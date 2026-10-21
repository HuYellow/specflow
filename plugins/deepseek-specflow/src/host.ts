import { join } from 'node:path';
import { realpath } from 'node:fs/promises';
import type { Context } from '@deepseek-ai/cordis';
import type { HostConnectionHandle } from '@deepseek-ai/dsh-client-connection';
import { defineTool } from '@deepseek-ai/dsh-tools';
import z from '@deepseek-ai/schemastery';
import { DomainError } from '../../../packages/domain/index.ts';
import { createEngineeringRuntime } from '../../../packages/specflow-core/index.ts';
import { DshBackend } from './backend.ts';
import { SpecflowApi, createSpecflowFetchRoute } from './api.ts';
import { acquireProfile } from './profile.ts';
import { READ_ENDPOINT, COMMAND_ENDPOINT } from './protocol.ts';

export const name = 'specflow';
export const inject = ['connection', 'agents', 'llm', 'tools', 'sessions', 'sessionPersistence'];

export interface Config { dataDir?: string }
export const Config: z<Config> = z.object({ dataDir: z.string() });

/** Host-only activation. No HTTP listener, Electron process or Maka runtime is started. */
export async function apply(ctx: Context, config: Config = {}): Promise<void> {
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Specflow requires the DeepSeek Harness host to run on Node.js 24 or later');
  await ctx.effect(async () => {
    const profile = await acquireProfile(config.dataDir);
    let runtime: Awaited<ReturnType<typeof createEngineeringRuntime>> | undefined;
    let api: SpecflowApi | undefined;
    let unregisterRpc: (() => Promise<void>) | undefined;
    let unregisterTool: (() => void | Promise<void>) | undefined;
    let closed = false;
    const close = async (): Promise<void> => {
      if (closed) return;
      closed = true;
      await unregisterRpc?.();
      await unregisterTool?.();
      for (const controller of runtime?.service.verificationControllers.values() ?? []) controller.abort();
      await api?.close();
      // The runtime stops the backend, drains jobs, then closes SQLite.
      // Keep the profile locked if any teardown cannot safely quiesce.
      await runtime?.close();
      await profile.release();
    };
    try {
      const backend = new DshBackend({ context: ctx as unknown as ConstructorParameters<typeof DshBackend>[0]['context'], stateDir: join(profile.dataDir, 'dsh'), workspaceRoot: join(profile.dataDir, 'workspaces'), instanceId: profile.instanceId });
      runtime = await createEngineeringRuntime({ dataDir: profile.dataDir, backends: { dsh: backend }, defaultBackend: 'dsh' });
      api = new SpecflowApi(runtime.service);
      const service = runtime.service;
      const apiOwner = api;
      const connection = ctx.get('connection') as HostConnectionHandle;
      const routes: (() => Promise<void>)[] = [];
      unregisterRpc = async () => { for (const release of routes.reverse()) await release(); };
      for (const endpoint of [READ_ENDPOINT, COMMAND_ENDPOINT] as const) routes.push(connection.fetch.register(createSpecflowFetchRoute(apiOwner, endpoint)));

      // Model queries are deliberately read-only and limited to the calling
      // Agent's repository/worktree. Human acceptance exists only in the UI RPC.
      const disposer = ctx.tools.register(defineTool({
        name: 'specflow_query',
        description: 'Read Specflow engineering state for the current repository. status lists its work items; snapshot reads one work item; artifact reads a revision belonging to that work item. This tool cannot start work, change requirements, waive findings, or accept AI output. Use the Specflow panel for those owner actions.',
        parameters: {
          resource: { type: 'string', required: true, enum: ['status', 'snapshot', 'artifact'], description: 'Read-only resource to inspect.' },
          workItemId: { type: 'string', description: 'Work item ID from status; required for snapshot and artifact.' },
          revisionId: { type: 'string', description: 'Artifact revision ID from snapshot; required for artifact.' },
        },
        output: { schema: { type: 'json' }, render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }] },
        async execute(args, exec) {
          exec.signal.throwIfAborted();
          const cwd = exec.agent?.session.header.cwd;
          if (cwd === undefined) throw new DomainError('AGENT_WORKSPACE_REQUIRED', 'Specflow 查询需要具有工作目录的 Agent 会话', 403);
          const canonical = await realpath(cwd);
          const projects = service.store.list('projects');
          const allItems = service.store.list('workItems');
          const projectIds = new Set<string>();
          for (const project of projects) {
            if (await sameDirectory(canonical, project.rootPath)) projectIds.add(project.id);
          }
          for (const item of allItems) if (await sameDirectory(canonical, item.workspace)) projectIds.add(item.projectId);
          const items = allItems.filter(item => projectIds.has(item.projectId));
          if (args.resource === 'status') return asJson({ projects: projects.filter(project => projectIds.has(project.id)), workItems: items });
          const item = items.find(item => item.id === args.workItemId);
          if (item === undefined) throw new DomainError('SPECFLOW_WORKSPACE_MISMATCH', '工作项不属于当前会话的仓库', 403);
          if (args.resource === 'snapshot') return asJson(await apiOwner.read({ resource: 'snapshot', id: item.id }));
          if (typeof args.revisionId !== 'string') throw new DomainError('INVALID_REQUEST', 'artifact 查询需要 revisionId', 400);
          const revision = service.store.get('artifactRevisions', args.revisionId);
          const artifact = service.store.get('artifacts', revision.artifactId);
          if (artifact.workItemId !== item.id) throw new DomainError('SPECFLOW_WORKSPACE_MISMATCH', '文档不属于当前工作项', 403);
          return asJson({ reading: await apiOwner.read({ resource: 'artifact', id: revision.id }), source: revision.content });
        },
      }));
      unregisterTool = typeof disposer === 'function' ? disposer : undefined;
      return close;
    } catch (error) { await close(); throw error; }
  }, 'specflow: exclusive engineering profile and authenticated API');
}

async function sameDirectory(canonical: string, other: string): Promise<boolean> {
  try { return canonical === await realpath(other); } catch { return false; }
}

function asJson(value: unknown): import('@deepseek-ai/dsh-util-values').JsonValue {
  // Domain records may contain undefined optional properties; the transport's
  // durable JSON form omits them exactly as the desktop HTTP API does.
  return JSON.parse(JSON.stringify(value)) as import('@deepseek-ai/dsh-util-values').JsonValue;
}
