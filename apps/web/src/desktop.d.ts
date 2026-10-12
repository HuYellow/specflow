interface Window {
  specflowDesktop?: {
    platform: string;
    pickRepository(): Promise<string | null>;
    openDataDirectory(): Promise<void>;
    exportEvidence(workItemId: string): Promise<void>;
  };
}
