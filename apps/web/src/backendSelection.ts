import { localizedLabels, t } from './i18n.ts';
import type { BackendId, ModelTarget, Project } from '../../../packages/domain/index.ts';
import type { BackendCapabilities } from '../../../packages/execution-contract/index.ts';

export interface BackendCatalog {
  maka: BackendCapabilities;
  opencode: BackendCapabilities;
  sandbox: BackendCapabilities;
  dsh?: BackendCapabilities;
  backends: { id: BackendId; name: string; capabilities: BackendCapabilities; configurable: boolean }[];
  targets: ModelTarget[];
  configuration: { opencode: { baseUrl: string; username: string; hasPassword: boolean } };
}

export const backendNames = localizedLabels({ maka: 'Maka Runtime Host', opencode: 'OpenCode', sandbox: 'Sandbox 示例', dsh: 'DeepSeek Harness' }) as Record<BackendId, string>;

export function projectBackend(project?: Pick<Project, 'executionBackend' | 'demo'>): BackendId {
  return project?.executionBackend || (project?.demo ? 'sandbox' : 'maka');
}

export function backendInfo(catalog: BackendCatalog | undefined, id: BackendId) {
  const backend = catalog?.backends?.find(backend => backend.id === id);
  return backend ? { ...backend, name: t(backend.name) } : { id, name: backendNames[id], capabilities: catalog?.[id], configurable: id !== 'sandbox' };
}

export function projectBackendOptions(catalog: BackendCatalog | undefined, project?: Pick<Project, 'demo'>) {
  const registered = catalog?.backends || (['maka', 'opencode', 'sandbox'] as BackendId[]).map(id => backendInfo(catalog, id));
  return registered.filter(backend => backend.id !== 'sandbox' || project?.demo).map(backend => ({ ...backend, name: t(backend.name) }));
}

export function targetsForBackend(targets: ModelTarget[], id: BackendId): ModelTarget[] {
  return targets.filter(target => target.backend === id);
}

export function defaultsForBackend(defaults: Project['defaults'], id: BackendId): Project['defaults'] {
  return Object.fromEntries(Object.entries(defaults).filter(([, target]) => target?.backend === id));
}

/** Preserve target precedence while discarding settings from a previously selected backend. */
export function selectBackendTarget(id: BackendId, ...targets: (ModelTarget | undefined)[]): ModelTarget | undefined {
  return targets.find(target => target?.backend === id);
}

export function serializeTarget(target: ModelTarget): string {
  return JSON.stringify(Object.fromEntries(Object.entries(target).sort(([a], [b]) => a.localeCompare(b))));
}

export function currentTargetOverride(value: string, id: BackendId): ModelTarget | undefined {
  if (!value) return undefined;
  try {
    const target = JSON.parse(value) as ModelTarget;
    return target?.backend === id && typeof target.connectionId === 'string' && typeof target.connectionSlug === 'string' && typeof target.model === 'string' ? target : undefined;
  } catch { return undefined; }
}

export function targetLabel(target?: ModelTarget): string {
  return target ? `${backendNames[target.backend]} · ${t(target.connectionSlug)} / ${target.model}` : t('尚未配置');
}

export function openCodeConfiguration(baseUrl: string, username: string, password: string | undefined) {
  return { baseUrl: baseUrl.trim(), username: username.trim(), ...(password !== undefined ? { password } : {}) };
}
