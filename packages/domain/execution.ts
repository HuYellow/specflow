import type { BackendId, Entity, ExecutionRef } from './index.ts';

export type ExecutionStopReason = 'natural_completion' | 'step_limit' | 'attempt_limit' | 'deadline' | 'user_cancelled' | 'permission_denied' | 'provider_error' | 'input_stale' | 'no_progress' | 'unknown';
export type UsageCompleteness = 'complete' | 'partial' | 'unknown';
export interface BackendCapabilityDetails {
  sourceVersion: string;
  stepLimit: { enforcement: 'native' | 'observed' | 'unsupported'; scope: 'turn'; unit: 'runtime-step' | 'observed-step' | 'host-step' };
  resume: { mode: 'same-run' | 'reconcile-only'; preservesStepBudget: boolean };
  usage: { availability: 'terminal' | 'none'; cost: 'reported' | 'unknown' };
  readOnly: { enforcement: 'host-policy' | 'tool-allowlist'; trustBoundary: string };
}
export interface ExecutionCapabilitiesSnapshot {
  available: boolean;
  version: string;
  rootId?: string;
  canResume: boolean;
  canInteract: boolean;
  readOnlyReview: boolean;
  stepLimit?: 'native' | 'observed';
  stepUnit?: string;
  maxInputBytes?: number;
  usageCompleteness?: UsageCompleteness;
  reason?: string;
  details?: BackendCapabilityDetails;
}
export interface ExecutionPolicyOptions {
  maxSteps?: number;
  timeoutMs?: number;
  maxDispatches?: number;
  maxReservedSteps?: number;
  maxRunDispatches?: number;
  maxRunReservedSteps?: number;
  maxCostUsd?: number;
  strictCostLimit?: boolean;
}
export interface ExecutionPolicy {
  version: 1;
  policyHash: string;
  limits: {
    maxSteps: number;
    timeoutMs: number;
    maxDispatches: number;
    maxRunDispatches: number;
    maxReservedSteps?: number;
    maxRunReservedSteps?: number;
    maxCostUsd?: number;
  };
  capabilities?: ExecutionCapabilitiesSnapshot;
  costEnforcement: 'observed' | 'unsupported';
}
export interface UsageValues { inputTokens: number | null; outputTokens: number | null; costUsd: number | null }
export interface UsageMeasurement extends UsageValues {
  meterId: string;
  scope: 'turn' | 'session';
  mode: 'cumulative' | 'delta';
  eventId?: string;
  sequence?: number;
  completeness: UsageCompleteness;
}
export interface UsageRecord extends Entity {
  workflowRunId: string;
  attemptId: string;
  bindingId: string;
  attemptIds: string[];
  bindingIds: string[];
  repairCycleId?: string;
  ref: ExecutionRef;
  meterKey: string;
  meterId: string;
  scope: 'turn' | 'session';
  mode: 'cumulative' | 'delta';
  eventId?: string;
  sequence?: number;
  values: UsageValues;
  completeness: UsageCompleteness;
}
export interface UsageSummary extends UsageValues {
  known: { inputTokens: number; outputTokens: number; costUsd: number };
  unknownCounts: { inputTokens: number; outputTokens: number; costUsd: number };
  completeness: UsageCompleteness;
  executions: number;
  meters: number;
}
export type DispatchState = 'reserved' | 'prepared' | 'dispatched' | 'terminal' | 'unknown' | 'released';
export interface DispatchIntent extends Entity {
  actionKey: string;
  attemptId: string;
  workflowRunId: string;
  repairCycleId?: string;
  parentOperationId?: string;
  inputHash: string;
  policyHash: string;
  state: DispatchState;
  reservedSteps: number;
  stepUnit: string;
  backend?: BackendId;
  ref?: ExecutionRef;
  actualSteps?: number;
  terminalEventId?: string;
}
export interface ContextManifestEntry {
  sourceId: string;
  revision?: string;
  contentHash: string;
  visibleContentHash: string;
  bytes: number;
  required: boolean;
  purpose: string;
  delivery: 'inline' | 'reference';
}
export interface ContextManifest {
  version: 1;
  entries: ContextManifestEntry[];
  totalBytes: number;
  uniqueBytes: number;
  promptBytes?: number;
  manifestHash: string;
}
export interface TaskSpec {
  taskId: string;
  name: string;
  objective: string;
  dependsOn: string[];
  condition: string;
  acceptanceCriteria: string[];
  requirementIds: string[];
  allowedPaths: string[];
  verificationCommandIds: string[];
  contextRefs: string[];
  sourceFormat: 'structured' | 'markdown';
}
