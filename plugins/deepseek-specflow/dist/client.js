window.__ModuleLoader__.load({ id: "dsh-plugin-specflow", factory: (require) => {
const module = { exports: {} };
const exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// plugins/deepseek-specflow/src/client.tsx
var client_exports = {};
__export(client_exports, {
  SpecflowPanel: () => SpecflowPanel,
  TAB_ID: () => TAB_ID,
  TAB_KIND: () => TAB_KIND,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);
var import_react2 = require("react");

// apps/web/src/flowSelectors.ts
var executionLabels = {
  pending: "\u5F85\u6267\u884C",
  starting: "\u542F\u52A8\u4E2D",
  running: "\u8FD0\u884C\u4E2D",
  waiting_interaction: "\u5F85\u4EA4\u4E92",
  completed: "\u5DF2\u7ED3\u675F",
  failed: "\u5931\u8D25",
  cancelled: "\u5DF2\u505C\u6B62",
  reconciling: "\u5F85\u6838\u5BF9"
};
var gateLabels = { unchecked: "\u5F85\u68C0\u67E5", passed: "\u901A\u8FC7", blocked: "\u963B\u585E", stale: "\u8FC7\u671F" };
function requiresHumanAcceptance(definition) {
  return !!definition?.requireAcceptance || definition?.type === "human";
}
function getStepStatus(node, definition) {
  const human = requiresHumanAcceptance(definition || node);
  return {
    execution: { label: "\u6267\u884C", value: executionLabels[node.execution], raw: node.execution, tone: node.execution === "failed" ? "danger" : ["waiting_interaction", "reconciling"].includes(node.execution) ? "warning" : "neutral" },
    gate: { label: "\u95E8\u7981", value: gateLabels[node.gate], raw: node.gate, tone: node.gate === "passed" ? "success" : node.gate === "blocked" ? "danger" : node.gate === "stale" ? "warning" : "neutral" },
    freshness: { label: "\u65B0\u9C9C\u5EA6", value: node.freshness === "fresh" ? "\u5F53\u524D\u6709\u6548" : "\u4E0A\u6E38\u5DF2\u53D8\u66F4", raw: node.freshness, tone: node.freshness === "fresh" ? "neutral" : "warning" },
    acceptance: { label: "\u63A5\u7EB3", value: human ? node.acceptance === "accepted" ? "\u4EBA\u5DE5\u5DF2\u63A5\u7EB3" : "\u5F85\u4EBA\u5DE5\u63A5\u7EB3" : node.acceptance === "accepted" ? "\u7CFB\u7EDF\u5DF2\u786E\u8BA4" : "\u65E0\u72EC\u7ACB\u63A5\u7EB3\u52A8\u4F5C", raw: node.acceptance, tone: human && node.acceptance !== "accepted" ? "warning" : node.acceptance === "accepted" ? "success" : "neutral" },
    effectivelyPassed: node.execution === "completed" && node.gate === "passed" && node.freshness === "fresh" && (!human || node.acceptance === "accepted")
  };
}
function selectCurrentNode(run, nodes) {
  if (!run) return void 0;
  const ordered = run.definition.nodes.map((definition) => nodes.find((node) => node.workflowRunId === run.id && node.nodeId === definition.id)).filter((node) => !!node);
  const priority = [["waiting_interaction"], ["reconciling"], ["starting", "running"], ["failed", "cancelled"]];
  for (const states of priority) {
    const node = ordered.find((node2) => states.includes(node2.execution));
    if (node) return node;
  }
  return ordered.find((node) => node.freshness === "stale") || ordered.find((node) => node.execution === "pending") || ordered.find((node) => !getStepStatus(node, run.definition.nodes.find((definition) => definition.id === node.nodeId)).effectivelyPassed) || ordered.at(-1);
}

// apps/web/src/MarkdownView.tsx
var import_react = require("react");

// apps/web/src/review-model.ts
function safeMarkdownHref(href) {
  const value = href.trim();
  if (/^(?:https?:\/\/|mailto:|#)/i.test(value) && !/[\u0000-\u0020\u007f]/.test(value)) return value;
  return void 0;
}

// apps/web/src/MarkdownView.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function inline(text) {
  const token = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|!?\[[^\]]+\]\([^)]+\))/g;
  const output = [];
  let offset = 0, match;
  while (match = token.exec(text)) {
    output.push(text.slice(offset, match.index));
    const value = match[0], key = match.index;
    if (value.startsWith("`")) output.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: value.slice(1, -1) }, key));
    else if (value.startsWith("**") || value.startsWith("__")) output.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: value.slice(2, -2) }, key));
    else if (value.startsWith("*")) output.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: value.slice(1, -1) }, key));
    else {
      const link = /^(!?)\[([^\]]+)\]\(([^)]+)\)$/.exec(value);
      const href = safeMarkdownHref(link[3]);
      output.push(href && !link[1] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href, target: href.startsWith("#") ? void 0 : "_blank", rel: "noreferrer", children: link[2] }, key) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Fragment, { children: link[1] ? `[\u56FE\u7247\uFF1A${link[2]}]` : link[2] }, key));
    }
    offset = token.lastIndex;
  }
  output.push(text.slice(offset));
  return output;
}
function MarkdownView({ content, idPrefix = "document", onSelectText }) {
  const parsed = (0, import_react.useMemo)(() => {
    const blocks = [], headings = [];
    const lines = content.replace(/\r\n/g, "\n").split("\n");
    let i = 0;
    const isBoundary = (line) => /^(?:\s*$|#{1,6}\s|```|~~~|\s*[-*+]\s|\s*\d+\.\s|>\s?|\s*(?:---+|\*\*\*+)\s*$)/.test(line);
    while (i < lines.length) {
      const start = i, line = lines[i];
      if (!line.trim()) {
        i++;
        continue;
      }
      const fence = /^\s*(`{3,}|~{3,})(.*)$/.exec(line);
      if (fence) {
        i++;
        const code = [];
        while (i < lines.length && !lines[i].trimStart().startsWith(fence[1])) code.push(lines[i++]);
        i++;
        blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: code.join("\n") }) }, start));
        continue;
      }
      const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
      if (heading) {
        const depth = heading[1].length, id = `${idPrefix}-heading-${headings.length}`;
        headings.push({ id, text: heading[2], depth });
        const Tag = `h${depth}`;
        blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { id, tabIndex: -1, children: inline(heading[2]) }, start));
        i++;
        continue;
      }
      if (/^\s*(?:---+|\*\*\*+)\s*$/.test(line)) {
        blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("hr", {}, start));
        i++;
        continue;
      }
      if (/^>/.test(line)) {
        const quote = [];
        while (i < lines.length && /^>/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ""));
        blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("blockquote", { children: inline(quote.join("\n")) }, start));
        continue;
      }
      const list = /^\s*(?:([-*+])|(\d+)\.)\s+(.+)$/.exec(line);
      if (list) {
        const ordered = !!list[2], items = [];
        while (i < lines.length) {
          const item = /^\s*(?:([-*+])|(\d+)\.)\s+(.+)$/.exec(lines[i]);
          if (!item || !!item[2] !== ordered) break;
          items.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: inline(item[3]) }, i));
          i++;
        }
        blocks.push(ordered ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", { start: Number(list[2]), children: items }, start) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: items }, start));
        continue;
      }
      if (line.includes("|") && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
        const cells = (value) => value.trim().replace(/^\||\|$/g, "").split("|").map((value2) => value2.trim());
        const header = cells(line);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(cells(lines[i++]));
        blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "markdown-table-scroll", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: header.map((cell, n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: inline(cell) }, n)) }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row, n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: row.map((cell, c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: inline(cell) }, c)) }, n)) })
        ] }) }, start));
        continue;
      }
      const paragraph = [line];
      i++;
      while (i < lines.length && !isBoundary(lines[i])) paragraph.push(lines[i++]);
      blocks.push(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: inline(paragraph.join("\n")) }, start));
    }
    return { blocks, headings };
  }, [content, idPrefix]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "markdown-layout", children: [
    parsed.headings.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", { className: "markdown-toc", "aria-label": "\u6587\u6863\u76EE\u5F55", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "\u76EE\u5F55" }),
      parsed.headings.map((heading) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: `#${heading.id}`, style: { paddingInlineStart: `${Math.min(heading.depth - 1, 3) * 10}px` }, children: heading.text }, heading.id))
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", { className: "markdown-document", "aria-label": "Markdown \u9884\u89C8", onMouseUp: () => {
      const selection = window.getSelection();
      if (selection && selection.toString()) onSelectText?.(selection.toString());
    }, children: parsed.blocks })
  ] });
}

// plugins/deepseek-specflow/package.json
var package_default = {
  name: "dsh-plugin-specflow",
  version: "0.1.0",
  description: "Specflow \u5DE5\u7A0B\u6D41\u7A0B\u5DE5\u4F5C\u53F0\uFF1A\u9700\u6C42\u3001\u89C4\u683C\u3001\u4EFB\u52A1\u3001\u72EC\u7ACB\u590D\u6838\u4E0E\u4EBA\u5DE5\u9A8C\u6536",
  type: "module",
  main: "./dist/index.mjs",
  exports: {
    ".": "./dist/index.mjs",
    "./client": "./dist/client.js",
    "./package.json": "./package.json"
  },
  files: [
    "dist/index.mjs",
    "dist/client.js",
    "dist/ZOD_LICENSE",
    "dist/build-info.json",
    "cordis.patch.yml",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "README.md"
  ],
  license: "Apache-2.0",
  author: "SpecFlow contributors",
  repository: {
    type: "git",
    url: "git+https://github.com/HuYellow/specflow.git",
    directory: "plugins/deepseek-specflow"
  },
  keywords: [
    "dsh-plugin",
    "specflow",
    "spec-driven-development",
    "workflow"
  ],
  engines: {
    node: ">=24",
    dsh: "0.2.1-rc.2"
  },
  publishConfig: {
    access: "public",
    registry: "https://registry.npmjs.org/"
  },
  dsh: {
    bundle: {
      patch: "./cordis.patch.yml"
    },
    client: {
      platform: "web",
      inject: [
        "@deepseek-ai/dsh-client-connection",
        "@deepseek-ai/dsh-client-ui-renderer",
        "@deepseek-ai/dsh-client-ui-sidebar-right",
        "@deepseek-ai/dsh-client-ui-session"
      ]
    }
  },
  scripts: {
    build: "node ../../scripts/toolchain.mjs dsh-build",
    prepack: "node ../../scripts/toolchain.mjs dsh-build",
    typecheck: "node ../../scripts/toolchain.mjs dsh-typecheck"
  },
  peerDependencies: {
    "@deepseek-ai/cordis": "~4.0.5",
    "@deepseek-ai/dsh-agent": "0.2.1-rc.2",
    "@deepseek-ai/dsh-client-connection": "0.2.1-rc.2",
    "@deepseek-ai/dsh-client-ui-session": "0.2.1-rc.2",
    "@deepseek-ai/dsh-client-ui-sidebar-right": "0.2.1-rc.2",
    "@deepseek-ai/dsh-home-paths": "0.2.1-rc.2",
    "@deepseek-ai/dsh-tools": "0.2.1-rc.2",
    "@deepseek-ai/schemastery": "~3.18.5",
    react: "^18.3.1"
  },
  devDependencies: {
    "@deepseek-ai/dsh-client-ui-renderer": "0.2.1-rc.2",
    "@deepseek-ai/dsh-client-ui-slots": "0.2.1-rc.2",
    "@deepseek-ai/dsh-util-values": "0.2.1-rc.2",
    "@types/react": "^18.3.0",
    "react-dom": "18.3.1"
  }
};

