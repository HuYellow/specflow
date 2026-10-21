---
title: Specflow DSH 插件交付
subtitle: 同仓库维护，共享工程核心，独立发布插件包
lang: zh
template: sheet
theme: blueprint
cols: 2
---

## A 放在当前仓库合适

```callout ok 已实现独立插件包
插件源码位于 plugins/deepseek-specflow。
桌面版与插件共享 packages/specflow-core。
插件可安装到 DSH，无需启动 Specflow 桌面版。
```

同仓库可以同步维护流程规则、数据模型和测试。
插件拥有独立版本、依赖锁文件和发布清单。
桌面版继续默认使用 Maka，并保留正式发布校验。

## B 实现结构

```flow LR
桌面入口 -> 共享工程核心: 原服务接口
DSH面板 -> 插件API: 宿主认证连接
插件API -> 共享工程核心: 工程命令
共享工程核心 -> 工程数据库: 状态与证据
共享工程核心 -> DSH执行桥接: 冻结阶段输入
DSH执行桥接 -> 隔离会话: 模型与文件工具
```

原有服务模块保留兼容导出。
插件按加载与卸载生命周期管理资源。
数据目录使用独占锁与稳定的执行身份。

## C 用户可用的功能

| 区域 | 能力 |
|---|---|
| 工程与需求 | 登记 Git 仓库、创建工作项、编辑需求、配置四个角色模型 |
| 流程 | 查看阶段状态、运行和停止、回答澄清问题 |
| 文档 | 阅读简报与正文，编辑并接纳经过复核的修订 |
| 代码 | 查看差异、运行验证、检查接纳条件 |
| 记录 | 查看原模型、执行身份、结果与错误 |
| 聊天工具 | 查询当前仓库的工程状态，不提供人工接纳 |

在一个已打开的 Harness 会话右侧添加 Specflow 标签。
面板会随会话显示状态，并在隐藏后暂停轮询。

## D 发布包与安装

包名与版本：`dsh-plugin-specflow@0.1.0`。
产物：`release/dsh/dsh-plugin-specflow-0.1.0.tgz`。
同目录提供 `SHA256SUMS.txt`。

```sh
dsh plugin --profile web add /absolute/path/dsh-plugin-specflow-0.1.0.tgz
dsh web
```

桌面用户可在 DSH 插件页输入 tarball 的绝对路径安装。
公开发布时，在插件源码目录执行 `npm publish --access public`。
该命令需要发布者的 npm 身份与包名权限。
公开安装包和市场索引见 [生态发布说明](dsh-publication.md)。
npm 包尚未发布，当前使用 GitHub 预构建包与固定提交的 Git 来源。

包采用九个文件的白名单。
只包含预构建代码、配置、说明和许可证。
Electron、Maka、OpenCode、源码和缓存不进入插件包。

## E 已完成的验证

| 检查 | 结果 |
|---|---|
| 桌面与核心完整回归 | 193 项通过 |
| 插件独立回归 | 18 项通过 |
| 根项目与插件类型检查 | 通过 |
| 原有应用生产构建 | 通过 |
| 官方 DSH 安装器 | tarball 安装通过 |
| 完整 Web profile | Host 激活、客户端脚本加载、认证、重启通过 |
| 真实 DSH 执行 | 8 项场景通过，含共享核心生成规格产物 |
| 浏览器交互 | 10 项检查通过，含需求与文档编辑冲突；320/420 像素无横向溢出 |
| npm 发布预检 | dry-run 通过，未上传 |

真实执行使用官方发布的 DSH SDK 与本地脚本模型。
不使用 API Key，也不调用远程模型。
这些检查验证接口与状态流转，不代表真实模型的产物质量。
浏览器检查使用 React 18 与 Edge，并验证明暗主题。
CI 已配置同一组检查与插件构建产物上传。

需求与文档编辑固定开始编辑时的版本。
轮询和切换标签保留草稿，外部更新触发冲突提示。
人工改稿生成新候选，保留上游和代码绑定。
新候选需要重新复核，旧接纳状态不能替代。

## F 兼容范围和首版边界

兼容范围锁定 DSH `0.2.1-rc.2` 与 Node.js 24+。
桌面版宿主使用 Electron 内嵌 Node，需要满足同一要求。
DSH 当前仍处于开发预览，升级后需要重新验收。

模型工具限制在隔离工作区。
只读阶段禁止修改文件，实现阶段允许文件读写。
模型不能调用 Shell 或子代理。
验证阶段执行用户配置的真实命令。
这些限制不构成操作系统沙箱。

中断后支持核对原结果，原运行继续执行尚不支持。
异常退出可能留下目录锁，排除活跃宿主后才能手工清除。
已有桌面数据库不会自动迁移到插件。

源码安装、配置与验证命令见 [插件 README](../../plugins/deepseek-specflow/README.md)。
仓库首页也提供 [使用方式、安装和发布导航](../../README.md)。
官方依据：[插件打包](https://deepseek-harness.github.io/deepseek-harness/develop/basic/publish)、[右侧面板](https://deepseek-harness.github.io/deepseek-harness/en/reference/subsystems/sidebar-right)。
