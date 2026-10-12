let token = '';
export class ApiError extends Error { constructor(message: string, public code: string, public details?: unknown) { super(message); } }
export async function api<T = any>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Specflow-Token': token, 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new ApiError(data.message, data.code, data.details);
  if (path === '/bootstrap') token = data.token;
  return data;
}
