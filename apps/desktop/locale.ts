import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { normalizeLocale, type Locale } from '../../packages/i18n/index.ts';

/** Language is a UI preference; it is separate from project data and view state. */
export function readDesktopLocale(path: string, systemLocale: string): Locale {
  try {
    const value = JSON.parse(readFileSync(path, 'utf8'));
    if (value.locale === 'en' || value.locale === 'zh-CN') return value.locale;
  } catch {}
  return normalizeLocale(systemLocale);
}

export function saveDesktopLocale(path: string, locale: unknown): Locale {
  if (locale !== 'en' && locale !== 'zh-CN') throw new Error('语言设置无效');
  const staging = `${path}.tmp`;
  writeFileSync(staging, JSON.stringify({ locale }), { encoding: 'utf8', mode: 0o600 });
  renameSync(staging, path);
  return locale;
}
