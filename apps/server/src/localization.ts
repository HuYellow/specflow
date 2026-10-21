import { englishMessages, translate, type Locale } from '../../../packages/i18n/index.ts';

type RecordValue = Record<string, any>;
const object = (value: unknown): value is RecordValue => !!value && typeof value === 'object' && !Array.isArray(value);

/** Localize only documented UI metadata. Artifact bodies, names, logs and identities remain verbatim. */
export function localizeApiResponse(path: string, status: number, value: unknown, locale: Locale): unknown {
  if (locale !== 'en' || !object(value)) return value;
  const text = (input: unknown) => {
    if (typeof input !== 'string') return input;
    // Review validation composes two app-owned diagnostics; identifiers inside the inner template remain unchanged.
    if (input.startsWith('审核报告无效：')) return translate('审核报告无效：{0}', locale, { 0: translate(input.slice('审核报告无效：'.length), locale) });
    const direct = translate(input, locale);
    if (Object.hasOwn(englishMessages, input) || !input.includes('；')) return direct;
    const parts = input.split('；'), translated = parts.map(part => translate(part, locale));
    return parts.every((part, index) => part !== translated[index]) ? translated.join('; ') : direct;
  };
  const node = (input: RecordValue) => ({ ...input,
    ...(Array.isArray(input.blockers) ? { blockers: input.blockers.map(text) } : {}),
    ...(typeof input.error === 'string' ? { error: text(input.error) } : {}),
  });
  if (status >= 400) return { ...value, message: text(value.message),
    ...(value.code === 'WORKFLOW_INVALID' && Array.isArray(value.details) ? { details: value.details.map((error: RecordValue) => ({ ...error, message: text(error.message) })) } : {}),
  };
  const pathname = path.split('?')[0];
  // Evidence exports are canonical records, independent of the current UI language.
  if (/^\/api\/work-items\/[^/]+\/export$/.test(pathname)) return value;
  if (/^\/api\/work-items\/[^/]+$/.test(pathname)) return { ...value,
    nodes: Array.isArray(value.nodes) ? value.nodes.map(node) : value.nodes,
    attempts: Array.isArray(value.attempts) ? value.attempts.map((attempt: RecordValue) => ({ ...attempt, ...(typeof attempt.error === 'string' ? { error: text(attempt.error) } : {}) })) : value.attempts,
  };
  if (/^\/api\/node-runs\/[^/]+\/readiness$/.test(pathname)) return { ...value, reasons: value.reasons?.map(text) };
  if (/^\/api\/code-candidates\/[^/]+\/acceptance-precheck$/.test(pathname)) return { ...value,
    blockers: value.blockers?.map((blocker: RecordValue) => ({ ...blocker, message: text(blocker.message) })),
  };
  if (pathname === '/api/backend/targets') {
    const capabilities = (input: RecordValue) => ({ ...input, ...(typeof input.reason === 'string' ? { reason: text(input.reason) } : {}) });
    const backends = value.backends?.map((backend: RecordValue) => ({ ...backend,
      name: backend.id === 'sandbox' ? text(backend.name) : backend.name,
      capabilities: capabilities(backend.capabilities),
    }));
    return { ...value, backends, ...Object.fromEntries((backends || []).filter((backend: RecordValue) => object(value[backend.id])).map((backend: RecordValue) => [backend.id, capabilities(value[backend.id])])) };
  }
  if (/^\/api\/candidates\/[^/]+\/review-diff$/.test(pathname)) return { ...value,
    files: value.files?.map((file: RecordValue) => ({ ...file, ...(typeof file.reason === 'string' ? { reason: text(file.reason) } : {}) })),
  };
  if (/^\/api\/candidates\/[^/]+\/review-file$/.test(pathname)) return { ...value, ...(typeof value.reason === 'string' ? { reason: text(value.reason) } : {}) };
  if (pathname === '/api/workflows/validate') return { ...value, errors: value.errors?.map((error: RecordValue) => ({ ...error, message: text(error.message) })) };
  if (/^\/api\/work-items\/[^/]+\/import$/.test(pathname)) return { ...value, message: text(value.message) };
  if (/^\/api\/attempts\/[^/]+$/.test(pathname)) return { ...value, ...(typeof value.error === 'string' ? { error: text(value.error) } : {}) };
  if (/^\/api\/work-items\/[^/]+\/attempts$/.test(pathname)) return { ...value,
    items: value.items?.map((attempt: RecordValue) => ({ ...attempt, ...(typeof attempt.error === 'string' ? { error: text(attempt.error) } : {}) })),
  };
  // Commands may return a single node state, but their other fields are user data.
  if (typeof value.workflowRunId === 'string' && typeof value.nodeId === 'string') return node(value);
  return value;
}
