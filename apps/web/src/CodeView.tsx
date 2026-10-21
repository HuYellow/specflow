import { getLocale, t, useLocale } from './i18n.ts';
import { useEffect, useMemo, useState } from 'react';
import { Check, CheckCircle2, CircleDot, GitBranch, GitCompareArrows, ListChecks, Loader2, RefreshCcw, ShieldCheck } from 'lucide-react';
import type { AcceptancePrecheck, CandidateReviewDiff, ReviewFile, ReviewFileChunk } from '../../../packages/ui-contracts/index.ts';
import { api } from './api.ts';
import { Empty, fmt, labels, short, useWorkspace } from './context.tsx';
import { DiffRows } from './DiffView.tsx';
import { countChanges, parseUnifiedDiff, type ReviewLine } from './review-model.ts';
import './review.css';

const fileLabels: Record<ReviewFile['status'], string> = { added: '新增', untracked: '未跟踪新增', modified: '修改', deleted: '删除', renamed: '重命名', typechanged: '类型变更' };
function fileLines(file: ReviewFile): ReviewLine[] {
  if (file.patch) return parseUnifiedDiff(file.patch).flatMap(file => file.hunks.flatMap(hunk => hunk.lines));
  if ((file.status === 'added' || file.status === 'untracked') && file.content) { const lines = file.content.split('\n'); if (lines.at(-1) === '') lines.pop(); return lines.map((text, index) => ({ kind: 'added', text, newLine: index + 1 })); }
  return [];
}

function FileReview({ candidateId, candidateHash, file, split, expanded, onExpand }: { candidateId: string; candidateHash: string; file: ReviewFile; split: boolean; expanded: boolean; onExpand(): void }) {
  const parsed = useMemo(() => file.patch ? parseUnifiedDiff(file.patch) : [], [file.patch]);
  const stats = useMemo(() => countChanges(fileLines(file)), [file]);
  const [source, setSource] = useState<{ side: 'candidate' | 'baseline'; content: string; nextOffset?: number; total: number; returned: number; hash?: string; complete: boolean }>();
  const [loading, setLoading] = useState(false), [error, setError] = useState('');
  async function readSource(side: 'candidate' | 'baseline', append = false) {
    if (loading) return;
    const offset = append && source?.side === side ? source.nextOffset || 0 : 0;
    setLoading(true); setError('');
    try {
      const chunk = await api<ReviewFileChunk>(`/candidates/${encodeURIComponent(candidateId)}/review-file?path=${encodeURIComponent(file.path)}&side=${side}&offset=${offset}&limit=65536`);
      const expectedHash = side === 'candidate' ? file.contentHash : file.baselineContentHash;
      if (chunk.candidateHash !== candidateHash || (expectedHash && expectedHash !== chunk.contentHash) || (append && source?.hash !== chunk.contentHash) || chunk.offset !== offset || chunk.path !== file.path || chunk.side !== side) throw new Error(t("候选或文件已变更，请重新载入差异，避免混用不同版本。"));
      if (chunk.binary || chunk.content === undefined) throw new Error(chunk.reason || t("此文件不提供文本正文。"));
      setSource({ side, content: (append ? source?.content || '' : '') + chunk.content, nextOffset: chunk.nextOffset, total: chunk.totalBytes, returned: offset + chunk.returnedBytes, hash: chunk.contentHash, complete: !chunk.truncated });
    } catch (error) { setError(error instanceof Error ? error.message : t("无法读取正文，请重试。")); }
    finally { setLoading(false); }
  }
  return <section className="review-file"><button className="review-file-heading" onClick={onExpand} aria-expanded={expanded}><span aria-hidden="true">{expanded ? '▾' : '▸'}</span><span className="review-file-path">{file.oldPath && file.oldPath !== file.path && <small>{file.oldPath} → </small>}<strong>{file.path}</strong></span><span className="badge">{t(fileLabels[file.status])}</span><span className="review-stat">{file.binary ? t("二进制") : `+${stats.added} / −${stats.removed}`}</span></button>{expanded && <div className="review-file-body">
    <div className="review-file-meta"><span>{file.mediaType} · {file.size.toLocaleString(getLocale())}  {t("字节")}{file.baselineSize ? t(" · 原 {value0} 字节", { value0: file.baselineSize.toLocaleString(getLocale()) }) : ''}</span><span>{t("原 SHA-256")} <code title={file.baselineContentHash}>{short(file.baselineContentHash)}</code>  {t("→ 新")} <code title={file.contentHash}>{short(file.contentHash)}</code></span></div>
    {file.binary ? <div className="binary-notice"><strong>{t("二进制文件")}</strong><p>{t("正文不作文本解释。请依据文件路径、大小和 SHA-256 核对变更。")}</p><p>{t("原 SHA-256：")}<code>{file.baselineContentHash || t("无基线文件")}</code></p><p>{t("新 SHA-256：")}<code>{file.contentHash || t("文件已删除")}</code></p>{file.reason && <p>{t(file.reason)}</p>}</div> : <>
      {(file.truncated || file.patchTruncated) && <div className="review-incomplete" role="status"><strong>{t("当前材料未完整显示")}</strong><p>{file.reason ? t(file.reason) : t("文件或补丁超过首批显示大小。")}  {t("已返回")} {file.returnedBytes.toLocaleString(getLocale())} / {file.totalBytes.toLocaleString(getLocale())}  {t("字节。")}{file.patchTruncated && t("补丁已截断，完整正文可在下方分块读取。")}  {t("增删统计仅覆盖已显示的差异。")}</p></div>}
      {parsed.some(entry => entry.hunks.length) ? parsed.flatMap((entry, index) => entry.hunks.map((hunk, hunkIndex) => <div className="review-hunk" key={`${index}-${hunkIndex}`}><div className="hunk-heading">{hunk.header}</div><DiffRows lines={hunk.lines} split={split} /></div>)) : (file.status === 'added' || file.status === 'untracked') && file.content !== undefined ? <DiffRows lines={fileLines(file)} split={split} /> : <p className="quiet-note">{file.status === 'renamed' ? t("文件路径已变更；内容差异见正文。") : t("此文件没有可显示的文本 hunk，可读取原文核对。")}</p>}
      <div className="source-read-actions"><button className="outline-button" disabled={loading || file.status === 'deleted'} onClick={() => readSource('candidate')}>{t("读取候选正文")}</button><button className="outline-button" disabled={loading || file.status === 'added' || file.status === 'untracked'} onClick={() => readSource('baseline')}>{t("读取基线正文")}</button>{loading && <span role="status"><Loader2 size={14} className="spin" />  {t("正在读取…")}</span>}</div>
      {error && <p className="review-incomplete" role="alert">{t(error)}</p>}
      {source && <div className="review-source"><div className="review-toolbar"><span>{source.side === 'candidate' ? t("候选") : t("基线")} {t("完整正文 · SHA-256")} <code title={source.hash}>{short(source.hash)}</code></span><span>{source.returned.toLocaleString(getLocale())} / {source.total.toLocaleString(getLocale())}  {t("字节 ·")} {source.complete ? t("已完整读取") : t("分块读取中")}</span></div><pre>{source.content}</pre>{source.nextOffset !== undefined && <button className="outline-button" disabled={loading} onClick={() => readSource(source.side, true)}>{t("继续读取下一块")}</button>}</div>}
    </>}
  </div>}</section>;
}

