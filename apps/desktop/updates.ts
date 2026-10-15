/** Update orchestration is independent of Electron so failures and lifecycle ordering can be tested. */
export interface DesktopUpdater {
  autoDownload: boolean;
  autoInstallOnAppQuit: boolean;
  allowPrerelease: boolean;
  allowDowngrade: boolean;
  disableWebInstaller: boolean;
  on(event: 'error', listener: (error: Error) => void): unknown;
  on(event: 'download-progress', listener: (progress: { percent: number }) => void): unknown;
  on(event: 'update-downloaded', listener: (info: { version: string }) => void): unknown;
  checkForUpdates(): Promise<{ isUpdateAvailable: boolean; updateInfo: { version: string } } | null>;
  downloadUpdate(): Promise<unknown>;
  quitAndInstall(isSilent?: boolean, isForceRunAfter?: boolean): void;
}

export type UpdateStatus = 'disabled' | 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'installing' | 'error';
export interface DesktopUpdateState {
  status: UpdateStatus;
  version?: string;
  percent?: number;
  message?: string;
  checkedAt?: string;
}

export class DesktopUpdates {
  state: Readonly<DesktopUpdateState>;
  private operation?: Promise<Readonly<DesktopUpdateState>>;
  private stopped = false;

  constructor(private updater: DesktopUpdater, readonly automaticUpdates: boolean,
    private changed: (state: Readonly<DesktopUpdateState>) => void, disabledReason?: string) {
    this.state = disabledReason ? { status: 'disabled', message: disabledReason } : { status: 'idle' };
    updater.autoDownload = false;
    updater.autoInstallOnAppQuit = false;
    updater.allowPrerelease = false;
    updater.allowDowngrade = false;
    updater.disableWebInstaller = true;
    updater.on('error', error => { if (!this.stopped) this.fail(error); });
    updater.on('download-progress', progress => {
      if (!this.stopped && this.state.status === 'downloading') {
        this.set({ ...this.state, percent: Number.isFinite(progress.percent) ? Math.max(0, Math.min(100, progress.percent)) : 0 });
      }
    });
    updater.on('update-downloaded', info => {
      if (!this.stopped && this.state.status === 'downloading') this.set({ status: 'downloaded', version: info.version, percent: 100 });
    });
  }

  private set(state: DesktopUpdateState) {
    this.state = Object.freeze(state);
    this.changed(this.state);
    return this.state;
  }

  snapshot() { return this.state; }

  private fail(error: unknown) {
    // Full network diagnostics stay in the desktop log, not in native dialogs.
    return this.set({ status: 'error', message: '无法完成更新。请检查网络，或前往下载与发行说明页面手动安装后重试。' });
  }

  check(): Promise<Readonly<DesktopUpdateState>> {
    if (this.stopped || ['disabled', 'downloaded', 'installing'].includes(this.state.status)) return Promise.resolve(this.state);
    if (this.operation) return this.operation;
    this.set({ status: 'checking' });
    this.operation = (async () => {
      try {
        const result = await this.updater.checkForUpdates();
        if (!this.stopped && this.state.status === 'checking') {
          if (!result) this.fail(new Error('Update check was unavailable'));
          else this.set({ status: result.isUpdateAvailable ? 'available' : 'idle', version: result.updateInfo.version, checkedAt: new Date().toISOString() });
        }
      } catch (error) { if (!this.stopped) this.fail(error); }
      return this.state;
    })().finally(() => { this.operation = undefined; });
    return this.operation;
  }

  download(): Promise<Readonly<DesktopUpdateState>> {
    if (this.operation) return this.operation;
    if (this.stopped || !this.automaticUpdates || this.state.status !== 'available') return Promise.resolve(this.state);
    const version = this.state.version;
    this.set({ status: 'downloading', version, percent: 0 });
    this.operation = (async () => {
      try {
        await this.updater.downloadUpdate();
        if (!this.stopped && this.state.status === 'downloading') this.fail(new Error('Download finished without a verified update'));
      } catch (error) { if (!this.stopped) this.fail(error); }
      return this.state;
    })().finally(() => { this.operation = undefined; });
    return this.operation;
  }

  async install(beforeInstall: () => Promise<void>): Promise<void> {
    if (this.stopped || !this.automaticUpdates || this.snapshot().status !== 'downloaded') return;
    this.set({ ...this.state, status: 'installing' });
    try {
      await beforeInstall();
      if (!this.stopped && this.state.status === 'installing') this.updater.quitAndInstall(false, true);
    } catch (error) { if (!this.stopped) this.fail(error); }
  }

  dispose() { this.stopped = true; }
}
