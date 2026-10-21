import { t } from './i18n.ts';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { countChanges, type ReviewLine } from './review-model.ts';

export function DiffRows({ lines, split = false }: { lines: ReviewLine[]; split?: boolean }) {
  if (split) {
    const rows: { left?: ReviewLine; right?: ReviewLine }[] = [];
    for (let i = 0; i < lines.length;) {
      if (lines[i].kind === 'context' || lines[i].kind === 'note') { rows.push({ left: lines[i], right: lines[i++] }); continue; }
      const removed: ReviewLine[] = [], added: ReviewLine[] = [];
      while (i < lines.length && lines[i].kind !== 'context' && lines[i].kind !== 'note') { const line = lines[i++]; (line.kind === 'removed' ? removed : added).push(line); }
      for (let n = 0; n < Math.max(removed.length, added.length); n++) rows.push({ left: removed[n], right: added[n] });
    }
    return <div className="review-lines split-lines">{rows.map((row, index) => <div className="split-row" key={index}><div className={`review-line ${row.left?.kind || 'empty'}`}><span className="line-number">{row.left?.oldLine}</span><code>{row.left?.text || ' '}</code></div><div className={`review-line ${row.right?.kind || 'empty'}`}><span className="line-number">{row.right?.newLine}</span><code>{row.right?.text || ' '}</code></div></div>)}</div>;
  }
  return <div className="review-lines">{lines.map((line, index) => <div className={`review-line ${line.kind}`} key={index} tabIndex={-1}><span className="line-number" aria-label={line.oldLine === undefined ? undefined : t("原行 {value0}", { value0: line.oldLine })}>{line.oldLine}</span><span className="line-number" aria-label={line.newLine === undefined ? undefined : t("新行 {value0}", { value0: line.newLine })}>{line.newLine}</span><span className="line-sign" aria-hidden="true">{line.kind === 'added' ? '+' : line.kind === 'removed' ? '−' : ' '}</span><code>{line.text || ' '}</code></div>)}</div>;
}

export function DocumentDiff({ lines, beforeLabel, afterLabel }: { lines: ReviewLine[]; beforeLabel: string; afterLabel: string }) {
  const [selected, setSelected] = useState(0), container = useRef<HTMLDivElement>(null);
  const changes = useMemo(() => lines.map((line, i) => line.kind !== 'context' && (i === 0 || lines[i - 1].kind === 'context') ? i : -1).filter(i => i >= 0), [lines]);
  const stats = useMemo(() => countChanges(lines), [lines]);
  useEffect(() => { setSelected(0); }, [lines]);
  function jump(direction: number) {
    if (!changes.length) return;
    const next = (selected + direction + changes.length) % changes.length; setSelected(next);
    const row = container.current?.querySelectorAll<HTMLElement>('.review-line')[changes[next]];
    row?.scrollIntoView({ block: 'center', behavior: 'auto' }); row?.focus({ preventScroll: true });
  }
  return <section className="document-diff"><div className="review-toolbar"><span>{beforeLabel} → {afterLabel}</span><strong className="review-stat">+{stats.added} / −{stats.removed}</strong><div className="change-navigation"><button className="icon-button" aria-label={t("上一处变更")} disabled={!changes.length} onClick={() => jump(-1)}><ArrowUp size={14} /></button><span>{changes.length ? `${selected + 1} / ${changes.length}` : t("无变更")}</span><button className="icon-button" aria-label={t("下一处变更")} disabled={!changes.length} onClick={() => jump(1)}><ArrowDown size={14} /></button></div></div><div className="document-diff-scroll" ref={container}><DiffRows lines={lines} /></div></section>;
}
