import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, Download, FileText, MessageSquare, Plus, Save, ShieldCheck, CircleHelp } from 'lucide-react';
import { api } from './api.ts';
import { Empty, fmt, short, useWorkspace } from './context.tsx';
import { MarkdownView } from './MarkdownView.tsx';
import { DocumentDiff } from './DiffView.tsx';
import { diffText, findTextAnchors } from './review-model.ts';
import './review.css';
type DocumentDraft = { text: string; revisionId: string; expectedRevision: number; content: string };
type ReadingDocument = {
  schemaVersion: 1;
  sourceRevisionId: string;
  sourceContentHash: string;
  brief: { title: string; summary: string; sections: { title: string; items: string[] }[] };
  mode: 'authored' | 'extractive';
};
type ReadingState = { revisionId: string; data?: ReadingDocument; error?: string };
const sessionDrafts = new Map<string, DocumentDraft>();
const storageFailures = new Set<string>();
function readDraft(id: string) {
  const memory = sessionDrafts.get(id);
  if (memory) return memory;
  try { return JSON.parse(localStorage.getItem(`specflow-draft-${id}`) || 'null') as DocumentDraft | null; } catch { return null; }
}
function clearDraft(id: string) {
  sessionDrafts.delete(id);
  storageFailures.delete(id);
  try { localStorage.removeItem(`specflow-draft-${id}`); } catch { /* Session draft still clears when storage is unavailable. */ }
}
export function Documents() {
  const { snapshot, selectedArtifact, setSelectedArtifact, selectedRevision, setSelectedRevision, documentView: view, setDocumentView: setView, isPending, perform, openImport, setSelectedNode, setTab } = useWorkspace();
  const [text, setText] = useState(''), [comment, setComment] = useState('');
  const [executionMode, setExecutionMode] = useState<'preview' | 'edit'>('preview');
  const [anchorLookup, setAnchorLookup] = useState<{ text: string; matches: number[] }>();
  const [anchor, setAnchor] = useState(''), [conflict, setConflict] = useState(false), [reload, setReload] = useState(0);
  const [storageError, setStorageError] = useState(false);
  const [readingState, setReadingState] = useState<ReadingState>(), [readingReload, setReadingReload] = useState(0);
  const editorBase = useRef<{ artifactId: string; revisionId: string; expectedRevision: number; content: string } | undefined>(undefined);
  const artifact = snapshot?.artifacts.find(a => a.id === selectedArtifact) || snapshot?.artifacts[0];
  const delivered = snapshot?.item.status === 'accepted';
  const scope = `artifact:${artifact?.id}`, busy = isPending(scope);
  const editor = useRef<HTMLTextAreaElement>(null);
  const revision = snapshot?.revisions.find(r => r.id === selectedRevision && r.artifactId === artifact?.id) || snapshot?.revisions.find(r => r.id === artifact?.currentRevisionId);
  const commentBusy = isPending(`comments:${revision?.id}`);
  const accepted = snapshot?.revisions.find(r => r.id === artifact?.acceptedRevisionId);
  const requiresClarification = artifact?.logicalId === 'spec' && snapshot?.runs.at(-1)?.definition.requireClarification;
  const clarification = snapshot?.clarifications.find(s => s.id === revision?.clarificationSessionId && s.state === 'completed' && s.resultSpecRevisionId === revision?.id);
  const reading = readingState && readingState.revisionId === revision?.id && readingState.data?.sourceContentHash === revision?.contentHash ? readingState.data : undefined;
  const readingError = readingState && readingState.revisionId === revision?.id ? readingState.error : undefined;
  const beforeText = conflict ? revision?.content || '' : accepted?.content || '';
  const afterText = conflict ? text : revision?.content || '';
  const diff = useMemo(() => diffText(beforeText, afterText), [beforeText, afterText]);
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
    const draft = readDraft(artifact.id);
    setStorageError(storageFailures.has(artifact.id));
    const isCurrent = revision.id === artifact.currentRevisionId;
    if (draft && isCurrent) {
      setText(draft.text); setConflict(draft.revisionId !== revision.id);
      editorBase.current = { artifactId: artifact.id, revisionId: draft.revisionId, expectedRevision: draft.revisionId === revision.id ? artifact.revision : draft.expectedRevision, content: draft.content };
    } else { setText(revision.content); setConflict(false); editorBase.current = { artifactId: artifact.id, revisionId: revision.id, expectedRevision: artifact.revision, content: revision.content }; }
    setAnchor(''); setAnchorLookup(undefined);
  }, [artifact?.id, artifact?.revision, revision?.id, reload]);
  const dirty = !!revision && text !== revision.content;
  const canSave = !delivered && !!artifact && !!revision && !busy && !conflict && dirty && revision.id === artifact.currentRevisionId;
  const save = () => perform(async () => {
    await api(`/artifacts/${artifact!.id}/revisions`, { content: text, expectedRevision: editorBase.current?.expectedRevision || artifact!.revision });
    clearDraft(artifact!.id); setStorageError(false); setReload(x => x + 1);
  }, '已保存新候选版本，需要重新复核', scope);
  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
  }, [dirty]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        if (event.isComposing || event.keyCode === 229 || document.querySelector('[aria-modal="true"]')) return;
        event.preventDefault();
        if (!canSave) return;
        void save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canSave, text, artifact, perform]);
  function changeText(value: string) {
    if (delivered) return;
    setText(value); const base = editorBase.current;
    if (!base) return;
    if (value === base.content) { clearDraft(base.artifactId); setStorageError(false); return; }
    const draft = { ...base, text: value };
    sessionDrafts.set(base.artifactId, draft);
    try { localStorage.setItem(`specflow-draft-${base.artifactId}`, JSON.stringify(draft)); storageFailures.delete(base.artifactId); setStorageError(false); }
    catch { storageFailures.add(base.artifactId); setStorageError(true); }
  }
  function locateAnchor(value: string) {
    const matches = findTextAnchors(text, value); setAnchorLookup({ text: value, matches });
    if (matches.length === 1) showAnchor(value, matches[0]);
  }
  function showAnchor(value: string, offset: number) {
    setView('execution'); setExecutionMode('edit');
    requestAnimationFrame(() => {
      const element = editor.current; if (!element) return;
      element.focus(); element.setSelectionRange(offset, offset + value.length);
      element.scrollTop = Math.max(0, text.slice(0, offset).split('\n').length - 4) * parseFloat(getComputedStyle(element).lineHeight);
    });
  }
  const acceptanceBlockers = [
    revision?.id !== artifact?.currentRevisionId ? '当前查看历史版本，请选择当前候选。' : '',
    conflict ? '本地草稿与服务器版本冲突，请先合并。' : dirty ? '本地草稿尚未保存，请保存新版本后重新复核。' : '',
    requiresClarification && !clarification ? '需求澄清尚未完成。' : '',
    revision && !revision.reviewed ? '当前修订尚未通过独立复核。' : '',
    revision?.acceptance === 'accepted' ? '此修订已接纳。' : '',
    revision?.requirementRevisionId && revision.requirementRevisionId !== snapshot?.requirements.current.id ? '所用需求版本已变更，请重新生成与复核。' : '',
    snapshot?.project.guidanceError ? `工程章程无法读取：${snapshot.project.guidanceError}` : '',
    revision?.guidanceHash && snapshot?.project.guidance?.contentHash && revision.guidanceHash !== snapshot.project.guidance.contentHash ? '所用工程章程已变更，请重新生成与复核。' : '',
    revision?.inputs.some(input => { const source = snapshot?.artifacts.find(item => item.logicalId === input.logicalId); const sourceRevision = snapshot?.revisions.find(item => item.id === input.artifactRevisionId); return !source || source.currentRevisionId !== input.artifactRevisionId || sourceRevision?.contentHash !== input.contentHash; }) ? '上游产物版本已变化，请重新生成与复核。' : '',
  ].filter(Boolean);
  return <section className="document-panel"><div className="panel-heading"><div><h2>文档产物 <span>{snapshot?.artifacts.length || 0} 份</span></h2><p>{delivered ? '工作项已交付，文档与审阅记录只读。后续需求请新建工作项。' : '每份产物都有供人阅读的简报与供 AI 执行的完整文档。'}</p></div><button className="outline-button" disabled={delivered} onClick={openImport}><Plus size={15} /> 导入文档</button></div>
    {!artifact ? <Empty icon={<FileText size={34} />} title="尚未产出文档" description={delivered ? '此工作项已交付。后续需求请新建工作项。' : '运行需求规格步骤，或导入已有 Markdown 开始工程流程。'} /> : <>
    <div className="document-toolbar"><div className="document-tabs">{snapshot?.artifacts.map(a => <button className={a.id === artifact.id ? 'active' : ''} key={a.id} onClick={() => setSelectedArtifact(a.id)}><FileText size={14} />{a.logicalId}.md</button>)}</div><select aria-label="文档版本" value={revision?.id} onChange={e => setSelectedRevision(e.target.value)}>{artifact.revisionIds.map((id, i) => <option key={id} value={id}>版本 {i + 1}{id === artifact.acceptedRevisionId ? ' · 已接纳' : ''}</option>)}</select></div>
    <div className="document-meta"><div><span className={`badge ${revision?.acceptance}`}>{revision?.acceptance === 'accepted' ? '已接纳' : '候选版本'}</span><span>{revision?.reviewed ? <><ShieldCheck size={13} /> 已独立复核</> : '等待独立复核'}</span><span>内容 <code>{short(revision?.contentHash)}</code></span></div><div className="document-view-controls" role="group" aria-label="文档阅读方式"><button className={view === 'reading' ? 'view-toggle active' : 'view-toggle'} aria-pressed={view === 'reading'} onClick={() => setView('reading')}><BookOpen size={13} /> 人类简报</button><button className={view === 'execution' ? 'view-toggle active' : 'view-toggle'} aria-pressed={view === 'execution'} onClick={() => setView('execution')}>AI 执行文档</button><button className={view === 'compare' ? 'view-toggle active' : 'view-toggle'} aria-pressed={view === 'compare'} onClick={() => setView('compare')}>比较</button></div></div>
    {conflict && <div className="blocker-box"><div>{delivered ? '已交付工作项的本地草稿与已保存版本不同。草稿已保留，可查看原文并复制到新工作项。' : '服务器已有新版本，当前本地草稿已保留。请比较内容后处理冲突。'}<button className="text-button" onClick={() => setView('compare')}>比较冲突</button>{!delivered && <><button className="text-button" onClick={() => { if (!revision) return; editorBase.current = { artifactId: artifact.id, revisionId: revision.id, expectedRevision: artifact.revision, content: revision.content }; setConflict(false); changeText(text); setView('execution'); setExecutionMode('edit'); }}>以服务器版本为基线继续合并</button><button className="text-button" onClick={() => { clearDraft(artifact.id); setStorageError(false); setReload(x => x + 1); }}>丢弃草稿并载入当前版本</button></>}</div></div>}
    {storageError && <p className="form-note document-history-note" role="status">浏览器存储不可用，草稿仅保留在当前窗口。{delivered ? '请查看原文并复制到新工作项后再关闭。' : '请保存新版本后再关闭。'}</p>}
    {revision?.id !== artifact.currentRevisionId && <p className="form-note document-history-note">{delivered ? '正在查看历史版本，正文只读。' : '正在查看历史版本，正文已锁定。保存与接纳仅针对当前候选。'}</p>}
    {requiresClarification && (!delivered || clarification) && <div className="document-clarification"><CircleHelp size={15} /><span>{clarification ? `已完成需求澄清 · ${clarification.questions.length} 项答复已记录` : '当前规格需要先完成需求澄清，再复核与接纳。'}</span>{!clarification && <button className="text-button" onClick={() => { const node = snapshot?.nodes.find(n => n.workflowRunId === snapshot.runs.at(-1)?.id && n.type === 'clarify'); if (node) setSelectedNode(node.id); setTab('flow'); }}>进入需求澄清</button>}</div>}
    <div className="document-body">{view === 'reading' ? <div className="document-reading">
      {dirty && <p className="reading-draft-notice" role="status">{delivered ? '简报基于已保存版本。本地草稿已保留，可在原文中选中复制；后续需求请新建工作项。' : '简报基于选定的已保存版本。本地草稿尚未同步，保存新版本后简报会更新。'}</p>}
      {readingError ? <div className="reading-feedback" role="alert"><BookOpen size={25} /><h3>简报暂时无法载入</h3><p>{readingError}</p><button className="outline-button" onClick={() => setReadingReload(value => value + 1)}>重新载入简报</button></div> : !reading ? <div className="reading-feedback" role="status"><BookOpen size={25} /><p>正在载入此版本的简报…</p></div> : <article className="reading-paper" aria-label="人类简报">
        <div className="reading-kicker"><span>流程产物简报</span><span>{artifact.logicalId}.human</span></div>
        <header className="reading-header"><h3>{reading.brief.title}</h3><p>{reading.brief.summary}</p></header>
        <div className="reading-sections">{reading.brief.sections.map((section, index) => <section className="reading-section" key={`${index}-${section.title}`}><div className="reading-section-heading"><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><h4>{section.title}</h4></div><ul>{section.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul></section>)}</div>
        <footer className="reading-source"><div><strong>对应执行文档</strong><span>版本 {artifact.revisionIds.indexOf(reading.sourceRevisionId) + 1} · {reading.sourceRevisionId === artifact.currentRevisionId ? '当前版本' : '历史版本'}</span></div><div><span>修订 <code title={reading.sourceRevisionId}>{short(reading.sourceRevisionId)}</code></span><span>内容 <code title={reading.sourceContentHash}>{short(reading.sourceContentHash)}</code></span></div><p>{reading.mode === 'extractive' ? '本页为原文摘录，可能省略上下文。' : '本简报与该版本的执行文档一同保存。'} 查看完整约束与验收条件，请切换至 AI 执行文档。</p></footer>
        <div className="reading-exports" aria-label="导出人类简报"><a className="outline-button" href={`/api/artifact-revisions/${encodeURIComponent(reading.sourceRevisionId)}/reading.html`} download={`${artifact.logicalId}.human.html`}><Download size={14} /> HTML 阅读页</a></div>
      </article>}
    </div> : view === 'execution' ? <div className="document-execution"><div className="execution-note"><FileText size={15} /><p>完整保留目标、约束和验收条件。{delivered ? dirty ? '已交付内容只读。本地草稿已保留，可选中复制到新工作项。' : '工作项已交付，正文只读；后续需求请新建工作项。' : dirty ? '正在预览本地草稿，保存后需重新复核。' : '修订后需保存新版本并重新复核。'}</p></div><div className="review-toolbar"><div role="group" aria-label="执行文档模式"><button className={`view-toggle ${executionMode === 'preview' ? 'active' : ''}`} aria-pressed={executionMode === 'preview'} onClick={() => setExecutionMode('preview')}>Markdown 预览</button><button className={`view-toggle ${executionMode === 'edit' ? 'active' : ''}`} aria-pressed={executionMode === 'edit'} onClick={() => setExecutionMode('edit')}>{!delivered && revision?.id === artifact.currentRevisionId ? '编辑原文' : '查看原文'}</button></div><span>修订 {short(revision?.id)} · {delivered ? revision?.id === artifact.currentRevisionId ? '已交付只读' : '历史只读' : revision?.id === artifact.currentRevisionId ? '当前' : '历史只读'}</span></div>{executionMode === 'preview' ? <MarkdownView content={text} idPrefix={`doc-${revision?.id}`} onSelectText={setAnchor} /> : <textarea ref={editor} aria-label="文档正文" className="document-editor" value={text} onChange={e => changeText(e.target.value)} onSelect={e => setAnchor(e.currentTarget.value.slice(e.currentTarget.selectionStart, e.currentTarget.selectionEnd))} readOnly={delivered || busy || revision?.id !== artifact.currentRevisionId} spellCheck={false} />}</div> : <div className="document-compare"><div className="diff-source-note"><span>{conflict ? `服务器 ${short(revision?.id)} · ${short(revision?.contentHash)}` : accepted ? `已接纳 ${short(accepted.id)} · ${short(accepted.contentHash)}` : '首次新增 · 无已接纳基线'}</span><span>{conflict ? `本地草稿 · 基于 ${short(editorBase.current?.revisionId)}` : `选定修订 ${short(revision?.id)} · ${short(revision?.contentHash)}`}</span></div><DocumentDiff lines={diff} beforeLabel={conflict ? '服务器版本' : accepted ? '已接纳版本' : '首次新增'} afterLabel={conflict ? '本地草稿' : '选定版本'} /></div>}
    <aside className="comment-panel"><h3><MessageSquare size={16} /> 段落评论</h3>
      {snapshot?.comments.filter(c => c.artifactRevisionId === revision?.id).map(c => <div className="comment" key={c.id}><div><strong>{c.author}</strong><span>{fmt(c.createdAt)}</span></div><p>{c.body}</p>{c.anchor && <><small>{c.anchor}</small><button className="text-button" onClick={() => locateAnchor(c.anchor!)}>在原文中查找</button></>}</div>)}
      {anchorLookup && <div className="anchor-feedback" role="status">{anchorLookup.matches.length === 0 ? '当前原文中未找到此文本，可能已被草稿修订。' : anchorLookup.matches.length === 1 ? '已定位原文中的唯一匹配。' : <><p>找到 {anchorLookup.matches.length} 处相同文本，请选择位置：</p>{anchorLookup.matches.map((offset, index) => <button className="text-button" key={offset} onClick={() => showAnchor(anchorLookup.text, offset)}>第 {index + 1} 处 · 行 {text.slice(0, offset).split('\n').length}</button>)}</>}</div>}
      {!snapshot?.comments.some(c => c.artifactRevisionId === revision?.id) && <p className="quiet-note">{delivered ? '工作项已交付，段落评论记录只读。' : view === 'execution' ? '选中正文中的一段，可以把评论钉在该段落上。' : '切换至 AI 执行文档，选中正文后可将评论钉在段落上。'}</p>}
      {anchor && <div className="form-note">已选中段落：{anchor.slice(0, 100)}</div>}
      <textarea value={comment} readOnly={delivered} onChange={e => setComment(e.target.value)} placeholder="记录一个问题或修订建议…" aria-label="评论内容" />
      <button className="outline-button full" disabled={delivered || !revision || !comment.trim() || commentBusy} onClick={() => perform(async () => { await api('/comments', { artifactRevisionId: revision!.id, author: 'local', body: comment, anchor }); setComment(''); }, '评论已保存', `comments:${revision?.id}`)}><MessageSquare size={14} /> 添加评论</button>
      <div className="owner-row">负责人 <input aria-label="产物负责人" disabled={delivered || busy} key={`${artifact.id}-${artifact.owner}`} defaultValue={artifact.owner} onBlur={e => { if (!delivered && e.target.value && e.target.value !== artifact.owner) perform(() => api(`/artifacts/${artifact.id}/owner`, { expectedRevision: artifact.revision, owner: e.target.value }), undefined, scope); }} /></div>
    </aside></div>
    <div className="document-acceptance-note" aria-live="polite">{delivered ? '此工作项已交付。文档、评论与负责人只读，保留历史、比较与导出；后续需求请新建工作项。' : acceptanceBlockers.length ? acceptanceBlockers.join(' ') : '当前版本已保存并完成复核。接纳时服务会重新检查输入、版本与工程条件。'}</div><div className="document-footer"><span>{dirty ? delivered ? '本地草稿已保留 · 查看原文可选中复制到新工作项' : storageError ? '草稿仅保留在当前窗口 · 请保存后再关闭' : '本地草稿已保留 · Ctrl+S 保存' : `更新于 ${fmt(revision?.updatedAt)}`}</span><div><button className="outline-button" disabled={!canSave} onClick={save}><Save size={15} /> 保存新版本</button><button className="primary-button" disabled={delivered || busy || !revision || acceptanceBlockers.length > 0} onClick={() => perform(() => api(`/artifacts/${artifact.id}/accept`, { expectedRevision: artifact.revision, actor: 'local', reason: '已检查并接纳当前内容' }), '产物已接纳，下游可以消费该版本', scope)}><Check size={16} /> 接纳此版本</button></div></div>
    </>}
  </section>;
}
