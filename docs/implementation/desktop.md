# SpecFlow 桌面版

日期：2026-10-12。桌面代码支持 Windows x64、macOS Apple Silicon 与 Intel。
Windows 已生成安装包并通过打包程序验收；macOS 原生构建和启动验收等待 Mac 或 CI 执行。

当前内置 Maka 0.2.0 暂时从 Apache 的签名正式源码包构建，后续改为正式 npm 依赖。安装包只包含 Runtime Host 及生产依赖，继续禁止 dev。底座独立选择、切换和新适配器暂缓。参见 [运行时管理记录](maka-runtime-management.md)。

## 安装与运行

Windows 安装包位于 `release/SpecFlow-0.1.0-win-x64.exe`。安装向导支持选择安装目录，创建桌面和开始菜单快捷方式。开发者也可直接打开 `release/win-unpacked/SpecFlow.exe`。

安装包包含 Electron、固定版 Node.js 24.19.0、npm、Maka 0.2.0 Runtime Host、工作区扩展和前后端资源。Maka 源码、编译器、测试、CLI/Eval 和构建缓存不进入安装包。运行时不要求用户安装 Node.js、GPG 或执行 npm。应用仍使用本机 Git；验证其他项目时需要该项目自身的工具链。

macOS 构建输出 `SpecFlow-0.1.0-mac-arm64.dmg/.zip` 和 `SpecFlow-0.1.0-mac-x64.dmg/.zip`。DMG 中的应用拖入 Applications 后运行。两个架构分别构建，避免混合本地模块与运行时。

当前安装包未配置发布签名。Windows 没有 Authenticode 签名；macOS 尚无 Developer ID 与公证结果。公开发布时需要在原生构建环境补齐证书和 Apple 公证。

## 桌面行为

- 使用独立窗口、系统菜单和图标，保留上次窗口尺寸。
- 单实例运行，再次打开会唤起原窗口。
- 自动启动随包工程服务，由操作系统分配空闲端口。
- 主进程为本地请求添加会话凭据，普通浏览器无法访问桌面接口。
- 页面使用隔离上下文和渲染沙箱，不开放 Node.js 与任意 IPC。
- 原生目录选择器用于注册仓库，保存对话框用于导出工程记录。
- Windows 关闭最后窗口即退出；macOS 关闭窗口保留应用，Cmd+Q 退出。
- 正常退出通知服务清理验证器、HTTP/SSE、Maka 和 SQLite。
- 父进程连接丢失时服务关闭；独立存活检测覆盖 IPC 未及时断开的崩溃情况。超时退出对应用所属服务进程执行清理。

应用把数据放在系统用户目录：

| 系统 | 默认位置 |
| --- | --- |
| Windows | `%APPDATA%/SpecFlow/engineering` |
| macOS | `~/Library/Application Support/SpecFlow/engineering` |

日志保存在对应的 `SpecFlow/logs/desktop.log`。菜单“文件”可以打开数据和日志目录。
卸载保留工程数据。桌面与 Web 工作台默认使用各自的数据目录；已有 Web 工程不会自动迁移。避免同时让两个服务使用同一个 SQLite 和 Maka 状态根。

正式 Maka 的运行状态位于 `engineering/maka/0.2.0`，Web 版对应 `.specflow-data/local/maka/0.2.0`。此前 dev 的状态目录保留，未尝试降级迁移；SpecFlow 工程数据库和 Git 工作区保留。旧 Maka 会话和连接不会自动迁入正式版，真实连接可在设置中重新添加。

## 开发与打包

```powershell
npm ci
npm run maka:setup
npm run desktop:dev
```

`desktop:dev` 构建当前界面、下载并校验运行时，然后打开桌面窗口。若只需准备资源，执行 `npm run desktop:prepare`。

```powershell
npm run desktop:package:win
npm run desktop:smoke:packaged
```

在 Apple Silicon Mac 执行 `npm run desktop:package:mac:arm64`；Intel Mac 执行 `npm run desktop:package:mac:x64`。直接执行 `npm run desktop:package:mac` 使用当前 Mac 的架构。

构建需要匹配的系统与 CPU 架构。Windows 无法可靠保留 macOS 包中的符号链接和可执行权限，因此脚本在跨系统构建前明确拒绝，防止输出损坏的应用。运行时下载来自 nodejs.org，校验官方 `SHASUMS256.txt`，记录保存在包内 `runtime-integrity.json`。

`.github/workflows/desktop.yml` 配置 Windows、Apple Silicon Mac 和 Intel Mac 三个原生任务。支持手动触发或 `desktop-v*` 标签触发，先测试，再打包并验收打包程序，最后上传安装包。当前没有推送或触发远端任务。

## 验收证据

Windows 的开发桌面和打包程序均从与工程无关的工作目录启动，使用隔离的临时用户目录，通过：

1. 随包运行时启动、渲染隔离、未认证接口拒绝访问。
2. 第二实例退出，保留原窗口和服务。
3. 仓库选择 IPC 与界面填写。
4. 完整 CSV 工程链：文档复核与接纳、真实代码修改、Node 测试、Git 接纳。
5. 从正式源码构建的随包 Maka Host 能启动并安装工作区扩展，继续拒绝遗留开发快照。
6. 记录保存 IPC，实际生成可解析的工程 JSON。
7. 正常退出后监听端口关闭，重启保留已接纳工作项。
8. 桌面主进程被强制结束后，父进程存活检测关闭工程服务。

选择目录与保存路径在自动测试中用固定选择结果替代人工点击，其余窗口、IPC、文件写入、进程、Maka Host 和工程链均实际执行。真实云端供应商验证仍按约定后补。

验收输出位于 `release/desktop-smoke-win32-x64.json`，截图为 `release/desktop-win32-x64.png`。源码内置版的 22 项测试全部通过，包括真实 Host、本地协议、正式来源验证和生产依赖闭包。SpecFlow 工程服务的生产依赖审计无已知漏洞；Maka 正式源码锁定的生产依赖中，6 个包存在当前审计告警（4 高、2 中），记录见 `maka-dependency-audit.json`，未自动改写官方锁文件。macOS 尚未在真实系统执行；CI 配置不能代替通过记录。

Electron 44 的测试启动器与实际桌面主进程具有不同 PID。崩溃检查通过主进程上下文读取 PID，再强制结束该进程，避免把结束启动器误当作应用崩溃。

## Claude Code 复核入口

新增重点：`apps/desktop/main.ts`、`preload.ts`、`scripts/desktop.mjs`、`desktop-smoke.mjs`、`electron-builder.yml`、CI 配置，以及 `apps/server/src/main.ts` 的退出逻辑。

复核 IPC 调用来源、动态端口认证、安装资源只读、运行时完整性、后台生命周期、macOS 原生模块与签名、公证和升级后的数据保留。本次未调用外部 Claude Code。
