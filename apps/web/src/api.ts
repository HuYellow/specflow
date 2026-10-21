import { getLocale, t } from './i18n.ts';
let token = '';
export class ApiError extends Error { constructor(message: string, public code: string, public details?: unknown, public uncertain = false, public operationKey?: string) { super(message); } }
export async function api<T = any>(path: string, body?: unknown, options: { idempotencyKey?: string; signal?: AbortSignal } = {}): Promise<T> {
  const operationKey = body === undefined ? undefined : options.idempotencyKey || crypto.randomUUID();
  let response: Response;
  try {
    response = await fetch(`/api${path}`, body === undefined ? { signal: options.signal, headers: { 'Accept-Language': getLocale() } } : { method: 'POST', signal: options.signal, headers: { 'Content-Type': 'application/json', 'Accept-Language': getLocale(), 'X-Specflow-Token': token, 'Idempotency-Key': operationKey! }, body: JSON.stringify(body) });
  } catch {
    throw new ApiError(t(body === undefined ? '无法连接本地服务，请确认服务已启动后重试。' : '写入结果尚未确认，请先刷新核对工程记录，避免重复派发。'), 'NETWORK_ERROR', undefined, body !== undefined, operationKey);
  }
  let data;
  try { data = await response.json(); }
  catch { throw new ApiError(t(body === undefined ? '本地服务返回了无法读取的响应，请刷新重试。' : '本次写入的响应无法读取，请先刷新核对结果。'), 'INVALID_RESPONSE', undefined, body !== undefined, operationKey); }
  if (!response.ok) {
    const uncertain = body !== undefined && response.status >= 500;
    throw new ApiError(uncertain ? t('{0}；结果尚未确认，请先核对工程记录。', { 0: t(data.message || '服务端写入响应异常') }) : t(data.message || '服务端写入响应异常'), data.code, data.details, uncertain, operationKey);
  }
  if (path === '/bootstrap') token = data.token;
  return data;
}
