/** Optional connection management supplied by the desktop host, never started by the core. */
export interface OpenCodeSettingsInput { baseUrl: string; username?: string; password?: string }
export interface RuntimeConfiguration {
  describeOpenCode(): { baseUrl: string; username: string; hasPassword: boolean };
  configureOpenCode(input: OpenCodeSettingsInput): Promise<{ baseUrl: string; username: string; hasPassword: boolean }>;
}
