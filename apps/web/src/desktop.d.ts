interface Window {
  specflowDesktop?: {
    platform: string;
    pickRepository(): Promise<string | null>;
    openDataDirectory(): Promise<void>;
    exportEvidence(workItemId: string): Promise<void>;
    readView(workItemId: string): Promise<import('./location.ts').ViewLocation | null>;
    saveView(view: import('./location.ts').ViewLocation): Promise<void>;
  };
}
