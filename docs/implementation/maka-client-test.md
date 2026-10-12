---
title: Maka 客户端与 SpecFlow 已接通
subtitle: 正式 0.2.0 源码客户端 · 同一个 Runtime Host · 等待模型配置
template: doc
theme: shadcn
lang: zh
date: 2026-10-12
---

本机此前只有 Maka Host 状态目录，未发现可启动的客户端。
现已安装并启动正式 Maka 0.2.0 的源码客户端。
SpecFlow 联调入口连接到它的同一个 Host。
最新可下载的 Windows 客户端是 nightly，本次采用版本匹配的正式源码。

## A 从桌面打开

| 桌面入口 | 用途 |
| --- | --- |
| Maka 0.2.0 | 启动本机 Maka 客户端 |
| SpecFlow - Maka 联调 | 打开 Maka，并让 SpecFlow 连接同一个 Host |

客户端安装在 LOCALAPPDATA/Programs/Maka-0.2.0-Source。
配置保存在 APPDATA/Maka-SpecFlow-0.2.0。
联调 Host 状态根为该配置目录下的 workspaces/default。
客户端使用正式源码，未把 nightly 改成正式版本。

## B 现在开始测试

1. 在 Maka 的引导页或设置中添加模型连接。
2. 输入供应商、API 端点、密钥和模型。
3. 在 SpecFlow 打开工作项“通过 Maka 完成 CSV 导入”。
4. 打开工程设置，点击“刷新模型目录”。
5. 为需求、设计、实现和复核选择 Maka 模型并保存。
6. 从“需求规格”开始运行，再复核与接纳产物。

当前 Host 已连接，但还没有配置真实模型目标。
密钥在本机界面输入即可，无需发送到聊天中。
已准备独立 Git 测试项目，不使用内置确定性后端。
初始化没有运行模型，也没有产生模型费用。

流程中的节点模型可以覆盖项目默认选择。
原来的 CSV 验收示例默认使用本地后端。
测试真实 Maka 时，使用新建的联调项目。

## C 已验证的连接

```flow LR
Maka客户端 -> 共享Host: 管理模型与会话
SpecFlow联调桌面 -> 共享Host: 派发工程步骤
共享Host -> 模型服务: 用户配置后调用
SpecFlow联调桌面 -> 独立Git工作区: 工程产物与验证
```

| 检查 | 结果 |
| --- | --- |
| Maka 客户端 | ok 版本 0.2.0，窗口与引导页正常 |
| 客户端 Host | ok readiness 为 ready |
| SpecFlow 连接 | ok available 为 true |
| Host 身份 | ok 两端 rootId 相同 |
| 联调工作项 | ok 新建项目，demo 为 false |
| 模型执行 | 尚未开始，等待真实连接配置 |
| 退出 SpecFlow | ok Maka 客户端仍保持运行 |
| 原有工作记录 | 保留；测试使用独立代码仓库 |

[联调验证记录](../../release/maka-client-integration.json)
[客户端安装与联调截图](../../release/maka-specflow-connected.png)

桌面联调入口与默认 Web 工作台使用各自的工程数据。
本次针对桌面接入；浏览器 4317 仍使用原来的 Host 根。
使用联调入口可以保证读取 Maka 客户端添加的模型连接。

## D 版本与复核

本次没有启用底座选择或其他 harness 适配器。
SpecFlow 内置软件包仍为正式 Maka 0.2.0。
只为同版本客户端接入开放显式 Maka 状态根配置。

构建使用正式源码中规定的依赖补丁。
运行包更新先准备完整目录，再替换并保留旧包。
本次验证包含 22 项自动测试及安装更新测试。
打包程序的工程链、正常退出和崩溃清理也已通过。

真实模型效果、计费与长任务恢复，待你配置后测试。
Maka 上游依赖的审计记录仍保存在运行时管理文档。
Claude Code 可复核安装脚本、启动入口和共享 Host 边界。
