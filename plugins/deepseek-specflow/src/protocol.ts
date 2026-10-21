import type { Project, WorkItem } from '../../../packages/domain/index.ts';
import type { EngineeringService } from '../../../packages/specflow-core/index.ts';
import pluginManifest from '../package.json' with { type: 'json' };

/** Connection's authenticated, carrier-neutral shared API channel. */
export const RPC_CHANNEL = '/api';
export const READ_ENDPOINT = 'specflow/read';
export const COMMAND_ENDPOINT = 'specflow/command';
export const PLUGIN_VERSION = pluginManifest.version;

export const readResources = ['bootstrap', 'snapshot', 'artifact', 'readiness', 'attempt', 'candidateDiff', 'acceptancePrecheck', 'events'] as const;
export type ReadResource = typeof readResources[number];
export interface SpecflowReadRequest {
  resource: ReadResource;
  id?: string;
  after?: number;
}
export const commandOperations = ['registerProject', 'configureProject', 'createWorkItem', 'saveRequirements', 'createRun', 'startNode', 'stopAttempt', 'reconcileAttempt', 'resumeAttempt', 'answerInteraction', 'answerClarification', 'saveClarificationDraft', 'restartClarification', 'editArtifact', 'acceptArtifact', 'verifyCandidate', 'acceptCode', 'resolveFinding'] as const;
export type CommandOperation = typeof commandOperations[number];
export interface SpecflowCommandRequest {
  operation: CommandOperation;
  id?: string;
  input?: unknown;
  idempotencyKey: string;
}
export interface SpecflowBootstrap {
  version: string;
  canWrite: boolean;
  projects: Project[];
  workItems: WorkItem[];
  catalog: Awaited<ReturnType<EngineeringService['backendCatalog']>>;
}
export type SpecflowSnapshot = Awaited<ReturnType<EngineeringService['snapshot']>>;
export type SpecflowArtifactReading = ReturnType<EngineeringService['artifacts']['reading']>;

/** Minimal port intentionally shared by UI tests and the real Connection caller. */
export interface SpecflowConnection {
  rpc: {
    call(channel: string, endpoint: string, payload: unknown, signal?: AbortSignal): Promise<
      { readonly ok: true; readonly value: unknown }
      | { readonly ok: false; readonly error: { readonly code: string; readonly message: string; readonly details: object } }
    >;
  };
}

export async function readSpecflow<T>(connection: SpecflowConnection, request: SpecflowReadRequest, signal?: AbortSignal): Promise<T> {
  const result = await connection.rpc.call(RPC_CHANNEL, READ_ENDPOINT, request, signal);
  if (!result.ok) throw Object.assign(new Error(result.error.message), result.error);
  return result.value as T;
}

export async function commandSpecflow<T>(connection: SpecflowConnection, request: SpecflowCommandRequest, signal?: AbortSignal): Promise<T> {
  const result = await connection.rpc.call(RPC_CHANNEL, COMMAND_ENDPOINT, request, signal);
  if (!result.ok) throw Object.assign(new Error(result.error.message), result.error);
  return result.value as T;
}
