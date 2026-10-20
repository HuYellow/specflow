import { mkdir, readFile, rename, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { DomainError, id } from '../../../packages/domain/index.ts';
import { BackendRegistry } from '../../../packages/execution-contract/registry.ts';
import { normalizeOpenCodeUrl, OpenCodeBackend } from '../../../packages/opencode-adapter/index.ts';

const settingsSchema = z.object({ baseUrl: z.string(), username: z.string().default('opencode'), password: z.string().optional() }).strict();
type OpenCodeSettings = z.infer<typeof settingsSchema>;
export type OpenCodeSettingsInput = { baseUrl: string; username?: string; password?: string };

/** Local connection configuration stays outside project exports and catalog responses. */
export class RuntimeConfiguration {
  private settings: OpenCodeSettings = { baseUrl: 'http://127.0.0.1:4096', username: 'opencode' };
  private readonly file: string;
  constructor(readonly dataDir: string, readonly registry: BackendRegistry) { this.file = join(dataDir, 'runtime-connections.json'); }
  async initialize() {
    try {
      this.settings = settingsSchema.parse(JSON.parse(await readFile(this.file, 'utf8')));
      this.settings.baseUrl = normalizeOpenCodeUrl(this.settings.baseUrl);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new DomainError('BACKEND_CONFIG_INVALID', '本机底座配置无法读取，请修复 runtime-connections.json 后重启；未覆盖已有配置', 503);
    }
    this.registry.register('opencode', this.createBackend(this.settings));
  }
  describeOpenCode() { return { baseUrl: this.settings.baseUrl, username: this.settings.username, hasPassword: !!this.settings.password }; }
  private createBackend(settings: OpenCodeSettings) {
    return new OpenCodeBackend({ ...settings, stateDir: join(this.dataDir, 'opencode', 'executions'), workspaceRoot: join(this.dataDir, 'workspaces') });
  }
  async configureOpenCode(input: OpenCodeSettingsInput) {
    const baseUrl = normalizeOpenCodeUrl(input.baseUrl);
    // A password omitted for a different endpoint must never carry credentials to that endpoint.
    const next = settingsSchema.parse({ baseUrl, username: input.username ?? this.settings.username,
      password: input.password ?? (baseUrl === this.settings.baseUrl ? this.settings.password : undefined) });
    if (next.username.includes(':') || /[\r\n]/.test(next.username)) throw new DomainError('BACKEND_CONFIG_INVALID', 'OpenCode 用户名包含无效字符', 400);
    const backend = this.createBackend(next);
    await mkdir(this.dataDir, { recursive: true });
    const staging = `${this.file}.${id()}.tmp`;
    try {
      await writeFile(staging, `${JSON.stringify(next, null, 2)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
      await rename(staging, this.file);
    } finally { await rm(staging, { force: true }); }
    const previous = this.registry.implementations.opencode;
    this.registry.register('opencode', backend, true);
    this.settings = next;
    await previous?.close?.();
    return this.describeOpenCode();
  }
}
