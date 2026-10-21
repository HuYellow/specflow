import { mkdir, open, readFile, realpath, stat, unlink } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { resolveDshHome } from '@deepseek-ai/dsh-home-paths';

export interface SpecflowProfile {
  dataDir: string;
  instanceId: string;
  release(): Promise<void>;
}

function codeOf(error: unknown): string | undefined { return (error as NodeJS.ErrnoException | undefined)?.code; }

/** A canonical private profile has one owning host process, including during reload. */
export async function acquireProfile(configured?: string): Promise<SpecflowProfile> {
  const requested = configured ?? join(resolveDshHome(), 'specflow');
  if (!isAbsolute(requested)) throw new Error('Specflow dataDir must be an absolute path');
  await mkdir(requested, { recursive: true, mode: 0o700 });
  const dataDir = await realpath(requested);
  const lockPath = join(dataDir, 'host.lock');
  const token = randomUUID();
  let lock;
  try { lock = await open(lockPath, 'wx', 0o600); }
  catch (error) {
    if (codeOf(error) !== 'EEXIST') throw error;
    // Never steal or automatically delete an existing record: even a dead PID
    // check followed by unlink has a race against another host's acquisition.
    throw new Error(`Specflow profile is locked: ${lockPath}. After an abnormal host exit, verify that no host uses this profile before removing host.lock.`);
  }
  let released = false;
  const release = async (): Promise<void> => {
    if (released) return;
    released = true;
    await lock.close();
    const current = JSON.parse(await readFile(lockPath, 'utf8')) as { token?: string };
    if (current.token !== token) throw new Error('Specflow profile ownership changed before release');
    await unlink(lockPath);
  };
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, token, startedAt: new Date().toISOString() }));
    const identityPath = join(dataDir, 'profile.json');
    let identity: { schemaVersion: number; instanceId: string };
    try { identity = JSON.parse(await readFile(identityPath, 'utf8')); }
    catch (error) {
      if (codeOf(error) !== 'ENOENT') throw error;
      try {
        await stat(join(dataDir, 'engineering.sqlite'));
        throw new Error('Specflow refuses to adopt an existing engineering database without its DSH profile identity; use a separate dataDir');
      } catch (databaseError) { if (codeOf(databaseError) !== 'ENOENT') throw databaseError; }
      identity = { schemaVersion: 1, instanceId: randomUUID() };
      const file = await open(identityPath, 'wx', 0o600);
      try { await file.writeFile(JSON.stringify(identity)); } finally { await file.close(); }
    }
    if (identity.schemaVersion !== 1 || !/^[0-9a-f-]{36}$/.test(identity.instanceId)) throw new Error('Specflow profile identity is invalid; it will not be replaced automatically');
    await mkdir(join(dataDir, 'workspaces'), { recursive: true, mode: 0o700 });
    return { dataDir, instanceId: identity.instanceId, release };
  } catch (error) { await release(); throw error; }
}
