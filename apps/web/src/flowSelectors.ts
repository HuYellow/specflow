import type { NodeRun, WorkflowNode, WorkflowRun } from '../../../packages/domain/index.ts';

export type StepFact = { label: string; value: string; raw: string; tone: 'neutral' | 'success' | 'warning' | 'danger' };
export interface StepStatusViewModel { execution: StepFact; gate: StepFact; freshness: StepFact; acceptance: StepFact; effectivelyPassed: boolean }

const executionLabels: Record<NodeRun['execution'], string> = {
  pending: '待执行', starting: '启动中', running: '运行中', waiting_interaction: '待交互', completed: '已结束',
  failed: '失败', cancelled: '已停止', reconciling: '待核对',
};
const gateLabels: Record<NodeRun['gate'], string> = { unchecked: '待检查', passed: '通过', blocked: '阻塞', stale: '过期' };

export function requiresHumanAcceptance(definition?: Pick<WorkflowNode, 'requireAcceptance' | 'type'>) {
  return !!definition?.requireAcceptance || definition?.type === 'human';
}

/** Keep server facts separate; a completed execution alone never certifies a step. */
export function getStepStatus(node: NodeRun, definition?: WorkflowNode): StepStatusViewModel {
  const human = requiresHumanAcceptance(definition || node);
  return {
    execution: { label: '执行', value: executionLabels[node.execution], raw: node.execution, tone: node.execution === 'failed' ? 'danger' : ['waiting_interaction', 'reconciling'].includes(node.execution) ? 'warning' : 'neutral' },
    gate: { label: '门禁', value: gateLabels[node.gate], raw: node.gate, tone: node.gate === 'passed' ? 'success' : node.gate === 'blocked' ? 'danger' : node.gate === 'stale' ? 'warning' : 'neutral' },
    freshness: { label: '新鲜度', value: node.freshness === 'fresh' ? '当前有效' : '上游已变更', raw: node.freshness, tone: node.freshness === 'fresh' ? 'neutral' : 'warning' },
    acceptance: { label: '接纳', value: human ? node.acceptance === 'accepted' ? '人工已接纳' : '待人工接纳' : node.acceptance === 'accepted' ? '系统已确认' : '无独立接纳动作', raw: node.acceptance, tone: human && node.acceptance !== 'accepted' ? 'warning' : node.acceptance === 'accepted' ? 'success' : 'neutral' },
    effectivelyPassed: node.execution === 'completed' && node.gate === 'passed' && node.freshness === 'fresh' && (!human || node.acceptance === 'accepted'),
  };
}

export function getWorkflowProgress(run: WorkflowRun | undefined, nodes: NodeRun[]) {
  const definitions = run?.definition.nodes || [];
  const byDefinition = new Map(nodes.filter(node => node.workflowRunId === run?.id).map(node => [node.nodeId, node]));
  let completed = 0, stale = 0, awaitingAcceptance = 0;
  for (const definition of definitions) {
    const node = byDefinition.get(definition.id);
    if (!node) continue;
    if (getStepStatus(node, definition).effectivelyPassed) completed++;
    if (node.freshness === 'stale') stale++;
    if (node.execution === 'completed' && requiresHumanAcceptance(definition) && node.acceptance !== 'accepted') awaitingAcceptance++;
  }
  return { completed, total: definitions.length, percent: definitions.length ? Math.round(completed / definitions.length * 100) : undefined, stale, awaitingAcceptance };
}

/** Recommendation changes only in follow mode; callers retain explicit historical selection. */
export function selectCurrentNode(run: WorkflowRun | undefined, nodes: NodeRun[]) {
  if (!run) return undefined;
  const ordered = run.definition.nodes.map(definition => nodes.find(node => node.workflowRunId === run.id && node.nodeId === definition.id)).filter((node): node is NodeRun => !!node);
  const priority: NodeRun['execution'][][] = [['waiting_interaction'], ['reconciling'], ['starting', 'running'], ['failed', 'cancelled']];
  for (const states of priority) { const node = ordered.find(node => states.includes(node.execution)); if (node) return node; }
  return ordered.find(node => node.freshness === 'stale') || ordered.find(node => node.execution === 'pending') || ordered.find(node => !getStepStatus(node, run.definition.nodes.find(definition => definition.id === node.nodeId)).effectivelyPassed) || ordered.at(-1);
}

