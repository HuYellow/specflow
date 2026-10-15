import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { extname } from 'node:path';
import { assert } from '../../../packages/domain/index.ts';
import { safePath, treeHash } from '../../../packages/verification-runner/index.ts';
import type { CandidateReviewDiff, ReviewFile, ReviewFileChunk } from '../../../packages/ui-contracts/index.ts';

const omitted = new Set(['.git', '.specflow', '.specflow-data', '.tools', 'node_modules', 'dist', 'coverage']);
const allowed = (name: string) => !name.split(/[\\/]/).some(part => omitted.has(part));
const chunkLimit = 64 * 1024;
const patchLimit = 256 * 1024;

/** Keep a bounded prefix while hashing and measuring the entire stream. */
async function inspectBytes(stream: AsyncIterable<Buffer>, offset = 0, limit = chunkLimit) {
  const digest = createHash('sha256');
  let size = 0, binary = false;
  const parts: Buffer[] = [];
  // Four extra bytes permit a UTF-8 boundary at the end of a requested chunk.
  const decoder = new TextDecoder('utf-8', { fatal: true });
  for await (const bytes of stream) {
    digest.update(bytes);
    binary ||= bytes.includes(0);
    try { decoder.decode(bytes, { stream: true }); } catch { binary = true; }
    const begin = Math.max(0, offset - size), end = Math.min(bytes.length, offset + limit + 4 - size);
    if (end > begin) parts.push(Buffer.from(bytes.subarray(begin, end)));
    size += bytes.length;
  }
  try { decoder.decode(); } catch { binary = true; }
  let bytes = Buffer.concat(parts).subarray(0, limit);
  assert(binary || !bytes.length || (bytes[0] & 0xc0) !== 0x80, 'RANGE_INVALID', '读取位置必须位于 UTF-8 字符边界');
  if (!binary && offset + bytes.length < size) {
    // The next request starts at a whole UTF-8 code point.
    while (bytes.length) {
      try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); break; }
      catch { bytes = bytes.subarray(0, bytes.length - 1); }
    }
  }
  return { size, binary, contentHash: digest.digest('hex'), bytes };
}

