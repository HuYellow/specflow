import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronDown, FilePlus2, FileText, FolderGit2, Save, Trash2, Upload } from 'lucide-react';
import type { RequirementDocument, RequirementRevision } from '../../../packages/domain/index.ts';
import { api } from './api.ts';
import { fmt, short, useWorkspace } from './context.tsx';

type Draft = { baseRevisionId: string; request: string; documents: RequirementDocument[] };
const draftKey = (itemId: string) => `specflow-requirements-draft-${itemId}`;
const sessionDrafts = new Map<string, Draft>();
function readDraft(itemId: string): Draft | undefined {
  if (sessionDrafts.has(itemId)) return sessionDrafts.get(itemId);
  try {
    const value = JSON.parse(localStorage.getItem(draftKey(itemId)) || 'null');
    if (value && typeof value.baseRevisionId === 'string' && typeof value.request === 'string' && Array.isArray(value.documents)) return value;
  } catch {}
}
export function hasRequirementDraft(itemId: string, current: RequirementRevision) {
  const draft = readDraft(itemId);
  return !!draft && (draft.request !== current.request || JSON.stringify(draft.documents) !== JSON.stringify(current.documents));
}

export function RequirementDocuments({ documents, onChange, workItemId, disabled = false }: { documents: RequirementDocument[]; onChange(value: RequirementDocument[]): void; workItemId?: string; disabled?: boolean }) {
  const { busy, perform } = useWorkspace();
  const fileInput = useRef<HTMLInputElement>(null);
  const documentsRef = useRef(documents); documentsRef.current = documents;
  const [repositoryPath, setRepositoryPath] = useState('');
  const addDocuments = (next: RequirementDocument[]) => {
    if (documentsRef.current.length + next.length > 20) throw new Error('最多添加 20 份需求文档');
    onChange([...documentsRef.current, ...next]);
  };
  const upload = (files: File[]) => perform(async () => {
    const next: RequirementDocument[] = [];
    for (const file of files) {
      if (!/\.(md|markdown|txt)$/i.test(file.name)) throw new Error('支持 Markdown 和 TXT，请将其他格式导出为文本后上传');
      if (file.size > 512 * 1024) throw new Error(`${file.name} 超过 512 KiB`);
      let content: string;
      try { content = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()); }
      catch { throw new Error(`${file.name} 必须使用 UTF-8 编码`); }
      if (!content.trim() || content.includes('\0')) throw new Error(`${file.name} 为空或包含二进制内容`);
      next.push({ id: crypto.randomUUID(), name: file.name, content, source: 'upload' });
    }
    addDocuments(next);
  }, '文档已加入草稿；保存需求后 AI 才会使用');
  return <div className="requirement-documents"><div className="requirements-subheading"><h3>需求文档 <span>{documents.length} 份</span></h3><div>
    <button className="outline-button" disabled={busy || disabled} onClick={() => fileInput.current?.click()}><Upload size={15} /> 上传文档</button>
    <button className="text-button" disabled={busy || disabled || documents.length >= 20} onClick={() => addDocuments([{ id: crypto.randomUUID(), name: `补充需求-${documents.length + 1}.md`, content: '', source: 'pasted' }])}><FilePlus2 size={15} /> 粘贴文档</button>
  </div></div><input ref={fileInput} className="visually-hidden" aria-label="上传需求文档" type="file" accept=".md,.markdown,.txt,text/plain,text/markdown" multiple disabled={busy || disabled} onChange={e => { const files = Array.from(e.target.files || []); e.target.value = ''; if (files.length) void upload(files); }} />
    <p className="requirements-hint">支持 UTF-8 Markdown / TXT。每份不超过 512 KiB，需求总计不超过 1 MiB。</p>
    {workItemId && <div className="repository-import"><FolderGit2 size={17} /><input aria-label="仓库需求文档路径" value={repositoryPath} onChange={e => setRepositoryPath(e.target.value)} placeholder="仓库相对路径，例如 docs/requirements.md" disabled={busy || disabled} /><button className="outline-button" disabled={busy || disabled || !repositoryPath.trim()} onClick={() => perform(async () => { const doc = await api<RequirementDocument>(`/work-items/${workItemId}/requirements/repository`, { path: repositoryPath.trim() }); addDocuments([doc]); setRepositoryPath(''); }, '仓库文档已加入草稿；保存后使用此内容快照')}>从仓库导入</button></div>}
    {!documents.length && <div className="requirements-empty"><FileText size={22} /><div><strong>把 PRD、验收条件或背景材料放在这里</strong><p>文档正文会随需求版本传给 AI。只有需求正文时也可以开始分析。</p></div></div>}
    <div className="requirement-file-list">{documents.map((doc, index) => <details className="requirement-file" key={doc.id} open={doc.source === 'pasted'}><summary><FileText size={16} /><span><strong>{doc.name}</strong><small>{doc.source === 'repository' ? `仓库 · ${doc.repositoryPath}` : doc.source === 'upload' ? '本地上传' : '粘贴文档'} · {doc.content.length.toLocaleString()} 字符</small></span><ChevronDown size={15} /></summary><div className="requirement-file-editor"><label className="field">文档名称<input aria-label={`需求文档 ${index + 1} 名称`} value={doc.name} disabled={busy || disabled} onChange={e => onChange(documents.map(d => d.id === doc.id ? { ...d, name: e.target.value } : d))} /></label><label className="field">文档正文<textarea aria-label={`需求文档 ${index + 1} 正文`} value={doc.content} rows={8} disabled={busy || disabled} onChange={e => onChange(documents.map(d => d.id === doc.id ? { ...d, content: e.target.value } : d))} spellCheck={false} /></label><button className="text-button" disabled={busy || disabled} onClick={() => onChange(documents.filter(d => d.id !== doc.id))}><Trash2 size={14} /> 移除此文档</button></div></details>)}</div>
  </div>;
}

