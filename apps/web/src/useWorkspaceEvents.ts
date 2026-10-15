import { useEffect, useRef, useState } from 'react';
import { affectsSelection, parseWorkspaceEvent } from './eventState.ts';

export type EventConnection = 'connecting' | 'online' | 'reconnecting';
/** SSE carries invalidations. Received ids are not acknowledged until the refresh succeeds. */
export function useWorkspaceEvents(refresh: (bootstrap: boolean) => Promise<void>, selection: { projectId: string; itemId: string }) {
  const [connection, setConnection] = useState<EventConnection>('connecting');
  const latest = useRef({ refresh, selection }); latest.current = { refresh, selection };
  useEffect(() => {
    let active = true, source: EventSource | undefined, timer: ReturnType<typeof setTimeout> | undefined;
    let inFlight = false, dirty = false, bootDirty = false, received = 0, applied = 0, resyncSeq: number | undefined;
    const key = `specflow-event-cursor:${window.location.origin}`;
    try { const saved = Number(sessionStorage.getItem(key)); if (Number.isSafeInteger(saved) && saved >= 0) applied = received = saved; } catch {}
    const acknowledge = (seq: number) => { applied = seq; try { sessionStorage.setItem(key, String(seq)); } catch {} };
    const schedule = (delay = 300) => { if (!timer && active) timer = setTimeout(() => { timer = undefined; void flush(); }, delay); };
    const flush = async () => {
      if (inFlight || !active || (!dirty && resyncSeq === undefined)) return;
      inFlight = true;
      const through = resyncSeq ?? received, needsBootstrap = bootDirty || resyncSeq !== undefined;
      dirty = false; bootDirty = false;
      try {
        await latest.current.refresh(needsBootstrap);
        if (!active) return;
        acknowledge(through);
        if (resyncSeq !== undefined) { received = through; resyncSeq = undefined; connect(); }
      } catch {
        if (active) { dirty = true; bootDirty ||= needsBootstrap; schedule(1800); }
      } finally { inFlight = false; if (active && dirty) schedule(); }
    };
    const connect = () => {
      if (!active) return;
      source?.close();
      source = new EventSource(`/api/events?after=${applied}`);
      source.onopen = () => { if (active) setConnection('online'); };
      source.onerror = () => { if (active) { setConnection('reconnecting'); if (dirty) schedule(1500); } };
      source.onmessage = message => {
        if (!active) return;
        const event = parseWorkspaceEvent(message.data);
        if (!event) { dirty = bootDirty = true; schedule(); return; }
        if (event.seq <= received) return;
        received = event.seq;
        if (affectsSelection(event, latest.current.selection)) {
          dirty = true;
          bootDirty ||= !event.workItemId || /projects|workItems/i.test(event.kind);
          schedule();
        } else if (!dirty && !inFlight) acknowledge(received);
      };
      source.addEventListener('resync', message => {
        if (!active) return;
        let seq = 0;
        try { seq = JSON.parse((message as MessageEvent).data).latestSeq; } catch {}
        if (!Number.isSafeInteger(seq) || seq < 0) return;
        source?.close(); resyncSeq = seq; dirty = bootDirty = true; setConnection('reconnecting'); schedule(0);
      });
    };
    connect();
    const onVisible = () => { if (document.visibilityState === 'visible' && dirty) schedule(0); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; source?.close(); if (timer) clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, []);
  return connection;
}
