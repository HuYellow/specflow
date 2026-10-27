import { assert, hash, type ContextManifest, type ContextManifestEntry } from '../domain/index.ts';

export interface ContextSource {
  sourceId: string;
  revision?: string;
  content: string;
  contentHash?: string;
  visibleContent?: string;
  required?: boolean;
  purpose?: string;
  delivery?: 'inline' | 'reference';
}

/** This records visibility; it never removes or summarizes the caller's prompt. */
export function buildContextManifest(sources: ContextSource[], options: { prompt?: string; maxBytes?: number } = {}): ContextManifest {
  const byId = new Map<string, ContextManifestEntry>();
  const unique = new Map<string, number>();
  for (const source of sources) {
    assert(source.sourceId.trim(), 'CONTEXT_INVALID', '上下文材料必须具有 sourceId');
    const contentHash = hash(source.content);
    assert(!source.contentHash || source.contentHash === contentHash, 'CONTEXT_INVALID', `上下文材料 ${source.sourceId} 的内容哈希不匹配`);
    const visible = source.visibleContent ?? source.content;
    const entry: ContextManifestEntry = { sourceId: source.sourceId, ...(source.revision ? { revision: source.revision } : {}), contentHash,
      visibleContentHash: hash(visible), bytes: Buffer.byteLength(visible, 'utf8'), required: source.required ?? true,
      purpose: source.purpose || 'stage-input', delivery: source.delivery || 'inline' };
    const previous = byId.get(source.sourceId);
    assert(!previous || JSON.stringify(previous) === JSON.stringify(entry), 'CONTEXT_INVALID', `上下文材料 ${source.sourceId} 存在冲突版本`);
    byId.set(source.sourceId, entry);
    if (entry.delivery === 'inline') unique.set(entry.visibleContentHash, entry.bytes);
  }
  const entries = [...byId.values()];
  const totalBytes = entries.filter(entry => entry.delivery === 'inline').reduce((sum, entry) => sum + entry.bytes, 0);
  const promptBytes = options.prompt === undefined ? undefined : Buffer.byteLength(options.prompt, 'utf8');
  if (options.maxBytes !== undefined) {
    assert(Number.isSafeInteger(options.maxBytes) && options.maxBytes > 0, 'CONTEXT_INVALID', '上下文字节上限必须为正整数');
    assert(promptBytes !== undefined, 'CONTEXT_INVALID', '检查派发字节上限必须提供实际完整提示词');
    assert(promptBytes <= options.maxBytes, 'INPUT_TOO_LARGE', '完整阶段输入超过底座文本上限；请缩小材料，不得静默截断', { actualBytes: promptBytes, maxBytes: options.maxBytes, sources: entries.map(entry => ({ sourceId: entry.sourceId, bytes: entry.bytes })) });
  }
  const manifest = { version: 1 as const, entries, totalBytes, uniqueBytes: [...unique.values()].reduce((sum, bytes) => sum + bytes, 0), ...(promptBytes === undefined ? {} : { promptBytes }) };
  return { ...manifest, manifestHash: hash(JSON.stringify(manifest)) };
}
