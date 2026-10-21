import { t } from './i18n.ts';
import { useEffect, useRef, useState } from 'react';
import { CircleHelp, FileCheck2, RefreshCcw, Send } from 'lucide-react';
import type { ClarificationSession, ModelTarget } from '../../../packages/domain/index.ts';
import { api } from './api.ts';
import { useWorkspace } from './context.tsx';
import { ClarificationDraftQueue } from './clarification-draft-queue.ts';
const sessionAnswers = new Map<string, Record<string, string>>();
const draftQueue = new ClarificationDraftQueue((sessionId, expectedRevision, answers) => api(`/clarifications/${sessionId}/draft`, { expectedRevision, answers }));
const notifyDraft = (sessionId: string) => window.dispatchEvent(new CustomEvent('specflow-draft-change', { detail: { sessionId } }));

export function ClarificationPanel({ session, target, disabled = false }: { session?: ClarificationSession; target?: ModelTarget; disabled?: boolean }) {
  const { snapshot, setTab, setSelectedArtifact } = useWorkspace();
  if (!session) return <div className="clarification-intro"><CircleHelp size={20} /><div><strong>{t("先澄清，再设计")}</strong><p>{t("运行此步骤检查规格中的关键未知信息。有问题时在这里回答；答复会写入新的规格版本。")}</p></div></div>;
  if (session.state === 'stale') return <div className="clarification-intro"><CircleHelp size={20} /><div><strong>{t("旧问答依据已更新")}</strong><p>{t("请基于当前规格重新运行澄清。历史问题和本地答复草稿保留在下方。")}</p><ClarificationHistory session={session} /></div></div>;
  if (session.state === 'completed') return <div className="clarification-intro completed"><FileCheck2 size={20} /><div><strong>{t("需求澄清已完成")}</strong><p>{session.questions.length ? t("{length} 项答复已记录到修订后的规格，下一步复核此版本。", { length: session.questions.length }) : t('已检查规格，当前无需额外提问。下一步复核此版本。')}</p></div><button className="outline-button" onClick={() => { const spec = snapshot?.artifacts.find(a => a.logicalId === 'spec'); if (spec) setSelectedArtifact(spec.id); setTab('artifacts'); }}>{t("查看修订规格")}</button></div>;
  if (session.state === 'analyzing') return <div className="clarification-intro"><CircleHelp size={20} /><div><strong>{t("正在分析澄清依据")}</strong><p>{t("分析规格和已提交的答复，检查是否还需要确认关键决策。")}</p></div></div>;
  return <ClarificationQuestions key={session.id} session={session} target={target} disabled={disabled} />;
}
export function ClarificationHistory({ session }: { session: ClarificationSession }) {
  const { snapshot } = useWorkspace();
  let drafts: Record<string, string> = sessionAnswers.get(session.id) || snapshot?.clarificationDrafts.find(d => d.sessionId === session.id)?.answers || {}; try { drafts = sessionAnswers.get(session.id) || JSON.parse(localStorage.getItem(`specflow-clarification-answers-${session.id}`) || 'null') || drafts; } catch {}
  return <details className="clarification-answer-history"><summary>{t(session.state === 'stale' ? '查看历史问答与答复草稿' : '查看历史问答')}</summary>{session.questions.map(q => <div key={q.id}><strong>{q.id} · {q.question}</strong><p>{q.answer || drafts[q.id] || t('尚未记录答复')}</p></div>)}</details>;
}
function ClarificationQuestions({ session, target, disabled }: { session: ClarificationSession; target?: ModelTarget; disabled: boolean }) {
  const { isPending, perform, snapshot } = useWorkspace();
  const scope = `clarification:${session.id}`, busy = isPending(scope), busyRef = useRef(busy); busyRef.current = busy;
  const serverDraft = snapshot?.clarificationDrafts.find(d => d.sessionId === session.id);
  const storageKey = `specflow-clarification-answers-${session.id}`;
  const [answers, setAnswers] = useState<Record<string, string>>(() => { if (sessionAnswers.has(session.id)) return sessionAnswers.get(session.id)!; try { return JSON.parse(localStorage.getItem(storageKey) || 'null') || serverDraft?.answers || {}; } catch { return serverDraft?.answers || {}; } });
  const [storageError, setStorageError] = useState(false);
  const currentAnswers = useRef(answers), mounted = useRef(true), flushOnLeave = useRef<() => void>(() => undefined);
  currentAnswers.current = answers;
  const observedDraft = { revision: serverDraft?.revision || 0, answers: serverDraft?.answers || {} };
  const [draftStatus, setDraftStatus] = useState(serverDraft ? '答复草稿已保存到工程记录' : ''), [draftSaving, setDraftSaving] = useState(() => draftQueue.state(session.id).saving), [draftConflict, setDraftConflict] = useState(() => !!draftQueue.state(session.id).error);
  useEffect(() => {
    const update = () => { const state = draftQueue.state(session.id); setDraftSaving(state.saving); if (state.error) { setDraftConflict(true); setDraftStatus((state.error as Error).message); } else if (!state.saving && state.confirmed) setDraftStatus('答复草稿已保存到工程记录'); };
    const unsubscribe = draftQueue.subscribe(session.id, observedDraft, update); update(); return unsubscribe;
  }, [session.id]);
  useEffect(() => { mounted.current = true; notifyDraft(session.id); return () => { mounted.current = false; flushOnLeave.current(); notifyDraft(session.id); }; }, []);
  const persist = async () => {
    if (busyRef.current) return;
    try {
      const submittedAnswers = { ...currentAnswers.current };
      await draftQueue.save(session.id, observedDraft, submittedAnswers);
      if (mounted.current) { setDraftStatus('答复草稿已保存到工程记录'); setDraftConflict(false); }
    } catch (error) { if (mounted.current) { setDraftStatus((error as Error).message); setDraftConflict(true); } }
  };
  flushOnLeave.current = () => { if (!draftConflict && Object.keys(currentAnswers.current).length && !draftQueue.isSaved(session.id, observedDraft, currentAnswers.current)) void persist(); };
  useEffect(() => {
    if (!Object.keys(answers).length || draftQueue.isSaved(session.id, observedDraft, answers) || draftConflict) return;
    setDraftStatus('正在保存答复草稿…'); const timer = setTimeout(() => void persist(), 400); return () => clearTimeout(timer);
  }, [answers, session.id, serverDraft?.revision]);
  const pending = session.questions.filter(q => !q.answer);
  const change = (id: string, value: string) => { const next = { ...answers, [id]: value }; setAnswers(next); sessionAnswers.set(session.id, next); try { localStorage.setItem(storageKey, JSON.stringify(next)); setStorageError(false); } catch { setStorageError(true); } notifyDraft(session.id); };
  const canSubmit = !busy && !disabled && !draftSaving && !draftConflict && !pending.some(q => !answers[q.id]?.trim());
  const submit = () => perform(async () => { await api(`/clarifications/${session.id}/answers`, { expectedRevision: session.revision, answers: pending.map(q => ({ questionId: q.id, answer: answers[q.id] })), ...(target ? { target } : {}) }); sessionAnswers.delete(session.id); try { localStorage.removeItem(storageKey); } catch {} notifyDraft(session.id); }, t('答复已记录，正在继续澄清并修订规格'), scope);
  return <section className="clarification-workbench" aria-label={t("需求澄清问答")} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); if (canSubmit) void submit(); } }}><div className="clarification-heading"><div><span className="eyebrow">CLARIFY</span><h3>{t("确认影响设计的关键问题")}</h3><p>{t('本轮 {count} 个问题 · 会话累计 {total} / 5', { count: pending.length, total: session.questions.length })}</p></div><CircleHelp size={24} /></div>
    {session.questions.filter(q => q.answer).map(q => <details className="clarification-answer-history" key={q.id}><summary>{q.id} · {q.question} {t("· 已答复")}</summary><p>{q.answer}</p></details>)}
    {pending.map((q, index) => <div className="clarification-question" key={q.id}><div className="clarification-question-title"><span>{String(index + 1).padStart(2, '0')}</span><h4>{q.question}</h4></div><p>{q.reason}</p>{!!q.options.length && <div className="clarification-options">{q.options.map(option => <button key={option} className={answers[q.id] === option ? 'selected' : ''} disabled={busy} onClick={() => change(q.id, option)}>{option}</button>)}</div>}<label className="field">{t("你的答复")}<textarea aria-label={t("澄清答复 {id}", { id: q.id })} rows={3} maxLength={4000} value={answers[q.id] || ''} disabled={busy} onChange={e => change(q.id, e.target.value)} placeholder={t("选择建议答复，或写下你的决定。不确定时说明目前未知的信息。")} /></label></div>)}
    {disabled && <p className="form-note">{t("请先保存需求草稿或修复项目章程读取问题，再提交澄清答复。")}</p>}
    {storageError && <p className="form-note" role="status">{t("浏览器存储不可用，未同步的答复仅保留在当前窗口。请等待草稿同步到工程记录后再关闭窗口。")}</p>}
    {draftStatus && <p className="requirements-hint" role="status">{t(draftStatus)}{draftConflict && t('；当前页面草稿仍保留')}{draftConflict && serverDraft && <button className="text-button" disabled={draftSaving} onClick={() => { draftQueue.acknowledge(session.id, observedDraft); setDraftConflict(false); void persist(); }}>{t("已比较，保存我的草稿")}</button>}</p>}
    {draftConflict && serverDraft && <details className="clarification-answer-history"><summary>{t("查看已保存的答复草稿")}</summary>{pending.map(q => <p key={q.id}>{q.question}{t('：')}{serverDraft.answers[q.id] || t('未填写')}</p>)}</details>}
    <div className="clarification-actions"><button className="text-button" disabled={busy || draftSaving} onClick={() => perform(() => api(`/clarifications/${session.id}/restart`, { expectedRevision: session.revision }), t('本轮问答已保留为历史，可以重新运行需求澄清'), scope)}><RefreshCcw size={14} /> {t("重新分析")}</button><button className="primary-button" disabled={!canSubmit} onClick={submit}><Send size={15} /> {t("提交答复并继续澄清")}</button></div>
  </section>;
}
