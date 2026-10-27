import { t, useLocale } from './i18n.ts';
import { workflowText } from './workflowCopy.ts';
import { useEffect, useRef, useState } from 'react';
import { Activity, ArrowRight, Check, ChevronDown, ChevronRight, Circle, FileCheck2, FileText, Loader2, Pin, Play, RefreshCcw, Settings2, ShieldCheck } from 'lucide-react';
import { api } from './api.ts';
import { useWorkspace, logicalLabels, NodeIcon, short, targetLabel, serializeTarget } from './context.tsx';
import { hasRequirementDraft } from './Requirements.tsx';
import { ClarificationPanel } from './ClarificationPanel.tsx';
import { StepFacts } from './StepFacts.tsx';
import { ResizablePane } from './ResizablePane.tsx';
import { getConditionReasons, getFlowReadinessKey, getNextAction, getNodeDispatchScopes, getStepStatus, getWorkflowProgress, groupWorkflowNodes, selectCurrentNode, type ReadinessState } from './flowSelectors.ts';
import { backendInfo, currentTargetOverride, projectBackend, selectBackendTarget, targetsForBackend } from './backendSelection.ts';
import { AutomationControls, type AutomationCommand } from './AutomationControls.tsx';
import { VerificationRecovery } from './VerificationRecovery.tsx';
import './flow.css';

