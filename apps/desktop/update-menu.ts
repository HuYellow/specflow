import { app, dialog, Menu, Notification, shell, type BrowserWindow, type MenuItemConstructorOptions } from 'electron';
import electronUpdater from 'electron-updater';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import release from '../../config/desktop-release.json';
import { DesktopUpdates, type DesktopUpdateState } from './updates.ts';
import { translate, type Locale, type MessageValues } from '../../packages/i18n/index.ts';

interface UpdateMenuOptions {
  window(): BrowserWindow | undefined;
  log(message: string): void;
  isQuitting(): boolean;
  prepareInstall(): Promise<void>;
  recoverFromFailedInstall(): Promise<void>;
  locale?(): Locale;
}

export function createUpdateMenu(options: UpdateMenuOptions) {
  const locale = () => options.locale?.() || 'zh-CN';
  const t = (source: string, values?: MessageValues) => translate(source, locale(), values);
  const releasesUrl = `https://github.com/${release.owner}/${release.repo}/releases/latest`;
  let automaticUpdates = false;
  let disabledReason: string | undefined;
  if (!app.isPackaged) disabledReason = '源码运行模式不安装更新。请安装正式桌面包，或更新源码后重新构建。';
  else {
    try {
      const bundled = JSON.parse(readFileSync(join(process.resourcesPath, 'specflow/desktop-release.json'), 'utf8'));
      if (bundled.provider !== release.provider || bundled.owner !== release.owner || bundled.repo !== release.repo) throw new Error('Release configuration mismatch');
      automaticUpdates = bundled.automaticUpdates === true;
    } catch (error) {
      options.log(`[updates] Missing or invalid packaged release configuration: ${String(error)}`);
      disabledReason = '安装包缺少有效的更新配置。请从下载与发行说明页面获取新版安装包。';
    }
  }
  const { autoUpdater } = electronUpdater;
  const logger = (message: unknown) => options.log(`[updates] ${String(message)}`);
  autoUpdater.logger = { info: logger, warn: logger, error: logger, debug: logger };
  let previousStatus = '';
  let recovering = false;
  let dialogBusy = false;
  let startupTimer: ReturnType<typeof setTimeout> | undefined;
  let interval: ReturnType<typeof setInterval> | undefined;
  let notifiedVersion: string | undefined;

  const statusText = (state: Readonly<DesktopUpdateState>) => {
    switch (state.status) {
      case 'disabled': return t(state.message!);
      case 'checking': return t("正在检查更新…");
      case 'available': return t("发现新版本 {0}", {"0": state.version});
      case 'downloading': return t("正在下载 {0}（{1}%）", {"0": state.version, "1": Math.floor(state.percent || 0)});
      case 'downloaded': return t("{0} 已下载，等待重启安装", {"0": state.version});
      case 'installing': return t("正在关闭工程服务并安装更新…");
      case 'error': return t(state.message!);
      default: return state.checkedAt ? t("最近检查：{0}", {"0": new Date(state.checkedAt).toLocaleString(locale())}) : t("尚未检查更新");
    }
  };
  const refreshMenu = (state: Readonly<DesktopUpdateState>) => {
    const menu = Menu.getApplicationMenu();
    const checking = menu?.getMenuItemById('specflow-update-check');
    if (checking) {
      checking.enabled = !recovering && !['checking', 'downloading', 'installing'].includes(state.status);
      checking.label = state.status === 'checking' ? t("正在检查更新…") : t("检查更新…");
    }
    const download = menu?.getMenuItemById('specflow-update-download');
    if (download) {
      download.enabled = !recovering && automaticUpdates && state.status === 'available';
      download.label = state.status === 'downloading' ? statusText(state) : t("下载更新…");
    }
    const install = menu?.getMenuItemById('specflow-update-install');
    if (install) { install.enabled = !recovering && state.status === 'downloaded'; install.label = t('重启并安装更新…'); }
    const releases = menu?.getMenuItemById('specflow-update-releases');
    if (releases) releases.label = t('下载与发行说明');
    options.window()?.setProgressBar(state.status === 'downloading' ? (state.percent || 0) / 100 : -1);
    const needsRecovery = state.status === 'error' && previousStatus === 'installing' && !recovering;
    previousStatus = state.status;
    if (needsRecovery) {
      recovering = true;
      refreshMenu(state);
      void options.recoverFromFailedInstall().finally(() => { recovering = false; refreshMenu(updates.state); });
    }
  };
  const updates = new DesktopUpdates(autoUpdater, automaticUpdates, refreshMenu, disabledReason);
  const show = (settings: Electron.MessageBoxOptions) => {
    const parent = options.window();
    return parent && !parent.isDestroyed() ? dialog.showMessageBox(parent, settings) : dialog.showMessageBox(settings);
  };
  const openReleases = async () => { await shell.openExternal(releasesUrl); };
  const showState = async (state: Readonly<DesktopUpdateState>) => {
    await show({ type: state.status === 'error' ? 'warning' : 'info', title: t("SpecFlow 更新"),
      message: state.status === 'idle' ? t("当前已是最新版本（{0}）", {"0": app.getVersion()}) : statusText(state),
      detail: state.status === 'error' ? t("发布方尚未提供正式版本或更新文件时，也会出现此提示。工程数据不受影响。") : t("当前版本：{0}", {"0": app.getVersion()}), buttons: [t("确定")] });
  };
  const promptInstall = async () => {
    if (options.isQuitting() || updates.snapshot().status !== 'downloaded') return;
    const answer = await show({ type: 'question', title: t("安装 SpecFlow 更新"), message: t("重启并安装 {0}？", {"0": updates.state.version}),
      detail: t("请先保存编辑内容并等待正在运行的任务结束。安装将关闭当前窗口和工程服务，完成后重新打开应用。工程数据保存在用户目录。"),
      buttons: [t("稍后"), t("重启并安装")], defaultId: 0, cancelId: 0 });
    if (answer.response !== 1 || options.isQuitting()) return;
    await updates.install(options.prepareInstall);
    if (updates.state.status === 'error') await showState(updates.state);
  };
  const download = async () => {
    if (updates.state.status !== 'available' || !automaticUpdates) return;
    const state = await updates.download();
    if (options.isQuitting()) return;
    if (state.status === 'downloaded') await promptInstall();
    else if (state.status === 'error') await showState(state);
  };
  const promptAvailable = async () => {
    if (updates.state.status !== 'available') return;
    const answer = await show({ type: 'info', title: t("SpecFlow 有新版本"), message: t("发现新版本 {0}", {"0": updates.state.version}),
      detail: automaticUpdates ? t("当前版本：{0}。下载期间可继续使用，下载完成后由你决定何时重启。", {"0": app.getVersion()})
        : t("当前版本：{0}。此安装包使用手动更新，请下载对应架构的安装包覆盖安装。macOS 应用内安装更新需要已签名的正式版本。", {"0": app.getVersion()}),
      buttons: [t("稍后"), automaticUpdates ? t("下载更新") : t("打开下载页面")], defaultId: 1, cancelId: 0 });
    if (answer.response === 1 && !options.isQuitting()) {
      if (automaticUpdates) await download();
      else await openReleases();
    }
  };
  const interact = async (action: () => Promise<void>) => {
    if (dialogBusy || recovering || options.isQuitting()) return;
    dialogBusy = true;
    try { await action(); }
    catch (error) { logger(error); await show({ type: 'warning', title: t("SpecFlow 更新"), message: t("操作失败，请稍后重试。"), buttons: [t("确定")] }); }
    finally { dialogBusy = false; }
  };
  const check = async () => {
    const state = await updates.check();
    if (options.isQuitting()) return;
    if (state.status === 'available') await promptAvailable();
    else if (state.status === 'downloaded') await promptInstall();
    else await showState(state);
  };
  const backgroundCheck = async () => {
    if (dialogBusy || recovering || options.isQuitting() || ['available', 'downloaded', 'installing', 'disabled'].includes(updates.state.status)) return;
    const state = await updates.check();
    if (options.isQuitting() || state.status !== 'available' || notifiedVersion === state.version) return;
    notifiedVersion = state.version;
    if (Notification.isSupported()) {
      const notification = new Notification({ title: t("SpecFlow 有新版本"), body: t("{0} 可用。点击查看，或从“帮助 → 检查更新”继续。", {"0": state.version}) });
      notification.on('click', () => { options.window()?.show(); void interact(promptAvailable); });
      notification.show();
    }
  };
  const items: MenuItemConstructorOptions[] = [
    { id: 'specflow-update-check', label: t("检查更新…"), click: () => { void interact(check); } },
    { id: 'specflow-update-download', label: t("下载更新…"), enabled: false, click: () => { void interact(download); } },
    { id: 'specflow-update-install', label: t("重启并安装更新…"), enabled: false, click: () => { void interact(promptInstall); } },
    { id: 'specflow-update-releases', label: t("下载与发行说明"), click: () => { void interact(openReleases); } },
  ];
  return {
    items,
    status: () => statusText(updates.state),
    refresh: () => refreshMenu(updates.state),
    start() {
      refreshMenu(updates.state);
      if (disabledReason) return;
      startupTimer = setTimeout(() => { void backgroundCheck(); }, 15_000);
      interval = setInterval(() => { void backgroundCheck(); }, 6 * 60 * 60 * 1000);
      startupTimer.unref(); interval.unref();
    },
    dispose() { clearTimeout(startupTimer); clearInterval(interval); updates.dispose(); },
  };
}
