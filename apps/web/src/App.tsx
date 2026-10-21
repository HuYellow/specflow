import { t, useLocale } from './i18n.ts';
import { LanguageSwitcher } from './LanguageSwitcher.tsx';
import { useEffect, useRef, useState } from 'react';
import { Activity, Bell, Check, CheckCircle2, ChevronRight, CircleDot, Code2, Download, FileText, FolderGit2, GitBranch, Layers3, Loader2, Menu, MoreHorizontal, Plus, Search, RefreshCcw, Settings2, X } from 'lucide-react';
import type { Project, WorkItem } from '../../../packages/domain/index.ts';
import { api, ApiError } from './api.ts';
import { Workspace, logicalLabels, short, fmt, type Snapshot, type Tab, type BackendCatalog } from './context.tsx';
import { Flow } from './Flow.tsx';
import { Documents } from './Documents.tsx';
import { CodeView } from './CodeView.tsx';
import { Runs, RunDetail } from './Runs.tsx';
import { Dialogs } from './Dialogs.tsx';
import { Requirements } from './Requirements.tsx';
import { WorkspaceSwitcher } from './WorkspaceSwitcher.tsx';
import { useModalFocus } from './useModalFocus.ts';
import { Drawer } from './Drawer.tsx';
import { getAttentionItems, type AttentionItem } from './attention.ts';
import { emptyLocation, readLocation, locationSearch, validateLocation, type ViewLocation } from './location.ts';
import { useWorkspaceEvents } from './useWorkspaceEvents.ts';
import { backendInfo, projectBackend } from './backendSelection.ts';

const tabs = [{ id: 'flow', name: '开发流程', icon: GitBranch }, { id: 'requirements', name: '需求输入', icon: FileText }, { id: 'artifacts', name: '文档产物', icon: FileText }, { id: 'code', name: '代码与验证', icon: Code2 }, { id: 'runs', name: '运行记录', icon: Activity }] as const;
type Bootstrap = { projects: Project[]; workItems: WorkItem[] };
const stored = (key: string) => { try { return localStorage.getItem(key) || ''; } catch { return ''; } };
const remember = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch {} };
function savedLocation(item: string): ViewLocation {
  try { return readLocation(locationSearch({ ...emptyLocation, ...JSON.parse(stored(`specflow-view:${item}`) || '{}') })); } catch { return { ...emptyLocation }; }
}
const scrollKey = (view: ViewLocation) => `specflow-scroll:${view.item}:${view.view}:${view.artifact}:${view.revision}:${view.attempt}`;