const defaultGroups = [
  { name: '需求', ids: ['specify', 'clarify', 'review-spec'] }, { name: '设计', ids: ['plan', 'review-plan'] },
  { name: '任务', ids: ['tasks', 'review-tasks'] }, { name: '实现', ids: ['implement', 'verify', 'review-code'] },
  { name: '交付', ids: ['converge', 'review-converge', 'accept'] },
];

/** Visual grouping never rearranges execution order or adds absent legacy nodes. */
export function groupWorkflowNodes(run: WorkflowRun | undefined, nodes: NodeRun[]) {
  if (!run) return [];
  const definitions = run.definition.nodes;
  const knownIds = defaultGroups.flatMap(group => group.ids);
  const ids = definitions.map(definition => definition.id);
  const isDefault = run.definition.id === 'spec-driven' && (ids.join(',') === knownIds.join(',') || ids.join(',') === knownIds.filter(id => id !== 'clarify').join(','));
  const ordered = definitions.map(definition => nodes.find(node => node.workflowRunId === run.id && node.nodeId === definition.id)).filter((node): node is NodeRun => !!node);
  if (!isDefault) return [{ name: '流程步骤', nodes: ordered }];
  return defaultGroups.map(group => ({ name: group.name, nodes: ordered.filter(node => group.ids.includes(node.nodeId)) })).filter(group => group.nodes.length);
}

export type ReadinessState = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready' | 'blocked'; reasons: string[] };

type VersionMarker = { id: string; revision: number };
/** Readiness also depends on peer execution and review/clarification records. */
export function getFlowReadinessKey(node: VersionMarker | undefined, run: VersionMarker | undefined, snapshot?: {
  project?: { revision: number }; requirements?: { current: { id: string } };
  nodes?: VersionMarker[]; revisions?: VersionMarker[]; clarifications?: VersionMarker[];
  artifacts?: VersionMarker[]; candidates?: VersionMarker[]; evidence?: VersionMarker[];
}) {
  const versions = (items?: VersionMarker[]) => items?.map(item => `${item.id}:${item.revision}`).join(',') || '';
  return [node?.id, node?.revision, run?.id, run?.revision, snapshot?.project?.revision, snapshot?.requirements?.current.id,
    versions(snapshot?.nodes), versions(snapshot?.revisions), versions(snapshot?.clarifications), versions(snapshot?.artifacts), versions(snapshot?.candidates), versions(snapshot?.evidence)].join('|');
}

/** Alternate entry points for a node must observe the same unresolved resource writes. */
export function getNodeDispatchScopes(node?: Pick<NodeRun, 'id' | 'type' | 'currentAttemptId'>, candidateId?: string) {
  if (!node) return { scope: '', locks: [] as string[] };
  const nodeScope = `node:${node.id}`, attemptScope = node.currentAttemptId ? `attempt:${node.currentAttemptId}` : undefined;
  const candidateScope = node.type === 'human' && candidateId ? `candidate:${candidateId}` : undefined;
  return { scope: candidateScope || nodeScope, locks: [nodeScope, ...(attemptScope ? [attemptScope] : []), ...(candidateScope ? [candidateScope] : [])] };
}

/** Local drafts restrict dispatch, never rewrite gate, acceptance or freshness. */
export function dispatchBlockers(readiness: ReadinessState, clientBlockers: string[]) {
  return [...new Set([
    ...(readiness.state === 'loading' ? ['正在检查运行条件'] : readiness.state === 'error' ? [`无法检查运行条件：${readiness.message}`] : readiness.state === 'blocked' ? readiness.reasons.length ? readiness.reasons : ['服务端条件尚未满足'] : []),
    ...clientBlockers,
  ])];
}

export function getConditionReasons(readiness: ReadinessState, clientBlockers: string[], nodeBlockers: string[]) {
  const reasons = new Map<string, { reason: string; sources: string[] }>();
  const add = (reason: string, source: string) => {
    const key = reason.trim().replace(/^项目章程读取失败[：:]\s*/, '');
    const existing = reasons.get(key);
    if (existing) { if (!existing.sources.includes(source)) existing.sources.push(source); }
    else reasons.set(key, { reason, sources: [source] });
  };
  dispatchBlockers(readiness, []).forEach(reason => add(reason, '服务端运行检查'));
  nodeBlockers.forEach(reason => add(reason, '步骤记录'));
  clientBlockers.forEach(reason => add(reason, '客户端检查'));
  return [...reasons.values()];
}

