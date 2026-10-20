import { resolve, join } from 'node:path';
import { Store } from './store.ts';
import { EngineeringService } from './service.ts';
import { SandboxBackend } from './sandbox-backend.ts';
import { MakaBackend } from '../../../packages/maka-adapter/index.ts';
import { createApp } from './app.ts';
import { MAKA_VERSION } from '../../../packages/maka-adapter/release-policy.ts';
import { BackendRegistry } from '../../../packages/execution-contract/registry.ts';
import { RuntimeConfiguration } from './runtime-configuration.ts';
const dataDir = resolve(process.env.SPECFLOW_DATA_DIR || '.specflow-data/local');
const maka = new MakaBackend(resolve(process.env.SPECFLOW_MAKA_PACKAGE || '.tools/maka/node_modules/maka-agent'), resolve(process.env.SPECFLOW_MAKA_ROOT || join(dataDir, 'maka', MAKA_VERSION)), join(dataDir, 'workspaces'));
const store = new Store(`${dataDir}/engineering.sqlite`);
const registry = new BackendRegistry({ maka, sandbox: new SandboxBackend() });
const runtimeConfiguration = new RuntimeConfiguration(dataDir, registry);
await runtimeConfiguration.initialize();
const service = new EngineeringService(store, dataDir, registry, runtimeConfiguration);
await service.initialize();
if (process.env.SPECFLOW_NO_DEMO !== '1') await service.seedDemo();
const app = await createApp(service, { staticRoot: resolve(process.env.SPECFLOW_STATIC_ROOT || 'dist/web'), desktopSecret: process.env.SPECFLOW_DESKTOP_SECRET });
await app.listen({ host: '127.0.0.1', port: Number(process.env.SPECFLOW_PORT || 4317) });
const address = app.server.address();
const url = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 4317}`;
console.log(`SpecFlow 服务已启动：${url}`);
process.send?.({ type: 'specflow-ready', url });
let closing = false;
const close = async () => {
  if (closing) return; closing = true;
  for (const controller of service.verificationControllers.values()) controller.abort();
  // SSE connections otherwise keep Fastify.close pending indefinitely.
  const closingApp = app.close(); app.server.closeAllConnections();
  await closingApp; await registry.close(); store.close(); process.exit(0);
};
process.on('SIGINT', close); process.on('SIGTERM', close);
if (process.send) {
  process.on('message', message => { if ((message as any)?.type === 'specflow-shutdown') void close(); });
  process.on('disconnect', () => void close());
}
// Electron helpers may inherit an IPC handle on Windows, delaying disconnect after a crash.
// Also monitor the actual desktop owner, rather than depending on that pipe alone.
const desktopParentPid = Number(process.env.SPECFLOW_DESKTOP_PARENT_PID);
if (process.env.SPECFLOW_DESKTOP_SECRET && Number.isInteger(desktopParentPid) && desktopParentPid > 0) {
  const parentWatchdog = setInterval(() => {
    try { process.kill(desktopParentPid, 0); }
    catch (error: any) { if (error.code === 'ESRCH') { clearInterval(parentWatchdog); void close(); } }
  }, 1000);
  parentWatchdog.unref();
}
