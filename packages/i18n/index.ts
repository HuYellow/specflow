import { messages as shell } from './web-shell.ts';
import { messages as documents } from './web-documents.ts';
import { messages as workflow } from './web-workflow.ts';
import { messages as server } from './server.ts';
import { messages as desktop } from './desktop.ts';
import { messages as defaults } from './defaults.ts';
import { messages as plugin } from './plugin.ts';

export type Locale = 'zh-CN' | 'en';
export type MessageValues = Record<string, string | number | null | undefined>;
export const englishMessages: Readonly<Record<string, string>> = Object.freeze({ ...plugin, ...server, ...desktop, ...defaults, ...shell, ...documents, ...workflow });

/** Select a supported language using the preference order, including HTTP quality values. */
export function normalizeLocale(value?: string | readonly string[] | null): Locale {
  const languageList = typeof value === 'string' ? value : value?.join(',') || '';
  const preferences = languageList.split(',').map((entry: string, index: number) => {
    const [language, ...parameters] = entry.trim().split(';');
    const quality = parameters.find(parameter => parameter.trim().startsWith('q='));
    return { language: language.toLowerCase(), weight: quality ? Number(quality.trim().slice(2)) : 1, index };
  }).filter(entry => entry.weight > 0 && entry.weight <= 1).sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const { language } of preferences) {
    if (/^en(?:[-_]|$)/.test(language)) return 'en';
    if (/^zh(?:[-_]|$)/.test(language)) return 'zh-CN';
  }
  return 'zh-CN';
}

const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const placeholder = /\{([a-zA-Z0-9_]+)\}/g;
const interpolate = (message: string, values: MessageValues) => message.replace(placeholder, (match, key: string) => Object.hasOwn(values, key) ? String(values[key] ?? '') : match);
const patterns = Object.entries(englishMessages).filter(([source]) => /\{[a-zA-Z0-9_]+\}/.test(source)).map(([source, translated]) => {
  const keys: string[] = [];
  let offset = 0, pattern = '';
  for (const match of source.matchAll(placeholder)) {
    pattern += escapePattern(source.slice(offset, match.index)) + '([\\s\\S]*?)';
    keys.push(match[1]); offset = match.index! + match[0].length;
  }
  pattern += escapePattern(source.slice(offset));
  return { pattern: new RegExp(`^${pattern}$`), keys, translated, specificity: source.replace(placeholder, '').length };
}).sort((a, b) => b.specificity - a.specificity);

/** Translate app-owned messages only. Unknown text remains verbatim. */
export function translate(source: string, locale: Locale, values: MessageValues = {}): string {
  if (locale !== 'en') return interpolate(source, values);
  if (Object.hasOwn(englishMessages, source)) return interpolate(englishMessages[source], values);
  // Legacy persisted errors contain already-interpolated values. Match complete known messages.
  if (source.length <= 32768 && /\p{Script=Han}/u.test(source)) for (const entry of patterns) {
    const match = entry.pattern.exec(source);
    if (match) return interpolate(entry.translated, Object.fromEntries(entry.keys.map((key, index) => [key, match[index + 1]])));
  }
  return interpolate(source, values);
}

export function formatDate(date: string | undefined, locale: Locale): string {
  if (!date) return '—';
  const value = new Date(date);
  if (!Number.isFinite(value.getTime())) return '—';
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).format(value);
}
