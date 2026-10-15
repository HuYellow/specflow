import { useEffect, useRef, useState } from 'react';
import { BookOpen, Check, Download, FileText, MessageSquare, Plus, Save, ShieldCheck, CircleHelp } from 'lucide-react';
import { api } from './api.ts';
import { Empty, fmt, short, useWorkspace } from './context.tsx';
type DocumentView = 'reading' | 'execution' | 'compare';
type ReadingDocument = {
  schemaVersion: 1;
  sourceRevisionId: string;
  sourceContentHash: string;
  brief: { title: string; summary: string; sections: { title: string; items: string[] }[] };
  mode: 'authored' | 'extractive';
};
type ReadingState = { revisionId: string; data?: ReadingDocument; error?: string };
export function Documents() {
  const { snapshot, selectedArtifact, setSelectedArtifact, busy, perform, openImport, setSelectedNode, setTab } = useWorkspace();
  const [selectedRevision, setSelectedRevision] = useState(''), [text, setText] = useState(''), [view, setView] = useState<DocumentView>('reading'), [comment, setComment] = useState('');
  const [anchor, setAnchor] = useState(''), [conflict, setConflict] = useState(false), [reload, setReload] = useState(0);
  const [readingState, setReadingState] = useState<ReadingState>(), [readingReload, setReadingReload] = useState(0);
  const editorBase = useRef<{ artifactId: string; revisionId: string; expectedRevision: number; content: string } | undefined>(undefined);
  const artifact = snapshot?.artifacts.find(a => a.id === selectedArtifact) || snapshot?.artifacts[0];
  const revision = snapshot?.revisions.find(r => r.id === selectedRevision && r.artifactId === artifact?.id) || snapshot?.revisions.find(r => r.id === artifact?.currentRevisionId);
  const accepted = snapshot?.revisions.find(r => r.id === artifact?.acceptedRevisionId);
  const requiresClarification = artifact?.logicalId === 'spec' && snapshot?.runs.at(-1)?.definition.requireClarification;
  const clarification = snapshot?.clarifications.find(s => s.id === revision?.clarificationSessionId && s.state === 'completed' && s.resultSpecRevisionId === revision?.id);
  const reading = readingState && readingState.revisionId === revision?.id && readingState.data?.sourceContentHash === revision?.contentHash ? readingState.data : undefined;
  const readingError = readingState && readingState.revisionId === revision?.id ? readingState.error : undefined;
  useEffect(() => { setSelectedRevision(''); }, [artifact?.id]);
  useEffect(() => {
    if (!revision) return;
    let active = true;
    const revisionId = revision.id, contentHash = revision.contentHash;
    setReadingState({ revisionId });
    void api<ReadingDocument>(`/artifact-revisions/${encodeURIComponent(revisionId)}/reading`).then(data => {
      if (!active) return;
      if (data.schemaVersion !== 1 || data.sourceRevisionId !== revisionId || data.sourceContentHash !== contentHash) {
        throw new Error('简报与选定文档版本不一致，请重新载入。');
      }
      setReadingState({ revisionId, data });
    }).catch(error => {
      if (active) setReadingState({ revisionId, error: error instanceof Error ? error.message : '无法载入简报，请重试。' });
    });
    return () => { active = false; };
  }, [revision?.id, revision?.contentHash, readingReload]);
  useEffect(() => {
    if (!revision || !artifact) return;
    let draft: { text: string; revisionId: string; expectedRevision: number; content: string } | undefined;
    try { draft = JSON.parse(localStorage.getItem(`specflow-draft-${artifact.id}`) || 'null') || undefined; } catch {}
    const isCurrent = revision.id === artifact.currentRevisionId;
    if (draft && isCurrent) {
      setText(draft.text); setConflict(draft.revisionId !== revision.id);
      editorBase.current = { artifactId: artifact.id, revisionId: draft.revisionId, expectedRevision: draft.revisionId === revision.id ? artifact.revision : draft.expectedRevision, content: draft.content };
    } else { setText(revision.content); setConflict(false); editorBase.current = { artifactId: artifact.id, revisionId: revision.id, expectedRevision: artifact.revision, content: revision.content }; }
    setAnchor('');
  }, [artifact?.id, artifact?.revision, revision?.id, reload]);
  const dirty = !!revision && text !== revision.content;
  function changeText(value: string) {
    setText(value); const base = editorBase.current;
    if (base) { if (value === base.content) localStorage.removeItem(`specflow-draft-${base.artifactId}`); else localStorage.setItem(`specflow-draft-${base.artifactId}`, JSON.stringify({ ...base, text: value })); }
  }
  return <section className="document-panel"><div className="panel-heading"><div><h2>文档产物 <span>{snapshot?.artifacts.length || 0} 份</span></h2><p>每份产物都有供人阅读的简报与供 AI 执行的完整文档。</p></div><button className="outline-button" onClick={openImport}><Plus size={15} /> 导入文档</button></div>
    {!artifact ? <Empty icon={<FileText size={34} />} title="尚未产出文档" description="运行需求规格步骤，或导入已有 Markdown 开始工程流程。" /> : <>
    <div className="document-toolbar"><div className="document-tabs">{snapshot?.artifacts.map(a => <button className={a.id === artifact.id ? 'active' : ''} key={a.id} onClick={() => setSelectedArtifact(a.id)}><FileText size={14} />{a.logicalId}.md</button>)}</div><select aria-label="文档版本" value={revision?.id} onChange={e => setSelectedRevision(e.target.value)}>{artifact.revisionIds.map((id, i) => <option key={id} value={id}>版本 {i + 1}{id === artifact.acceptedRevisionId ? ' · 已接纳' : ''}</option>)}</select></div>
    <div className="document-meta"><div><span className={`badge ${revision?.acceptance}`}>{revision?.acceptance === 'accepted' ? '已接纳' : '候选版本'}</span><span>{revision?.reviewed ? <><ShieldCheck size={13} /> 已独立复核</> : '等待独立复核'}</span><span>内容 <code>{short(revision?.contentHash)}</code></span></div><div className="document-view-controls" role="group" aria-label="文档阅读方式"><button className={view === 'reading' ? 'view-toggle active' : 'view-toggle'} aria-pressed={view === 'reading'} onClick={() => setView('reading')}><BookOpen size={13} /> 人类简报</button><button className={view === 'execution' ? 'view-toggle active' : 'view-toggle'} aria-pressed={view === 'execution'} onClick={() => setView('execution')}>AI 执行文档</button><button className={view === 'compare' ? 'view-toggle active' : 'view-toggle'} aria-pressed={view === 'compare'} onClick={() => setView('compare')}>比较</button></div></div>
    {conflict && <div className="blocker-box"><div>服务器已有新版本，当前本地草稿已保留。请比较内容后处理冲突。<button className="text-button" onClick={() => { localStorage.removeItem(`specflow-draft-${artifact.id}`); setReload(x => x + 1); }}>丢弃草稿并载入当前版本</button></div></div>}
    {requiresClarification && <div className="document-clarification"><CircleHelp size={15} /><span>{clarification ? `已完成需求澄清 · ${clarification.questions.length} 项答复已记录` : '当前规格需要先完成需求澄清，再复核与接纳。'}</span>{!clarification && <button className="text-button" onClick={() => { const node = snapshot?.nodes.find(n => n.workflowRunId === snapshot.runs.at(-1)?.id && n.type === 'clarify'); if (node) setSelectedNode(node.id); setTab('flow'); }}>进入需求澄清</button>}</div>}
    <div className="document-body">{view === 'reading' ? <div className="document-reading">
      {dirty && <p className="reading-draft-notice" role="status">简报基于选定的已保存版本。本地草稿尚未同步，保存新版本后简报会更新。</p>}
      {readingError ? <div className="reading-feedback" role="alert"><BookOpen size={25} /><h3>简报暂时无法载入</h3><p>{readingError}</p><button className="outline-button" onClick={() => setReadingReload(value => value + 1)}>重新载入简报</button></div> : !reading ? <div className="reading-feedback" role="status"><BookOpen size={25} /><p>正在载入此版本的简报…</p></div> : <article className="reading-paper" aria-label="人类简报">
        <div className="reading-kicker"><span>流程产物简报</span><span>{artifact.logicalId}.human</span></div>
        <header className="reading-header"><h3>{reading.brief.title}</h3><p>{reading.brief.summary}</p></header>
        <div className="reading-sections">{reading.brief.sections.map((section, index) => <section className="reading-section" key={`${index}-${section.title}`}><div className="reading-section-heading"><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><h4>{section.title}</h4></div><ul>{section.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul></section>)}</div>
        <footer className="reading-source"><div><strong>对应执行文档</strong><span>版本 {artifact.revisionIds.indexOf(reading.sourceRevisionId) + 1} · {reading.sourceRevisionId === artifact.currentRevisionId ? '当前版本' : '历史版本'}</span></div><div><span>修订 <code title={reading.sourceRevisionId}>{short(reading.sourceRevisionId)}</code></span><span>内容 <code title={reading.sourceContentHash}>{short(reading.sourceContentHash)}</code></span></div><p>{reading.mode === 'extractive' ? '本页为原文摘录，可能省略上下文。' : '本简报与该版本的执行文档一同保存。'} 查看完整约束与验收条件，请切换至 AI 执行文档。</p></footer>
        <div className="reading-exports" aria-label="导出人类简报"><a className="outline-button" href={`/api/artifact-revisions/${encodeURIComponent(reading.sourceRevisionId)}/reading.html`} download={`${artifact.logicalId}.human.html`}><Download size={14} /> HTML 阅读页</a></div>
      </article>}
    </div> : view === 'execution' ? <div className="document-execution"><div className="execution-note"><FileText size={15} /><p>完整保留目标、约束和验收条件，供后续 AI 步骤执行。修订后需保存新版本并重新复核。</p></div><textarea aria-label="文档正文" className="document-editor" value={text} onChange={e => changeText(e.target.value)} onSelect={e => setAnchor(e.currentTarget.value.slice(e.currentTarget.selectionStart, e.currentTarget.selectionEnd))} readOnly={revision?.id !== artifact.currentRevisionId} spellCheck={false} /></div> : <div className="compare-grid"><div><h3>{conflict ? '服务器当前版本' : '已接纳版本'}</h3><pre>{conflict ? revision?.content : accepted?.content || '尚无已接纳版本'}</pre></div><div><h3>{conflict ? '我的本地草稿' : '选定候选版本'}</h3><pre>{conflict ? text : revision?.content}</pre></div></div>}
    <aside className="comment-panel"><h3><MessageSquare size={16} /> 段落评论</h3>
      {snapshot?.comments.filter(c => c.artifactRevisionId === revision?.id).map(c => <div className="comment" key={c.id}><div><strong>{c.author}</strong><span>{fmt(c.createdAt)}</span></div><p>{c.body}</p>{c.anchor && <small>{c.anchor}</small>}</div>)}
      {!snapshot?.comments.some(c => c.artifactRevisionId === revision?.id) && <p className="quiet-note">{view === 'execution' ? '选中正文中的一段，可以把评论钉在该段落上。' : '切换至 AI 执行文档，选中正文后可将评论钉在段落上。'}</p>}
      {anchor && <div className="form-note">已选中段落：{anchor.slice(0, 100)}</div>}
      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="记录一个问题或修订建议…" aria-label="评论内容" />
      <button className="outline-button full" disabled={!comment.trim() || busy} onClick={() => perform(async () => { await api('/comments', { artifactRevisionId: revision!.id, author: 'local', body: comment, anchor }); setComment(''); }, '评论已保存')}><MessageSquare size={14} /> 添加评论</button>
      <div className="owner-row">负责人 <input aria-label="产物负责人" key={`${artifact.id}-${artifact.owner}`} defaultValue={artifact.owner} onBlur={e => { if (e.target.value && e.target.value !== artifact.owner) perform(() => api(`/artifacts/${artifact.id}/owner`, { expectedRevision: artifact.revision, owner: e.target.value })); }} /></div>
    </aside></div>
    <div className="document-footer"><span>{text !== revision?.content ? '本地草稿已保留' : `更新于 ${fmt(revision?.updatedAt)}`}</span><div><button className="outline-button" disabled={busy || text === revision?.content || revision?.id !== artifact.currentRevisionId} onClick={() => perform(async () => { await api(`/artifacts/${artifact.id}/revisions`, { content: text, expectedRevision: editorBase.current?.expectedRevision || artifact.revision }); localStorage.removeItem(`specflow-draft-${artifact.id}`); setReload(x => x + 1); }, '已保存新候选版本，需要重新复核')}><Save size={15} /> 保存新版本</button><button className="primary-button" disabled={busy || conflict || (requiresClarification && !clarification) || !revision?.reviewed || revision.id !== artifact.currentRevisionId || revision.acceptance === 'accepted' || text !== revision.content} onClick={() => perform(() => api(`/artifacts/${artifact.id}/accept`, { expectedRevision: artifact.revision, actor: 'local', reason: '已检查并接纳当前内容' }), '产物已接纳，下游可以消费该版本')}><Check size={16} /> 接纳此版本</button></div></div>
    </>}
  </section>;
}
