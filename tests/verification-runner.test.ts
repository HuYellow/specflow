import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execute, verify } from '../packages/verification-runner/index.ts';

async function temp(t: import('node:test').TestContext) {
  const root = await mkdtemp(join(tmpdir(), 'specflow-runner-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
async function awaitPids(path: string): Promise<number[]> {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    try { return JSON.parse(await readFile(path, 'utf8')); }
    catch { await new Promise(done => setTimeout(done, 20)); }
  }
  throw new Error('Process-tree fixture did not become ready');
}
function running(pid: number) {
  try { process.kill(pid, 0); return true; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ESRCH') return false; throw error; }
}

test('verification logs report retained tails, full byte counts and truncation separately', async t => {
  const root = await temp(t);
  const result = await execute('node', ['-e', "process.stdout.write('a'.repeat(1_000_050)); process.stderr.write('bad\\n')"], root);
  assert.equal(result.exitCode, 0);
  assert.equal(result.stdout.length, 1_000_000);
  assert.equal(result.stdoutBytes, 1_000_050);
  assert.equal(result.stdoutTruncated, true);
  assert.equal(result.stderr, 'bad\n');
  assert.equal(result.stderrBytes, 4);
  assert.equal(result.stderrTruncated, false);
  assert.equal(result.terminationReason, 'completed');
  assert.equal(result.terminationConfirmed, true);
});

test('project node --test executes real assertions even when Specflow is running inside a test worker', async t => {
  const root = await temp(t);
  await writeFile(join(root, 'failing.test.mjs'), "import test from 'node:test'; import assert from 'node:assert/strict'; test('must execute nested assertion', () => assert.equal(1, 2));\n");
  const result = await execute('node', ['--test', 'failing.test.mjs'], root);
  assert.notEqual(result.exitCode, 0);
  assert.match(result.stdout + result.stderr, /must execute nested assertion/);
  assert.doesNotMatch(result.stderr, /skipping running files/);
});

test('cancelled or expired commands never spawn new work', async t => {
  const root = await temp(t), marker = join(root, 'unexpected');
  const script = `require('fs').writeFileSync(${JSON.stringify(marker)}, 'spawned')`;
  const controller = new AbortController(); controller.abort();
  const cancelled = await execute('node', ['-e', script], root, 10000, controller.signal);
  const timedOut = await execute('node', ['-e', script], root, 0);
  assert.equal(cancelled.cancelled, true); assert.equal(cancelled.terminationConfirmed, true);
  assert.equal(timedOut.timedOut, true); assert.equal(timedOut.terminationConfirmed, true);
  await assert.rejects(access(marker));
});

for (const cause of ['cancelled', 'timeout'] as const) {
  test(`${cause} waits for the command and its child process to terminate`, { timeout: 20000 }, async t => {
    const root = await temp(t), pidFile = join(root, 'pids.json');
    const childScript = "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)";
    const parentScript = `const {spawn}=require('child_process'); const child=spawn(process.execPath,['-e',${JSON.stringify(childScript)}],{stdio:'ignore'}); require('fs').writeFileSync(${JSON.stringify(pidFile)},JSON.stringify([process.pid,child.pid])); process.on('SIGTERM',()=>{}); setInterval(()=>{},1000);`;
    const controller = new AbortController();
    const pending = execute('node', ['-e', parentScript], root, cause === 'timeout' ? 1200 : 10000, controller.signal);
    const pids = await awaitPids(pidFile);
    t.after(() => { for (const pid of pids) { try { process.kill(pid, 'SIGKILL'); } catch {} } });
    if (cause === 'cancelled') controller.abort();
    const result = await pending;
    assert.equal(result.terminationReason, cause);
    assert.equal(result.cancelled, cause === 'cancelled');
    assert.equal(result.timedOut, cause === 'timeout');
    assert.equal(result.terminationConfirmed, true);
    assert.ok(pids.every(pid => !running(pid)), 'no owned process can still execute after stop confirmation');
  });
}

test('verification preserves cancellation metadata and cannot report a cancelled command as successful', async t => {
  const root = await temp(t); await writeFile(join(root, 'source.txt'), 'source');
  const controller = new AbortController(); controller.abort();
  const result = await verify({ id: 'cancelled', executable: 'node', args: ['-e', 'process.exit(0)'], timeoutMs: 1000 }, root, controller.signal);
  assert.equal(result.cancelled, true);
  assert.equal(result.exitCode, null);
  assert.equal(result.terminationConfirmed, true);
  assert.equal(result.stale, false);
});
