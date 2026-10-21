# DSH 生态分发与维护

Specflow 的插件独立于桌面安装包公开分发。当前版本为 `dsh-plugin-specflow@0.1.0`，
支持 DSH `0.2.1-rc.2`、宿主 Node.js 24+ 和 Git。

## 用户安装入口

- [插件 Release](https://github.com/HuYellow/specflow/releases/tag/dsh-plugin-specflow%400.1.0)
- [预构建安装包](https://github.com/HuYellow/specflow/releases/download/dsh-plugin-specflow%400.1.0/dsh-plugin-specflow-0.1.0.tgz)
- [DSH 市场索引](https://raw.githubusercontent.com/HuYellow/specflow/main/market/dsh/index.json)

在 DSH 插件页启用实验性的自定义插件市场，在“发现”中添加上述索引 URL。
索引由 Specflow 项目维护，使用 DSH 官方 format 1，并明确版本和兼容范围。
索引的 Git 来源固定到真实分发提交，不会跟随分支后续变动。

CLI/Web 也可直接安装预构建包：

```sh
dsh plugin --profile web add https://github.com/HuYellow/specflow/releases/download/dsh-plugin-specflow%400.1.0/dsh-plugin-specflow-0.1.0.tgz
dsh web
```

停用和卸载使用同一 profile 的插件管理入口，CLI 命令为
`dsh plugin --profile web remove dsh-plugin-specflow`。工程数据默认保留。

## 为什么有独立分发分支

源码位于 `main:plugins/deepseek-specflow`，构建和测试依赖保留在源码仓库。
`codex/dsh-distribution` 只包含插件子目录中的九个运行文件，以及保护构建字节的
`.gitattributes`。分发 manifest 移除开发依赖和生命周期脚本，Git 安装无需构建授权。

分发路径必须保留 `plugins/deepseek-specflow`。DSH 官方索引生成器先从默认分支发现
插件目录，再从 release tag 的相同目录读取包。使用 `dsh-plugin-specflow@<版本>`
标签，让生成器优先选择已发布分发提交。

Release 不设为仓库的 Latest，桌面应用的最新版本入口继续指向桌面 Release。
公开发布当前使用 GitHub；npm 包尚未发布，不能使用裸包名安装。

## 发布下一版本

1. 在插件目录更新 `package.json` 与 `package-lock.json`，同步兼容范围和说明。
2. 在仓库根目录运行插件类型检查、回归、完整 DSH 验收和打包。
3. 执行 `npm run dsh:distribution`，生成 `.tools/dsh-publication/distribution`。
4. 在独立分发 checkout 提交该目录的内容，校验白名单和构建 SHA-256。
5. 为真实分发提交创建 `dsh-plugin-specflow@<版本>` 标签并推送分发分支与标签。
6. 在 GitHub 发布该标签的 Release，上传 `.tgz` 和 `SHA256SUMS.txt`。
7. 以真实分发提交与发布时间生成索引，提交并推送 `main`。
8. 从公开下载地址和索引的 Git 来源分别验证安装、宿主激活与重启。

索引生成示例（命令中的提交和时间需替换为真实值）：

```sh
node scripts/toolchain.mjs dsh-market generate --commit <40位分发提交> --published-at <带时区ISO时间> --path plugins/deepseek-specflow
npm run dsh:market -- validate
npm run dsh:market -- verify-remote
```

`generate` 和 `validate` 使用已安装的官方 DSH `0.2.1-rc.2` 索引校验器。
同时读取固定提交内的 manifest、配置层、Host、客户端和 `build-info.json`，
校验真实包身份和构建字节。`verify-remote` 要求公网 URL 直接返回 HTTP 200，
拒绝重定向，并核对远端索引与仓库中的内容一致。

公开来源的宿主验收可用：

```sh
node scripts/toolchain.mjs dsh-market verify-remote
node scripts/dsh-host-smoke.mjs --source <Release地址或索引中的固定Git来源> --report .tools/dsh-publication/public-host-smoke.json
```

使用 Node.js 24，准备方式同插件 README。验收使用独立 Harness home，
不会改动用户正在使用的 profile，也不调用付费模型。

## 社区目录

仓库添加 `dsh-plugin` topic，供社区发现；topic 不代表维护者已收录。
当前提交渠道遵循各自规则：

- `awesome-dsh-plugin/awesome-dsh-plugin`：新增插件元数据 YAML 的 PR，分类 `workflow`；
  monorepo 使用包目录 URL 和 GitHub Release 的 `tarball` 字段。
- `HackSing/dsh-plugins`：使用 Submit plugin issue 表单，提供包目录、用途、安装卸载、
  兼容与验证范围。该目录不接受新增插件的 PR。

提交资料明确披露 Windows、指定 DSH 版本、本地模拟模型与浏览器验收的范围。
社区是否合并或收录由维护者决定，公开提交不代表审核通过。

## 0.1.0 公开发布记录

2026-10-21 已完成公开分发：

- Release 与两个资产（`.tgz`、`SHA256SUMS.txt`）已公开，插件包 SHA-256 为
  `83821f9932f57d7dacf42c9594fc9e57d1b215c4aa3a35c1e9075c063ee92088`。
- 分发提交为 `4c6e4f2cdd65054bfc0c607a921cb41a00886659`，标签为
  `dsh-plugin-specflow@0.1.0`，目录为 `plugins/deepseek-specflow`。
- 公开索引直接返回 HTTP 200，通过官方校验并与仓库中的索引一致。
  公开 Release URL 和固定提交 Git 来源分别通过官方 DSH 安装、激活、认证、重启及锁清理验收。
- [awesome-dsh-plugin 收录 PR #8442](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/8442)
  和 [HackSing 收录申请 #335](https://github.com/HackSing/dsh-plugins/issues/335) 已提交。
  提交时均为开放状态，维护者审核结果以相应链接为准。
- 仓库已添加 `dsh-plugin` topic。桌面版 Latest Release 继续为 `desktop-v0.1.4`。

官方机制依据：[DSH 插件市场](https://deepseek-harness.github.io/deepseek-harness/en/guide/plugin-market)、
[插件打包](https://deepseek-harness.github.io/deepseek-harness/en/develop/basic/publish)。
