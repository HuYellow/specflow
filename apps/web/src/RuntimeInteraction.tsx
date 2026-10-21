import { t } from './i18n.ts';
import { useState, type KeyboardEvent } from 'react';
import type { Interaction } from '../../../packages/domain/index.ts';
import { useWorkspace } from './context.tsx';
import { api } from './api.ts';

type Option = { label: string; value: string };
type Field = { name: string; label: string; kind: string; default?: string | number | boolean; required: boolean; options: Option[] };
type Question = { question: string; options: string[] };
type Request = { kind: string; message?: string; questions?: Question[]; fields?: Field[]; raw: Record<string, unknown> };
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
export function parseRuntimeRequest(value: unknown): Request | undefined {
  if (!object(value) || typeof value.kind !== 'string') return undefined;
  if (value.kind === 'question') {
    if (!Array.isArray(value.questions) || value.questions.some(question => !object(question) || typeof question.question !== 'string')) return undefined;
    return { kind: value.kind, raw: value, questions: value.questions.map(question => ({ question: question.question as string, options: Array.isArray(question.options) ? question.options.flatMap((option: unknown) => typeof option === 'string' ? [option] : object(option) && typeof option.label === 'string' ? [option.label] : []) : [] })) };
  }
  if (value.kind === 'form') {
    if (!Array.isArray(value.fields) || value.fields.some(field => !object(field) || typeof field.name !== 'string' || typeof field.kind !== 'string')) return undefined;
    return { kind: value.kind, raw: value, message: typeof value.message === 'string' ? value.message : undefined, fields: value.fields.map(field => ({ name: field.name as string, label: typeof field.label === 'string' ? field.label : field.name as string, kind: field.kind as string, default: ['string', 'number', 'boolean'].includes(typeof field.default) ? field.default as Field['default'] : undefined, required: field.required === true, options: Array.isArray(field.options) ? field.options.flatMap((option: unknown) => object(option) && typeof option.value === 'string' ? [{ value: option.value, label: typeof option.label === 'string' ? option.label : option.value }] : []) : [] })) };
  }
  return { kind: value.kind, raw: value };
}
const windowDrafts = new Map<string, Record<string, string | number | boolean>>();
export function InteractionCard({ interaction }: { interaction: Interaction }) {
  const { snapshot, isPending, perform } = useWorkspace();
  const request = parseRuntimeRequest(interaction.request), key = `specflow-interaction:${interaction.id}`;
  const originAttempt = snapshot?.attempts.find(attempt => attempt.id === interaction.attemptId);
  const scope = `attempt:${interaction.attemptId}`, nodeId = originAttempt?.nodeRunId;
  const pending = snapshot?.item.status === 'accepted' || isPending(scope) || !!nodeId && isPending(`node:${nodeId}`);
  const [values, setValues] = useState<Record<string, string | number | boolean>>(() => { try { return windowDrafts.get(key) || JSON.parse(localStorage.getItem(key) || '{}'); } catch { return windowDrafts.get(key) || {}; } });
  const [storageError, setStorageError] = useState(false);
  const change = (name: string, value: string | number | boolean) => { const next = { ...values, [name]: value }; setValues(next); windowDrafts.set(key, next); try { localStorage.setItem(key, JSON.stringify(next)); setStorageError(false); } catch { setStorageError(true); } };
  const answer = (data: unknown) => perform(async () => {
    await api(`/interactions/${interaction.id}/answer`, { answer: data });
    windowDrafts.delete(key); try { localStorage.removeItem(key); } catch {}
  }, t('答复已提交，执行结果以底座确认状态为准'), scope);
  if (!request) return <div className="interaction-card" role="alert"><h3>{t("无法解析执行请求")}</h3><p>{t("请求字段不完整。请保留原执行并核对，尚未提交任何答复。")}</p><details><summary>{t("查看原始请求")}</summary><pre>{JSON.stringify(interaction.request, null, 2)}</pre></details></div>;
  const questions = request.questions || [], fields = request.fields || [];
  const canSubmit = !pending && (request.kind === 'question' ? questions.every((_, index) => typeof values[index] === 'string' && String(values[index]).trim()) : fields.every(field => {
    const value = values[field.name] ?? field.default;
    return (!field.required || (value !== undefined && value !== '')) && (!['number', 'integer'].includes(field.kind) || value === undefined || value === '' || typeof value === 'number' && Number.isFinite(value) && (field.kind !== 'integer' || Number.isInteger(value)));
  }));
  const submit = () => {
    if (!canSubmit) return;
    if (request.kind === 'question') void answer({ kind: 'question', answers: questions.map((_, index) => values[index] || null) });
    else if (request.kind === 'form') void answer({ kind: 'form', action: 'accept', values: Object.fromEntries(fields.map(field => [field.name, values[field.name] ?? field.default ?? ''])) });
  };
  const shortcut = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); submit(); } };
  const prompt = object(request.raw.prompt) ? request.raw.prompt : undefined;
  // OpenCode's adapter owns this permission wrapper; model questions and tool arguments stay verbatim.
  const hint = typeof prompt?.hint === 'string' ? originAttempt?.target.backend === 'opencode' && request.kind === 'permission' ? t(prompt.hint) : prompt.hint : undefined;
  return <section className="interaction-card" aria-label={t("待处理执行交互")} onKeyDown={shortcut}><h3>{request.kind === 'question' ? t('补充工程信息') : request.kind === 'form' ? request.message || t('完成执行信息') : request.kind === 'permission' ? t('确认工具操作') : t('确认执行范围')}</h3>
    {request.kind === 'question' ? questions.map((question, index) => <label className="field" key={index}>{question.question}<div className="runtime-options">{question.options.map(option => <button type="button" key={option} disabled={pending} aria-pressed={values[index] === option} onClick={() => change(String(index), option)}>{option}</button>)}</div><textarea rows={3} aria-label={t("执行问题 {value1}", { value1: index + 1 })} value={String(values[index] || '')} disabled={pending} onChange={event => change(String(index), event.target.value)} /></label>) : request.kind === 'form' ? fields.map(field => <label className="field" key={field.name}>{field.label}{field.required ? ' *' : ''}{field.kind === 'single_select' ? <select value={String(values[field.name] ?? field.default ?? '')} disabled={pending} onChange={event => change(field.name, event.target.value)}><option value="">{t("请选择")}</option>{field.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field.kind === 'boolean' ? <input type="checkbox" checked={Boolean(values[field.name] ?? field.default ?? false)} disabled={pending} onChange={event => change(field.name, event.target.checked)} /> : ['number', 'integer'].includes(field.kind) ? <input type="number" step={field.kind === 'integer' ? '1' : 'any'} value={String(values[field.name] ?? field.default ?? '')} disabled={pending} onChange={event => change(field.name, event.target.value === '' ? '' : Number(event.target.value))} /> : <textarea rows={2} value={String(values[field.name] ?? field.default ?? '')} disabled={pending} onChange={event => change(field.name, event.target.value)} />}</label>) : <><p>{hint !== undefined ? hint : typeof request.raw.justification === 'string' ? request.raw.justification : t('本次请求需要明确授权。')}</p>{typeof prompt?.toolName === 'string' && <strong>{prompt.toolName}</strong>}<details open><summary>{t("请求参数")}</summary><pre>{JSON.stringify(prompt?.args || request.raw.expansion || request.raw.target || request.raw, null, 2)}</pre></details></>}
    {storageError && <p role="status">{t("存储不可用，草稿仅保留在当前窗口。")}</p>}
    <div className="run-actions">{['question', 'form'].includes(request.kind) ? <><button className="primary-button" disabled={!canSubmit} onClick={submit}>{pending ? t('提交中…') : request.kind === 'question' ? t('提交回答') : t('提交表单')}</button>{request.kind === 'form' && <button className="outline-button" disabled={pending} onClick={() => void answer({ kind: 'form', action: 'decline' })}>{t("拒绝")}</button>}<span className="shortcut-hint">{t("Enter 换行 · Ctrl/Cmd+Enter 提交")}</span></> : <><button className="outline-button" disabled={pending} onClick={() => void answer({ kind: request.kind, decision: 'deny', ...(request.kind === 'permission' ? { rememberForTurn: false } : {}) })}>{t("拒绝")}</button><button className="primary-button" disabled={pending} onClick={() => void answer({ kind: request.kind, decision: 'allow', ...(request.kind === 'permission' ? { rememberForTurn: false } : {}) })}>{t("允许一次")}</button></>}</div>
  </section>;
}
