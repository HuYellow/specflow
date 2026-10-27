import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { Workspaces } from '../packages/specflow-core/workspaces.ts';
import { treeHash } from '../packages/verification-runner/index.ts';

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'specflow-snapshot-test-')), repo = join(root, 'repo');
  await mkdir(repo); const workspaces = new Workspaces(join(root, 'data'));
  await workspaces.git(repo, ['init']);
  await writeFile(join(repo, 'source.txt'), 'accepted source\n');
  await writeFile(join(repo, '.gitignore'), '*.private\n');
  await mkdir(join(repo, '.specflow')); await writeFile(join(repo, '.specflow', 'approved.md'), 'approved\n');
  await workspaces.git(repo, ['add', '--all']);
  await workspaces.git(repo, ['-c', 'user.name=Test', '-c', 'user.email=test@localhost', 'commit', '-m', 'accepted']);
  const acceptedCommit = await workspaces.git(repo, ['rev-parse', 'HEAD']);
  const failed = await workspaces.create(repo, acceptedCommit, 'failed');
  return { root, repo, workspaces, acceptedCommit, failed, cleanup: async () => {
    assert.ok(resolve(root).startsWith(resolve(tmpdir())) && basename(root).startsWith('specflow-snapshot-test-'));
    await rm(root, { recursive: true, force: true });
  } };
}
test('失败候选快照保留源码和未跟踪文件；派生幂等且不修改源候选 HEAD/index', async () => {
  const f = await fixture();
  try {
    await writeFile(join(f.failed.workspace, 'source.txt'), 'staged failure\n');
    await f.workspaces.git(f.failed.workspace, ['add', 'source.txt']);
    await writeFile(join(f.failed.workspace, 'source.txt'), 'unstaged failed implementation\n');
    await writeFile(join(f.failed.workspace, 'new-file.txt'), 'untracked failure evidence\n');
    await writeFile(join(f.failed.workspace, '.specflow', 'approved.md'), 'unaccepted metadata\n');
    const indexBefore = await f.workspaces.git(f.failed.workspace, ['diff', '--cached']);
    const expectedHash = await treeHash(f.failed.workspace);
    const snapshot = await f.workspaces.snapshotCandidate(f.failed.workspace, expectedHash, 'operation-one');
    assert.notEqual(snapshot.seedCommit, f.acceptedCommit, '失败快照不是接纳基线');
    assert.equal(await f.workspaces.git(f.failed.workspace, ['rev-parse', 'HEAD']), f.acceptedCommit);
    assert.equal(await f.workspaces.git(f.failed.workspace, ['diff', '--cached']), indexBefore);
    const seeded = await f.workspaces.createFromSnapshot(f.repo, snapshot.seedCommit, 'operation-one', expectedHash);
    assert.equal(await readFile(join(seeded.workspace, 'source.txt'), 'utf8'), 'unstaged failed implementation\n');
    assert.equal(await readFile(join(seeded.workspace, 'new-file.txt'), 'utf8'), 'untracked failure evidence\n');
    assert.equal(await readFile(join(seeded.workspace, '.specflow', 'approved.md'), 'utf8'), 'approved\n');
    assert.equal(await treeHash(seeded.workspace), expectedHash);
    assert.deepEqual(await f.workspaces.snapshotCandidate(f.failed.workspace, expectedHash, 'operation-one'), snapshot);
    assert.deepEqual(await f.workspaces.createFromSnapshot(f.repo, snapshot.seedCommit, 'operation-one', expectedHash), seeded);
    await assert.rejects(f.workspaces.snapshotCandidate(f.failed.workspace, 'different-hash', 'operation-one'), /其他候选/);
    await writeFile(join(seeded.workspace, 'source.txt'), 'external change\n');
    await assert.rejects(f.workspaces.createFromSnapshot(f.repo, snapshot.seedCommit, 'operation-one', expectedHash), /完整恢复/);
  } finally { await f.cleanup(); }
});
test('源候选漂移、无效操作路径、未入 Git 的忽略文件都不能被默认为已恢复', async () => {
  const f = await fixture();
  try {
    const previousHash = await treeHash(f.failed.workspace);
    await writeFile(join(f.failed.workspace, 'source.txt'), 'outside edit\n');
    await assert.rejects(f.workspaces.snapshotCandidate(f.failed.workspace, previousHash, 'drift'), /变化/);
    await assert.rejects(f.workspaces.snapshotCandidate(f.failed.workspace, previousHash, '../escape'), /非法/);
    await writeFile(join(f.failed.workspace, 'secret.private'), 'ignored data\n');
    const expectedHash = await treeHash(f.failed.workspace);
    const snapshot = await f.workspaces.snapshotCandidate(f.failed.workspace, expectedHash, 'ignored-file');
    await assert.rejects(f.workspaces.createFromSnapshot(f.repo, snapshot.seedCommit, 'ignored-file', expectedHash), /完整恢复/);
    assert.equal(await readFile(join(f.failed.workspace, 'secret.private'), 'utf8'), 'ignored data\n');
  } finally { await f.cleanup(); }
});
