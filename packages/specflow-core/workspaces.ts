import { mkdir, realpath, readFile, stat, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { assert, id } from '../domain/index.ts';
import { execute, safePath, treeHash } from '../verification-runner/index.ts';
export class Workspaces {
  constructor(readonly dataDir: string) {}
  async git(cwd: string, args: string[]) {
    const result = await execute('git', ['-c', 'core.autocrlf=false', ...args], cwd, 120000);
    assert(result.exitCode === 0 && !result.timedOut && !result.cancelled && result.terminationConfirmed, 'GIT_FAILED', result.stderr || result.stdout || 'Git 操作失败');
    assert(!result.stdoutTruncated, 'REVIEW_CONTEXT_TOO_LARGE', 'Git 输出达到完整读取上限，请缩小候选改动；不能用截断的差异作为复核依据');
    return result.stdout.trim();
  }
  async inspect(path: string) {
    const rootPath = await realpath(path);
    const gitRoot = await this.git(rootPath, ['rev-parse', '--show-toplevel']);
    const canonical = await realpath(gitRoot);
    const baseCommit = await this.git(canonical, ['rev-parse', 'HEAD']);
    const dirty = await this.git(canonical, ['status', '--porcelain']);
    return { rootPath: canonical, baseCommit, dirty };
  }
  async create(root: string, commit: string, prefix: string) {
    const token = id(); const branch = `codex/specflow-${prefix}-${token.slice(0, 8)}`;
    const workspace = join(this.dataDir, 'workspaces', token);
    await mkdir(join(this.dataDir, 'workspaces'), { recursive: true });
    await this.git(root, ['worktree', 'add', '-b', branch, workspace, commit]);
    return { workspace, branch };
  }
  async checkpoint(workspace: string, message: string) {
    await this.git(workspace, ['add', '--all', '--', '.', ':(exclude).specflow']);
    const dirty = await this.git(workspace, ['diff', '--cached', '--name-only']);
    if (dirty) await this.git(workspace, ['-c', 'user.name=SpecFlow', '-c', 'user.email=specflow@localhost', 'commit', '-m', message]);
    return await this.git(workspace, ['rev-parse', 'HEAD']);
  }
  /** Integrate the whole candidate tree relative to the accepted baseline.
   * Picking only the last repair commit would omit its failed-but-useful seed.
   * The squash commit is an object only: the candidate keeps its checkpoint and
   * complete lineage instead of moving its branch to this integration commit. */
  async integrationCommit(workspace: string, baseCommit: string, message: string) {
    const checkpoint = await this.checkpoint(workspace, message);
    const tree = await this.git(workspace, ['rev-parse', `${checkpoint}^{tree}`]);
    const accepted = await this.git(workspace, ['rev-parse', '--verify', `${baseCommit}^{commit}`]);
    return this.git(workspace, ['-c', 'user.name=SpecFlow', '-c', 'user.email=specflow@localhost', 'commit-tree', tree, '-p', accepted, '-m', message]);
  }
  private snapshotNames(operationId: string) {
    assert(/^[a-zA-Z0-9_-]{1,80}$/.test(operationId), 'SNAPSHOT_ID_INVALID', '快照操作 ID 包含非法字符');
    return { ref: `refs/specflow/snapshots/${operationId}`, branch: `codex/specflow-repair-${operationId}`, workspace: join(this.dataDir, 'workspaces', `repair-${operationId}`), index: join(this.dataDir, 'snapshots', `${operationId}.index`) };
  }
  private async optionalRef(root: string, ref: string) {
    const result = await execute('git', ['rev-parse', '--verify', '--quiet', ref], root, 120000);
    if (result.exitCode === 1) return undefined;
    assert(result.exitCode === 0, 'GIT_FAILED', result.stderr || '无法读取 Git 身份');
    return result.stdout.trim();
  }
  /** Use a private index: a failed candidate snapshot must not change its HEAD,
   * branch, staging area, or working files. The ref makes crash replay durable. */
  async snapshotCandidate(workspace: string, expectedHash: string, operationId: string) {
    const names = this.snapshotNames(operationId);
    const existing = await this.optionalRef(workspace, names.ref);
    if (existing) {
      const message = await this.git(workspace, ['show', '-s', '--format=%B', existing]);
      assert(message === `SpecFlow failed candidate snapshot ${operationId}\n\ncontentHash: ${expectedHash}`, 'SNAPSHOT_CONFLICT', '快照操作已绑定其他候选内容');
      return { seedCommit: existing, contentHash: expectedHash, snapshotRef: names.ref };
    }
    assert(await treeHash(workspace) === expectedHash, 'CANDIDATE_DRIFT', '候选内容已变化，不能自动纳入修订快照');
    await mkdir(join(this.dataDir, 'snapshots'), { recursive: true });
    const gitWithIndex = async (args: string[]) => await new Promise<string>((done, reject) => {
      const child = spawn('git', ['-c', 'core.autocrlf=false', '-c', 'user.name=SpecFlow', '-c', 'user.email=specflow@localhost', ...args], { cwd: workspace, env: { ...process.env, GIT_INDEX_FILE: resolve(names.index) }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '', stderr = '', overflow = false;
      const timer = setTimeout(() => child.kill(), 120000);
      child.stdout.on('data', bytes => { stdout += bytes.toString(); if (stdout.length > 1_000_000) { overflow = true; child.kill(); } });
      child.stderr.on('data', bytes => { stderr = (stderr + bytes.toString()).slice(-10000); });
      child.on('error', error => { clearTimeout(timer); reject(error); });
      child.on('close', code => { clearTimeout(timer); try { assert(code === 0 && !overflow, 'GIT_FAILED', stderr || '快照 Git 操作失败'); done(stdout.trim()); } catch (error) { reject(error); } });
    });
    try {
      const parent = await this.git(workspace, ['rev-parse', 'HEAD']);
      await gitWithIndex(['read-tree', parent]);
      // Match the code/evidence boundary. Existing tracked excluded files remain
      // at their parent versions; ignored new files are not silently promoted.
      const excludes = ['.git', 'node_modules', '.specflow', '.specflow-data', 'dist', 'coverage', '.tools'].map(name => `:(exclude,glob)**/${name}/**`);
      await gitWithIndex(['add', '--all', '--', '.', ...excludes]);
      const tree = await gitWithIndex(['write-tree']);
      assert(await treeHash(workspace) === expectedHash, 'CANDIDATE_DRIFT', '快照读取期间候选发生变化');
      const message = `SpecFlow failed candidate snapshot ${operationId}\n\ncontentHash: ${expectedHash}`;
      const seedCommit = await gitWithIndex(['commit-tree', tree, '-p', parent, '-m', message]);
      await this.git(workspace, ['update-ref', names.ref, seedCommit, '']);
      return { seedCommit, contentHash: expectedHash, snapshotRef: names.ref };
    } finally { await unlink(names.index).catch((error: NodeJS.ErrnoException) => { if (error.code !== 'ENOENT') throw error; }); }
  }
  /** Caller journals the returned workspace before activating its Candidate.
   * Re-entry checks the same branch/commit/hash rather than creating a sibling. */
  async createFromSnapshot(root: string, seedCommit: string, operationId: string, expectedHash: string) {
    const names = this.snapshotNames(operationId);
    const recordedSeed = await this.optionalRef(root, names.ref);
    assert(recordedSeed === seedCommit, 'SNAPSHOT_CONFLICT', '派生提交与持久快照身份不一致');
    const existingPath = await stat(names.workspace).catch((error: NodeJS.ErrnoException) => { if (error.code === 'ENOENT') return undefined; throw error; });
    if (!existingPath) {
      await mkdir(join(this.dataDir, 'workspaces'), { recursive: true });
      const existingBranch = await this.optionalRef(root, `refs/heads/${names.branch}`);
      if (existingBranch) {
        assert(existingBranch === seedCommit, 'SNAPSHOT_CONFLICT', '修订分支已有不同提交');
        await this.git(root, ['worktree', 'add', names.workspace, names.branch]);
      } else await this.git(root, ['worktree', 'add', '-b', names.branch, names.workspace, seedCommit]);
    }
    assert(await this.git(names.workspace, ['rev-parse', 'HEAD']) === seedCommit, 'SNAPSHOT_CONFLICT', '修订工作区提交已变化');
    assert(await this.git(names.workspace, ['symbolic-ref', '--short', 'HEAD']) === names.branch, 'SNAPSHOT_CONFLICT', '修订工作区分支不匹配');
    assert(await treeHash(names.workspace) === expectedHash, 'SNAPSHOT_CONTENT_MISMATCH', '快照不能完整恢复候选内容；可能存在忽略文件或外部修改，保留现场并人工核对');
    return { workspace: names.workspace, branch: names.branch, seedCommit, contentHash: expectedHash };
  }
  async diff(workspace: string, base: string) {
    const tracked = await this.git(workspace, ['diff', base, '--', '.', ':(exclude).specflow']);
    const untracked = await this.git(workspace, ['ls-files', '--others', '--exclude-standard']);
    return tracked + (untracked ? `\n新增未跟踪文件：\n${untracked}` : '');
  }
  async reviewDiff(workspace: string, base: string) {
    let patch = await this.git(workspace, ['diff', '--no-ext-diff', '--no-textconv', base, '--', '.', ':(exclude).specflow']);
    const untracked = await this.git(workspace, ['-c', 'core.quotePath=false', 'ls-files', '--others', '--exclude-standard', '-z']);
    for (const name of untracked.split('\0').filter(Boolean)) {
      if (name.split(/[\\/]/).some(part => ['.specflow', '.specflow-data', '.tools', 'node_modules', 'dist', 'coverage'].includes(part))) continue;
      const path = await safePath(workspace, name), info = await stat(path);
      assert(info.size <= 512 * 1024, 'REVIEW_CONTEXT_TOO_LARGE', `新增文件 ${name} 超过复核材料上限，请拆小候选改动`);
      const bytes = await readFile(path);
      patch += `\n新增文件：${name}\n${bytes.includes(0) ? `二进制内容 SHA-256：${createHash('sha256').update(bytes).digest('hex')}；正文未作语义核验` : bytes.toString('utf8')}\n`;
    }
    assert(Buffer.byteLength(patch) <= 1024 * 1024, 'REVIEW_CONTEXT_TOO_LARGE', '候选补丁超过复核材料上限，请拆小候选改动');
    return patch;
  }
}
