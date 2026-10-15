import { useEffect, useState } from 'react';
import { Activity, ChevronRight, Loader2, RefreshCcw } from 'lucide-react';
import type { AttemptPage } from '../../../packages/ui-contracts/index.ts';
import { api } from './api.ts';
import { fmt, labels, targetLabel, useWorkspace } from './context.tsx';
import { RunDetail } from './RunDetail.tsx';
export { RunDetail } from './RunDetail.tsx';

export function Runs() {
  const { snapshot, selectedAttempt, setSelectedAttempt } = useWorkspace();
  const [state, setState] = useState(''), [nodeId, setNodeId] = useState(''), [offset, setOffset] = useState(0);
  const [page, setPage] = useState<AttemptPage>(), [error, setError] = useState(''), [loading, setLoading] = useState(false), [retry, setRetry] = useState(0);
  const itemId = snapshot?.item.id;
  const version = snapshot?.attempts.map(attempt => `${attempt.id}:${attempt.revision}`).join(',');
  useEffect(() => {
    if (!itemId) return;
    let active = true; setLoading(true); setError('');
    const query = new URLSearchParams({ offset: String(offset), limit: '30' });
    if (state) query.set('state', state); if (nodeId) query.set('nodeRunId', nodeId);
    void api<AttemptPage>(`/work-items/${itemId}/attempts?${query}`).then(value => { if (active) setPage(value); }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [itemId, version, state, nodeId, offset, retry]);
  const attemptId = selectedAttempt || snapshot?.attempts.at(-1)?.id || '';
  return <div className="run-layout"><section className="attempt-list"><div className="panel-heading"><h2>运行记录 <span>{page?.total ?? snapshot?.attempts.length ?? 0}</span></h2></div>
    <div className="run-filters"><label>步骤<select aria-label="筛选运行步骤" value={nodeId} onChange={event => { setNodeId(event.target.value); setOffset(0); }}>{<option value="">全部步骤</option>}{snapshot?.nodes.map(node => <option key={node.id} value={node.id}>{node.name}{node.workflowRunId !== snapshot.runs.at(-1)?.id ? ' · 历史运行' : ''}</option>)}</select></label><label>状态<select aria-label="筛选运行状态" value={state} onChange={event => { setState(event.target.value); setOffset(0); }}><option value="">全部状态</option>{['pending', 'starting', 'running', 'waiting_interaction', 'completed', 'failed', 'cancelled', 'reconciling'].map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></label></div>
    {loading && <p className="run-list-feedback" role="status"><Loader2 size={14} className="spin" />正在读取运行列表</p>}{error && <div className="run-list-feedback" role="alert"><p>{error}</p><button className="outline-button" onClick={() => setRetry(value => value + 1)}><RefreshCcw size={14} />重试读取列表</button></div>}
    {!loading && !error && !page?.items.length && <p className="attempt-list-empty">{state || nodeId ? '没有匹配的运行记录。' : '运行步骤后，尝试会出现在这里。'}</p>}
    {page?.items.map(attempt => <button key={attempt.id} className={attempt.id === attemptId ? 'active' : ''} onClick={() => setSelectedAttempt(attempt.id)}><span className={`attempt-dot ${attempt.execution}`} /><div><strong>{snapshot?.nodes.find(node => node.id === attempt.nodeRunId)?.name} <span>#{attempt.number}</span></strong><small>{targetLabel(attempt.target)}</small><small>{labels[attempt.execution]}{attempt.reviewPerspective ? ` · ${attempt.reviewPerspective === 'coverage' ? '需求覆盖' : '反例检查'}` : ''}</small><time>{fmt(attempt.startedAt)}</time></div><ChevronRight size={14} /></button>)}
    {page && <div className="run-pagination"><button className="outline-button" disabled={loading || offset === 0} onClick={() => setOffset(value => Math.max(0, value - 30))}>上一页</button><span>{page.total ? `${offset + 1}–${Math.min(offset + 30, page.total)} / ${page.total}` : '0 项'}</span><button className="outline-button" disabled={loading || page.nextOffset === undefined} onClick={() => setOffset(page.nextOffset!)}>下一页</button></div>}
  </section><RunDetail attemptId={attemptId} /></div>;
}
