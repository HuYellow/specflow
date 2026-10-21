import { createHash, randomUUID } from 'node:crypto';
import type { ReviewContext, ReviewReport } from '../review-policy/index.ts';

export const id = () => randomUUID();
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const now = () => new Date().toISOString();
export type Entity = { id: string; revision: number; createdAt: string; updatedAt: string };
export type NodeType = 'agent' | 'clarify' | 'review' | 'verify' | 'gate' | 'human';
export type ExecutionState = 'pending' | 'starting' | 'running' | 'waiting_interaction' | 'completed' | 'failed' | 'cancelled' | 'reconciling';
export type GateState = 'unchecked' | 'passed' | 'blocked' | 'stale';
export type Role = 'analyst' | 'architect' | 'developer' | 'reviewer';
export const backendIds = ['maka', 'opencode', 'sandbox', 'dsh'] as const;
export type BackendId = typeof backendIds[number];
export interface ModelTarget { backend: BackendId; connectionId: string; connectionSlug: string; model: string; rootId?: string }
export interface VerificationCommand { id: string; executable: string; args: string[]; timeoutMs: number }
export interface GuidanceFile { name: 'AGENT.md' | 'AGENTS.md'; content: string; contentHash: string }
export interface ProjectGuidance { files: GuidanceFile[]; rules: string; contentHash: string }
export interface Project extends Entity { name: string; rootPath: string; baseCommit: string; rules: string; guidance?: ProjectGuidance; guidanceError?: string; defaults: Partial<Record<Role, ModelTarget>>; commands: VerificationCommand[]; demo: boolean; executionBackend?: BackendId }
export interface WorkItem extends Entity { projectId: string; name: string; request: string; requirementRevisionId?: string; kind: 'feature' | 'bug' | 'refactor'; baseCommit: string; acceptedCommit: string; workspace: string; branch: string; status: 'active' | 'accepted' }
export interface RequirementDocument { id: string; name: string; content: string; source: 'upload' | 'repository' | 'pasted'; repositoryPath?: string }
export interface RequirementRevision extends Entity { workItemId: string; number: number; request: string; documents: RequirementDocument[]; contentHash: string }
export interface WorkflowNode { id: string; name: string; type: NodeType; role?: Role; prompt: string; inputs: string[]; outputs: string[]; target?: ModelTarget; requireAcceptance?: boolean; taskMode?: boolean; maxSteps?: number; timeoutMs?: number }
export interface WorkflowDefinition { schemaVersion: 1; id: string; name: string; nodes: WorkflowNode[]; roles: Partial<Record<Role, ModelTarget>>; requiredVerification: string[]; requireReview: boolean; requireClarification?: boolean }
export interface Workflow extends Entity { workItemId: string; definition: WorkflowDefinition; definitionHash: string }
export interface WorkflowRun extends Entity { workItemId: string; workflowId: string; definition: WorkflowDefinition; rules: string; rulesHash: string; state: 'active' | 'paused' | 'completed' | 'cancelled' }
export interface InputBinding { logicalId: string; artifactRevisionId: string; contentHash: string }
export interface NodeRun extends Entity { workflowRunId: string; nodeId: string; name: string; type: NodeType; execution: ExecutionState; gate: GateState; freshness: 'fresh' | 'stale'; acceptance: 'pending' | 'accepted'; currentAttemptId?: string; blockers: string[]; error?: string }
export interface ExecutionRef { backend: BackendId; rootId: string; sessionId: string; turnId: string; runId?: string }
export interface Attempt extends Entity { nodeRunId: string; number: number; inputHash: string; inputs: InputBinding[]; requirementRevisionId?: string; guidance?: ProjectGuidance; clarificationSessionId?: string; clarificationQuestions?: ClarificationQuestion[]; review?: ReviewContext; reviewReport?: ReviewReport; target: ModelTarget; prompt: string; codeBaseline: string; candidateId?: string; execution: ExecutionState; bindingId?: string; error?: string; output?: string; startedAt?: string; finishedAt?: string; usage?: { inputTokens: number; outputTokens: number; costUsd: number | null } }
export interface ExecutionBinding extends Entity { attemptId: string; ref: ExecutionRef; parentBindingId?: string; kind: 'initial' | 'resume'; cursor?: string; taskId?: string }
export interface Artifact extends Entity { workItemId: string; logicalId: string; type: string; revisionIds: string[]; currentRevisionId: string; acceptedRevisionId?: string; owner: string }
export interface HumanBrief { title: string; summary: string; sections: { title: string; items: string[] }[] }
export interface HumanReading { schemaVersion: 1; sourceRevisionId: string; sourceContentHash: string; brief: HumanBrief; mode: 'authored' | 'extractive' }
export interface ArtifactRevision extends Entity { artifactId: string; content: string; contentHash: string; humanBrief?: HumanBrief; humanBriefSourceHash?: string; originAttemptId?: string; requirementRevisionId?: string; guidanceHash?: string; supersedesRevisionId?: string; clarificationSessionId?: string; candidateId?: string; codeHash?: string; inputs: InputBinding[]; acceptance: 'candidate' | 'accepted' | 'rejected'; reviewed: boolean; reviewGroupId?: string }
export interface ClarificationQuestion { id: string; question: string; reason: string; options: string[]; answer?: string }
export interface ClarificationSession extends Entity { workItemId: string; nodeRunId: string; sourceSpecRevisionId: string; requirementRevisionId?: string; guidanceHash: string; state: 'analyzing' | 'waiting_answers' | 'completed' | 'stale'; questions: ClarificationQuestion[]; attemptIds: string[]; resultSpecRevisionId?: string }
export interface ClarificationDraft extends Entity { sessionId: string; answers: Record<string, string> }
export interface Finding extends Entity { workItemId: string; nodeRunId: string; targetHash: string; targetLogicalId?: string; originAttemptId?: string; resolvedByAttemptId?: string; severity: 'blocker' | 'warning'; location: string; body: string; status: 'open' | 'resolved' | 'waived'; reason?: string; evidenceId?: string }
export interface Decision extends Entity { workItemId: string; targetId: string; targetHash: string; actor: string; kind: 'accept' | 'reject' | 'waive'; reason: string }
export interface Comment extends Entity { artifactRevisionId: string; author: string; anchor: string; body: string }
export interface Candidate extends Entity { workItemId: string; workspace: string; branch: string; baseCommit: string; checkpointCommit: string; attemptId: string; contentHash?: string; reviewedHash?: string; reviewGroupId?: string; status: 'working' | 'ready' | 'accepted'; summary?: string }
export interface Evidence extends Entity { workItemId: string; candidateId: string; targetHash: string; command: VerificationCommand; commandHash: string; exitCode: number | null; stdout: string; stderr: string; environment: string; status: 'passed' | 'failed'; stale: boolean; startedAt: string; finishedAt: string }
export interface TaskRun extends Entity { nodeRunId: string; attemptId: string; taskId: string; name: string; dependsOn: string[]; condition: string; state: 'pending' | 'running' | 'tested' | 'verified' | 'failed'; checkpointCommit?: string }
export interface Interaction extends Entity { attemptId: string; ref: ExecutionRef; backendInteractionId: string; request: unknown; state: 'pending' | 'answered' | 'closed' }
export interface FileOperation extends Entity { artifactId: string; revisionId: string; targetPath: string; previousHash: string | null; nextHash: string; state: 'prepared' | 'written' | 'committed' | 'conflict'; actor: string; reason: string }
export interface CodeOperation extends Entity { candidateId: string; targetCommit: string; resultCommit?: string; state: 'prepared' | 'integrated' | 'committed' | 'conflict' }
export interface Entities { projects: Project; workItems: WorkItem; requirementRevisions: RequirementRevision; clarifications: ClarificationSession; clarificationDrafts: ClarificationDraft; workflows: Workflow; runs: WorkflowRun; nodes: NodeRun; attempts: Attempt; bindings: ExecutionBinding; artifacts: Artifact; artifactRevisions: ArtifactRevision; findings: Finding; decisions: Decision; comments: Comment; candidates: Candidate; evidence: Evidence; tasks: TaskRun; interactions: Interaction; fileOperations: FileOperation; codeOperations: CodeOperation }
export type Kind = keyof Entities;
export class DomainError extends Error {
  constructor(public code: string, message: string, public status = 409, public details?: unknown) { super(message); this.name = 'DomainError'; }
}
export function assert(condition: unknown, code: string, message: string, details?: unknown): asserts condition { if (!condition) throw new DomainError(code, message, 409, details); }
export const defaultWorkflow = (): WorkflowDefinition => ({
  schemaVersion: 1, id: 'spec-driven', name: '规格驱动开发', roles: {}, requiredVerification: ['test'], requireReview: true, requireClarification: true,
  nodes: [
    { id: 'specify', name: '需求规格', type: 'agent', role: 'analyst', prompt: '分析需求和仓库，产出具有验收标准的需求规格。存在未知信息时提出明确问题。', inputs: [], outputs: ['spec'], requireAcceptance: true },
    { id: 'clarify', name: '需求澄清', type: 'clarify', role: 'analyst', prompt: '检查规格的功能边界、异常场景、数据约束和验收标准。仅询问影响设计和验证的关键问题，整个澄清会话最多 5 个问题。读取已有答复，保留需求 ID，把已确认的决策写回完整需求规格。', inputs: ['spec'], outputs: ['spec'] },
    { id: 'review-spec', name: '规格复核', type: 'review', role: 'reviewer', prompt: '独立检查规格的完整性、歧义和可验证性。', inputs: ['spec'], outputs: [] },
    { id: 'plan', name: '工程设计', type: 'agent', role: 'architect', prompt: '依据已接纳规格分析现有代码，产出模块、接口、设计决策和风险。', inputs: ['spec@accepted'], outputs: ['plan'], requireAcceptance: true },
    { id: 'review-plan', name: '设计复核', type: 'review', role: 'reviewer', prompt: '独立检查工程设计是否满足需求，定位具体问题。', inputs: ['plan', 'spec@accepted'], outputs: [] },
    { id: 'tasks', name: '任务拆解', type: 'agent', role: 'architect', prompt: '拆解实现任务。每项任务包含唯一 ID、依赖和验收条件。', inputs: ['spec@accepted', 'plan@accepted'], outputs: ['tasks'], requireAcceptance: true },
    { id: 'review-tasks', name: '任务复核', type: 'review', role: 'reviewer', prompt: '检查任务覆盖、依赖和验收条件。', inputs: ['tasks', 'plan@accepted'], outputs: [] },
    { id: 'implement', name: '代码实现', type: 'agent', role: 'developer', prompt: '按已接纳任务改动代码，运行相关测试并记录实现说明。', inputs: ['spec@accepted', 'plan@accepted', 'tasks@accepted'], outputs: ['implementation'], taskMode: true },
    { id: 'verify', name: '测试与检查', type: 'verify', prompt: '', inputs: ['implementation'], outputs: [] },
    { id: 'review-code', name: '代码复核', type: 'review', role: 'reviewer', prompt: '独立检查补丁与规格、任务、测试覆盖是否一致。', inputs: ['implementation', 'spec@accepted'], outputs: [] },
    { id: 'converge', name: '收敛与对齐', type: 'agent', role: 'analyst', prompt: '核对需求、任务、代码与验证证据，产出对齐报告。', inputs: ['implementation', 'spec@accepted', 'tasks@accepted'], outputs: ['convergence'], requireAcceptance: true },
    { id: 'review-converge', name: '收敛复核', type: 'review', role: 'reviewer', prompt: '复核对齐报告，确认没有遗漏需求和证据。', inputs: ['convergence'], outputs: [] },
    { id: 'accept', name: '接纳代码', type: 'human', prompt: '', inputs: ['implementation', 'convergence@accepted'], outputs: [] },
  ],
});

