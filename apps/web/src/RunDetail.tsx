import { t, useLocale } from './i18n.ts';
import { workflowText } from './workflowCopy.ts';
import { useEffect, useRef, useState } from 'react';
import { Activity, ChevronDown, CircleDot, Loader2, RefreshCcw, ShieldCheck, Square } from 'lucide-react';
import type { Attempt, ExecutionBinding, Interaction, TaskRun } from '../../../packages/domain/index.ts';
import type { ReviewReport } from '../../../packages/review-policy/index.ts';
import { api } from './api.ts';
import { Empty, fmt, labels, short, targetLabel, useWorkspace } from './context.tsx';
import { ClarificationHistory } from './ClarificationPanel.tsx';
import { StepFacts } from './StepFacts.tsx';
import { InteractionCard } from './RuntimeInteraction.tsx';
import { backendInfo } from './backendSelection.ts';
import { ExecutionFacts } from './ExecutionFacts.tsx';
import { VerificationRecovery } from './VerificationRecovery.tsx';
import './flow.css';

type Detail = Attempt & { bindings: ExecutionBinding[]; interactions: Interaction[]; tasks: TaskRun[]; verificationLive?: boolean };
export function RunDetail({ attemptId }: { attemptId: string }) {
  const locale = useLocale();
  const { snapshot, backend, perform, isPending } = useWorkspace();
  const [detail, setDetail] = useState<Detail>(), [error, setError] = useState(''), [loading, setLoading] = useState(false), [retry, setRetry] = useState(0);
  const currentId = useRef(attemptId);
  const summary = snapshot?.attempts.find(attempt => attempt.id === attemptId);
  const interactionVersion = snapshot?.interactions.filter(interaction => interaction.attemptId === attemptId).map(interaction => `${interaction.id}:${interaction.revision}`).join(',');
  useEffect(() => {
    if (!attemptId) return;
    let active = true;
    if (currentId.current !== attemptId) { setDetail(undefined); currentId.current = attemptId; }
    setLoading(true); setError('');
    void api<Detail>(`/attempts/${encodeURIComponent(attemptId)}`).then(value => { if (active && value.id === attemptId) setDetail(value); }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attemptId, summary?.revision, interactionVersion, retry, locale]);
  const attempt = detail?.id === attemptId ? detail : undefined;
  const attemptBackend = attempt ? backendInfo(backend, attempt.target.backend) : undefined;
  const canResume = attemptBackend?.capabilities?.canResume ?? attempt?.policy?.capabilities?.canResume;
  const node = snapshot?.nodes.find(node => node.id === attempt?.nodeRunId);
  const definition = snapshot?.runs.find(run => run.id === node?.workflowRunId)?.definition.nodes.find(definition => definition.id === node?.nodeId);
  const scope = `attempt:${attemptId}`, pending = snapshot?.item.status === 'accepted' || isPending(scope) || !!node && isPending(`node:${node.id}`);
  const control = (command: 'stop' | 'resume' | 'reconcile') => perform(async () => {
    await api(`/attempts/${attemptId}/${command}`, {});
    setRetry(value => value + 1);
  }, command === 'stop' ? t('停止请求已提交，以确认后的执行状态为准') : command === 'resume' ? t('恢复请求已提交，保留原执行身份链') : t('已提交原执行核对请求'), scope);
  if (!attemptId) return <section className="attempt-detail"><Empty icon={<Activity size={34} />} title={t("还没有运行记录")} description={t("每次尝试保留固定输入、模型目标与执行身份。")} /></section>;
  return <section className="attempt-detail" aria-label={t("运行详情")}>
    {loading && !attempt && <div className="reading-feedback" role="status"><Loader2 className="spin" size={24} /><p>{t("正在读取完整运行材料…")}</p></div>}
    {error && <div className="load-feedback" role="alert"><strong>{t("无法读取完整运行材料")}</strong><p>{t(error)}</p><button className="outline-button" onClick={() => setRetry(value => value + 1)}><RefreshCcw size={14} />{t("重新读取详情")}</button></div>}
    {attempt && <><div className="panel-heading"><div><h2>{node ? workflowText(node.name) : t('历史步骤')}<span>{t('尝试 {number}', { number: attempt.number })}</span></h2><p>{targetLabel(attempt.target)} · {fmt(attempt.startedAt)}{attempt.finishedAt ? ` — ${fmt(attempt.finishedAt)}` : ''}</p></div><span className={`badge ${attempt.execution}`}>{labels[attempt.execution]}</span></div>
      {node && <div className="run-step-facts"><span>{t("所属步骤当前状态")}</span><StepFacts node={node} definition={definition} /></div>}
      <ExecutionFacts attempt={attempt} />
      {attempt.verificationPending && attempt.verificationLive === false && <VerificationRecovery disabled={pending} onConfirm={reason => void perform(() => api(`/attempts/${attempt.id}/confirm-verification-stopped`, { expectedRevision: attempt.revision, reason }), t('验证进程确认已记录'), scope)} />}
      <div className="identity-list"><h3>{t("执行身份")}</h3>{attempt.bindings.map(binding => <div key={binding.id}><span>{binding.kind === 'resume' ? t('恢复绑定') : t('初始绑定')}</span><code title={JSON.stringify(binding.ref)}>session {short(binding.ref.sessionId)} / turn {short(binding.ref.turnId)} / run {short(binding.ref.runId)}</code></div>)}{!attempt.bindings.length && <p>{t("尚未取得执行身份，不能据此重复派发。")}</p>}</div>
      {attempt.requirementRevisionId && <div className="identity-list"><h3>{t("本次使用的需求")}</h3>{(() => { const source = snapshot?.requirements.history.find(revision => revision.id === attempt.requirementRevisionId); return <div><span>{t('版本 {version} · {count} 份文档', { version: source?.number ?? t('历史版本'), count: source?.documents.length ?? '—' })}{source?.id !== snapshot?.requirements.current.id ? t(' · 当前需求已更新') : ''}</span><code>{source?.contentHash || attempt.requirementRevisionId}</code></div>; })()}</div>}
      {attempt.guidance && <details className="context-details"><summary>{t("本次使用的项目章程")} <ChevronDown size={15} /></summary><div><span>{t("内容")} <code>{attempt.guidance.contentHash}</code>{attempt.guidance.contentHash !== snapshot?.project.guidance?.contentHash ? t(' · 当前章程已更新') : ''}</span>{attempt.guidance.files.map(file => <div key={file.name}><h4>{file.name}</h4><pre>{file.content}</pre></div>)}<h4>{t("补充工程规则")}</h4><pre>{attempt.guidance.rules}</pre></div></details>}
      {attempt.clarificationSessionId && (() => { const session = snapshot?.clarifications.find(session => session.id === attempt.clarificationSessionId); return session ? <div className="context-details"><ClarificationHistory session={session} /></div> : null; })()}
      {attempt.error && <div className="blocker-box"><CircleDot size={16} /><p>{t(attempt.error)}</p></div>}
      {attempt.controlError && attempt.controlError !== attempt.error && <div className="blocker-box"><CircleDot size={16} /><p>{t(attempt.controlError)}</p></div>}
      {attempt.reviewReport && <div className="review-reports" aria-label={t("双视角复核报告")}>{[...new Map([attempt, ...(snapshot?.attempts || []).filter(other => other.id !== attempt.id && other.reviewReport?.groupId === attempt.reviewReport?.groupId)].filter(other => other.reviewReport).map(other => [other.id, other])).values()].map(other => <ReviewCard key={other.id} report={other.reviewReport!} />)}</div>}
      <details className="context-details"><summary>{t("查看固定输入与上下文")} <ChevronDown size={15} /></summary><div><span>{t("输入哈希")} <code>{attempt.inputHash}</code></span>{attempt.inputs.map(input => <p key={`${input.logicalId}:${input.artifactRevisionId}`}>{input.logicalId} · {input.artifactRevisionId} · {input.contentHash}</p>)}<pre>{attempt.prompt}</pre></div></details>
      {attempt.output && <details className="context-details" open={!attempt.reviewReport}><summary>{t("阶段输出")} <ChevronDown size={15} /></summary><pre>{(() => { try { return JSON.stringify(JSON.parse(attempt.output), null, 2); } catch { return attempt.output; } })()}</pre></details>}
      {attempt.interactions.filter(interaction => (snapshot?.interactions.find(current => current.id === interaction.id) || interaction).state === 'pending').map(interaction => <InteractionCard key={interaction.id} interaction={interaction} />)}
      <div className="run-actions"><button className="outline-button" disabled={pending || !!attempt.stopRequestedAt || !['running', 'starting', 'waiting_interaction', 'reconciling'].includes(attempt.execution)} onClick={() => void control('stop')}><Square size={14} />{attempt.stopRequestedAt && !attempt.terminalConfirmedAt ? t('正在请求停止') : pending ? t('正在提交控制请求…') : t('停止本次执行')}</button><button className="outline-button" disabled={pending || !['reconciling', 'failed', 'cancelled'].includes(attempt.execution)} onClick={() => void control('reconcile')}><RefreshCcw size={14} />{t("核对原执行")}</button><button className="outline-button" disabled={pending || canResume !== true || !['reconciling', 'failed', 'cancelled'].includes(attempt.execution)} onClick={() => void control('resume')}>{t("恢复原执行")}</button></div>
      {canResume === false && <p className="run-control-note">{t('{backend} 不支持恢复原执行；可先核对结果，再创建新尝试。', { backend: attemptBackend?.name || attempt.target.backend })}</p>}
      {attempt.execution === 'reconciling' && <p className="run-control-note" role="status">{t("原执行状态尚未确认。请先核对身份，避免创建重复执行。")}</p>}
      {loading && <p className="run-control-note" role="status">{t("正在更新运行详情…")}</p>}
    </>}
  </section>;
}
function ReviewCard({ report }: { report: ReviewReport }) {
  const label = { pass: t('通过'), revise: t('需要修订'), inconclusive: t('证据不足') }[report.verdict];
  return <article className={`review-report ${report.verdict}`}><header><ShieldCheck size={17} /><h3>{report.perspective === 'coverage' ? t('需求覆盖检查') : t('反例与失败路径检查')}</h3><span>{label}</span></header><p>{report.summary}</p><ol>{report.checks.map(check => <li key={check.criterionId}><div><strong>{check.criterionId}</strong><span>{check.result === 'pass' ? t('通过') : check.result === 'fail' ? t('失败') : t('待确认')}</span></div><p>{check.explanation}</p><details><summary>{t("证据与反例")}</summary>{check.evidence.map((evidence, index) => <blockquote key={index}><small>{evidence.sourceId}</small>{evidence.quote}</blockquote>)}<p><strong>{t("反例：")}</strong>{check.counterexample.scenario}</p><p>{check.counterexample.outcome === 'ruled_out' ? t('已排除') : check.counterexample.outcome === 'reproduced' ? t('已复现') : t('尚未核验')} · {check.counterexample.reason}</p></details></li>)}</ol>{!!report.resolutions.length && <details><summary>{t('历史问题复验 · {count}', { count: report.resolutions.length })}</summary>{report.resolutions.map(resolution => <div key={resolution.findingId}><strong>{resolution.findingId} · {resolution.result === 'fixed' ? t('已修复') : resolution.result === 'open' ? t('未解决') : t('待确认')}</strong><p>{resolution.explanation}</p>{resolution.evidence.map((evidence, index) => <blockquote key={index}>{evidence.sourceId} · {evidence.quote}</blockquote>)}</div>)}</details>}<small>{t('复核批次 {group} · 两份独立证据共同决定门禁', { group: short(report.groupId) })}</small></article>;
}
