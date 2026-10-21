import { app, BrowserWindow, dialog, ipcMain, Menu, shell, type IpcMainInvokeEvent } from 'electron';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, join, resolve, delimiter } from 'node:path';
import { MAKA_VERSION } from '../../packages/maka-adapter/release-policy.ts';
import { desktopViewSearch, emptyDesktopViewState, parseDesktopViewState, updateDesktopViewState, validViewItemId } from './view-state.ts';
import { createUpdateMenu } from './update-menu.ts';
import { translate, type Locale, type MessageValues } from '../../packages/i18n/index.ts';
import { readDesktopLocale, saveDesktopLocale } from './locale.ts';

app.setName('SpecFlow');
app.setAppUserModelId('dev.specflow.desktop');
if (process.env.SPECFLOW_DESKTOP_USER_DATA) app.setPath('userData', resolve(process.env.SPECFLOW_DESKTOP_USER_DATA));
let window: BrowserWindow | undefined;
let server: ChildProcess | undefined;
let origin = '';
let quitting = false;
let replacingWindow = false;
let updateMenu: ReturnType<typeof createUpdateMenu> | undefined;
let locale: Locale = 'zh-CN';
const t = (source: string, values?: MessageValues) => translate(source, locale, values);
const localePath = join(app.getPath('userData'), 'locale.json');
const secret = randomBytes(32).toString('hex');
const dataDirectory = resolve(process.env.SPECFLOW_DATA_DIR || join(app.getPath('userData'), 'engineering'));
const logsDirectory = join(app.getPath('userData'), 'logs');
mkdirSync(logsDirectory, { recursive: true });
const logPath = join(logsDirectory, 'desktop.log');
const log = (message: string) => appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`);
const resourceRoot = app.isPackaged ? join(process.resourcesPath, 'specflow') : resolve(app.getAppPath(), '.tools/desktop/resources');
const runtimeRoot = app.isPackaged ? join(process.resourcesPath, 'runtime') : resolve(app.getAppPath(), '.tools/desktop/runtime');
const nodeBinary = join(runtimeRoot, process.platform === 'win32' ? 'node.exe' : 'bin/node');
const nodeBin = dirname(nodeBinary);
const npmCli = join(runtimeRoot, process.platform === 'win32' ? 'node_modules/npm/bin/npm-cli.js' : 'lib/node_modules/npm/bin/npm-cli.js');
const viewStatePath = join(app.getPath('userData'), 'view-state.json');
function readViewState() {
  try {
    if (statSync(viewStatePath).size > 256 * 1024) return emptyDesktopViewState();
    return parseDesktopViewState(JSON.parse(readFileSync(viewStatePath, 'utf8')));
  } catch { return emptyDesktopViewState(); }
}

function trustedSender(event: IpcMainInvokeEvent) {
  if (!window || event.sender !== window.webContents || !event.senderFrame || event.senderFrame !== window.webContents.mainFrame || new URL(event.senderFrame.url).origin !== origin) throw new Error(t("桌面接口不接受此调用来源"));
}
async function stopServer() {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;
  const child = server;
  await new Promise<void>(done => {
    const timer = setTimeout(() => {
      if (child.pid) {
        if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true });
        else { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }
      }
      done();
    }, 8000);
    child.once('exit', () => { clearTimeout(timer); done(); });
    if (child.connected) child.send({ type: 'specflow-shutdown' });
    else child.kill();
  });
}
async function startServer() {
  if (!existsSync(nodeBinary)) throw new Error(t("安装包缺少 Node.js 运行时，请重新安装或运行 npm run desktop:prepare。"));
  // Finder and Windows GUI launches often have a smaller PATH than interactive shells.
  const gitPaths = process.platform === 'win32'
    ? [join(process.env.ProgramFiles || 'C:/Program Files', 'Git/cmd'), join(process.env.LOCALAPPDATA || '', 'Programs/Git/cmd')]
    : ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin'];
  const env: NodeJS.ProcessEnv = { ...process.env, PATH: [nodeBin, ...gitPaths.filter(existsSync), process.env.PATH || ''].join(delimiter),
    SPECFLOW_DATA_DIR: dataDirectory, SPECFLOW_LOCALE: locale, SPECFLOW_PORT: '0', SPECFLOW_DESKTOP_SECRET: secret, SPECFLOW_DESKTOP_PARENT_PID: String(process.pid),
    SPECFLOW_STATIC_ROOT: join(resourceRoot, 'web'), SPECFLOW_MAKA_PACKAGE: join(resourceRoot, 'maka'),
    SPECFLOW_MAKA_ROOT: process.env.SPECFLOW_MAKA_ROOT ? resolve(process.env.SPECFLOW_MAKA_ROOT) : join(dataDirectory, 'maka', MAKA_VERSION), SPECFLOW_PLUGIN_BUNDLE: join(resourceRoot, 'workspace-plugin/index.mjs'),
    SPECFLOW_PLUGIN_MANIFEST: join(resourceRoot, 'workspace-plugin/maka.extension.json'), npm_execpath: npmCli };
  delete env.NODE_OPTIONS; delete env.ELECTRON_RUN_AS_NODE;
  const git = spawnSync('git', ['--version'], { env, windowsHide: true, timeout: 10000, encoding: 'utf8' });
  if (git.status !== 0) throw new Error(t("未找到可用的 Git。Windows 请安装 Git for Windows；macOS 请安装 Xcode Command Line Tools 或 Git，完成后重新打开 SpecFlow。"));
  mkdirSync(dataDirectory, { recursive: true });
  server = spawn(nodeBinary, [join(resourceRoot, 'server.mjs')], { cwd: resourceRoot, env,
    windowsHide: true, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
  const child = server;
  child.stdout!.on('data', chunk => log(chunk.toString().trim()));
  child.stderr!.on('data', chunk => log(chunk.toString().trim()));
  child.on('exit', code => {
    log(`Backend exited: ${code}`);
    if (origin && !quitting) {
      dialog.showErrorBox(t("SpecFlow 服务已停止"), t("工程服务意外退出，请重新打开应用。诊断日志：{0}", {"0": logPath}));
      app.quit();
    }
  });
  return await new Promise<string>((done, reject) => {
    const timer = setTimeout(() => reject(new Error(t("工程服务启动超时。诊断日志：{0}", {"0": logPath}))), 60000);
    const fail = (error: Error) => { clearTimeout(timer); reject(error); };
    child.once('error', fail);
    child.once('exit', code => fail(new Error(t("工程服务启动失败（{0}）。诊断日志：{1}", {"0": code, "1": logPath}))));
    child.on('message', message => {
      const m = message as { type?: string; url?: string };
      if (m.type === 'specflow-ready' && m.url && /^http:\/\/127\.0\.0\.1:\d+$/.test(m.url)) { clearTimeout(timer); done(m.url); }
    });
  });
}
function createWindow() {
  const statePath = join(app.getPath('userData'), 'window.json');
  let bounds = { width: 1440, height: 940 };
  try { const saved = JSON.parse(readFileSync(statePath, 'utf8')); bounds = { width: Math.max(1000, Math.min(2400, Number(saved.width) || 1440)), height: Math.max(700, Math.min(1600, Number(saved.height) || 940)) }; } catch {}
  window = new BrowserWindow({ ...bounds, minWidth: 1000, minHeight: 700, title: 'SpecFlow', backgroundColor: '#f5f4ee', show: false,
    icon: join(app.getAppPath(), 'build/desktop/icon.png'),
    webPreferences: { preload: join(app.getAppPath(), 'dist/desktop/preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true } });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (new URL(url).origin !== origin && /^https:\/\//.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => { if (new URL(url).origin !== origin) event.preventDefault(); });
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, answer) => answer(false));
  window.webContents.session.setPermissionCheckHandler(() => false);
  window.webContents.session.webRequest.onBeforeSendHeaders({ urls: [`${origin}/*`] }, (details, answer) => {
    answer({ requestHeaders: { ...details.requestHeaders, 'X-Specflow-Desktop-Secret': secret, 'Accept-Language': locale } });
  });
  window.on('close', () => {
    const b = window!.getNormalBounds(); writeFileSync(statePath, JSON.stringify({ width: b.width, height: b.height }));
  });
  window.on('closed', () => { window = undefined; });
  window.once('ready-to-show', () => window?.show());
  void window.loadURL(`${origin}${desktopViewSearch(readViewState().last)}`);
}
function configureMenus() {
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(process.platform === 'darwin' ? [{ label: 'SpecFlow', submenu: [{ role: 'about' as const, label: t('关于 SpecFlow') }, { type: 'separator' as const }, { role: 'hide' as const, label: t('隐藏 SpecFlow') }, { role: 'hideOthers' as const, label: t('隐藏其他应用') }, { role: 'unhide' as const, label: t('显示全部') }, { type: 'separator' as const }, { role: 'quit' as const, label: t('退出 SpecFlow') }] }] : []),
    { label: t("文件"), submenu: [
      { label: t("打开数据目录"), click: () => { void shell.openPath(dataDirectory); } },
      { label: t("打开诊断日志"), click: () => { void shell.openPath(logsDirectory); } },
      { type: 'separator' }, { role: process.platform === 'darwin' ? 'close' : 'quit', label: process.platform === 'darwin' ? t("关闭窗口") : t("退出 SpecFlow") },
    ] },
    { label: t("编辑"), submenu: [{ role: 'undo', label: t('撤销') }, { role: 'redo', label: t('重做') }, { type: 'separator' }, { role: 'cut', label: t('剪切') }, { role: 'copy', label: t('复制') }, { role: 'paste', label: t('粘贴') }, { role: 'selectAll', label: t('全选') }] },
    { label: t("视图"), submenu: [{ role: 'reload', label: t('重新加载') }, { role: 'resetZoom', label: t('实际大小') }, { role: 'zoomIn', label: t('放大') }, { role: 'zoomOut', label: t('缩小') }, { role: 'togglefullscreen', label: t('切换全屏') }] },
    { label: t("帮助"), submenu: [
      ...(updateMenu?.items || []), { type: 'separator' },
      { label: t("关于 SpecFlow"), click: () => { void dialog.showMessageBox({ type: 'info', title: 'SpecFlow', message: `SpecFlow ${app.getVersion()}`, detail: t("软件工程流程工作台 · Maka Runtime Host\n{0}\n真实模型连接可在工程设置中添加。", {"0": updateMenu?.status() || ''}), buttons: [t('确定')] }); } },
    ] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.show(); window.focus(); } });
  app.on('before-quit', event => {
    if (quitting) return;
    event.preventDefault(); quitting = true;
    void stopServer().finally(() => app.quit());
  });
  app.on('will-quit', () => updateMenu?.dispose());
  app.on('window-all-closed', () => { if (process.platform !== 'darwin' && !replacingWindow) app.quit(); });
  app.on('activate', () => { if (origin && !window && !quitting) createWindow(); });
  void app.whenReady().then(async () => {
    locale = readDesktopLocale(localePath, app.getLocale());
    updateMenu = createUpdateMenu({
      window: () => window, log, isQuitting: () => quitting, locale: () => locale,
      prepareInstall: async () => { quitting = true; log('Stopping backend before update installation'); await stopServer(); },
      recoverFromFailedInstall: async () => {
        log('Update installation failed; restarting backend');
        origin = ''; server = undefined;
        try {
          origin = await startServer();
          // Recreate the window so its request-header filter uses the new service origin.
          replacingWindow = true;
          try {
            if (window && !window.isDestroyed()) window.destroy();
            createWindow();
          } finally { replacingWindow = false; }
          quitting = false;
        } catch (error) {
          log(`Update recovery failed: ${String(error)}`);
          dialog.showErrorBox(t("SpecFlow 更新失败"), t("请重新打开应用，或使用新版安装包覆盖安装。工程数据已保留。诊断日志：{0}", {"0": logPath}));
          app.quit();
        }
      },
    });
    configureMenus();
    ipcMain.on('specflow:initial-locale', event => {
      // Preload runs before navigation has committed, so its frame URL may still be empty.
      // This non-sensitive preference is scoped to our main frame; every synchronous call
      // must receive a reply so a rejected sender cannot leave the renderer blocked.
      let initial: Locale = 'zh-CN';
      try { if (window && event.sender === window.webContents && event.senderFrame === window.webContents.mainFrame) initial = locale; }
      finally { event.returnValue = initial; }
    });
    ipcMain.handle('specflow:read-locale', event => { trustedSender(event); return locale; });
    ipcMain.handle('specflow:set-locale', (event, value: unknown) => {
      trustedSender(event);
      try { locale = saveDesktopLocale(localePath, value); }
      catch (error) { throw new Error(t((error as Error).message)); }
      configureMenus();
      updateMenu?.refresh();
      return locale;
    });
    ipcMain.handle('specflow:pick-repository', async event => { trustedSender(event); const selected = await dialog.showOpenDialog(window!, { title: t("选择 Git 仓库"), buttonLabel: t('选择文件夹'), properties: ['openDirectory'] }); return selected.canceled ? null : selected.filePaths[0]; });
    ipcMain.handle('specflow:open-data', async event => { trustedSender(event); await shell.openPath(dataDirectory); });
    ipcMain.handle('specflow:read-view', (event, itemId: unknown) => {
      trustedSender(event);
      if (!validViewItemId(itemId)) throw new Error(t("无效的工作项视图标识"));
      return readViewState().items.find(view => view.item === itemId) || null;
    });
    ipcMain.handle('specflow:save-view', (event, value: unknown) => {
      trustedSender(event);
      let state;
      try { state = updateDesktopViewState(readViewState(), value); }
      catch (error) { throw new Error(t((error as Error).message)); }
      const temporaryPath = `${viewStatePath}.tmp`;
      writeFileSync(temporaryPath, JSON.stringify(state), { encoding: 'utf8', mode: 0o600 });
      renameSync(temporaryPath, viewStatePath);
    });
    ipcMain.handle('specflow:export', async (event, itemId: unknown) => {
      trustedSender(event);
      if (typeof itemId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(itemId)) throw new Error(t("无效的工作项标识"));
      const save = await dialog.showSaveDialog(window!, { title: t("导出工程记录"), buttonLabel: t('导出'), defaultPath: `specflow-${itemId}.json`, filters: [{ name: t("工程记录"), extensions: ['json'] }] });
      if (save.canceled || !save.filePath) return;
      const response = await fetch(`${origin}/api/work-items/${itemId}/export`, { headers: { 'X-Specflow-Desktop-Secret': secret, 'Accept-Language': locale } });
      if (!response.ok) throw new Error(t("工程记录导出失败"));
      writeFileSync(save.filePath, await response.text(), 'utf8');
    });
    origin = await startServer(); createWindow();
    updateMenu.start();
    log(`Desktop started ${app.getVersion()} ${process.platform}/${process.arch}`);
  }).catch(error => { log(String(error)); dialog.showErrorBox(t("SpecFlow 启动失败"), String(error.message || error)); app.quit(); });
}