/** The center retains 560px even when the inspector is expanded or dragged wider. */
export function contextPaneSizing(containerWidth: number) {
  const maxWidth = Math.min(400, Math.floor(containerWidth - 560 - 12));
  return { maxWidth, inlineAllowed: maxWidth >= 280 };
}

export interface NextAction {
  kind: 'dispatch' | 'evidence' | 'attention' | 'run' | 'artifact' | 'blocked' | 'retry' | 'requirements';
  label: string; summary: string; disabled: boolean; attentionId?: string;
}

export function getNextAction(input: {
  node?: NodeRun; runState?: WorkflowRun['state']; accepted: boolean; readiness: ReadinessState;
  clientBlocked: boolean; unsavedRequirements: boolean; dispatchEnabled: boolean; hasOutput: boolean; hasAttempt: boolean;
  waiting?: { id: string; kind: string; title: string }; reviewable?: { id: string; title: string }; pendingCount: number;
}): NextAction {
  const { node, readiness, waiting, reviewable } = input;
  let result: NextAction = {
    kind: 'dispatch', label: node?.type === 'human' ? '接纳候选代码' : node?.freshness === 'stale' ? '基于当前依据重新运行' : node?.execution === 'completed' ? '创建新尝试' : '运行此步骤', disabled: !input.dispatchEnabled,
    summary: readiness.state === 'ready' ? input.clientBlocked ? '服务端条件满足，本地输入尚需处理。' : '运行条件已满足，可基于已保存的材料开始。' : readiness.state === 'error' ? '无法检查运行条件，请重试检查。' : readiness.state === 'loading' ? '正在检查运行条件…' : '当前步骤还缺少运行条件。',
  };
  if (input.accepted) result = { kind: 'evidence', label: '查看交付证据', summary: '此工作项已交付。步骤百分比与交付状态分别记录。', disabled: false };
  else if (waiting) result = { kind: 'attention', label: waiting.kind === 'clarification' ? '回答需求澄清' : '处理问题或授权', summary: `${waiting.title}${input.pendingCount > 1 ? ` · 还有 ${input.pendingCount - 1} 项待处理` : ''}`, disabled: false, attentionId: waiting.id };
  else if (node && ['starting', 'running', 'waiting_interaction', 'reconciling'].includes(node.execution)) result = { kind: 'run', label: node.execution === 'reconciling' ? '核对原执行' : '查看本次执行', summary: node.execution === 'reconciling' ? '原执行状态待核对，请先确认原执行身份与状态。' : node.execution === 'waiting_interaction' ? '正在等待交互状态同步，可查看原执行。' : '本次执行正在进行，运行详情保留原执行身份与可用控制。', disabled: false };
  else if (node && ['failed', 'cancelled'].includes(node.execution)) result = { kind: 'run', label: node.execution === 'failed' ? '查看失败与恢复入口' : '查看已停止的执行', summary: node.error || '先检查原执行结果，再决定恢复或创建新尝试。', disabled: false };
  else if (reviewable) result = { kind: 'attention', label: '审阅并接纳已复核产物', summary: `${reviewable.title} · 先检查复核证据和接纳条件。`, disabled: false, attentionId: reviewable.id };
  else if (node?.execution === 'completed' && node.freshness !== 'stale' && input.hasOutput) result = { kind: 'artifact', label: '阅读产物与接纳条件', summary: '执行已结束，工程状态请分别查看门禁、接纳与新鲜度。', disabled: false };
  else if (node?.execution === 'completed' && node.freshness !== 'stale' && input.hasAttempt) result = { kind: 'run', label: '查看结果与证据', summary: '执行已结束；查看完整结果及其冻结依据。', disabled: false };
  else if (input.runState !== 'active') result = { kind: 'blocked', label: input.runState === 'paused' ? '流程已暂停' : '此流程暂不启动新步骤', summary: '当前流程不会启动新步骤，已有执行仍可查看和核对。', disabled: true };
  else if (readiness.state === 'error') result = { kind: 'retry', label: '重试运行条件检查', summary: result.summary, disabled: false };
  else if (input.unsavedRequirements) result = { kind: 'requirements', label: '处理需求草稿', summary: result.summary, disabled: false };
  if (!input.accepted && node?.freshness === 'stale') result.summary += ' 此步骤使用的上游依据已变更，需要重新核实。';
  if (input.runState === 'paused' && node && ['starting', 'running', 'waiting_interaction', 'reconciling'].includes(node.execution)) result.summary += ' 流程已暂停后续派发，当前执行未因此暂停。';
  return result;
}
