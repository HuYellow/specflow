import { compileWorkflow, type NodeRun, type WorkflowRun } from '../domain/index.ts';
import type { AutomationRun } from '../domain/automation.ts';

export type AutomationAction = { kind: 'dispatch'; nodeRunId: string; reason: string; actionKey: string }
  | { kind: 'observe' | 'await_input' | 'await_acceptance' | 'block'; nodeRunId?: string; reason: string }
  | { kind: 'complete'; reason: string };
/** This planner consumes readiness computed by the service. It never accepts an
 * artifact, retries failed execution, or invokes a human node. The service must
 * check expected revisions/readiness again before executing a dispatch action. */
export function selectNextAutomationAction(input: {
  run: WorkflowRun; nodes: NodeRun[];
  readiness: Record<string, { ready: boolean; reasons: string[] }>;
  automation?: AutomationRun;
  pendingClarificationNodeIds?: string[]; pendingInteractionNodeIds?: string[];
  existingLogicalIds?: string[];
  blockedReason?: string;
}): AutomationAction {
  const { run } = input;
  if (input.automation && (input.automation.workflowRunId !== run.id || input.automation.state !== 'active' || !input.automation.settings.autoAdvance)) return { kind: 'block', reason: 'automation_inactive' };
  if (run.state !== 'active') return { kind: 'block', reason: 'workflow_inactive' };
  if (input.blockedReason) return { kind: 'block', reason: input.blockedReason };
  if (!compileWorkflow(run.definition, input.existingLogicalIds).valid) return { kind: 'block', reason: 'workflow_invalid' };
  const nodes = input.nodes.filter(node => node.workflowRunId === run.id);
  const waiting = nodes.find(n => input.pendingClarificationNodeIds?.includes(n.id) || input.pendingInteractionNodeIds?.includes(n.id) || n.execution === 'waiting_interaction');
  if (waiting) return { kind: 'await_input', nodeRunId: waiting.id, reason: 'waiting_for_input' };
  const active = nodes.find(n => ['starting', 'running', 'reconciling'].includes(n.execution));
  if (active) return { kind: 'observe', nodeRunId: active.id, reason: active.execution === 'reconciling' ? 'execution_unknown' : 'execution_active' };
  const waitingAcceptance: { nodeRunId: string; outputs: string[] }[] = [];
  for (const def of run.definition.nodes) {
    const node = nodes.find(n => n.nodeId === def.id);
    if (!node) return { kind: 'block', reason: 'node_missing' };
    if (node.freshness === 'stale' || node.gate === 'stale') return { kind: 'block', nodeRunId: node.id, reason: 'input_stale' };
    if (['failed', 'cancelled'].includes(node.execution)) return { kind: 'block', nodeRunId: node.id, reason: 'explicit_retry_required' };
    if (def.type === 'human') {
      if (node.execution === 'completed' && node.acceptance === 'accepted' && node.gate === 'passed') continue;
      return { kind: 'await_acceptance', nodeRunId: node.id, reason: 'human_action_required' };
    }
    if (node.execution === 'completed') {
      if (node.gate === 'blocked') return { kind: 'block', nodeRunId: node.id, reason: 'gate_blocked' };
      if (def.requireAcceptance && node.acceptance !== 'accepted') { waitingAcceptance.push({ nodeRunId: node.id, outputs: def.outputs }); continue; }
      if (node.gate !== 'passed') return { kind: 'block', nodeRunId: node.id, reason: 'gate_unchecked' };
      continue;
    }
    if (waitingAcceptance.length) {
      const pendingOutputs = new Set(waitingAcceptance.flatMap(n => n.outputs));
      const acceptancePrerequisite = ['review', 'clarify'].includes(def.type) && def.inputs.some(i => !i.endsWith('@accepted') && pendingOutputs.has(i.split('@')[0]));
      if (!acceptancePrerequisite) return { kind: 'await_acceptance', nodeRunId: waitingAcceptance[0].nodeRunId, reason: 'artifact_acceptance_required' };
    }
    const readiness = input.readiness[node.id];
    if (!readiness?.ready) return { kind: 'block', nodeRunId: node.id, reason: readiness?.reasons.join('; ') || 'readiness_unknown' };
    const owner = input.automation?.id ?? run.id;
    return { kind: 'dispatch', nodeRunId: node.id, reason: 'next_ready_node', actionKey: `${owner}:${node.id}:${node.revision}` };
  }
  if (waitingAcceptance.length) return { kind: 'await_acceptance', nodeRunId: waitingAcceptance[0].nodeRunId, reason: 'artifact_acceptance_required' };
  return { kind: 'complete', reason: 'workflow_finished' };
}
