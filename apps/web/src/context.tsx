import { createContext, useContext, type ReactNode } from 'react';
import { FileText, Activity, ShieldCheck, ListChecks, Blocks, FileCheck2, CircleHelp } from 'lucide-react';
import type { Artifact, ArtifactRevision, Candidate, Comment, Decision, Evidence, ExecutionBinding, Finding, Interaction, ModelTarget, NodeRun, Project, TaskRun, Attempt, WorkItem, Workflow, WorkflowRun, RequirementRevision, ClarificationSession, ClarificationDraft } from '../../../packages/domain/index.ts';
import type { AttentionItem } from './attention.ts';
import type { BackendCatalog } from './backendSelection.ts';
import { localizedDate, localizedLabels, t } from './i18n.ts';
import type { AutomationRun, RepairCycle } from '../../../packages/domain/index.ts';
export type { BackendCatalog } from './backendSelection.ts';
export { targetLabel, serializeTarget } from './backendSelection.ts';
export type Snapshot = { item: WorkItem; requirements: { current: RequirementRevision; history: RequirementRevision[] }; clarifications: ClarificationSession[]; clarificationDrafts: ClarificationDraft[]; project: Project; workflows: Workflow[]; runs: WorkflowRun[]; nodes: NodeRun[]; attempts: Attempt[]; bindings: ExecutionBinding[]; artifacts: Artifact[]; revisions: ArtifactRevision[]; candidates: Candidate[]; evidence: Evidence[]; findings: Finding[]; tasks: TaskRun[]; comments: Comment[]; decisions: Decision[]; interactions: Interaction[]; repairCycles?: RepairCycle[]; automationRuns?: AutomationRun[] };
export type Tab = 'flow' | 'requirements' | 'artifacts' | 'code' | 'runs';
export type DocumentView = 'reading' | 'execution' | 'compare';
export interface WorkspaceContext {
  snapshot?: Snapshot; project?: Project; backend: BackendCatalog | undefined; busy: boolean; tab: Tab; setTab(tab: Tab): void;
  selectedNode: string; setSelectedNode(id: string): void; selectedArtifact: string; setSelectedArtifact(id: string): void;
  selectedAttempt: string; setSelectedAttempt(id: string): void;
  selectedRevision: string; setSelectedRevision(id: string): void;
  documentView: DocumentView; setDocumentView(view: DocumentView): void;
  selectionMode: 'follow' | 'pinned'; followCurrent(): void;
  pendingItems: AttentionItem[]; openAttention(item: AttentionItem): void; openPending(): void;
  openRun(id: string): void; isPending(scope: string): boolean;
  overlayOpen: boolean;
  perform(operation: () => Promise<unknown>, message?: string, scope?: string): Promise<void>;
  refresh(id?: string, projectId?: string): Promise<void>; openWorkflow(): void; openImport(): void; openSettings(): void;
}
export const Workspace = createContext<WorkspaceContext>(null!);
export const useWorkspace = () => useContext(Workspace);
export const labels = localizedLabels({ pending: '待执行', starting: '启动中', running: '执行中', waiting_interaction: '等待回答', completed: '执行已结束', failed: '执行失败', cancelled: '已停止', reconciling: '待核对', passed: '已通过', blocked: '阻塞', stale: '已过期', accepted: '已接纳', unchecked: '待检查', candidate: '候选', tested: '测试通过·待复核', verified: '已验证', open: '未解决', resolved: '已解决', waived: '已记录例外' });
export const logicalLabels = localizedLabels({ spec: '需求规格', plan: '工程设计', tasks: '任务拆解', implementation: '实现说明', convergence: '对齐报告' });
export const fmt = localizedDate;
export const short = (value?: string) => value ? value.slice(0, 8) : '—';
export function NodeIcon({ type, size = 18 }: { type: string; size?: number }) { return type === 'clarify' ? <CircleHelp size={size} /> : type === 'review' ? <ShieldCheck size={size} /> : type === 'verify' ? <ListChecks size={size} /> : type === 'human' ? <FileCheck2 size={size} /> : <Blocks size={size} />; }
export function Empty({ icon, title, description }: { icon: ReactNode; title: string; description: string }) { return <div className="empty-state"><div>{icon}</div><h3>{t(title)}</h3><p>{t(description)}</p></div>; }