export function CodeView() {
  const locale = useLocale();
  const { snapshot, isPending, perform } = useWorkspace(); const candidate = snapshot?.candidates.at(-1);
  const acceptedCode = candidate?.status === 'accepted' || snapshot?.item.status === 'accepted';
  const scope = `candidate:${candidate?.id}`, busy = isPending(scope);
  const [diffState, setDiff] = useState<CandidateReviewDiff>();
  const diff = diffState?.candidateId === candidate?.id ? diffState : undefined;
  const [diffStatus, setDiffStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [diffError, setDiffError] = useState(''), [retry, setRetry] = useState(0);
  const [split, setSplit] = useState(false), [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [precheckState, setPrecheck] = useState<AcceptancePrecheck>(), [precheckError, setPrecheckError] = useState(''), [precheckLoading, setPrecheckLoading] = useState(false), [precheckRetry, setPrecheckRetry] = useState(0);
  const precheck = precheckState?.candidateId === candidate?.id ? precheckState : undefined;
  const [waiver, setWaiver] = useState<{ id: string; reason: string }>();
  useEffect(() => {
    let current = true;
    setDiff(undefined); setDiffError(''); setDiffStatus('loading'); setExpandedFiles(new Set());
    if (candidate) api<CandidateReviewDiff>(`/candidates/${encodeURIComponent(candidate.id)}/review-diff`).then(result => {
      if (current) { setDiff(result); setExpandedFiles(new Set(result.files.slice(0, 1).map(file => file.path))); setDiffStatus('ready'); }
    }).catch(error => { if (current) { setDiffError(error.message); setDiffStatus('error'); } });
    else setDiffStatus('ready');
    return () => { current = false; };
  }, [candidate?.id, candidate?.revision, retry, locale]);
  useEffect(() => {
    let current = true; setPrecheck(undefined); setPrecheckError('');
    if (!candidate || acceptedCode) { setPrecheckLoading(false); return; }
    setPrecheckLoading(true);
    void api<AcceptancePrecheck>(`/code-candidates/${encodeURIComponent(candidate.id)}/acceptance-precheck`).then(result => { if (current) setPrecheck(result); }).catch(error => { if (current) setPrecheckError(error.message); }).finally(() => { if (current) setPrecheckLoading(false); });
    return () => { current = false; };
  }, [candidate?.id, candidate?.revision, acceptedCode, snapshot?.item.revision, snapshot?.evidence, snapshot?.findings, precheckRetry, locale]);
  const stats = useMemo(() => countChanges(diff?.files.flatMap(fileLines) || []), [diff]);
  const evidence = snapshot?.evidence.filter(e => e.candidateId === candidate?.id).slice().reverse() || [];
  const openFindings = snapshot?.findings.filter(f => f.status === 'open') || [];
  const hashMismatch = !!diff && !!precheck?.candidateHash && diff.candidateHash !== precheck.candidateHash;
  return <div className="code-layout"><section className="code-panel"><div className="panel-heading"><div><h2>{acceptedCode ? t("已接纳代码") : t("候选代码")}</h2><p>{acceptedCode ? t("查看已接纳的代码差异、独立复核与验证证据。") : t("检查文件与真实源码差异，再依据同一版本的证据接纳。")}</p></div>{candidate && <span className={`badge ${candidate.status}`}>{candidate.status === 'accepted' ? t("已接纳") : t("候选")}</span>}</div>
    {!candidate ? <Empty icon={<GitCompareArrows size={36} />} title={t("代码改动将在这里汇集")} description={t("先完成需求、设计和任务接纳，再运行代码实现。")} /> : <><div className="candidate-info"><GitBranch size={16} /><code>{candidate.branch}</code><span className="diff-stat">{diffStatus === 'ready' ? `+${stats.added} / −${stats.removed}` : t("补丁尚未读取")}</span><span>{t("基线")} <code title={diff?.baselineHash || candidate.baseCommit}>{short(diff?.baselineHash || candidate.baseCommit)}</code></span>{diff && <span>{t("候选树")} <code title={diff.candidateHash}>{short(diff.candidateHash)}</code></span>}</div>
      {diffStatus === 'loading' && <p className="quiet-note" role="status"><Loader2 size={16} className="spin" />  {t("正在读取差异…")}</p>}
      {diffStatus === 'error' && <div className="load-feedback" role="alert"><strong>{t("无法读取差异")}</strong><p>{t(diffError)}</p><button className="outline-button" onClick={() => setRetry(value => value + 1)}><RefreshCcw size={14} />  {t("重试")}</button></div>}
      {diff && <><div className="review-toolbar"><span>{t('{count} 个文件', { count: diff.files.length })} · {diff.complete ? t("材料已完整返回") : t("部分材料需继续读取")}</span><div role="group" aria-label={t("代码差异显示方式")}><button className={`view-toggle ${!split ? 'active' : ''}`} aria-pressed={!split} onClick={() => setSplit(false)}>{t("统一")}</button><button className={`view-toggle ${split ? 'active' : ''}`} aria-pressed={split} onClick={() => setSplit(true)}>{t("分屏")}</button></div><button className="text-button" onClick={() => setExpandedFiles(expandedFiles.size ? new Set() : new Set(diff.files.map(file => file.path)))}>{expandedFiles.size ? t("折叠全部") : t("展开全部")}</button><button className="icon-button" aria-label={t("重新载入差异")} onClick={() => setRetry(value => value + 1)}><RefreshCcw size={14} /></button></div>{!diff.files.length && <p className="quiet-note">{t("此候选没有代码差异。")}</p>}{diff.files.map(file => <FileReview key={`${candidate.id}:${diff.candidateHash}:${file.path}`} candidateId={candidate.id} candidateHash={diff.candidateHash} file={file} split={split} expanded={expandedFiles.has(file.path)} onExpand={() => setExpandedFiles(current => { const next = new Set(current); next.has(file.path) ? next.delete(file.path) : next.add(file.path); return next; })} />)}</>}
      {acceptedCode ? <div className="acceptance-precheck" role="status" aria-label={t("代码已接纳")}><div className="review-toolbar"><strong>{t("代码已接纳")}</strong></div><p>{t("本候选已接纳，相关代码差异、独立复核与验证证据保留供查阅。后续需求请新建工作项。")}</p><small>{t("接纳记录更新于")} {fmt(candidate.updatedAt)}  {t("· 代码")} {short(candidate.contentHash)}  {t("· 基线")} {short(candidate.baseCommit)}</small></div> : <div className="acceptance-precheck"><div className="review-toolbar"><strong>{t("接纳条件预检")}</strong><button className="text-button" disabled={precheckLoading} onClick={() => setPrecheckRetry(value => value + 1)}><RefreshCcw size={13} />  {t("重新检查")}</button></div>{precheckLoading ? <p role="status">{t("正在检查当前版本与证据…")}</p> : precheckError ? <p role="alert">{t("预检读取失败：")}{t(precheckError)}</p> : precheck && <><p>{precheck.ready ? t("截至检查时刻，服务端未发现接纳阻塞。") : t("当前存在以下接纳阻塞：")}</p>{precheck.blockers.length > 0 && <ul>{precheck.blockers.map(blocker => <li key={`${blocker.code}-${blocker.message}`}>{t(blocker.message)}</li>)}</ul>}<small>{t("检查于")} {fmt(precheck.checkedAt)}  {t("· 树")} {short(precheck.candidateHash)}  {t("· 基线")} {short(precheck.baselineHash)}</small></>}{hashMismatch && <p role="alert">{t("预检与已显示差异的候选树不同，请重新载入差异并检查。")}</p>}<p className="precheck-caveat">{t("预检只说明检查时刻的条件；接纳时服务会再次检查版本、工作区、测试与独立复核证据。")}</p></div>}
      <div className="document-footer"><span><ShieldCheck size={14} />{acceptedCode ? t("代码已接纳 · 接纳与验证证据已保留") : !!candidate.contentHash && candidate.reviewedHash === candidate.contentHash ? t("该候选有独立复核记录") : t("需要独立代码复核")}</span><button className="primary-button" disabled={acceptedCode || busy || !diff || diffStatus !== 'ready' || candidate.status === 'accepted' || precheckLoading || !precheck?.ready || hashMismatch} onClick={() => perform(() => api(`/code-candidates/${candidate.id}/accept`, {}), t("候选已集成到工作项分支"), scope)}><Check size={16} /> {acceptedCode ? t("代码已接纳") : t("接纳代码")}</button></div></>}
  </section><aside className="evidence-panel"><div className="panel-heading"><h2>{t("验证证据")}</h2>{candidate && <button className="icon-button" aria-label={t("重新验证")} disabled={acceptedCode || busy} onClick={() => perform(() => api(`/candidates/${candidate.id}/verify`, {}), t("已执行验证命令"), scope)}><RefreshCcw size={15} /></button>}</div>
    {evidence.map(e => <details className={`evidence-card ${e.status}`} key={e.id}><summary><span>{e.status === 'passed' ? <CheckCircle2 size={16} /> : <CircleDot size={16} />}<strong>{e.command.id}</strong></span><span>{e.stale ? t("内容已改变") : e.status === 'passed' ? t("通过") : t("失败")}</span></summary><div className="evidence-details"><code>{e.command.executable} {e.command.args.join(' ')}</code><p>{t("代码")} {short(e.targetHash)}  {t("· 退出码")} {e.exitCode ?? '—'}</p><pre>{e.stdout + e.stderr}</pre></div></details>)}
    {candidate && !evidence.length && <div className="quiet-note">{acceptedCode ? t("此候选未记录验证证据。") : t("尚未产生验证证据。可通过右上角重新运行验证命令。")}</div>}
    <div className="section-label inner">{t("实现任务")}</div>{snapshot?.tasks.map(task => <div className="task-card" key={task.id}><span><ListChecks size={15} /><code>{task.taskId}</code></span><strong>{task.name}</strong><small className={task.state === 'verified' ? 'green' : ''}>{t(labels[task.state])}</small></div>)}
    {candidate && !snapshot?.tasks.length && <div className="quiet-note">{t("还没有实现任务。")}</div>}
    <div className="section-label inner">{t("复核发现")}</div>{openFindings.map(f => <div className="finding-card" key={f.id}><span className="badge blocked">{f.severity === 'blocker' ? t("阻塞问题") : t("警告")}</span><strong>{f.location}</strong><p>{f.body}</p>{f.severity === 'warning' && (waiver?.id === f.id ? <div className="waiver-form"><textarea aria-label={t("例外理由")} readOnly={acceptedCode} rows={3} value={waiver.reason} onChange={e => setWaiver({ id: f.id, reason: e.target.value })} placeholder={t("说明为何允许该警告进入后续步骤")} /><div><button className="text-button" onClick={() => setWaiver(undefined)}>{t("取消")}</button><button className="outline-button" disabled={acceptedCode || isPending(`finding:${f.id}`) || !waiver.reason.trim()} onClick={() => perform(() => api(`/findings/${f.id}/resolve`, { status: 'waived', reason: waiver.reason.trim() }), t("已记录例外决策"), `finding:${f.id}`).then(() => setWaiver(undefined))}>{t("确认例外")}</button></div></div> : <button className="text-button" disabled={acceptedCode} onClick={() => setWaiver({ id: f.id, reason: '' })}>{t("记录例外理由")}</button>)}</div>)}
    {!openFindings.length && <div className="quiet-note"><ShieldCheck size={16} />  {t("当前没有未解决的复核发现")}</div>}
  </aside></div>;
}
