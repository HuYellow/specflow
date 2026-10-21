import { t } from './i18n.ts';
import { Fragment, useMemo, type ReactNode } from 'react';
import { safeMarkdownHref } from './review-model.ts';

function inline(text: string): ReactNode[] {
  const token = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|!?\[[^\]]+\]\([^)]+\))/g;
  const output: ReactNode[] = []; let offset = 0, match: RegExpExecArray | null;
  while ((match = token.exec(text))) {
    output.push(text.slice(offset, match.index)); const value = match[0], key = match.index;
    if (value.startsWith('`')) output.push(<code key={key}>{value.slice(1, -1)}</code>);
    else if (value.startsWith('**') || value.startsWith('__')) output.push(<strong key={key}>{value.slice(2, -2)}</strong>);
    else if (value.startsWith('*')) output.push(<em key={key}>{value.slice(1, -1)}</em>);
    else {
      const link = /^(!?)\[([^\]]+)\]\(([^)]+)\)$/.exec(value)!;
      const href = safeMarkdownHref(link[3]);
      output.push(href && !link[1] ? <a key={key} href={href} target={href.startsWith('#') ? undefined : '_blank'} rel="noreferrer">{link[2]}</a> : <Fragment key={key}>{link[1] ? t("[图片：{value0}]", { value0: link[2] }) : link[2]}</Fragment>);
    }
    offset = token.lastIndex;
  }
  output.push(text.slice(offset)); return output;
}

export function MarkdownView({ content, idPrefix = 'document', onSelectText }: { content: string; idPrefix?: string; onSelectText?(text: string): void }) {
  const imagePlaceholder = t('[图片：{value0}]', { value0: '' });
  const parsed = useMemo(() => {
    const blocks: ReactNode[] = [], headings: { id: string; text: string; depth: number }[] = [];
    const lines = content.replace(/\r\n/g, '\n').split('\n'); let i = 0;
    const isBoundary = (line: string) => /^(?:\s*$|#{1,6}\s|```|~~~|\s*[-*+]\s|\s*\d+\.\s|>\s?|\s*(?:---+|\*\*\*+)\s*$)/.test(line);
    while (i < lines.length) {
      const start = i, line = lines[i];
      if (!line.trim()) { i++; continue; }
      const fence = /^\s*(`{3,}|~{3,})(.*)$/.exec(line);
      if (fence) {
        i++; const code: string[] = [];
        while (i < lines.length && !lines[i].trimStart().startsWith(fence[1])) code.push(lines[i++]);
        i++; blocks.push(<pre key={start}><code>{code.join('\n')}</code></pre>); continue;
      }
      const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
      if (heading) {
        const depth = heading[1].length, id = `${idPrefix}-heading-${headings.length}`;
        headings.push({ id, text: heading[2], depth }); const Tag = `h${depth}` as 'h1';
        blocks.push(<Tag key={start} id={id} tabIndex={-1}>{inline(heading[2])}</Tag>); i++; continue;
      }
      if (/^\s*(?:---+|\*\*\*+)\s*$/.test(line)) { blocks.push(<hr key={start} />); i++; continue; }
      if (/^>/.test(line)) {
        const quote: string[] = []; while (i < lines.length && /^>/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ''));
        blocks.push(<blockquote key={start}>{inline(quote.join('\n'))}</blockquote>); continue;
      }
      const list = /^\s*(?:([-*+])|(\d+)\.)\s+(.+)$/.exec(line);
      if (list) {
        const ordered = !!list[2], items: ReactNode[] = [];
        while (i < lines.length) {
          const item = /^\s*(?:([-*+])|(\d+)\.)\s+(.+)$/.exec(lines[i]);
          if (!item || !!item[2] !== ordered) break;
          items.push(<li key={i}>{inline(item[3])}</li>); i++;
        }
        blocks.push(ordered ? <ol key={start} start={Number(list[2])}>{items}</ol> : <ul key={start}>{items}</ul>); continue;
      }
      if (line.includes('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
        const cells = (value: string) => value.trim().replace(/^\||\|$/g, '').split('|').map(value => value.trim());
        const header = cells(line); i += 2; const rows: string[][] = [];
        while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(cells(lines[i++]));
        blocks.push(<div className="markdown-table-scroll" key={start}><table><thead><tr>{header.map((cell, n) => <th key={n}>{inline(cell)}</th>)}</tr></thead><tbody>{rows.map((row, n) => <tr key={n}>{row.map((cell, c) => <td key={c}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>); continue;
      }
      const paragraph: string[] = [line]; i++;
      while (i < lines.length && !isBoundary(lines[i])) paragraph.push(lines[i++]);
      blocks.push(<p key={start}>{inline(paragraph.join('\n'))}</p>);
    }
    return { blocks, headings };
  }, [content, idPrefix, imagePlaceholder]);
  return <div className="markdown-layout">{parsed.headings.length > 0 && <nav className="markdown-toc" aria-label={t("文档目录")}><strong>{t("目录")}</strong>{parsed.headings.map(heading => <a key={heading.id} href={`#${heading.id}`} style={{ paddingInlineStart: `${Math.min(heading.depth - 1, 3) * 10}px` }}>{heading.text}</a>)}</nav>}<article className="markdown-document" aria-label={t("Markdown 预览")} onMouseUp={() => { const selection = window.getSelection(); if (selection && selection.toString()) onSelectText?.(selection.toString()); }}>{parsed.blocks}</article></div>;
}
