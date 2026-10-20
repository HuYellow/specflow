# SpecFlow 桌面安装、更新与发布

更新日期：2026-10-20。目标平台为 Windows x64、macOS Apple Silicon 和 macOS Intel。桌面版使用独立 Electron 窗口，自动管理本地工程服务与 Maka Runtime Host。

当前内置 Maka 0.2.0 从 Apache 签名正式源码发行版构建，仅包含 Runtime Host 及生产依赖。源码、编译器、测试、CLI/Eval 和构建缓存不进入桌面包；禁止使用 dev、nightly、snapshot、RC、占位包或其他开发构建替代正式版本。当前继续使用 Maka，独立底座选择、切换和新增适配器暂缓。详见 [运行时管理](maka-runtime-management.md)。

## 获取安装包

正式安装包入口为 [GitHub Releases](https://github.com/HuYellow/specflow/releases)，最新正式版本入口为 [Latest Release](https://github.com/HuYellow/specflow/releases/latest)。发行页提供平台安装包、应用更新元数据和 `SHA256SUMS.txt` 校验文件。Actions artifact 是构建产物，只有正式 Release 中的完整资产才构成应用更新源。

| 系统与架构 | 文件 | 安装方式 |
| --- | --- | --- |
| Windows x64 | `SpecFlow-<版本>-win-x64.exe` | 运行安装向导，可选择安装目录并创建桌面、开始菜单快捷方式 |
| macOS Apple Silicon | `SpecFlow-<版本>-mac-arm64.dmg` | 打开 DMG，将 SpecFlow 拖入 Applications |
| macOS Intel | `SpecFlow-<版本>-mac-x64.dmg` | 打开 DMG，将 SpecFlow 拖入 Applications |

macOS 同时生成同架构的 `.zip`，供更新器使用或手动解压安装。Windows 的 `release/win-unpacked/SpecFlow.exe` 供开发验收使用，正式用户应通过安装程序安装。安装和覆盖升级无需先卸载旧版。

Windows 选择磁盘根目录时，安装器会立即在目录输入框显示完整目标，例如选择 `H:\` 后显示 `H:\specflow`，确认安装后才创建该子目录。选择具体文件夹时直接使用该文件夹，例如 `H:\Apps\MyWorkbench`，不再追加目录；已经选择 `H:\specflow` 也不会重复嵌套。取消“浏览文件夹”保留原路径。

安装包包含 Electron、固定版 Node.js 24.19.0、npm、Maka 0.2.0 Runtime Host、工作区扩展和前后端资源。用户无需安装 Node.js、GPG 或执行 npm。应用依赖本机 Git：Windows 安装 Git for Windows；macOS 安装 Xcode Command Line Tools 或 Git。运行项目验证命令还需要项目自身的编译器、包管理器等工具。

Windows 已有打包程序本机验收记录。macOS 需要原生构建与运行验收。当前尚未配置 Windows Authenticode 签名、macOS Developer ID 签名及 Apple 公证，尚无对应通过记录；操作系统可能对未签名应用显示安全提示。

2026-10-20 已正式发布 [SpecFlow 0.1.3](https://github.com/HuYellow/specflow/releases/tag/desktop-v0.1.3)，并设为 Latest。[原生 CI](https://github.com/HuYellow/specflow/actions/runs/39369191126) 的 Windows x64、macOS arm64、macOS x64 及发布任务全部通过：各平台 151 项测试、原生安装包构建、源码目录外启动及完整打包验收成功；Windows 另通过 17 个安装目录路径案例和 5 次静默目录检查。三个目标来自标签提交 `9d1d2195cf7212092d3abe0afdf5e25ad457a39c`。首次发布修复了 macOS 源码真实路径比较、空证书链接、随包 npm 链接，以及 901–1119px 紧凑桌面导航入口。

发行页包含五个安装文件（Windows EXE、两个 macOS 架构的 DMG/ZIP）、五个 blockmap、Windows/macOS 更新清单与 SHA-256 校验文件，共 13 项。发布后已确认正式非预发布状态、Latest 指向、标签提交、资产完整性、GitHub 上传 SHA-256 与 `SHA256SUMS.txt` 一致，以及更新清单的版本和安装包大小。以上验收不代表安装包已签名、公证，也不代表跨版本升级已实际完成。

## 检查与安装更新

安装版使用 `electron-updater`，从 `config/desktop-release.json` 指定的 GitHub 仓库读取正式发行版本，当前发布源为 `HuYellow/specflow`，通道为 `latest`。发布源在构建时固定，界面不接受任意更新服务器地址。开发模式不执行真实安装更新。

用户可以通过原生“帮助”菜单完成更新：

1. **检查更新…**：显示当前版本和检查结果；发现新版后提供下载入口。手动检查遇到网络或发行元数据错误时显示可重试信息。
2. **下载更新…**：只有用户选择后才下载，菜单显示下载状态；下载完成后可选择稍后安装。
3. **重启并安装更新…**：明确提醒先保存文档、等待运行结束；再次确认后关闭工程服务并交给更新器安装和重启。
4. **下载与发行说明**：打开 GitHub Releases 页面，用于查看变更、首次安装或手动升级。

“关于 SpecFlow”显示应用版本和更新状态。应用启动 15 秒后检查一次，之后每 6 小时检查一次；后台网络失败仅写入诊断日志，后续仍可手动重试。检查不会自动下载，正常退出也不会自动安装已下载的更新。

Windows 使用 NSIS 安装包原位更新。本项目的 macOS 原位更新构建要求 Developer ID 签名与 Apple 公证；未签名构建仍可检查新版和打开下载页面，用户下载匹配架构的新 DMG 后，将新版拖入 Applications 替换旧版。macOS ZIP 是自动更新的必要资产，不能只上传 DMG。

更新器校验发行元数据中的下载文件哈希；macOS 原位更新还依赖系统签名校验。校验哈希不能代替安装包签名，维护者仍需保护发布仓库和签名证书。签名、网络、平台或元数据不满足条件时，可通过 Releases 页面手动安装。

更新只替换应用文件。工程数据库、工作区和 Maka 状态位于用户数据目录；升级前可通过“文件 → 打开数据目录”备份工程数据。更新不会把 Web 工作台的数据自动迁入桌面版。

## 桌面行为与数据

- 独立窗口、系统菜单和图标，保留上次窗口尺寸与工作项查看位置。
- 单实例运行，再次打开唤起原窗口。
- 自动启动随包工程服务，由操作系统分配空闲端口。
- 主进程为本地请求添加会话凭据，普通浏览器不能访问桌面接口。
- 页面使用隔离上下文和渲染沙箱，不开放 Node.js 与任意 IPC。
- 原生目录选择器用于注册仓库，保存对话框用于导出工程记录。
- Windows 关闭最后窗口即退出；macOS 关闭窗口保留应用，Cmd+Q 退出。
- 正常退出时清理验证器、HTTP/SSE、Maka 和 SQLite；父进程丢失时工程服务退出，超时退出会清理应用所属服务进程。

| 数据 | Windows | macOS |
| --- | --- | --- |
| 工程数据与工作区 | `%APPDATA%/SpecFlow/engineering` | `~/Library/Application Support/SpecFlow/engineering` |
| 诊断日志 | `%APPDATA%/SpecFlow/logs/desktop.log` | `~/Library/Application Support/SpecFlow/logs/desktop.log` |

“文件”菜单可打开数据和日志目录。卸载保留工程数据。桌面与 Web 工作台默认使用各自的数据目录；避免让两个服务同时使用同一个 SQLite 数据库和 Maka 状态根。

正式 Maka 状态位于 `engineering/maka/0.2.0`，Web 版对应 `.specflow-data/local/maka/0.2.0`。此前 dev 状态目录保留，不做降级迁移；SpecFlow 工程数据库和 Git 工作区保留。旧 Maka 会话和连接不会自动迁入正式版，真实模型连接可在设置中重新添加。

固定版 Maka 的内置文件 worker 在 Windows 上不可用，因此使用 `specflow.workspace` Host 扩展访问 SpecFlow 创建的工作区，不自动启用全局 Bypass。插件存储的两处目录 fsync 需要 Windows 兼容补丁，只有固定版本与原始文件哈希符合时才应用，记录见包内 `specflow-compatibility.json`。文件和日志仍会刷新，目录元数据的断电持久性不作保证。工作区文件边界不构成操作系统沙箱，验证命令会在本机执行。

## 开发与打包

开发环境需要 Node.js 24、npm、Git 和 GPG。首次准备：

```powershell
npm ci
npm run maka:setup
npm run desktop:dev
```

`desktop:dev` 构建界面、下载并校验 Node.js 运行时，再打开桌面窗口。只准备资源可运行 `npm run desktop:prepare`。

```powershell
# Windows x64
npm run desktop:package:win
npm run desktop:smoke:packaged
npm run desktop:smoke:installer-directory

# Apple Silicon Mac
npm run desktop:package:mac:arm64

# Intel Mac
npm run desktop:package:mac:x64
```

直接运行 `npm run desktop:package:mac` 使用当前 Mac 架构。构建必须匹配系统和 CPU 架构：Windows 不能可靠保留 macOS 包的符号链接、可执行权限和本地模块，脚本因此拒绝跨系统或跨架构打包。

Node.js 运行时来自 nodejs.org，构建时校验官方 `SHASUMS256.txt`，记录保存在包内 `runtime-integrity.json`。Maka 准备、运行和打包均检查 `config/maka-release.json` 中固定的版本、来源、源码校验和及签名者指纹。无法取得或适配正式发行版时构建失败，不回退到开发包。

产物写入 `release/`。安装包以 `package.json` 的 `version` 命名，版本变更后，示例文件名中的 `<版本>` 随之变化。

## 发布正式版本

发布源由 `config/desktop-release.json` 统一定义：

```json
{
  "schemaVersion": 1,
  "provider": "github",
  "owner": "HuYellow",
  "repo": "specflow",
  "channel": "latest",
  "tagNamePrefix": "desktop-v"
}
```

维护者迁移或 fork 仓库时，应先修改此配置，使安装包内置的更新源与实际发布仓库一致，再构建发布。现有安装版继续查询构建时的发布源；仅修改仓库配置不会改变已经安装的应用。

日常检查与桌面发布分别由两个工作流负责：

| 工作流与触发 | 行为 |
| --- | --- |
| `ci.yml`：推送到 `main`、面向 `main` 的 PR、手动运行 | 在 Windows、Node.js 24 环境准备已批准的正式 Maka 运行包，执行类型检查、测试和构建 |
| `desktop.yml`：推送到 `main` | 校验 `package.json` 与锁文件版本；当前版本高于所有已公开正式桌面版时，自动执行三平台测试、构建、打包验收和发布。同版本已公开时跳过桌面打包，普通提交仍由 CI 检查 |
| `desktop.yml`：推送 `desktop-v<版本>` 标签 | 标签必须与源码中的正式版本完全匹配，三个原生目标通过后发布 |
| `desktop.yml`：手动运行，`publish=false`（默认） | 执行三平台构建与验收，仅上传保留 14 天的 Actions artifacts |
| `desktop.yml`：手动运行，`publish=true` | 仅允许从 `main` 或匹配版本的标签发布，使用与自动发布相同的版本、来源与资产检查 |

推荐将版本变更作为发布开关，无需手工创建标签：

```powershell
# 修复版本；新增功能可改用 minor
npm version patch --no-git-tag-version
git add package.json package-lock.json
# 同时暂存本次需要发布的源码变更，再提交并推送
git commit -m "chore(release): bump desktop version"
git push origin main
```

版本必须为 `主版本.次版本.修订版本` 的正式数字版本。工作流在准备阶段固定本次源码的完整 commit SHA，三个原生任务均检出该提交；发布时自动创建指向同一 SHA 的 `desktop-v<版本>` 标签。已有标签必须指向该提交，禁止移动。已经公开的版本不会被覆盖或降级；修复已发布版本时应升版后重新发布。

`.github/workflows/desktop.yml` 在 Windows x64、Apple Silicon Mac 和 Intel Mac 三个原生环境中分别准备正式 Maka 运行包、执行测试、构建安装包，并从源码目录以外启动打包应用完成验收。Windows 另执行 NSIS 安装目录规则检查。三个目标都成功后，发布任务才汇总安装文件和更新元数据。无法取得或适配批准的 Apache Maka 正式发行版时明确失败，不回退到开发构建。

自动发布使用 Actions 自带的 `GITHUB_TOKEN`，无需新增 PAT 或发布 Token。工作流默认只有 `contents: read`，仅发布 job 获得 `contents: write`，用于创建标签和 Release。签名身份与证书按下表单独配置；macOS 原位更新需要稳定的 Developer ID 签名和完整公证凭据，未配置时生成支持手动更新的安装包。Windows 建议使用 Authenticode 签名，降低系统安全提示并验证发布者身份。

更新日志由 `scripts/desktop-changelog.mjs` 根据上一个已公开正式桌面版至本次提交之间的 Git 记录自动生成：按 Conventional Commit 类型归入中文分类，保留原始提交主题，包含直接提交到仓库而未经过 PR 的变更，不调用 AI 服务。失败标签、草稿和预发布版本不作为更新日志基线。发行说明还包含平台下载表、源码提交及版本比较链接；签名、公证与更新能力根据三个原生构建实际生成的记录填写。生成的说明另保存为 `release-notes` artifact，保留 90 天。

CI Secrets 配置如下；证书链接或其 Base64 内容由 electron-builder 读取，不应写入仓库：

| Secrets | 用途 | 配置要求 |
| --- | --- | --- |
| `MAC_CSC_LINK`、`MAC_CSC_KEY_PASSWORD` | macOS Developer ID 证书及口令 | macOS 原位更新需要 |
| `APPLE_ID`、`APPLE_APP_SPECIFIC_PASSWORD`、`APPLE_TEAM_ID` | Apple 公证账号、专用口令与团队 | macOS 原位更新需要 |
| `WIN_CSC_LINK`、`WIN_CSC_KEY_PASSWORD` | Windows Authenticode 证书及口令 | 可选，建议配置 |

缺少签名与公证配置的 macOS 应用使用检查更新与手动安装路径，不提供原位更新。若发行方要求 macOS 必须签名和公证，可设置仓库变量 `SPECFLOW_REQUIRE_SIGNED_RELEASE=true`；此时缺少凭据将使构建明确失败。

Release 必须完整保留以下资产，不能只上传可见安装包：

| 资产 | 用途 |
| --- | --- |
| Windows `.exe` | 首次安装与 NSIS 更新 |
| macOS arm64 / x64 `.dmg` | 首次安装、手动升级 |
| macOS arm64 / x64 `.zip` | macOS 自动更新 |
| `latest.yml` | Windows 正式通道版本和文件校验元数据 |
| `latest-mac.yml` | 合并两个 macOS 架构的版本和文件校验元数据 |
| `.blockmap` | 更新器生成的分块下载元数据 |
| `SHA256SUMS.txt` | 所有安装文件与更新元数据的 SHA-256 校验值 |

工作流合并两个 macOS 构建生成的更新元数据，避免上传同名文件时覆盖另一个架构。发布先创建草稿，上传完整的 13 项资产，再逐项核对 GitHub 返回的 SHA-256 digest 和文件大小；全部一致后才公开并设为 Latest。更新版本必须高于用户当前安装版本；相同版本重新上传安装包不会构成新版本更新。

上传失败后，可在 Actions 重跑原任务，复用同标签、同一源码 SHA 的草稿并补齐上传。已有标签或草稿对应的源码需要修改时，应提交新版本，不能移动标签或覆盖正式资产。发布后仍应使用已安装的上一版本验证“检查 → 下载 → 重启安装”。

2026-10-20 已通过推送 `main` 中的版本变更，实际自动发布 [SpecFlow 0.1.4](https://github.com/HuYellow/specflow/releases/tag/desktop-v0.1.4)。[日常 CI](https://github.com/HuYellow/specflow/actions/runs/39372630096) 与[完整自动发布流程](https://github.com/HuYellow/specflow/actions/runs/39372630136) 均通过：准备阶段、三个原生打包验收任务和发布任务全部成功。标签由 `github-actions[bot]` 自动创建，指向构建提交 `6e6a45191a8688a66fbba7db0fd270397ae949d7`；发行日志以上一个已公开版本 `0.1.3` 为基线自动生成。公开后的 13 项资产、Latest 指向、源码标签、更新清单和 SHA-256 均已再次核对。首次运行中发现的 PowerShell 7 模块路径影响 Windows 签名检查的问题已修复，并加入 Windows 原生回归测试。签名、公证及跨版本原位升级仍按实际验收结果记录。

## 验收范围与限制

Windows 桌面验收使用隔离临时用户目录；打包验收先把完整应用复制到源码目录以外，再从系统临时工作目录启动，避免借用仓库依赖。也可用 `node scripts/toolchain.mjs desktop-smoke --executable 'H:\specflow\SpecFlow.exe'` 验收实际安装目录。覆盖：

1. 随包运行时启动、渲染隔离、未认证接口拒绝访问。
2. 第二实例退出，保留原窗口和服务。
3. 仓库选择、记录导出 IPC 与真实文件写入。
4. CSV 完整工程链：文档复核与接纳、真实代码修改、Node 测试、Git 接纳。
5. 正式源码构建的 Maka Host 启动并安装工作区扩展，拒绝遗留开发快照。
6. 正常退出关闭端口，重启保留工作项；主进程被强制结束后工程服务退出。

选择目录与保存路径在自动测试中使用固定选择结果，其余窗口、IPC、进程、Maka Host 和工程链均实际执行。验收输出为 `release/desktop-smoke-win32-x64.json`，截图为 `release/desktop-win32-x64.png`。更多需求、澄清和空间切换验收见 [前端交付记录](frontend-workbench-delivery.md)。

2026-10-15 本机验证结果：类型检查通过，137 项全量回归与补充的 13 项更新状态测试通过；Windows 安装包构建成功，打包应用的 11 类验收通过，其中包含原生更新菜单、正式 Maka Host、完整 CSV 工程流程及退出恢复。`latest.yml` 中的 SHA-512、文件大小与实际安装包一致，独立 SHA-256 文件为 `release/SpecFlow-0.1.0-win-x64.exe.sha256`。

安装目录回归通过 `npm run desktop:smoke:installer-directory` 执行，真实 NSIS 编译运行覆盖 17 种路径与 5 种静默 `/D=` 入口。原生测试向导还验证了根目录即时回显、继续输入自定义目录、浏览取消保留原路径及中文文件夹；测试向导仅写隔离报告，不安装应用。目录规则也在 Windows CI 中检查。

更新状态测试使用模拟更新器验证显式下载与安装门槛、并发去重、失败重试、关闭后台的顺序和发布元数据处理；首次真实 Release 已于 2026-10-20 发布并核对线上资产。**跨版本下载安装、Windows 正式签名、macOS 签名与公证及原生升级仍需在发布环境验收**，发行资产在线可用不等于升级链已完整验证。

真实云端供应商的质量、费用元数据和长任务恢复仍按约定后补。Maka 官方源码锁定的生产依赖审计记录见 [依赖审计](maka-dependency-audit.json)，不会为消除告警自动改写官方锁文件。

后续排查发现旧测试虽切换工作目录，仍会沿应用文件的父目录借用仓库依赖。现已修复安装包遗漏后端依赖与 Windows npm 的问题，并增加包内依赖解析校验、源码目录外启动及实际安装目录验收，详见 [Windows 启动失败修复记录](desktop-startup-repair.md)。

## Claude Code 复核入口

桌面与更新实现重点为 `apps/desktop/main.ts`、`apps/desktop/updates.ts`、`apps/desktop/update-menu.ts`、`apps/desktop/preload.ts`、`scripts/desktop.mjs`、`scripts/desktop-smoke.mjs`、`scripts/desktop-release.mjs`、`scripts/desktop-ci.mjs`、`scripts/desktop-changelog.mjs`、`electron-builder.yml`、`config/desktop-release.json`、`.github/workflows/ci.yml`、`.github/workflows/desktop.yml`，以及 `apps/server/src/main.ts` 的退出逻辑。

复核应检查 IPC 来源、动态端口认证、安装资源只读、运行时完整性、工程服务退出、更新状态与确认流程、安装退出与服务清理、发布源固定、macOS 架构元数据合并、签名与公证要求及更新后数据保留。CI/CD 另应复核版本门槛、源码 SHA 与标签不可变、草稿恢复、已公开版本保护、更新日志基线和上传资产完整性。验收记录应区分本地模拟、原生运行和真实线上发布，不以配置存在代替通过记录。
