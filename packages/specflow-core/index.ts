import { resolve, join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import type { BackendId } from '../domain/index.ts';
import { BackendRegistry, type BackendMap } from '../execution-contract/registry.ts';
import type { RuntimeConfiguration } from './configuration.ts';
import { EngineeringService } from './service.ts';
import { Store } from './store.ts';

export { EngineeringService } from './service.ts';
export { Store } from './store.ts';
export type { RuntimeConfiguration, OpenCodeSettingsInput } from './configuration.ts';

/** Hosts own process lifecycle, execution providers, authentication and directory ownership. */
export async function createEngineeringRuntime(options: {
  dataDir: string;
  backends: BackendMap | BackendRegistry;
  defaultBackend?: BackendId;
  runtimeConfiguration?: RuntimeConfiguration;
}) {
  const dataDir = resolve(options.dataDir);
  await mkdir(dataDir, { recursive: true });
  const registry = options.backends instanceof BackendRegistry ? options.backends : new BackendRegistry(options.backends);
  const defaultBackend = options.defaultBackend || 'maka';
  registry.require(defaultBackend);
  const store = new Store(join(dataDir, 'engineering.sqlite'));
  const service = new EngineeringService(store, dataDir, registry, options.runtimeConfiguration, { defaultBackend });
  let closing: Promise<void> | undefined;
  const close = () => closing ||= (async () => {
    service.beginShutdown();
    for (const controller of service.verificationControllers.values()) controller.abort();
    await registry.close();
    await Promise.allSettled([...service.jobs.values()]);
    store.close();
  })();
  try { await service.initialize(); }
  catch (error) { await close(); throw error; }
  return { dataDir, service, store, registry, close };
}
