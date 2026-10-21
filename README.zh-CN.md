# SpecFlow

[English](README.md) | 简体中文

**把需求、模型执行、真实测试和代码接纳放进同一条可追溯的工程流程。**

SpecFlow 是面向本地 Git 仓库的软件工程工作台，提供独立桌面应用和可安装到 **DeepSeek Harness（DSH）** 的插件。两种入口共用工程核心：从需求和澄清出发，逐步生成规格、设计、任务与候选代码，并根据复核结果和真实测试证据决定是否接纳。

桌面版采用 **SpecFlow 工程控制层 + 可选择的执行底座**，默认使用内置 Apache Maka Runtime Host，也可连接本机 OpenCode 服务。DSH 插件使用宿主配置的模型和独立执行会话。文档、代码、运行记录与输入版本相互关联，需求或上游文档变化后，已有结果会标记为过期，接纳前会再次检查。

## 能做什么

- **围绕项目组织工作**：一个工程工作空间对应一个 Git 项目，工作项拥有独立分支、候选工作区和工程产物。
- **让需求进入执行上下文**：需求正文与文档快照进入冻结输入，项目章程与澄清答复随尝试保存版本和哈希；桌面版提供 Markdown/TXT 上传、粘贴和仓库文件导入入口。
- **保留完整依据，降低阅读成本**：同时提供 AI 使用的完整 Markdown 文档和供人阅读的简报，并支持人工编辑；桌面版另提供版本比较与离线 HTML 导出。
- **用证据控制接纳**：文档复核、双视角检查、实际验证命令、代码差异和接纳预检共同决定能否进入下一阶段。
- **按工程选择执行底座**：桌面版支持 Maka 与 OpenCode，模型目录与角色默认按底座选择，新尝试与历史运行保留各自的执行身份。
- **在本机完成工程闭环**：桌面应用自动管理本地服务与 Maka Host；OpenCode 由用户单独启动。模型供应商凭据由对应底座管理，OpenCode 的服务认证保存在本机连接配置中，工程导出不包含这些凭据。
- **在 DSH 聊天旁管理工程**：原生 Specflow 面板提供工程与需求管理、四角色模型配置、阶段执行、澄清答复、文档、代码验证和人工接纳；聊天中的 `specflow_query` 工具可只读查询当前仓库的工程状态。

## 选择使用方式

| 使用方式 | 操作入口 | 模型执行 | 安装与数据 |
| --- | --- | --- | --- |
| 独立桌面版 | SpecFlow 工程窗口 | 默认内置 Maka；可连接本机 OpenCode | 平台安装包；工程数据位于桌面应用数据目录 |
| DSH 插件 | Harness 会话右侧的 Specflow 标签 | 使用 Harness 中配置的模型，按尝试创建独立会话 | 公开 `.tgz` / 固定提交的 Git 插件包；默认数据目录为 `$DSH_HOME/specflow` |

桌面版与插件共享 `packages/specflow-core` 中的流程和接纳规则，分别构建和发布。插件源码、依赖锁文件与发布清单位于 `plugins/deepseek-specflow`。已有桌面数据不会自动迁移到插件。

## 安装桌面版

