interface Window {
  specflowDesktop?: {
    platform: string;
    initialLocale: import('../../../packages/i18n/index.ts').Locale;
    readLocale(): Promise<import('../../../packages/i18n/index.ts').Locale>;
    setLocale(locale: import('../../../packages/i18n/index.ts').Locale): Promise<import('../../../packages/i18n/index.ts').Locale>;
    pickRepository(): Promise<string | null>;
    openDataDirectory(): Promise<void>;
    exportEvidence(workItemId: string): Promise<void>;
    readView(workItemId: string): Promise<import('./location.ts').ViewLocation | null>;
    saveView(view: import('./location.ts').ViewLocation): Promise<void>;
  };
}
