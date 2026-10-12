import { spawn } from 'node:child_process';
import { resolve, relative, isAbsolute } from 'node:path';
import { realpath, readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { assert, type VerificationCommand } from '../domain/index.ts';

export async function safePath(root: string, name: string) {
  assert(!isAbsolute(name) && !name.includes('\0'), 'PATH_INVALID', '产物路径必须位于工作空间内');
  const canonicalRoot = await realpath(root);
  const target = resolve(canonicalRoot, name);
  const rel = relative(canonicalRoot, target);
  assert(rel && !rel.startsWith('..') && !isAbsolute(rel), 'PATH_INVALID', '产物路径越出工作空间');
  // Resolve each existing parent to reject symlinks escaping the root.
  const components = rel.split(/[\\/]/); let current = canonicalRoot;
  for (const component of components) {
    current = resolve(current, component);
    const actual = await realpath(current).catch((error: any) => { if (error.code === 'ENOENT') return current; throw error; });
    const r = relative(canonicalRoot, actual);
    assert(!r.startsWith('..') && !isAbsolute(r), 'PATH_INVALID', '产物路径包含越界链接');
  }
  return target;
}

export async function treeHash(root: string) {
  const digest = createHash('sha256');
  async function visit(dir: string, prefix: string) {
    const entries = (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (['.git', 'node_modules', '.specflow', '.specflow-data', 'dist', 'coverage', '.tools'].includes(entry.name)) continue;
      const name = `${prefix}${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error(`代码内容哈希不接受符号链接：${name}`);
      if (entry.isDirectory()) await visit(resolve(dir, entry.name), `${name}/`);
      else if (entry.isFile()) { digest.update(name); digest.update('\0'); digest.update(await readFile(resolve(dir, entry.name))); digest.update('\0'); }
    }
  }
  await visit(root, ''); return digest.digest('hex');
}

export async function execute(executable: string, args: string[], cwd: string, timeoutMs = 120000, signal?: AbortSignal) {
  assert(args.every(x => !x.includes('\0')), 'COMMAND_INVALID', '命令参数包含非法字符');
  let command = executable, argv = args;
  if (executable === 'node') command = process.execPath;
  if (executable === 'npm' && process.env.npm_execpath) { command = process.execPath; argv = [process.env.npm_execpath, ...args]; }
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(command)) {
    assert([command, ...argv].every(x => !/[&|<>^%!\r\n]/.test(x)), 'COMMAND_INVALID', 'Windows 批处理参数包含不支持的控制字符');
    argv = ['/d', '/s', '/c', `"${[command, ...argv].map(x => `"${x.replaceAll('"', '""')}"`).join(' ')}"`]; command = 'cmd.exe';
  }
  return await new Promise<{ exitCode: number | null; stdout: string; stderr: string; timedOut: boolean }>((done, reject) => {
    const child = spawn(command, argv, { cwd, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], signal });
    let stdout = '', stderr = '', timedOut = false;
    const kill = () => {
      if (child.pid && process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
      else child.kill('SIGTERM');
    };
    const timer = setTimeout(() => { timedOut = true; kill(); }, timeoutMs);
    child.stdout.on('data', x => { stdout = (stdout + x.toString()).slice(-1_000_000); });
    child.stderr.on('data', x => { stderr = (stderr + x.toString()).slice(-1_000_000); });
    child.on('error', error => { clearTimeout(timer); if (signal?.aborted) done({ exitCode: null, stdout, stderr: '执行已取消', timedOut }); else reject(error); });
    child.on('close', code => { clearTimeout(timer); done({ exitCode: code, stdout, stderr, timedOut }); });
  });
}

export async function verify(command: VerificationCommand, cwd: string, signal?: AbortSignal) {
  const before = await treeHash(cwd);
  const startedAt = new Date().toISOString();
  const result = await execute(command.executable, command.args, cwd, command.timeoutMs, signal);
  const after = await treeHash(cwd);
  return { ...result, targetHash: before, stale: before !== after, startedAt, finishedAt: new Date().toISOString(), environment: `Node ${process.version}; ${process.platform}/${process.arch}` };
}
