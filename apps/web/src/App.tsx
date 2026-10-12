import { useEffect, useRef, useState } from 'react';
import { Activity, Check, CheckCircle2, ChevronDown, ChevronRight, CircleDot, Code2, Download, FileText, FolderGit2, GitBranch, Layers3, Plus, RefreshCcw, Settings2, X } from 'lucide-react';
import type { Project, WorkItem } from '../../../packages/domain/index.ts';
import { api } from './api.ts';
import { Workspace, logicalLabels, short, type Snapshot, type Tab } from './context.tsx';
import { Flow } from './Flow.tsx';
import { Documents } from './Documents.tsx';
import { CodeView } from './CodeView.tsx';
import { Runs } from './Runs.tsx';
import { Dialogs } from './Dialogs.tsx';
import { Requirements } from './Requirements.tsx';
import { WorkspaceSwitcher } from './WorkspaceSwitcher.tsx';
export default function App() {
  const [bootstrap, setBootstrap] = useState<{ projects: Project[]; workItems: WorkItem[] }>();
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const selection = useRef({ projectId: '', itemId: '' });
  const refreshVersion = useRef(0);
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [backend, setBackend] = useState<any>();
  const [tab, setTab] = useState<Tab>('flow');
  const [selectedNode, setSelectedNode] = useState('');
  const [selectedArtifact, setSelectedArtifact] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; error?: boolean }>();
  const [modal, setModal] = useState<'project' | 'item' | 'workflow' | 'settings' | 'import' | null>(null);
  const exportEvidence = () => {
    if (!snapshot) return;
    if (window.specflowDesktop) void perform(() => window.specflowDesktop!.exportEvidence(snapshot.item.id));
    else window.open(`/api/work-items/${snapshot.item.id}/export`, '_blank');
  };
  const stored = (key: string) => { try { return localStorage.getItem(key) || ''; } catch { return ''; } };
  const remember = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch {} };
  function resetItemView() { setSnapshot(undefined); setSelectedNode(''); setSelectedArtifact(''); setSelectedAttempt(''); setTab('flow'); }
  async function refresh(nextItem?: string, nextProject?: string) {
    if (nextItem !== undefined || nextProject !== undefined) {
      const projectId = nextProject || bootstrap?.workItems.find(item => item.id === nextItem)?.projectId || selection.current.projectId;
      const itemId = nextItem || '';
      if (selection.current.projectId !== projectId || selection.current.itemId !== itemId) resetItemView();
      selection.current = { projectId, itemId }; setSelectedProject(projectId); setSelectedItem(itemId);
    }
    const version = ++refreshVersion.current, intent = { ...selection.current };
    const boot = await api<{ projects: Project[]; workItems: WorkItem[] }>('/bootstrap');
    if (version !== refreshVersion.current) return;
    setBootstrap(boot);
    const legacyItem = boot.workItems.find(item => item.id === stored('specflow-work-item'));
    const projectId = [intent.projectId, stored('specflow-project'), legacyItem?.projectId, boot.projects[0]?.id].find(id => boot.projects.some(project => project.id === id)) || '';
    const items = boot.workItems.filter(item => item.projectId === projectId);
    const itemId = [intent.itemId, stored(`specflow-work-item-${projectId}`), legacyItem?.projectId === projectId ? legacyItem.id : '', items[0]?.id].find(id => items.some(item => item.id === id)) || '';
    const changed = selection.current.projectId !== projectId || selection.current.itemId !== itemId;
    selection.current = { projectId, itemId }; setSelectedProject(projectId); setSelectedItem(itemId);
    if (changed) resetItemView();
    if (projectId) remember('specflow-project', projectId);
    if (!itemId) { setSnapshot(undefined); return; }
    remember(`specflow-work-item-${projectId}`, itemId); remember('specflow-work-item', itemId);
    const data = await api<Snapshot>(`/work-items/${itemId}`);
    if (version === refreshVersion.current && selection.current.projectId === projectId && selection.current.itemId === itemId && data.item.projectId === projectId && data.item.id === itemId) setSnapshot(data);
  }
  async function perform(operation: () => Promise<unknown>, message?: string) {
    if (busy) return; setBusy(true);
    try { await operation(); await refresh(); if (message) setToast({ message }); }
    catch (error) { setToast({ message: (error as Error).message, error: true }); }
    finally { setBusy(false); }
  }
  useEffect(() => { refresh().catch(e => setToast({ message: e.message, error: true })); api('/backend/targets').then(setBackend).catch(() => undefined); }, []);
  useEffect(() => {
    const source = new EventSource('/api/events'); let timer: ReturnType<typeof setTimeout> | undefined;
    source.onmessage = () => { if (!timer) timer = setTimeout(() => { timer = undefined; refresh().catch(() => undefined); }, 300); };
    return () => { source.close(); if (timer) clearTimeout(timer); };
  }, []);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(undefined), 6000); return () => clearTimeout(timer); } }, [toast]);
  const project = bootstrap?.projects.find(p => p.id === selectedProject);
  const activeSnapshot = snapshot?.item.id === selectedItem && snapshot.item.projectId === selectedProject ? snapshot : undefined;
  const items = bootstrap?.workItems.filter(item => item.projectId === selectedProject) || [];
  const artifacts = activeSnapshot?.artifacts.filter(artifact => artifact.workItemId === selectedItem) || [];
  const context = { snapshot: activeSnapshot, project: activeSnapshot?.project || project, backend, busy, tab, setTab, selectedNode, setSelectedNode, selectedArtifact, setSelectedArtifact, selectedAttempt, setSelectedAttempt, perform, refresh, openWorkflow: () => setModal('workflow'), openImport: () => setModal('import'), openSettings: () => setModal('settings') };
  return <Workspace.Provider value={context}><div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="SpecFlow 首页"><span className="brand-mark"><Layers3 size={23} /></span><span>specflow<span className="brand-dot">.</span></span></a>
      <div className="workspace-label">工程工作空间 <span>LOCAL</span><button className="workspace-open-button" disabled={busy} onClick={() => setModal('project')} aria-label="打开 Git 仓库" title="打开 Git 仓库，添加工作空间"><Plus size={16} /></button></div>
      <WorkspaceSwitcher projects={bootstrap?.projects || []} value={selectedProject} disabled={busy || !bootstrap?.projects.length} onChange={id => { setModal(null); void refresh(undefined, id).catch(error => setToast({ message: error.message, error: true })); }} />
      <div className="section-label">工作项 <span>{items.length}</span><button disabled={!project || busy} onClick={() => setModal('item')} aria-label="新建工作项"><Plus size={16} /></button></div>
      <div className="item-list" aria-label="当前空间的工作项">{items.map(item => <button key={item.id} className={item.id === selectedItem ? 'item active' : 'item'} onClick={() => void refresh(item.id, item.projectId).catch(error => setToast({ message: error.message, error: true }))}><CircleDot size={15} /><span>{item.name}</span>{item.status === 'accepted' && <Check size={13} />}</button>)}{project && !items.length && <p className="sidebar-empty">当前空间暂无工作项</p>}</div>
      <div className="sidebar-divider" />
      <div className="section-label">工程产物 <span>{artifacts.length}</span></div>
      <div className="artifact-nav" aria-label="当前工作项的工程产物">{artifacts.map((a, index) => <button key={a.id} className={tab === 'artifacts' && (selectedArtifact === a.id || (!selectedArtifact && index === 0)) ? 'active' : ''} onClick={() => { setTab('artifacts'); setSelectedArtifact(a.id); }}><FileText size={16} /><span>{logicalLabels[a.logicalId] || a.logicalId}</span><span className={`tiny-status ${a.acceptedRevisionId === a.currentRevisionId ? 'accepted' : ''}`} /></button>)}{!artifacts.length && <p className="sidebar-empty">{selectedItem ? '此工作项尚无工程产物' : '选择工作项后查看产物'}</p>}</div>
      <div className="sidebar-bottom"><div className="host-status"><span className={backend?.maka.available ? 'online-dot' : 'offline-dot'} /><span>Maka Runtime Host</span><span>{backend?.maka.available ? '已连接' : '未连接'}</span></div><button disabled={!project} onClick={() => setModal('settings')}><Settings2 size={16} /> 工程设置 <span>v0.1</span></button></div>
    </aside><div className="main-shell"><header className="topbar"><div className="breadcrumb"><FolderGit2 size={16} /><span>{project?.name || '工作空间'}</span><ChevronRight size={13} /><strong>{activeSnapshot ? activeSnapshot.item.kind === 'bug' ? '缺陷修复' : '功能开发' : '工程工作空间'}</strong></div><div className="top-actions"><span className="local-chip"><span /> 本地工作台</span><button className="icon-button" title="刷新" onClick={() => { refresh(); api('/backend/targets').then(setBackend); }}><RefreshCcw size={16} /></button><button className="icon-button" title="工程设置" disabled={!project} onClick={() => setModal('settings')}><Settings2 size={17} /></button><div className="avatar">L</div></div></header>
      <main>{activeSnapshot ? <><section className="workitem-heading"><div><div className="eyebrow">WORK ITEM <span>{short(snapshot?.item.id).toUpperCase()}</span></div><h1>{snapshot?.item.name || '让开发过程，有迹可循。'}</h1><p>{snapshot ? (snapshot.item.request ? `${snapshot.item.request.slice(0, 220)}${snapshot.item.request.length > 220 ? '…' : ''}` : '完整需求见「需求输入」中的文档。') : '打开一个 Git 仓库，组织流程、模型与工程产物。'}</p><div className="workitem-meta"><span><GitBranch size={14} />{snapshot?.item.branch.split('/').pop()}</span><span>基线 <code>{short(snapshot?.item.acceptedCommit)}</code></span><span className="status-text">{snapshot?.item.status === 'accepted' ? <><CheckCircle2 size={14} /> 改动已接纳</> : <><CircleDot size={14} /> 开发中</>}</span></div></div><button className="outline-button export-button" onClick={exportEvidence}><Download size={16} /> 导出工程记录</button></section>
      {snapshot?.project.demo && <div className="demo-notice"><span className="demo-symbol">◈</span><span><strong>隔离验收项目</strong> 使用本地确定性后端体验完整流程，真实文件修改与测试会在独立工作区执行。</span><span className="notice-end">不调用模型 API</span></div>}
      <div className="tab-bar"><div className="tabs">{([{ id: 'flow', name: '开发流程', icon: <GitBranch size={16} /> }, { id: 'requirements', name: '需求输入', icon: <FileText size={16} /> }, { id: 'artifacts', name: '文档产物', icon: <FileText size={16} /> }, { id: 'code', name: '代码与验证', icon: <Code2 size={16} /> }, { id: 'runs', name: '运行记录', icon: <Activity size={16} /> }] as const).map(t => <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.icon}{t.name}{t.id === 'artifacts' && !!snapshot?.artifacts.length && <span>{snapshot.artifacts.length}</span>}</button>)}</div><div className="tab-info"><span className="online-dot" />{busy ? '同步中' : '状态已同步'}</div></div>
      {tab === 'flow' ? <Flow /> : tab === 'requirements' ? <Requirements /> : tab === 'artifacts' ? <Documents /> : tab === 'code' ? <CodeView /> : <Runs />}
      </> : <section className="workspace-empty"><div className="workspace-empty-symbol"><FolderGit2 size={35} /></div><span className="eyebrow">ENGINEERING WORKSPACE</span><h1>{project?.name || "打开一个工程工作空间"}</h1><code>{project?.rootPath || "每个空间对应一个项目目录"}</code><h2>{selectedItem ? "正在读取此工作项…" : project ? "该工作空间还没有工作项" : "从 Git 项目目录开始"}</h2><p>{project ? "在当前空间新建工作项，管理它的需求、流程、代码和产物。" : "打开项目目录，然后在左侧选择空间和对应的工作项。"}</p><button className="primary-button" disabled={busy} onClick={() => selectedItem ? refresh() : setModal(project ? "item" : "project")}><Plus size={16} />{selectedItem ? "重新读取工作项" : project ? "在此空间新建工作项" : "打开 Git 仓库"}</button></section>}<footer className="page-footer"><span>空间 → 工作项 → 工程产物</span><span>SpecFlow · 工程控制层</span></footer></main>
    </div>{toast && <div role="status" className={`toast ${toast.error ? 'error' : ''}`}><CircleDot size={17} /><span>{toast.message}</span><button onClick={() => setToast(undefined)} aria-label="关闭通知"><X size={15} /></button></div>}
    {modal && <Dialogs key={`${modal}-${selectedProject}`} modal={modal} close={() => setModal(null)} open={setModal} projects={bootstrap?.projects || []} setBackend={setBackend} />}
  </div></Workspace.Provider>;
}
