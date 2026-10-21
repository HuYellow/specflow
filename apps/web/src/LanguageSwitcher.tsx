import { useState } from 'react';
import { Languages } from 'lucide-react';
import { setLocale, t, useLocale, type Locale } from './i18n.ts';

export function LanguageSwitcher() {
  const locale = useLocale();
  const [saving, setSaving] = useState(false), [error, setError] = useState(false);
  return <div className="language-control"><label className="language-switcher" title={t('界面语言')}><Languages size={16} aria-hidden="true" /><select aria-label={t('界面语言')} value={locale} disabled={saving} onChange={async event => {
    const next = event.target.value as Locale;
    setSaving(true); setError(false);
    try { await setLocale(next); } catch { setError(true); } finally { setSaving(false); }
  }}><option value="zh-CN" lang="zh-CN">中文</option><option value="en" lang="en">English</option></select></label>{error && <span className="language-error" role="alert">{t('无法保存语言设置，请重试。')}</span>}</div>;
}
