export type DraftAnswers = Record<string, string>;
export type SavedClarificationDraft = { revision: number; answers: DraftAnswers };
type DraftWriter = (sessionId: string, expectedRevision: number, answers: DraftAnswers) => Promise<SavedClarificationDraft>;
type Entry = { confirmed: SavedClarificationDraft; tail: Promise<void>; pending: number; error?: unknown; listeners: Set<() => void> };
const sameAnswers = (first: DraftAnswers, second: DraftAnswers) => {
  const keys = Object.keys(first); return keys.length === Object.keys(second).length && keys.every(key => first[key] === second[key]);
};

/** One window owns one queue per session, so remounts share completed revisions and in-flight writes. */
export class ClarificationDraftQueue {
  private entries = new Map<string, Entry>();
  constructor(private readonly write: DraftWriter) {}
  private entry(sessionId: string, initial: SavedClarificationDraft): Entry {
    let entry = this.entries.get(sessionId);
    if (!entry) { entry = { confirmed: { revision: initial.revision, answers: { ...initial.answers } }, tail: Promise.resolve(), pending: 0, listeners: new Set() }; this.entries.set(sessionId, entry); }
    return entry;
  }
  private emit(entry: Entry) { for (const listener of entry.listeners) listener(); }
  state(sessionId: string) {
    const entry = this.entries.get(sessionId);
    return { saving: !!entry?.pending, error: entry?.error, confirmed: entry?.confirmed };
  }
  subscribe(sessionId: string, initial: SavedClarificationDraft, listener: () => void) {
    const entry = this.entry(sessionId, initial); entry.listeners.add(listener);
    return () => { entry.listeners.delete(listener); };
  }
  isSaved(sessionId: string, observed: SavedClarificationDraft, answers: DraftAnswers) {
    const entry = this.entries.get(sessionId);
    return !!entry && !entry.error && !entry.pending && observed.revision <= entry.confirmed.revision && sameAnswers(entry.confirmed.answers, answers);
  }
  save(sessionId: string, observed: SavedClarificationDraft, answers: DraftAnswers): Promise<SavedClarificationDraft> {
    const entry = this.entry(sessionId, observed), submitted = { ...answers };
    entry.pending++; this.emit(entry);
    const result = entry.tail.then(async () => {
      if (entry.error) throw entry.error;
      // A newer server snapshot cannot be explained by this window's completed write.
      if (observed.revision > entry.confirmed.revision) throw new Error('其他编辑者已更新答复草稿，请比较后保存');
      if (sameAnswers(entry.confirmed.answers, submitted)) return entry.confirmed;
      const saved = await this.write(sessionId, entry.confirmed.revision, submitted);
      entry.confirmed = { revision: saved.revision, answers: { ...saved.answers } };
      return entry.confirmed;
    }).catch(error => { entry.error = error; throw error; }).finally(() => { entry.pending--; this.emit(entry); });
    entry.tail = result.then(() => undefined, () => undefined);
    return result;
  }
  /** Called only after the user compares the current server draft and explicitly keeps local answers. */
  acknowledge(sessionId: string, observed: SavedClarificationDraft) {
    const entry = this.entry(sessionId, observed);
    if (entry.pending) throw new Error('答复草稿仍在保存，请等待后再处理冲突');
    entry.confirmed = { revision: observed.revision, answers: { ...observed.answers } }; entry.error = undefined; this.emit(entry);
  }
}
