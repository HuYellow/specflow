import { t } from './i18n.ts';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PanelRightClose, PanelRightOpen, X } from 'lucide-react';
import { useModalFocus } from './useModalFocus.ts';
import { contextPaneSizing } from './flowSelectors.ts';

const MIN_WIDTH = 280, MAX_WIDTH = 400, DEFAULT_WIDTH = 320;
const clampWidth = (value: number) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));

/** A nonmodal desktop inspector becomes a focus-managed drawer before space runs out. */
export function ResizablePane({ children, context, overlayOpen = false }: { children: ReactNode; context: ReactNode; overlayOpen?: boolean }) {
  const shell = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth), [containerWidth, setContainerWidth] = useState(0);
  const [spaceCollapsed, setSpaceCollapsed] = useState(false);
  const [collapsed, setCollapsed] = useState(false), [drawerOpen, setDrawerOpen] = useState(false);
  const [width, setWidth] = useState(() => {
    try { const saved = Number(localStorage.getItem('specflow-context-width')); return Number.isFinite(saved) && saved > 0 ? clampWidth(saved) : DEFAULT_WIDTH; } catch { return DEFAULT_WIDTH; }
  });
  const separator = useRef<HTMLDivElement>(null), drawer = useRef<HTMLElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ pointerId: number; startX: number; startWidth: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  const sizing = contextPaneSizing(containerWidth);
  const wide = viewportWidth >= 1120 && sizing.inlineAllowed && !spaceCollapsed;
  const maxWidth = Math.max(MIN_WIDTH, sizing.maxWidth), paneWidth = Math.min(width, maxWidth);
  const modalActive = drawerOpen && !wide && !overlayOpen;
  useModalFocus(drawer, modalActive, () => setDrawerOpen(false), trigger);
  useLayoutEffect(() => {
    if (!shell.current) return;
    const measure = () => {
      const available = shell.current!.getBoundingClientRect().width;
      setContainerWidth(available);
      // Latch an automatic collapse until a wider viewport band or an explicit reopen.
      if (window.innerWidth >= 1120 && !contextPaneSizing(available).inlineAllowed) setSpaceCollapsed(true);
    };
    const observer = new ResizeObserver(measure);
    measure(); observer.observe(shell.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const band = (value: number) => value >= 1360 ? 2 : value >= 1120 ? 1 : 0;
    let previous = band(window.innerWidth);
    const change = () => {
      const next = band(window.innerWidth);
      if (next > previous) { setSpaceCollapsed(false); setCollapsed(false); }
      previous = next; setViewportWidth(window.innerWidth); setDrawerOpen(false);
    };
    window.addEventListener('resize', change);
    return () => window.removeEventListener('resize', change);
  }, []);
  useEffect(() => { if (overlayOpen) setDrawerOpen(false); }, [overlayOpen]);
  useLayoutEffect(() => {
    if (!modalActive) return;
    const root = document.getElementById('root');
    if (!root) return;
    const previous = root.inert;
    root.inert = true;
    return () => { root.inert = previous; };
  }, [modalActive]);
  useEffect(() => { try { localStorage.setItem('specflow-context-width', String(width)); } catch {} }, [width]);
  const finishDrag = (cancelled = false) => {
    const original = drag.current;
    if (!original) return;
    drag.current = null; setDragging(false);
    if (cancelled) setWidth(original.startWidth);
    if (separator.current?.hasPointerCapture(original.pointerId)) separator.current.releasePointerCapture(original.pointerId);
  };
  useEffect(() => {
    if (!dragging) return;
    const previous = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    const cancel = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); finishDrag(true); } };
    window.addEventListener('keydown', cancel);
    return () => { document.body.style.userSelect = previous; window.removeEventListener('keydown', cancel); };
  }, [dragging]);
  useEffect(() => { if (!wide || collapsed) finishDrag(true); }, [wide, collapsed]);
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const original = drag.current;
    if (!original || original.pointerId !== event.pointerId) return;
    const delta = original.startX - event.clientX;
    if (!original.moved && Math.abs(delta) < 4) return;
    original.moved = true; setWidth(Math.min(maxWidth, clampWidth(original.startWidth + delta)));
  };
  const shown = wide && !collapsed;
  return <div ref={shell} className="flow-pane-shell">
    <div className="flow-layout-controls"><button ref={trigger} className="text-button" aria-expanded={wide ? shown : modalActive} aria-controls="flow-step-context" onClick={() => { if (wide) setCollapsed(!collapsed); else if (viewportWidth >= 1120 && sizing.inlineAllowed) { setSpaceCollapsed(false); setCollapsed(false); } else setDrawerOpen(!drawerOpen); }}>{shown ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}{shown ? t("收起上下文") : t("步骤上下文")}</button></div>
    <div className={`flow-workbench${shown ? ' has-context' : ''}${dragging ? ' is-resizing' : ''}`} style={{ '--flow-context-width': `${paneWidth}px` } as CSSProperties}>
      <section className="flow-workspace-primary">{children}</section>
      {shown && <div ref={separator} className="flow-pane-separator" role="separator" tabIndex={0} aria-label={t("调整步骤上下文宽度")} aria-controls="flow-step-context" aria-orientation="vertical" aria-valuemin={MIN_WIDTH} aria-valuemax={maxWidth} aria-valuenow={paneWidth}
        onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); event.currentTarget.focus(); drag.current = { pointerId: event.pointerId, startX: event.clientX, startWidth: paneWidth, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); }}
        onPointerMove={move} onPointerUp={() => finishDrag()} onPointerCancel={() => finishDrag(true)} onLostPointerCapture={() => finishDrag(true)} onDoubleClick={() => setWidth(DEFAULT_WIDTH)}
        onKeyDown={event => { const step = event.shiftKey ? 40 : 10; if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); setWidth(event.key === 'Home' ? MIN_WIDTH : event.key === 'End' ? maxWidth : Math.min(maxWidth, clampWidth(paneWidth + (event.key === 'ArrowLeft' ? step : -step)))); } }} />}
      {shown && <aside id="flow-step-context" className="flow-context inspector" aria-label={t("步骤上下文")}>{context}</aside>}
    </div>
    {modalActive && createPortal(<div className="flow-context-backdrop" onClick={event => { if (event.target === event.currentTarget) setDrawerOpen(false); }}><aside ref={drawer} id="flow-step-context" className="flow-context flow-context-drawer inspector" role="dialog" aria-modal="true" aria-label={t("步骤上下文")} tabIndex={-1}><div className="flow-context-drawer-heading"><strong>{t("步骤上下文")}</strong><button className="icon-button" aria-label={t("关闭步骤上下文")} onClick={() => setDrawerOpen(false)}><X size={19} /></button></div>{context}</aside></div>, document.body)}
  </div>;
}
