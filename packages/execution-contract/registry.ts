import { DomainError, type BackendId, type ModelTarget } from '../domain/index.ts';
import type { BackendCapabilities, ExecutionBackend } from './index.ts';

export type BackendMap = Partial<Record<BackendId, ExecutionBackend>>;
export const backendNames: Record<BackendId, string> = { maka: 'Maka Runtime Host', opencode: 'OpenCode', sandbox: '本地验收后端', dsh: 'DeepSeek Harness' };
export interface BackendDescriptor { id: BackendId; name: string; configurable: boolean; capabilities: BackendCapabilities }

/** Owns runtime discovery; attempts always dispatch through their frozen backend ID. */
export class BackendRegistry {
  constructor(readonly implementations: BackendMap) {}
  register(id: BackendId, backend: ExecutionBackend, replace = false) {
    if (this.implementations[id] && !replace) throw new DomainError('BACKEND_ALREADY_REGISTERED', '执行底座已注册', 409);
    this.implementations[id] = backend;
  }
  require(id: BackendId): ExecutionBackend {
    const backend = Object.hasOwn(this.implementations, id) && this.implementations[id];
    if (!backend) throw new DomainError('BACKEND_UNAVAILABLE', `执行底座 ${id} 未注册`, 503);
    return backend;
  }
  async catalog(): Promise<{ backends: BackendDescriptor[]; targets: ModelTarget[] }> {
    const implementations = Object.entries(this.implementations).filter((entry): entry is [BackendId, ExecutionBackend] => !!entry[1]);
    const rows = await Promise.all(implementations.map(async ([key, backend]) => {
      const id = key as BackendId;
      let capabilities: BackendCapabilities;
      let targets: ModelTarget[] = [];
      try {
        capabilities = await backend.inspect();
        if (capabilities.available) {
          try { targets = (await backend.listTargets()).filter(target => target.backend === id); }
          catch { capabilities = { ...capabilities, reason: '模型目录读取失败，请检查底座配置后刷新' }; }
        }
      } catch {
        capabilities = { available: false, version: 'unknown', canResume: false, canInteract: false, readOnlyReview: false, reason: '执行底座无法连接，请检查配置' };
      }
      return { descriptor: { id, name: backendNames[id], configurable: id !== 'sandbox', capabilities }, targets };
    }));
    return { backends: rows.map(row => row.descriptor), targets: rows.flatMap(row => row.targets) };
  }
  async close() { await Promise.allSettled([...new Set(Object.values(this.implementations))].map(backend => backend?.close?.())); }
}
