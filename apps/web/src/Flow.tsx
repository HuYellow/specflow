import { useEffect, useRef, useState } from 'react';
import { Activity, ArrowRight, Check, ChevronDown, ChevronRight, Circle, FileCheck2, FileText, Loader2, Pin, Play, RefreshCcw, Settings2, ShieldCheck } from 'lucide-react';
import type { ModelTarget } from '../../../packages/domain/index.ts';
import { api } from './api.ts';
import { useWorkspace, logicalLabels, NodeIcon, short, targetLabel, serializeTarget } from './context.tsx';
import { hasRequirementDraft } from './Requirements.tsx';
import { ClarificationPanel } from './ClarificationPanel.tsx';
import { StepFacts } from './StepFacts.tsx';
import { ResizablePane } from './ResizablePane.tsx';
import { getConditionReasons, getFlowReadinessKey, getNextAction, getNodeDispatchScopes, getStepStatus, getWorkflowProgress, groupWorkflowNodes, selectCurrentNode, type ReadinessState } from './flowSelectors.ts';
import './flow.css';

export function Flow() {
  const { snapshot, backend, selectedNode, selectionMode, followCurrent, setSelectedNode, setSelectedArtifact, setSelectedRevision, setTab, perform, openWorkflow, openSettings, openRun, isPending, pendingItems, openAttention, openPending, overlayOpen } = useWorkspace();
  const [override, setOverride] = useState(''), [retry, setRetry] = useState(0);
  const [checked, setChecked] = useState<{ key: string; result: ReadinessState }>();
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(Date.now);
  const clarification = useRef<HTMLDivElement>(null);
  const run = snapshot?.runs.at(-1);
  const nodes = snapshot?.nodes.filter(n => n.workflowRunId === run?.id) || [];
  const historicalNode = snapshot?.nodes.find(n => n.id === selectedNode);
  const node = selectionMode === 'pinned' && historicalNode ? historicalNode : selectCurrentNode(run, nodes);
  const viewedRun = snapshot?.runs.find(value => value.id === node?.workflowRunId) || run;
  const def = viewedRun?.definition.nodes.find(n => n.id === node?.nodeId);
  const attempt = snapshot?.attempts.find(a => a.id === node?.currentAttemptId);
  const session = snapshot?.clarifications.filter(s => s.nodeRunId === node?.id).at(-1);
  const modelStage = ['agent', 'clarify', 'review'].includes(node?.type || '');
  const target = (node?.type === 'clarify' && session && ['analyzing', 'waiting_answers'].includes(session.state) ? attempt?.target : undefined) || def?.target || (def?.role && viewedRun?.definition.roles[def.role]) || (def?.role && snapshot?.project.defaults[def.role]);
  const requirements = snapshot?.requirements.current;
  const accepted = snapshot?.item.status === 'accepted';
  const unsavedRequirements = !!snapshot && !!requirements && hasRequirementDraft(snapshot.item.id, requirements);
  const targets: ModelTarget[] = (backend?.targets || []).filter((t: ModelTarget) => t.backend !== 'sandbox' || snapshot?.project.demo);
  const progress = getWorkflowProgress(run, nodes), groups = groupWorkflowNodes(run, nodes);
  const { scope: pendingScope, locks: dispatchScopes } = getNodeDispatchScopes(node, snapshot?.candidates.at(-1)?.id);
  const dispatching = dispatchScopes.some(scope => isPending(scope));
  const readinessKey = getFlowReadinessKey(node, viewedRun, snapshot);
  const readiness: ReadinessState = checked?.key === readinessKey ? checked.result : { state: 'loading' };
  useEffect(() => { setOverride(''); }, [node?.id]);
  useEffect(() => {
    let current = true; const controller = new AbortController();
    if (!node || accepted) return;
    setChecked({ key: readinessKey, result: { state: 'loading' } });
    api<{ ready: boolean; reasons: string[] }>(`/node-runs/${node.id}/readiness`, undefined, { signal: controller.signal }).then(value => {
      if (current) setChecked({ key: readinessKey, result: { state: value.ready ? 'ready' : 'blocked', reasons: value.reasons } });
    }).catch(error => { if (current) setChecked({ key: readinessKey, result: { state: 'error', message: (error as Error).message } }); });
    return () => { current = false; controller.abort(); };
  }, [readinessKey, retry, accepted]);

  const clientBlockers = [
    ...(unsavedRequirements ? ['需求有未保存草稿或版本冲突，请先保存或处理冲突'] : []),
    ...(snapshot?.project.guidanceError ? [snapshot.project.guidanceError] : []),
    ...(modelStage && !override && !target ? ['尚未选择连接与模型，请在步骤上下文中配置'] : []),
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
    return perform(() => api(`/node-runs/${node.id}/attempts`, { expectedRevision: node.revision, ...(override ? { target: JSON.parse(override) } : {}) }), node.type === 'human' ? '候选代码已接纳' : '阶段已派发，运行结果会自动更新', pendingScope);
  };
  const openPendingItem = (item: typeof pendingItems[number]) => {
    openAttention(item);
    if (item.kind === 'clarification' && item.nodeRunId === node?.id) requestAnimationFrame(() => clarification.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };
  const selectedIsHistory = !!node && node.workflowRunId !== run?.id;
  const action = getNextAction({ node, runState: viewedRun?.state, accepted, readiness, clientBlocked: !!clientBlockers.length, unsavedRequirements, dispatchEnabled: canDispatch, hasOutput: !!outputArtifact, hasAttempt: !!attempt, waiting, reviewable, pendingCount: pendingItems.length });
  const clickAction = () => {
    if (action.kind === 'dispatch') void start();
    else if (action.kind === 'evidence') setTab('code');
    else if (action.kind === 'attention') { const item = pendingItems.find(value => value.id === action.attentionId); if (item) openPendingItem(item); }
    else if (action.kind === 'run') openAttempt();
    else if (action.kind === 'artifact') openOutput();
    else if (action.kind === 'retry') setRetry(value => value + 1);
    else if (action.kind === 'requirements') setTab('requirements');
  };
  let summary = action.summary;
  if (action.kind === 'run' && node && ['starting', 'running'].includes(node.execution) && attempt?.startedAt && Number.isFinite(Date.parse(attempt.startedAt))) {
    const elapsed = Math.max(0, Math.floor((now - Date.parse(attempt.startedAt)) / 1000));
    summary += ` 已运行 ${Math.floor(elapsed / 60)} 分 ${elapsed % 60} 秒。`;
  }

  const context = <><div className="inspector-body"><div className="inspector-label"><span>{selectedIsHistory ? '历史运行的步骤' : '步骤上下文'}</span><span>{node ? String((viewedRun?.definition.nodes.findIndex(n => n.id === node.nodeId) ?? -1) + 1).padStart(2, '0') : '—'}</span></div><div className="inspector-title"><div><NodeIcon type={node?.type || 'agent'} size={22} /></div><h2>{node?.name || '选择步骤'}</h2></div>
    {node && <StepFacts node={node} definition={def} />}
    {modelStage && <div className="inspector-section"><label htmlFor="flow-model-target">执行配置 <Settings2 size={13} /></label><select id="flow-model-target" value={override || (target ? serializeTarget(target) : '')} onChange={e => setOverride(e.target.value)}><option value="">选择连接与模型</option>{target && !targets.some(t => serializeTarget(t) === serializeTarget(target)) && <option value={serializeTarget(target)}>{targetLabel(target)} · 当前配置</option>}{targets.map(t => <option key={serializeTarget(t)} value={serializeTarget(t)}>{targetLabel(t)}</option>)}</select><small>节点覆盖优先于流程角色和项目默认。更换配置仅用于新尝试。</small></div>}
    {modelStage && <div className="inspector-section"><label>项目章程</label><button className="input-card" onClick={openSettings}><ShieldCheck size={16} /><span>{snapshot?.project.guidance?.files.map(f => f.name).join(' + ') || '补充工程规则'}<small>当前内容 {short(snapshot?.project.guidance?.contentHash)} · 查看 / 编辑</small></span><ChevronRight size={14} /></button></div>}
    <div className="inspector-section"><label>输入依据 <span>{(def?.inputs.length || 0) + (modelStage ? 1 : 0)}</span></label>{modelStage && <button className="input-card requirement-input-card" onClick={() => setTab('requirements')}><FileText size={16} /><span>已保存需求与文档<small>版本 {requirements?.number} · {requirements?.documents.length || 0} 份文档{unsavedRequirements ? ' · 本地另有草稿' : ''}</small></span><ChevronRight size={14} /></button>}{def?.inputs.map(input => { const artifact = snapshot?.artifacts.find(a => a.logicalId === input.split('@')[0]); const revisionId = input.includes('@accepted') ? artifact?.acceptedRevisionId : artifact?.currentRevisionId; const revision = snapshot?.revisions.find(value => value.id === revisionId); return <button className="input-card" key={input} disabled={!artifact} onClick={() => { if (artifact) { setSelectedArtifact(artifact.id); if (revisionId) setSelectedRevision(revisionId); setTab('artifacts'); } }}><FileText size={16} /><span>{logicalLabels[input.split('@')[0]] || input}<small>{revision ? `${input.includes('@accepted') ? '已接纳依据' : '当前候选'} · ${short(revision.id)} · ${short(revision.contentHash)}` : '等待符合条件的上游产物'}</small></span><span className={revision ? 'input-ok' : 'input-missing'}>{revision ? <Check size={14} /> : <Circle size={12} />}</span></button>; })}<small>{selectedIsHistory ? '上方为当前材料；本次历史执行实际使用的版本见运行详情。' : '新尝试固定当前章程与已保存需求；原执行的冻结依据见运行详情。'}</small></div>
    <div className="inspector-section"><label>执行目标</label><p className="prompt-preview">{def?.prompt || (node?.type === 'verify' ? '执行项目验证命令，核对退出码与候选代码哈希。' : '检查工程条件并保存接纳决策。')}</p></div>
    {attempt && <button className="attempt-link" onClick={() => openRun(attempt.id)}><Activity size={15} /><span>第 {attempt.number} 次尝试 · 查看冻结输入与身份</span><ArrowRight size={14} /></button>}
  </div></>;

  return <ResizablePane context={context} overlayOpen={overlayOpen}>
    <div className="flow-task-bar" aria-label="当前任务"><div className="flow-task-heading"><div><div className="flow-task-mode">{selectionMode === 'pinned' ? <><Pin size={13} /> 固定查看{selectedIsHistory ? ' · 历史运行' : ''}</> : <><Activity size={13} /> 跟随当前任务</>}</div><h2>{node?.name || '尚无步骤'}</h2></div>{selectionMode === 'pinned' && <button className="text-button" onClick={followCurrent}><RefreshCcw size={14} /> 回到当前任务</button>}</div>
      {node && <StepFacts node={node} definition={def} compact />}
      <div className="flow-task-action"><div><p id="flow-action-explanation" role={active ? 'timer' : 'status'}>{summary}</p>{pendingItems.length > 1 && <button className="text-button" onClick={openPending}>查看全部 {pendingItems.length} 项待处理 <ChevronRight size={13} /></button>}</div><button className="primary-button" disabled={action.disabled} aria-describedby="flow-action-explanation" onClick={clickAction}>{action.kind === 'dispatch' && dispatching ? <Loader2 size={16} className="spin" /> : action.kind === 'dispatch' ? <Play size={16} /> : action.kind === 'retry' ? <RefreshCcw size={16} /> : <ArrowRight size={16} />}{action.label}</button></div>
    </div>
    {run && !run.definition.requireClarification && snapshot?.workflows.at(-1)?.definition.requireClarification && !accepted && <div className="flow-upgrade-notice"><span>当前运行使用旧模板；新版已加入独立需求澄清。历史运行会保留。</span><button className="outline-button" disabled={isPending(`workflow:${snapshot.item.id}`)} onClick={() => perform(() => api('/workflow-runs', { workflowId: snapshot.workflows.at(-1)!.id }), '已创建包含需求澄清的新运行，历史记录保留', `workflow:${snapshot.item.id}`)}>启用含澄清的新流程</button></div>}
    <div className="flow-progress-section"><div><span>{progress.total ? `当前有效通过 ${progress.completed} / ${progress.total} 步` : '尚无步骤'}</span>{progress.percent !== undefined && <strong>{progress.percent}%</strong>}<span className="flow-delivery-state">{accepted ? '工作项已交付' : '工作项尚未交付'}</span></div>{progress.percent !== undefined && <div className="progress-track" role="progressbar" aria-label="当前有效通过步骤" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent} aria-valuetext={`当前有效通过 ${progress.completed} / ${progress.total} 步：执行已结束、门禁通过且版本有效，需人工接纳的步骤已接纳；${progress.awaitingAcceptance} 步待人工接纳，${progress.stale} 步上游已变更。百分比不代表交付。`}><span style={{ width: `${progress.percent}%` }} /></div>}{!!progress.stale && <p>{progress.stale} 步的上游依据已变更，有效通过计数随之回退。</p>}</div>
    {node && <section className="flow-current-body" aria-label="当前步骤的工作内容">
      {!accepted && !!reasons.length && <details className={`flow-conditions ${readiness.state === 'error' ? 'has-error' : ''}`} open={clientBlockers.length > 0 || readiness.state === 'error' || readiness.state === 'blocked'}><summary>运行条件 <span>{readiness.state === 'loading' ? '检查中' : readiness.state === 'error' ? '读取失败' : readiness.state === 'ready' ? clientBlockers.length ? '服务端满足 · 本地待处理' : '服务端满足' : '服务端条件不足'}</span></summary><ul>{reasons.map(reason => <li key={reason.reason}><span>{reason.reason}</span><small>{reason.sources.join(' · ')}</small></li>)}</ul><div className="flow-condition-actions">{(readiness.state === 'error' || readiness.state === 'blocked') && <button className="outline-button" onClick={() => setRetry(value => value + 1)}><RefreshCcw size={14} /> 重试检查</button>}{unsavedRequirements && <button className="outline-button" onClick={() => setTab('requirements')}>保存需求 / 处理冲突</button>}{snapshot?.project.guidanceError && <button className="outline-button" onClick={openSettings}>修复项目章程</button>}</div></details>}
      {node.type === 'clarify' && <div ref={clarification} className="flow-clarification"><ClarificationPanel session={session} target={override ? JSON.parse(override) : undefined} disabled={unsavedRequirements || !!snapshot?.project.guidanceError} /></div>}
      {action.kind !== 'dispatch' && !accepted && !active && !waiting && viewedRun?.state === 'active' && <div className="flow-secondary-dispatch"><span>{node.freshness === 'stale' ? '当前结果已过期，使用最新已保存依据创建新尝试。' : '需要继续此步骤时，运行条件仍须全部满足。'}</span><button className="outline-button" disabled={!canDispatch} onClick={() => void start()}>{dispatching ? <Loader2 size={14} className="spin" /> : <Play size={14} />}{node.type === 'human' ? '接纳候选代码' : node.execution === 'pending' ? '运行所选步骤' : '创建新尝试'}</button></div>}
      {outputArtifact && node.execution === 'completed' && action.kind !== 'artifact' && <button className="flow-result-link" onClick={openOutput}><FileCheck2 size={17} /><span>查看{logicalLabels[outputArtifact.logicalId] || outputArtifact.logicalId}<small>修订 {short(outputArtifact.currentRevisionId)} · 以选定修订的接纳状态为准</small></span><ArrowRight size={15} /></button>}
    </section>}
    <div className="flow-directory-heading"><div><h3>工程流程 <span>{run?.definition.nodes.length || 0} 个步骤</span></h3><p>分组仅用于浏览，执行顺序与依赖读取流程定义。</p></div><button className="text-button" disabled={accepted} onClick={openWorkflow}><Settings2 size={15} /> 编辑流程</button></div>
    <div className="flow-step-groups">{groups.map(group => { const hasProblem = group.nodes.some(value => value.freshness === 'stale' || value.gate === 'blocked' || ['failed', 'waiting_interaction', 'reconciling'].includes(value.execution)); const opened = groupOpen[`${run?.id}:${group.name}`] ?? (hasProblem || group.nodes.some(value => value.id === node?.id)); const count = group.nodes.filter(value => getStepStatus(value, run?.definition.nodes.find(d => d.id === value.nodeId)).effectivelyPassed).length; return <details className="flow-step-group" key={`${run?.id}:${group.name}`} open={opened} onToggle={event => { const isOpen = event.currentTarget.open; if (isOpen !== opened) setGroupOpen(value => ({ ...value, [`${run?.id}:${group.name}`]: isOpen })); }}><summary><ChevronDown size={16} /><strong>{group.name}</strong><span>有效通过 {count} / {group.nodes.length}</span>{hasProblem && <span className="flow-group-attention">需要处理</span>}</summary>{group.nodes.map(value => { const definition = run?.definition.nodes.find(d => d.id === value.nodeId), passed = getStepStatus(value, definition).effectivelyPassed; return <div className={`flow-step-row${value.id === node?.id ? ' selected' : ''}`} key={value.id}><button className="flow-stage-select" aria-pressed={value.id === node?.id} onClick={() => setSelectedNode(value.id)}><span className={`flow-stage-number${passed ? ' passed' : ''}`}>{passed ? <Check size={15} /> : ['starting', 'running'].includes(value.execution) ? <Loader2 size={15} className="spin" /> : String(run!.definition.nodes.findIndex(d => d.id === value.nodeId) + 1).padStart(2, '0')}</span><NodeIcon type={value.type} size={17} /><span>{value.name}</span><ChevronRight size={15} /></button><StepFacts node={value} definition={definition} compact /></div>; })}</details>; })}</div>
    <div className="flow-requirements-link"><FileText size={18} /><span>已保存需求 · 版本 {requirements?.number || 1}<small>{requirements?.documents.length || 0} 份文档{requirements?.request.trim() ? ' + 需求正文' : ''}{unsavedRequirements ? ' · 另有本地草稿，尚未供新执行使用' : ''}</small></span><button className="text-button" onClick={() => setTab('requirements')}>查看 / 编辑 <ArrowRight size={14} /></button></div>
    <div className="flow-footnote"><ShieldCheck size={15} /><span>工程门禁以真实产物版本、验证证据和复核结果为依据。</span></div>
  </ResizablePane>;
}
