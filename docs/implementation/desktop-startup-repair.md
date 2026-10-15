# Windows 安装版启动失败排查与修复

2026-10-15，实际安装目录为 `H:\specflow`。原安装版弹出“工程服务启动失败（1）”。

## 根因与证据

安装目录的 `resources/specflow/node_modules` 整体缺失。使用安装包自带的 Node 直接运行 `resources/specflow/server.mjs`，进程以状态 1 退出，错误为 `ERR_MODULE_NOT_FOUND: Cannot find package 'zod'`；单独解析 `fastify` 也失败。

`resources/runtime/node_modules` 同样缺失，因此 npm 启动脚本指向了不存在的 `node_modules/npm/bin/npm-cli.js`。嵌套的 Maka 生产依赖目录 `resources/specflow/maka/node_modules` 存在。

构建阶段已经通过 `npm ci --omit=dev` 生成生产依赖，但 electron-builder 26.15.3 的 `app-builder-lib/out/util/filter.js` 在通用文件复制时跳过 FileSet 根目录的 `node_modules`。原配置整体复制 backend 和 runtime，导致这两个目录被过滤。

此前的桌面 smoke 从仓库下的 `release/win-unpacked` 启动。Node 的模块解析沿父目录查找，意外找到了仓库的 `node_modules`，因此完整工程流程也没有发现安装包缺包。只把工作目录切到系统临时目录无法阻止这种解析。

## 修复

- 在 `electron-builder.yml` 中单独映射 backend 的 `node_modules`，保留锁文件确定的生产依赖。
- 在 `win.extraResources` 中单独映射 Windows Node 的 `node_modules`，保留 npm 及其依赖。macOS 的 npm 位于嵌套的 `runtime/lib/node_modules`，沿用整体 runtime 映射。
- `scripts/desktop-smoke.mjs --packaged` 先把完整应用复制到仓库以外，再启动应用。
- smoke 启动前使用随包 Node 加载 `fastify`、`@fastify/static`、`yaml`、`zod`，校验解析位置属于包内依赖目录，并实际执行随包 npm 的 `--version`。
- smoke 支持 `--executable` 指定实际安装的应用，仍使用隔离用户数据，完整执行既有桌面验收。

Maka 继续使用签名正式源码构建的 Apache Maka 0.2.0 Runtime Host，发布版本、源码校验和与签名者指纹不变。本次未引入其他执行底座。

## 验证与复核

旧安装版通过新增 smoke 预检复现失败，错误为包内依赖目录不存在；失败记录保存在本机 `.tools/startup-repair-backup-20261015/installed-before.json`。

修复包的隔离验收记录为 `release/startup-repair-isolated-smoke.json`，包含实际临时应用路径、Node/npm 版本、模块解析路径，以及完整工程流程、正式 Maka Host、重启恢复、正常退出与崩溃清理等结果。

本机已从通过隔离验收的应用中补齐 `H:\specflow` 缺失的两个依赖目录，没有重装或清空数据。对实际安装的 `H:\specflow\SpecFlow.exe` 执行完整 smoke 成功，记录为 `release/startup-repair-installed-smoke.json`。随后使用默认用户目录启动成功，已有工作项页面加载成功，记录为 `release/startup-repair-original-data.json`，截图为 `release/startup-repair-installed.png`。工程数据库和原诊断日志已在本机 `.tools/startup-repair-backup-20261015` 备份。

启动修复当时生成的安装包为 `release/SpecFlow-0.1.0-win-x64.exe`。已直接读取 NSIS 内的 `app-64.7z`，确认包含 backend 的 fastify、zod 和 Windows npm CLI。当时的安装包为 169018348 字节，SHA-256 为 `1f83ded03316c1a4ce2669ac2ef0715d7003ba635e8dc38516f6306d20707ea3`；`latest.yml` 中的大小与 SHA-512 均已校验，另见 `release/startup-repair-installer.json`。后续目录回显改动已重新生成同名安装包，当前文件以同目录的 `.sha256` 和 `latest.yml` 为准。本次对已有安装采用补齐文件的修复方式，未重新执行 NSIS 安装向导。

Claude Code 复核入口：`electron-builder.yml`、`scripts/desktop-smoke.mjs`、本记录，以及上述运行证据。重点检查打包文件过滤、依赖解析是否来自包内、Windows npm 的依赖完整性、macOS 路径推导和正式 Maka 发布约束。本次执行了独立只读复核，未调用外部 Claude Code。
