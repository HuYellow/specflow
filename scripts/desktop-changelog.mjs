const repositoryPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9][A-Za-z0-9_.-]*$/;
const shaPattern = /^[a-f0-9]{7,64}$/i;
const categoryNames = ['新功能', '问题修复', '性能', '改进', '文档', '工程维护', '其他变更'];
const categories = { feat: '新功能', fix: '问题修复', perf: '性能', refactor: '改进', docs: '文档', test: '工程维护', ci: '工程维护', build: '工程维护', chore: '工程维护' };

// Subjects are literal text: neither Markdown/HTML nor GitHub mentions may execute.
function literal(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/[\\`*_{}\[\]()#+\-.!|~]/g, '\\$&').replace(/@/g, '&#64;');
}

function oneLine(value) {
  return value.replace(/[\r\n]+/g, ' / ').replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, ' ').trim();
}

function validateTag(tag, name) {
  if (typeof tag !== 'string' || !tag.trim() || /[\u0000-\u001f\u007f]/.test(tag)) throw new Error(`Invalid ${name}.`);
  return encodeURIComponent(tag).replace(/[!'()*]/g, character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

function signatureState(value, positive, negative) {
  return value === true ? positive : value === false ? negative : '以本次发行签名状态为准';
}

/** Render only supplied evidence; the caller selects the previous published release. */
export function renderDesktopChangelog({ version, tag, repository, sourceSha, previousTag, commits, releaseNotes = '', capabilities = {} }) {
  if (typeof repository !== 'string' || repository.trim() !== repository || !repositoryPattern.test(repository)) throw new Error('Invalid GitHub repository; expected owner/repo.');
  if (typeof version !== 'string' || version.trim() !== version || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) throw new Error('Invalid stable desktop version.');
  if (typeof sourceSha !== 'string' || sourceSha.trim() !== sourceSha || !shaPattern.test(sourceSha)) throw new Error('Invalid source commit SHA.');
  if (!Array.isArray(commits) || typeof releaseNotes !== 'string' || !capabilities || typeof capabilities !== 'object') throw new Error('Invalid changelog evidence.');
  const encodedTag = validateTag(tag, 'release tag');
  const encodedPreviousTag = previousTag == null || previousTag === '' ? undefined : validateTag(previousTag, 'previous release tag');
  const base = `https://github.com/${repository}`;
  const download = name => `${base}/releases/download/${encodedTag}/${encodeURIComponent(name)}`;
  const groups = new Map(categoryNames.map(name => [name, []]));
  const breaking = [], seen = new Set();
  for (const commit of commits) {
    if (!commit || typeof commit.sha !== 'string' || commit.sha.trim() !== commit.sha || !shaPattern.test(commit.sha) || typeof commit.subject !== 'string' || (commit.body != null && typeof commit.body !== 'string')) throw new Error('Invalid changelog commit.');
    if (seen.has(commit.sha)) continue;
    seen.add(commit.sha);
    const subject = oneLine(commit.subject);
    if (/^Merge (?:pull request\b|branch\b|remote-tracking branch\b|tag\b)/i.test(subject)) continue;
    const conventional = /^([a-z]+)(?:\([^()]+\))?(!)?:\s+/i.exec(subject);
    const entry = `- ${literal(subject || '（空提交标题）')} ([${commit.sha.slice(0, 7)}](${base}/commit/${commit.sha}))`;
    groups.get(categories[conventional?.[1].toLowerCase()] || '其他变更').push(entry);
    const footer = /^BREAKING[ -]CHANGE:[^\r\n]*/im.exec(commit.body || '');
    if (conventional?.[2] || /\bBREAKING[ -]CHANGE\b/i.test(subject) || footer) breaking.push(`${entry}${footer ? ` — ${literal(oneLine(footer[0]))}` : ''}`);
  }

  const lines = [`# SpecFlow ${version}`, '', '## 本次更新', ''];
  if (!encodedPreviousTag) lines.push('首次正式发布；以下保留纳入本次发行的提交原文。', '');
  else lines.push(`变更基线为上一个已公开正式版本 [${literal(previousTag)}](${base}/releases/tag/${encodedPreviousTag})。`, '');
  if (breaking.length) lines.push('### 不兼容变更提醒', '', '以下提交标记了不兼容变更，请阅读提交详情并在升级前备份工程数据。', '', ...breaking, '');
  let count = 0;
  for (const [name, entries] of groups) {
    if (!entries.length) continue;
    count += entries.length;
    lines.push(`### ${name}`, '', ...entries, '');
  }
  if (!count) lines.push(encodedPreviousTag ? '本次没有可列出的新提交；请结合完整比较与构建记录核对发行内容。' : '首次正式发布；未提供可列出的提交记录。', '');
  if (releaseNotes.trim()) {
    lines.push('## GitHub 补充说明', '', '以下为 GitHub 生成的说明原文；完整提交记录见上文。', '',
      ...releaseNotes.trim().split(/\r?\n/).map(line => `> ${literal(oneLine(line))}`), '');
  }
  lines.push('## 下载与安装', '', '| 平台 | 安装包 | 更新用 ZIP |', '| --- | --- | --- |',
    `| Windows x64 | [EXE 安装程序](${download(`SpecFlow-${version}-win-x64.exe`)}) | — |`,
    `| macOS Apple Silicon | [DMG 安装包](${download(`SpecFlow-${version}-mac-arm64.dmg`)}) | [arm64 ZIP](${download(`SpecFlow-${version}-mac-arm64.zip`)}) |`,
    `| macOS Intel | [DMG 安装包](${download(`SpecFlow-${version}-mac-x64.dmg`)}) | [x64 ZIP](${download(`SpecFlow-${version}-mac-x64.zip`)}) |`, '',
    `[SHA-256 校验文件](${download('SHA256SUMS.txt')})。Windows 运行安装向导；macOS 打开匹配架构的 DMG，将应用拖入 Applications。`, '',
    '内置 Apache Maka 0.2.0，由固定校验和及签名者的正式源码发行版构建，仅分发 Runtime Host 及生产依赖。源码、编译器、测试、CLI/Eval 和构建缓存不进入安装包。', '',
    '运行需要本机 Git：Windows 可安装 Git for Windows；macOS 可安装 Xcode Command Line Tools 或 Git。', '',
    '## 签名与更新', '',
    `- Windows Authenticode：${signatureState(capabilities.winSigned, '已签名', '未签名')}。`,
    `- macOS Developer ID：${signatureState(capabilities.macSigned, '已签名', '未签名')}。`,
    `- Apple 公证：${signatureState(capabilities.macNotarized, '已公证', '未公证')}。`, '',
    'macOS 原位更新需要 Developer ID 签名及 Apple 公证；不满足时可下载对应 DMG 手动替换。应用检查更新后由用户选择下载和安装，升级前请保存工作并备份工程数据。', '',
    '## 构建与验证范围', '',
    '发布门槛包括 Windows x64、macOS arm64 与 macOS x64 原生构建、类型检查、回归测试、源码目录外的打包启动验收，以及安装包、更新清单与校验文件的一致性检查。Windows 另执行安装目录规则验收。', '',
    '具体执行结果以本次 Actions 记录为准；这些检查不等同于跨版本下载安装或真实模型服务的完整验收。', '',
    `- 构建源码：[${sourceSha}](${base}/commit/${sourceSha})`,
    `- 构建与验收记录：[GitHub Actions](${base}/actions/workflows/desktop.yml)`);
  if (encodedPreviousTag) lines.push(`- 完整变更：[${literal(previousTag)} → ${literal(tag)}](${base}/compare/${encodedPreviousTag}...${encodedTag})`);
  else lines.push(`- 首次发行源码：[${literal(tag)}](${base}/tree/${encodedTag})`);
  return `${lines.join('\n')}\n`;
}
