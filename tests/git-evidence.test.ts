import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fixture } from './helpers.ts';

test('UTF-8 byte truncation cannot be accepted as complete Git review evidence', async () => {
  const f = await fixture();
  try {
    await writeFile(join(f.item.workspace, 'large.txt'), '需'.repeat(400000));
    await f.service.workspaces.checkpoint(f.item.workspace, 'Large UTF-8 evidence fixture');
    await assert.rejects(f.service.workspaces.reviewDiff(f.item.workspace, f.item.baseCommit), error => (error as { code?: string }).code === 'REVIEW_CONTEXT_TOO_LARGE');
  } finally { await f.cleanup(); }
});
