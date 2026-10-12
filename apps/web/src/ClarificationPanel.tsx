import { useEffect, useRef, useState } from 'react';
import { CircleHelp, FileCheck2, RefreshCcw, Send } from 'lucide-react';
import type { ClarificationSession, ModelTarget } from '../../../packages/domain/index.ts';
import { api } from './api.ts';
import { useWorkspace } from './context.tsx';

export function ClarificationPanel({ session, target, disabled = false }: { session?: ClarificationSession; target?: ModelTarget; disabled?: boolean }) {
  const { snapshot, busy, perform, setTab, setSelectedArtifact } = useWorkspace();
  if (!session) return <div className="clarification-intro"><CircleHelp size={20} /><div><strong>先澄清，再设计</strong><p>运行此步骤检查规格中的关键未知信息。有问题时在这里回答；答复会写入新的规格版本。</p></div></div>;
  if (session.state === 'stale') return <div className="clarification-intro"><CircleHelp size={20} /><div><strong>旧问答依据已更新</strong><p>请基于当前规格重新运行澄清。历史问题和本地答复草稿保留在下方。</p><ClarificationHistory session={session} /></div></div>;
  if (session.state === 'completed') return <div className="clarification-intro completed"><FileCheck2 size={20} /><div><strong>需求澄清已完成</strong><p>{session.questions.length ? `${session.questions.length} 项答复已记录到修订后的规格，下一步复核此版本。` : '已检查规格，当前无需额外提问。下一步复核此版本。'}</p></div><button className="outline-button" onClick={() => { const spec = snapshot?.artifacts.find(a => a.logicalId === 'spec'); if (spec) setSelectedArtifact(spec.id); setTab('artifacts'); }}>查看修订规格</button></div>;
  if (session.state === 'analyzing') return <div className="clarification-intro"><CircleHelp size={20} /><div><strong>正在分析澄清依据</strong><p>分析规格和已提交的答复，检查是否还需要确认关键决策。</p></div></div>;
  return <ClarificationQuestions key={session.id} session={session} target={target} disabled={disabled} />;
}
export function ClarificationHistory({ session }: { session: ClarificationSession }) {
  const { snapshot } = useWorkspace();
  let drafts: Record<string, string> = snapshot?.clarificationDrafts.find(d => d.sessionId === session.id)?.answers || {}; try { drafts = JSON.parse(localStorage.getItem(`specflow-clarification-answers-${session.id}`) || 'null') || drafts; } catch {}
  return <details className="clarification-answer-history"><summary>查看历史问答{session.state === 'stale' ? '与答复草稿' : ''}</summary>{session.questions.map(q => <div key={q.id}><strong>{q.id} · {q.question}</strong><p>{q.answer || drafts[q.id] || '尚未记录答复'}</p></div>)}</details>;
}
function ClarificationQuestions({ session, target, disabled }: { session: ClarificationSession; target?: ModelTarget; disabled: boolean }) {
  const { busy, perform, snapshot } = useWorkspace();
  const serverDraft = snapshot?.clarificationDrafts.find(d => d.sessionId === session.id);
  const storageKey = `specflow-clarification-answers-${session.id}`;
  const [answers, setAnswers] = useState<Record<string, string>>(() => { try { return JSON.parse(localStorage.getItem(storageKey) || 'null') || serverDraft?.answers || {}; } catch { return serverDraft?.answers || {}; } });
  const draftRevision = useRef(serverDraft?.revision || 0), inFlight = useRef(false), queued = useRef(false), currentAnswers = useRef(answers), mounted = useRef(true);
  currentAnswers.current = answers;
  const [draftStatus, setDraftStatus] = useState(serverDraft ? '答复草稿已保存到工程记录' : ''), [draftSaving, setDraftSaving] = useState(false), [draftConflict, setDraftConflict] = useState(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const persist = async () => {
    if (inFlight.current) { queued.current = true; return; }
    inFlight.current = true; setDraftSaving(true);
    try {
      const result = await api(`/clarifications/${session.id}/draft`, { expectedRevision: draftRevision.current, answers: currentAnswers.current }); draftRevision.current = result.revision;
      if (mounted.current) { setDraftStatus('答复草稿已保存到工程记录'); setDraftConflict(false); }
    } catch (error) { if (mounted.current) { setDraftStatus((error as Error).message + '；当前页面草稿仍保留'); setDraftConflict(true); } }
    finally { inFlight.current = false; if (mounted.current) { setDraftSaving(false); if (queued.current) { queued.current = false; void persist(); } } }
  };
  useEffect(() => {
    if (!Object.keys(answers).length || JSON.stringify(answers) === JSON.stringify(serverDraft?.answers || {}) || draftConflict) return;
    setDraftStatus('正在保存答复草稿…'); const timer = setTimeout(() => void persist(), 400); return () => clearTimeout(timer);
  }, [answers, session.id]);
  const pending = session.questions.filter(q => !q.answer);
  const change = (id: string, value: string) => { const next = { ...answers, [id]: value }; setAnswers(next); try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {} };
  return <section className="clarification-workbench" aria-label="需求澄清问答"><div className="clarification-heading"><div><span className="eyebrow">CLARIFY</span><h3>确认影响设计的关键问题</h3><p>本轮 {pending.length} 个问题 · 会话累计 {session.questions.length} / 5</p></div><CircleHelp size={24} /></div>
    {session.questions.filter(q => q.answer).map(q => <details className="clarification-answer-history" key={q.id}><summary>{q.id} · {q.question} · 已答复</summary><p>{q.answer}</p></details>)}
    {pending.map((q, index) => <div className="clarification-question" key={q.id}><div className="clarification-question-title"><span>{String(index + 1).padStart(2, '0')}</span><h4>{q.question}</h4></div><p>{q.reason}</p>{!!q.options.length && <div className="clarification-options">{q.options.map(option => <button key={option} className={answers[q.id] === option ? 'selected' : ''} disabled={busy} onClick={() => change(q.id, option)}>{option}</button>)}</div>}<label className="field">你的答复<textarea aria-label={`澄清答复 ${q.id}`} rows={3} maxLength={4000} value={answers[q.id] || ''} disabled={busy} onChange={e => change(q.id, e.target.value)} placeholder="选择建议答复，或写下你的决定。不确定时说明目前未知的信息。" /></label></div>)}
    {disabled && <p className="form-note">请先保存需求草稿或修复项目章程读取问题，再提交澄清答复。</p>}
    {draftStatus && <p className="requirements-hint" role="status">{draftStatus}{draftConflict && serverDraft && <button className="text-button" onClick={() => { draftRevision.current = serverDraft.revision; setDraftConflict(false); void persist(); }}>已比较，保存我的草稿</button>}</p>}
    {draftConflict && serverDraft && <details className="clarification-answer-history"><summary>查看已保存的答复草稿</summary>{pending.map(q => <p key={q.id}>{q.question}：{serverDraft.answers[q.id] || '未填写'}</p>)}</details>}
    <div className="clarification-actions"><button className="text-button" disabled={busy || draftSaving} onClick={() => perform(() => api(`/clarifications/${session.id}/restart`, { expectedRevision: session.revision }), '本轮问答已保留为历史，可以重新运行需求澄清')}><RefreshCcw size={14} /> 重新分析</button><button className="primary-button" disabled={busy || disabled || draftSaving || pending.some(q => !answers[q.id]?.trim())} onClick={() => perform(async () => { await api(`/clarifications/${session.id}/answers`, { expectedRevision: session.revision, answers: pending.map(q => ({ questionId: q.id, answer: answers[q.id] })), ...(target ? { target } : {}) }); try { localStorage.removeItem(storageKey); } catch {} }, '答复已记录，正在继续澄清并修订规格')}><Send size={15} /> 提交答复并继续澄清</button></div>
  </section>;
}
