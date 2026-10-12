# SpecFlow

SpecFlow 是围绕本地 Git 仓库的软件工程工作台。它组合开发步骤，共同管理文档与代码产物，并为不同阶段选择 API 和模型。

首版采用 **SpecFlow 工程控制层 + Maka Runtime Host 执行底座**，已实现本地应用、工程门禁、产物接纳、候选工作区、确定性测试与复核流程。真实供应商连接按用户要求后续补齐。

## 桌面应用

桌面版使用独立 Electron 窗口，随包携带 Node.js、npm、Maka 0.2.0 Runtime Host 和工作区扩展。Maka 暂时从已验证签名的正式源码包构建，只打包生产运行文件，后续改为正式 npm 依赖；始终禁止内置 dev。Windows 安装包为 `release/SpecFlow-0.1.0-win-x64.exe`，可直接运行的程序为 `release/win-unpacked/SpecFlow.exe`。使用桌面应用无需手动启动本地 Web 服务；本机仍需有 Git。

```powershell
npm ci
npm run maka:setup
npm run desktop:dev
npm run desktop:package:win
npm run desktop:smoke:packaged
```

macOS 在对应架构的 Mac 上执行 `npm run desktop:package:mac:arm64` 或 `npm run desktop:package:mac:x64`，生成 DMG 与 ZIP。仓库包含三平台原生构建工作流。Windows 已验证打包程序，macOS 尚待原生构建与运行验收。安装包尚未配置正式发布签名。

桌面工程数据保存在系统用户目录，菜单可打开数据和日志目录。Web 数据不会自动迁移，卸载保留桌面工程数据。详见 [桌面交付与验收](docs/implementation/desktop.md)。

## 启动

需要 Node.js 24。Codex 桌面环境中的脚本会自动使用已有的 Node.js 24；其他环境可以通过 `SPECFLOW_NODE` 指定可执行文件。

```powershell
npm install
npm run maka:setup
npm run build
npm start
```

