import { getLocale, localizedDate, localizedLabels, setLocale, t, useLocale, type Locale } from '../../../apps/web/src/i18n.ts';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-client-connection/client';
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
import type {} from '@deepseek-ai/dsh-client-ui-session/client';
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client';
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { ArtifactRevision, Attempt, ClarificationDraft, ClarificationSession, ModelTarget, Project, RequirementDocument } from '../../../packages/domain/index.ts';
import type { AcceptancePrecheck } from '../../../packages/ui-contracts/index.ts';
import { workflowText } from '../../../apps/web/src/workflowCopy.ts';
import { getStepStatus, selectCurrentNode } from '../../../apps/web/src/flowSelectors.ts';
import { MarkdownView } from '../../../apps/web/src/MarkdownView.tsx';
import {
  commandSpecflow, readSpecflow, type CommandOperation, type SpecflowArtifactReading,
  type SpecflowBootstrap, type SpecflowConnection, type SpecflowReadRequest, type SpecflowSnapshot,
} from './protocol.ts';
import stylesheet from './client.css?inline';

export const TAB_ID = 'dsh-plugin-specflow/workbench';
export const TAB_KIND = 'specflow';
export const inject = ['connection', 'slots', 'sidebarRightTabs'];

/** Both registrations and the stylesheet belong to this plugin's Cordis lifetime. */
export function apply(ctx: Context): void {
  ctx.effect(() => {
    const style = document.createElement('style');
    style.dataset.plugin = 'dsh-plugin-specflow';
    style.textContent = stylesheet;
    document.head.append(style);
    return () => style.remove();
  }, 'specflow: stylesheet');
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: TAB_ID, kind: TAB_KIND, keepMounted: true, title: () => 'Specflow',
    guide: [{ id: 'workbench', order: 40, title: () => t("Specflow 工程工作台"), description: () => t("从需求、规格到复核与验收") }],
  }), 'specflow: tab type');
  ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register(
    { name: 'sidebar.right.pane.tab', key: TAB_ID, inject: () => ({ connection: ctx.connection }) },
    SpecflowPanel,
  )), 'specflow: tab body');
}

type PanelProps = PropsRuntime<'sidebar.right.pane.tab'> & { connection: SpecflowConnection };
type Section = 'flow' | 'documents' | 'code' | 'runs';
type Read = <T>(request: SpecflowReadRequest, signal?: AbortSignal) => Promise<T>;
type Command = (operation: CommandOperation, id?: string, input?: unknown) => Promise<unknown>;
const labels = localizedLabels({
  pending: '待执行', starting: '启动中', running: '执行中', waiting_interaction: '待回答', completed: '已结束',
  failed: '失败', cancelled: '已停止', reconciling: '待核对', passed: '已通过', blocked: '被阻塞', stale: '已过期',
  accepted: '已接纳', active: '进行中', ready: '待验收', working: '实现中', candidate: '待接纳',
});
const logicalLabels = localizedLabels({ spec: '需求规格', plan: '工程设计', tasks: '任务拆解', implementation: '实现说明', convergence: '对齐报告' });
const activeStates = ['starting', 'running', 'waiting_interaction', 'reconciling'];
const short = (value?: string) => value ? value.slice(0, 8) : '—';
const time = localizedDate;
const targetKey = (target: ModelTarget) => JSON.stringify(target);
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "操作失败，请刷新后重试。";
type PendingWrite = { operation: CommandOperation; id?: string; idempotencyKey: string; startedAt: string };
const pendingWrites = new WeakMap<SpecflowConnection, Map<string, PendingWrite>>();
function pendingKey(sessionId: string): string {
  return `dsh-plugin-specflow.pending:${location.origin}${location.pathname}:${sessionId}`;
}
function rememberedWrite(connection: SpecflowConnection, key: string): PendingWrite | undefined {
  const memory = pendingWrites.get(connection)?.get(key);
  if (memory) return memory;
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (value && typeof value.operation === 'string' && typeof value.idempotencyKey === 'string' && typeof value.startedAt === 'string') return value as PendingWrite;
  } catch { /* Private browsing may deny session storage; the connection map still works. */ }
  return undefined;
}
function rememberWrite(connection: SpecflowConnection, key: string, write?: PendingWrite): void {
  let entries = pendingWrites.get(connection);
  if (!entries) { entries = new Map(); pendingWrites.set(connection, entries); }
  if (write) entries.set(key, write); else entries.delete(key);
  try { if (write) sessionStorage.setItem(key, JSON.stringify(write)); else sessionStorage.removeItem(key); } catch { /* The in-memory guard remains in force. */ }
}

function Empty({ title, children }: { title: string; children: ReactNode }) {
  return <div className="sf-empty"><span className="sf-empty-mark" aria-hidden="true">◇</span><h3>{title}</h3><p>{children}</p></div>;
}
function Badge({ value, children }: { value: string; children?: ReactNode }) {
  return <span className={`sf-badge sf-state-${value}`}>{children ?? labels[value] ?? value}</span>;
}

