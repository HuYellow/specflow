import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DomainError, id, now, type Entities, type Entity, type Kind } from '../domain/index.ts';

export class Store {
  readonly db: DatabaseSync;
  private depth = 0;
  constructor(path: string) {
    const existed = path !== ':memory:' && existsSync(path);
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    const version = (this.db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
    if (existed && version < 2 && this.db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='entities'").get()) {
      // Preserve a consistent pre-upgrade copy before writing new control records.
      const backup = `${path}.before-agent-loops-v2-${Date.now()}-${id().slice(0, 8)}.sqlite`;
      this.db.prepare('VACUUM INTO ?').run(backup);
    }
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS entities(kind TEXT NOT NULL,id TEXT NOT NULL,revision INTEGER NOT NULL,data TEXT NOT NULL,PRIMARY KEY(kind,id));
      CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY AUTOINCREMENT,entityId TEXT NOT NULL,kind TEXT NOT NULL,payload TEXT NOT NULL,createdAt TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS requests(key TEXT PRIMARY KEY,operation TEXT NOT NULL,result TEXT NOT NULL);`);
    const columns = this.db.prepare('PRAGMA table_info(events)').all() as { name: string }[];
    for (const name of ['workItemId', 'projectId']) if (!columns.some(column => column.name === name)) this.db.exec(`ALTER TABLE events ADD COLUMN ${name} TEXT`);
    if (version < 2) this.db.exec('PRAGMA user_version=2');
  }
  create<K extends Kind>(kind: K, data: Omit<Entities[K], keyof Entity>): Entities[K] {
    const item = { ...data, id: id(), revision: 1, createdAt: now(), updatedAt: now() } as Entities[K];
    this.db.prepare('INSERT INTO entities VALUES(?,?,?,?)').run(kind, item.id, 1, JSON.stringify(item));
    this.emit(item.id, `${kind}.created`, { revision: 1 });
    return item;
  }
  get<K extends Kind>(kind: K, entityId: string): Entities[K] {
    const row = this.db.prepare('SELECT data FROM entities WHERE kind=? AND id=?').get(kind, entityId) as { data: string } | undefined;
    if (!row) throw new DomainError('NOT_FOUND', '记录不存在', 404, { kind, id: entityId });
    return JSON.parse(row.data);
  }
  list<K extends Kind>(kind: K, predicate?: (item: Entities[K]) => boolean): Entities[K][] {
    const rows = this.db.prepare('SELECT data FROM entities WHERE kind=? ORDER BY rowid').all(kind) as { data: string }[];
    const items = rows.map(x => JSON.parse(x.data) as Entities[K]); return predicate ? items.filter(predicate) : items;
  }
  update<K extends Kind>(kind: K, entityId: string, patch: Partial<Entities[K]>, expected?: number): Entities[K] {
    const previous = this.get(kind, entityId);
    if (expected !== undefined && expected !== previous.revision) throw new DomainError('REVISION_CONFLICT', '记录已经变化，请比较最新版本', 409, previous);
    const item = { ...previous, ...patch, id: entityId, revision: previous.revision + 1, updatedAt: now() };
    const result = this.db.prepare('UPDATE entities SET data=?,revision=? WHERE kind=? AND id=? AND revision=?').run(JSON.stringify(item), item.revision, kind, entityId, previous.revision);
    if (!result.changes) throw new DomainError('REVISION_CONFLICT', '记录已被另一进程修改');
    this.emit(entityId, `${kind}.updated`, { revision: item.revision });
    return item;
  }
  tx<T>(fn: () => T): T {
    if (this.depth) return fn();
    this.db.exec('BEGIN IMMEDIATE'); this.depth++;
    try { const result = fn(); this.db.exec('COMMIT'); return result; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
    finally { this.depth--; }
  }
  private eventScope(entityId: string, visited = new Set<string>()): { workItemId?: string; projectId?: string } {
    if (visited.has(entityId)) return {}; visited.add(entityId);
    const row = this.db.prepare('SELECT kind,data FROM entities WHERE id=? LIMIT 1').get(entityId) as { kind: Kind; data: string } | undefined;
    if (!row) return {};
    const entity = JSON.parse(row.data);
    if (row.kind === 'projects') return { projectId: entityId };
    if (row.kind === 'workItems') return { workItemId: entityId, projectId: entity.projectId };
    if (entity.workItemId) return { ...this.eventScope(entity.workItemId, visited), workItemId: entity.workItemId };
    for (const key of ['workflowRunId', 'nodeRunId', 'attemptId', 'artifactId', 'artifactRevisionId', 'candidateId', 'sessionId']) if (entity[key]) return this.eventScope(entity[key], visited);
    return {};
  }
  emit(entityId: string, kind: string, payload: unknown) {
    const scope = this.eventScope(entityId);
    this.db.prepare('INSERT INTO events(entityId,kind,payload,createdAt,workItemId,projectId) VALUES(?,?,?,?,?,?)').run(entityId, kind, JSON.stringify(payload), now(), scope.workItemId || null, scope.projectId || null);
  }
  eventCursor(after: number) {
    const bounds = this.db.prepare('SELECT MIN(seq) AS first,MAX(seq) AS last FROM events').get() as { first: number | null; last: number | null };
    const latestSeq = bounds.last || 0;
    const exists = after === 0 ? bounds.first === null || bounds.first === 1 : !!this.db.prepare('SELECT seq FROM events WHERE seq=?').get(after);
    return { recoverable: exists && after <= latestSeq, latestSeq };
  }
  events(after = 0) {
    if (!Number.isSafeInteger(after) || after < 0) throw new DomainError('EVENT_CURSOR_INVALID', '事件游标必须为非负安全整数', 400);
    return (this.db.prepare('SELECT * FROM events WHERE seq>? ORDER BY seq LIMIT 200').all(after) as { seq: number; entityId: string; kind: string; payload: string; createdAt: string; workItemId: string | null; projectId: string | null }[]).map(x => ({ ...x, workItemId: x.workItemId || undefined, projectId: x.projectId || undefined, payload: JSON.parse(x.payload) }));
  }
  receipt(key: string, operation: string): unknown | undefined {
    const row = this.db.prepare('SELECT operation,result FROM requests WHERE key=?').get(key) as { operation: string; result: string } | undefined;
    if (!row) return undefined;
    if (row.operation !== operation) throw new DomainError('IDEMPOTENCY_CONFLICT', '幂等键已经用于不同操作');
    return JSON.parse(row.result);
  }
  saveReceipt(key: string, operation: string, result: unknown) { this.db.prepare('INSERT INTO requests VALUES(?,?,?)').run(key, operation, JSON.stringify(result)); }
  close() { this.db.close(); }
}