// Accepted inputs are reference material, not additional subjects to certify.
export function reviewSubjects(node: WorkflowNode) { return node.inputs.filter(input => !input.endsWith('@accepted')).map(input => input.split('@')[0]); }

export function compileWorkflow(def: WorkflowDefinition, existing: string[] = []) {
  const errors: { nodeId: string; code: string; message: string }[] = [];
  const ids = new Set<string>(), produced = new Set(existing);
  for (let index = 0; index < def.nodes.length; index++) {
    const node = def.nodes[index];
    if (ids.has(node.id)) errors.push({ nodeId: node.id, code: 'DUPLICATE_NODE', message: '节点 ID 重复' });
    ids.add(node.id);
    for (const input of node.inputs) if (!produced.has(input.split('@')[0])) errors.push({ nodeId: node.id, code: 'INPUT_MISSING', message: `上游未提供 ${input}` });
    if (['agent', 'clarify', 'review'].includes(node.type) && !node.role) errors.push({ nodeId: node.id, code: 'ROLE_MISSING', message: '模型节点需要配置角色' });
    if (node.type === 'review' && !reviewSubjects(node).length) errors.push({ nodeId: node.id, code: 'REVIEW_SUBJECT_MISSING', message: '复核必须声明当前候选产物，已接纳输入仅作为参考依据' });
    if (node.type === 'clarify' && (node.inputs.length !== 1 || node.inputs[0] !== 'spec' || node.outputs.length !== 1 || node.outputs[0] !== 'spec' || node.role !== 'analyst')) errors.push({ nodeId: node.id, code: 'CLARIFY_INVALID', message: '需求澄清使用 analyst 角色，读取候选 spec 并修订 spec' });
    if (def.requireReview && (node.type === 'agent' || node.type === 'clarify') && node.outputs.length) {
      const later = def.nodes.slice(index + 1);
      for (const output of node.outputs) {
        const reviewIndex = later.findIndex(x => x.type === 'review' && reviewSubjects(x).includes(output));
        const consumeIndex = later.findIndex(x => x.type === 'agent' && x.inputs.some(i => i.split('@')[0] === output));
        if (reviewIndex < 0 || (consumeIndex >= 0 && consumeIndex < reviewIndex)) errors.push({ nodeId: node.id, code: 'REVIEW_MISSING', message: `${output} 需要在后续模型消费前独立复核` });
      }
    }
    for (const output of node.outputs) produced.add(output);
  }
  if (def.requireClarification) {
    const clarifyIndex = def.nodes.findIndex(n => n.type === 'clarify');
    if (clarifyIndex < 0) errors.push({ nodeId: '', code: 'CLARIFY_MISSING', message: '流程要求在规格复核和工程设计前完成需求澄清' });
    else for (const [index, node] of def.nodes.entries()) if (index < clarifyIndex && node.type !== 'clarify' && node.inputs.some(i => i.split('@')[0] === 'spec')) errors.push({ nodeId: node.id, code: 'CLARIFY_ORDER', message: '消费规格的复核或设计步骤必须位于需求澄清之后' });
  }
  if (def.requiredVerification.length && !def.nodes.some(x => x.type === 'verify')) errors.push({ nodeId: '', code: 'VERIFY_MISSING', message: '流程缺少必需验证节点' });
  return { valid: errors.length === 0, errors };
}

export function parseTasks(content: string) {
  const tasks = content.split('\n').flatMap(line => {
    const match = line.match(/^\s*- \[[ x]\]\s+(T\d+)\s+(.+)$/i);
    if (!match) return [];
    const dependencies = [...match[2].matchAll(/\bT\d+\b/g)].map(x => x[0]);
    assert(!dependencies.includes(match[1]), 'TASKS_INVALID', '任务不能依赖自身');
    return [{ taskId: match[1], name: match[2], dependsOn: dependencies, condition: match[2] }];
  });
  assert(tasks.length, 'TASKS_INVALID', '任务文档需要 - [ ] T001 形式的任务和验收条件');
  const ids = new Set(tasks.map(x => x.taskId));
  assert(ids.size === tasks.length, 'TASKS_INVALID', '任务 ID 必须唯一');
  const visited = new Set<string>();
  while (visited.size < tasks.length) {
    const next = tasks.find(t => !visited.has(t.taskId) && t.dependsOn.every(d => visited.has(d)));
    assert(next, 'TASKS_INVALID', '任务依赖缺失或形成环');
    visited.add(next.taskId);
  }
  return tasks;
}
