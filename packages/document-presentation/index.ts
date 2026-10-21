import { z } from 'zod';
import type { ArtifactRevision, HumanBrief, HumanReading } from '../domain/index.ts';
import { translate, type Locale } from '../i18n/index.ts';

// Briefs contain plain content. Layout and escaping belong to the renderer.
export const humanBriefSchema = z.object({
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(600),
  sections: z.array(z.object({ title: z.string().trim().min(1).max(120), items: z.array(z.string().trim().min(1).max(300)).min(1).max(6) })).min(1).max(6),
});

// Preserve technical notation (IDs, generics, comparison operators and strikeout).
// The view treats every excerpt as text, so raw markup is safe and stays visible.
const plain = (value: string) => value.replace(/\s+/g, ' ').trim();
function excerpt(value: string, limit: number) {
  const chars = Array.from(value);
  return chars.length <= limit ? value : `${chars.slice(0, limit - 1).join('')}…`;
}

/** Honest bounded excerpts for imports, manual edits and pre-existing revisions. */
export function extractBrief(content: string, logicalId: string, locale: Locale = 'zh-CN'): HumanBrief {
  const t = (source: string) => translate(source, locale);
  const sections: HumanBrief['sections'] = [];
  const defaultTitle = translate('{0} 阅读摘要', locale, { 0: logicalId });
  let title = defaultTitle, current: HumanBrief['sections'][number] | undefined, summary = '', fence = '';
  for (const line of content.split(/\r?\n/)) {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) { if (!fence) fence = marker[1][0]; else if (marker[1][0] === fence) fence = ''; continue; }
    if (fence || !line.trim() || /^\s*(?:---+|===+|\|?[\s:|-]+\|)\s*$/.test(line)) continue;
    const heading = line.match(/^(#{1,6})\s+(.+)/);
    if (heading) {
      const label = plain(heading[2]);
      if (heading[1].length === 1 && title === defaultTitle) { title = excerpt(label || title, 120); continue; }
      current = { title: excerpt(label || t('文档要点'), 120), items: [] };
      sections.push(current); continue;
    }
    const text = plain(line.replace(/^\s*(?:[-+*]\s+(?:\[[ xX]\]\s*)?|\d+[.)]\s*|>\s*)/, ''));
    if (!text) continue;
    if (!summary) summary = excerpt(text, 360);
    if (!current) { current = { title: t('文档要点'), items: [] }; sections.push(current); }
    if (current.items.length < 4) current.items.push(excerpt(text, 240));
  }
  const bounded = sections.filter(section => section.items.length).slice(0, 6);
  if (!bounded.length) bounded.push({ title: t('阅读提示'), items: [t('正文没有可摘录的段落，请查看 AI 执行文档。')] });
  return { title, summary: summary || t('请查看完整执行文档中的详细内容。'), sections: bounded };
}

export function createReading(revision: ArtifactRevision, logicalId: string, locale: Locale = 'zh-CN'): HumanReading {
  const authored = revision.humanBriefSourceHash === revision.contentHash ? humanBriefSchema.safeParse(revision.humanBrief) : undefined;
  const brief = authored?.success ? authored.data : extractBrief(revision.content, logicalId, locale);
  const mode = authored?.success ? 'authored' : 'extractive';
  return { schemaVersion: 1, sourceRevisionId: revision.id, sourceContentHash: revision.contentHash, brief, mode };
}

const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

