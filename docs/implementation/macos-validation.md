# macOS 本机验收记录

日期：2026-10-31。SpecFlow 0.2.0 已在 macOS 27.2 Apple Silicon 上完成本机原生构建、正式 Maka Host 验证和打包应用工程闭环。Intel、Developer ID 签名、公证及跨版本升级不在本轮通过范围内。

## 环境与来源

| 项目 | 实测值 |
| --- | --- |
| 系统 | macOS 27.2，Build 26B123，ARM64 |
| 应用版本与源码基线 | `0.2.0`；`077cf1022306bea2a1000de1c21ac2a1640c6ee6`，另含本次两处验收脚本修正 |
| 开发工具链 | Node.js `24.22.1`，npm `11.20.0` |
| 桌面运行时 | Electron `44.7.0`，随包 Node.js `24.19.0`、npm `11.17.0` |
| Maka | Apache Maka `0.2.0-incubating` 签名正式源码，Runtime Host 版本 `0.2.0` |
| Maka 构建 | 固定 npm `11.19.0`，203 个生产依赖包；源码、编译器、CLI/Eval 和构建缓存留在包外 |

Maka 源码 SHA-512、签名者指纹和下载来源按 [正式发行清单](../../config/maka-release.json) 校验。`maka:setup` 已验证签名，`maka:probe` 返回 `available: true`；打包应用与只读挂载的 DMG 内运行包均通过正式来源校验，未使用开发或预发布运行时。

## 验证结果

| 检查 | 结果 |
| --- | --- |
| 类型检查与生产构建 | `npm run typecheck`、`npm run build` 通过 |
| 全量回归 | 291 项：290 通过、0 失败、1 跳过；跳过项仅针对 Windows 原生签名检查，真实 Maka Host 用例已执行 |
| 开发版桌面冒烟 | 13 项检查通过，包含 CSV 工程闭环、真实 Node 测试和 Git 接纳 |
| ARM64 原生打包 | `npm run desktop:package:mac:arm64` 通过，生成 DMG、ZIP、blockmap 和 `latest-mac.yml` |
| 打包版桌面冒烟 | 14 项检查通过；完整 `.app` 复制到源码目录外，从临时工作目录启动，依赖解析限定在随包目录 |
| 原生双语与菜单 | 4 项检查通过：英文初始化、中英文切换、原生菜单同步、重启保留语言及工作项，退出关闭服务 |
| 打包版澄清 | 7 项检查通过：13 步默认流程、章程冻结、草稿快速切换与重启恢复、依据失效、答复写回和设计门禁 |
| 打包版工作空间 | 8 项检查通过：鼠标与键盘选择、跨空间隔离、迟到响应、空空间创建、重载、200% 实际缩放与滚动 |
| 需求输入 | 开发版与打包版均通过 8 项检查：UTF-8 上传、快照、草稿恢复、版本冲突、仓库导入、依据失效及布局 |
| 安装文件与更新清单 | DMG 校验有效，ZIP 压缩数据无损坏，更新清单的 SHA-512、文件大小及两个 blockmap 已核对 |
| DMG 只读挂载 | 应用版本为 `0.2.0`，内置 Node 为 `24.19.0`，Maka 正式来源有效，Applications 链接正确；检查后已卸载卷 |

打包版主冒烟实际覆盖随包 npm/npx 链接、后端生产依赖、渲染隔离与本地认证、更新菜单、单实例、目录选择与导出桥接、CSV 全工程链、正式 Maka Host、接纳后只读、正常退出、重启持久化及主进程崩溃后的服务清理。

界面测试使用独立临时用户目录。应本机使用者要求，后续验收在主进程执行前通过本地调试器注入隐藏策略，窗口不显示、不获取系统焦点，输入由 Playwright 发送至应用。真实 Electron、后端、IPC、Maka、文件与 Git 操作仍然执行；打包版的前台显示及系统焦点行为不计入该后台验收结论。原生双语菜单和开发版主冒烟在此前已完成常规窗口验收。

## 验收脚本修正

- `scripts/requirements-smoke.mjs`：比较实际路径并保留目录分隔边界，正确处理 macOS 的 `/var` 与 `/private/var` 临时路径别名，避免把隔离仓库误判为越界。
- `scripts/workspaces-smoke.mjs`：200% 缩放检查改用 Playwright 滚轮输入，使页面按真实用户滚动停止位置恢复；保留完整按钮可见、无横向溢出及实际缩放倍数断言。

首次打包遇到官方构建工具下载超时；取得同一官方文件并核对固定校验值后，重新执行原打包命令成功。未修改依赖锁文件、打包配置或正式发行策略。

## 复现与证据

在原生 Apple Silicon Mac 上准备 Node.js 24+、npm、Git 和 GPG，然后顺序执行。下列桌面脚本默认会显示窗口。

```sh
npm ci
npm run maka:setup
npm run typecheck
npm test
npm run build
npm run maka:probe
npm run desktop:package:mac:arm64
npm run desktop:smoke
npm run desktop:smoke:localization
npm run desktop:smoke:packaged
npm run desktop:smoke:clarify:packaged
npm run desktop:smoke:workspaces:packaged
npm run desktop:smoke:requirements -- --packaged
hdiutil verify release/SpecFlow-0.2.0-mac-arm64.dmg
unzip -tq release/SpecFlow-0.2.0-mac-arm64.zip
```

先完成资源准备与打包，再运行界面脚本；构建会重建桌面服务及静态资源目录。开发版窗口运行期间重建该目录，会影响其页面重载。

本机原始报告保存在 `release/desktop-smoke-darwin-arm64.json`、`release/clarify-smoke-packaged.json`、`release/workspaces-smoke-packaged.json`、`release/requirements-smoke.json` 和 `.tools/localization-qa/desktop-native-report.json`；对应目录同时保留截图。开发版主冒烟副本、后台启动器和安装包元数据校验结果保存在 `.tools/mac-validation/`。这些本机产物未加入 Git。

本次本地安装包 SHA-256 如下，来源为上述源码基线；它们不代表 GitHub 已发布同版本资产的哈希。

| 文件 | 字节数 | SHA-256 |
| --- | ---: | --- |
| `SpecFlow-0.2.0-mac-arm64.dmg` | 212279427 | `33f5b7eb9c25a08aee7c78afd9c62bf89c991637649accfb2d65c8fe64f6ddc4` |
| `SpecFlow-0.2.0-mac-arm64.zip` | 223959168 | `c00a31d9105e2c93b17bc5d70a6131a861b1713f2594e4d4a5d3284ec9dde3cc` |

## 验证边界

- 本轮仅验证 ARM64；Intel Mac 的历史发布记录见 [桌面交付](desktop.md)，本轮未重新执行 Intel 原生验证。
- 本地包没有 Developer ID 签名及 Apple 公证。未验证带下载隔离属性的首次安装、Gatekeeper 放行或跨版本原位升级，也未替换用户 Applications 中的应用。
- 文件选择和保存对话框使用固定返回值；实际导出文件和工程操作已执行。
- 模型调用使用本地协议夹具与确定性示例后端；真实供应商的模型质量、计费、长任务恢复和独立 OpenCode 服务仍需单独验证。