export default function App() {
  const locale = useLocale();
  const [bootstrap, setBootstrap] = useState<Bootstrap>();
  const bootRef = useRef<Bootstrap | undefined>(undefined);
  const [view, setView] = useState(() => readLocation(window.location.search));
  const viewRef = useRef(view);
  const selection = useRef({ projectId: view.project, itemId: view.item });
  const refreshVersion = useRef(0);
  const latestRefresh = useRef<Promise<void> | undefined>(undefined);
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [backend, setBackend] = useState<BackendCatalog>();
  const [backendError, setBackendError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [lastSync, setLastSync] = useState('');
  const pending = useRef(new Set<string>());
  const [pendingScopes, setPendingScopes] = useState<string[]>([]);
  const [uncertainScopes, setUncertainScopes] = useState<string[]>(() => { try { const value = JSON.parse(sessionStorage.getItem('specflow-unconfirmed-writes') || '[]'); return Array.isArray(value) ? value.filter((scope): scope is string => typeof scope === 'string') : []; } catch { return []; } });
  const uncertainRef = useRef(new Set(uncertainScopes));
  const [, notifyDraft] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [itemQuery, setItemQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; error?: boolean }>();
  const [modal, setModal] = useState<'project' | 'item' | 'workflow' | 'settings' | 'import' | null>(null);
  const [detail, setDetail] = useState<'pending' | 'run' | null>(null);
  const sidebar = useRef<HTMLElement>(null);
  const navigationToggle = useRef<HTMLButtonElement>(null);
  const dialogTrigger = useRef<HTMLElement>(null);
  const detailTrigger = useRef<HTMLElement>(null);
  const historyQueued = useRef(false), historyMode = useRef<'push' | 'replace'>('replace');
  const busy = pendingScopes.includes('workspace') || uncertainScopes.includes('workspace');
  const isPending = (scope: string) => busy || pendingScopes.includes(scope) || uncertainScopes.includes(scope);

  function navigate(patch: Partial<ViewLocation>, mode: 'push' | 'replace' | 'none' = 'push') {
    const before = viewRef.current;
    try { sessionStorage.setItem(scrollKey(before), String(window.scrollY)); } catch {}
    const next = { ...before, ...patch };
    viewRef.current = next; setView(next);
    if (next.item) remember(`specflow-view:${next.item}`, JSON.stringify(next));
    if (next.project && next.item && window.specflowDesktop?.saveView) void window.specflowDesktop.saveView(next).catch(() => setToast({ message: t("当前阅读位置未能保存到桌面，下次重启可能需要重新定位。"), error: true }));
    if (mode === 'none') return;
    if (mode === 'push') historyMode.current = 'push';
    if (historyQueued.current) return;
    historyQueued.current = true;
    queueMicrotask(() => {
      historyQueued.current = false;
      const search = locationSearch(viewRef.current);
      if (search !== window.location.search) window.history[historyMode.current === 'push' ? 'pushState' : 'replaceState'](null, '', `${window.location.pathname}${search}`);
      historyMode.current = 'replace';
    });
  }
  const setTab = (tab: Tab) => navigate({ view: tab });
  const setSelectedNode = (id: string) => navigate({ node: id, mode: 'pinned' });
  const setSelectedArtifact = (id: string) => navigate({ artifact: id, revision: '', mode: 'pinned' });
  const setSelectedAttempt = (id: string) => navigate({ attempt: id, node: snapshot?.attempts.find(attempt => attempt.id === id)?.nodeRunId || viewRef.current.node, mode: 'pinned' });
  const followCurrent = () => navigate({ node: '', attempt: '', mode: 'follow', view: 'flow' });
  const openModal = (value: typeof modal) => {
    if (value && !modal) dialogTrigger.current = sidebarOpen ? navigationToggle.current : document.activeElement as HTMLElement;
    setSidebarOpen(false); setDetail(null); setModal(value);
  };
  const openRun = (id: string) => {
    if (!detail) {
      const active = document.activeElement as HTMLElement;
      detailTrigger.current = active.closest('[aria-modal="true"]') ? document.querySelector<HTMLElement>('.flow-layout-controls button, .attention-button') : active;
    }
    setSelectedAttempt(id); setSidebarOpen(false); setDetail('run');
  };
  const openPending = () => { const active = document.activeElement as HTMLElement; detailTrigger.current = active.closest('[aria-modal="true"]') ? document.querySelector<HTMLElement>('.attention-button') : active; setSidebarOpen(false); setDetail('pending'); };
  const openAttention = (item: AttentionItem) => {
    if (item.kind === 'interaction' && item.attemptId) { openRun(item.attemptId); return; }
    setDetail(null);
    if (item.kind === 'artifact') navigate({ view: 'artifacts', artifact: item.artifactId || '', revision: item.revisionId || '', mode: 'pinned' });
    else if (item.kind === 'finding') navigate({ view: 'code', node: item.nodeRunId || '', mode: 'pinned' });
    else navigate({ view: 'flow', node: item.nodeRunId || '', mode: 'pinned' });
  };

  function refresh(nextItem?: string, nextProject?: string, reloadBootstrap = true): Promise<void> {
    const request = loadWorkspace(nextItem, nextProject, reloadBootstrap);
    latestRefresh.current = request;
    return request;
  }
  async function loadWorkspace(nextItem?: string, nextProject?: string, reloadBootstrap = true) {
    const explicit = nextItem !== undefined || nextProject !== undefined;
    if (explicit) {
      selection.current = { projectId: nextProject || bootRef.current?.workItems.find(item => item.id === nextItem)?.projectId || selection.current.projectId, itemId: nextItem || '' };
      setDetail(null);
    }
    const version = ++refreshVersion.current, intent = { ...selection.current };
    setRefreshing(true); setLoadError('');
    try {
      const boot = reloadBootstrap || !bootRef.current ? await api<Bootstrap>('/bootstrap') : bootRef.current;
      if (version !== refreshVersion.current) { await latestRefresh.current; return; }
      bootRef.current = boot; setBootstrap(boot);
      const legacy = boot.workItems.find(item => item.id === stored('specflow-work-item'));
      const projectId = [intent.projectId, stored('specflow-project'), legacy?.projectId, boot.projects[0]?.id].find(id => boot.projects.some(project => project.id === id)) || '';
      const items = boot.workItems.filter(item => item.projectId === projectId);
      const itemId = [intent.itemId, stored(`specflow-work-item-${projectId}`), legacy?.projectId === projectId ? legacy.id : '', items[0]?.id].find(id => items.some(item => item.id === id)) || '';
      const changed = viewRef.current.project !== projectId || viewRef.current.item !== itemId;
      selection.current = { projectId, itemId };
      if (changed) {
        setSnapshot(undefined); setDetail(null);
        let previous = itemId ? savedLocation(itemId) : emptyLocation;
        if (itemId && !stored(`specflow-view:${itemId}`) && window.specflowDesktop?.readView) {
          previous = await window.specflowDesktop.readView(itemId).catch(() => null) || previous;
          if (version !== refreshVersion.current) { await latestRefresh.current; return; }
        }
        navigate({ ...previous, project: projectId, item: itemId }, explicit ? 'push' : 'replace');
      }
      if (projectId) remember('specflow-project', projectId);
      if (!itemId) { setSnapshot(undefined); setLastSync(new Date().toISOString()); return; }
      remember(`specflow-work-item-${projectId}`, itemId); remember('specflow-work-item', itemId);
      const data = await api<Snapshot>(`/work-items/${itemId}?history=summary`);
      if (version !== refreshVersion.current || selection.current.projectId !== projectId || selection.current.itemId !== itemId) { await latestRefresh.current; return; }
      if (data.item.projectId !== projectId || data.item.id !== itemId) throw new Error(t("工作项与所选工作空间不一致，请重新读取。"));
      const validated = validateLocation(viewRef.current, data);
      if (validated.invalid) { navigate(validated.location, 'replace'); setToast({ message: t("部分定位对象已失效，已返回当前可用内容。") }); }
      setSnapshot(data); setLastSync(new Date().toISOString());
    } catch (error) {
      if (version !== refreshVersion.current) { await latestRefresh.current; return; }
      if (version === refreshVersion.current) setLoadError((error as Error).message);
      throw error;
    } finally { if (version === refreshVersion.current) setRefreshing(false); }
  }
  async function loadBackend() { try { setBackend(await api<BackendCatalog>('/backend/targets')); setBackendError(''); } catch (error) { setBackendError((error as Error).message); throw error; } }
  async function perform(operation: () => Promise<unknown>, message?: string, scope = 'workspace') {
    if (pending.current.has('workspace') || pending.current.has(scope) || uncertainRef.current.has('workspace') || uncertainRef.current.has(scope) || (scope === 'workspace' && pending.current.size)) return;
    pending.current.add(scope); setPendingScopes([...pending.current]);
    try {
      await operation();
      try { await refresh(); } catch { setToast({ message: t("操作已完成，但状态同步失败。请刷新核对工程记录。"), error: true }); return; }
      if (message) setToast({ message });
    } catch (error) {
      setToast({ message: (error as Error).message, error: true });
      if (error instanceof ApiError && error.uncertain) {
        uncertainRef.current.add(scope); setUncertainScopes([...uncertainRef.current]);
        void refresh().catch(() => undefined);
      }
    } finally { pending.current.delete(scope); setPendingScopes([...pending.current]); }
  }
  const eventConnection = useWorkspaceEvents(async reload => { await refresh(undefined, undefined, reload); if (reload) await loadBackend(); }, selection.current);
  const manualRefresh = async () => {
    const results = await Promise.allSettled([refresh(), loadBackend()]);
    const failed = results.find(result => result.status === 'rejected');
    if (failed?.status === 'rejected') setToast({ message: failed.reason.message, error: true });
    else setToast(current => current?.error ? undefined : current);
  };
  useEffect(() => { void refresh().catch(error => setToast({ message: error.message, error: true })); void loadBackend().catch(() => undefined); }, []);
  useEffect(() => {
    const pop = () => { const next = readLocation(window.location.search); navigate(next, 'none'); selection.current = { projectId: next.project, itemId: next.item }; setDetail(null); setSnapshot(undefined); void refresh().catch(() => undefined); };
    window.addEventListener('popstate', pop); return () => window.removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1120px)');
    const resize = () => { if (media.matches) setSidebarOpen(false); };
    media.addEventListener('change', resize); return () => media.removeEventListener('change', resize);
  }, []);
  const previousLocale = useRef(locale);
  useEffect(() => {
    if (previousLocale.current === locale) return;
    previousLocale.current = locale;
    void manualRefresh();
  }, [locale]);
  useEffect(() => { setItemQuery(''); }, [view.project]);
  useEffect(() => { const change = () => notifyDraft(value => value + 1); window.addEventListener('specflow-draft-change', change); return () => window.removeEventListener('specflow-draft-change', change); }, []);
  useEffect(() => { try { sessionStorage.setItem('specflow-unconfirmed-writes', JSON.stringify(uncertainScopes)); } catch {} }, [uncertainScopes]);
  useEffect(() => {
    if (!toast || toast.error) return;
    const timer = setTimeout(() => setToast(undefined), 5000); return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    let position = 0; try { position = Number(sessionStorage.getItem(scrollKey(view))) || 0; } catch {}
    let stopped = false;
    const restore = () => { if (!stopped) window.scrollTo(0, position); };
    const stop = () => { stopped = true; };
    const observer = new ResizeObserver(restore); const panel = document.getElementById(`panel-${view.view}`); if (panel) observer.observe(panel);
    const frame = requestAnimationFrame(restore), timer = setTimeout(() => observer.disconnect(), 1200);
    window.addEventListener('wheel', stop, { passive: true }); window.addEventListener('touchstart', stop, { passive: true }); window.addEventListener('keydown', stop);
    return () => { stopped = true; observer.disconnect(); cancelAnimationFrame(frame); clearTimeout(timer); window.removeEventListener('wheel', stop); window.removeEventListener('touchstart', stop); window.removeEventListener('keydown', stop); };
  }, [view.item, view.view, view.artifact, view.revision, view.attempt]);
  useModalFocus(sidebar, sidebarOpen, () => setSidebarOpen(false), navigationToggle);

  const project = bootstrap?.projects.find(p => p.id === view.project);
  const activeSnapshot = snapshot?.item.id === view.item && snapshot.item.projectId === view.project ? snapshot : undefined;
  const selectedBackend = backendInfo(backend, projectBackend(activeSnapshot?.project || project));
  const items = bootstrap?.workItems.filter(item => item.projectId === view.project) || [];
  const filteredItems = items.filter(item => item.name.toLocaleLowerCase().includes(itemQuery.trim().toLocaleLowerCase()));
  const artifacts = activeSnapshot?.artifacts || [];
  const pendingItems = getAttentionItems(activeSnapshot);
  const overlayOpen = !!modal || sidebarOpen || !!detail;
  const context = { snapshot: activeSnapshot, project: activeSnapshot?.project || project, backend, busy, tab: view.view, setTab, selectedNode: view.node, setSelectedNode, selectedArtifact: view.artifact, setSelectedArtifact, selectedRevision: view.revision, setSelectedRevision: (id: string) => navigate({ revision: id, mode: 'pinned' }), documentView: view.documentView, setDocumentView: (documentView: ViewLocation['documentView']) => navigate({ documentView }), selectedAttempt: view.attempt, setSelectedAttempt, selectionMode: view.mode, followCurrent, pendingItems, openAttention, openPending, openRun, isPending, overlayOpen, perform, refresh, openWorkflow: () => openModal('workflow'), openImport: () => openModal('import'), openSettings: () => openModal('settings') };
  const exportEvidence = () => {
    if (!activeSnapshot) return;
    if (window.specflowDesktop) void perform(() => window.specflowDesktop!.exportEvidence(activeSnapshot.item.id), undefined, `export:${activeSnapshot.item.id}`);
    else { const link = document.createElement('a'); link.href = `/api/work-items/${activeSnapshot.item.id}/export`; link.download = 'engineering-evidence.json'; link.click(); }
  };
  return <Workspace.Provider value={context}><a className="skip-link" href="#main">{t("跳到主内容")}</a><div className="app-shell">
    <aside ref={sidebar} id="workspace-navigation" tabIndex={-1} className={`sidebar ${sidebarOpen ? 'is-expanded' : ''}`} aria-label={t("工程导航")} role={sidebarOpen ? 'dialog' : undefined} aria-modal={sidebarOpen || undefined} inert={!!modal || !!detail}>
      <button className="sidebar-close icon-button" aria-label={t("关闭工程导航")} onClick={() => setSidebarOpen(false)}><X size={20} /></button>
      <a className="brand" href="/" aria-label={t("SpecFlow 首页")}><span className="brand-mark"><Layers3 size={23} /></span><span>specflow<span className="brand-dot">.</span></span></a>
      <div className="workspace-label">{t("工程工作空间")} <span>LOCAL</span><button className="workspace-open-button" disabled={busy} onClick={() => openModal('project')} aria-label={t("打开 Git 仓库")} title={t("打开 Git 仓库，添加工作空间")}><Plus size={16} /></button></div>
      <WorkspaceSwitcher projects={bootstrap?.projects || []} value={view.project} disabled={busy || !bootstrap?.projects.length} onChange={id => { setSidebarOpen(false); void refresh(undefined, id).catch(error => setToast({ message: error.message, error: true })); }} />
      <div className="section-label">{t("工作项")} <span>{items.length}</span><button disabled={!project || busy} onClick={() => openModal('item')} aria-label={t("新建工作项")}><Plus size={16} /></button></div>
      <label className="item-search"><Search size={14} /><input type="search" aria-label={t("搜索当前空间工作项")} placeholder={t("搜索工作项")} value={itemQuery} onChange={event => setItemQuery(event.target.value)} /></label>
      <div className="item-list" aria-label={t("当前空间的工作项")}>{filteredItems.map(item => <button key={item.id} className={item.id === view.item ? 'item active' : 'item'} title={item.name} data-name={item.name} aria-current={item.id === view.item ? 'page' : undefined} onClick={() => { setSidebarOpen(false); void refresh(item.id, item.projectId).catch(error => setToast({ message: error.message, error: true })); }}><CircleDot size={15} /><span>{item.name}</span>{item.status === 'accepted' && <Check size={13} />}</button>)}{!!items.length && !filteredItems.length && <p className="sidebar-empty">{t("未找到匹配的工作项")}</p>}{project && !items.length && <p className="sidebar-empty">{t("当前空间暂无工作项")}</p>}{!bootstrap && <p className="sidebar-empty">{t("正在读取工作项…")}</p>}</div>
      <div className="sidebar-divider" /><div className="section-label">{t("工程产物")} <span>{artifacts.length}</span></div>
      <div className="artifact-nav" aria-label={t("当前工作项的工程产物")}>{artifacts.map((artifact, index) => { const name = logicalLabels[artifact.logicalId] || artifact.logicalId; return <button key={artifact.id} className={view.view === 'artifacts' && (view.artifact === artifact.id || (!view.artifact && index === 0)) ? 'active' : ''} title={name} data-name={name} onClick={() => { setSidebarOpen(false); navigate({ view: 'artifacts', artifact: artifact.id, revision: '', mode: 'pinned' }); }}><FileText size={16} /><span>{name}</span><span className={`tiny-status ${artifact.acceptedRevisionId === artifact.currentRevisionId ? 'accepted' : ''}`} /></button>; })}{!artifacts.length && <p className="sidebar-empty">{view.item ? t("此工作项尚无工程产物") : t("选择工作项后查看产物")}</p>}</div>
      <div className="sidebar-bottom"><div className="host-status" title={t(backendError || selectedBackend.capabilities?.reason || "")}><span className={selectedBackend.capabilities?.available && !backendError ? 'online-dot' : 'offline-dot'} /><span>{selectedBackend.name}</span><span>{backendError || !selectedBackend.capabilities ? t("状态未知") : selectedBackend.capabilities.available ? t("可用") : t("不可用")}</span></div><button disabled={!project} onClick={() => openModal('settings')}><Settings2 size={16} />  {t("工程设置")} <span>v0.1</span></button></div>
    </aside>
    {sidebarOpen && <button className="navigation-backdrop" aria-label={t("关闭工程导航遮罩")} tabIndex={-1} onClick={() => setSidebarOpen(false)} />}
    <div className="main-shell" inert={overlayOpen}>{refreshing && <div className="sync-bar" aria-hidden="true" />}<header className="topbar"><div className="breadcrumb"><button ref={navigationToggle} className="navigation-toggle icon-button" aria-label={t("展开工程导航")} aria-expanded={sidebarOpen} aria-controls="workspace-navigation" onClick={() => setSidebarOpen(true)}><Menu size={19} /></button><FolderGit2 size={16} /><span>{project?.name || t("工作空间")}</span><ChevronRight size={13} /><strong>{activeSnapshot ? activeSnapshot.item.kind === 'bug' ? t("缺陷修复") : t("功能开发") : t("工程工作空间")}</strong></div><div className="top-actions"><LanguageSwitcher /><span className={`connection-chip ${eventConnection}`} title={t("事件连接；最后成功同步 {0}", {"0": fmt(lastSync)})}><span />{eventConnection === 'online' ? t("事件已连接") : eventConnection === 'connecting' ? t("连接事件中") : t("事件重连中")}</span><button className="icon-button" title={t("刷新")} aria-label={t("刷新")} disabled={refreshing} onClick={() => void manualRefresh()}><RefreshCcw size={16} className={refreshing ? 'spin' : undefined} /></button><button className="icon-button" aria-label={t("工程设置")} title={t("工程设置")} disabled={!project} onClick={() => openModal('settings')}><Settings2 size={17} /></button></div></header>
      <main id="main" tabIndex={-1}>{activeSnapshot ? <>
        <section className="workitem-heading"><div className="workitem-title"><div className="eyebrow">WORK ITEM <span>{short(activeSnapshot.item.id).toUpperCase()}</span></div><h1>{activeSnapshot.item.name}</h1><details className="request-details"><summary><GitBranch size={13} />{activeSnapshot.item.branch.split('/').pop()}<span>{t("需求与基线")}</span></summary><p>{activeSnapshot.item.request || t("完整需求见「需求输入」中的文档。")}</p><code>{t("基线 {0}", { 0: activeSnapshot.item.acceptedCommit })}</code></details></div><div className="workitem-tools"><span className="delivery-state">{activeSnapshot.item.status === 'accepted' ? <><CheckCircle2 size={15} />{t("已交付")}</> : <><CircleDot size={15} />{t("进行中")}</>}</span><button className="attention-button" onClick={() => pendingItems.length === 1 ? openAttention(pendingItems[0]) : openPending()} aria-label={t("待处理 {0} 项", {"0": pendingItems.length})}><Bell size={16} /><span>{t("待处理")}</span><b>{pendingItems.length}</b></button><details className="workitem-more"><summary aria-label={t("更多工作项操作")}><MoreHorizontal size={18} /></summary><button onClick={exportEvidence}><Download size={15} />{t("导出工程记录")}</button></details></div></section>
        {activeSnapshot.project.demo && <div className="demo-notice"><span className="demo-symbol">◈</span><strong>{t("隔离验收项目")}</strong><span>{t("独立工作区内执行真实文件修改与测试")}</span><span className="notice-end">{t("不调用模型 API")}</span></div>}
        {loadError && <div className="inline-sync-error" role="alert">{t("读取更新失败：")}{t(loadError)}<button className="text-button" onClick={() => void manualRefresh()}>{t("重新同步")}</button></div>}
        {!!uncertainScopes.length && <div className="inline-sync-error" role="alert"><span>{t("有 {count} 个写入的结果待确认，相关操作已锁定。请先刷新查看工程记录，避免重复派发。", { count: uncertainScopes.length })}</span><button className="outline-button" disabled={refreshing} onClick={() => void manualRefresh()}>{t("刷新核对记录")}</button><button className="text-button" disabled={refreshing || !!loadError || !lastSync} onClick={() => { uncertainRef.current.clear(); setUncertainScopes([]); }}>{t("已核对结果，解除锁定")}</button></div>}
        <div className="tab-bar"><div className="tabs" role="tablist" aria-label={t("工作项视图")}>{tabs.map(tab => <button key={tab.id} id={`tab-${tab.id}`} role="tab" aria-selected={view.view === tab.id} aria-controls={`panel-${tab.id}`} tabIndex={view.view === tab.id ? 0 : -1} className={view.view === tab.id ? 'active' : ''} onClick={() => setTab(tab.id)} onKeyDown={event => {
          if (event.nativeEvent.isComposing || event.keyCode === 229) return;
          const index = tabs.findIndex(entry => entry.id === view.view);
          const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : undefined;
          if (next !== undefined) { event.preventDefault(); setTab(tabs[next].id); document.getElementById(`tab-${tabs[next].id}`)?.focus(); }
        }}><tab.icon size={16} />{t(tab.name)}{tab.id === 'artifacts' && !!artifacts.length && <span>{artifacts.length}</span>}</button>)}</div><div className="tab-info" aria-live="off" title={lastSync ? t("最后成功同步 {0}", {"0": fmt(lastSync)}) : undefined}>{refreshing ? <Loader2 size={12} className="spin" /> : <span className={loadError ? 'offline-dot' : 'online-dot'} />}{refreshing ? t("正在同步") : loadError ? t("同步失败") : t("同步于 {0}", {"0": lastSync ? fmt(lastSync).split(' ').at(-1) : '—'})}</div></div>
        <div role="tabpanel" id={`panel-${view.view}`} aria-labelledby={`tab-${view.view}`} tabIndex={0}>{view.view === 'flow' ? <Flow /> : view.view === 'requirements' ? <Requirements /> : view.view === 'artifacts' ? <Documents /> : view.view === 'code' ? <CodeView /> : <Runs />}</div>
      </> : <section className="workspace-empty" aria-busy={refreshing}><div className="workspace-empty-symbol">{(!bootstrap || view.item) && !loadError ? <Loader2 size={32} className="spin" /> : <FolderGit2 size={35} />}</div><span className="eyebrow">ENGINEERING WORKSPACE</span><h1>{loadError ? t("无法读取工程数据") : !bootstrap ? t("正在加载工作空间") : project?.name || t("打开一个工程工作空间")}</h1><code>{project?.rootPath || t("每个空间对应一个项目目录")}</code><h2>{loadError ? t("请重试加载") : !bootstrap || view.item ? t("正在读取本地工程数据…") : project ? t("该工作空间还没有工作项") : t("从 Git 项目目录开始")}</h2><p>{t(loadError) || t("在工作空间中管理每个工作项的需求、流程、代码和产物。")}</p>{(bootstrap || loadError) && <button className="primary-button" disabled={busy || refreshing} onClick={() => loadError || view.item ? void manualRefresh() : openModal(project ? 'item' : 'project')}>{loadError || view.item ? <RefreshCcw size={16} /> : <Plus size={16} />}{loadError ? t("重试加载") : view.item ? t("重新读取工作项") : project ? t("在此空间新建工作项") : t("打开 Git 仓库")}</button>}</section>}
      <footer className="page-footer"><span>{t("空间 → 工作项 → 工程产物")}</span><span>{t("SpecFlow · 工程控制层")}</span></footer></main>
    </div>
    {toast && <div role={toast.error ? 'alert' : 'status'} className={`toast ${toast.error ? 'error' : ''}`}><CircleDot size={17} /><span>{t(toast.message)}</span><button onClick={() => setToast(undefined)} aria-label={t("关闭通知")}><X size={15} /></button></div>}
    {modal && <Dialogs key={`${modal}-${view.project}`} modal={modal} close={() => setModal(null)} open={openModal} projects={bootstrap?.projects || []} setBackend={setBackend} returnFocus={dialogTrigger} />}
    {detail && !modal && <Drawer title={detail === 'pending' ? t("待处理事项 · {0}", {"0": pendingItems.length}) : t("本次运行")} close={() => setDetail(null)} returnFocus={detailTrigger}>{detail === 'run' ? <RunDetail attemptId={view.attempt} /> : <div className="attention-list">{pendingItems.map(item => <button key={item.id} className={`attention-item ${item.stale ? 'stale' : ''}`} onClick={() => openAttention(item)}><span className="attention-kind">{item.kind === 'interaction' ? t("执行交互") : item.kind === 'clarification' ? t("需求澄清") : item.kind === 'finding' ? t("复核发现") : t("文档审阅")}</span><strong>{item.title}</strong><span>{item.detail}</span>{item.stale && <small>{t("依据已变更，先查看原始材料")}</small>}<ChevronRight size={16} /></button>)}{!pendingItems.length && <div className="empty-state"><CheckCircle2 size={28} /><h3>{t("当前没有待处理事项")}</h3><p>{t("后续问题、授权和待审阅产物会出现在这里。")}</p></div>}</div>}</Drawer>}
  </div></Workspace.Provider>;
}