/** A self-contained offline page. No model HTML, scripts, network assets or dependencies. */
export function renderReadingHtml(reading: HumanReading, logicalId: string, locale: Locale = 'zh-CN'): string {
  const { brief } = reading;
  const t = (source: string) => escape(translate(source, locale));
  return `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<meta name="color-scheme" content="light dark"><title>${escape(brief.title)} · SpecFlow</title>
<style>
:root{color-scheme:light dark;--paper:#f5f3eb;--ink:#232e2b;--muted:#68746b;--line:#d6dbcf;--accent:#315c43;--panel:#fffef8}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.8 Georgia,'Noto Serif SC','Songti SC',serif}main{max-width:1120px;margin:auto;padding:44px 38px 64px}.masthead{display:flex;justify-content:space-between;gap:20px;align-items:baseline;border-bottom:2px solid var(--ink);padding-bottom:16px;font:12px/1.5 'Segoe UI','Microsoft YaHei',sans-serif;letter-spacing:.12em}.brand{font-weight:700}.label{color:var(--accent)}header{max-width:850px;padding:36px 0 26px}h1{font-size:clamp(28px,4.4vw,46px);line-height:1.3;letter-spacing:-.03em;margin:0 0 18px;font-weight:600}.lead{font-size:19px;line-height:1.9;margin:0;color:var(--ink);white-space:pre-wrap}.notice{border-left:3px solid var(--accent);padding:10px 16px;margin:0 0 28px;color:var(--muted);font:13px/1.8 'Segoe UI','Microsoft YaHei',sans-serif}.panels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.panel{padding:22px 24px;border:1px solid var(--line);background:var(--panel);min-width:0}.panel-heading{display:flex;align-items:baseline;gap:14px;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:16px}.number{font:12px/1.5 ui-monospace,monospace;color:var(--accent)}h2{font-size:19px;line-height:1.5;margin:0;font-weight:600}ul{margin:0;padding-left:20px}li{padding-left:4px;margin:10px 0;white-space:pre-wrap;overflow-wrap:anywhere}footer{margin-top:32px;padding-top:20px;border-top:1px solid var(--line);color:var(--muted);font:12px/1.9 ui-monospace,'Microsoft YaHei',monospace;overflow-wrap:anywhere}.source{margin-bottom:10px}a{color:var(--accent);text-underline-offset:3px}code{font:inherit}p{overflow-wrap:anywhere}@media(prefers-color-scheme:dark){:root{--paper:#19231e;--ink:#e7e9df;--muted:#acb9ad;--line:#3c4b40;--accent:#a9cfac;--panel:#202d24}}@media(max-width:680px){main{padding:24px 18px 40px}.panels{grid-template-columns:1fr}.masthead{letter-spacing:.04em}.panel{padding:18px}.lead{font-size:17px}}@media print{:root{--paper:white;--ink:#17251b;--muted:#555;--line:#bbb;--accent:#284a34;--panel:white}main{padding:0;max-width:none}.panel{break-inside:avoid}.panels{gap:12px}h1{font-size:30px}}
</style></head><body><main>
<div class="masthead"><span class="brand">SPECFLOW / ${t('阅读简报')}</span><span class="label">${escape(logicalId.toUpperCase())}</span></div>
<header><h1>${escape(brief.title)}</h1><p class="lead">${escape(brief.summary)}</p></header>
<p class="notice">${t(reading.mode === 'authored' ? '本页是对应修订的人类简报。' : '本页摘录原文中的部分段落，可能省略上下文。')} ${t('后续执行、复核与接纳以完整 AI 执行文档为准。')}</p>
<div class="panels">${brief.sections.map((section, index) => `<section class="panel"><div class="panel-heading"><span class="number">${String(index + 1).padStart(2, '0')}</span><h2>${escape(section.title)}</h2></div><ul>${section.items.map(item => `<li>${escape(item)}</li>`).join('')}</ul></section>`).join('')}</div>
<footer><div class="source">${t('完整文档：')}<a href="${encodeURIComponent(logicalId)}.md">${escape(logicalId)}.md</a></div><div>${t('来源版本：')}<code>${escape(reading.sourceRevisionId)}</code></div><div>SHA-256：<code>${escape(reading.sourceContentHash)}</code></div><div>${t('本页随来源版本生成，可离线阅读与打印。')}</div></footer>
</main></body></html>`;
}
