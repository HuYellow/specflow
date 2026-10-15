import type { ExecutionRef, ModelTarget, WorkflowNode, ClarificationQuestion, HumanBrief } from '../domain/index.ts';
import type { ReviewContext, ReviewReport } from '../review-policy/index.ts';
export interface BackendCapabilities { available: boolean; version: string; rootId?: string; canResume: boolean; canInteract: boolean; readOnlyReview: boolean; reason?: string }
export interface FrozenInput { prompt: string; workspace: string; target: ModelTarget; readOnly: boolean; attemptId: string; maxSteps: number; inputHash: string; node: WorkflowNode; review?: ReviewContext; clarification?: { questions: ClarificationQuestion[] }; artifacts: { logicalId: string; content: string; contentHash: string }[]; task?: { taskId: string; name: string; condition: string } }
export interface StageOutput { summary: string; artifacts: { logicalId: string; type: string; content: string; humanBrief?: HumanBrief }[]; review?: ReviewReport; clarification?: { status: 'needs_answers' | 'complete'; questions: Omit<ClarificationQuestion, 'answer'>[] }; findings?: { severity: 'blocker' | 'warning'; location: string; body: string; targetLogicalId?: string }[] }
export interface ExecutionSnapshot { state: 'running' | 'waiting_interaction' | 'completed' | 'failed' | 'cancelled' | 'unknown'; ref: ExecutionRef; terminalEventId?: string; output?: string; error?: string; usage?: { inputTokens: number; outputTokens: number; costUsd: number | null }; interactions?: { id: string; request: unknown }[] }
export interface ExecutionUpdate { kind: 'progress' | 'interaction' | 'terminal'; snapshot?: ExecutionSnapshot; message?: string }
export interface ExecutionBackend {
  inspect(): Promise<BackendCapabilities>;
  listTargets(): Promise<ModelTarget[]>;
  prepare(input: FrozenInput): Promise<ExecutionRef>;
  start(ref: ExecutionRef, input: FrozenInput): Promise<ExecutionSnapshot>;
  query(ref: ExecutionRef): Promise<ExecutionSnapshot>;
  observe(ref: ExecutionRef): AsyncIterable<ExecutionUpdate>;
  answer(ref: ExecutionRef, interactionId: string, answer: unknown): Promise<void>;
  stop(ref: ExecutionRef): Promise<void>;
  planResume(ref: ExecutionRef): Promise<{ possible: boolean; reason?: string; data?: unknown }>;
  resume(ref: ExecutionRef, plan: unknown): Promise<ExecutionRef>;
  readResult(ref: ExecutionRef): Promise<ExecutionSnapshot>;
}
