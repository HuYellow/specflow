import { useEffect, useRef, useState } from 'react';
import { Check, FileText, MessageSquare, Plus, Save, ShieldCheck, CircleHelp } from 'lucide-react';
import { api } from './api.ts';
import { Empty, fmt, short, useWorkspace } from './context.tsx';
export function Documents() {
  const { snapshot, selectedArtifact, setSelectedArtifact, busy, perform, openImport, setSelectedNode, setTab } = useWorkspace();
  const [selectedRevision, setSelectedRevision] = useState(''), [text, setText] = useState(''), [compare, setCompare] = useState(false), [comment, setComment] = useState('');
  const [anchor, setAnchor] = useState(''), [conflict, setConflict] = useState(false), [reload, setReload] = useState(0);
  const editorBase = useRef<{ artifactId: string; revisionId: string; expectedRevision: number; content: string } | undefined>(undefined);
  const artifact = snapshot?.artifacts.find(a => a.id === selectedArtifact) || snapshot?.artifacts[0];
  const revision = snapshot?.revisions.find(r => r.id === selectedRevision && r.artifactId === artifact?.id) || snapshot?.revisions.find(r => r.id === artifact?.currentRevisionId);
  const accepted = snapshot?.revisions.find(r => r.id === artifact?.acceptedRevisionId);
  const requiresClarification = artifact?.logicalId === 'spec' && snapshot?.runs.at(-1)?.definition.requireClarification;
  const clarification = snapshot?.clarifications.find(s => s.id === revision?.clarificationSessionId && s.state === 'completed' && s.resultSpecRevisionId === revision?.id);
  useEffect(() => { setSelectedRevision(''); }, [artifact?.id]);
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
  function changeText(value: string) {
    setText(value); const base = editorBase.current;
    if (base) { if (value === base.content) localStorage.removeItem(`specflow-draft-${base.artifactId}`); else localStorage.setItem(`specflow-draft-${base.artifactId}`, JSON.stringify({ ...base, text: value })); }
  }
  return <section className="document-panel"><div className="panel-heading"><div><h2>文档产物 <span>{snapshot?.artifacts.length || 0} 份</span></h2><p>修订形成新版本，接纳绑定具体内容。</p></div><button className="outline-button" onClick={openImport}><Plus size={15} /> 导入文档</button></div>
    {!artifact ? <Empty icon={<FileText size={34} />} title="尚未产出文档" description="运行需求规格步骤，或导入已有 Markdown 开始工程流程。" /> : <>
    <div className="document-toolbar"><div className="document-tabs">{snapshot?.artifacts.map(a => <button className={a.id === artifact.id ? 'active' : ''} key={a.id} onClick={() => setSelectedArtifact(a.id)}><FileText size={14} />{a.logicalId}.md</button>)}</div><select aria-label="文档版本" value={revision?.id} onChange={e => setSelectedRevision(e.target.value)}>{artifact.revisionIds.map((id, i) => <option key={id} value={id}>版本 {i + 1}{id === artifact.acceptedRevisionId ? ' · 已接纳' : ''}</option>)}</select></div>
    <div className="document-meta"><div><span className={`badge ${revision?.acceptance}`}>{revision?.acceptance === 'accepted' ? '已接纳' : '候选版本'}</span><span>{revision?.reviewed ? <><ShieldCheck size={13} /> 已独立复核</> : '等待独立复核'}</span><span>内容 <code>{short(revision?.contentHash)}</code></span></div><div><button className={!compare ? 'view-toggle active' : 'view-toggle'} onClick={() => setCompare(false)}>编辑</button><button className={compare ? 'view-toggle active' : 'view-toggle'} onClick={() => setCompare(true)}>比较</button></div></div>
    {conflict && <div className="blocker-box"><div>服务器已有新版本，当前本地草稿已保留。请比较内容后处理冲突。<button className="text-button" onClick={() => { localStorage.removeItem(`specflow-draft-${artifact.id}`); setReload(x => x + 1); }}>丢弃草稿并载入当前版本</button></div></div>}
    {requiresClarification && <div className="document-clarification"><CircleHelp size={15} /><span>{clarification ? `已完成需求澄清 · ${clarification.questions.length} 项答复已记录` : '当前规格需要先完成需求澄清，再复核与接纳。'}</span>{!clarification && <button className="text-button" onClick={() => { const node = snapshot?.nodes.find(n => n.workflowRunId === snapshot.runs.at(-1)?.id && n.type === 'clarify'); if (node) setSelectedNode(node.id); setTab('flow'); }}>进入需求澄清</button>}</div>}
    <div className="document-body">{!compare ? <textarea aria-label="文档正文" className="document-editor" value={text} onChange={e => changeText(e.target.value)} onSelect={e => setAnchor(e.currentTarget.value.slice(e.currentTarget.selectionStart, e.currentTarget.selectionEnd))} readOnly={revision?.id !== artifact.currentRevisionId} spellCheck={false} /> : <div className="compare-grid"><div><h3>{conflict ? '服务器当前版本' : '已接纳版本'}</h3><pre>{conflict ? revision?.content : accepted?.content || '尚无已接纳版本'}</pre></div><div><h3>{conflict ? '我的本地草稿' : '选定候选版本'}</h3><pre>{conflict ? text : revision?.content}</pre></div></div>}
    <aside className="comment-panel"><h3><MessageSquare size={16} /> 段落评论</h3>
      {snapshot?.comments.filter(c => c.artifactRevisionId === revision?.id).map(c => <div className="comment" key={c.id}><div><strong>{c.author}</strong><span>{fmt(c.createdAt)}</span></div><p>{c.body}</p>{c.anchor && <small>{c.anchor}</small>}</div>)}
      {anchor && <div className="form-note">已选中段落：{anchor.slice(0, 100)}</div>}
      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="记录一个问题或修订建议…" aria-label="评论内容" />
      <button className="outline-button full" disabled={!comment.trim() || busy} onClick={() => perform(async () => { await api('/comments', { artifactRevisionId: revision!.id, author: 'local', body: comment, anchor }); setComment(''); }, '评论已保存')}><MessageSquare size={14} /> 添加评论</button>
      <div className="owner-row">负责人 <input aria-label="产物负责人" key={`${artifact.id}-${artifact.owner}`} defaultValue={artifact.owner} onBlur={e => { if (e.target.value && e.target.value !== artifact.owner) perform(() => api(`/artifacts/${artifact.id}/owner`, { expectedRevision: artifact.revision, owner: e.target.value })); }} /></div>
    </aside></div>
    <div className="document-footer"><span>{text !== revision?.content ? '本地草稿已保留' : `更新于 ${fmt(revision?.updatedAt)}`}</span><div><button className="outline-button" disabled={busy || text === revision?.content || revision?.id !== artifact.currentRevisionId} onClick={() => perform(async () => { await api(`/artifacts/${artifact.id}/revisions`, { content: text, expectedRevision: editorBase.current?.expectedRevision || artifact.revision }); localStorage.removeItem(`specflow-draft-${artifact.id}`); setReload(x => x + 1); }, '已保存新候选版本，需要重新复核')}><Save size={15} /> 保存新版本</button><button className="primary-button" disabled={busy || conflict || (requiresClarification && !clarification) || !revision?.reviewed || revision.id !== artifact.currentRevisionId || revision.acceptance === 'accepted' || text !== revision.content} onClick={() => perform(() => api(`/artifacts/${artifact.id}/accept`, { expectedRevision: artifact.revision, actor: 'local', reason: '已检查并接纳当前内容' }), '产物已接纳，下游可以消费该版本')}><Check size={16} /> 接纳此版本</button></div></div>
    </>}
  </section>;
}