// plugins/deepseek-specflow/src/protocol.ts
var RPC_CHANNEL = "/api";
var READ_ENDPOINT = "specflow/read";
var COMMAND_ENDPOINT = "specflow/command";
var PLUGIN_VERSION = package_default.version;
async function readSpecflow(connection, request, signal) {
  const result = await connection.rpc.call(RPC_CHANNEL, READ_ENDPOINT, request, signal);
  if (!result.ok) throw Object.assign(new Error(result.error.message), result.error);
  return result.value;
}
async function commandSpecflow(connection, request, signal) {
  const result = await connection.rpc.call(RPC_CHANNEL, COMMAND_ENDPOINT, request, signal);
  if (!result.ok) throw Object.assign(new Error(result.error.message), result.error);
  return result.value;
}

// inline-styles:C:\Users\huyel\Documents\Codex\specflow\plugins\deepseek-specflow\src\client.css
var client_default = ".sf-workbench{--sf-paper:#f5f6f2;--sf-panel:#fffefb;--sf-ink:#243c38;--sf-muted:#63766a;--sf-line:#dce4d9;--sf-accent:#0b4940;--sf-soft:#e6eee3;--sf-warning:#846128;--sf-danger:#a14638;box-sizing:border-box;display:flex;flex-direction:column;height:100%;min-height:0;color:var(--sf-ink);background:var(--sf-paper);font:13px/1.65 'Segoe UI','Microsoft YaHei UI','Microsoft YaHei',sans-serif;container-type:inline-size}\n.sf-workbench *{box-sizing:border-box}.sf-workbench button,.sf-workbench input,.sf-workbench textarea,.sf-workbench select{font:inherit;color:inherit}.sf-workbench button{cursor:pointer;border:1px solid var(--sf-line);border-radius:5px;padding:7px 10px;background:var(--sf-panel);line-height:1.45}.sf-workbench button:disabled{opacity:.48;cursor:not-allowed}.sf-workbench button:hover:not(:disabled){background:var(--sf-soft);border-color:#98b6a1}.sf-workbench :is(button,input,textarea,select,summary,a):focus-visible{outline:2px solid #338c78;outline-offset:3px}.sf-workbench :is(input,textarea,select){min-width:0;width:100%;border:1px solid var(--sf-line);border-radius:5px;padding:8px 9px;background:var(--sf-panel)}.sf-workbench textarea{resize:vertical;line-height:1.8}.sf-workbench h2,.sf-workbench h3,.sf-workbench h4,.sf-workbench p{margin:0}.sf-workbench code,.sf-workbench pre{font-family:'Cascadia Code',Consolas,monospace}.sf-workbench pre{font-size:11px;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere;margin:9px 0;max-height:520px;overflow:auto}.sf-workbench .sf-primary{color:#fff;background:var(--sf-accent);border-color:var(--sf-accent)}.sf-workbench .sf-primary:hover:not(:disabled){background:#156354;border-color:#156354}.sf-workbench .sf-stop{color:var(--sf-danger);border-color:#d4b7aa}.sf-header{display:flex;align-items:center;justify-content:space-between;padding:15px 17px 12px;border-bottom:1px solid var(--sf-line);flex-shrink:0}.sf-header>div{display:flex;align-items:center;gap:9px}.sf-header strong{font-size:21px;letter-spacing:-.65px;font-weight:600}.sf-header strong>span{color:#bb9150}.sf-brand-mark{display:grid;place-items:center;width:27px;height:27px;border-radius:7px;background:var(--sf-accent);color:white;font-size:17px;font-weight:600}.sf-header .sf-icon-button{width:30px;height:30px;padding:0;font-size:21px;border-color:transparent;background:transparent}.sf-context{padding:8px 17px 14px;flex-shrink:0}.sf-label-row{display:flex;justify-content:space-between;align-items:center;margin:7px 0;color:var(--sf-muted);font-size:11px}.sf-label-row button{border-color:transparent;background:transparent;padding:2px 0;color:var(--sf-accent);font-size:11px}.sf-path{display:block;overflow-wrap:anywhere;font-size:10px;line-height:1.8;color:var(--sf-muted);margin:6px 0}.sf-context>.sf-path{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sf-messages:empty{display:none}.sf-alert{margin:0 14px 12px;padding:11px 12px;border:1px solid #dfbead;background:#fbf0e9;color:var(--sf-danger);font-size:12px;overflow-wrap:anywhere}.sf-alert button{display:block;margin-top:9px;font-size:11px}.sf-notice{padding:0 17px 10px;font-size:11px;color:var(--sf-accent)}.sf-tabs{display:flex;border-block:1px solid var(--sf-line);padding:0 15px;gap:8px;flex-shrink:0}.sf-tabs button{position:relative;flex:1;padding:11px 5px;border:0;border-radius:0;background:transparent;color:var(--sf-muted);font-size:12px}.sf-tabs button.sf-active{color:var(--sf-accent);font-weight:600;box-shadow:inset 0 -2px var(--sf-accent)}.sf-count{display:inline-grid;place-items:center;min-width:16px;height:16px;border-radius:8px;background:#e6d8b9;color:#77551c;margin-left:5px;font-size:10px}.sf-body{min-height:0;overflow:auto;flex:1;padding:17px;scrollbar-width:thin}.sf-item-heading{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:0 0 18px;margin-bottom:16px;border-bottom:1px solid var(--sf-line)}.sf-item-heading h2{width:100%;font-size:19px;line-height:1.6;font-weight:600;overflow-wrap:anywhere;letter-spacing:-.3px}.sf-item-heading>code{font-size:10px;color:var(--sf-muted);overflow-wrap:anywhere}.sf-badge{display:inline-flex;align-items:center;padding:3px 6px;line-height:1.4;font-size:10px;border-radius:3px;background:var(--sf-soft);color:var(--sf-muted);white-space:nowrap}.sf-state-running,.sf-state-starting{color:var(--sf-accent);background:#dceee5}.sf-state-failed,.sf-state-blocked{background:#f6e2db;color:var(--sf-danger)}.sf-state-accepted,.sf-state-passed,.sf-state-ready{background:#dfeee2;color:#356b48}.sf-state-stale,.sf-state-waiting_interaction,.sf-state-reconciling,.sf-state-candidate{background:#f0e7d3;color:var(--sf-warning)}.sf-section-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:13px}.sf-section-heading h3,.sf-card h3{font-size:14px;font-weight:600}.sf-section-heading p{font-size:11px;color:var(--sf-muted);margin-top:4px}.sf-stages{display:flex;flex-direction:column;gap:4px;margin-bottom:17px}.sf-stages .sf-stage{display:flex;align-items:center;text-align:left;gap:9px;padding:10px 9px;border-color:transparent;background:transparent}.sf-stage>span:nth-child(2){flex:1;min-width:0}.sf-stage strong{display:block;font-size:12px;font-weight:500;overflow-wrap:anywhere}.sf-stage small{display:block;font-size:10px;margin-top:3px;color:var(--sf-muted)}.sf-stage-number{font-size:10px;font-family:Consolas,monospace;color:#83958a;width:19px;flex-shrink:0}.sf-stages .sf-stage.sf-selected{background:var(--sf-soft);border-color:#ccd9c8;box-shadow:inset 3px 0 var(--sf-accent)}.sf-stage.sf-selected .sf-stage-number{color:var(--sf-accent)}.sf-card{padding:15px;border:1px solid var(--sf-line);border-radius:6px;background:var(--sf-panel);margin:0 0 17px}.sf-facts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0 15px}.sf-facts>div{min-width:0}.sf-facts dt{font-size:10px;color:var(--sf-muted)}.sf-facts dd{font-size:11px;margin:3px 0 0;overflow-wrap:anywhere}.sf-field{display:flex;flex-direction:column;gap:7px;font-size:11px;color:var(--sf-muted);margin:11px 0}.sf-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:15px}.sf-actions>button{font-size:12px}.sf-inline-error{padding:10px;border-left:2px solid var(--sf-danger);background:#f9ece6;color:var(--sf-danger);font-size:12px;overflow-wrap:anywhere}.sf-blockers{padding:12px 12px 12px 26px;margin:12px 0;background:#f3ecd9;border:1px solid #e0d4b7;border-radius:4px;color:var(--sf-warning);font-size:11px}.sf-blockers li+li{margin-top:7px}.sf-hint{color:var(--sf-muted);font-size:11px;line-height:1.9;margin:9px 0!important}.sf-details{border-block:1px solid var(--sf-line);padding:11px 0;margin:15px 0;font-size:12px}.sf-details summary,.sf-evidence summary{cursor:pointer;font-size:12px;color:var(--sf-muted)}.sf-details>p{margin-top:10px}.sf-preserve{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.9}.sf-form{padding:15px;margin:0 15px 15px;border:1px solid #bdcfbd;border-radius:6px;background:var(--sf-panel)}.sf-form h3{font-size:14px;margin-bottom:14px}.sf-form>label{display:block;font-size:11px;color:var(--sf-muted);margin:10px 0 5px}.sf-empty{text-align:center;padding:38px 8px 45px}.sf-empty-mark{display:grid;place-items:center;background:var(--sf-soft);color:var(--sf-accent);width:46px;height:46px;border-radius:10px;font-size:27px;margin:0 auto 17px}.sf-empty h3{font-size:16px;line-height:1.7;font-weight:500}.sf-empty p{font-size:12px;color:var(--sf-muted);line-height:1.9;margin:11px auto 0;max-width:300px}.sf-loading{color:var(--sf-muted);font-size:12px;padding:14px 0;line-height:1.9}.sf-footer{display:flex;align-items:center;gap:7px;padding:9px 17px;border-top:1px solid var(--sf-line);font-size:10px;color:var(--sf-muted);flex-shrink:0}.sf-footer>span:last-child{margin-left:auto}.sf-status-dot{width:5px;height:5px;background:#478973;border-radius:50%}.sf-eyebrow{display:block;font-size:10px;letter-spacing:1px;color:#6e9279;margin-bottom:8px}.sf-clarification{border-color:#b9cfb8;background:#f4f8ef}.sf-question{padding-top:15px;margin-top:16px;border-top:1px solid var(--sf-line)}.sf-question label{display:flex;align-items:flex-start;gap:8px;font-size:12px;font-weight:600}.sf-question label>span{font:10px/1.8 Consolas,monospace;color:var(--sf-muted)}.sf-question>p{font-size:11px;line-height:1.9;margin:7px 0 11px;color:var(--sf-muted)}.sf-options{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}.sf-options button{text-align:left;font-size:11px}.sf-options button[aria-pressed=true]{background:#e0eddf;border-color:#83a58b;color:var(--sf-accent)}.sf-clarification>textarea{margin-top:7px}.sf-document-heading{display:flex;align-items:center;gap:9px;flex-wrap:wrap;color:var(--sf-muted);font-size:10px;margin:11px 0}.sf-segmented{display:flex;gap:3px;padding:3px;background:var(--sf-soft);border-radius:5px;margin:16px 0}.sf-segmented button{flex:1;font-size:11px;background:transparent;border-color:transparent}.sf-segmented button[aria-pressed=true]{background:var(--sf-panel);border-color:var(--sf-line);color:var(--sf-accent)}.sf-reading{padding:17px 0}.sf-reading h3{font:600 23px/1.6 Georgia,'Microsoft YaHei',serif;letter-spacing:-.5px}.sf-reading-summary{font-size:13px;line-height:1.95;white-space:pre-wrap;margin:13px 0 22px!important}.sf-reading>section{margin:18px 0;border-top:1px solid var(--sf-line);padding-top:15px}.sf-reading h4{display:flex;gap:10px;font-size:13px;font-weight:600}.sf-reading h4>span{color:var(--sf-muted);font:10px/2 Consolas,monospace}.sf-reading ul{padding-left:18px;margin:10px 0}.sf-reading li{font-size:12px;line-height:1.95;white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0}.sf-accept-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border-block:1px solid var(--sf-line);padding:13px 0;margin-top:15px}.sf-accept-bar>span{color:var(--sf-muted);font-size:11px}.sf-accept-bar button{font-size:11px}.sf-finding{padding:12px;border:1px solid var(--sf-line);margin-top:13px}.sf-finding p{margin:9px 0;font-size:12px}.sf-finding code{font-size:10px;color:var(--sf-muted)}.sf-document{line-height:1.9;overflow-wrap:anywhere}.sf-document .markdown-toc{border-left:2px solid var(--sf-line);padding-left:10px;margin:16px 0}.sf-document .markdown-toc>strong{font-size:11px;color:var(--sf-muted)}.sf-document .markdown-toc a{display:block;font-size:11px;line-height:2;color:var(--sf-accent);text-decoration:none}.sf-document h1{font-size:22px;line-height:1.6}.sf-document h2{font-size:19px}.sf-document h3{font-size:16px}.sf-document h4{font-size:14px}.sf-document :is(h1,h2,h3,h4,h5,h6){margin:20px 0 10px}.sf-document p{margin:10px 0;font-size:12px}.sf-document pre,.sf-document blockquote{padding:12px;background:var(--sf-soft);border-radius:4px;margin:11px 0}.sf-document code{font-size:11px}.sf-document :is(ul,ol){padding-left:22px;font-size:12px}.sf-document a{color:var(--sf-accent);text-underline-offset:3px}.sf-document .markdown-table-scroll{overflow:auto}.sf-document table{border-collapse:collapse;font-size:11px;white-space:nowrap}.sf-document :is(td,th){border:1px solid var(--sf-line);padding:7px 9px}.sf-run-facts{margin:10px 0;display:flex;flex-direction:column;gap:10px}.sf-run-facts>div{min-width:0}.sf-run-facts dt{font-size:10px;color:var(--sf-muted)}.sf-run-facts dd{margin:2px 0 0;overflow-wrap:anywhere;font-size:12px}.sf-subheading{font-size:12px;margin:20px 0 12px!important}.sf-evidence{border:1px solid var(--sf-line);padding:11px;margin:8px 0}.sf-evidence summary{display:flex;gap:8px;align-items:center}.sf-checkbox{display:flex;align-items:flex-start;gap:8px;font-size:11px;line-height:1.9;margin-top:18px}.sf-checkbox input{width:14px;flex-shrink:0;margin-top:4px;accent-color:var(--sf-accent)}.sf-diff{background:var(--sf-panel);padding:11px}.sf-document hr{border:0;border-top:1px solid var(--sf-line);margin:18px 0}\n@container (max-width:300px){.sf-body{padding:13px}.sf-header{padding-inline:13px}.sf-context{padding-inline:13px}.sf-stage small{font-size:9px}.sf-stages .sf-stage{gap:6px;padding:9px 6px}.sf-stage>.sf-badge{font-size:9px}.sf-stage-number{width:16px}.sf-card{padding:12px}.sf-tabs{padding-inline:10px;gap:3px}.sf-facts{gap:8px}.sf-actions .sf-primary{width:100%}}\nbody[data-ds-dark-theme] .sf-workbench{--sf-paper:#1d2621;--sf-panel:#232f27;--sf-ink:#e0e9df;--sf-muted:#a6b6a7;--sf-line:#3d4d40;--sf-accent:#a8d1b1;--sf-soft:#2b3d2e;--sf-warning:#ddc58d;--sf-danger:#edb1a2}body[data-ds-dark-theme] .sf-workbench .sf-primary{background:#365f44;border-color:#56795b;color:#f0f6ed}body[data-ds-dark-theme] .sf-workbench .sf-primary:hover:not(:disabled){background:#426e4e;border-color:#719376}body[data-ds-dark-theme] .sf-workbench button:hover:not(:disabled){border-color:#7a9b7d}body[data-ds-dark-theme] .sf-brand-mark{background:#365f44}body[data-ds-dark-theme] .sf-stage.sf-selected{border-color:#5e7d60!important}body[data-ds-dark-theme] .sf-alert,body[data-ds-dark-theme] .sf-inline-error{background:#412d26;border-color:#78574b}body[data-ds-dark-theme] .sf-blockers{background:#3c3826;border-color:#645d3c}body[data-ds-dark-theme] .sf-clarification{background:#243326;border-color:#506c4b}body[data-ds-dark-theme] .sf-options button[aria-pressed=true]{background:#345036;border-color:#7a9b7d}body[data-ds-dark-theme] .sf-state-running,body[data-ds-dark-theme] .sf-state-starting,body[data-ds-dark-theme] .sf-state-accepted,body[data-ds-dark-theme] .sf-state-passed,body[data-ds-dark-theme] .sf-state-ready{background:#304a35;color:#b5d7b5}body[data-ds-dark-theme] .sf-state-failed,body[data-ds-dark-theme] .sf-state-blocked{background:#4b3029;color:#edb1a2}body[data-ds-dark-theme] .sf-state-stale,body[data-ds-dark-theme] .sf-state-waiting_interaction,body[data-ds-dark-theme] .sf-state-reconciling,body[data-ds-dark-theme] .sf-state-candidate{background:#49402c;color:#ddc58d}\n@media(prefers-color-scheme:dark){html:not([data-ds-theme-source]) .sf-workbench{--sf-paper:#1d2621;--sf-panel:#232f27;--sf-ink:#e0e9df;--sf-muted:#a6b6a7;--sf-line:#3d4d40;--sf-accent:#a8d1b1;--sf-soft:#2b3d2e;--sf-warning:#ddc58d;--sf-danger:#edb1a2}html:not([data-ds-theme-source]) .sf-workbench .sf-primary{background:#365f44;border-color:#56795b;color:#f0f6ed}html:not([data-ds-theme-source]) .sf-workbench .sf-primary:hover:not(:disabled){background:#426e4e;border-color:#719376}html:not([data-ds-theme-source]) .sf-workbench button:hover:not(:disabled){border-color:#7a9b7d}html:not([data-ds-theme-source]) .sf-brand-mark{background:#365f44}html:not([data-ds-theme-source]) .sf-stage.sf-selected{border-color:#5e7d60!important}html:not([data-ds-theme-source]) .sf-alert,html:not([data-ds-theme-source]) .sf-inline-error{background:#412d26;border-color:#78574b}html:not([data-ds-theme-source]) .sf-blockers{background:#3c3826;border-color:#645d3c}html:not([data-ds-theme-source]) .sf-clarification{background:#243326;border-color:#506c4b}html:not([data-ds-theme-source]) .sf-options button[aria-pressed=true]{background:#345036;border-color:#7a9b7d}html:not([data-ds-theme-source]) .sf-state-running,html:not([data-ds-theme-source]) .sf-state-starting,html:not([data-ds-theme-source]) .sf-state-accepted,html:not([data-ds-theme-source]) .sf-state-passed,html:not([data-ds-theme-source]) .sf-state-ready{background:#304a35;color:#b5d7b5}html:not([data-ds-theme-source]) .sf-state-failed,html:not([data-ds-theme-source]) .sf-state-blocked{background:#4b3029;color:#edb1a2}html:not([data-ds-theme-source]) .sf-state-stale,html:not([data-ds-theme-source]) .sf-state-waiting_interaction,html:not([data-ds-theme-source]) .sf-state-reconciling,html:not([data-ds-theme-source]) .sf-state-candidate{background:#49402c;color:#ddc58d}}\n\n.sf-requirement-actions{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:13px 0}.sf-requirement-actions>button,.sf-document-heading>button{font-size:11px}.sf-document-heading>button{margin-left:auto}.sf-editor-version{font:10px/1.7 Consolas,monospace;color:var(--sf-muted);overflow-wrap:anywhere}.sf-editor{padding:13px;margin:13px 0;border:1px solid var(--sf-line);border-radius:5px;background:var(--sf-panel)}.sf-editor .sf-section-heading{align-items:flex-start}.sf-editor .sf-section-heading h3{font-size:13px}.sf-document-editor textarea{font:12px/1.9 'Cascadia Code',Consolas,monospace;min-height:300px}.sf-editor-conflict{margin:13px 0;padding:12px;border:1px solid var(--sf-warning);border-radius:4px;background:var(--sf-soft);color:var(--sf-warning);font-size:11px;line-height:1.9}.sf-editor-conflict>details{margin:10px 0;color:var(--sf-ink)}.sf-editor-conflict>details>p{margin-top:10px}.sf-editor-conflict>button{font-size:11px;margin-top:8px}.sf-requirement-documents{margin:16px 0;color:var(--sf-ink)}.sf-requirement-documents>h4{font-size:11px;font-weight:500;color:var(--sf-muted);margin-bottom:9px}.sf-requirement-documents>details{border:1px solid var(--sf-line);border-radius:4px;padding:10px;margin:7px 0}.sf-requirement-documents summary{overflow-wrap:anywhere;font-size:11px}.sf-requirement-documents summary>span{font-size:10px;color:var(--sf-muted);margin-left:8px}.sf-requirement-documents pre{font-size:11px}.sf-requirements>.sf-preserve{margin-top:12px}.sf-document-editor .sf-actions{margin-bottom:2px}\n";

