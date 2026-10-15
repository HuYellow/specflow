import { mkdir, realpath, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { assert, id } from '../../../packages/domain/index.ts';
import { execute, safePath } from '../../../packages/verification-runner/index.ts';
export class Workspaces {
  constructor(readonly dataDir: string) {}
  async git(cwd: string, args: string[]) {
    const result = await execute('git', ['-c', 'core.autocrlf=false', ...args], cwd, 120000);
    assert(result.exitCode === 0, 'GIT_FAILED', result.stderr || result.stdout || 'Git 操作失败');
    assert(result.stdout.length < 1_000_000, 'REVIEW_CONTEXT_TOO_LARGE', 'Git 输出达到完整读取上限，请缩小候选改动；不能用截断的差异作为复核依据');
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