export function Requirements() {
  const { snapshot } = useWorkspace();
  return snapshot ? <RequirementEditor key={snapshot.item.id} /> : null;
}
function RequirementEditor() {
  const { snapshot: state, busy, perform, setTab } = useWorkspace();
  const snapshot = state!, current = snapshot.requirements.current, item = snapshot.item;
  const savedDraft = () => ({ baseRevisionId: current.id, request: current.request, documents: structuredClone(current.documents) });
  const [draft, setDraft] = useState<Draft>(() => readDraft(item.id) || savedDraft());
  const [historyId, setHistoryId] = useState(current.id);
  const [draftStorageError, setDraftStorageError] = useState(false);
  const base = snapshot.requirements.history.find(r => r.id === draft.baseRevisionId);
  const dirty = !base || draft.request !== base.request || JSON.stringify(draft.documents) !== JSON.stringify(base.documents);
  const conflict = dirty && draft.baseRevisionId !== current.id;
  const preview = snapshot.requirements.history.find(r => r.id === historyId) || current;
  useEffect(() => {
    if (!dirty && draft.baseRevisionId !== current.id) { clearDraft(); setDraft(savedDraft()); }
    setHistoryId(current.id);
  }, [current.id]);
  const changeDraft = (patch: Partial<Draft>) => {
    const next = { ...draft, ...patch }; setDraft(next);
    if (next.request === current.request && JSON.stringify(next.documents) === JSON.stringify(current.documents)) { clearDraft(); return; }
    sessionDrafts.set(item.id, next);
    try { localStorage.setItem(draftKey(item.id), JSON.stringify(next)); setDraftStorageError(false); }
    catch { setDraftStorageError(true); }
  };
  const clearDraft = () => { sessionDrafts.delete(item.id); try { localStorage.removeItem(draftKey(item.id)); } catch {} setDraftStorageError(false); };
  const reset = () => { clearDraft(); setDraft(savedDraft()); };
  const save = () => perform(async () => {
    const revision = await api<RequirementRevision>(`/work-items/${item.id}/requirements`, { expectedRevisionId: draft.baseRevisionId, request: draft.request, documents: draft.documents });
    clearDraft(); setDraft({ baseRevisionId: revision.id, request: revision.request, documents: revision.documents });
  }, '需求已保存；新的分析将读取此版本');
  return <div className="requirements-layout"><section className="requirements-panel"><div className="panel-heading"><div><h2>需求输入 <span>版本 {current.number}</span></h2><p>描述要做什么，把分析依据放在同一个地方。</p></div><button className="text-button" onClick={() => setTab('flow')}><ArrowLeft size={15} /> 返回开发流程</button></div>
    <div className="requirements-editor"><label className="field">需求正文<textarea aria-label="需求正文" rows={8} value={draft.request} disabled={busy || item.status === 'accepted'} onChange={e => changeDraft({ request: e.target.value })} placeholder="粘贴需求，写清用户场景、功能边界、约束和验收条件。也可以通过下方文档提供完整需求。" /></label><RequirementDocuments documents={draft.documents} onChange={documents => changeDraft({ documents })} workItemId={item.id} disabled={item.status === 'accepted'} />
    {conflict && <div className="blocker-box"><div><strong>需求已有新版本，当前草稿已保留</strong><p>右侧可查看最新版本。比较后选择如何处理草稿。</p><div className="requirements-conflict-actions"><button className="outline-button" onClick={reset}>丢弃草稿，载入最新需求</button><button className="outline-button" onClick={() => changeDraft({ baseRevisionId: current.id })}>已比较，保留我的草稿</button></div></div></div>}
    {item.status === 'accepted' && <p className="form-note">工作项已经接纳。后续需求请创建新的工作项。</p>}
    {draftStorageError && <p className="form-note">浏览器存储空间不足，草稿仅保留在当前窗口。请先保存需求再关闭窗口。</p>}
    </div><div className="document-footer"><span>{dirty ? '有未保存草稿 · AI 使用已保存版本' : `已保存 · ${fmt(current.createdAt)}`}</span><div>{dirty && !conflict && <button className="text-button" disabled={busy} onClick={reset}>放弃草稿</button>}<button className="primary-button" disabled={busy || !dirty || conflict || item.status === 'accepted' || (!draft.request.trim() && !draft.documents.length) || draft.documents.some(d => !d.content.trim() || !d.name.trim())} onClick={save}><Save size={16} /> 保存需求</button></div></div>
  </section><aside className="requirements-preview"><div className="panel-heading"><div><span className="eyebrow">AI INPUT</span><h2>已保存的分析依据</h2><p>新尝试读取已保存正文和全部文档。</p></div></div><div className="requirements-preview-body"><div className="requirements-version"><span><Check size={14} /> {preview.id === current.id ? '当前版本' : '历史版本'} {preview.number}</span><code>{short(preview.contentHash)}</code></div><select aria-label="查看需求历史版本" value={preview.id} onChange={e => setHistoryId(e.target.value)}>{snapshot.requirements.history.slice().reverse().map(r => <option key={r.id} value={r.id}>版本 {r.number}{r.id === current.id ? ' · 当前输入' : ' · 历史记录'}</option>)}</select><h3>需求正文</h3><pre>{preview.request || '以附加需求文档为准'}</pre>{preview.documents.map(doc => <details className="requirement-preview-file" key={doc.id}><summary><FileText size={14} />{doc.name}</summary><pre>{doc.content}</pre></details>)}<div className="requirements-contract"><FileText size={17} /><p>保存新需求后，已有分析、复核及下游结果会提示过期。旧尝试保留其原始输入，便于对比。</p></div></div></aside></div>;
}