// plugins/deepseek-specflow/src/client.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var TAB_ID = "dsh-plugin-specflow/workbench";
var TAB_KIND = "specflow";
var inject = ["connection", "slots", "sidebarRightTabs"];
function apply(ctx) {
  ctx.effect(() => {
    const style = document.createElement("style");
    style.dataset.plugin = "dsh-plugin-specflow";
    style.textContent = client_default;
    document.head.append(style);
    return () => style.remove();
  }, "specflow: stylesheet");
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: TAB_ID,
    kind: TAB_KIND,
    keepMounted: true,
    title: () => "Specflow",
    guide: [{ id: "workbench", order: 40, title: () => "Specflow \u5DE5\u7A0B\u5DE5\u4F5C\u53F0", description: () => "\u4ECE\u9700\u6C42\u3001\u89C4\u683C\u5230\u590D\u6838\u4E0E\u9A8C\u6536" }]
  }), "specflow: tab type");
  ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register(
    { name: "sidebar.right.pane.tab", key: TAB_ID, inject: () => ({ connection: ctx.connection }) },
    SpecflowPanel
  )), "specflow: tab body");
}
var labels = {
  pending: "\u5F85\u6267\u884C",
  starting: "\u542F\u52A8\u4E2D",
  running: "\u6267\u884C\u4E2D",
  waiting_interaction: "\u5F85\u56DE\u7B54",
  completed: "\u5DF2\u7ED3\u675F",
  failed: "\u5931\u8D25",
  cancelled: "\u5DF2\u505C\u6B62",
  reconciling: "\u5F85\u6838\u5BF9",
  passed: "\u5DF2\u901A\u8FC7",
  blocked: "\u88AB\u963B\u585E",
  stale: "\u5DF2\u8FC7\u671F",
  accepted: "\u5DF2\u63A5\u7EB3",
  active: "\u8FDB\u884C\u4E2D",
  ready: "\u5F85\u9A8C\u6536",
  working: "\u5B9E\u73B0\u4E2D",
  candidate: "\u5F85\u63A5\u7EB3"
};
var logicalLabels = { spec: "\u9700\u6C42\u89C4\u683C", plan: "\u5DE5\u7A0B\u8BBE\u8BA1", tasks: "\u4EFB\u52A1\u62C6\u89E3", implementation: "\u5B9E\u73B0\u8BF4\u660E", convergence: "\u5BF9\u9F50\u62A5\u544A" };
var activeStates = ["starting", "running", "waiting_interaction", "reconciling"];
var short = (value) => value ? value.slice(0, 8) : "\u2014";
var time = (value) => value ? new Date(value).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "\u2014";
var targetKey = (target) => JSON.stringify(target);
var errorMessage = (error) => error instanceof Error ? error.message : "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5\u3002";
var pendingWrites = /* @__PURE__ */ new WeakMap();
function pendingKey(sessionId) {
  return `dsh-plugin-specflow.pending:${location.origin}${location.pathname}:${sessionId}`;
}
function rememberedWrite(connection, key) {
  const memory = pendingWrites.get(connection)?.get(key);
  if (memory) return memory;
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? "null");
    if (value && typeof value.operation === "string" && typeof value.idempotencyKey === "string" && typeof value.startedAt === "string") return value;
  } catch {
  }
  return void 0;
}
function rememberWrite(connection, key, write) {
  let entries = pendingWrites.get(connection);
  if (!entries) {
    entries = /* @__PURE__ */ new Map();
    pendingWrites.set(connection, entries);
  }
  if (write) entries.set(key, write);
  else entries.delete(key);
  try {
    if (write) sessionStorage.setItem(key, JSON.stringify(write));
    else sessionStorage.removeItem(key);
  } catch {
  }
}
function Empty({ title, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-empty", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "sf-empty-mark", "aria-hidden": "true", children: "\u25C7" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: title }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children })
  ] });
}
function Badge({ value, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `sf-badge sf-state-${value}`, children: children ?? labels[value] ?? value });
}
function SpecflowPanel({ connection, sessionId, useTabInfo }) {
  const { tab } = useTabInfo();
  const storageKey = pendingKey(sessionId);
  const [previousWrite] = (0, import_react2.useState)(() => rememberedWrite(connection, storageKey));
  const [bootstrap, setBootstrap] = (0, import_react2.useState)();
  const [snapshot, setSnapshot] = (0, import_react2.useState)();
  const [projectId, setProjectId] = (0, import_react2.useState)(""), [itemId, setItemId] = (0, import_react2.useState)("");
  const [section, setSection] = (0, import_react2.useState)("flow");
  const [busy, setBusy] = (0, import_react2.useState)(false), [loading, setLoading] = (0, import_react2.useState)(true);
  const [error, setError] = (0, import_react2.useState)(previousWrite ? "\u4E0A\u6B21\u5199\u5165\u7684\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u5237\u65B0\u5E76\u6838\u5BF9\u5DE5\u7A0B\u8BB0\u5F55\u540E\u7EE7\u7EED\u3002" : ""), [notice, setNotice] = (0, import_react2.useState)("");
  const [uncertain, setUncertain] = (0, import_react2.useState)(!!previousWrite), [refreshKey, setRefreshKey] = (0, import_react2.useState)(0);
  const [form, setForm] = (0, import_react2.useState)();
  const [editing, setEditing] = (0, import_react2.useState)({ requirements: false, artifact: false });
  const alive = (0, import_react2.useRef)(true), lock = (0, import_react2.useRef)(false), selection = (0, import_react2.useRef)({ projectId, itemId });
  const uncertainWrite = (0, import_react2.useRef)(!!previousWrite), explicitRefresh = (0, import_react2.useRef)(false);
  const controlsId = (0, import_react2.useId)();
  selection.current = { projectId, itemId };
  const lifetime = (0, import_react2.useRef)(void 0);
  if (!lifetime.current) lifetime.current = new AbortController();
  const read = (0, import_react2.useCallback)((request, signal) => readSpecflow(connection, request, AbortSignal.any([lifetime.current.signal, tab.signal, ...signal ? [signal] : []])), [connection, tab.signal]);
  (0, import_react2.useEffect)(() => {
    alive.current = true;
    if (lifetime.current?.signal.aborted) lifetime.current = new AbortController();
    return () => {
      alive.current = false;
      lifetime.current?.abort();
    };
  }, []);
  (0, import_react2.useEffect)(() => {
    setEditing({ requirements: false, artifact: false });
  }, [projectId, itemId]);
  (0, import_react2.useEffect)(() => {
    if (!tab.visible) return;
    let current2 = true, timer;
    const controller = new AbortController();
    const sync = async () => {
      try {
        const initial = await read({ resource: "bootstrap" }, controller.signal);
        if (!current2) return;
        setBootstrap(initial);
        const selected = selection.current;
        const project2 = initial.projects.find((project3) => project3.id === selected.projectId) ?? initial.projects[0];
        const items2 = initial.workItems.filter((item2) => item2.projectId === project2?.id);
        const item = items2.find((item2) => item2.id === selected.itemId) ?? items2[0];
        setProjectId(project2?.id ?? "");
        setItemId(item?.id ?? "");
        const value = item ? await read({ resource: "snapshot", id: item.id }, controller.signal) : void 0;
        if (!current2) return;
        setSnapshot(value);
        setLoading(false);
        if (!uncertainWrite.current || explicitRefresh.current) {
          const confirmed = explicitRefresh.current;
          setError("");
          setUncertain(false);
          uncertainWrite.current = false;
          explicitRefresh.current = false;
          if (confirmed) rememberWrite(connection, storageKey);
        }
      } catch (error2) {
        if (current2 && !controller.signal.aborted) {
          setError(errorMessage(error2));
          setLoading(false);
        }
      } finally {
        if (current2) timer = setTimeout(sync, 2500);
      }
    };
    void sync();
    return () => {
      current2 = false;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [read, tab.visible, projectId, itemId, refreshKey]);
  const command = async (operation, id, input) => {
    if (lock.current || uncertain || !tab.visible || !bootstrap?.canWrite) throw new Error("\u8BF7\u5148\u5237\u65B0\u5DE5\u7A0B\u72B6\u6001\uFF0C\u518D\u6267\u884C\u64CD\u4F5C\u3002");
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    const pending2 = { operation, id, idempotencyKey: crypto.randomUUID(), startedAt: (/* @__PURE__ */ new Date()).toISOString() };
    rememberWrite(connection, storageKey, pending2);
    try {
      const result = await commandSpecflow(connection, { operation, id, input, idempotencyKey: pending2.idempotencyKey }, AbortSignal.any([lifetime.current.signal, tab.signal]));
      rememberWrite(connection, storageKey);
      if (alive.current) {
        setNotice("\u64CD\u4F5C\u5DF2\u8BB0\u5F55\uFF0C\u6B63\u5728\u540C\u6B65\u5DE5\u7A0B\u72B6\u6001\u3002");
        setRefreshKey((value) => value + 1);
      }
      return result;
    } catch (error2) {
      const failure = error2;
      const status = failure?.details?.status;
      const rejected = failure?.code === "INVALID_REQUEST" || typeof status === "number" && status >= 400 && status < 500;
      const unknown = !rejected;
      if (!unknown) rememberWrite(connection, storageKey);
      if (alive.current) {
        setUncertain(unknown);
        uncertainWrite.current = unknown;
        setError(`${errorMessage(error2)}${unknown ? " \u5199\u5165\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u5237\u65B0\u5E76\u6838\u5BF9\u8FD0\u884C\u8BB0\u5F55\u3002" : ""}`);
      }
      throw error2;
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const refresh = () => {
    explicitRefresh.current = true;
    setLoading(true);
    setRefreshKey((value) => value + 1);
  };
  const run = (operation, id, input) => {
    void command(operation, id, input).catch(() => {
    });
  };
  const disabled = busy || uncertain || !bootstrap?.canWrite || !tab.visible || !!error;
  const project = bootstrap?.projects.find((project2) => project2.id === projectId);
  const items = bootstrap?.workItems.filter((item) => item.projectId === projectId) ?? [];
  const current = snapshot?.item.id === itemId ? snapshot : void 0;
  const hasDraft = editing.requirements || editing.artifact;
  const pending = current?.clarifications.filter((clarification) => clarification.state === "waiting_answers").length ?? 0;
  const pendingInteractions = current?.interactions.filter((interaction) => interaction.state === "pending") ?? [];
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-workbench", "data-specflow-panel": true, "data-session-id": sessionId, "aria-busy": loading || busy, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "sf-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "sf-brand-mark", "aria-hidden": "true", children: "S" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("strong", { children: [
          "Specflow",
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "." })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "sf-icon-button", title: "\u5237\u65B0\u5DE5\u7A0B\u72B6\u6001", "aria-label": "\u5237\u65B0\u5DE5\u7A0B\u72B6\u6001", disabled: busy, onClick: refresh, children: "\u21BB" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-context", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-label-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: `${controlsId}-project`, children: "\u5DE5\u7A0B" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", disabled: disabled || hasDraft, onClick: () => setForm(form === "project" ? void 0 : "project"), children: "\uFF0B \u6253\u5F00\u4ED3\u5E93" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("select", { id: `${controlsId}-project`, value: projectId, disabled: busy || hasDraft, onChange: (event) => {
        setProjectId(event.target.value);
        setItemId("");
        setSnapshot(void 0);
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", disabled: true, children: "\u9009\u62E9\u672C\u5730\u5DE5\u7A0B" }),
        bootstrap?.projects.map((project2) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: project2.id, children: project2.name }, project2.id))
      ] }),
      project && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { className: "sf-path", title: project.rootPath, children: project.rootPath }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-label-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: `${controlsId}-item`, children: "\u5DE5\u4F5C\u9879" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", disabled: disabled || hasDraft || !project, onClick: () => setForm(form === "item" ? void 0 : "item"), children: "\uFF0B \u65B0\u9700\u6C42" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("select", { id: `${controlsId}-item`, value: itemId, disabled: busy || hasDraft || !items.length, onChange: (event) => {
        setItemId(event.target.value);
        setSnapshot(void 0);
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", disabled: true, children: items.length ? "\u9009\u62E9\u5DE5\u4F5C\u9879" : "\u6B64\u5DE5\u7A0B\u8FD8\u6CA1\u6709\u9700\u6C42" }),
        items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: item.id, children: item.name }, item.id))
      ] }),
      hasDraft && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-hint", children: "\u6709\u672A\u4FDD\u5B58\u7684\u6B63\u6587\u7F16\u8F91\u3002\u4FDD\u5B58\u6216\u53D6\u6D88\u7F16\u8F91\u540E\uFF0C\u5373\u53EF\u5207\u6362\u5DE5\u7A0B\u6216\u5DE5\u4F5C\u9879\u3002" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-messages", "aria-live": "polite", children: [
      error && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-alert", role: "alert", children: [
        error,
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", disabled: busy, onClick: refresh, children: "\u5237\u65B0\u6838\u5BF9" })
      ] }),
      notice && !error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-notice", role: "status", children: notice })
    ] }),
    form && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(CreateForm, { kind: form, disabled, projectId, command, onCancel: () => setForm(void 0), onCreated: (result) => {
      setForm(void 0);
      if (form === "project") {
        setProjectId(result.id);
        setItemId("");
      } else setItemId(result.id);
      setSnapshot(void 0);
    } }, form),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("nav", { className: "sf-tabs", "aria-label": "\u5DE5\u7A0B\u5DE5\u4F5C\u533A", children: [["flow", "\u6D41\u7A0B"], ["documents", "\u6587\u6863"], ["code", "\u4EE3\u7801"], ["runs", "\u8FD0\u884C"]].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", "aria-current": section === key ? "page" : void 0, className: section === key ? "sf-active" : "", onClick: () => setSection(key), children: [
      label,
      key === "flow" && pending > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "sf-count", children: pending })
    ] }, key)) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("main", { className: "sf-body", children: loading && !current ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-loading", role: "status", children: "\u6B63\u5728\u8BFB\u53D6\u672C\u5730\u5DE5\u7A0B\u2026" }) : !project ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Empty, { title: "\u628A\u9700\u6C42\u53D8\u6210\u53EF\u9A8C\u8BC1\u7684\u5DE5\u7A0B", children: "\u6253\u5F00\u4E00\u4E2A\u672C\u5730 Git \u4ED3\u5E93\uFF0C\u4ECE\u9700\u6C42\u89C4\u683C\u5F00\u59CB\u5EFA\u7ACB\u5B8C\u6574\u7684\u5F00\u53D1\u8BB0\u5F55\u3002" }) : !current ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Empty, { title: "\u4ECE\u4E00\u4E2A\u65B0\u9700\u6C42\u5F00\u59CB", children: [
      "\u4E3A ",
      project.name,
      " \u521B\u5EFA\u5DE5\u4F5C\u9879\u3002\u6BCF\u4E2A\u5DE5\u4F5C\u9879\u4F1A\u4F7F\u7528\u72EC\u7ACB\u7684\u5206\u652F\u4E0E\u5DE5\u4F5C\u533A\u3002"
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-item-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: current.item.name }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { value: current.item.status }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { title: current.item.branch, children: current.item.branch })
      ] }),
      pendingInteractions.map((interaction) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(InteractionCard, { id: interaction.id, request: interaction.request, command, disabled }, interaction.id)),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { hidden: section !== "flow", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Flow, { snapshot: current, bootstrap, read, run, command, disabled, visible: tab.visible && section === "flow", onCode: () => setSection("code"), onRequirementsEditingChange: (value) => setEditing((current2) => ({ ...current2, requirements: value })) }, current.item.id) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { hidden: section !== "documents", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Documents, { snapshot: current, read, run, command, disabled, visible: tab.visible && section === "documents", onEditingChange: (value) => setEditing((current2) => ({ ...current2, artifact: value })) }, current.item.id) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { hidden: section !== "code", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Code, { snapshot: current, read, run, disabled, visible: tab.visible && section === "code" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { hidden: section !== "runs", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Runs, { snapshot: current, bootstrap, read, run, disabled, visible: tab.visible && section === "runs" }) })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("footer", { className: "sf-footer", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "sf-status-dot" }),
      "\u672C\u5730\u5DE5\u7A0B\u8BB0\u5F55",
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: busy ? "\u6B63\u5728\u64CD\u4F5C" : loading ? "\u540C\u6B65\u4E2D" : "DSH \u63D2\u4EF6" })
    ] })
  ] });
}
function CreateForm({ kind, projectId, command, onCreated, onCancel, disabled }) {
  const prefix = (0, import_react2.useId)(), [name, setName] = (0, import_react2.useState)(""), [content, setContent] = (0, import_react2.useState)("");
  const submit = async (event) => {
    event.preventDefault();
    try {
      const result = await command(kind === "project" ? "registerProject" : "createWorkItem", void 0, kind === "project" ? { rootPath: content.trim(), name: name.trim() || void 0 } : { projectId, name: name.trim(), request: content.trim(), kind: "feature", documents: [] });
      onCreated(result);
    } catch {
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("form", { className: "sf-form", onSubmit: submit, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: kind === "project" ? "\u6253\u5F00\u672C\u5730 Git \u4ED3\u5E93" : "\u521B\u5EFA\u65B0\u9700\u6C42" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: `${prefix}-name`, children: kind === "project" ? "\u5DE5\u7A0B\u540D\u79F0\uFF08\u53EF\u9009\uFF09" : "\u9700\u6C42\u540D\u79F0" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { id: `${prefix}-name`, autoFocus: true, value: name, required: kind === "item", maxLength: 200, onChange: (event) => setName(event.target.value) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: `${prefix}-content`, children: kind === "project" ? "\u4ED3\u5E93\u7EDD\u5BF9\u8DEF\u5F84" : "\u9700\u6C42\u4E0E\u9A8C\u6536\u9884\u671F" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("textarea", { id: `${prefix}-content`, rows: kind === "project" ? 2 : 5, value: content, required: true, onChange: (event) => setContent(event.target.value), placeholder: kind === "project" ? "C:\\projects\\my-app" : "\u5E0C\u671B\u5B9E\u73B0\u4EC0\u4E48\uFF1F\u54EA\u4E9B\u884C\u4E3A\u4EE3\u8868\u5B8C\u6210\uFF1F" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", disabled, onClick: onCancel, children: "\u53D6\u6D88" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "sf-primary", disabled: disabled || !content.trim() || kind === "item" && !name.trim(), children: kind === "project" ? "\u6253\u5F00\u5DE5\u7A0B" : "\u521B\u5EFA\u5DE5\u4F5C\u9879" })
    ] })
  ] });
}
function Flow({ snapshot, bootstrap, read, run, command, disabled, visible, onCode, onRequirementsEditingChange }) {
  const latest = snapshot.runs.at(-1);
  const nodes = snapshot.nodes.filter((node2) => node2.workflowRunId === latest?.id);
  const [chosen, setChosen] = (0, import_react2.useState)(""), [override, setOverride] = (0, import_react2.useState)(""), [showStages, setShowStages] = (0, import_react2.useState)(false);
  const [editingRequirements, setEditingRequirements] = (0, import_react2.useState)(false);
  const node = nodes.find((node2) => node2.id === chosen) ?? selectCurrentNode(latest, nodes);
  const definition = latest?.definition.nodes.find((definition2) => definition2.id === node?.nodeId);
  const [readiness, setReadiness] = (0, import_react2.useState)();
  const readinessKey = `${node?.id}:${node?.revision}:${snapshot.item.revision}:${snapshot.project.revision}:${snapshot.requirements.current.id}:${snapshot.artifacts.map((artifact) => artifact.revision).join(",")}`;
  const backend = snapshot.project.executionBackend ?? "dsh";
  const targets = bootstrap.catalog.targets.filter((target) => target.backend === backend);
  const configured = definition?.target ?? (definition?.role ? latest?.definition.roles[definition.role] ?? snapshot.project.defaults[definition.role] : void 0);
  const selected = targets.find((target) => targetKey(target) === override) ?? (configured?.backend === backend ? configured : targets[0]);
  const modelStage = !!node && ["agent", "review", "clarify"].includes(node.type);
  const active = !!node && activeStates.includes(node.execution);
  const clarification = snapshot.clarifications.find((session) => session.nodeRunId === node?.id && session.state === "waiting_answers");
  const completed = nodes.filter((node2) => getStepStatus(node2, latest?.definition.nodes.find((definition2) => definition2.id === node2.nodeId)).effectivelyPassed).length;
  (0, import_react2.useEffect)(() => {
    setOverride("");
  }, [node?.id, backend]);
  (0, import_react2.useEffect)(() => {
    if (!node || !visible) return;
    const controller = new AbortController();
    void read({ resource: "readiness", id: node.id }, controller.signal).then((value) => {
      if (!controller.signal.aborted) setReadiness({ key: readinessKey, ...value });
    }).catch((error) => {
      if (!controller.signal.aborted) setReadiness({ key: readinessKey, ready: false, reasons: [errorMessage(error)] });
    });
    return () => controller.abort();
  }, [read, visible, readinessKey]);
  const checked = readiness?.key === readinessKey ? readiness : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-section-heading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u5DE5\u7A0B\u6D41\u7A0B" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
          completed,
          " / ",
          nodes.length,
          " \u4E2A\u6B65\u9AA4\u5DF2\u901A\u8FC7"
        ] })
      ] }),
      latest ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", "aria-expanded": showStages, onClick: () => setShowStages((value) => !value), children: [
        showStages ? "\u6536\u8D77\u6B65\u9AA4" : "\u5207\u6362\u6B65\u9AA4",
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "aria-hidden": "true", children: showStages ? "\u25B4" : "\u25BE" })
      ] }) : snapshot.workflows[0] && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "sf-primary", disabled, onClick: () => run("createRun", void 0, { workflowId: snapshot.workflows[0].id }), children: "\u5EFA\u7ACB\u6D41\u7A0B" })
    ] }),
    showStages && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "sf-stages", "aria-label": "\u6D41\u7A0B\u6B65\u9AA4", children: nodes.map((stage, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: stage.id === node?.id ? "sf-stage sf-selected" : "sf-stage", "aria-pressed": stage.id === node?.id, onClick: () => {
      setChosen(stage.id);
      setShowStages(false);
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "sf-stage-number", children: String(index + 1).padStart(2, "0") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: stage.name }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("small", { children: [
          getStepStatus(stage, latest?.definition.nodes.find((definition2) => definition2.id === stage.nodeId)).gate.value,
          " \xB7 ",
          getStepStatus(stage, latest?.definition.nodes.find((definition2) => definition2.id === stage.nodeId)).acceptance.value
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { value: stage.execution })
    ] }, stage.id)) }),
    node && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "sf-card sf-stage-detail", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-section-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: node.name }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { value: node.freshness === "stale" ? "stale" : node.execution })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dl", { className: "sf-facts", children: Object.values(getStepStatus(node, definition)).filter((value) => typeof value !== "boolean").map((fact) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dt", { children: fact.label }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dd", { children: fact.value })
      ] }, fact.label)) }),
      modelStage && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "sf-field", children: [
        "\u8FDE\u63A5\u4E0E\u6A21\u578B",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("select", { "aria-label": "\u8FDE\u63A5\u4E0E\u6A21\u578B", value: selected ? targetKey(selected) : "", disabled: disabled || active, onChange: (event) => setOverride(event.target.value), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", disabled: true, children: "\u5728 DSH \u4E2D\u914D\u7F6E\u6A21\u578B\u540E\u5237\u65B0" }),
          configured && configured.backend === backend && !targets.some((target) => targetKey(target) === targetKey(configured)) && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("option", { value: targetKey(configured), children: [
            configured.connectionSlug,
            " / ",
            configured.model
          ] }),
          targets.map((target) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("option", { value: targetKey(target), children: [
            target.connectionSlug,
            " / ",
            target.model
          ] }, targetKey(target)))
        ] })
      ] }),
      node.error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-inline-error", children: node.error }),
      (checked?.reasons.length || node.blockers.length) > 0 && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: "sf-blockers", children: [.../* @__PURE__ */ new Set([...checked?.reasons ?? [], ...node.blockers])].map((reason) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("li", { children: reason }, reason)) }),
      modelStage && !selected && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-hint", children: "\u8BF7\u5148\u5728 DSH \u914D\u7F6E\u53EF\u7528\u6A21\u578B\uFF0C\u518D\u5237\u65B0\u5DE5\u7A0B\u72B6\u6001\u3002" }),
      editingRequirements && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-hint", children: "\u9700\u6C42\u6B63\u6587\u6709\u672A\u4FDD\u5B58\u7684\u7F16\u8F91\uFF0C\u8BF7\u5148\u4FDD\u5B58\u6216\u53D6\u6D88\uFF0C\u518D\u542F\u52A8\u6B65\u9AA4\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "sf-actions", children: active && node.currentAttemptId ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "sf-stop", disabled, onClick: () => run("stopAttempt", node.currentAttemptId), children: "\u505C\u6B62\u5F53\u524D\u5C1D\u8BD5" }) : node.type === "human" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "sf-primary", onClick: onCode, children: "\u6838\u5BF9\u4EE3\u7801\u5E76\u9A8C\u6536" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "sf-primary", disabled: disabled || editingRequirements || !checked?.ready || modelStage && !selected || !!clarification || latest?.state !== "active", onClick: () => run("startNode", node.id, { expectedRevision: node.revision, ...selected && modelStage ? { target: selected } : {} }), children: node.execution === "pending" ? "\u542F\u52A8\u6B64\u6B65\u9AA4" : "\u91CD\u65B0\u6267\u884C" }) })
    ] }),
    clarification && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Clarification, { session: clarification, draft: snapshot.clarificationDrafts.find((draft) => draft.sessionId === clarification.id), command, disabled }, clarification.id),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ProjectSettings, { project: snapshot.project, targets, command, disabled }, snapshot.project.id),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Requirements, { snapshot, command, disabled, onEditingChange: (value) => {
      setEditingRequirements(value);
      onRequirementsEditingChange(value);
    } })
  ] });
}
function RequirementDocuments({ documents }) {
  if (!documents.length) return null;
  const sourceNames = { upload: "\u4E0A\u4F20\u8D44\u6599", repository: "\u4ED3\u5E93\u8D44\u6599", pasted: "\u7C98\u8D34\u8D44\u6599" };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-requirement-documents", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h4", { children: [
      "\u5DF2\u6709\u9700\u6C42\u8D44\u6599 \xB7 ",
      documents.length,
      " \u4EFD"
    ] }),
    documents.map((document2) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("summary", { children: [
        document2.name,
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: sourceNames[document2.source] })
      ] }),
      document2.repositoryPath && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { className: "sf-path", children: document2.repositoryPath }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { children: document2.content })
    ] }, document2.id))
  ] });
}
function Requirements({ snapshot, command, disabled, onEditingChange }) {
  const current = snapshot.requirements.current;
  const [draft, setDraft] = (0, import_react2.useState)();
  const [saving, setSaving] = (0, import_react2.useState)(false), [error, setError] = (0, import_react2.useState)("");
  const prefix = (0, import_react2.useId)();
  const conflict = !!draft && current.id !== draft.expectedRevisionId;
  const close = () => {
    setDraft(void 0);
    setError("");
    onEditingChange(false);
  };
  const save = async (event) => {
    event.preventDefault();
    if (!draft || saving || disabled || conflict) return;
    setSaving(true);
    setError("");
    try {
      await command("saveRequirements", snapshot.item.id, draft);
      close();
    } catch (error2) {
      setError(error2.code === "REVISION_CONFLICT" ? "\u9700\u6C42\u5DF2\u6709\u65B0\u4FEE\u8BA2\uFF0C\u5F53\u524D\u8349\u7A3F\u5DF2\u4FDD\u7559\u3002\u8BF7\u6BD4\u8F83\u6700\u65B0\u9700\u6C42\u540E\u7EE7\u7EED\u7F16\u8F91\u3002" : errorMessage(error2));
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { className: "sf-details sf-requirements", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("summary", { children: "\u539F\u59CB\u9700\u6C42\u4E0E\u5DE5\u4F5C\u533A" }),
    draft ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("form", { className: "sf-editor", onSubmit: save, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-section-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u7F16\u8F91\u9700\u6C42\u6B63\u6587" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "sf-editor-version", children: [
          "\u57FA\u4E8E ",
          short(draft.expectedRevisionId)
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-hint", children: "\u4FDD\u5B58\u4F1A\u521B\u5EFA\u65B0\u7684\u9700\u6C42\u4FEE\u8BA2\uFF0C\u5DF2\u6709\u8D44\u6599\u4F1A\u4E00\u5E76\u4FDD\u7559\uFF1B\u53D7\u5F71\u54CD\u7684\u6B65\u9AA4\u9700\u8981\u91CD\u65B0\u5206\u6790\u6216\u590D\u6838\u3002" }),
      (conflict || error) && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-editor-conflict", role: "alert", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: conflict ? "\u9700\u6C42\u5DF2\u6709\u65B0\u4FEE\u8BA2\u3002\u4F60\u7684\u6B63\u6587\u8349\u7A3F\u548C\u8D44\u6599\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u5148\u6BD4\u8F83\u6700\u65B0\u9700\u6C42\u3002" : error }),
        conflict && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("summary", { children: "\u67E5\u770B\u6700\u65B0\u9700\u6C42" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-preserve", children: current.request }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RequirementDocuments, { documents: current.documents })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", disabled: saving, onClick: () => {
            setDraft((value) => value && { ...value, expectedRevisionId: current.id, documents: current.documents.map((document2) => ({ ...document2 })) });
            setError("");
          }, children: "\u4EE5\u6700\u65B0\u4FEE\u8BA2\u7EE7\u7EED\u7F16\u8F91" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-hint", children: "\u4FDD\u7559\u4F60\u7684\u6B63\u6587\u8349\u7A3F\uFF0C\u5E76\u91C7\u7528\u6700\u65B0\u4FEE\u8BA2\u4E2D\u7684\u9700\u6C42\u8D44\u6599\u3002" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "sf-field", htmlFor: `${prefix}-request`, children: [
        "\u9700\u6C42\u6B63\u6587",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("textarea", { id: `${prefix}-request`, "aria-label": "\u9700\u6C42\u6B63\u6587", rows: 10, maxLength: 2e6, value: draft.request, disabled: saving, onChange: (event) => setDraft((value) => value && { ...value, request: event.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RequirementDocuments, { documents: draft.documents }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", disabled: saving, onClick: close, children: "\u53D6\u6D88\u7F16\u8F91\u9700\u6C42" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "sf-primary", disabled: disabled || saving || conflict || !draft.request.trim() && !draft.documents.length, children: saving ? "\u6B63\u5728\u4FDD\u5B58\u2026" : "\u4FDD\u5B58\u9700\u6C42" })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-requirement-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "sf-editor-version", children: [
          "\u9700\u6C42\u4FEE\u8BA2 ",
          short(current.id)
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", disabled: disabled || snapshot.item.status === "accepted", onClick: () => {
          setDraft({ expectedRevisionId: current.id, request: current.request, documents: current.documents.map((document2) => ({ ...document2 })) });
          setError("");
          onEditingChange(true);
        }, children: "\u7F16\u8F91\u9700\u6C42" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-preserve", children: current.request || "\u5C1A\u672A\u586B\u5199\u9700\u6C42\u8BF4\u660E\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RequirementDocuments, { documents: current.documents })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { className: "sf-path", children: snapshot.item.workspace })
  ] });
}
function Clarification({ session, draft, command, disabled }) {
  const [answers, setAnswers] = (0, import_react2.useState)(() => ({ ...draft?.answers }));
  const prefix = (0, import_react2.useId)();
  const questions = session.questions.filter((question) => !question.answer);
  const submit = async (event) => {
    event.preventDefault();
    try {
      await command("answerClarification", session.id, { expectedRevision: session.revision, answers: questions.map((question) => ({ questionId: question.id, answer: answers[question.id]?.trim() })) });
    } catch {
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("form", { className: "sf-card sf-clarification", onSubmit: submit, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "sf-eyebrow", children: "\u9700\u8981\u4F60\u7684\u51B3\u5B9A" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u8865\u5168\u9700\u6C42\u4E2D\u7684\u5173\u952E\u95EE\u9898" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-hint", children: "\u56DE\u7B54\u4F1A\u5199\u5165\u5F53\u524D\u89C4\u683C\uFF0C\u968F\u540E\u7EE7\u7EED\u6F84\u6E05\u3002\u6682\u65F6\u79BB\u5F00\u524D\u53EF\u4EE5\u4FDD\u5B58\u8349\u7A3F\u3002" }),
    questions.map((question, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-question", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { htmlFor: `${prefix}-${index}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: String(index + 1).padStart(2, "0") }),
        question.question
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: question.reason }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "sf-options", children: question.options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", "aria-pressed": answers[question.id] === option, disabled, onClick: () => setAnswers((value) => ({ ...value, [question.id]: option })), children: option }, option)) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("textarea", { id: `${prefix}-${index}`, rows: 3, required: true, maxLength: 4e3, disabled, value: answers[question.id] ?? "", onChange: (event) => setAnswers((value) => ({ ...value, [question.id]: event.target.value })) })
    ] }, question.id)),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", disabled, onClick: () => {
        void command("saveClarificationDraft", session.id, { expectedRevision: draft?.revision ?? 0, answers }).catch(() => {
        });
      }, children: "\u4FDD\u5B58\u8349\u7A3F" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "sf-primary", disabled: disabled || questions.some((question) => !answers[question.id]?.trim()), children: "\u63D0\u4EA4\u56DE\u7B54\u5E76\u7EE7\u7EED" })
    ] })
  ] });
}
function ProjectSettings({ project, targets, command, disabled }) {
  const test = project.commands.find((command2) => command2.id === "test") ?? project.commands[0];
  const [rules, setRules] = (0, import_react2.useState)(project.rules), [executable, setExecutable] = (0, import_react2.useState)(test?.executable ?? "node");
  const [args, setArgs] = (0, import_react2.useState)(JSON.stringify(test?.args ?? ["--test"])), [revision, setRevision] = (0, import_react2.useState)(project.revision), [error, setError] = (0, import_react2.useState)("");
  const [defaults, setDefaults] = (0, import_react2.useState)(project.defaults);
  const prefix = (0, import_react2.useId)();
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    let parsed;
    try {
      parsed = JSON.parse(args);
      if (!Array.isArray(parsed) || parsed.some((value) => typeof value !== "string")) throw new Error();
    } catch {
      setError('\u547D\u4EE4\u53C2\u6570\u8BF7\u586B\u5199 JSON \u5B57\u7B26\u4E32\u6570\u7EC4\uFF0C\u4F8B\u5982 ["run", "test"]\u3002');
      return;
    }
    try {
      const updated = await command("configureProject", project.id, { expectedRevision: revision, executionBackend: "dsh", rules, defaults, commands: [{ id: "test", executable: executable.trim(), args: parsed, timeoutMs: test?.timeoutMs ?? 12e4 }, ...project.commands.filter((command2) => command2.id !== "test" && command2.id !== test?.id)] });
      setRevision(updated.revision);
    } catch {
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { className: "sf-details", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("summary", { children: "\u5DE5\u7A0B\u914D\u7F6E\u4E0E\u9A8C\u8BC1\u547D\u4EE4" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("form", { className: "sf-settings-form", onSubmit: submit, children: [
      [["analyst", "\u5206\u6790"], ["architect", "\u8BBE\u8BA1"], ["developer", "\u5F00\u53D1"], ["reviewer", "\u590D\u6838"]].map(([role, label]) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "sf-field", htmlFor: `${prefix}-${role}`, children: [
        label,
        "\u9ED8\u8BA4\u6A21\u578B",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("select", { id: `${prefix}-${role}`, value: defaults[role] ? targetKey(defaults[role]) : "", disabled, onChange: (event) => {
          const target = targets.find((target2) => targetKey(target2) === event.target.value);
          setDefaults((value) => {
            const next = { ...value };
            if (target) next[role] = target;
            else delete next[role];
            return next;
          });
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: "", children: "\u6BCF\u6B21\u542F\u52A8\u65F6\u9009\u62E9" }),
          targets.map((target) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("option", { value: targetKey(target), children: [
            target.connectionSlug,
            " / ",
            target.model
          ] }, targetKey(target)))
        ] })
      ] }, role)),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "sf-field", htmlFor: `${prefix}-rules`, children: [
        "\u5DE5\u7A0B\u89C4\u5219",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("textarea", { id: `${prefix}-rules`, rows: 4, value: rules, onChange: (event) => setRules(event.target.value), disabled })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "sf-field", htmlFor: `${prefix}-executable`, children: [
        "\u9A8C\u8BC1\u547D\u4EE4",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { id: `${prefix}-executable`, value: executable, onChange: (event) => setExecutable(event.target.value), required: true, disabled, placeholder: "npm" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "sf-field", htmlFor: `${prefix}-args`, children: [
        "\u547D\u4EE4\u53C2\u6570\uFF08JSON \u6570\u7EC4\uFF09",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { id: `${prefix}-args`, value: args, onChange: (event) => setArgs(event.target.value), disabled, placeholder: '["run", "test"]' })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-hint", children: '\u9A8C\u8BC1\u5728\u5DE5\u4F5C\u9879\u7684\u72EC\u7ACB\u5DE5\u4F5C\u533A\u4E2D\u6267\u884C\u3002npm \u9879\u76EE\u53EF\u4F7F\u7528 npm \u4E0E ["run", "test"]\u3002' }),
      error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-inline-error", children: error }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "sf-actions", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "submit", disabled: disabled || !executable.trim(), children: "\u4FDD\u5B58\u5DE5\u7A0B\u914D\u7F6E" }) })
    ] })
  ] });
}
function Documents({ snapshot, read, run, command, disabled, visible, onEditingChange }) {
  const [chosen, setChosen] = (0, import_react2.useState)(""), [mode, setMode] = (0, import_react2.useState)("reading");
  const artifact = snapshot.artifacts.find((artifact2) => artifact2.id === chosen) ?? snapshot.artifacts[0];
  const revision = snapshot.revisions.find((revision2) => revision2.id === artifact?.currentRevisionId);
  const [reading, setReading] = (0, import_react2.useState)(), [error, setError] = (0, import_react2.useState)("");
  const [draft, setDraft] = (0, import_react2.useState)();
  const [saving, setSaving] = (0, import_react2.useState)(false), [saveError, setSaveError] = (0, import_react2.useState)(""), [savedRevisionId, setSavedRevisionId] = (0, import_react2.useState)("");
  const [savedArtifactBaseline, setSavedArtifactBaseline] = (0, import_react2.useState)(0);
  const editorId = (0, import_react2.useId)();
  (0, import_react2.useEffect)(() => {
    setReading(void 0);
    setError("");
    if (!revision || !visible) return;
    const controller = new AbortController();
    void read({ resource: "artifact", id: revision.id }, controller.signal).then((value) => {
      if (!controller.signal.aborted) setReading(value);
    }).catch((error2) => {
      if (!controller.signal.aborted) setError(errorMessage(error2));
    });
    return () => controller.abort();
  }, [read, revision?.id, visible]);
  if (!artifact || !revision) return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Empty, { title: "\u4EA7\u7269\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC", children: "\u5B8C\u6210\u9700\u6C42\u89C4\u683C\u3001\u5DE5\u7A0B\u8BBE\u8BA1\u6216\u4EFB\u52A1\u62C6\u89E3\u540E\uFF0C\u53EF\u9605\u8BFB\u5B8C\u6574\u6587\u6863\u5E76\u4EBA\u5DE5\u63A5\u7EB3\u3002" });
  const accepted = artifact.acceptedRevisionId === revision.id;
  const conflict = !!draft && (artifact.id !== draft.artifactId || artifact.revision !== draft.expectedRevision || revision.id !== draft.sourceRevisionId);
  const awaitingRevision = !!savedRevisionId && revision.id !== savedRevisionId && artifact.revision <= savedArtifactBaseline;
  const save = async (event) => {
    event.preventDefault();
    if (!draft || saving || disabled || conflict) return;
    setSaving(true);
    setSaveError("");
    try {
      const saved = await command("editArtifact", draft.artifactId, { expectedRevision: draft.expectedRevision, content: draft.content });
      setSavedRevisionId(saved.id);
      setSavedArtifactBaseline(draft.expectedRevision);
      setDraft(void 0);
      setMode("source");
      onEditingChange(false);
    } catch (error2) {
      setSaveError(error2.code === "REVISION_CONFLICT" ? "\u6587\u6863\u5DF2\u6709\u65B0\u4FEE\u8BA2\uFF0C\u7F16\u8F91\u8349\u7A3F\u5DF2\u4FDD\u7559\u3002\u8BF7\u6BD4\u8F83\u6700\u65B0\u6587\u6863\u540E\u7EE7\u7EED\u7F16\u8F91\u3002" : errorMessage(error2));
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "sf-field", children: [
      "\u5DE5\u7A0B\u6587\u6863",
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("select", { "aria-label": "\u5DE5\u7A0B\u6587\u6863", value: artifact.id, disabled: !!draft || saving || awaitingRevision, onChange: (event) => {
        setChosen(event.target.value);
        setSavedRevisionId("");
      }, children: snapshot.artifacts.map((artifact2) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: artifact2.id, children: logicalLabels[artifact2.logicalId] ?? artifact2.logicalId }, artifact2.id)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-document-heading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { value: accepted ? "accepted" : "candidate" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
        "\u4FEE\u8BA2 ",
        short(revision.id)
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: revision.reviewed ? "\u5DF2\u72EC\u7ACB\u590D\u6838" : "\u5F85\u72EC\u7ACB\u590D\u6838" }),
      !draft && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", disabled: disabled || saving || awaitingRevision, onClick: () => {
        setDraft({ artifactId: artifact.id, expectedRevision: artifact.revision, sourceRevisionId: revision.id, content: revision.content });
        setSaveError("");
        onEditingChange(true);
      }, children: "\u7F16\u8F91\u6587\u6863" })
    ] }),
    awaitingRevision && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-hint", role: "status", children: "\u65B0\u5019\u9009\u6587\u6863\u5DF2\u4FDD\u5B58\uFF0C\u6B63\u5728\u540C\u6B65\u3002\u5B8C\u6210\u72EC\u7ACB\u590D\u6838\u540E\u624D\u80FD\u63A5\u7EB3\u3002" }),
    draft ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("form", { className: "sf-editor sf-document-editor", onSubmit: save, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-section-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u7F16\u8F91\u5B8C\u6574\u6267\u884C\u6587\u6863" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "sf-editor-version", children: [
          "\u57FA\u4E8E ",
          short(draft.sourceRevisionId)
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-hint", children: "\u4EBA\u5DE5\u4FEE\u6539\u4F1A\u751F\u6210\u65B0\u7684\u5019\u9009\u4FEE\u8BA2\uFF0C\u9700\u8981\u91CD\u65B0\u72EC\u7ACB\u590D\u6838\u4E0E\u63A5\u7EB3\u3002" }),
      (conflict || saveError) && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-editor-conflict", role: "alert", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: conflict ? "\u6587\u6863\u5DF2\u6709\u65B0\u4FEE\u8BA2\u3002\u4F60\u7684\u7F16\u8F91\u8349\u7A3F\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u5148\u6BD4\u8F83\u6700\u65B0\u6587\u6863\u3002" : saveError }),
        conflict && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("summary", { children: "\u67E5\u770B\u6700\u65B0\u6587\u6863" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { children: revision.content })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", disabled: saving, onClick: () => {
            setDraft((value) => value && { ...value, expectedRevision: artifact.revision, sourceRevisionId: revision.id });
            setSaveError("");
          }, children: "\u4EE5\u6700\u65B0\u4FEE\u8BA2\u7EE7\u7EED\u7F16\u8F91" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-hint", children: "\u4FDD\u7559\u4F60\u7684\u6B63\u6587\u8349\u7A3F\uFF0C\u5C06\u6700\u65B0\u6587\u6863\u8BBE\u4E3A\u4FDD\u5B58\u57FA\u7EBF\u3002" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "sf-field", htmlFor: editorId, children: [
        "\u6587\u6863 Markdown \u6B63\u6587",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("textarea", { id: editorId, "aria-label": "\u6587\u6863 Markdown \u6B63\u6587", rows: 18, maxLength: 2e6, value: draft.content, disabled: saving, onChange: (event) => setDraft((value) => value && { ...value, content: event.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", disabled: saving, onClick: () => {
          setDraft(void 0);
          setSaveError("");
          onEditingChange(false);
        }, children: "\u53D6\u6D88\u7F16\u8F91\u6587\u6863" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "sf-primary", disabled: disabled || saving || conflict || !draft.content.trim(), children: saving ? "\u6B63\u5728\u4FDD\u5B58\u2026" : "\u4FDD\u5B58\u65B0\u5019\u9009" })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-segmented", "aria-label": "\u6587\u6863\u9605\u8BFB\u65B9\u5F0F", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", "aria-pressed": mode === "reading", onClick: () => setMode("reading"), children: "\u9605\u8BFB\u7B80\u62A5" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", "aria-pressed": mode === "source", onClick: () => setMode("source"), children: "\u5B8C\u6574\u6267\u884C\u6587\u6863" })
      ] }),
      error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-inline-error", children: error }),
      mode === "source" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "sf-document", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(MarkdownView, { content: revision.content, idPrefix: `specflow-${revision.id}` }) }) : reading ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("article", { className: "sf-reading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "sf-eyebrow", children: reading.mode === "authored" ? "\u4EBA\u7C7B\u9605\u8BFB\u7B80\u62A5" : "\u539F\u6587\u6458\u5F55" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: reading.brief.title }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-reading-summary", children: reading.brief.summary }),
        reading.brief.sections.map((section, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h4", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: String(index + 1).padStart(2, "0") }),
            section.title
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { children: section.items.map((item, index2) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("li", { children: item }, index2)) })
        ] }, index)),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "sf-hint", children: [
          "\u63A5\u7EB3\u4EE5\u5B8C\u6574\u6267\u884C\u6587\u6863\u4E3A\u51C6\uFF1B\u672C\u7B80\u62A5\u4E0E\u4FEE\u8BA2 ",
          short(reading.sourceRevisionId),
          " \u5BF9\u5E94\u3002"
        ] })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-loading", children: "\u6B63\u5728\u751F\u6210\u9605\u8BFB\u89C6\u56FE\u2026" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-accept-bar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: accepted ? "\u5F53\u524D\u6587\u6863\u5DF2\u63A5\u7EB3" : revision.reviewed ? "\u590D\u6838\u5DF2\u5B8C\u6210\uFF0C\u53EF\u6838\u5BF9\u5E76\u63A5\u7EB3" : "\u5B8C\u6210\u72EC\u7ACB\u590D\u6838\u540E\u624D\u80FD\u63A5\u7EB3" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "sf-primary", disabled: disabled || awaitingRevision || accepted || !revision.reviewed, onClick: () => run("acceptArtifact", artifact.id, { expectedRevision: artifact.revision, reason: "\u5728 DSH Specflow \u9762\u677F\u4E2D\u6838\u5BF9\u5E76\u63A5\u7EB3" }), children: accepted ? "\u5DF2\u63A5\u7EB3" : "\u63A5\u7EB3\u6B64\u4FEE\u8BA2" })
      ] })
    ] }),
    snapshot.findings.filter((finding) => finding.status === "open" && finding.targetLogicalId === artifact.logicalId).map((finding) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-finding", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { value: "blocked", children: finding.severity === "blocker" ? "\u963B\u65AD\u9879" : "\u590D\u6838\u5EFA\u8BAE" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: finding.body }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: finding.location })
    ] }, finding.id))
  ] });
}
function Code({ snapshot, read, run, disabled, visible }) {
  const candidate = snapshot.candidates.at(-1);
  const [diff, setDiff] = (0, import_react2.useState)(), [precheck, setPrecheck] = (0, import_react2.useState)(), [error, setError] = (0, import_react2.useState)("");
  const [acknowledged, setAcknowledged] = (0, import_react2.useState)(false);
  const key = `${candidate?.id}:${candidate?.revision}:${snapshot.evidence.map((evidence) => evidence.revision).join(",")}:${snapshot.findings.map((finding) => finding.revision).join(",")}`;
  (0, import_react2.useEffect)(() => {
    setDiff(void 0);
    setPrecheck(void 0);
    setError("");
    setAcknowledged(false);
    if (!candidate || !visible) return;
    const controller = new AbortController();
    void Promise.all([read({ resource: "candidateDiff", id: candidate.id }, controller.signal), read({ resource: "acceptancePrecheck", id: candidate.id }, controller.signal)]).then(([result, check]) => {
      if (!controller.signal.aborted) {
        setDiff({ candidateId: candidate.id, text: result.diff });
        setPrecheck(check);
      }
    }).catch((error2) => {
      if (!controller.signal.aborted) setError(errorMessage(error2));
    });
    return () => controller.abort();
  }, [read, key, visible]);
  if (!candidate) return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Empty, { title: "\u7B49\u5F85\u4EE3\u7801\u5019\u9009", children: "\u5B9E\u73B0\u9636\u6BB5\u4F1A\u5728\u72EC\u7ACB\u5DE5\u4F5C\u533A\u4E2D\u4FEE\u6539\u4EE3\u7801\uFF0C\u9A8C\u8BC1\u4E0E\u590D\u6838\u8BB0\u5F55\u4F1A\u4FDD\u5B58\u5728\u8FD9\u91CC\u3002" });
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-section-heading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u4EE3\u7801\u5019\u9009" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { value: candidate.status })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("dl", { className: "sf-facts", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dt", { children: "\u57FA\u7EBF" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: short(candidate.baseCommit) }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dt", { children: "\u5019\u9009" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: short(candidate.checkpointCommit) }) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { className: "sf-path", children: candidate.workspace }),
    error && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-inline-error", children: error }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { open: true, className: "sf-details", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("summary", { children: "\u4EE3\u7801\u5DEE\u5F02" }),
      diff?.candidateId === candidate.id ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { className: "sf-diff", children: diff.text || "\u5F53\u524D\u5019\u9009\u6CA1\u6709\u6587\u672C\u5DEE\u5F02\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-loading", children: "\u6B63\u5728\u8BFB\u53D6\u4EE3\u7801\u5DEE\u5F02\u2026" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h4", { className: "sf-subheading", children: "\u9A8C\u8BC1\u8BC1\u636E" }),
    snapshot.evidence.filter((evidence) => evidence.candidateId === candidate.id).map((evidence) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { className: "sf-evidence", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("summary", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { value: evidence.status }),
        evidence.command.id,
        evidence.stale && " \xB7 \u5DF2\u8FC7\u671F"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { children: [evidence.stdout, evidence.stderr].filter(Boolean).join("\n") || `\u9000\u51FA\u7801 ${evidence.exitCode}` })
    ] }, evidence.id)),
    precheck?.blockers.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { className: "sf-blockers", children: precheck.blockers.map((blocker) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("li", { children: blocker.message }, blocker.code)) }) : null,
    candidate.status !== "accepted" && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "sf-checkbox", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "checkbox", checked: acknowledged, onChange: (event) => setAcknowledged(event.target.checked), disabled: !diff || disabled }),
        "\u6211\u5DF2\u6838\u5BF9\u4EE3\u7801\u5DEE\u5F02\u4E0E\u9A8C\u8BC1\u8BC1\u636E\uFF0C\u786E\u8BA4\u5C06\u5019\u9009\u6574\u5408\u5230\u5DE5\u7A0B"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", disabled, onClick: () => run("verifyCandidate", candidate.id), children: "\u8FD0\u884C\u9A8C\u8BC1" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "sf-primary", disabled: disabled || !precheck?.ready || !acknowledged || !diff, onClick: () => run("acceptCode", candidate.id), children: "\u63A5\u7EB3\u4EE3\u7801" })
      ] })
    ] })
  ] });
}
function Runs({ snapshot, bootstrap, read, run, disabled, visible }) {
  const [chosen, setChosen] = (0, import_react2.useState)(""), [detail, setDetail] = (0, import_react2.useState)(), [error, setError] = (0, import_react2.useState)("");
  const attempt = snapshot.attempts.find((attempt2) => attempt2.id === chosen) ?? snapshot.attempts.at(-1);
  (0, import_react2.useEffect)(() => {
    setDetail(void 0);
    setError("");
    if (!attempt || !visible) return;
    const controller = new AbortController();
    void read({ resource: "attempt", id: attempt.id }, controller.signal).then((value) => {
      if (!controller.signal.aborted) setDetail(value);
    }).catch((error2) => {
      if (!controller.signal.aborted) setError(errorMessage(error2));
    });
    return () => controller.abort();
  }, [read, attempt?.id, attempt?.revision, visible]);
  if (!attempt) return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Empty, { title: "\u8FD0\u884C\u8BB0\u5F55\u4ECE\u9996\u6B21\u6D3E\u53D1\u5F00\u59CB", children: "\u6BCF\u6B21\u5C1D\u8BD5\u4FDD\u7559\u539F\u59CB\u6A21\u578B\u3001\u6267\u884C\u5E95\u5EA7\u3001\u7ED3\u679C\u548C\u9519\u8BEF\uFF0C\u65B9\u4FBF\u5B9A\u4F4D\u95EE\u9898\u3002" });
  const binding = snapshot.bindings.filter((binding2) => binding2.attemptId === attempt.id).at(-1);
  const canResume = !!bootstrap.catalog.backends.find((backend) => backend.id === attempt.target.backend)?.capabilities.canResume;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: "sf-field", children: [
      "\u6267\u884C\u5C1D\u8BD5",
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("select", { value: attempt.id, onChange: (event) => setChosen(event.target.value), children: [...snapshot.attempts].reverse().map((attempt2) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("option", { value: attempt2.id, children: [
        snapshot.nodes.find((node) => node.id === attempt2.nodeRunId)?.name,
        " \xB7 #",
        attempt2.number,
        " \xB7 ",
        labels[attempt2.execution]
      ] }, attempt2.id)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "sf-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-section-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("h3", { children: [
          "\u5C1D\u8BD5 #",
          attempt.number
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Badge, { value: attempt.execution })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("dl", { className: "sf-run-facts", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dt", { children: "\u6267\u884C\u5E95\u5EA7" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dd", { children: attempt.target.backend })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dt", { children: "\u8FDE\u63A5 / \u6A21\u578B" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("dd", { children: [
            attempt.target.connectionSlug,
            " / ",
            attempt.target.model
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dt", { children: "\u542F\u52A8\u65F6\u95F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dd", { children: time(attempt.startedAt) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dt", { children: "\u7ED3\u675F\u65F6\u95F4" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dd", { children: time(attempt.finishedAt) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dt", { children: "\u6267\u884C\u4F1A\u8BDD" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("code", { children: binding?.ref.sessionId ?? "\u5C1A\u672A\u7ED1\u5B9A" }) })
        ] })
      ] }),
      (detail?.error || attempt.error || error) && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-inline-error", children: detail?.error || attempt.error || error }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "sf-actions", children: [
        activeStates.includes(attempt.execution) && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "sf-stop", disabled, onClick: () => run("stopAttempt", attempt.id), children: "\u505C\u6B62" }),
        attempt.execution === "reconciling" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", disabled, onClick: () => run("reconcileAttempt", attempt.id), children: "\u6838\u5BF9\u6267\u884C\u7ED3\u679C" }),
        canResume && ["failed", "cancelled"].includes(attempt.execution) && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", disabled, onClick: () => run("resumeAttempt", attempt.id), children: "\u5C1D\u8BD5\u6062\u590D\u539F\u6267\u884C" })
      ] }),
      !canResume && ["failed", "cancelled"].includes(attempt.execution) && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "sf-hint", children: "\u539F\u6267\u884C\u4E0D\u652F\u6301\u6062\u590D\u3002\u6838\u5BF9\u7ED3\u679C\u540E\uFF0C\u53EF\u5728\u6D41\u7A0B\u4E2D\u91CD\u65B0\u6267\u884C\u6B64\u6B65\u9AA4\u3002" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { className: "sf-details", open: true, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("summary", { children: "\u8FD0\u884C\u8F93\u51FA" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { children: detail?.output ?? "\u5F53\u524D\u6CA1\u6709\u5DF2\u6301\u4E45\u5316\u7684\u8F93\u51FA\u3002" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { className: "sf-details", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("summary", { children: "\u539F\u59CB\u6267\u884C\u63D0\u793A" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { children: detail?.prompt ?? "\u6B63\u5728\u8BFB\u53D6\u2026" })
    ] })
  ] });
}
function InteractionCard({ id, request, command, disabled }) {
  const prefix = (0, import_react2.useId)(), [answer, setAnswer] = (0, import_react2.useState)("");
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("form", { className: "sf-card sf-clarification", onSubmit: (event) => {
    event.preventDefault();
    let value = answer;
    try {
      value = JSON.parse(answer);
    } catch {
    }
    void command("answerInteraction", id, { answer: value }).catch(() => {
    });
  }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u8FD0\u884C\u6B63\u5728\u7B49\u5F85\u4F60\u7684\u56DE\u7B54" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { children: typeof request === "string" ? request : JSON.stringify(request, null, 2) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { htmlFor: prefix, children: "\u56DE\u7B54\uFF08\u6587\u672C\u6216 JSON\uFF09" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("textarea", { id: prefix, rows: 3, value: answer, onChange: (event) => setAnswer(event.target.value), required: true, disabled }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "sf-actions", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { className: "sf-primary", disabled: disabled || !answer.trim(), children: "\u63D0\u4EA4\u7ED9\u5F53\u524D\u8FD0\u884C" }) })
  ] });
}

return module.exports;
} });
