# 工程工作空间、工作项与工程产物

一个工程工作空间对应一个已注册的 Git 项目目录，使用现有 `Project` 记录管理名称、根目录、项目章程、模型默认配置和验证命令。

左侧“工程工作空间”下拉框选择当前项目，显示名称与目录以区分不同路径的同名项目。工作项列表按当前 `Project.id` 筛选；新建工作项固定归属于当前空间。注册新项目目录后会切换到新空间，再进入工作项创建。

工作项列表下方的按钮已移除，“工作项”标题右侧的＋负责新增当前空间的工作项。“工程工作空间”标题右侧的＋负责打开 Git 仓库并添加空间，两个入口按各自所属层级放置。

此入口调整已通过类型检查、Windows 打包版空间操作验收和本机只读点击复验，两个＋分别打开正确表单。截图为 `release/workspace-sidebar-actions-desktop.png` 和 `release/workspace-sidebar-actions-web.png`。

空间选择器的名称、文件夹图标、右侧箭头和按钮留白共享同一个点击区域。点击展开项目菜单，直接点击项目选项完成切换。菜单显示完整目录和当前选中标记，浮层放在页面根节点以避免被侧栏滚动区域裁切；支持方向键、Home/End、Enter/Space、Escape 和点击外部关闭。

旧实现将原生选择框与装饰箭头并排放置，箭头没有触发选择框。旧验收只通过 `selectOption()` 设置选择值，遗漏了用户实际点击箭头的操作。现改为按钮控制的列表菜单，并以鼠标坐标点击箭头、名称及文件夹图标，再实际点击项目选项验收，不再使用 `selectOption()` 验证空间切换。

工程产物列表仅显示当前工作项实际已有的产物，支持默认规格、设计、任务、实现说明、对齐报告和自定义产物。未生成的产物类型不再作为列表占位。空工作项显示空产物状态；空工作空间不选择其他项目的工作项，支持打开工程设置、编辑项目章程和新建本空间工作项。

切换空间或工作项时，立即清空旧的详情、步骤、运行和文档选中状态。每次刷新请求都有递增身份，旧请求的迟到响应不能覆盖当前选择。每个空间分别记住上次选中的工作项，并通过本地存储恢复同一页面来源下的选择。

验证：`npm run typecheck`、`npm run desktop:smoke:workspaces`、`npm run desktop:smoke:workspaces:packaged`。桌面验收创建独立临时项目，检查真实鼠标展开和选择、键盘导航、菜单关闭、空间筛选、工作项切换、自定义产物、迟到响应、空空间配置和工作项创建，以及页面刷新和布局。测试不调用云端模型。原有需求澄清桌面操作验收同时验证工程设置和阶段运行仍能正常使用。

证据：`release/workspaces-smoke-dev.json`、`release/workspaces-smoke-packaged.json`、`release/workspaces-packaged.png`，菜单打开截图为 `release/workspaces-switcher-open-dev.png` 和 `release/workspaces-switcher-open-packaged.png`。

本机只读复验：Windows 桌面中现有“CSV 导入验收项目”和“Maka 真实模型联调”两个空间均通过箭头展开、选项点击和工作项归属核对；共享正式版 Maka Host 仍可用。浏览器版现有空间的点击和新静态资源加载也通过。两次检查均未新增模型尝试或修改文档产物，证据为 `release/workspaces-switcher-live-desktop.json`、`release/workspaces-switcher-live-web.json` 和对应截图。Windows 安装包已重建并更新 SHA-256。

Claude Code 复核入口：`apps/web/src/WorkspaceSwitcher.tsx` 的鼠标点击、浮层和键盘焦点行为、`App.tsx` 的刷新身份与选择状态、`Dialogs.tsx` 的当前空间归属、`context.tsx` 的项目级上下文、`GuidanceEditor.tsx` 的空空间配置，以及 `scripts/workspaces-smoke.mjs` 的真实鼠标与跨空间延迟请求检查。本次未调用外部 Claude Code。
