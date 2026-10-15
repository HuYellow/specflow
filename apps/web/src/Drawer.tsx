import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useModalFocus } from './useModalFocus.ts';

export function Drawer({ title, close, children, returnFocus }: { title: string; close(): void; children: ReactNode; returnFocus?: React.RefObject<HTMLElement | null> }) {
  const panel = useRef<HTMLElement>(null);
  useModalFocus(panel, true, close, returnFocus);
  useEffect(() => { if (panel.current && !panel.current.contains(document.activeElement)) panel.current.querySelector<HTMLElement>('button')?.focus(); }, [title]);
  return <div className="detail-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}><section ref={panel} tabIndex={-1} className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="detail-drawer-title"><header className="detail-drawer-heading"><div><span className="eyebrow">当前工作项</span><h2 id="detail-drawer-title">{title}</h2></div><button className="icon-button" aria-label="关闭详情" onClick={close}><X size={19} /></button></header>{children}</section></div>;
}