打开 [本地工作台](http://127.0.0.1:4317)。开发模式使用 `npm run dev`，界面地址为 `http://127.0.0.1:4318`。

`config/maka-release.json` 集中管理精确版本、分发方式和发布来源。当前 `distribution: source`：`maka:setup` 验证 Apache 正式源码包的 SHA-512 与发布签名，按其锁文件和 npm 版本构建 Runtime Host，再安装生产依赖闭包。源码、编译器、测试、Maka CLI/Eval 和构建缓存不进入桌面包。构建端需要 GPG（Windows 可使用 Git 自带版本；Mac 使用 GnuPG）；用户运行应用时不需要 GPG 或编译环境。

后续正式 npm 包发布后，将配置改为 `distribution: npm` 并填写准确版本、tarball 和完整性，仍使用 `maka:setup` 与同一桌面打包入口。底座独立选择、切换和新增适配器暂缓，当前使用 Maka。始终禁止 alpha、beta、dev、nightly、RC 和占位包。

## 使用

1. 使用内置 CSV 导入项目体验流程，或点击“打开 Git 仓库”注册自己的项目。
2. 创建工作项时选择干净的 Git 基线，应用创建独立工作项分支。
3. 在工程设置中添加模型连接，为需求、设计、实现和复核选择模型。
4. 运行步骤，复核文档，再接纳对应版本；也可以导入已有 Markdown。
5. 实现阶段产生候选代码，并运行项目配置的验证命令。
6. 检查候选差异、测试证据和复核结果，最后接纳到工作项分支。

内置验收后端返回确定性产物，不调用模型。它会真实修改隔离示例工作区并执行 Node.js 测试，仅允许用于内置验收仓库。

Maka 连接和供应商凭据由 Host 保存，流程与工程记录只保存引用。写入现有代码时，工作区工具要求先读取内容并提交 `expectedHash`。文档编辑具有本地草稿、版本冲突和上游失效提示。

## 检查

```powershell
npm run typecheck
npm test
npm run build
npm run maka:probe
```

测试包括隔离 Git 仓库、实际测试命令、失败和恢复路径、文件工具边界、正式发布与构建来源、生产依赖闭包，以及真实 Maka Host 的本地协议夹具。未准备已批准运行包时，Host 集成测试明确跳过；执行 `maka:setup` 后应通过真实 Host 测试。

## 配置

| 环境变量 | 用途 | 默认值 |
| --- | --- | --- |
| SPECFLOW_NODE | Node.js 24 可执行文件 | 当前 Node.js 或桌面内置运行时 |
| SPECFLOW_DATA_DIR | 工程数据库与工作区 | .specflow-data/local |
| SPECFLOW_MAKA_PACKAGE | Maka 包目录 | .tools/maka/node_modules/maka-agent |
| SPECFLOW_MAKA_ROOT | Maka 状态根目录 | 工程数据目录/maka/0.2.0 |
| SPECFLOW_PORT | 本地服务端口 | 4317 |
| SPECFLOW_NO_DEMO | 设为 1 可关闭首次示例初始化 | 未设置 |

数据和工具目录已加入 `.gitignore`。源仓库未提交改动不会被自动重置、提交或删除。

## Windows 适配

固定版 Maka 的内置受控文件 worker 在本机不可用。应用使用 `specflow.workspace` Host 扩展，只允许模型访问 SpecFlow 创建的工作区；它不会自动启用全局 Bypass。

插件存储的两处目录 fsync 调用需要 Windows 兼容处理。适配器校验固定版本和原始文件哈希后应用补丁，实际记录保存在包内的 `specflow-compatibility.json`。文件和日志仍会刷新；目录元数据的断电持久性不作保证。

工作区限制属于文件工具的路径边界，不是操作系统沙箱。项目验证命令在本机执行，应使用可信仓库。

## 文档与复核

- [实施方案 v0.1](docs/brainstorm/specflow-harness.md)
- [实施方案可视化页面](docs/brainstorm/specflow-harness.html)
- [Maka 底座评估](docs/brainstorm/maka-foundation-review.md)
- [实施与验收记录](docs/implementation/validation.md)
- [桌面交付与验收](docs/implementation/desktop.md)
- [本机 Maka 客户端联调入口](docs/implementation/maka-client-test.md)

P3 的复杂分支、并行编码、自动修订、实时协作和远程执行留到后续细调。真实供应商的质量、费用元数据和长任务恢复在连接配置后继续验证。

本仓库的方案和代码按已有要求交给 Claude Code 复核；本次提供了复核入口与验证记录，未调用外部 Claude Code。

## 需求文档入口

工作项的“需求输入”页支持需求正文、UTF-8 Markdown/TXT 上传、粘贴和仓库相对路径导入。点击“保存需求”后，模型尝试会读取正文与全部文档，并记录所用版本；更新需求使已有分析及下游结果过期。开发流程顶部和右侧“输入依据”均可进入此页。详见 [需求输入说明](docs/implementation/requirements-input.md)。

## 项目章程与需求澄清

工程设置支持读取、编辑仓库根目录的 `AGENT.md` 和 `AGENTS.md`，每次模型尝试记录章程全文与哈希。默认流程现在有 13 步，在需求规格和规格复核之间加入独立澄清：提出最多 5 个关键问题，记录用户答复，写回新规格版本后才允许复核、接纳与设计。源需求、规格或章程更新会使旧问答和结果过期。已开始运行保留旧定义，未开始工作项自动升级。详见 [章程与澄清说明](docs/implementation/constitution-clarify.md)。

## 工程工作空间

左侧按“项目目录对应的工程工作空间 → 本空间工作项 → 当前工作项的工程产物”组织。工作空间下拉框支持切换不同项目目录，工作项与产物列表随当前选择更新。空空间可以配置项目和创建工作项，工程产物只显示已经存在的文档。详见 [空间与产物归属说明](docs/implementation/workspaces.md)。
