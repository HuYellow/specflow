import { spawn } from 'node:child_process';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { realpath, readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { assert, DomainError, type VerificationCommand } from '../domain/index.ts';
import { terminatePosixProcessGroup } from './process-group.ts';

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

export interface CommandResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  cancelled: boolean;
  terminationReason: 'completed' | 'timeout' | 'cancelled';
  terminationConfirmed: boolean;
  stdoutBytes: number;
  stderrBytes: number;
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
}
const outputLimitBytes = 1_000_000;

/** A resolved stop means the owned process tree was signalled and reaped, not just that cancellation was requested. */
async function terminateProcessTree(pid: number) {
  if (process.platform === 'win32') {
    await new Promise<void>((done, reject) => {
      const killer = spawn(join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'taskkill.exe'), ['/pid', String(pid), '/t', '/f'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
      let diagnostic = '';
      killer.stderr.on('data', chunk => { diagnostic = (diagnostic + chunk.toString()).slice(-4000); });
      const timer = setTimeout(() => { killer.kill(); reject(new DomainError('COMMAND_STOP_UNCONFIRMED', 'Windows process-tree termination did not finish')); }, 10000);
      killer.once('error', error => { clearTimeout(timer); reject(new DomainError('COMMAND_STOP_UNCONFIRMED', error.message)); });
      killer.once('close', code => {
        clearTimeout(timer);
        if (code === 0) done();
        else reject(new DomainError('COMMAND_STOP_UNCONFIRMED', `taskkill exited ${code}${diagnostic ? `: ${diagnostic.trim()}` : ''}`));
      });
    });
    return;
  }
  // Each command starts a new POSIX process group, so descendants are included.
  await terminatePosixProcessGroup(pid);
}

export async function execute(executable: string, args: string[], cwd: string, timeoutMs = 120000, signal?: AbortSignal): Promise<CommandResult> {
  assert(args.every(x => !x.includes('\0')), 'COMMAND_INVALID', '命令参数包含非法字符');
  assert(Number.isFinite(timeoutMs) && timeoutMs >= 0, 'COMMAND_INVALID', '命令时限必须为非负有限数值');
  const notStarted = (reason: 'cancelled' | 'timeout'): CommandResult => ({ exitCode: null, stdout: '', stderr: '', timedOut: reason === 'timeout', cancelled: reason === 'cancelled', terminationReason: reason, terminationConfirmed: true, stdoutBytes: 0, stderrBytes: 0, stdoutTruncated: false, stderrTruncated: false });
  if (signal?.aborted) return notStarted('cancelled');
  if (timeoutMs === 0) return notStarted('timeout');
  let command = executable, argv = args;
  if (executable === 'node') command = process.execPath;
  if (executable === 'npm' && process.env.npm_execpath) { command = process.execPath; argv = [process.env.npm_execpath, ...args]; }
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(command)) {
    assert([command, ...argv].every(x => !/[&|<>^%!\r\n]/.test(x)), 'COMMAND_INVALID', 'Windows 批处理参数包含不支持的控制字符');
    argv = ['/d', '/s', '/c', `"${[command, ...argv].map(x => `"${x.replaceAll('"', '""')}"`).join(' ')}"`]; command = 'cmd.exe';
  }
  return await new Promise<CommandResult>((done, reject) => {
    // Do not pass signal to spawn: Node's AbortError can precede close and only
    // stops the direct child. Both cancellation and timeout use the same tree path.
    const childEnvironment = { ...process.env };
    // Node injects this into test workers. Forwarding it to a project's node
    // --test suppresses execution as a recursive test run, then exits zero.
    delete childEnvironment.NODE_TEST_CONTEXT;
    const child = spawn(command, argv, { cwd, env: childEnvironment, windowsHide: true, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout: Buffer = Buffer.alloc(0), stderr: Buffer = Buffer.alloc(0), stdoutBytes = 0, stderrBytes = 0;
    let reason: 'cancelled' | 'timeout' | undefined, closed = false, code: number | null = null, stopConfirmed = false, settled = false, spawnError: Error | undefined;
    const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); };
    const finish = () => {
      if (settled || !closed || (reason && !stopConfirmed)) return;
      settled = true; cleanup();
      if (spawnError) { reject(spawnError); return; }
      done({ exitCode: code, stdout: stdout.toString('utf8'), stderr: stderr.toString('utf8'), timedOut: reason === 'timeout', cancelled: reason === 'cancelled', terminationReason: reason || 'completed', terminationConfirmed: true, stdoutBytes, stderrBytes, stdoutTruncated: stdoutBytes > outputLimitBytes, stderrTruncated: stderrBytes > outputLimitBytes });
    };
    const stop = (cause: 'cancelled' | 'timeout') => {
      if (settled || reason || closed) return;
      reason = cause;
      if (!child.pid) { stopConfirmed = true; finish(); return; }
      void terminateProcessTree(child.pid).then(() => { stopConfirmed = true; finish(); }, error => {
        if (settled) return;
        settled = true; cleanup(); reject(error instanceof DomainError ? error : new DomainError('COMMAND_STOP_UNCONFIRMED', error instanceof Error ? error.message : String(error)));
      });
    };
    const abort = () => stop('cancelled');
    const timer = setTimeout(() => stop('timeout'), timeoutMs);
    signal?.addEventListener('abort', abort, { once: true });
    // Covers an abort between the preflight check and listener registration.
    if (signal?.aborted) abort();
    child.stdout.on('data', (chunk: Buffer) => { stdoutBytes += chunk.length; stdout = Buffer.concat([stdout, chunk]).subarray(-outputLimitBytes); });
    child.stderr.on('data', (chunk: Buffer) => { stderrBytes += chunk.length; stderr = Buffer.concat([stderr, chunk]).subarray(-outputLimitBytes); });
    child.once('error', error => { spawnError = error; });
    child.once('close', exitCode => { code = exitCode; closed = true; finish(); });
  });
}

export async function verify(command: VerificationCommand, cwd: string, signal?: AbortSignal) {
  const before = await treeHash(cwd);
  const startedAt = new Date().toISOString();
  const result = await execute(command.executable, command.args, cwd, command.timeoutMs, signal);
  const after = await treeHash(cwd);
  return { ...result, targetHash: before, stale: before !== after, startedAt, finishedAt: new Date().toISOString(), environment: `Node ${process.version}; ${process.platform}/${process.arch}` };
}