从 [GitHub Releases](https://github.com/HuYellow/specflow/releases) 选择版本，下载与你的系统和架构匹配的安装包。

最新正式版本见 [Latest Release](https://github.com/HuYellow/specflow/releases/latest)。发行资产包含平台安装包、应用更新元数据和 `SHA256SUMS.txt` 校验文件。

| 系统 | 安装文件 | 安装方式 |
| --- | --- | --- |
| Windows x64 | `SpecFlow-<版本>-win-x64.exe` | 运行安装向导，选择安装目录，从桌面或开始菜单启动 |
| macOS Apple Silicon | `SpecFlow-<版本>-mac-arm64.dmg` | 打开 DMG，将 SpecFlow 拖入 Applications |
| macOS Intel | `SpecFlow-<版本>-mac-x64.dmg` | 打开 DMG，将 SpecFlow 拖入 Applications |

安装包包含 Electron、Node.js 24、npm、Maka 0.2.0 Runtime Host 和工作区扩展，使用时无需手动启动 Web 服务或安装 Node.js、GPG。**本机仍需安装 Git**；运行项目验证命令还需要该项目自己的工具链。

当前安装包尚未配置 Windows Authenticode、macOS Developer ID 签名及 Apple 公证。构建、数据位置与安装问题见 [桌面安装、更新与发布说明](docs/implementation/desktop.md)。

## 安装 DSH 插件

当前插件为 **`dsh-plugin-specflow@0.1.0`**，兼容 **DSH `0.2.1-rc.2`、宿主 Node.js 24+ 和本机 Git**。DSH 桌面版使用 Electron 内嵌 Node；兼容要求针对宿主进程。

从 [DSH 插件 Release](https://github.com/HuYellow/specflow/releases/tag/dsh-plugin-specflow%400.1.0) 下载预构建包与 `SHA256SUMS.txt`，在 DSH 插件页选择安装第三方插件，输入下载地址或本地文件的绝对路径并启用。CLI/Web 用户可以直接安装公开包：

```sh
dsh plugin --profile web add https://github.com/HuYellow/specflow/releases/download/dsh-plugin-specflow%400.1.0/dsh-plugin-specflow-0.1.0.tgz
dsh web
```

也可在 DSH 的实验性插件中启用 **自定义插件市场**，进入 **发现 → 添加索引源**，添加以下地址，再选择 Specflow 安装：

```text
https://raw.githubusercontent.com/HuYellow/specflow/main/market/dsh/index.json
```

该索引由 Specflow 项目维护，固定到包含预构建代码的 Git 提交。当前公开安装通过 GitHub 完成，尚未发布 npm 包。源码构建方法见下文“DSH 插件构建与发布”；CI 也会保存 `dsh-plugin-specflow` 构建产物。

发布包旁的 `SHA256SUMS.txt` 记录 SHA-256。Windows 用户可运行
`Get-FileHash release/dsh/dsh-plugin-specflow-0.1.0.tgz -Algorithm SHA256` 核对下载或构建后的文件。

安装后，在 Harness 中配置模型并打开一个会话，从右侧引导页选择 **Specflow 工程工作台**。登记干净的本机 Git 仓库，配置四个角色的模型及项目验证命令，再创建工作项、运行工程流程并接纳通过检查的产物。

流程页支持修改已有需求，文档页支持编辑当前修订。编辑会保留草稿并检查版本冲突；保存后的新版本需要重新验证或复核，不能继承旧版本的通过状态。

插件的模型文件工具限定在隔离工作区；只读阶段禁止修改文件，实现阶段提供文件读写，项目验证由 Specflow 执行用户配置的命令。中断后支持核对原结果，继续工作由用户创建新尝试。兼容版本、数据目录、锁恢复和完整操作说明见 [DSH 插件 README](plugins/deepseek-specflow/README.md)。

## 桌面版检查与安装更新

安装版提供以下原生菜单：

1. **帮助 → 检查更新…**：查询正式发行版本，显示当前版本和可用版本。
2. **帮助 → 下载更新…**：发现新版后，由你决定是否下载。
3. **帮助 → 重启并安装更新…**：下载完成后，先保存文档并等待运行结束，再确认重启安装。
4. **帮助 → 下载与发行说明**：打开 Releases 页面，查看变更或手动下载安装包。

应用启动后会延时检查，运行期间也会定期检查；下载和重启安装均由用户操作触发，退出时不自动安装。Windows 安装版支持 NSIS 原位更新；macOS 原位更新需要 Developer ID 签名与公证，未签名构建通过发行页面下载新版后手动替换应用。更新源、平台要求和发布步骤见 [更新机制与正式发布](docs/implementation/desktop.md#检查与安装更新)。

## 桌面版第一次使用

1. 打开应用，使用内置 CSV 示例体验流程，或点击“打开 Git 仓库”注册项目。
2. 在工程设置中选择执行底座，配置连接、阶段模型、项目章程和验证命令。使用 OpenCode 时先在本机运行 `opencode serve`。
3. 从干净的 Git 基线创建工作项，填写需求或导入已有文档。
4. 运行规格与澄清步骤，复核文档并接纳对应版本。
5. 进入实现阶段，检查候选代码、真实测试证据与复核结果。
6. 接纳通过检查的候选变更，写入工作项分支。

内置验收后端会在隔离示例仓库中真实修改代码并执行 Node.js 测试，其产物是确定性的，不调用云端模型。真实供应商连接可在设置中添加；模型质量、费用元数据和长任务恢复仍需结合实际供应商继续验证。

## 从源码运行

桌面版和独立浏览器工作台的开发环境需要 **Node.js 24、npm、Git 和 GPG**。Windows 可以使用 Git 自带的 GPG；macOS 可安装 GnuPG。Codex 桌面环境中的脚本会尝试使用已有的 Node.js 24，其他环境可通过 `SPECFLOW_NODE` 指定可执行文件。DSH 插件的独立开发步骤见下文。

```powershell
npm ci
npm run maka:setup
npm run desktop:dev
```

如果使用浏览器工作台：

```powershell
npm run build
npm start
```

打开 [http://127.0.0.1:4317](http://127.0.0.1:4317)。前端开发使用 `npm run dev`，界面地址为 [http://127.0.0.1:4318](http://127.0.0.1:4318)。桌面与浏览器工作台默认使用不同的数据目录，已有数据不会自动迁移。

## 构建桌面安装包

在目标系统和架构上构建，产物写入 `release/`：

```powershell
# Windows x64
npm run desktop:package:win
npm run desktop:smoke:packaged

# Apple Silicon Mac
npm run desktop:package:mac:arm64

# Intel Mac
npm run desktop:package:mac:x64
```

构建脚本拒绝跨系统打包，避免运行时权限、符号链接和本地模块损坏。GitHub Actions 支持三个原生目标。

CI/CD 会检查每次推送到 `main` 的提交和面向 `main` 的 PR。发布新版时，运行 `npm version patch --no-git-tag-version`（功能版本用 `minor`），将源码、`package.json` 和 `package-lock.json` 一起提交并推送到 `main`；只要版本高于所有已公开正式版，就会自动完成三平台测试、打包验收、生成中文分类更新日志、上传并校验完整资产，再公开为 Latest Release。普通同版本提交仅运行 CI；手动运行打包默认只生成 artifacts。触发方式、签名与失败重跑说明见 [桌面发布流程](docs/implementation/desktop.md#发布正式版本)。

## DSH 插件构建与发布

插件开发需要 **Node.js 24+、npm 和 Git**。在仓库根目录安装开发依赖，再安装插件自己的依赖：

```sh
npm ci
cd plugins/deepseek-specflow
npm ci --ignore-scripts
cd ../..
npm run dsh:typecheck
npm run dsh:test
npm run dsh:pack
```

输出为 `release/dsh/dsh-plugin-specflow-0.1.0.tgz` 和 `release/dsh/SHA256SUMS.txt`。发布包只包含预构建 Host、浏览器客户端、配置层、说明和许可证；浏览器使用 DSH 提供的 React。插件版本由 `plugins/deepseek-specflow/package.json` 独立维护，插件报告的版本号和发布清单使用同一来源。

GitHub 公开发布使用 `codex/dsh-distribution` 预构建分支和 `dsh-plugin-specflow@<版本>` 标签，独立于桌面版 Release。分发包只保留运行文件；市场索引固定到对应的 Git 提交。

```sh
npm run dsh:distribution
npm run dsh:market -- validate
```

完整的发布、索引生成与公开安装验证步骤见 [DSH 生态发布说明](docs/implementation/dsh-publication.md)。需要改为 npm 分发时，在插件目录使用发布者的 npm 账号执行：

```sh
cd plugins/deepseek-specflow
npm publish --dry-run
npm publish --access public
```

只有公开 npm 包发布后，才可把安装来源替换为 `dsh-plugin-specflow@0.1.0`。插件安装与运行约定见 [插件 README](plugins/deepseek-specflow/README.md)，实现与验收见 [插件交付说明](docs/implementation/dsh-plugin.md)。

## 验证

```powershell
npm run typecheck
npm test
npm run build
npm run maka:probe
```

测试覆盖隔离 Git 仓库、真实验证命令、失败恢复、文件边界、正式运行时来源和生产依赖闭包。真实 Host 测试需要先执行 `maka:setup`；未准备已批准运行包时会明确跳过。桌面操作验收入口与结果见 [验收记录](docs/implementation/validation.md) 和 [桌面验收范围](docs/implementation/desktop.md#验收范围与限制)。

安装插件开发依赖后，可独立检查 DSH 插件：

```sh
npm run dsh:typecheck
npm run dsh:test
npm run dsh:pack
npm run dsh:smoke
```

`dsh:smoke` 使用官方 DSH `0.2.1-rc.2` 验收运行时、本地脚本模型和隔离数据目录，覆盖真实安装、宿主认证、执行与重启，以及原生客户端交互。首次运行需准备 pnpm、官方验收运行时和浏览器，具体命令见 [插件验收准备](plugins/deepseek-specflow/README.md#在本仓库开发和发布)。这些验证不调用付费模型。CI 会执行核心与插件测试、生产构建和 DSH 集成验收，并保存插件包及验收报告。

## 运行时与数据约定

Maka 当前固定为 **Apache Maka 0.2.0 的签名正式源码发行版**。`config/maka-release.json` 固定发布版本、源码 SHA-512 和签名者指纹；`maka:setup` 验证后按官方锁文件构建，只将 Runtime Host 与生产依赖放入安装包。源码、编译器、测试、CLI/Eval 和构建缓存保留在包外。安装、加载和打包均执行同一正式发布策略，禁止 dev、nightly、snapshot、RC、占位包及其他开发或预发布版本，无法取得正式发行版时不会回退到开发包。

待 Maka 正式 npm 包发布后，再切换为固定版本和完整性校验的 npm 依赖。Maka 仍是默认内置底座；现在也可在工程设置中选择 OpenCode，连接本机单独安装的 OpenCode 服务。切换只影响后续新尝试，历史记录和执行控制继续使用原底座。详见 [底座接入与切换](docs/implementation/execution-backends.md) 和 [Maka 运行时管理](docs/implementation/maka-runtime-management.md)。

| 环境变量 | 用途 | 默认值 |
| --- | --- | --- |
| `SPECFLOW_NODE` | Node.js 24 可执行文件 | 当前 Node.js 或可用的 Codex 运行时 |
| `SPECFLOW_DATA_DIR` | 工程数据库与工作区 | Web：`.specflow-data/local`；桌面：系统用户数据目录下的 `engineering` |
| `SPECFLOW_MAKA_PACKAGE` | Maka 运行包目录 | Web：`.tools/maka/node_modules/maka-agent`；桌面使用随包资源 |
| `SPECFLOW_MAKA_ROOT` | Maka 状态目录 | 工程数据目录下的 `maka/0.2.0` |
| `SPECFLOW_PORT` | Web 服务端口 | `4317`；桌面自动分配空闲端口 |
| `SPECFLOW_NO_DEMO` | 设为 `1` 关闭首次示例初始化 | 未设置 |
| `DSH_HOME` | 仅 DSH：宿主 home；插件在其下保存独立数据 | DSH 官方默认 home；插件目录为 `~/.dsh/specflow` |

卸载桌面应用保留工程数据，菜单“文件”可打开数据和诊断日志目录。源仓库未提交的改动不会被自动重置、提交或删除。工作区文件工具限制模型可访问的路径；项目验证命令会在本机执行，应使用可信仓库。这一路径限制不构成操作系统沙箱。

## 文档导航

| 主题 | 文档 |
| --- | --- |
| 安装、更新、发布与桌面数据 | [桌面交付](docs/implementation/desktop.md) |
| DSH 插件安装、开发、发布与验收 | [插件 README](plugins/deepseek-specflow/README.md) · [交付说明](docs/implementation/dsh-plugin.md) · [生态发布](docs/implementation/dsh-publication.md) |
| 总体方案与执行底座 | [实施方案](docs/brainstorm/specflow-harness.md) · [Maka 评估](docs/brainstorm/maka-foundation-review.md) · [运行时管理](docs/implementation/maka-runtime-management.md) |
| 需求正文、上传与版本失效 | [需求输入](docs/implementation/requirements-input.md) |
| 项目章程与独立澄清 | [章程与澄清](docs/implementation/constitution-clarify.md) |
| 项目、工作项与产物归属 | [工程工作空间](docs/implementation/workspaces.md) |
| AI 完整文档与人类简报 | [双份文档](docs/implementation/dual-audience-documents.md) |
| 双视角复核与历史问题复验 | [自纠正与复核](docs/implementation/self-correction.md) |
| 前端工作台与操作验收 | [前端实施记录](docs/implementation/frontend-workbench-delivery.md) |
| 本地模型联调与验证结果 | [Maka 联调](docs/implementation/maka-client-test.md) · [实施与验收](docs/implementation/validation.md) |

复杂分支、并行编码、自动修订、实时协作和远程执行留待后续完善。
