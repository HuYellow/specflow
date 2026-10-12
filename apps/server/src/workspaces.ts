import { mkdir, realpath } from 'node:fs/promises';
import { join } from 'node:path';
import { assert, id } from '../../../packages/domain/index.ts';
import { execute } from '../../../packages/verification-runner/index.ts';
export class Workspaces {
  constructor(readonly dataDir: string) {}
  async git(cwd: string, args: string[]) {
    const result = await execute('git', ['-c', 'core.autocrlf=false', ...args], cwd, 120000);
    assert(result.exitCode === 0, 'GIT_FAILED', result.stderr || result.stdout || 'Git 操作失败');
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
}