async function gitBytes(workspace: string, args: string[], offset = 0, limit = chunkLimit) {
  const child = spawn('git', ['-c', 'core.autocrlf=false', ...args], { cwd: workspace, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', bytes => { stderr = (stderr + bytes.toString()).slice(-4000); });
  const finished = new Promise<void>((resolve, reject) => {
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve() : reject(new Error(stderr || 'Git 读取失败')));
  });
  const timer = setTimeout(() => child.kill(), 120000);
  try { const [data] = await Promise.all([inspectBytes(child.stdout, offset, limit), finished]); return data; }
  finally { clearTimeout(timer); }
}

function mediaType(path: string, binary: boolean) {
  const types: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.pdf': 'application/pdf', '.zip': 'application/zip', '.wasm': 'application/wasm', '.json': 'application/json', '.md': 'text/markdown' };
  return types[extname(path).toLowerCase()] || (binary ? 'application/octet-stream' : 'text/plain; charset=utf-8');
}

export class UserCodeReview {
  constructor(readonly git: (workspace: string, args: string[]) => Promise<string>) {}
  private async changes(workspace: string, base: string) {
    const changed = await this.git(workspace, ['diff', '--no-ext-diff', '--no-textconv', '--name-status', '-z', '--find-renames', base, '--', '.']);
    const fields = changed.split('\0').filter(Boolean), files: Pick<ReviewFile, 'path' | 'oldPath' | 'status'>[] = [];
    for (let i = 0; i < fields.length;) {
      const code = fields[i++], first = fields[i++];
      const path = /^[RC]/.test(code) ? fields[i++] : first;
      if (!path) continue;
      // A rename across the excluded boundary is an addition or deletion of user code.
      if (/^[RC]/.test(code) && allowed(path) && !allowed(first)) { files.push({ path, status: 'added' }); continue; }
      if (/^R/.test(code) && !allowed(path) && allowed(first)) { files.push({ path: first, status: 'deleted' }); continue; }
      if (!allowed(path) || !allowed(first)) continue;
      const status = ({ A: 'added', D: 'deleted', R: 'renamed', C: 'added', T: 'typechanged' } as const)[code[0] as 'A' | 'D' | 'R' | 'C' | 'T'] || 'modified';
      files.push({ path, oldPath: /^[RC]/.test(code) ? first : undefined, status });
    }
    const untracked = await this.git(workspace, ['ls-files', '--others', '--exclude-standard', '-z']);
    for (const path of untracked.split('\0').filter(Boolean)) if (allowed(path)) files.push({ path, status: 'untracked' });
    return files;
  }
  private async read(workspace: string, base: string, file: Pick<ReviewFile, 'path' | 'oldPath' | 'status'>, side: 'candidate' | 'baseline', offset = 0, limit = chunkLimit) {
    if (side === 'baseline') return gitBytes(workspace, ['show', `${base}:${file.oldPath || file.path}`], offset, limit);
    const path = await safePath(workspace, file.path);
    return inspectBytes(createReadStream(path), offset, limit);
  }
  async diff(candidateId: string, workspace: string, base: string): Promise<CandidateReviewDiff> {
    const candidateHash = await treeHash(workspace), files: ReviewFile[] = [];
    for (const file of await this.changes(workspace, base)) {
      const before = ['added', 'untracked'].includes(file.status) && !file.oldPath ? undefined : await this.read(workspace, base, file, 'baseline');
      const after = file.status === 'deleted' ? undefined : await this.read(workspace, base, file, 'candidate');
      const binary = !!(before?.binary || after?.binary), display = after || before!;
      const content = binary ? undefined : display.bytes.toString('utf8');
      let patch: string | undefined, patchTruncated = false, patchReturnedBytes = 0, patchTotalBytes = 0;
      if (!binary && file.status !== 'untracked') {
        const value = await gitBytes(workspace, ['diff', '--no-ext-diff', '--no-textconv', '--find-renames', '--no-color', '--src-prefix=a/', '--dst-prefix=b/', base, '--', file.oldPath || file.path, file.path], 0, patchLimit);
        patch = value.bytes.toString('utf8'); patchTruncated = value.size > value.bytes.length; patchReturnedBytes = value.bytes.length; patchTotalBytes = value.size;
      }
      const truncated = !binary && (display.size > display.bytes.length || patchTruncated);
      files.push({ ...file, binary, mediaType: mediaType(file.path, binary), size: after?.size || 0, baselineSize: before?.size || 0, contentHash: after?.contentHash, baselineContentHash: before?.contentHash,
        content, patch, returnedBytes: binary ? 0 : display.bytes.length, totalBytes: display.size, truncated, patchTruncated, patchReturnedBytes, patchTotalBytes,
        reason: binary ? '二进制正文未作语义核验' : truncated ? '当前仅返回文本首块或部分补丁；请继续按块读取完整正文' : undefined,
        nextOffset: !binary && display.bytes.length < display.size ? display.bytes.length : undefined });
    }
    assert(await treeHash(workspace) === candidateHash, 'CODE_STALE', '读取差异期间候选发生变化，请重新加载');
    return { candidateId, baselineHash: base, candidateHash, checkedAt: new Date().toISOString(), files, complete: files.every(f => !f.truncated) };
  }
  async chunk(workspace: string, base: string, path: string, side: 'candidate' | 'baseline', offset: number, limit: number): Promise<ReviewFileChunk> {
    assert(allowed(path), 'PATH_INVALID', '该文件属于排除目录');
    const file = (await this.changes(workspace, base)).find(file => file.path === path);
    assert(file, 'NOT_FOUND', '文件不在当前候选差异中');
    assert(!(side === 'candidate' && file.status === 'deleted') && !(side === 'baseline' && ['added', 'untracked'].includes(file.status) && !file.oldPath), 'NOT_FOUND', '该侧不存在文件正文');
    const candidateHash = await treeHash(workspace), value = await this.read(workspace, base, file, side, offset, limit);
    assert(offset <= value.size, 'RANGE_INVALID', '读取位置超出文件大小');
    if (!value.binary && value.bytes.length) {
      try { new TextDecoder('utf-8', { fatal: true }).decode(value.bytes); }
      catch { assert(false, 'RANGE_INVALID', '读取位置必须位于 UTF-8 字符边界'); }
    }
    assert(await treeHash(workspace) === candidateHash, 'CODE_STALE', '读取正文期间候选发生变化，请重新加载');
    const returnedBytes = value.binary ? 0 : value.bytes.length, truncated = !value.binary && offset + returnedBytes < value.size;
    return { path, side, offset, candidateHash, binary: value.binary, mediaType: mediaType(path, value.binary), contentHash: value.contentHash, size: value.size, totalBytes: value.size, returnedBytes,
      content: value.binary ? undefined : value.bytes.toString('utf8'), truncated, nextOffset: truncated ? offset + returnedBytes : undefined,
      reason: value.binary ? '二进制正文未作语义核验' : truncated ? '后续正文尚未提供' : undefined };
  }
}
