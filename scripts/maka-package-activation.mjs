import { cp, mkdir, rename, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
export async function activateMakaPackage(stage, destination) {
  await mkdir(dirname(destination), { recursive: true });
  const incoming = `${destination}.incoming-${process.pid}`;
  const backup = `${destination}.previous-${Date.now()}`;
  await cp(stage, incoming, { recursive: true });
  let moved = false;
  try {
    if (existsSync(destination)) { await rename(destination, backup); moved = true; }
    try { await rename(incoming, destination); }
    catch (error) { if (moved) await rename(backup, destination); throw error; }
  } catch (error) {
    await rm(incoming, { recursive: true, force: true }).catch(() => {});
    throw new Error(`Maka runtime activation failed; stop clients using this package and retry. ${error.message}`, { cause: error });
  }
  // Retain the previous package as a recoverable cache; never delete mapped native modules.
}
