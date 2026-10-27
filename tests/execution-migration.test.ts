import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../packages/specflow-core/store.ts';

test('legacy stores receive one consistent backup and never fabricate historical policy or usage', async () => {
  const root = await mkdtemp(join(tmpdir(), 'specflow-migration-')), file = join(root, 'old.sqlite');
  try {
    const old = new DatabaseSync(file);
    old.exec('CREATE TABLE entities(kind TEXT NOT NULL,id TEXT NOT NULL,revision INTEGER NOT NULL,data TEXT NOT NULL,PRIMARY KEY(kind,id))');
    const record = { id: 'legacy-attempt', revision: 1, nodeRunId: 'node', execution: 'completed' };
    old.prepare('INSERT INTO entities VALUES(?,?,?,?)').run('attempts', record.id, 1, JSON.stringify(record));
    old.close();
    const store = new Store(file);
    assert.deepEqual(store.get('attempts', record.id), record);
    assert.equal((store.db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version, 2);
    store.close();
    const backups = (await readdir(root)).filter(name => name.includes('before-agent-loops-v2'));
    assert.equal(backups.length, 1);
    const backup = new DatabaseSync(join(root, backups[0]), { readOnly: true });
    assert.equal((backup.prepare('PRAGMA user_version').get() as { user_version: number }).user_version, 0);
    assert.equal((backup.prepare('SELECT data FROM entities').get() as { data: string }).data, JSON.stringify(record));
    backup.close();
    new Store(file).close();
    assert.equal((await readdir(root)).filter(name => name.includes('before-agent-loops-v2')).length, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});