/** Reads stop when the host hides this session or tab; closing never implicitly stops a durable attempt. */
export function SpecflowPanel({ connection, sessionId, useTabInfo }: PanelProps): ReactNode {
  const locale = useLocale();
  const [languageError, setLanguageError] = useState(false);
  const { tab } = useTabInfo();
  const storageKey = pendingKey(sessionId);
  const [previousWrite] = useState(() => rememberedWrite(connection, storageKey));
  const [bootstrap, setBootstrap] = useState<SpecflowBootstrap>();
  const [snapshot, setSnapshot] = useState<SpecflowSnapshot>();
  const [projectId, setProjectId] = useState(''), [itemId, setItemId] = useState('');
  const [section, setSection] = useState<Section>('flow');
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [error, setError] = useState(previousWrite ? "上次写入的结果尚未确认，请刷新并核对工程记录后继续。" : ''), [notice, setNotice] = useState('');
  const [uncertain, setUncertain] = useState(!!previousWrite), [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState<'project' | 'item' | undefined>();
  const [editing, setEditing] = useState({ requirements: false, artifact: false });
  const alive = useRef(true), lock = useRef(false), selection = useRef({ projectId, itemId });
  const uncertainWrite = useRef(!!previousWrite), explicitRefresh = useRef(false);
  const controlsId = useId();
  selection.current = { projectId, itemId };
  const lifetime = useRef<AbortController | undefined>(undefined);
  if (!lifetime.current) lifetime.current = new AbortController();
  const read = useCallback<Read>((request, signal) => readSpecflow(connection, { ...request, locale }, AbortSignal.any([lifetime.current!.signal, tab.signal, ...(signal ? [signal] : [])])), [connection, tab.signal, locale]);

  useEffect(() => {
    alive.current = true;
    if (lifetime.current?.signal.aborted) lifetime.current = new AbortController();
    return () => { alive.current = false; lifetime.current?.abort(); };
  }, []);
  useEffect(() => { setEditing({ requirements: false, artifact: false }); }, [projectId, itemId]);
  useEffect(() => {
    if (!tab.visible) return;
    let current = true, timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const sync = async () => {
      try {
        const initial = await read<SpecflowBootstrap>({ resource: 'bootstrap' }, controller.signal);
        if (!current) return;
        setBootstrap(initial);
        const selected = selection.current;
        const project = initial.projects.find(project => project.id === selected.projectId) ?? initial.projects[0];
        const items = initial.workItems.filter(item => item.projectId === project?.id);
        const item = items.find(item => item.id === selected.itemId) ?? items[0];
        setProjectId(project?.id ?? ''); setItemId(item?.id ?? '');
        const value = item ? await read<SpecflowSnapshot>({ resource: 'snapshot', id: item.id }, controller.signal) : undefined;
        if (!current) return;
        setSnapshot(value); setLoading(false);
        if (!uncertainWrite.current || explicitRefresh.current) {
          const confirmed = explicitRefresh.current;
          setError(''); setUncertain(false); uncertainWrite.current = false; explicitRefresh.current = false;
          if (confirmed) rememberWrite(connection, storageKey);
        }
      } catch (error) {
        if (current && !controller.signal.aborted) { setError(errorMessage(error)); setLoading(false); }
      } finally {
        if (current) timer = setTimeout(sync, 2500);
      }
    };
    void sync();
    return () => { current = false; controller.abort(); if (timer) clearTimeout(timer); };
  }, [read, tab.visible, projectId, itemId, refreshKey]);

  const command: Command = async (operation, id, input) => {
    if (lock.current || uncertain || !tab.visible || !bootstrap?.canWrite) throw new Error(t("请先刷新工程状态，再执行操作。"));
    lock.current = true; setBusy(true); setError(''); setNotice('');
    const pending: PendingWrite = { operation, id, idempotencyKey: crypto.randomUUID(), startedAt: new Date().toISOString() };
    rememberWrite(connection, storageKey, pending);
    try {
      const result = await commandSpecflow(connection, { operation, id, input, locale: getLocale(), idempotencyKey: pending.idempotencyKey }, AbortSignal.any([lifetime.current!.signal, tab.signal]));
      rememberWrite(connection, storageKey);
      if (alive.current) { setNotice("操作已记录，正在同步工程状态。"); setRefreshKey(value => value + 1); }
      return result;
    } catch (error) {
      const failure = error as { code?: string; details?: { status?: unknown } };
      const status = failure?.details?.status;
      const rejected = failure?.code === 'INVALID_REQUEST' || typeof status === 'number' && status >= 400 && status < 500;
      const unknown = !rejected;
      if (!unknown) rememberWrite(connection, storageKey);
      if (alive.current) {
        setUncertain(unknown); uncertainWrite.current = unknown;
        setError(`${errorMessage(error)}${unknown ? ` ${t('写入结果尚未确认，请刷新并核对运行记录。')}` : ''}`);
      }
      throw error;
    } finally { lock.current = false; if (alive.current) setBusy(false); }
  };
  const refresh = () => { explicitRefresh.current = true; setLoading(true); setRefreshKey(value => value + 1); };
  const run = (operation: CommandOperation, id?: string, input?: unknown) => { void command(operation, id, input).catch(() => {}); };
  const disabled = busy || uncertain || !bootstrap?.canWrite || !tab.visible || !!error;
  const project = bootstrap?.projects.find(project => project.id === projectId);
  const items = bootstrap?.workItems.filter(item => item.projectId === projectId) ?? [];
  const current = snapshot?.item.id === itemId ? snapshot : undefined;
  const hasDraft = editing.requirements || editing.artifact;
  const pending = current?.clarifications.filter(clarification => clarification.state === 'waiting_answers').length ?? 0;
  const pendingInteractions = current?.interactions.filter(interaction => interaction.state === 'pending') ?? [];

  return <div className="sf-workbench" lang={locale} data-specflow-panel data-session-id={sessionId} aria-busy={loading || busy}>
    <header className="sf-header"><div><span className="sf-brand-mark" aria-hidden="true">S</span><strong>Specflow<span>.</span></strong></div><div><select className="sf-language" aria-label={t('界面语言')} value={locale} disabled={busy} onChange={event => { setLanguageError(false); void setLocale(event.target.value as Locale, { updateDocument: false }).catch(() => setLanguageError(true)); }}><option value="zh-CN">中文</option><option value="en">English</option></select><button type="button" className="sf-icon-button" title={t("刷新工程状态")} aria-label={t("刷新工程状态")} disabled={busy} onClick={refresh}>↻</button></div></header>
    {languageError && <p className="sf-inline-error" role="alert">{t('语言设置未能保存，请重试。')}</p>}
    <div className="sf-context">
      <div className="sf-label-row"><label htmlFor={`${controlsId}-project`}>{t("工程")}</label><button type="button" disabled={disabled || hasDraft} onClick={() => setForm(form === 'project' ? undefined : 'project')}>{t("＋ 打开仓库")}</button></div>
      <select id={`${controlsId}-project`} value={projectId} disabled={busy || hasDraft} onChange={event => { setProjectId(event.target.value); setItemId(''); setSnapshot(undefined); }}><option value="" disabled>{t("选择本地工程")}</option>{bootstrap?.projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
      {project && <code className="sf-path" title={project.rootPath}>{project.rootPath}</code>}
      <div className="sf-label-row"><label htmlFor={`${controlsId}-item`}>{t("工作项")}</label><button type="button" disabled={disabled || hasDraft || !project} onClick={() => setForm(form === 'item' ? undefined : 'item')}>{t("＋ 新需求")}</button></div>
      <select id={`${controlsId}-item`} value={itemId} disabled={busy || hasDraft || !items.length} onChange={event => { setItemId(event.target.value); setSnapshot(undefined); }}><option value="" disabled>{items.length ? t("选择工作项") : t("此工程还没有需求")}</option>{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      {hasDraft && <p className="sf-hint">{t("有未保存的正文编辑。保存或取消编辑后，即可切换工程或工作项。")}</p>}
    </div>
    <div className="sf-messages" aria-live="polite">
      {error && <div className="sf-alert" role="alert">{t(error)}<button type="button" disabled={busy} onClick={refresh}>{t("刷新核对")}</button></div>}
      {notice && !error && <p className="sf-notice" role="status">{t(notice)}</p>}
    </div>
    {form && <CreateForm key={form} kind={form} disabled={disabled} projectId={projectId} command={command} onCancel={() => setForm(undefined)} onCreated={result => { setForm(undefined); if (form === 'project') { setProjectId(result.id); setItemId(''); } else setItemId(result.id); setSnapshot(undefined); }} />}
    <nav className="sf-tabs" aria-label={t("工程工作区")}>{([['flow', t("流程")], ['documents', t("文档")], ['code', t("代码")], ['runs', t("运行")]] as const).map(([key, label]) => <button type="button" key={key} aria-current={section === key ? 'page' : undefined} className={section === key ? 'sf-active' : ''} onClick={() => setSection(key)}>{label}{key === 'flow' && pending > 0 && <span className="sf-count">{pending}</span>}</button>)}</nav>
    <main className="sf-body">
      {loading && !current ? <p className="sf-loading" role="status">{t("正在读取本地工程…")}</p> : !project ? <Empty title={t("把需求变成可验证的工程")}>{t("打开一个本地 Git 仓库，从需求规格开始建立完整的开发记录。")}</Empty> : !current ? <Empty title={t("从一个新需求开始")}>{t('为 {0} 创建工作项。每个工作项会使用独立的分支与工作区。', { 0: project.name })}</Empty> : <>
        <div className="sf-item-heading"><h2>{current.item.name}</h2><Badge value={current.item.status} /><code title={current.item.branch}>{current.item.branch}</code></div>
        {pendingInteractions.map(interaction => <InteractionCard key={interaction.id} id={interaction.id} request={interaction.request} command={command} disabled={disabled} />)}
        <div hidden={section !== 'flow'}><Flow key={current.item.id} snapshot={current} bootstrap={bootstrap!} read={read} run={run} command={command} disabled={disabled} visible={tab.visible && section === 'flow'} onCode={() => setSection('code')} onRequirementsEditingChange={value => setEditing(current => ({ ...current, requirements: value }))} /></div>
        <div hidden={section !== 'documents'}><Documents key={current.item.id} snapshot={current} read={read} run={run} command={command} disabled={disabled} visible={tab.visible && section === 'documents'} onEditingChange={value => setEditing(current => ({ ...current, artifact: value }))} /></div>
        <div hidden={section !== 'code'}><Code snapshot={current} read={read} run={run} disabled={disabled} visible={tab.visible && section === 'code'} /></div>
        <div hidden={section !== 'runs'}><Runs snapshot={current} bootstrap={bootstrap!} read={read} run={run} disabled={disabled} visible={tab.visible && section === 'runs'} /></div>
      </>}
    </main>
    <footer className="sf-footer"><span className="sf-status-dot" />{t("本地工程记录")}<span>{busy ? t("正在操作") : loading ? t("同步中") : t("DSH 插件")}</span></footer>
  </div>;
}

function CreateForm({ kind, projectId, command, onCreated, onCancel, disabled }: { kind: 'project' | 'item'; projectId: string; command: Command; onCreated(result: { id: string }): void; onCancel(): void; disabled: boolean }) {
  const prefix = useId(), [name, setName] = useState(''), [content, setContent] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const result = await command(kind === 'project' ? 'registerProject' : 'createWorkItem', undefined, kind === 'project' ? { rootPath: content.trim(), name: name.trim() || undefined } : { projectId, name: name.trim(), request: content.trim(), kind: 'feature', documents: [] });
      onCreated(result as { id: string });
    } catch { /* The panel shows the command error and retains this draft. */ }
  };
  return <form className="sf-form" onSubmit={submit}><h3>{kind === 'project' ? t("打开本地 Git 仓库") : t("创建新需求")}</h3><label htmlFor={`${prefix}-name`}>{kind === 'project' ? t("工程名称（可选）") : t("需求名称")}</label><input id={`${prefix}-name`} autoFocus value={name} required={kind === 'item'} maxLength={200} onChange={event => setName(event.target.value)} />
    <label htmlFor={`${prefix}-content`}>{kind === 'project' ? t("仓库绝对路径") : t("需求与验收预期")}</label><textarea id={`${prefix}-content`} rows={kind === 'project' ? 2 : 5} value={content} required onChange={event => setContent(event.target.value)} placeholder={kind === 'project' ? 'C:\\projects\\my-app' : t("希望实现什么？哪些行为代表完成？")} />
    <div className="sf-actions"><button type="button" disabled={disabled} onClick={onCancel}>{t("取消")}</button><button className="sf-primary" disabled={disabled || !content.trim() || kind === 'item' && !name.trim()}>{kind === 'project' ? t("打开工程") : t("创建工作项")}</button></div>
  </form>;
}

function Flow({ snapshot, bootstrap, read, run, command, disabled, visible, onCode, onRequirementsEditingChange }: { snapshot: SpecflowSnapshot; bootstrap: SpecflowBootstrap; read: Read; run(operation: CommandOperation, id?: string, input?: unknown): void; command: Command; disabled: boolean; visible: boolean; onCode(): void; onRequirementsEditingChange(value: boolean): void }) {
  const latest = snapshot.runs.at(-1);
  const nodes = snapshot.nodes.filter(node => node.workflowRunId === latest?.id);
  const [chosen, setChosen] = useState(''), [override, setOverride] = useState(''), [showStages, setShowStages] = useState(false);
  const [editingRequirements, setEditingRequirements] = useState(false);
  const node = nodes.find(node => node.id === chosen) ?? selectCurrentNode(latest, nodes);
  const definition = latest?.definition.nodes.find(definition => definition.id === node?.nodeId);
  const [readiness, setReadiness] = useState<{ key: string; ready: boolean; reasons: string[] }>();
  const readinessKey = `${node?.id}:${node?.revision}:${snapshot.item.revision}:${snapshot.project.revision}:${snapshot.requirements.current.id}:${snapshot.artifacts.map(artifact => artifact.revision).join(',')}`;
  const backend = snapshot.project.executionBackend ?? 'dsh';
  const targets = bootstrap.catalog.targets.filter(target => target.backend === backend);
  const configured = definition?.target ?? (definition?.role ? latest?.definition.roles[definition.role] ?? snapshot.project.defaults[definition.role] : undefined);
  const selected = targets.find(target => targetKey(target) === override) ?? (configured?.backend === backend ? configured : targets[0]);
  const modelStage = !!node && ['agent', 'review', 'clarify'].includes(node.type);
  const active = !!node && activeStates.includes(node.execution);
  const clarification = snapshot.clarifications.find(session => session.nodeRunId === node?.id && session.state === 'waiting_answers');
  const completed = nodes.filter(node => getStepStatus(node, latest?.definition.nodes.find(definition => definition.id === node.nodeId)).effectivelyPassed).length;
  useEffect(() => { setOverride(''); }, [node?.id, backend]);
  useEffect(() => {
    if (!node || !visible) return;
    const controller = new AbortController();
    void read<{ ready: boolean; reasons: string[] }>({ resource: 'readiness', id: node.id }, controller.signal).then(value => { if (!controller.signal.aborted) setReadiness({ key: readinessKey, ...value }); }).catch(error => { if (!controller.signal.aborted) setReadiness({ key: readinessKey, ready: false, reasons: [errorMessage(error)] }); });
    return () => controller.abort();
  }, [read, visible, readinessKey]);
  const checked = readiness?.key === readinessKey ? readiness : undefined;
  return <>
    <div className="sf-section-heading"><div><h3>{t("工程流程")}</h3><p>{completed} / {nodes.length} {t("个步骤已通过")}</p></div>{latest ? <button type="button" aria-expanded={showStages} onClick={() => setShowStages(value => !value)}>{showStages ? t("收起步骤") : t("切换步骤")} <span aria-hidden="true">{showStages ? '▴' : '▾'}</span></button> : snapshot.workflows[0] && <button type="button" className="sf-primary" disabled={disabled} onClick={() => run('createRun', undefined, { workflowId: snapshot.workflows[0].id })}>{t("建立流程")}</button>}</div>
    {showStages && <div className="sf-stages" aria-label={t("流程步骤")}>{nodes.map((stage, index) => <button type="button" key={stage.id} className={stage.id === node?.id ? 'sf-stage sf-selected' : 'sf-stage'} aria-pressed={stage.id === node?.id} onClick={() => { setChosen(stage.id); setShowStages(false); }}><span className="sf-stage-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{workflowText(stage.name)}</strong><small>{getStepStatus(stage, latest?.definition.nodes.find(definition => definition.id === stage.nodeId)).gate.value} · {getStepStatus(stage, latest?.definition.nodes.find(definition => definition.id === stage.nodeId)).acceptance.value}</small></span><Badge value={stage.execution} /></button>)}</div>}
    {node && <section className="sf-card sf-stage-detail"><div className="sf-section-heading"><h3>{workflowText(node.name)}</h3><Badge value={node.freshness === 'stale' ? 'stale' : node.execution} /></div>
      <dl className="sf-facts">{Object.values(getStepStatus(node, definition)).filter((value): value is Exclude<typeof value, boolean> => typeof value !== 'boolean').map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
      {modelStage && <label className="sf-field">{t("连接与模型")}<select aria-label={t("连接与模型")} value={selected ? targetKey(selected) : ''} disabled={disabled || active} onChange={event => setOverride(event.target.value)}><option value="" disabled>{t("在 DSH 中配置模型后刷新")}</option>{configured && configured.backend === backend && !targets.some(target => targetKey(target) === targetKey(configured)) && <option value={targetKey(configured)}>{configured.connectionSlug} / {configured.model}</option>}{targets.map(target => <option key={targetKey(target)} value={targetKey(target)}>{target.connectionSlug} / {target.model}</option>)}</select></label>}
      {node.error && <p className="sf-inline-error">{t(node.error)}</p>}
      {(checked?.reasons.length || node.blockers.length) > 0 && <ul className="sf-blockers">{[...new Set([...(checked?.reasons ?? []), ...node.blockers])].map(reason => <li key={reason}>{reason}</li>)}</ul>}
      {modelStage && !selected && <p className="sf-hint">{t("请先在 DSH 配置可用模型，再刷新工程状态。")}</p>}
      {editingRequirements && <p className="sf-hint">{t("需求正文有未保存的编辑，请先保存或取消，再启动步骤。")}</p>}
      <div className="sf-actions">{active && node.currentAttemptId ? <button type="button" className="sf-stop" disabled={disabled} onClick={() => run('stopAttempt', node.currentAttemptId)}>{t("停止当前尝试")}</button> : node.type === 'human' ? <button type="button" className="sf-primary" onClick={onCode}>{t("核对代码并验收")}</button> : <button type="button" className="sf-primary" disabled={disabled || editingRequirements || !checked?.ready || modelStage && !selected || !!clarification || latest?.state !== 'active'} onClick={() => run('startNode', node.id, { expectedRevision: node.revision, ...(selected && modelStage ? { target: selected } : {}) })}>{node.execution === 'pending' ? t("启动此步骤") : t("重新执行")}</button>}</div>
    </section>}
    {clarification && <Clarification key={clarification.id} session={clarification} draft={snapshot.clarificationDrafts.find(draft => draft.sessionId === clarification.id)} command={command} disabled={disabled} />}
    <ProjectSettings key={snapshot.project.id} project={snapshot.project} targets={targets} command={command} disabled={disabled} />
    <Requirements snapshot={snapshot} command={command} disabled={disabled} onEditingChange={value => { setEditingRequirements(value); onRequirementsEditingChange(value); }} />
  </>;
}

function RequirementDocuments({ documents }: { documents: RequirementDocument[] }) {
  if (!documents.length) return null;
  const sourceNames = { upload: t("上传资料"), repository: t("仓库资料"), pasted: t("粘贴资料") };
  return <div className="sf-requirement-documents"><h4>{t("已有需求资料 ·")} {documents.length} {t("份")}</h4>{documents.map(document => <details key={document.id}><summary>{document.name}<span>{sourceNames[document.source]}</span></summary>{document.repositoryPath && <code className="sf-path">{document.repositoryPath}</code>}<pre>{document.content}</pre></details>)}</div>;
}

function Requirements({ snapshot, command, disabled, onEditingChange }: { snapshot: SpecflowSnapshot; command: Command; disabled: boolean; onEditingChange(value: boolean): void }) {
  const current = snapshot.requirements.current;
  const [draft, setDraft] = useState<{ expectedRevisionId: string; request: string; documents: RequirementDocument[] }>();
  const [saving, setSaving] = useState(false), [error, setError] = useState('');
  const prefix = useId();
  const conflict = !!draft && current.id !== draft.expectedRevisionId;
  const close = () => { setDraft(undefined); setError(''); onEditingChange(false); };
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!draft || saving || disabled || conflict) return;
    setSaving(true); setError('');
    try { await command('saveRequirements', snapshot.item.id, draft); close(); }
    catch (error) { setError((error as { code?: string }).code === 'REVISION_CONFLICT' ? "需求已有新修订，当前草稿已保留。请比较最新需求后继续编辑。" : errorMessage(error)); }
    finally { setSaving(false); }
  };
  return <details className="sf-details sf-requirements"><summary>{t("原始需求与工作区")}</summary>{draft ? <form className="sf-editor" onSubmit={save}>
    <div className="sf-section-heading"><h3>{t("编辑需求正文")}</h3><span className="sf-editor-version">{t("基于")} {short(draft.expectedRevisionId)}</span></div>
    <p className="sf-hint">{t("保存会创建新的需求修订，已有资料会一并保留；受影响的步骤需要重新分析或复核。")}</p>
    {(conflict || error) && <div className="sf-editor-conflict" role="alert"><p>{conflict ? t("需求已有新修订。你的正文草稿和资料已保留，请先比较最新需求。") : t(error)}</p>{conflict && <><details><summary>{t("查看最新需求")}</summary><p className="sf-preserve">{current.request}</p><RequirementDocuments documents={current.documents} /></details><button type="button" disabled={saving} onClick={() => { setDraft(value => value && ({ ...value, expectedRevisionId: current.id, documents: current.documents.map(document => ({ ...document })) })); setError(''); }}>{t("以最新修订继续编辑")}</button><p className="sf-hint">{t("保留你的正文草稿，并采用最新修订中的需求资料。")}</p></>}</div>}
    <label className="sf-field" htmlFor={`${prefix}-request`}>{t("需求正文")}<textarea id={`${prefix}-request`} aria-label={t("需求正文")} rows={10} maxLength={2_000_000} value={draft.request} disabled={saving} onChange={event => setDraft(value => value && ({ ...value, request: event.target.value }))} /></label>
    <RequirementDocuments documents={draft.documents} />
    <div className="sf-actions"><button type="button" disabled={saving} onClick={close}>{t("取消编辑需求")}</button><button className="sf-primary" disabled={disabled || saving || conflict || !draft.request.trim() && !draft.documents.length}>{saving ? t("正在保存…") : t("保存需求")}</button></div>
  </form> : <><div className="sf-requirement-actions"><span className="sf-editor-version">{t("需求修订")} {short(current.id)}</span><button type="button" disabled={disabled || snapshot.item.status === 'accepted'} onClick={() => { setDraft({ expectedRevisionId: current.id, request: current.request, documents: current.documents.map(document => ({ ...document })) }); setError(''); onEditingChange(true); }}>{t("编辑需求")}</button></div><p className="sf-preserve">{current.request || t("尚未填写需求说明。")}</p><RequirementDocuments documents={current.documents} /></>}
    <code className="sf-path">{snapshot.item.workspace}</code>
  </details>;
}

function Clarification({ session, draft, command, disabled }: { session: ClarificationSession; draft?: ClarificationDraft; command: Command; disabled: boolean }) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => ({ ...draft?.answers }));
  const prefix = useId();
  const questions = session.questions.filter(question => !question.answer);
  const submit = async (event: FormEvent) => { event.preventDefault(); try { await command('answerClarification', session.id, { expectedRevision: session.revision, answers: questions.map(question => ({ questionId: question.id, answer: answers[question.id]?.trim() })) }); } catch { /* Preserve answers on a failed write. */ } };
  return <form className="sf-card sf-clarification" onSubmit={submit}><span className="sf-eyebrow">{t("需要你的决定")}</span><h3>{t("补全需求中的关键问题")}</h3><p className="sf-hint">{t("回答会写入当前规格，随后继续澄清。暂时离开前可以保存草稿。")}</p>{questions.map((question, index) => <div className="sf-question" key={question.id}><label htmlFor={`${prefix}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span>{question.question}</label><p>{question.reason}</p><div className="sf-options">{question.options.map(option => <button type="button" key={option} aria-pressed={answers[question.id] === option} disabled={disabled} onClick={() => setAnswers(value => ({ ...value, [question.id]: option }))}>{option}</button>)}</div><textarea id={`${prefix}-${index}`} rows={3} required maxLength={4000} disabled={disabled} value={answers[question.id] ?? ''} onChange={event => setAnswers(value => ({ ...value, [question.id]: event.target.value }))} /></div>)}<div className="sf-actions"><button type="button" disabled={disabled} onClick={() => { void command('saveClarificationDraft', session.id, { expectedRevision: draft?.revision ?? 0, answers }).catch(() => {}); }}>{t("保存草稿")}</button><button className="sf-primary" disabled={disabled || questions.some(question => !answers[question.id]?.trim())}>{t("提交回答并继续")}</button></div></form>;
}

function ProjectSettings({ project, targets, command, disabled }: { project: Project; targets: ModelTarget[]; command: Command; disabled: boolean }) {
  const test = project.commands.find(command => command.id === 'test') ?? project.commands[0];
  const [rules, setRules] = useState(project.rules), [executable, setExecutable] = useState(test?.executable ?? 'node');
  const [args, setArgs] = useState(JSON.stringify(test?.args ?? ['--test'])), [revision, setRevision] = useState(project.revision), [error, setError] = useState('');
  const [defaults, setDefaults] = useState(project.defaults);
  const prefix = useId();
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    let parsed: unknown;
    try { parsed = JSON.parse(args); if (!Array.isArray(parsed) || parsed.some(value => typeof value !== 'string')) throw new Error(); }
    catch { setError("命令参数请填写 JSON 字符串数组，例如 [\"run\", \"test\"]。"); return; }
    try {
      const updated = await command('configureProject', project.id, { expectedRevision: revision, executionBackend: 'dsh', rules, defaults, commands: [{ id: 'test', executable: executable.trim(), args: parsed, timeoutMs: test?.timeoutMs ?? 120000 }, ...project.commands.filter(command => command.id !== 'test' && command.id !== test?.id)] }) as Project;
      setRevision(updated.revision);
    } catch { /* Keep the user's configuration draft on conflict. */ }
  };
  return <details className="sf-details"><summary>{t("工程配置与验证命令")}</summary><form className="sf-settings-form" onSubmit={submit}>{([['analyst', t("分析")], ['architect', t("设计")], ['developer', t("开发")], ['reviewer', t("复核")]] as const).map(([role, label]) => <label className="sf-field" key={role} htmlFor={`${prefix}-${role}`}>{label} {t("默认模型")}<select id={`${prefix}-${role}`} value={defaults[role] ? targetKey(defaults[role]!) : ''} disabled={disabled} onChange={event => { const target = targets.find(target => targetKey(target) === event.target.value); setDefaults(value => { const next = { ...value }; if (target) next[role] = target; else delete next[role]; return next; }); }}><option value="">{t("每次启动时选择")}</option>{targets.map(target => <option key={targetKey(target)} value={targetKey(target)}>{target.connectionSlug} / {target.model}</option>)}</select></label>)}<label className="sf-field" htmlFor={`${prefix}-rules`}>{t("工程规则")}<textarea id={`${prefix}-rules`} rows={4} value={rules} onChange={event => setRules(event.target.value)} disabled={disabled} /></label><label className="sf-field" htmlFor={`${prefix}-executable`}>{t("验证命令")}<input id={`${prefix}-executable`} value={executable} onChange={event => setExecutable(event.target.value)} required disabled={disabled} placeholder="npm" /></label><label className="sf-field" htmlFor={`${prefix}-args`}>{t("命令参数（JSON 数组）")}<input id={`${prefix}-args`} value={args} onChange={event => setArgs(event.target.value)} disabled={disabled} placeholder={'["run", "test"]'} /></label><p className="sf-hint">{t("验证在工作项的独立工作区中执行。npm 项目可使用 npm 与 [\"run\", \"test\"]。")}</p>{error && <p className="sf-inline-error">{t(error)}</p>}<div className="sf-actions"><button type="submit" disabled={disabled || !executable.trim()}>{t("保存工程配置")}</button></div></form></details>;
}

function Documents({ snapshot, read, run, command, disabled, visible, onEditingChange }: { snapshot: SpecflowSnapshot; read: Read; run(operation: CommandOperation, id?: string, input?: unknown): void; command: Command; disabled: boolean; visible: boolean; onEditingChange(value: boolean): void }) {
  const [chosen, setChosen] = useState(''), [mode, setMode] = useState<'reading' | 'source'>('reading');
  const artifact = snapshot.artifacts.find(artifact => artifact.id === chosen) ?? snapshot.artifacts[0];
  const revision = snapshot.revisions.find(revision => revision.id === artifact?.currentRevisionId);
  const [reading, setReading] = useState<SpecflowArtifactReading>(), [error, setError] = useState('');
  const [draft, setDraft] = useState<{ artifactId: string; expectedRevision: number; sourceRevisionId: string; content: string }>();
  const [saving, setSaving] = useState(false), [saveError, setSaveError] = useState(''), [savedRevisionId, setSavedRevisionId] = useState('');
  const [savedArtifactBaseline, setSavedArtifactBaseline] = useState(0);
  const editorId = useId();
  useEffect(() => {
    setReading(undefined); setError('');
    if (!revision || !visible) return;
    const controller = new AbortController();
    void read<SpecflowArtifactReading>({ resource: 'artifact', id: revision.id }, controller.signal).then(value => { if (!controller.signal.aborted) setReading(value); }).catch(error => { if (!controller.signal.aborted) setError(errorMessage(error)); });
    return () => controller.abort();
  }, [read, revision?.id, visible]);
  if (!artifact || !revision) return <Empty title={t("产物会出现在这里")}>{t("完成需求规格、工程设计或任务拆解后，可阅读完整文档并人工接纳。")}</Empty>;
  const accepted = artifact.acceptedRevisionId === revision.id;
  const conflict = !!draft && (artifact.id !== draft.artifactId || artifact.revision !== draft.expectedRevision || revision.id !== draft.sourceRevisionId);
  const awaitingRevision = !!savedRevisionId && revision.id !== savedRevisionId && artifact.revision <= savedArtifactBaseline;
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!draft || saving || disabled || conflict) return;
    setSaving(true); setSaveError('');
    try {
      const saved = await command('editArtifact', draft.artifactId, { expectedRevision: draft.expectedRevision, content: draft.content }) as ArtifactRevision;
      setSavedRevisionId(saved.id); setSavedArtifactBaseline(draft.expectedRevision); setDraft(undefined); setMode('source'); onEditingChange(false);
    } catch (error) { setSaveError((error as { code?: string }).code === 'REVISION_CONFLICT' ? "文档已有新修订，编辑草稿已保留。请比较最新文档后继续编辑。" : errorMessage(error)); }
    finally { setSaving(false); }
  };
  return <><label className="sf-field">{t("工程文档")}<select aria-label={t("工程文档")} value={artifact.id} disabled={!!draft || saving || awaitingRevision} onChange={event => { setChosen(event.target.value); setSavedRevisionId(''); }}>{snapshot.artifacts.map(artifact => <option key={artifact.id} value={artifact.id}>{logicalLabels[artifact.logicalId] ?? artifact.logicalId}</option>)}</select></label><div className="sf-document-heading"><Badge value={accepted ? 'accepted' : 'candidate'} /><span>{t("修订")} {short(revision.id)}</span><span>{revision.reviewed ? t("已独立复核") : t("待独立复核")}</span>{!draft && <button type="button" disabled={disabled || saving || awaitingRevision} onClick={() => { setDraft({ artifactId: artifact.id, expectedRevision: artifact.revision, sourceRevisionId: revision.id, content: revision.content }); setSaveError(''); onEditingChange(true); }}>{t("编辑文档")}</button>}</div>
    {awaitingRevision && <p className="sf-hint" role="status">{t("新候选文档已保存，正在同步。完成独立复核后才能接纳。")}</p>}
    {draft ? <form className="sf-editor sf-document-editor" onSubmit={save}><div className="sf-section-heading"><h3>{t("编辑完整执行文档")}</h3><span className="sf-editor-version">{t("基于")} {short(draft.sourceRevisionId)}</span></div><p className="sf-hint">{t("人工修改会生成新的候选修订，需要重新独立复核与接纳。")}</p>
      {(conflict || saveError) && <div className="sf-editor-conflict" role="alert"><p>{conflict ? t("文档已有新修订。你的编辑草稿已保留，请先比较最新文档。") : t(saveError)}</p>{conflict && <><details><summary>{t("查看最新文档")}</summary><pre>{revision.content}</pre></details><button type="button" disabled={saving} onClick={() => { setDraft(value => value && ({ ...value, expectedRevision: artifact.revision, sourceRevisionId: revision.id })); setSaveError(''); }}>{t("以最新修订继续编辑")}</button><p className="sf-hint">{t("保留你的正文草稿，将最新文档设为保存基线。")}</p></>}</div>}
      <label className="sf-field" htmlFor={editorId}>{t("文档 Markdown 正文")}<textarea id={editorId} aria-label={t("文档 Markdown 正文")} rows={18} maxLength={2_000_000} value={draft.content} disabled={saving} onChange={event => setDraft(value => value && ({ ...value, content: event.target.value }))} /></label>
      <div className="sf-actions"><button type="button" disabled={saving} onClick={() => { setDraft(undefined); setSaveError(''); onEditingChange(false); }}>{t("取消编辑文档")}</button><button className="sf-primary" disabled={disabled || saving || conflict || !draft.content.trim()}>{saving ? t("正在保存…") : t("保存新候选")}</button></div>
    </form> : <><div className="sf-segmented" aria-label={t("文档阅读方式")}><button type="button" aria-pressed={mode === 'reading'} onClick={() => setMode('reading')}>{t("阅读简报")}</button><button type="button" aria-pressed={mode === 'source'} onClick={() => setMode('source')}>{t("完整执行文档")}</button></div>
    {error && <p className="sf-inline-error">{t(error)}</p>}{mode === 'source' ? <div className="sf-document"><MarkdownView content={revision.content} idPrefix={`specflow-${revision.id}`} /></div> : reading ? <article className="sf-reading"><span className="sf-eyebrow">{reading.mode === 'authored' ? t("人类阅读简报") : t("原文摘录")}</span><h3>{reading.brief.title}</h3><p className="sf-reading-summary">{reading.brief.summary}</p>{reading.brief.sections.map((section, index) => <section key={index}><h4><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</h4><ul>{section.items.map((item, index) => <li key={index}>{item}</li>)}</ul></section>)}<p className="sf-hint">{t('接纳以完整执行文档为准；本简报与修订 {0} 对应。', { 0: short(reading.sourceRevisionId) })}</p></article> : <p className="sf-loading">{t("正在生成阅读视图…")}</p>}
    <div className="sf-accept-bar"><span>{accepted ? t("当前文档已接纳") : revision.reviewed ? t("复核已完成，可核对并接纳") : t("完成独立复核后才能接纳")}</span><button type="button" className="sf-primary" disabled={disabled || awaitingRevision || accepted || !revision.reviewed} onClick={() => run('acceptArtifact', artifact.id, { expectedRevision: artifact.revision, reason: t("在 DSH Specflow 面板中核对并接纳") })}>{accepted ? t("已接纳") : t("接纳此修订")}</button></div></>}
    {snapshot.findings.filter(finding => finding.status === 'open' && finding.targetLogicalId === artifact.logicalId).map(finding => <div className="sf-finding" key={finding.id}><Badge value="blocked">{finding.severity === 'blocker' ? t("阻断项") : t("复核建议")}</Badge><p>{finding.body}</p><code>{finding.location}</code></div>)}
  </>;
}

function Code({ snapshot, read, run, disabled, visible }: { snapshot: SpecflowSnapshot; read: Read; run(operation: CommandOperation, id?: string, input?: unknown): void; disabled: boolean; visible: boolean }) {
  const candidate = snapshot.candidates.at(-1);
  const [diff, setDiff] = useState<{ candidateId: string; text: string }>(), [precheck, setPrecheck] = useState<AcceptancePrecheck>(), [error, setError] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const key = `${candidate?.id}:${candidate?.revision}:${snapshot.evidence.map(evidence => evidence.revision).join(',')}:${snapshot.findings.map(finding => finding.revision).join(',')}`;
  useEffect(() => {
    setDiff(undefined); setPrecheck(undefined); setError(''); setAcknowledged(false);
    if (!candidate || !visible) return;
    const controller = new AbortController();
    void Promise.all([read<{ diff: string }>({ resource: 'candidateDiff', id: candidate.id }, controller.signal), read<AcceptancePrecheck>({ resource: 'acceptancePrecheck', id: candidate.id }, controller.signal)]).then(([result, check]) => { if (!controller.signal.aborted) { setDiff({ candidateId: candidate.id, text: result.diff }); setPrecheck(check); } }).catch(error => { if (!controller.signal.aborted) setError(errorMessage(error)); });
    return () => controller.abort();
  }, [read, key, visible]);
  if (!candidate) return <Empty title={t("等待代码候选")}>{t("实现阶段会在独立工作区中修改代码，验证与复核记录会保存在这里。")}</Empty>;
  return <><div className="sf-section-heading"><h3>{t("代码候选")}</h3><Badge value={candidate.status} /></div><dl className="sf-facts"><div><dt>{t("基线")}</dt><dd><code>{short(candidate.baseCommit)}</code></dd></div><div><dt>{t("候选")}</dt><dd><code>{short(candidate.checkpointCommit)}</code></dd></div></dl><code className="sf-path">{candidate.workspace}</code>{error && <p className="sf-inline-error">{t(error)}</p>}<details open className="sf-details"><summary>{t("代码差异")}</summary>{diff?.candidateId === candidate.id ? <pre className="sf-diff">{diff.text || t("当前候选没有文本差异。")}</pre> : <p className="sf-loading">{t("正在读取代码差异…")}</p>}</details>
    <h4 className="sf-subheading">{t("验证证据")}</h4>{snapshot.evidence.filter(evidence => evidence.candidateId === candidate.id).map(evidence => <details className="sf-evidence" key={evidence.id}><summary><Badge value={evidence.status} />{evidence.command.id}{evidence.stale && ` · ${t('已过期')}`}</summary><pre>{[evidence.stdout, evidence.stderr].filter(Boolean).join('\n') || t("退出码 {0}", {"0": evidence.exitCode})}</pre></details>)}
    {precheck?.blockers.length ? <ul className="sf-blockers">{precheck.blockers.map(blocker => <li key={blocker.code}>{blocker.message}</li>)}</ul> : null}
    {candidate.status !== 'accepted' && <><label className="sf-checkbox"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} disabled={!diff || disabled} />{t("我已核对代码差异与验证证据，确认将候选整合到工程")}</label><div className="sf-actions"><button type="button" disabled={disabled} onClick={() => run('verifyCandidate', candidate.id)}>{t("运行验证")}</button><button type="button" className="sf-primary" disabled={disabled || !precheck?.ready || !acknowledged || !diff} onClick={() => run('acceptCode', candidate.id)}>{t("接纳代码")}</button></div></>}
  </>;
}

function Runs({ snapshot, bootstrap, read, run, disabled, visible }: { snapshot: SpecflowSnapshot; bootstrap: SpecflowBootstrap; read: Read; run(operation: CommandOperation, id?: string, input?: unknown): void; disabled: boolean; visible: boolean }) {
  const [chosen, setChosen] = useState(''), [detail, setDetail] = useState<Attempt>(), [error, setError] = useState('');
  const attempt = snapshot.attempts.find(attempt => attempt.id === chosen) ?? snapshot.attempts.at(-1);
  useEffect(() => {
    setDetail(undefined); setError('');
    if (!attempt || !visible) return;
    const controller = new AbortController();
    void read<Attempt>({ resource: 'attempt', id: attempt.id }, controller.signal).then(value => { if (!controller.signal.aborted) setDetail(value); }).catch(error => { if (!controller.signal.aborted) setError(errorMessage(error)); });
    return () => controller.abort();
  }, [read, attempt?.id, attempt?.revision, visible]);
  if (!attempt) return <Empty title={t("运行记录从首次派发开始")}>{t("每次尝试保留原始模型、执行底座、结果和错误，方便定位问题。")}</Empty>;
  const binding = snapshot.bindings.filter(binding => binding.attemptId === attempt.id).at(-1);
  const canResume = !!bootstrap.catalog.backends.find(backend => backend.id === attempt.target.backend)?.capabilities.canResume;
  return <><label className="sf-field">{t("执行尝试")}<select value={attempt.id} onChange={event => setChosen(event.target.value)}>{[...snapshot.attempts].reverse().map(attempt => <option key={attempt.id} value={attempt.id}>{workflowText(snapshot.nodes.find(node => node.id === attempt.nodeRunId)?.name || '')} · #{attempt.number} · {labels[attempt.execution]}</option>)}</select></label><section className="sf-card"><div className="sf-section-heading"><h3>{t("尝试 #")}{attempt.number}</h3><Badge value={attempt.execution} /></div><dl className="sf-run-facts"><div><dt>{t("执行底座")}</dt><dd>{attempt.target.backend}</dd></div><div><dt>{t("连接 / 模型")}</dt><dd>{attempt.target.connectionSlug} / {attempt.target.model}</dd></div><div><dt>{t("启动时间")}</dt><dd>{time(attempt.startedAt)}</dd></div><div><dt>{t("结束时间")}</dt><dd>{time(attempt.finishedAt)}</dd></div><div><dt>{t("执行会话")}</dt><dd><code>{binding?.ref.sessionId ?? t("尚未绑定")}</code></dd></div></dl>{(detail?.error || attempt.error || error) && <p className="sf-inline-error">{t(detail?.error || attempt.error || error)}</p>}<div className="sf-actions">{activeStates.includes(attempt.execution) && <button type="button" className="sf-stop" disabled={disabled} onClick={() => run('stopAttempt', attempt.id)}>{t("停止")}</button>}{attempt.execution === 'reconciling' && <button type="button" disabled={disabled} onClick={() => run('reconcileAttempt', attempt.id)}>{t("核对执行结果")}</button>}{canResume && ['failed', 'cancelled'].includes(attempt.execution) && <button type="button" disabled={disabled} onClick={() => run('resumeAttempt', attempt.id)}>{t("尝试恢复原执行")}</button>}</div>{!canResume && ['failed', 'cancelled'].includes(attempt.execution) && <p className="sf-hint">{t("原执行不支持恢复。核对结果后，可在流程中重新执行此步骤。")}</p>}</section><details className="sf-details" open><summary>{t("运行输出")}</summary><pre>{detail?.output ?? t("当前没有已持久化的输出。")}</pre></details><details className="sf-details"><summary>{t("原始执行提示")}</summary><pre>{detail?.prompt ?? t("正在读取…")}</pre></details></>;
}

function InteractionCard({ id, request, command, disabled }: { id: string; request: unknown; command: Command; disabled: boolean }) {
  const prefix = useId(), [answer, setAnswer] = useState('');
  return <form className="sf-card sf-clarification" onSubmit={event => { event.preventDefault(); let value: unknown = answer; try { value = JSON.parse(answer); } catch { /* Text is also a valid interaction answer. */ } void command('answerInteraction', id, { answer: value }).catch(() => {}); }}><h3>{t("运行正在等待你的回答")}</h3><pre>{typeof request === 'string' ? request : JSON.stringify(request, null, 2)}</pre><label htmlFor={prefix}>{t("回答（文本或 JSON）")}</label><textarea id={prefix} rows={3} value={answer} onChange={event => setAnswer(event.target.value)} required disabled={disabled} /><div className="sf-actions"><button className="sf-primary" disabled={disabled || !answer.trim()}>{t("提交给当前运行")}</button></div></form>;
}
