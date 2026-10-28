# DSH 生态分发与维护

Specflow 的插件独立于桌面安装包公开分发。当前版本为 `dsh-plugin-specflow@0.1.1`，
支持 DSH `0.2.1-rc.2`、宿主 Node.js 24+ 和 Git。

## 用户安装入口

- [npm 包主页](https://www.npmjs.com/package/dsh-plugin-specflow)
- [插件 Release](https://github.com/HuYellow/specflow/releases/tag/dsh-plugin-specflow%400.1.1)
- [预构建安装包](https://github.com/HuYellow/specflow/releases/download/dsh-plugin-specflow%400.1.1/dsh-plugin-specflow-0.1.1.tgz)
- [DSH 市场索引](https://raw.githubusercontent.com/HuYellow/specflow/main/market/dsh/index.json)

在 DSH 插件页启用实验性的自定义插件市场，在“发现”中添加上述索引 URL。
索引由 Specflow 项目维护，使用 DSH 官方 format 1，并明确版本和兼容范围。
索引的 Git 来源固定到真实分发提交，不会跟随分支后续变动。

在 DSH 的 **安装第三方插件** 入口输入 `dsh-plugin-specflow@0.1.1`。
CLI/Web 可安装相同固定版本：

```sh
dsh plugin --profile web add dsh-plugin-specflow@0.1.1
dsh web
```

GitHub 预构建安装包仍可使用：在安装入口输入上述 `.tgz` 下载地址，
或运行 `dsh plugin --profile web add <安装包下载地址或本地绝对路径>`。

停用和卸载使用同一 profile 的插件管理入口，CLI 命令为
`dsh plugin --profile web remove dsh-plugin-specflow`。工程数据默认保留。

已安装的第三方插件通过卸载后重新安装更新。先保存编辑并停止 Specflow 操作，在同一
profile 中卸载旧插件，再安装新版并重启 DSH。工程数据库、执行日志和隔离工作区保留；
若使用自定义 `dataDir`，重装后继续使用原配置值。

## 为什么有独立分发分支

源码位于 `main:plugins/deepseek-specflow`，构建和测试依赖保留在源码仓库。
`codex/dsh-distribution` 只包含插件子目录中的九个运行文件，以及保护构建字节的
`.gitattributes`。分发 manifest 移除开发依赖和生命周期脚本，Git 安装无需构建授权。

分发路径必须保留 `plugins/deepseek-specflow`。DSH 官方索引生成器先从默认分支发现
插件目录，再从 release tag 的相同目录读取包。使用 `dsh-plugin-specflow@<版本>`
标签，让生成器优先选择已发布分发提交。

Release 不设为仓库的 Latest，桌面应用的最新版本入口继续指向桌面 Release。
当前公开分发包含 npm、GitHub 安装包和固定提交的 Git 来源。
安装命令使用 `dsh-plugin-specflow@0.1.1` 固定版本；市场索引继续使用 Git 分发提交。

## 发布下一版本

1. 在插件目录更新 `package.json` 与 `package-lock.json`，同步兼容范围和说明。
2. 在仓库根目录运行插件类型检查、回归、完整 DSH 验收和打包。
3. 执行 `npm run dsh:distribution`，生成 `.tools/dsh-publication/distribution`。
4. 在独立分发 checkout 提交该目录的内容，校验白名单和构建 SHA-256。
5. 为真实分发提交创建 `dsh-plugin-specflow@<版本>` 标签并推送分发分支与标签。
6. 在 GitHub 发布该标签的 Release，上传 `.tgz` 和 `SHA256SUMS.txt`。
7. 以真实分发提交与发布时间生成索引，提交并推送 `main`。
8. 从公开下载地址和索引的 Git 来源分别验证安装、宿主激活与重启。

如同步发布下一版本到 npm，使用具有发布权限的账号，将第 2 步已验收的同一 `.tgz`
上传到 `https://registry.npmjs.org/`，发布时使用 `--access=public --ignore-scripts`。
按 npm 提示完成账号双重验证或浏览器授权。npm 返回成功后可能需要短暂处理，
应等到 `npm view dsh-plugin-specflow@<新版本> version --registry=https://registry.npmjs.org`
返回新版本，再更新安装说明或其他分发入口。同一包名和版本不能重复发布。
npm 包与 GitHub 安装包应保持相同字节；市场来源仍可保留固定提交的 Git 分发。

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

## 0.1.1 公开发布记录

2026-10-28 16:57:35（Asia/Shanghai）已公开发布 `dsh-plugin-specflow@0.1.1`：

- 自动关联当前对话的 Git 工程，识别仓库子目录和 Specflow 工作区；目录变化时同步，
  保留手动选择与尚未保存的正文、澄清答案、工程配置和运行答复。
- 本版还包含自 0.1.0 以来交付的中英文界面、执行预算与恢复控制，以及有限自动推进和修订。
- 分发提交为 `c945bafc2041d1a5ac602a1daa179ae41da28476`，标签为
  `dsh-plugin-specflow@0.1.1`，包目录保持 `plugins/deepseek-specflow`。
- Release 提供 `dsh-plugin-specflow-0.1.1.tgz` 和 `SHA256SUMS.txt`。安装包大小为
  435892 字节，SHA-256 为 `a391aab1c9b2f1ab3ba3dd254991acd3e008ce86dfbcb6b0b9a7f23ec25b5ec8`。
  公网下载的安装包、校验和文件及 GitHub 资产 digest 已核对一致。
- 根项目与插件类型检查、生产构建、291 项核心回归、27 项插件测试、4 项市场测试、
  23 项浏览器检查和 9 组真实 DSH 底座场景通过。真实底座场景使用本地脚本供应商。
- 公开 Release 安装包和固定提交 Git 来源均通过官方 DSH 安装、宿主激活、版本 0.1.1 回显、
  认证、工程关联、重启与锁清理验收。验收使用独立临时 profile。
- 市场索引采用上述实际发布时间并固定到分发提交，经过官方 DSH 0.2.1-rc.2 校验。
  插件 Release 不设为 Latest，桌面更新入口继续使用 `desktop-v0.2.0`。
- 2026-10-28 20:47:03（Asia/Shanghai），同一安装包已在公共 npm 仓库发布为
  `dsh-plugin-specflow@0.1.1`，`latest` 指向 `0.1.1`；仓库记录的 tarball 完整性与 GitHub 安装包一致。

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
