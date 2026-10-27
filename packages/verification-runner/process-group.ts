import { DomainError } from '../domain/index.ts';

export interface ProcessGroupControl {
  signal(pid: number, signal: NodeJS.Signals | 0): void;
  delay(milliseconds: number): Promise<void>;
  now(): number;
}
const systemControl: ProcessGroupControl = {
  signal: (pid, signal) => { process.kill(pid, signal); },
  delay: milliseconds => new Promise(done => setTimeout(done, milliseconds)),
  now: Date.now,
};

/** Only ESRCH proves absence. On Darwin, killpg can return EPERM for a group
 * containing only unreaped zombies; a permission error is still not proof of exit.
 * The caller separately waits for its direct child's close event. */
export async function terminatePosixProcessGroup(pid: number, control: ProcessGroupControl = systemControl) {
  if (!Number.isSafeInteger(pid) || pid <= 1) throw new DomainError('COMMAND_STOP_UNCONFIRMED', 'Invalid owned process group');
  let lastError: string | undefined;
  const signalGroup = (signal: NodeJS.Signals | 0): 'present' | 'absent' | 'unconfirmed' => {
    try { control.signal(-pid, signal); return 'present'; }
    catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ESRCH') return 'absent';
      if (code === 'EPERM') { lastError = code; return 'unconfirmed'; }
      throw new DomainError('COMMAND_STOP_UNCONFIRMED', `Process group ${pid} could not be signalled: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  if (signalGroup('SIGTERM') === 'absent') return;
  await control.delay(250);
  if (signalGroup('SIGKILL') === 'absent') return;
  const deadline = control.now() + 5000;
  while (control.now() < deadline) {
    if (signalGroup(0) === 'absent') return;
    await control.delay(50);
  }
  throw new DomainError('COMMAND_STOP_UNCONFIRMED', `Process group ${pid} has not been confirmed absent after termination${lastError ? ` (${lastError})` : ''}`);
}
