import test from 'node:test';
import assert from 'node:assert/strict';
import { terminatePosixProcessGroup, type ProcessGroupControl } from '../packages/verification-runner/process-group.ts';

function systemError(code: string): NodeJS.ErrnoException { return Object.assign(new Error(`kill ${code}`), { code }); }
function controlled(signal: ProcessGroupControl['signal']) {
  let elapsed = 0;
  return { control: { signal, now: () => elapsed, delay: async (ms: number) => { elapsed += ms; } }, elapsed: () => elapsed };
}

test('Darwin EPERM after SIGKILL remains unconfirmed until a later absence probe returns ESRCH', async () => {
  const signals: (NodeJS.Signals | 0)[] = [];
  let probes = 0, absenceObserved = false;
  const fixture = controlled((pid, signal) => {
    assert.equal(pid, -4242); signals.push(signal);
    if (signal === 'SIGKILL') throw systemError('EPERM');
    if (signal === 0) {
      if (++probes < 3) throw systemError('EPERM');
      absenceObserved = true; throw systemError('ESRCH');
    }
  });
  await terminatePosixProcessGroup(4242, fixture.control);
  assert.equal(absenceObserved, true);
  assert.deepEqual(signals.slice(0, 2), ['SIGTERM', 'SIGKILL']);
  assert.equal(probes, 3);
  assert.ok(fixture.elapsed() > 250, 'EPERM must not be accepted as completed termination');
});

test('persistent POSIX permission denial cannot become a confirmed stop', async () => {
  let probes = 0;
  const fixture = controlled((_pid, signal) => { if (signal === 0) probes++; throw systemError('EPERM'); });
  await assert.rejects(terminatePosixProcessGroup(4242, fixture.control), error => {
    assert.equal((error as { code?: string }).code, 'COMMAND_STOP_UNCONFIRMED');
    assert.match((error as Error).message, /EPERM/);
    return true;
  });
  assert.ok(probes > 1); assert.ok(fixture.elapsed() >= 5000);
});

test('a live process group that survives SIGKILL remains unconfirmed', async () => {
  const fixture = controlled(() => {});
  await assert.rejects(terminatePosixProcessGroup(4242, fixture.control), error => (error as { code?: string }).code === 'COMMAND_STOP_UNCONFIRMED');
  assert.ok(fixture.elapsed() >= 5000);
});

test('an already absent process group needs no escalation, while other signal errors still fail closed', async () => {
  const absent = controlled(() => { throw systemError('ESRCH'); });
  await terminatePosixProcessGroup(4242, absent.control);
  assert.equal(absent.elapsed(), 0);
  const invalid = controlled(() => { throw systemError('EINVAL'); });
  await assert.rejects(terminatePosixProcessGroup(4242, invalid.control), error => (error as { code?: string }).code === 'COMMAND_STOP_UNCONFIRMED');
  assert.equal(invalid.elapsed(), 0);
});
