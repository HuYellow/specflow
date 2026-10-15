import { useEffect, useRef, useState } from 'react';
import { FileText, RefreshCcw, Save } from 'lucide-react';
import { api } from './api.ts';
import { short, useWorkspace } from './context.tsx';
type Draft = { content: string; baseContent: string; expectedHash: string | null };
const sessionDrafts = new Map<string, Draft>();
const storageFailures = new Set<string>();

export function GuidanceEditor() {
  const { project: currentProject, isPending, perform } = useWorkspace();
  const project = currentProject!;
  const scope = `project:${project.id}`, busy = isPending(scope);
  const notifyDraft = () => window.dispatchEvent(new CustomEvent('specflow-draft-change', { detail: { projectId: project.id } }));
  const [name, setName] = useState<'AGENT.md' | 'AGENTS.md'>(project.guidance?.files[0]?.name || 'AGENT.md');
  const file = project.guidance?.files.find(f => f.name === name);
  const key = `specflow-guidance-draft-${project.id}-${name}`;
  const initial = (): Draft => { const content = file?.content || '# 项目章程\n\n## 工程原则\n- 需求与任务具有稳定 ID。\n- 代码改动必须有可运行的测试。\n- 需求、设计和实现需要独立复核。\n'; return { content, baseContent: file?.content || '', expectedHash: file?.contentHash || null }; };
  const readDraft = (): Draft => { const memory = sessionDrafts.get(key); if (memory) return memory; try { const stored = JSON.parse(localStorage.getItem(key) || 'null'); return stored && typeof stored.content === 'string' && typeof stored.baseContent === 'string' && (stored.expectedHash === null || typeof stored.expectedHash === 'string') ? stored : initial(); } catch { return initial(); } };
  const [draft, setDraft] = useState<Draft>(readDraft);
  const [storageError, setStorageError] = useState(() => storageFailures.has(key));
  const loadedKey = useRef(key);
  const dirty = draft.content !== draft.baseContent, conflict = dirty && draft.expectedHash !== (file?.contentHash || null);
  useEffect(() => {
    if (loadedKey.current !== key) { loadedKey.current = key; setDraft(readDraft()); setStorageError(storageFailures.has(key)); return; }
    if (!dirty && draft.expectedHash !== (file?.contentHash || null)) setDraft(initial());
  }, [key, file?.contentHash]);
  const clearDraft = () => { sessionDrafts.delete(key); storageFailures.delete(key); try { localStorage.removeItem(key); } catch {} setStorageError(false); notifyDraft(); };
  const reset = () => { clearDraft(); setDraft(initial()); };
  const canSave = !busy && !conflict && dirty && !!draft.content.trim();
  const save = () => perform(async () => { const guidance = await api(`/projects/${project.id}/guidance`, { name, content: draft.content, expectedHash: draft.expectedHash }); const saved = guidance.files.find((f: any) => f.name === name); clearDraft(); setDraft({ content: saved.content, baseContent: saved.content, expectedHash: saved.contentHash }); }, '项目章程已保存到仓库；新尝试使用此内容', scope);
  useEffect(() => { notifyDraft(); return () => { notifyDraft(); }; }, [project.id]);
  return <section className="guidance-editor" onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 's' || event.key === 'Enter') && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); event.stopPropagation(); if (canSave) void save(); } }}><div className="requirements-subheading"><h3><FileText size={15} /> 项目章程</h3><button className="text-button" disabled={busy} onClick={() => perform(() => api(`/projects/${project.id}/guidance/refresh`, {}), '项目章程已从仓库重新读取', scope)}><RefreshCcw size={14} /> 刷新读取</button></div>{project.guidanceError && <div className="blocker-box"><div><strong>项目章程读取失败</strong><p>{project.guidanceError}</p><p>请修复文件内容后刷新读取，读取恢复前无法启动工程步骤。</p></div></div>}<p className="requirements-hint">读取仓库根目录的 AGENT.md 和 AGENTS.md。章程内容会随需求、设计、实现及复核固定到每次尝试中。</p><label className="field">项目章程文件<select aria-label="项目章程文件" value={name} disabled={busy} onChange={e => setName(e.target.value as typeof name)}><option>AGENT.md</option><option>AGENTS.md</option></select></label><div className="guidance-source"><code>{project.rootPath}/{name}</code><span>{file ? `内容 ${short(file.contentHash)}` : '保存后创建此文件'}</span></div><label className="field">章程正文<textarea aria-label="项目章程正文" rows={7} value={draft.content} disabled={busy} onChange={e => { const next = { ...draft, content: e.target.value }; setDraft(next); if (next.content === next.baseContent) { clearDraft(); return; } sessionDrafts.set(key, next); try { localStorage.setItem(key, JSON.stringify(next)); storageFailures.delete(key); setStorageError(false); } catch { storageFailures.add(key); setStorageError(true); } notifyDraft(); }} spellCheck={false} /></label>{storageError && <p className="form-note" role="status">浏览器存储不可用，章程草稿仅保留在当前窗口。请保存到仓库后再关闭窗口。</p>}{conflict && <div className="blocker-box"><div><strong>仓库章程已有新内容，草稿已保留</strong><details><summary>查看仓库当前内容</summary><pre>{file?.content || '文件已删除'}</pre></details><button className="text-button" onClick={reset}>载入当前内容</button></div></div>}<div className="guidance-actions"><small>保存到仓库后生效，已有工程结果会提示过期。Ctrl+S / Ctrl+Enter 保存。</small><button className="outline-button" disabled={!canSave} onClick={save}><Save size={14} /> 保存项目章程</button></div></section>;
}
