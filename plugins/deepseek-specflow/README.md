# Specflow for DeepSeek Harness

将 Specflow 的需求、规格、计划、任务、独立复核、验证和人工验收带入
DeepSeek Harness。安装后，在一个已打开的会话右侧添加 **Specflow** 标签，
或从右侧引导页选择 **Specflow 工程工作台**。

## 兼容版本

- DeepSeek Harness **0.2.1-rc.2**。插件声明精确的 `engines.dsh`，其他版本需要重新验证。
- 宿主进程 **Node.js 24+**，以及本机 Git。桌面版使用 Electron 内嵌的 Node，
  全局 `node --version` 不能证明桌面宿主兼容。
- 这是独立的 DSH 插件；安装包包含共享工程核心和插件界面，执行阶段使用 Harness
  中已经配置的模型。无需安装 Specflow 桌面版、Maka 或 OpenCode。

## 安装

当前公开版本为 [dsh-plugin-specflow@0.1.1](https://www.npmjs.com/package/dsh-plugin-specflow)。
在 DSH 的插件页选择 **安装第三方插件**，输入 `dsh-plugin-specflow@0.1.1`，
审核安装来源后启用插件。录入平台若接受公共 npm 包详情页 URL，可使用上述 npm 链接。
桌面版请使用自身的插件管理入口，以便安装到桌面版管理的 profile。

CLI/Web 用户也可以安装到 Web profile：

```sh
dsh plugin --profile web add dsh-plugin-specflow@0.1.1
dsh web
```

也可从 [GitHub Release](https://github.com/HuYellow/specflow/releases/tag/dsh-plugin-specflow%400.1.1)
下载 [预构建安装包](https://github.com/HuYellow/specflow/releases/download/dsh-plugin-specflow%400.1.1/dsh-plugin-specflow-0.1.1.tgz)
及同一 Release 的 `SHA256SUMS.txt`，在安装入口输入安装包 HTTPS 地址或下载后的绝对路径。
npm 包、GitHub 安装包与固定提交的 Git 分发均可使用；自定义市场索引仍固定到 Git 分发提交。

### 更新已安装的插件

DSH 的第三方插件通过卸载后重新安装更新。先保存编辑并停止正在运行的 Specflow 操作，
在同一 profile 的 **插件 → 已安装** 中卸载旧插件，再通过 **安装第三方插件** 输入新版
包名及版本（当前为 `dsh-plugin-specflow@0.1.1`），安装启用后重启 DSH。
也可安装 GitHub 预构建包，或从已刷新索引的“发现”页选择新版安装。
工程数据库、执行日志和隔离工作区会保留；若配置过自定义 `dataDir`，重装后继续使用原值。

`0.1.1` 会自动关联当前对话的 Git 工程，并跟随对话目录变化。已有工程和 Specflow 工作区
复用原记录，手动选择不受普通刷新覆盖；未保存的正文、澄清答案、工程配置和运行回答会
阻止自动切换，直到保存、提交或取消编辑。

### 从“发现”页安装

在 DSH 插件页的实验性插件中启用 **自定义插件市场**，进入 **发现 → 添加索引源**，添加：

```text
https://raw.githubusercontent.com/HuYellow/specflow/main/market/dsh/index.json
```

然后找到 **Specflow 工程流程工作台**，确认兼容版本和来源后安装。
此索引由 Specflow 项目维护，安装来源固定到包含预构建代码的 Git 提交和插件子目录。

### 停用与移除

先停止正在运行的 Specflow 操作，再在同一 profile 的插件页停用或移除插件。
CLI/Web 用户也可执行 `dsh plugin --profile web remove dsh-plugin-specflow`。
工程数据库、执行日志和隔离工作区默认保留在 `$DSH_HOME/specflow` 或配置的 `dataDir`。
如需清理，先备份并确认没有宿主使用该目录；登记的项目源仓库不属于插件数据目录。

## 使用

1. 在 Harness 配置模型并打开一个会话。
2. 打开右侧 Specflow 标签，插件会自动读取当前对话的工作目录，关联并登记对应的本机 Git 仓库。已有工程会复用原记录；目录位于 Specflow 工作项或候选工作区时，会回到原工程及工作项。
3. 在工程设置中选择分析、设计、实现和复核模型，并配置项目真实的验证命令。
4. 创建工作项，输入需求。源仓库须有干净的已提交基线。
5. 按流程运行规格、澄清、计划、任务、实现和复核。文档接纳与最终代码接纳由用户操作。
6. 需求变化时，在流程页编辑需求；需要人工改稿时，在文档页编辑当前修订。保存会创建新版本，并使依赖旧输入的结果过期，修改后的文档需要重新复核和接纳。

模型查询工具 `specflow_query` 只读，限制在调用会话所属的仓库，不提供人工接纳操作。
模型完成不等于工程通过：原有输入版本、新鲜度、双视角复核和验证门槛继续生效。

切换对话或改变对话工作目录后，面板会关联对应工程。手动选择其他工程后，普通刷新不会
覆盖该选择；下一次对话目录变化时恢复自动关联。有未保存的编辑时，会等待保存或取消。
当前对话没有工作目录，或目录不是有提交记录的 Git 仓库时，可继续手动选择工程或通过
「打开仓库」登记。自动关联只登记工程，不会创建需求、启动执行或提交源仓库改动。

需求和文档编辑以开始编辑时的版本为基线。轮询不会覆盖尚未保存的草稿；其他窗口或
执行任务更新了同一内容时，编辑器会提示冲突并展示最新内容，保留草稿供比较。
确认改用最新基线后才能继续保存。保存需求时保留原有文档附件；人工改稿创建新的
文档候选，不继承旧版本的复核通过状态。

## 数据和配置

默认数据目录是 `$DSH_HOME/specflow`；未设置 `DSH_HOME` 时使用 DSH 官方默认 home
下的 `specflow`。数据包含工程 SQLite 数据库、独立 Git worktree 和执行日志。
原有 Specflow 桌面版的数据目录不会被自动迁移或采用。

可以在插件行配置 `dataDir` 为另一个绝对路径。每个目录只能由一个插件宿主持有；
若同时运行多个 DSH profile，应给它们配置不同目录。正常卸载会关闭请求、执行器和数据库，
并释放 `host.lock`。异常退出可能留下此锁；先确认使用该目录的宿主均已退出，
再删除该目录中的 `host.lock` 并重新启动。数据库和执行日志会保留供原身份核对。

## 执行边界

执行器使用独立会话和 Specflow 创建的隔离工作区。只读阶段禁止模型修改文件。
实现阶段通过限定工作区的文件工具读写代码。模型不能调用继承的 Shell、外部目录工具
或子代理；项目验证由 Specflow 的确定性验证阶段执行用户配置的命令。
获准的验证命令使用宿主用户的系统权限，不构成操作系统沙箱。

运行日志保存原会话身份及结果。回执丢失或重启后只核对原运行，不自动重新发送提示。
中断后的原运行继续执行不在首版支持范围内；需要新尝试时由用户发起。
宿主或插件加载失败会直接报错，不回退为其他执行器。

## 在本仓库开发和发布

根项目安装开发依赖后，在插件目录安装独立依赖，再回到仓库根目录构建：

```sh
npm ci
cd plugins/deepseek-specflow
npm ci --ignore-scripts
cd ../..
npm run typecheck
npm run dsh:typecheck
npm test
npm run dsh:test
npm run dsh:pack
```

产物为 `release/dsh/dsh-plugin-specflow-0.1.1.tgz` 和 `SHA256SUMS.txt`。
包内容采用白名单检查，仅包含预构建 Host、浏览器工厂、配置层、说明和许可证。
源代码、测试、缓存、Electron、Maka、OpenCode 和其他本机数据不会进入包。
浏览器使用 DSH 共享的 React，未打入第二份 React。

插件版本以本目录的 `package.json` 为准，插件报告的版本号与发布清单使用同一来源。
需要更新插件版本时，在本目录运行 `npm version patch --no-git-tag-version`（功能版本用
`minor`），同步更新此处的 `package-lock.json`，再回到仓库根目录重新验证和打包。

`npm run dsh:smoke` 验证官方宿主加载和本地模拟供应商上的真实执行。
验证脚本使用独立 Harness home，不读取现有用户配置，不调用付费模型。
另以宿主版本的 React 运行已构建客户端工厂，验证交互、窄面板和卸载清理。
需要本机 pnpm，以及 Playwright Chromium；Windows 默认使用已安装的 Edge。

首次准备官方验收运行时（下列为 PowerShell）：

```powershell
New-Item -ItemType Directory -Force .tools/dsh-validation
Push-Location .tools/dsh-validation
npm install --ignore-scripts --no-audit --no-fund --registry https://registry.npmjs.org @deepseek-ai/dsh@0.2.1-rc.2
Pop-Location
npm run dsh:smoke
```

其他平台先运行 `npx playwright install chromium`。
设置 `SPECFLOW_BROWSER_CHANNEL` 可指定浏览器渠道。
使用其他验收运行时目录时，可直接运行
`node scripts/toolchain.mjs dsh-smoke --runtimeDir /absolute/runtime-directory`。
三个验收脚本的结果分别写入 `.tools/dsh-host-smoke.json`、控制台及
`.tools/dsh-client-qa/report.json`。这些运行时与报告不进入发布包。

公开分发使用同一仓库的 `codex/dsh-distribution` 分支，保持插件子目录路径，
并用 `dsh-plugin-specflow@<版本>` 标签标记包含预构建代码的提交。
`npm run dsh:distribution` 准备仅含运行文件的 Git 分发树；`npm run dsh:market -- generate`
生成官方格式的固定提交索引。完整发布步骤见仓库中的 `docs/implementation/dsh-publication.md`。

npm 已公开发布 `0.1.1`。后续版本完成相同验证后，使用具有发布权限的 npm 账号，
将已验收的同一 `.tgz` 发布到 `https://registry.npmjs.org/`，保留预构建内容。
发布账号需要完成 npm 要求的双重验证；发布返回成功后，等待新版本可通过 `npm view` 查询。
同一包名和版本不能重复发布。npm 分发与固定提交的 Git 市场来源可以同时保留。

## 许可证

Specflow：Apache-2.0。随包 Zod：MIT，完整文本见 `dist/ZOD_LICENSE`。
DSH 与 React 为宿主提供的 peer dependencies，许可证由其各自包提供。

官方接口依据：[插件打包](https://deepseek-harness.github.io/deepseek-harness/develop/basic/publish)、
[右侧面板](https://deepseek-harness.github.io/deepseek-harness/en/reference/subsystems/sidebar-right)、
[客户端连接](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/client/connection)。
