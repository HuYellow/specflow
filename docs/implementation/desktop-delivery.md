---
title: SpecFlow 独立桌面版
subtitle: Windows 已交付 · 正式 Maka 源码运行包 · macOS 原生验收待执行
template: doc
theme: shadcn
lang: zh
date: 2026-10-12
---

Windows 安装包和桌面程序已生成，并通过完整工程链验收。
macOS 代码和构建流程已准备，尚未在 Mac 验证。
当前内置从签名正式源码构建的 Maka 0.2.0。

## A 打开应用

| 入口 | 用途 |
| --- | --- |
| [Windows 安装包](../../release/SpecFlow-0.1.0-win-x64.exe) | 安装应用，创建桌面和开始菜单快捷方式 |
| [Windows 桌面程序](../../release/win-unpacked/SpecFlow.exe) | 从构建目录直接运行，无需安装 |
| [详细交付记录](desktop.md) | 查看构建、数据目录和复核入口 |

安装包包含 Electron、Node.js、npm、Maka Runtime Host 和工作区扩展。
源码、编译器、测试、CLI/Eval 和构建缓存不进入安装包。
用户无需安装 Node.js 或手动启动服务。本机仍需有 Git。
验证自己的项目时，需要该项目的开发工具链。

## B 桌面应用如何运行

```flow LR
启动图标 -> 独立窗口: 自动打开
启动图标 -> 本地工程服务: 随包 Node
独立窗口 -> 本地工程服务: 专属会话
本地工程服务 -> 工程数据库: 系统用户目录
本地工程服务 -> Maka: 模型与工具执行
本地工程服务 -> Git工作区: 代码与验证
```

应用提供原生仓库选择、记录保存对话框和系统菜单。
重复启动唤起原窗口。退出应用时清理后台服务。
Windows 数据位于 APPDATA/SpecFlow/engineering。
macOS 数据位于 Library/Application Support/SpecFlow/engineering。

文件菜单可以打开数据和诊断日志目录。
卸载保留工程数据。已有 Web 数据不会自动迁移。
Maka 正式版使用版本状态目录，旧 dev 状态保留。

## C 两个平台的交付状态

| 目标 | 状态 | 产物与验收 |
| --- | --- | --- |
| Windows x64 | ok 已交付 | EXE 安装包；打包程序完整工程链通过 |
| macOS Apple Silicon | warn 待原生验收 | arm64 构建任务；目标产物 DMG 和 ZIP |
| macOS Intel | warn 待原生验收 | x64 构建任务；目标产物 DMG 和 ZIP |

Mac 构建必须在对应系统与架构运行。
仓库已配置三个原生 CI 任务，尚未推送或触发。
本次尝试跨系统打包，Windows 无法创建所需符号链接。
脚本现已拒绝这种构建，避免生成损坏的 Mac 应用。
正式发布签名尚未配置。Mac 公证需要 Apple 开发者凭据。

```powershell title="Windows 构建与验收"
npm ci
npm run maka:setup
npm run desktop:package:win
npm run desktop:smoke:packaged
```

在 Apple Silicon Mac 执行 npm run desktop:package:mac:arm64。
在 Intel Mac 执行 npm run desktop:package:mac:x64。

## D 已验证的工程行为

| 检查 | 结果 |
| --- | --- |
| 自动工程测试 | ok 22 项全部通过，包含真实 Host |
| TypeScript 与生产构建 | ok 通过 |
| 打包程序启动 | ok 无关工作目录下启动 |
| 原生对话框桥接 | ok 实际 IPC；选择结果由测试固定 |
| 完整 CSV 开发流程 | ok 文档、代码、Node 测试与 Git 接纳 |
| Maka 发布策略 | ok 签名正式源码；拒绝遗留 dev 包 |
| 本地访问边界 | ok 普通浏览器访问被拒绝 |
| 退出与重启 | ok 服务关闭，工程接纳状态保留 |
| 主进程崩溃 | ok 强制结束实际主进程后，后台监听关闭 |
| SpecFlow 工程服务依赖审计 | ok 无已知漏洞 |
| Maka 上游依赖审计 | warn 6 个受影响包：4 高、2 中 |

云端供应商验证按此前约定后补。
后续将源码构建改为正式 npm 依赖，底座独立选择暂缓。
Claude Code 的复核入口已写入交付记录，本次未调用外部复核。
[查看打包程序验收证据](../../release/desktop-smoke-win32-x64.json)
