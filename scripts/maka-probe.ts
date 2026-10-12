import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { MakaBackend, MAKA_VERSION } from '../packages/maka-adapter/index.ts';
const dataDir = resolve(process.env.SPECFLOW_DATA_DIR || '.specflow-data/local');
const backend = new MakaBackend(resolve('.tools/maka/node_modules/maka-agent'), resolve(process.env.SPECFLOW_MAKA_ROOT || join(dataDir, 'maka', MAKA_VERSION)), join(dataDir, 'workspaces'));
try {
  const capability = await backend.inspect();
  const targets = capability.available ? await backend.listTargets() : [];
  const report = { date: new Date().toISOString(), version: MAKA_VERSION, capability, targets: targets.map(x => ({ connectionSlug: x.connectionSlug, model: x.model })), realModelValidation: targets.length >= 2 ? 'available-not-run' : 'pending-user-connections' };
  await mkdir('.specflow-data', { recursive: true });
  await writeFile('.specflow-data/maka-probe.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!capability.available) process.exitCode = 1;
} finally { await backend.close(); }