export function Flow() {
  const locale = useLocale();
  const { snapshot, backend, selectedNode, selectionMode, followCurrent, setSelectedNode, setSelectedArtifact, setSelectedRevision, setTab, perform, openWorkflow, openSettings, openRun, isPending, pendingItems, openAttention, openPending, overlayOpen } = useWorkspace();
  const [override, setOverride] = useState(''), [retry, setRetry] = useState(0);
  const [checked, setChecked] = useState<{ key: string; result: ReadinessState }>();
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(Date.now);
  const clarification = useRef<HTMLDivElement>(null);
  const verificationRecovery = useRef<HTMLDivElement>(null);
  const run = snapshot?.runs.at(-1);
  const nodes = snapshot?.nodes.filter(n => n.workflowRunId === run?.id) || [];
  const historicalNode = snapshot?.nodes.find(n => n.id === selectedNode);
  const node = selectionMode === 'pinned' && historicalNode ? historicalNode : selectCurrentNode(run, nodes);
  const viewedRun = snapshot?.runs.find(value => value.id === node?.workflowRunId) || run;
  const def = viewedRun?.definition.nodes.find(n => n.id === node?.nodeId);
  const attempt = snapshot?.attempts.find(a => a.id === node?.currentAttemptId);
  const session = snapshot?.clarifications.filter(s => s.nodeRunId === node?.id).at(-1);
  const modelStage = ['agent', 'clarify', 'review'].includes(node?.type || '');
  const executionBackend = projectBackend(snapshot?.project);
  const target = selectBackendTarget(executionBackend, def?.target, def?.role ? viewedRun?.definition.roles[def.role] : undefined, def?.role ? snapshot?.project.defaults[def.role] : undefined);
  const overrideTarget = currentTargetOverride(override, executionBackend);
  const selectedTarget = overrideTarget || target;
  const selectedBackend = backendInfo(backend, executionBackend);
  const requirements = snapshot?.requirements.current;
  const accepted = snapshot?.item.status === 'accepted';
  const automated = !!snapshot?.automationRuns?.some(value => value.workflowRunId === viewedRun?.id && value.state === 'active') || !!snapshot?.repairCycles?.some(value => value.workflowRunId === viewedRun?.id && value.state === 'active');
  const unconfirmedVerification = node?.type === 'verify' && node.verificationUnconfirmed;
  const unsavedRequirements = !!snapshot && !!requirements && hasRequirementDraft(snapshot.item.id, requirements);
  const targets = targetsForBackend(backend?.targets || [], executionBackend);
  const progress = getWorkflowProgress(run, nodes), groups = groupWorkflowNodes(run, nodes);
  const { scope: pendingScope, locks: dispatchScopes } = getNodeDispatchScopes(node, snapshot?.candidates.at(-1)?.id);
  const dispatching = dispatchScopes.some(scope => isPending(scope));
  const readinessKey = getFlowReadinessKey(node, viewedRun, snapshot);
  const readiness: ReadinessState = checked?.key === readinessKey ? checked.result : { state: 'loading' };
  useEffect(() => { setOverride(''); }, [node?.id, executionBackend]);
  useEffect(() => {
    let current = true; const controller = new AbortController();
    if (!node || accepted) return;
    setChecked({ key: readinessKey, result: { state: 'loading' } });
    api<{ ready: boolean; reasons: string[] }>(`/node-runs/${node.id}/readiness`, undefined, { signal: controller.signal }).then(value => {
      if (current) setChecked({ key: readinessKey, result: { state: value.ready ? 'ready' : 'blocked', reasons: value.reasons } });
    }).catch(error => { if (current) setChecked({ key: readinessKey, result: { state: 'error', message: (error as Error).message } }); });
    return () => { current = false; controller.abort(); };
  }, [readinessKey, retry, accepted, locale]);

  const clientBlockers = [
    ...(automated ? [t('自动化正在管理此流程，请先停止自动推进或修订再手动派发。')] : []),
    ...(unsavedRequirements ? [t('需求有未保存草稿或版本冲突，请先保存或处理冲突')] : []),
    ...(snapshot?.project.guidanceError ? [snapshot.project.guidanceError] : []),
    ...(modelStage && !selectedTarget ? [t('尚未选择当前底座的连接与模型，请在步骤上下文中配置')] : []),
  ];
  const reasons = getConditionReasons(readiness, clientBlockers, node?.blockers || []);
  const active = !!node && ['starting', 'running', 'waiting_interaction', 'reconciling'].includes(node.execution);
  useEffect(() => { if (!active) return; setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [active, attempt?.id]);
  const waiting = pendingItems.find(item => !item.stale && (item.kind === 'interaction' || item.kind === 'clarification'));
  const reviewable = pendingItems.find(item => {
    if (item.kind !== 'artifact' || item.stale || !snapshot?.revisions.find(revision => revision.id === item.revisionId)?.reviewed) return false;
    const artifact = snapshot.artifacts.find(value => value.id === item.artifactId);
    return item.nodeRunId === node?.id || !!artifact && !!def?.inputs.includes(`${artifact.logicalId}@accepted`);
  });
  const canDispatch = !!node && readiness.state === 'ready' && !clientBlockers.length && !dispatching && !accepted && !active && !waiting && viewedRun?.state === 'active';
  const openAttempt = () => { if (attempt) openRun(attempt.id); else setTab(node?.type === 'verify' ? 'code' : 'runs'); };
  const outputArtifact = snapshot?.artifacts.find(a => def?.outputs.includes(a.logicalId));
  const openOutput = () => { if (outputArtifact) setSelectedArtifact(outputArtifact.id); setTab('artifacts'); };
  const start = () => {
    if (!canDispatch || !node) return;
    return perform(() => api(`/node-runs/${node.id}/attempts`, { expectedRevision: node.revision, ...(overrideTarget ? { target: overrideTarget } : {}) }), node.type === 'human' ? t('候选代码已接纳') : t('阶段已派发，运行结果会自动更新'), pendingScope);
  };
  const automationCommand = (command: AutomationCommand, id: string, input?: unknown) => {
    const route = command === 'startRepair' ? `/node-runs/${id}/repair` : command === 'stopRepair' ? `/repair-cycles/${id}/stop` : command === 'startAutomation' ? `/workflow-runs/${id}/automation` : `/automation-runs/${id}/stop`;
    void perform(() => api(route, input || {}), t('自动化操作已提交'), `automation:${snapshot?.item.id}`);
  };
  const openPendingItem = (item: typeof pendingItems[number]) => {
    openAttention(item);
    if (item.kind === 'clarification' && item.nodeRunId === node?.id) requestAnimationFrame(() => clarification.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };
  const selectedIsHistory = !!node && node.workflowRunId !== run?.id;
  const action = getNextAction({ node, runState: viewedRun?.state, accepted, readiness, clientBlocked: !!clientBlockers.length, unsavedRequirements, dispatchEnabled: canDispatch, hasOutput: !!outputArtifact, hasAttempt: !!attempt, waiting, reviewable, pendingCount: pendingItems.length });
  const clickAction = () => {
    if (unconfirmedVerification) { verificationRecovery.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); verificationRecovery.current?.querySelector('button')?.focus(); }
    else if (action.kind === 'dispatch') void start();
    else if (action.kind === 'evidence') setTab('code');
    else if (action.kind === 'attention') { const item = pendingItems.find(value => value.id === action.attentionId); if (item) openPendingItem(item); }
    else if (action.kind === 'run') openAttempt();
    else if (action.kind === 'artifact') openOutput();
    else if (action.kind === 'retry') setRetry(value => value + 1);
    else if (action.kind === 'requirements') setTab('requirements');
  };
  let summary = unconfirmedVerification ? t('验证进程还未确认停止。核对本机进程后，手动确认解除阻塞。') : action.summary;
  if (action.kind === 'run' && node && ['starting', 'running'].includes(node.execution) && attempt?.startedAt && Number.isFinite(Date.parse(attempt.startedAt))) {
    const elapsed = Math.max(0, Math.floor((now - Date.parse(attempt.startedAt)) / 1000));
    summary += t(" 已运行 {value1} 分 {value2} 秒。", { value1: Math.floor(elapsed / 60), value2: elapsed % 60 });
  }

  const context = <><div className="inspector-body"><div className="inspector-label"><span>{selectedIsHistory ? t('历史运行的步骤') : t('步骤上下文')}</span><span>{node ? String((viewedRun?.definition.nodes.findIndex(n => n.id === node.nodeId) ?? -1) + 1).padStart(2, '0') : '—'}</span></div><div className="inspector-title"><div><NodeIcon type={node?.type || 'agent'} size={22} /></div><h2>{node ? workflowText(node.name) : t('选择步骤')}</h2></div>
    {node && <StepFacts node={node} definition={def} />}
    {modelStage && <div className="inspector-section"><label htmlFor="flow-model-target">{t("执行配置")} <Settings2 size={13} /></label><select id="flow-model-target" value={selectedTarget ? serializeTarget(selectedTarget) : ''} onChange={e => setOverride(e.target.value)}><option value="">{t("选择连接与模型")}</option>{target && !targets.some(t => serializeTarget(t) === serializeTarget(target)) && <option value={serializeTarget(target)}>{targetLabel(target)} {t("· 当前配置")}</option>}{targets.map(t => <option key={serializeTarget(t)} value={serializeTarget(t)}>{targetLabel(t)}</option>)}</select><small>{t('当前底座：{backend}。节点覆盖优先于流程角色和项目默认，更换配置用于新尝试。', { backend: selectedBackend.name })}</small>{node?.type === 'clarify' && session && ['analyzing', 'waiting_answers'].includes(session.state) && attempt && <small>{t('当前澄清使用 {target}；未重新选择时沿用原执行配置。', { target: targetLabel(attempt.target) })}</small>}</div>}
    {modelStage && <div className="inspector-section"><label>{t("项目章程")}</label><button className="input-card" onClick={openSettings}><ShieldCheck size={16} /><span>{snapshot?.project.guidance?.files.map(f => f.name).join(' + ') || t('补充工程规则')}<small>{t('当前内容 {hash} · 查看 / 编辑', { hash: short(snapshot?.project.guidance?.contentHash) })}</small></span><ChevronRight size={14} /></button></div>}
    <div className="inspector-section"><label>{t("输入依据")} <span>{(def?.inputs.length || 0) + (modelStage ? 1 : 0)}</span></label>{modelStage && <button className="input-card requirement-input-card" onClick={() => setTab('requirements')}><FileText size={16} /><span>{t("已保存需求与文档")}<small>{t('版本 {version} · {count} 份文档', { version: requirements?.number || 1, count: requirements?.documents.length || 0 })}{unsavedRequirements ? t(' · 本地另有草稿') : ''}</small></span><ChevronRight size={14} /></button>}{def?.inputs.map(input => { const artifact = snapshot?.artifacts.find(a => a.logicalId === input.split('@')[0]); const revisionId = input.includes('@accepted') ? artifact?.acceptedRevisionId : artifact?.currentRevisionId; const revision = snapshot?.revisions.find(value => value.id === revisionId); return <button className="input-card" key={input} disabled={!artifact} onClick={() => { if (artifact) { setSelectedArtifact(artifact.id); if (revisionId) setSelectedRevision(revisionId); setTab('artifacts'); } }}><FileText size={16} /><span>{t(logicalLabels[input.split('@')[0]] || input)}<small>{revision ? `${input.includes('@accepted') ? t('已接纳依据') : t('当前候选')} · ${short(revision.id)} · ${short(revision.contentHash)}` : t('等待符合条件的上游产物')}</small></span><span className={revision ? 'input-ok' : 'input-missing'}>{revision ? <Check size={14} /> : <Circle size={12} />}</span></button>; })}<small>{selectedIsHistory ? t('上方为当前材料；本次历史执行实际使用的版本见运行详情。') : t('新尝试固定当前章程与已保存需求；原执行的冻结依据见运行详情。')}</small></div>
    <div className="inspector-section"><label>{t("执行目标")}</label><p className="prompt-preview">{def?.prompt ? workflowText(def.prompt) : (node?.type === 'verify' ? t('执行项目验证命令，核对退出码与候选代码哈希。') : t('检查工程条件并保存接纳决策。'))}</p></div>
    {attempt && <button className="attempt-link" onClick={() => openRun(attempt.id)}><Activity size={15} /><span>{t('第 {number} 次尝试 · 查看冻结输入与身份', { number: attempt.number })}</span><ArrowRight size={14} /></button>}
  </div></>;

  return <ResizablePane context={context} overlayOpen={overlayOpen}>
    <div className="flow-task-bar" aria-label={t("当前任务")}><div className="flow-task-heading"><div><div className="flow-task-mode">{selectionMode === 'pinned' ? <><Pin size={13} /> {t("固定查看")}{selectedIsHistory ? t(' · 历史运行') : ''}</> : <><Activity size={13} /> {t("跟随当前任务")}</>}</div><h2>{node ? workflowText(node.name) : t('尚无步骤')}</h2></div>{selectionMode === 'pinned' && <button className="text-button" onClick={followCurrent}><RefreshCcw size={14} /> {t("回到当前任务")}</button>}</div>
      {node && <StepFacts node={node} definition={def} compact />}
      <div className="flow-task-action"><div><p id="flow-action-explanation" role={active ? 'timer' : 'status'}>{summary}</p>{pendingItems.length > 1 && <button className="text-button" onClick={openPending}>{t('查看全部 {count} 项待处理', { count: pendingItems.length })} <ChevronRight size={13} /></button>}</div><button className="primary-button" disabled={unconfirmedVerification ? accepted || dispatching : action.disabled} aria-describedby="flow-action-explanation" onClick={clickAction}>{action.kind === 'dispatch' && dispatching ? <Loader2 size={16} className="spin" /> : action.kind === 'dispatch' ? <Play size={16} /> : action.kind === 'retry' ? <RefreshCcw size={16} /> : <ArrowRight size={16} />}{unconfirmedVerification ? t('核对验证进程') : action.label}</button></div>
    </div>
    {run && !run.definition.requireClarification && snapshot?.workflows.at(-1)?.definition.requireClarification && !accepted && <div className="flow-upgrade-notice"><span>{t("当前运行使用旧模板；新版已加入独立需求澄清。历史运行会保留。")}</span><button className="outline-button" disabled={isPending(`workflow:${snapshot.item.id}`)} onClick={() => perform(() => api('/workflow-runs', { workflowId: snapshot.workflows.at(-1)!.id }), t('已创建包含需求澄清的新运行，历史记录保留'), `workflow:${snapshot.item.id}`)}>{t("启用含澄清的新流程")}</button></div>}
    <div className="flow-progress-section"><div><span>{progress.total ? t("当前有效通过 {completed} / {total} 步", { completed: progress.completed, total: progress.total }) : t('尚无步骤')}</span>{progress.percent !== undefined && <strong>{progress.percent}%</strong>}<span className="flow-delivery-state">{accepted ? t('工作项已交付') : t('工作项尚未交付')}</span></div>{progress.percent !== undefined && <div className="progress-track" role="progressbar" aria-label={t("当前有效通过步骤")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent} aria-valuetext={t("当前有效通过 {completed} / {total} 步：执行已结束、门禁通过且版本有效，需人工接纳的步骤已接纳；{awaitingAcceptance} 步待人工接纳，{stale} 步上游已变更。百分比不代表交付。", { completed: progress.completed, total: progress.total, awaitingAcceptance: progress.awaitingAcceptance, stale: progress.stale })}><span style={{ width: `${progress.percent}%` }} /></div>}{!!progress.stale && <p>{t('{count} 步的上游依据已变更，有效通过计数随之回退。', { count: progress.stale })}</p>}</div>
    {node && <section className="flow-current-body" aria-label={t("当前步骤的工作内容")}>
      {node.type === 'verify' && active && !node.verificationUnconfirmed && <div className="run-actions"><button className="outline-button" disabled={dispatching || !!node.verificationStopRequestedAt} onClick={() => void perform(() => api(`/node-runs/${node.id}/stop-verification`, {}), t('停止验证请求已提交'), `node:${node.id}`)}>{node.verificationStopRequestedAt ? t('正在请求停止') : t('停止验证命令')}</button></div>}
      {unconfirmedVerification && <div ref={verificationRecovery}><VerificationRecovery disabled={dispatching || accepted} onConfirm={reason => void perform(() => api(`/node-runs/${node.id}/confirm-verification-stopped`, { expectedRevision: node.revision, reason }), t('验证进程确认已记录'), `node:${node.id}`)} /></div>}
      {!accepted && !!reasons.length && <details className={`flow-conditions ${readiness.state === 'error' ? 'has-error' : ''}`} open={clientBlockers.length > 0 || readiness.state === 'error' || readiness.state === 'blocked'}><summary>{t("运行条件")} <span>{readiness.state === 'loading' ? t('检查中') : readiness.state === 'error' ? t('读取失败') : readiness.state === 'ready' ? clientBlockers.length ? t('服务端满足 · 本地待处理') : t('服务端满足') : t('服务端条件不足')}</span></summary><ul>{reasons.map(reason => <li key={reason.reason}><span>{reason.reason}</span><small>{reason.sources.join(' · ')}</small></li>)}</ul><div className="flow-condition-actions">{(readiness.state === 'error' || readiness.state === 'blocked') && <button className="outline-button" onClick={() => setRetry(value => value + 1)}><RefreshCcw size={14} /> {t("重试检查")}</button>}{unsavedRequirements && <button className="outline-button" onClick={() => setTab('requirements')}>{t("保存需求 / 处理冲突")}</button>}{snapshot?.project.guidanceError && <button className="outline-button" onClick={openSettings}>{t("修复项目章程")}</button>}</div></details>}
      {node.type === 'clarify' && <div ref={clarification} className="flow-clarification"><ClarificationPanel session={session} target={overrideTarget} disabled={unsavedRequirements || !!snapshot?.project.guidanceError} /></div>}
      {action.kind !== 'dispatch' && !accepted && !active && !waiting && viewedRun?.state === 'active' && <div className="flow-secondary-dispatch"><span>{node.freshness === 'stale' ? t('当前结果已过期，使用最新已保存依据创建新尝试。') : t('需要继续此步骤时，运行条件仍须全部满足。')}</span><button className="outline-button" disabled={!canDispatch} onClick={() => void start()}>{dispatching ? <Loader2 size={14} className="spin" /> : <Play size={14} />}{node.type === 'human' ? t('接纳候选代码') : node.execution === 'pending' ? t('运行所选步骤') : t('创建新尝试')}</button></div>}
      {outputArtifact && node.execution === 'completed' && action.kind !== 'artifact' && <button className="flow-result-link" onClick={openOutput}><FileCheck2 size={17} /><span>{t('查看 {artifact}', { artifact: t(logicalLabels[outputArtifact.logicalId] || outputArtifact.logicalId) })}<small>{t('修订 {revision} · 以选定修订的接纳状态为准', { revision: short(outputArtifact.currentRevisionId) })}</small></span><ArrowRight size={15} /></button>}
    </section>}
    {viewedRun && !selectedIsHistory && <AutomationControls workflowRun={viewedRun} node={node} definition={def} repairs={snapshot?.repairCycles} automations={snapshot?.automationRuns} disabled={accepted || dispatching || isPending(`automation:${snapshot?.item.id}`)} startBlocked={unsavedRequirements || !!snapshot?.project.guidanceError} onCommand={automationCommand} />}
    <div className="flow-directory-heading"><div><h3>{t("工程流程")} <span>{t('{count} 个步骤', { count: run?.definition.nodes.length || 0 })}</span></h3><p>{t("分组仅用于浏览，执行顺序与依赖读取流程定义。")}</p></div><button className="text-button" disabled={accepted} onClick={openWorkflow}><Settings2 size={15} /> {t("编辑流程")}</button></div>
    <div className="flow-step-groups">{groups.map(group => { const hasProblem = group.nodes.some(value => value.freshness === 'stale' || value.gate === 'blocked' || ['failed', 'waiting_interaction', 'reconciling'].includes(value.execution)); const opened = groupOpen[`${run?.id}:${group.name}`] ?? (hasProblem || group.nodes.some(value => value.id === node?.id)); const count = group.nodes.filter(value => getStepStatus(value, run?.definition.nodes.find(d => d.id === value.nodeId)).effectivelyPassed).length; return <details className="flow-step-group" key={`${run?.id}:${group.name}`} open={opened} onToggle={event => { const isOpen = event.currentTarget.open; if (isOpen !== opened) setGroupOpen(value => ({ ...value, [`${run?.id}:${group.name}`]: isOpen })); }}><summary><ChevronDown size={16} /><strong>{t(group.name)}</strong><span>{t('有效通过 {count} / {total}', { count, total: group.nodes.length })}</span>{hasProblem && <span className="flow-group-attention">{t("需要处理")}</span>}</summary>{group.nodes.map(value => { const definition = run?.definition.nodes.find(d => d.id === value.nodeId), passed = getStepStatus(value, definition).effectivelyPassed; return <div className={`flow-step-row${value.id === node?.id ? ' selected' : ''}`} key={value.id}><button className="flow-stage-select" aria-pressed={value.id === node?.id} onClick={() => setSelectedNode(value.id)}><span className={`flow-stage-number${passed ? ' passed' : ''}`}>{passed ? <Check size={15} /> : ['starting', 'running'].includes(value.execution) ? <Loader2 size={15} className="spin" /> : String(run!.definition.nodes.findIndex(d => d.id === value.nodeId) + 1).padStart(2, '0')}</span><NodeIcon type={value.type} size={17} /><span>{workflowText(value.name)}</span><ChevronRight size={15} /></button><StepFacts node={value} definition={definition} compact /></div>; })}</details>; })}</div>
    <div className="flow-requirements-link"><FileText size={18} /><span>{t('已保存需求 · 版本 {version}', { version: requirements?.number || 1 })}<small>{t('{count} 份文档', { count: requirements?.documents.length || 0 })}{requirements?.request.trim() ? t(' + 需求正文') : ''}{unsavedRequirements ? t(' · 另有本地草稿，尚未供新执行使用') : ''}</small></span><button className="text-button" onClick={() => setTab('requirements')}>{t("查看 / 编辑")} <ArrowRight size={14} /></button></div>
    <div className="flow-footnote"><ShieldCheck size={15} /><span>{t("工程门禁以真实产物版本、验证证据和复核结果为依据。")}</span></div>
  </ResizablePane>;
}
