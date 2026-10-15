import type { Snapshot } from './context.tsx';

export interface AttentionItem {
  id: string;
  kind: 'clarification' | 'interaction' | 'finding' | 'artifact';
  title: string;
  detail: string;
  nodeRunId?: string;
  attemptId?: string;
  artifactId?: string;
  revisionId?: string;
  stale: boolean;
  priority: number;
}
/** Real objects are counted once; gate messages are explanations, never tasks. */
export function getAttentionItems(snapshot?: Snapshot): AttentionItem[] {
  if (!snapshot || snapshot.item.status === 'accepted') return [];
  const items: AttentionItem[] = [];
  for (const session of snapshot.clarifications) {
    if (session.state !== 'waiting_answers') continue;
    const revision = snapshot.revisions.find(r => r.id === session.sourceSpecRevisionId);
    items.push({ id: `clarification:${session.id}`, kind: 'clarification', title: '回答需求澄清', detail: `${session.questions.filter(q => !q.answer).length} 个问题 · 规格 ${revision ? snapshot.artifacts.find(a => a.id === revision.artifactId)?.revisionIds.indexOf(revision.id)! + 1 : '历史版本'}`, nodeRunId: session.nodeRunId, stale: false, priority: 0 });
  }
  for (const interaction of snapshot.interactions) {
    if (interaction.state !== 'pending') continue;
    const attempt = snapshot.attempts.find(a => a.id === interaction.attemptId);
    const kind = (interaction.request as { kind?: string } | null)?.kind;
    items.push({ id: `interaction:${interaction.id}`, kind: 'interaction', title: kind === 'question' ? '回答执行问题' : kind === 'form' ? '填写执行表单' : '确认本次工具操作', detail: `${snapshot.nodes.find(n => n.id === attempt?.nodeRunId)?.name || '执行请求'} · 尝试 ${attempt?.number || '—'}`, nodeRunId: attempt?.nodeRunId, attemptId: attempt?.id, stale: !!attempt && ['completed', 'cancelled', 'failed'].includes(attempt.execution), priority: 0 });
  }
  for (const finding of snapshot.findings) {
    if (finding.status !== 'open') continue;
    items.push({ id: `finding:${finding.id}`, kind: 'finding', title: finding.severity === 'blocker' ? '处理阻塞发现' : '审阅复核警告', detail: `${finding.location} · ${finding.body}`, nodeRunId: finding.nodeRunId, attemptId: finding.originAttemptId, stale: false, priority: finding.severity === 'blocker' ? 2 : 4 });
  }
  for (const artifact of snapshot.artifacts) {
    if (artifact.acceptedRevisionId === artifact.currentRevisionId) continue;
    const revision = snapshot.revisions.find(r => r.id === artifact.currentRevisionId);
    if (!revision) continue;
    const attempt = snapshot.attempts.find(a => a.id === revision.originAttemptId);
    const sourceNode = snapshot.nodes.find(node => node.id === attempt?.nodeRunId);
    const stale = !!(sourceNode?.freshness === 'stale' || (revision.requirementRevisionId && revision.requirementRevisionId !== snapshot.requirements.current.id) || (revision.guidanceHash && revision.guidanceHash !== snapshot.project.guidance?.contentHash));
    items.push({ id: `artifact:${revision.id}`, kind: 'artifact', title: `${revision.reviewed ? '接纳' : '审阅'} ${artifact.logicalId}.md`, detail: `版本 ${artifact.revisionIds.indexOf(revision.id) + 1} · ${stale ? '依据已变更' : revision.reviewed ? '已有独立复核' : '需要独立复核'}`, nodeRunId: attempt?.nodeRunId, attemptId: attempt?.id, artifactId: artifact.id, revisionId: revision.id, stale, priority: stale ? 5 : revision.reviewed ? 3 : 4 });
  }
  return [...new Map(items.map(item => [item.id, item])).values()].sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
}
