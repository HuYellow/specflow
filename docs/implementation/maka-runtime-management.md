---
title: SpecFlow 内置 Maka 的当前方案
subtitle: 暂时从正式源码构建 · 后续转 npm · 默认内置底座
template: doc
theme: shadcn
lang: zh
date: 2026-10-12
status: 源码运行包和 Host 验证通过
---

当前内置 Maka 0.2.0，来源为 Apache 的签名正式源码发布包。
只打包 Runtime Host 和生产依赖，继续禁止使用 dev。
Maka 保持默认内置底座。
现已支持工程选择 Maka 或本机 OpenCode 服务。
切换机制见 [底座接入与切换](execution-backends.md)。

## A 正式源码如何进入应用

`config/maka-release.json` 固定版本、来源、SHA-512 和签名指纹。
`npm run maka:setup` 验证签名，按发布锁文件构建运行包。
编译文件经过生产依赖收集，再复制到应用资源目录。

```flow LR
签名正式源码 -> 校验来源: SHA-512 与发布签名
校验来源 -> 构建运行包: 固定 Node 与 npm
构建运行包 -> RuntimeHost与生产依赖: 排除开发文件
RuntimeHost与生产依赖 -> 桌面安装包: 内置执行底座
桌面安装包 -> 模型服务: 用户配置 API 与模型
```

| 内容 | 进入桌面安装包 |
| --- | --- |
| Maka Runtime Host、Core、Storage 和 Runtime | ok 需要的运行文件 |
| 生产依赖和许可证 | ok 生产闭包，共 203 个包 |
| 发布与构建来源记录 | ok 保存在 specflow-release.json |
| Maka 源码、编译器、测试和构建缓存 | no 留在开发目录 |
| Maka CLI、Eval 和独立 Maka 桌面 | no 不进入安装包 |

Maka 运行包约 93 MiB，包含生产依赖。
[官方发布来源](https://maka.apache.org/en/downloads/)

## B 状态与工程数据

正式版使用 `maka/0.2.0` 状态目录。
此前 dev 状态与正式版无法降级迁移，旧目录保留。
SpecFlow 的工程数据库、文档和 Git 工作区保留。
旧 Maka 会话和模型连接不会自动迁入正式目录。

工作区扩展仍只访问 SpecFlow 管理的工作区。
Windows 的两处目录 fsync 兼容处理继续校验原文件哈希。
文件与日志仍会刷新，目录元数据不承诺断电持久性。
这些是工具的路径限制，不是操作系统沙箱。

## C 后续切换 npm 的入口

当前 `distribution: source` 选择源码构建路径。
Maka 正式 npm 包发布后，改为 `distribution: npm`。
同时把 `allowSourceBuild` 设为 false。
固定准确包版本、tarball、完整性和正式发布链接。
随后仍运行 maka:setup 和相同的桌面打包命令。

适配器、模型设置和工程流程沿用现有结构。
版本相同时沿用正式版状态根，切换前重新验证 Host 与工程链。
Maka 的 npm 迁移继续复用现有执行契约。
工程可以另选 OpenCode，不影响 Maka 的发布来源要求。

## D 当前验证与限制

| 检查 | 结果 |
| --- | --- |
| 正式源码完整性与签名 | ok 匹配固定校验和及发布者指纹 |
| 自动测试 | ok 22 项全部通过，无跳过 |
| 真实 Maka Host 本地协议 | ok 连接、派发、结果、文件工具与问题回答 |
| 正式版协议适配 | ok Chat、Responses 与 Anthropic 兼容连接 |
| TypeScript 与 Windows 构建 | ok 通过 |
| Windows 桌面程序 | ok 工程链、状态恢复和后台退出 |
| 现有 Web 工程 | ok 使用正式版本状态目录，Host 已连接 |
| macOS 原生运行 | warn 尚待 Mac 或 CI 验证 |
| 云端供应商 | warn 按已有约定，在配置后验证 |

SpecFlow 工程服务的生产依赖审计没有已知漏洞。
Maka 上游锁定的生产依赖中，6 个包存在当前审计告警。
其中 4 个为高等级，2 个为中等级。
保留官方锁文件，并记录告警，后续在 Maka 侧处理。
[依赖审计记录](maka-dependency-audit.json)

[Windows 安装包](../../release/SpecFlow-0.1.0-win-x64.exe)
[桌面交付记录](desktop.md)
[打包程序验收证据](../../release/desktop-smoke-win32-x64.json)

Claude Code 复核入口包括源码构建、发布校验、依赖收集和版本状态目录。
本次未调用外部 Claude Code。
