import type { Entity, ModelTarget } from './index.ts';

/** Automation is opt-in. A missing setting has the same meaning as false. */
export interface AutomationSettings { autoAdvance: boolean; autoRepair: boolean; maxRepairRounds: number }
export interface RepairProgress {
  targetHash: string;
  /** Stable finding identities, never regenerated review-local descriptions. */
  unresolvedFindingIds: string[];
  /** Command identity + stable failure category, not volatile timestamps/log text. */
  failedChecks: string[];
}
export interface RepairRound {
  number: number;
  phase: 'preparing' | 'producing' | 'verifying' | 'reviewing' | 'evaluated';
  attemptId?: string;
  candidateId?: string;
  snapshotOperationId?: string;
  evidenceIds: string[];
  reviewAttemptIds: string[];
  reviewGroupIds: string[];
  progress?: RepairProgress;
  passed?: boolean;
  reviewSkippedReason?: 'verification_failed' | 'output_invalid';
  inputRevisionIds?: Record<string, string | null>;
  outputRevisionIds?: Record<string, string | null>;
}
export type RepairStopReason = 'completed' | 'round_limit' | 'no_progress' | 'input_stale' | 'candidate_drift' | 'permission_denied' | 'execution_unknown' | 'budget_exhausted' | 'user_cancelled' | 'unrepairable';
export interface RepairCycle extends Entity {
  workItemId: string;
  workflowRunId: string;
  producerNodeRunId: string;
  sourceAttemptId: string;
  sourceCandidateId?: string;
  acceptedCommit: string;
  upstreamHash: string;
  target: ModelTarget;
  reviewTargets?: Record<string, ModelTarget>;
  targetLogicalIds: string[];
  mode: 'code' | 'output';
  maxRounds: number;
  noProgressLimit: number;
  initialProgress: RepairProgress;
  initialTargetRevisionIds?: Record<string, string | null>;
  rounds: RepairRound[];
  state: 'active' | 'paused' | 'completed' | 'cancelled';
  stopReason?: RepairStopReason;
  pendingActionKey?: string;
  automationRunId?: string;
}
export interface AutomationRun extends Entity {
  workItemId: string;
  workflowRunId: string;
  settings: AutomationSettings;
  state: 'active' | 'paused' | 'completed' | 'cancelled';
  startedNodeRunIds: string[];
  pendingActionKey?: string;
  pauseReason?: string;
}
/** Persist prepared before touching Git; activate the candidate in the same DB
 * transaction that changes seeded -> activated. Git itself is not transactional
 * with the Store. An interrupted operation must be reconciled, never discarded. */
export interface CandidateSnapshotOperation extends Entity {
  workItemId: string;
  repairCycleId: string;
  round: number;
  parentCandidateId: string;
  parentCodeHash: string;
  /** Accepted integration baseline; never replace this with seedCommit. */
  baseCommit: string;
  seedCommit?: string;
  snapshotRef?: string;
  candidateId?: string;
  workspace?: string;
  branch?: string;
  state: 'prepared' | 'snapshotted' | 'seeded' | 'activated' | 'conflict';
  error?: string;
}
