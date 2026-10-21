import { useSyncExternalStore } from 'react';
import { formatDate, normalizeLocale, translate, type Locale, type MessageValues } from '../../../packages/i18n/index.ts';
export type { Locale } from '../../../packages/i18n/index.ts';

const preferenceKey = 'specflow-locale';
function initialLocale(): Locale {
  if (typeof window === 'undefined') return 'zh-CN';
  // The desktop preference is shared with native menus and survives changes of the local server port.
  if (window.specflowDesktop?.initialLocale) return window.specflowDesktop.initialLocale;
  try { const saved = localStorage.getItem(preferenceKey); if (saved === 'en' || saved === 'zh-CN') return saved; } catch {}
  return normalizeLocale(navigator.languages?.length ? navigator.languages : navigator.language);
}
let locale: Locale = initialLocale();
const listeners = new Set<() => void>();
export const getLocale = () => locale;
export const t = (source: string, values?: MessageValues) => translate(source, locale, values);
export const localizedDate = (date?: string) => formatDate(date, locale);
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const useLocale = () => useSyncExternalStore(subscribe, getLocale, getLocale);
export function applyDocumentLocale() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
  document.title = t('SpecFlow · 工程工作台');
}
export async function setLocale(next: Locale, options: { updateDocument?: boolean } = {}) {
  if (next !== 'en' && next !== 'zh-CN') return;
  // Native persistence must succeed before reporting that the preference was saved.
  if (typeof window !== 'undefined' && window.specflowDesktop?.setLocale) await window.specflowDesktop.setLocale(next);
  locale = next;
  try { localStorage.setItem(preferenceKey, next); } catch {}
  if (options.updateDocument !== false) applyDocumentLocale();
  for (const listener of listeners) listener();
}
/** Keep module-level status dictionaries live when the interface language changes. */
export const localizedLabels = (labels: Record<string, string>): Record<string, string> => new Proxy(labels, { get: (target, key, receiver) => { const value = Reflect.get(target, key, receiver); return typeof value === 'string' ? t(value) : value; } });
