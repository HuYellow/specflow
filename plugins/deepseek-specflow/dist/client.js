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

// apps/web/src/i18n.ts
var import_react = require("react");

// packages/i18n/web-shell.ts
var messages = {
  "SpecFlow \xB7 \u5DE5\u7A0B\u5DE5\u4F5C\u53F0": "SpecFlow \xB7 Engineering Workbench",
  "\u754C\u9762\u8BED\u8A00": "Interface language",
  "\u751F\u6210\u5185\u5BB9\u8BED\u8A00": "Generated content language",
  "\u65B0\u8FD0\u884C\u4F7F\u7528\u6B64\u8BED\u8A00\u751F\u6210\u6587\u6863\u3001\u7B80\u62A5\u548C\u95EE\u9898\u3002\u5DF2\u6709\u8FD0\u884C\u4E0E\u7528\u6237\u539F\u6587\u4FDD\u7559\u539F\u6837\u3002": "New runs use this language for documents, briefs, and questions. Existing runs and user content retain their original text.",
  "\u65E0\u6CD5\u4FDD\u5B58\u8BED\u8A00\u8BBE\u7F6E\uFF0C\u8BF7\u91CD\u8BD5\u3002": "Could not save the language preference. Please try again.",
  "\u5F00\u53D1\u6D41\u7A0B": "Workflow",
  "\u9700\u6C42\u8F93\u5165": "Requirements",
  "\u6587\u6863\u4EA7\u7269": "Documents",
  "\u4EE3\u7801\u4E0E\u9A8C\u8BC1": "Code and verification",
  "\u8FD0\u884C\u8BB0\u5F55": "Run history",
  "\u5F53\u524D\u9605\u8BFB\u4F4D\u7F6E\u672A\u80FD\u4FDD\u5B58\u5230\u684C\u9762\uFF0C\u4E0B\u6B21\u91CD\u542F\u53EF\u80FD\u9700\u8981\u91CD\u65B0\u5B9A\u4F4D\u3002": "Could not save your reading position. You may need to find it again after restarting.",
  "\u5DE5\u4F5C\u9879\u4E0E\u6240\u9009\u5DE5\u4F5C\u7A7A\u95F4\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u91CD\u65B0\u8BFB\u53D6\u3002": "The work item does not belong to the selected workspace. Reload the workspace.",
  "\u90E8\u5206\u5B9A\u4F4D\u5BF9\u8C61\u5DF2\u5931\u6548\uFF0C\u5DF2\u8FD4\u56DE\u5F53\u524D\u53EF\u7528\u5185\u5BB9\u3002": "Some saved locations are no longer available. Showing the current available content.",
  "\u64CD\u4F5C\u5DF2\u5B8C\u6210\uFF0C\u4F46\u72B6\u6001\u540C\u6B65\u5931\u8D25\u3002\u8BF7\u5237\u65B0\u6838\u5BF9\u5DE5\u7A0B\u8BB0\u5F55\u3002": "The operation completed, but synchronization failed. Refresh to check the engineering records.",
  "\u8DF3\u5230\u4E3B\u5185\u5BB9": "Skip to main content",
  "\u5DE5\u7A0B\u5BFC\u822A": "Workspace navigation",
  "\u5173\u95ED\u5DE5\u7A0B\u5BFC\u822A": "Close workspace navigation",
  "SpecFlow \u9996\u9875": "SpecFlow home",
  "\u5DE5\u7A0B\u5DE5\u4F5C\u7A7A\u95F4": "Engineering workspace",
  "\u6253\u5F00 Git \u4ED3\u5E93": "Open Git repository",
  "\u6253\u5F00 Git \u4ED3\u5E93\uFF0C\u6DFB\u52A0\u5DE5\u4F5C\u7A7A\u95F4": "Open a Git repository to add a workspace",
  "\u5DE5\u4F5C\u9879": "Work items",
  "\u65B0\u5EFA\u5DE5\u4F5C\u9879": "New work item",
  "\u641C\u7D22\u5F53\u524D\u7A7A\u95F4\u5DE5\u4F5C\u9879": "Search work items in this workspace",
  "\u641C\u7D22\u5DE5\u4F5C\u9879": "Search work items",
  "\u5F53\u524D\u7A7A\u95F4\u7684\u5DE5\u4F5C\u9879": "Work items in this workspace",
  "\u672A\u627E\u5230\u5339\u914D\u7684\u5DE5\u4F5C\u9879": "No matching work items",
  "\u5F53\u524D\u7A7A\u95F4\u6682\u65E0\u5DE5\u4F5C\u9879": "No work items in this workspace",
  "\u6B63\u5728\u8BFB\u53D6\u5DE5\u4F5C\u9879\u2026": "Loading work items\u2026",
  "\u5DE5\u7A0B\u4EA7\u7269": "Artifacts",
  "\u5F53\u524D\u5DE5\u4F5C\u9879\u7684\u5DE5\u7A0B\u4EA7\u7269": "Artifacts for this work item",
  "\u6B64\u5DE5\u4F5C\u9879\u5C1A\u65E0\u5DE5\u7A0B\u4EA7\u7269": "This work item has no artifacts yet",
  "\u9009\u62E9\u5DE5\u4F5C\u9879\u540E\u67E5\u770B\u4EA7\u7269": "Select a work item to view its artifacts",
  "\u72B6\u6001\u672A\u77E5": "Status unknown",
  "\u53EF\u7528": "Available",
  "\u4E0D\u53EF\u7528": "Unavailable",
  "\u5DE5\u7A0B\u8BBE\u7F6E": "Project settings",
  "\u5173\u95ED\u5DE5\u7A0B\u5BFC\u822A\u906E\u7F69": "Dismiss workspace navigation",
  "\u5C55\u5F00\u5DE5\u7A0B\u5BFC\u822A": "Open workspace navigation",
  "\u5DE5\u4F5C\u7A7A\u95F4": "Workspace",
  "\u7F3A\u9677\u4FEE\u590D": "Bug fix",
  "\u529F\u80FD\u5F00\u53D1": "Feature development",
  "\u4E8B\u4EF6\u8FDE\u63A5\uFF1B\u6700\u540E\u6210\u529F\u540C\u6B65 {0}": "Event connection; last successful sync {0}",
  "\u4E8B\u4EF6\u5DF2\u8FDE\u63A5": "Events connected",
  "\u8FDE\u63A5\u4E8B\u4EF6\u4E2D": "Connecting events",
  "\u4E8B\u4EF6\u91CD\u8FDE\u4E2D": "Reconnecting events",
  "\u5237\u65B0": "Refresh",
  "\u9700\u6C42\u4E0E\u57FA\u7EBF": "Requirements and baseline",
  "\u5B8C\u6574\u9700\u6C42\u89C1\u300C\u9700\u6C42\u8F93\u5165\u300D\u4E2D\u7684\u6587\u6863\u3002": "See Requirements for the complete requirement documents.",
  "\u57FA\u7EBF {0}": "Baseline {0}",
  "\u5DF2\u4EA4\u4ED8": "Delivered",
  "\u8FDB\u884C\u4E2D": "In progress",
  "\u5F85\u5904\u7406 {0} \u9879": "{0} pending items",
  "\u5F85\u5904\u7406": "Pending",
  "\u66F4\u591A\u5DE5\u4F5C\u9879\u64CD\u4F5C": "More work item actions",
  "\u5BFC\u51FA\u5DE5\u7A0B\u8BB0\u5F55": "Export engineering records",
  "\u9694\u79BB\u9A8C\u6536\u9879\u76EE": "Isolated demo project",
  "\u72EC\u7ACB\u5DE5\u4F5C\u533A\u5185\u6267\u884C\u771F\u5B9E\u6587\u4EF6\u4FEE\u6539\u4E0E\u6D4B\u8BD5": "Runs real file changes and tests in an isolated workspace",
  "\u4E0D\u8C03\u7528\u6A21\u578B API": "No model API calls",
  "\u8BFB\u53D6\u66F4\u65B0\u5931\u8D25\uFF1A": "Could not load updates: ",
  "\u91CD\u65B0\u540C\u6B65": "Sync again",
  "\u6709 {count} \u4E2A\u5199\u5165\u7684\u7ED3\u679C\u5F85\u786E\u8BA4\uFF0C\u76F8\u5173\u64CD\u4F5C\u5DF2\u9501\u5B9A\u3002\u8BF7\u5148\u5237\u65B0\u67E5\u770B\u5DE5\u7A0B\u8BB0\u5F55\uFF0C\u907F\u514D\u91CD\u590D\u6D3E\u53D1\u3002": "{count} writes need confirmation. Related actions are locked. Refresh and check the engineering records before submitting again.",
  "\u5237\u65B0\u6838\u5BF9\u8BB0\u5F55": "Refresh and check records",
  "\u5DF2\u6838\u5BF9\u7ED3\u679C\uFF0C\u89E3\u9664\u9501\u5B9A": "Results checked, unlock actions",
  "\u5DE5\u4F5C\u9879\u89C6\u56FE": "Work item views",
  "\u6700\u540E\u6210\u529F\u540C\u6B65 {0}": "Last successful sync {0}",
  "\u6B63\u5728\u540C\u6B65": "Syncing",
  "\u540C\u6B65\u5931\u8D25": "Sync failed",
  "\u540C\u6B65\u4E8E {0}": "Synced at {0}",
  "\u65E0\u6CD5\u8BFB\u53D6\u5DE5\u7A0B\u6570\u636E": "Could not load engineering data",
  "\u6B63\u5728\u52A0\u8F7D\u5DE5\u4F5C\u7A7A\u95F4": "Loading workspace",
  "\u6253\u5F00\u4E00\u4E2A\u5DE5\u7A0B\u5DE5\u4F5C\u7A7A\u95F4": "Open an engineering workspace",
  "\u6BCF\u4E2A\u7A7A\u95F4\u5BF9\u5E94\u4E00\u4E2A\u9879\u76EE\u76EE\u5F55": "Each workspace corresponds to a project directory",
  "\u8BF7\u91CD\u8BD5\u52A0\u8F7D": "Please try loading again",
  "\u6B63\u5728\u8BFB\u53D6\u672C\u5730\u5DE5\u7A0B\u6570\u636E\u2026": "Loading local engineering data\u2026",
  "\u8BE5\u5DE5\u4F5C\u7A7A\u95F4\u8FD8\u6CA1\u6709\u5DE5\u4F5C\u9879": "This workspace has no work items yet",
  "\u4ECE Git \u9879\u76EE\u76EE\u5F55\u5F00\u59CB": "Start with a Git project directory",
  "\u5728\u5DE5\u4F5C\u7A7A\u95F4\u4E2D\u7BA1\u7406\u6BCF\u4E2A\u5DE5\u4F5C\u9879\u7684\u9700\u6C42\u3001\u6D41\u7A0B\u3001\u4EE3\u7801\u548C\u4EA7\u7269\u3002": "Manage requirements, workflows, code, and artifacts for each work item in a workspace.",
  "\u91CD\u8BD5\u52A0\u8F7D": "Try again",
  "\u91CD\u65B0\u8BFB\u53D6\u5DE5\u4F5C\u9879": "Reload work item",
  "\u5728\u6B64\u7A7A\u95F4\u65B0\u5EFA\u5DE5\u4F5C\u9879": "Create a work item here",
  "\u7A7A\u95F4 \u2192 \u5DE5\u4F5C\u9879 \u2192 \u5DE5\u7A0B\u4EA7\u7269": "Workspace \u2192 Work item \u2192 Artifacts",
  "SpecFlow \xB7 \u5DE5\u7A0B\u63A7\u5236\u5C42": "SpecFlow \xB7 Engineering control layer",
  "\u5173\u95ED\u901A\u77E5": "Dismiss notification",
  "\u5F85\u5904\u7406\u4E8B\u9879 \xB7 {0}": "Pending items \xB7 {0}",
  "\u672C\u6B21\u8FD0\u884C": "This run",
  "\u6267\u884C\u4EA4\u4E92": "Runtime interaction",
  "\u590D\u6838\u53D1\u73B0": "Review finding",
  "\u6587\u6863\u5BA1\u9605": "Document review",
  "\u4F9D\u636E\u5DF2\u53D8\u66F4\uFF0C\u5148\u67E5\u770B\u539F\u59CB\u6750\u6599": "The source has changed. Review the original material first.",
  "\u5F53\u524D\u6CA1\u6709\u5F85\u5904\u7406\u4E8B\u9879": "No pending items",
  "\u540E\u7EED\u95EE\u9898\u3001\u6388\u6743\u548C\u5F85\u5BA1\u9605\u4EA7\u7269\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002": "Questions, permission requests, and artifacts awaiting review will appear here.",
  "\u5F85\u6267\u884C": "Pending",
  "\u542F\u52A8\u4E2D": "Starting",
  "\u6267\u884C\u4E2D": "Running",
  "\u7B49\u5F85\u56DE\u7B54": "Awaiting answers",
  "\u6267\u884C\u5DF2\u7ED3\u675F": "Completed",
  "\u6267\u884C\u5931\u8D25": "Failed",
  "\u5DF2\u505C\u6B62": "Stopped",
  "\u5F85\u6838\u5BF9": "Needs reconciliation",
  "\u5DF2\u901A\u8FC7": "Passed",
  "\u963B\u585E": "Blocked",
  "\u5DF2\u8FC7\u671F": "Stale",
  "\u5DF2\u63A5\u7EB3": "Accepted",
  "\u5F85\u68C0\u67E5": "Unchecked",
  "\u5019\u9009": "Candidate",
  "\u6D4B\u8BD5\u901A\u8FC7\xB7\u5F85\u590D\u6838": "Tests passed \xB7 Review pending",
  "\u5DF2\u9A8C\u8BC1": "Verified",
  "\u672A\u89E3\u51B3": "Open",
  "\u5DF2\u89E3\u51B3": "Resolved",
  "\u5DF2\u8BB0\u5F55\u4F8B\u5916": "Exception recorded",
  "\u65E0\u6CD5\u8FDE\u63A5\u672C\u5730\u670D\u52A1\uFF0C\u8BF7\u786E\u8BA4\u670D\u52A1\u5DF2\u542F\u52A8\u540E\u91CD\u8BD5\u3002": "Could not connect to the local service. Check that it is running and try again.",
  "\u5199\u5165\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u5148\u5237\u65B0\u6838\u5BF9\u5DE5\u7A0B\u8BB0\u5F55\uFF0C\u907F\u514D\u91CD\u590D\u6D3E\u53D1\u3002": "The write result is unconfirmed. Refresh and check the engineering records before submitting again.",
  "\u672C\u5730\u670D\u52A1\u8FD4\u56DE\u4E86\u65E0\u6CD5\u8BFB\u53D6\u7684\u54CD\u5E94\uFF0C\u8BF7\u5237\u65B0\u91CD\u8BD5\u3002": "The local service returned an unreadable response. Refresh and try again.",
  "\u672C\u6B21\u5199\u5165\u7684\u54CD\u5E94\u65E0\u6CD5\u8BFB\u53D6\uFF0C\u8BF7\u5148\u5237\u65B0\u6838\u5BF9\u7ED3\u679C\u3002": "The write response could not be read. Refresh to check the result first.",
  "\u670D\u52A1\u7AEF\u5199\u5165\u54CD\u5E94\u5F02\u5E38": "The service returned an invalid write response",
  "{0}\uFF1B\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u5148\u6838\u5BF9\u5DE5\u7A0B\u8BB0\u5F55\u3002": "{0}; the result is unconfirmed. Check the engineering records first."
};

// packages/i18n/web-documents.ts
var messages2 = {
  "\u6253\u5F00 Git \u4ED3\u5E93": "Open Git repository",
  "\u65B0\u5EFA\u5DE5\u7A0B\u5DE5\u4F5C\u9879": "Create work item",
  "\u7EC4\u5408\u5DE5\u7A0B\u6D41\u7A0B": "Compose workflow",
  "\u5DE5\u7A0B\u8BBE\u7F6E": "Project settings",
  "\u5BFC\u5165\u5DF2\u6709\u6587\u6863": "Import existing documents",
  "\u5173\u95ED\u5BF9\u8BDD\u6846": "Close dialog",
  "\u4ED3\u5E93\u7EDD\u5BF9\u8DEF\u5F84": "Absolute repository path",
  "\u9009\u62E9\u4ED3\u5E93\u6587\u4EF6\u5939": "Choose repository folder",
  "\u6CE8\u518C\u540E\u521B\u5EFA\u5DE5\u4F5C\u9879\u3002\u5DE5\u4F5C\u9879\u4F7F\u7528\u72EC\u7ACB\u5206\u652F\uFF0C\u73B0\u6709\u672A\u63D0\u4EA4\u6539\u52A8\u4F1A\u88AB\u4FDD\u7559\u3002": "Register the repository to create a work item. Work items use separate branches and preserve existing uncommitted changes.",
  "\u4ED3\u5E93\u5DF2\u6CE8\u518C": "Repository registered",
  "\u6CE8\u518C\u9879\u76EE": "Register project",
  "\u5DE5\u4F5C\u9879\u540D\u79F0": "Work item name",
  "\u4F8B\u5982\uFF1A\u589E\u52A0\u6587\u4EF6\u5BFC\u5165\u529F\u80FD": "For example: Add file import",
  "\u9700\u6C42\u6B63\u6587": "Requirements",
  "\u63CF\u8FF0\u7528\u6237\u9700\u8981\u4EC0\u4E48\uFF0C\u4EE5\u53CA\u5FC5\u987B\u6EE1\u8DB3\u7684\u9A8C\u6536\u6761\u4EF6\uFF1B\u4E5F\u53EF\u4EE5\u901A\u8FC7\u9700\u6C42\u6587\u6863\u63D0\u4F9B\u3002": "Describe what users need and the required acceptance criteria. You can also attach requirements documents.",
  "\u521B\u5EFA\u5DE5\u4F5C\u9879": "Create work item",
  "\u4EA7\u7269\u7C7B\u578B": "Artifact type",
  "Markdown \u5185\u5BB9": "Markdown content",
  "\u7C98\u8D34\u5DF2\u6709\u6587\u6863\uFF0C\u5BFC\u5165\u540E\u9700\u8981\u91CD\u65B0\u590D\u6838\u4E0E\u63A5\u7EB3\u3002": "Paste an existing document. Imported content must be reviewed and accepted again.",
  "\u6587\u6863\u5DF2\u5BFC\u5165\u4E3A\u5019\u9009\u7248\u672C": "Document imported as a candidate revision",
  "\u5BFC\u5165\u5019\u9009\u4EA7\u7269": "Import candidate artifact",
  "\u6267\u884C\u5E95\u5EA7": "Execution harness",
  "\u5F53\u524D\u5DE5\u7A0B\u4F7F\u7528": "Harness for this project",
  "\u4FDD\u5B58\u540E\uFF0C\u65B0\u5C1D\u8BD5\u4F7F\u7528\u6240\u9009\u5E95\u5EA7\u3002\u5207\u6362\u65F6\u6E05\u9664\u5176\u4ED6\u5E95\u5EA7\u7684\u89D2\u8272\u9ED8\u8BA4\u6A21\u578B\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u5E76\u4FDD\u5B58\uFF1B\u8FD0\u884C\u8BB0\u5F55\u4FDD\u7559\u539F\u5E95\u5EA7\u3002": "New attempts use the selected harness after saving. Switching clears role defaults from other harnesses; select models again and save. Run records retain their original harness.",
  "\u72B6\u6001\u672A\u77E5": "Status unknown",
  "\u53EF\u7528": "Available",
  "\u4E0D\u53EF\u7528": "Unavailable",
  "\u793A\u4F8B\u5E95\u5EA7\u4EC5\u7528\u4E8E\u4F53\u9A8C\u5DE5\u7A0B\u6D41\u7A0B\uFF0C\u4E0D\u8C03\u7528\u771F\u5B9E\u6A21\u578B\u3002": "The demo harness lets you explore the workflow without calling real models.",
  "\u6A21\u578B\u76EE\u5F55\u5DF2\u5237\u65B0": "Model catalog refreshed",
  "\u5237\u65B0\u6A21\u578B\u76EE\u5F55": "Refresh model catalog",
  "\u6DFB\u52A0 Maka \u8FDE\u63A5": "Add Maka connection",
  "\u5F53\u524D\u5C1A\u65E0 Maka \u6A21\u578B\u8FDE\u63A5\u3002\u6DFB\u52A0\u8FDE\u63A5\u540E\u5373\u53EF\u4E3A\u5404\u89D2\u8272\u9009\u62E9\u6A21\u578B\u3002": "No Maka model connections are configured. Add a connection to select models for each role.",
  "OpenCode \u5C1A\u65E0\u53EF\u7528\u6A21\u578B\uFF0C\u8BF7\u5148\u5728 OpenCode \u4E2D\u914D\u7F6E\u4F9B\u5E94\u5546\uFF0C\u518D\u5237\u65B0\u6A21\u578B\u76EE\u5F55\u3002": "OpenCode has no available models. Configure a provider in OpenCode, then refresh the model catalog.",
  "\u8FDE\u63A5\u540D\u79F0": "Connection name",
  "\u6211\u7684\u6A21\u578B\u670D\u52A1": "My model service",
  "\u8FDE\u63A5\u6807\u8BC6": "Connection ID",
  "\u4F9B\u5E94\u5546": "Provider",
  "\u81EA\u5B9A\u4E49\u517C\u5BB9 API / \u672C\u5730\u6A21\u578B": "Custom compatible API / local model",
  "\u63A5\u53E3\u534F\u8BAE": "API protocol",
  "\u670D\u52A1\u7AEF\u70B9": "Service endpoint",
  "https://example.com/v1\uFF1B\u6807\u51C6\u4F9B\u5E94\u5546\u53EF\u7559\u7A7A": "https://example.com/v1; optional for standard providers",
  "\u6A21\u578B ID": "Model IDs",
  "\u591A\u4E2A\u6A21\u578B\u7528\u9017\u53F7\u5206\u9694": "Separate multiple models with commas",
  "API \u5BC6\u94A5": "API key",
  "\u51ED\u636E\u7531\u672C\u673A Maka \u4FDD\u5B58": "Credentials are stored locally by Maka",
  "\u8FDE\u63A5\u5DF2\u4FDD\u5B58\u81F3 Maka\uFF1B\u8BF7\u5148\u8FD0\u884C\u4E00\u6B21\u63A5\u5165\u9A8C\u8BC1": "Connection saved to Maka. Run a connection check before use.",
  "\u4FDD\u5B58\u8FDE\u63A5": "Save connection",
  "\u89D2\u8272\u9ED8\u8BA4\u6A21\u578B": "Default models by role",
  "\u7684\u6A21\u578B\u7528\u4E8E\u540E\u7EED\u65B0\u5C1D\u8BD5\u3002": " models are used for new attempts.",
  "{backend} \u7684\u6A21\u578B\u7528\u4E8E\u540E\u7EED\u65B0\u5C1D\u8BD5\u3002": "Models from {backend} are used for new attempts.",
  "\u9700\u6C42\u5206\u6790": "Requirements analysis",
  "\u5DE5\u7A0B\u8BBE\u8BA1": "Engineering design",
  "\u4EE3\u7801\u5B9E\u73B0": "Implementation",
  "\u72EC\u7ACB\u590D\u6838": "Independent review",
  "\u5C1A\u672A\u914D\u7F6E": "Not configured",
  "\u9879\u76EE\u7AE0\u7A0B\u4E0E\u5DE5\u7A0B\u89C4\u5219": "Project constitution and engineering rules",
  "\u8865\u5145\u5DE5\u7A0B\u89C4\u5219": "Additional engineering rules",
  "\u786E\u5B9A\u6027\u9A8C\u8BC1\u547D\u4EE4 \xB7 \u9AD8\u7EA7": "Deterministic verification commands \xB7 Advanced",
  "\u4F7F\u7528\u73B0\u6709\u9879\u76EE\u547D\u4EE4\u7684 JSON \u914D\u7F6E\uFF0C\u6309\u5B9E\u9645\u9000\u51FA\u7801\u8BB0\u5F55\u8BC1\u636E\u3002": "Configure existing project commands as JSON. Evidence records their actual exit codes.",
  "\u786E\u5B9A\u6027\u9A8C\u8BC1\u547D\u4EE4": "Deterministic verification commands",
  "\u5DE5\u7A0B\u914D\u7F6E\u5DF2\u4FDD\u5B58\uFF1B\u65B0\u5C1D\u8BD5\u4F7F\u7528\u66F4\u65B0\u540E\u7684\u914D\u7F6E": "Project settings saved. New attempts use the updated configuration.",
  "\u4FDD\u5B58\u5DE5\u7A0B\u8BBE\u7F6E": "Save project settings",
  "\u7F16\u8F91\u521B\u5EFA\u65B0\u6D41\u7A0B\u7248\u672C\u3002\u5DF2\u542F\u52A8\u8FD0\u884C\u4FDD\u7559\u539F\u5B9A\u4E49\u3002": "Editing creates a new workflow version. Existing runs retain their original definition.",
  "\u6D41\u7A0B\u540D\u79F0": "Workflow name",
  "\u4E0A\u79FB {value0}": "Move {value0} up",
  "\u4E0B\u79FB {value0}": "Move {value0} down",
  "\u6B65\u9AA4 {value0} \u540D\u79F0": "Step {value0} name",
  "\u6B65\u9AA4 {value0} \u7C7B\u578B": "Step {value0} type",
  "\u6B65\u9AA4 {value0} \u89D2\u8272": "Step {value0} role",
  "\u65E0\u6A21\u578B\u89D2\u8272": "No model role",
  "\u6B65\u9AA4 {value0} \u8F93\u5165": "Step {value0} inputs",
  "\u8F93\u5165\uFF0C\u4EE5\u9017\u53F7\u5206\u9694": "Inputs, separated by commas",
  "\u6B65\u9AA4 {value0} \u8F93\u51FA": "Step {value0} outputs",
  "\u8F93\u51FA\u4EA7\u7269": "Output artifacts",
  "\u6B65\u9AA4 {value0} \u6307\u4EE4": "Step {value0} instructions",
  "\u5220\u9664 {value0}": "Delete {value0}",
  "\u65B0\u5DE5\u7A0B\u6B65\u9AA4": "New engineering step",
  "\u63CF\u8FF0\u8FD9\u4E2A\u6B65\u9AA4\u7684\u6267\u884C\u76EE\u6807\u3002": "Describe the goal of this step.",
  "\u6DFB\u52A0\u6B65\u9AA4": "Add step",
  "\u6821\u9A8C\u6D41\u7A0B": "Validate workflow",
  "\u65B0\u6D41\u7A0B\u7248\u672C\u5DF2\u4FDD\u5B58\u5E76\u521B\u5EFA\u65B0\u8FD0\u884C": "Workflow version saved and a new run created",
  "\u4FDD\u5B58\u5E76\u521B\u5EFA\u65B0\u8FD0\u884C": "Save and create new run",
  "\u7B80\u62A5\u4E0E\u9009\u5B9A\u6587\u6863\u7248\u672C\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u91CD\u65B0\u8F7D\u5165\u3002": "The brief does not match the selected document revision. Reload it.",
  "\u65E0\u6CD5\u8F7D\u5165\u7B80\u62A5\uFF0C\u8BF7\u91CD\u8BD5\u3002": "Unable to load the brief. Try again.",
  "\u5DF2\u4FDD\u5B58\u65B0\u5019\u9009\u7248\u672C\uFF0C\u9700\u8981\u91CD\u65B0\u590D\u6838": "New candidate revision saved. A new review is required.",
  "\u5F53\u524D\u67E5\u770B\u5386\u53F2\u7248\u672C\uFF0C\u8BF7\u9009\u62E9\u5F53\u524D\u5019\u9009\u3002": "You are viewing a historical revision. Select the current candidate.",
  "\u672C\u5730\u8349\u7A3F\u4E0E\u670D\u52A1\u5668\u7248\u672C\u51B2\u7A81\uFF0C\u8BF7\u5148\u5408\u5E76\u3002": "The local draft conflicts with the server revision. Merge it first.",
  "\u672C\u5730\u8349\u7A3F\u5C1A\u672A\u4FDD\u5B58\uFF0C\u8BF7\u4FDD\u5B58\u65B0\u7248\u672C\u540E\u91CD\u65B0\u590D\u6838\u3002": "The local draft is unsaved. Save a new revision and request a new review.",
  "\u9700\u6C42\u6F84\u6E05\u5C1A\u672A\u5B8C\u6210\u3002": "Requirements clarification is incomplete.",
  "\u5F53\u524D\u4FEE\u8BA2\u5C1A\u672A\u901A\u8FC7\u72EC\u7ACB\u590D\u6838\u3002": "The current revision has not passed independent review.",
  "\u6B64\u4FEE\u8BA2\u5DF2\u63A5\u7EB3\u3002": "This revision has been accepted.",
  "\u6240\u7528\u9700\u6C42\u7248\u672C\u5DF2\u53D8\u66F4\uFF0C\u8BF7\u91CD\u65B0\u751F\u6210\u4E0E\u590D\u6838\u3002": "The requirements have changed. Regenerate and review again.",
  "\u5DE5\u7A0B\u7AE0\u7A0B\u65E0\u6CD5\u8BFB\u53D6\uFF1A{value0}": "Unable to read the project constitution: {value0}",
  "\u6240\u7528\u5DE5\u7A0B\u7AE0\u7A0B\u5DF2\u53D8\u66F4\uFF0C\u8BF7\u91CD\u65B0\u751F\u6210\u4E0E\u590D\u6838\u3002": "The project constitution has changed. Regenerate and review again.",
  "\u4E0A\u6E38\u4EA7\u7269\u7248\u672C\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u751F\u6210\u4E0E\u590D\u6838\u3002": "An upstream artifact has changed. Regenerate and review again.",
  "\u6587\u6863\u4EA7\u7269": "Document artifacts",
  "\u4EFD": "documents",
  "\u5171 {count} \u4EFD": "{count} total",
  "\u5DE5\u4F5C\u9879\u5DF2\u4EA4\u4ED8\uFF0C\u6587\u6863\u4E0E\u5BA1\u9605\u8BB0\u5F55\u53EA\u8BFB\u3002\u540E\u7EED\u9700\u6C42\u8BF7\u65B0\u5EFA\u5DE5\u4F5C\u9879\u3002": "This work item has been delivered. Documents and review records are read-only. Create a new work item for further requirements.",
  "\u6BCF\u4EFD\u4EA7\u7269\u90FD\u6709\u4F9B\u4EBA\u9605\u8BFB\u7684\u7B80\u62A5\u4E0E\u4F9B AI \u6267\u884C\u7684\u5B8C\u6574\u6587\u6863\u3002": "Each artifact includes a readable brief and a complete document for AI execution.",
  "\u5BFC\u5165\u6587\u6863": "Import documents",
  "\u5C1A\u672A\u4EA7\u51FA\u6587\u6863": "No documents yet",
  "\u6B64\u5DE5\u4F5C\u9879\u5DF2\u4EA4\u4ED8\u3002\u540E\u7EED\u9700\u6C42\u8BF7\u65B0\u5EFA\u5DE5\u4F5C\u9879\u3002": "This work item has been delivered. Create a new work item for further requirements.",
  "\u8FD0\u884C\u9700\u6C42\u89C4\u683C\u6B65\u9AA4\uFF0C\u6216\u5BFC\u5165\u5DF2\u6709 Markdown \u5F00\u59CB\u5DE5\u7A0B\u6D41\u7A0B\u3002": "Run the specification step or import existing Markdown to start the workflow.",
  "\u6587\u6863\u7248\u672C": "Document revision",
  "\u7248\u672C": "Version",
  " \xB7 \u5DF2\u63A5\u7EB3": " \xB7 Accepted",
  "\u5DF2\u63A5\u7EB3": "Accepted",
  "\u5019\u9009\u7248\u672C": "Candidate revision",
  "\u5DF2\u72EC\u7ACB\u590D\u6838": "Independently reviewed",
  "\u7B49\u5F85\u72EC\u7ACB\u590D\u6838": "Awaiting independent review",
  "\u5185\u5BB9": "Content",
  "\u6587\u6863\u9605\u8BFB\u65B9\u5F0F": "Document view",
  "\u4EBA\u7C7B\u7B80\u62A5": "Reader brief",
  "AI \u6267\u884C\u6587\u6863": "AI execution document",
  "\u6BD4\u8F83": "Compare",
  "\u5DF2\u4EA4\u4ED8\u5DE5\u4F5C\u9879\u7684\u672C\u5730\u8349\u7A3F\u4E0E\u5DF2\u4FDD\u5B58\u7248\u672C\u4E0D\u540C\u3002\u8349\u7A3F\u5DF2\u4FDD\u7559\uFF0C\u53EF\u67E5\u770B\u539F\u6587\u5E76\u590D\u5236\u5230\u65B0\u5DE5\u4F5C\u9879\u3002": "The local draft differs from the saved revision of this delivered work item. Your draft is preserved; view its source and copy it to a new work item.",
  "\u670D\u52A1\u5668\u5DF2\u6709\u65B0\u7248\u672C\uFF0C\u5F53\u524D\u672C\u5730\u8349\u7A3F\u5DF2\u4FDD\u7559\u3002\u8BF7\u6BD4\u8F83\u5185\u5BB9\u540E\u5904\u7406\u51B2\u7A81\u3002": "A newer server revision is available. Your local draft is preserved. Compare the content to resolve the conflict.",
  "\u6BD4\u8F83\u51B2\u7A81": "Compare conflict",
  "\u4EE5\u670D\u52A1\u5668\u7248\u672C\u4E3A\u57FA\u7EBF\u7EE7\u7EED\u5408\u5E76": "Continue merging from the server revision",
  "\u4E22\u5F03\u8349\u7A3F\u5E76\u8F7D\u5165\u5F53\u524D\u7248\u672C": "Discard draft and load current revision",
  "\u6D4F\u89C8\u5668\u5B58\u50A8\u4E0D\u53EF\u7528\uFF0C\u8349\u7A3F\u4EC5\u4FDD\u7559\u5728\u5F53\u524D\u7A97\u53E3\u3002": "Browser storage is unavailable. Your draft is kept only in this window.",
  "\u8BF7\u67E5\u770B\u539F\u6587\u5E76\u590D\u5236\u5230\u65B0\u5DE5\u4F5C\u9879\u540E\u518D\u5173\u95ED\u3002": "View the source and copy it to a new work item before closing.",
  "\u8BF7\u4FDD\u5B58\u65B0\u7248\u672C\u540E\u518D\u5173\u95ED\u3002": "Save a new revision before closing.",
  "\u6B63\u5728\u67E5\u770B\u5386\u53F2\u7248\u672C\uFF0C\u6B63\u6587\u53EA\u8BFB\u3002": "Viewing a historical revision. The content is read-only.",
  "\u6B63\u5728\u67E5\u770B\u5386\u53F2\u7248\u672C\uFF0C\u6B63\u6587\u5DF2\u9501\u5B9A\u3002\u4FDD\u5B58\u4E0E\u63A5\u7EB3\u4EC5\u9488\u5BF9\u5F53\u524D\u5019\u9009\u3002": "Viewing a historical revision. The content is locked. Only the current candidate can be saved or accepted.",
  "\u5DF2\u5B8C\u6210\u9700\u6C42\u6F84\u6E05 \xB7 {value0} \u9879\u7B54\u590D\u5DF2\u8BB0\u5F55": "Requirements clarified \xB7 {value0} answers recorded",
  "\u5F53\u524D\u89C4\u683C\u9700\u8981\u5148\u5B8C\u6210\u9700\u6C42\u6F84\u6E05\uFF0C\u518D\u590D\u6838\u4E0E\u63A5\u7EB3\u3002": "Complete requirements clarification before reviewing and accepting this specification.",
  "\u8FDB\u5165\u9700\u6C42\u6F84\u6E05": "Open requirements clarification",
  "\u7B80\u62A5\u57FA\u4E8E\u5DF2\u4FDD\u5B58\u7248\u672C\u3002\u672C\u5730\u8349\u7A3F\u5DF2\u4FDD\u7559\uFF0C\u53EF\u5728\u539F\u6587\u4E2D\u9009\u4E2D\u590D\u5236\uFF1B\u540E\u7EED\u9700\u6C42\u8BF7\u65B0\u5EFA\u5DE5\u4F5C\u9879\u3002": "The brief uses the saved revision. Your local draft is preserved and can be selected and copied from the source. Create a new work item for further requirements.",
  "\u7B80\u62A5\u57FA\u4E8E\u9009\u5B9A\u7684\u5DF2\u4FDD\u5B58\u7248\u672C\u3002\u672C\u5730\u8349\u7A3F\u5C1A\u672A\u540C\u6B65\uFF0C\u4FDD\u5B58\u65B0\u7248\u672C\u540E\u7B80\u62A5\u4F1A\u66F4\u65B0\u3002": "The brief uses the selected saved revision. Your local draft is not included. Save a new revision to update the brief.",
  "\u7B80\u62A5\u6682\u65F6\u65E0\u6CD5\u8F7D\u5165": "Brief temporarily unavailable",
  "\u91CD\u65B0\u8F7D\u5165\u7B80\u62A5": "Reload brief",
  "\u6B63\u5728\u8F7D\u5165\u6B64\u7248\u672C\u7684\u7B80\u62A5\u2026": "Loading the brief for this revision\u2026",
  "\u6D41\u7A0B\u4EA7\u7269\u7B80\u62A5": "Workflow artifact brief",
  "\u5BF9\u5E94\u6267\u884C\u6587\u6863": "Source execution document",
  "\u5F53\u524D\u7248\u672C": "Current revision",
  "\u5386\u53F2\u7248\u672C": "Historical revision",
  "\u4FEE\u8BA2": "Revision",
  "\u672C\u9875\u4E3A\u539F\u6587\u6458\u5F55\uFF0C\u53EF\u80FD\u7701\u7565\u4E0A\u4E0B\u6587\u3002": "This page contains excerpts and may omit context.",
  "\u672C\u7B80\u62A5\u4E0E\u8BE5\u7248\u672C\u7684\u6267\u884C\u6587\u6863\u4E00\u540C\u4FDD\u5B58\u3002": "This brief was saved with this revision of the execution document.",
  "\u67E5\u770B\u5B8C\u6574\u7EA6\u675F\u4E0E\u9A8C\u6536\u6761\u4EF6\uFF0C\u8BF7\u5207\u6362\u81F3 AI \u6267\u884C\u6587\u6863\u3002": "Switch to the AI execution document for the full constraints and acceptance criteria.",
  "\u5BFC\u51FA\u4EBA\u7C7B\u7B80\u62A5": "Export reader brief",
  "HTML \u9605\u8BFB\u9875": "HTML reading page",
  "\u5B8C\u6574\u4FDD\u7559\u76EE\u6807\u3001\u7EA6\u675F\u548C\u9A8C\u6536\u6761\u4EF6\u3002": "Includes the full goals, constraints, and acceptance criteria.",
  "\u5DF2\u4EA4\u4ED8\u5185\u5BB9\u53EA\u8BFB\u3002\u672C\u5730\u8349\u7A3F\u5DF2\u4FDD\u7559\uFF0C\u53EF\u9009\u4E2D\u590D\u5236\u5230\u65B0\u5DE5\u4F5C\u9879\u3002": "Delivered content is read-only. Your local draft is preserved and can be selected and copied to a new work item.",
  "\u5DE5\u4F5C\u9879\u5DF2\u4EA4\u4ED8\uFF0C\u6B63\u6587\u53EA\u8BFB\uFF1B\u540E\u7EED\u9700\u6C42\u8BF7\u65B0\u5EFA\u5DE5\u4F5C\u9879\u3002": "This work item has been delivered. The content is read-only. Create a new work item for further requirements.",
  "\u6B63\u5728\u9884\u89C8\u672C\u5730\u8349\u7A3F\uFF0C\u4FDD\u5B58\u540E\u9700\u91CD\u65B0\u590D\u6838\u3002": "Previewing your local draft. A new review is required after saving.",
  "\u4FEE\u8BA2\u540E\u9700\u4FDD\u5B58\u65B0\u7248\u672C\u5E76\u91CD\u65B0\u590D\u6838\u3002": "After editing, save a new revision and request a new review.",
  "\u6267\u884C\u6587\u6863\u6A21\u5F0F": "Execution document mode",
  "Markdown \u9884\u89C8": "Markdown preview",
  "\u7F16\u8F91\u539F\u6587": "Edit source",
  "\u67E5\u770B\u539F\u6587": "View source",
  "\u5DF2\u4EA4\u4ED8\u53EA\u8BFB": "Delivered \xB7 Read-only",
  "\u5386\u53F2\u53EA\u8BFB": "Historical \xB7 Read-only",
  "\u5F53\u524D": "Current",
  "\u6587\u6863\u6B63\u6587": "Document content",
  "\u670D\u52A1\u5668 {value0} \xB7 {value1}": "Server {value0} \xB7 {value1}",
  "\u5DF2\u63A5\u7EB3 {value0} \xB7 {value1}": "Accepted {value0} \xB7 {value1}",
  "\u9996\u6B21\u65B0\u589E \xB7 \u65E0\u5DF2\u63A5\u7EB3\u57FA\u7EBF": "First revision \xB7 No accepted baseline",
  "\u672C\u5730\u8349\u7A3F \xB7 \u57FA\u4E8E {value0}": "Local draft \xB7 Based on {value0}",
  "\u9009\u5B9A\u4FEE\u8BA2 {value0} \xB7 {value1}": "Selected revision {value0} \xB7 {value1}",
  "\u670D\u52A1\u5668\u7248\u672C": "Server revision",
  "\u5DF2\u63A5\u7EB3\u7248\u672C": "Accepted revision",
  "\u9996\u6B21\u65B0\u589E": "First revision",
  "\u672C\u5730\u8349\u7A3F": "Local draft",
  "\u9009\u5B9A\u7248\u672C": "Selected revision",
  "\u6BB5\u843D\u8BC4\u8BBA": "Paragraph comments",
  "\u5728\u539F\u6587\u4E2D\u67E5\u627E": "Find in source",
  "\u5F53\u524D\u539F\u6587\u4E2D\u672A\u627E\u5230\u6B64\u6587\u672C\uFF0C\u53EF\u80FD\u5DF2\u88AB\u8349\u7A3F\u4FEE\u8BA2\u3002": "This text was not found in the current source. It may have been changed in the draft.",
  "\u5DF2\u5B9A\u4F4D\u539F\u6587\u4E2D\u7684\u552F\u4E00\u5339\u914D\u3002": "Located the only matching text in the source.",
  "\u627E\u5230": "Found",
  "\u5904\u76F8\u540C\u6587\u672C\uFF0C\u8BF7\u9009\u62E9\u4F4D\u7F6E\uFF1A": "matches. Select a location:",
  "\u7B2C": "Match",
  "\u5904 \xB7 \u884C": "\xB7 Line",
  "\u627E\u5230 {count} \u5904\u76F8\u540C\u6587\u672C\uFF0C\u8BF7\u9009\u62E9\u4F4D\u7F6E\uFF1A": "Found {count} matches. Select a location:",
  "\u7B2C {index} \u5904 \xB7 \u884C {line}": "Match {index} \xB7 Line {line}",
  "\u5DE5\u4F5C\u9879\u5DF2\u4EA4\u4ED8\uFF0C\u6BB5\u843D\u8BC4\u8BBA\u8BB0\u5F55\u53EA\u8BFB\u3002": "This work item has been delivered. Paragraph comments are read-only.",
  "\u9009\u4E2D\u6B63\u6587\u4E2D\u7684\u4E00\u6BB5\uFF0C\u53EF\u4EE5\u628A\u8BC4\u8BBA\u9489\u5728\u8BE5\u6BB5\u843D\u4E0A\u3002": "Select a passage to attach a comment to it.",
  "\u5207\u6362\u81F3 AI \u6267\u884C\u6587\u6863\uFF0C\u9009\u4E2D\u6B63\u6587\u540E\u53EF\u5C06\u8BC4\u8BBA\u9489\u5728\u6BB5\u843D\u4E0A\u3002": "Switch to the AI execution document and select a passage to attach a comment.",
  "\u5DF2\u9009\u4E2D\u6BB5\u843D\uFF1A": "Selected passage:",
  "\u5DF2\u9009\u4E2D\u6BB5\u843D\uFF1A{text}": "Selected passage: {text}",
  "\u8BB0\u5F55\u4E00\u4E2A\u95EE\u9898\u6216\u4FEE\u8BA2\u5EFA\u8BAE\u2026": "Record a question or suggested revision\u2026",
  "\u8BC4\u8BBA\u5185\u5BB9": "Comment",
  "\u8BC4\u8BBA\u5DF2\u4FDD\u5B58": "Comment saved",
  "\u6DFB\u52A0\u8BC4\u8BBA": "Add comment",
  "\u8D1F\u8D23\u4EBA": "Owner",
  "\u4EA7\u7269\u8D1F\u8D23\u4EBA": "Artifact owner",
  "\u6B64\u5DE5\u4F5C\u9879\u5DF2\u4EA4\u4ED8\u3002\u6587\u6863\u3001\u8BC4\u8BBA\u4E0E\u8D1F\u8D23\u4EBA\u53EA\u8BFB\uFF0C\u4FDD\u7559\u5386\u53F2\u3001\u6BD4\u8F83\u4E0E\u5BFC\u51FA\uFF1B\u540E\u7EED\u9700\u6C42\u8BF7\u65B0\u5EFA\u5DE5\u4F5C\u9879\u3002": "This work item has been delivered. Documents, comments, and owners are read-only. History, comparison, and export remain available. Create a new work item for further requirements.",
  "\u5F53\u524D\u7248\u672C\u5DF2\u4FDD\u5B58\u5E76\u5B8C\u6210\u590D\u6838\u3002\u63A5\u7EB3\u65F6\u670D\u52A1\u4F1A\u91CD\u65B0\u68C0\u67E5\u8F93\u5165\u3001\u7248\u672C\u4E0E\u5DE5\u7A0B\u6761\u4EF6\u3002": "This revision is saved and reviewed. Acceptance checks the inputs, revision, and project conditions again.",
  "\u672C\u5730\u8349\u7A3F\u5DF2\u4FDD\u7559 \xB7 \u67E5\u770B\u539F\u6587\u53EF\u9009\u4E2D\u590D\u5236\u5230\u65B0\u5DE5\u4F5C\u9879": "Local draft preserved \xB7 View source to copy it to a new work item",
  "\u8349\u7A3F\u4EC5\u4FDD\u7559\u5728\u5F53\u524D\u7A97\u53E3 \xB7 \u8BF7\u4FDD\u5B58\u540E\u518D\u5173\u95ED": "Draft kept only in this window \xB7 Save before closing",
  "\u672C\u5730\u8349\u7A3F\u5DF2\u4FDD\u7559 \xB7 Ctrl+S \u4FDD\u5B58": "Local draft preserved \xB7 Ctrl+S to save",
  "\u66F4\u65B0\u4E8E {value0}": "Updated {value0}",
  "\u4FDD\u5B58\u65B0\u7248\u672C": "Save new revision",
  "\u5DF2\u68C0\u67E5\u5E76\u63A5\u7EB3\u5F53\u524D\u5185\u5BB9": "Reviewed and accepted the current content",
  "\u4EA7\u7269\u5DF2\u63A5\u7EB3\uFF0C\u4E0B\u6E38\u53EF\u4EE5\u6D88\u8D39\u8BE5\u7248\u672C": "Artifact accepted. Downstream steps can use this revision.",
  "\u63A5\u7EB3\u6B64\u7248\u672C": "Accept this revision",
  "\u65B0\u589E": "Added",
  "\u672A\u8DDF\u8E2A\u65B0\u589E": "Untracked",
  "\u4FEE\u6539": "Modified",
  "\u5220\u9664": "Deleted",
  "\u91CD\u547D\u540D": "Renamed",
  "\u7C7B\u578B\u53D8\u66F4": "Type changed",
  "\u5019\u9009\u6216\u6587\u4EF6\u5DF2\u53D8\u66F4\uFF0C\u8BF7\u91CD\u65B0\u8F7D\u5165\u5DEE\u5F02\uFF0C\u907F\u514D\u6DF7\u7528\u4E0D\u540C\u7248\u672C\u3002": "The candidate or file has changed. Reload the diff to avoid mixing revisions.",
  "\u6B64\u6587\u4EF6\u4E0D\u63D0\u4F9B\u6587\u672C\u6B63\u6587\u3002": "Text content is unavailable for this file.",
  "\u65E0\u6CD5\u8BFB\u53D6\u6B63\u6587\uFF0C\u8BF7\u91CD\u8BD5\u3002": "Unable to read the content. Try again.",
  "\u4E8C\u8FDB\u5236": "Binary",
  "\u5B57\u8282": "bytes",
  " \xB7 \u539F {value0} \u5B57\u8282": " \xB7 Previously {value0} bytes",
  "\u539F SHA-256": "Original SHA-256",
  "\u2192 \u65B0": "\u2192 New",
  "\u4E8C\u8FDB\u5236\u6587\u4EF6": "Binary file",
  "\u6B63\u6587\u4E0D\u4F5C\u6587\u672C\u89E3\u91CA\u3002\u8BF7\u4F9D\u636E\u6587\u4EF6\u8DEF\u5F84\u3001\u5927\u5C0F\u548C SHA-256 \u6838\u5BF9\u53D8\u66F4\u3002": "The content is not interpreted as text. Verify the change using the file path, size, and SHA-256.",
  "\u539F SHA-256\uFF1A": "Original SHA-256:",
  "\u65E0\u57FA\u7EBF\u6587\u4EF6": "No baseline file",
  "\u65B0 SHA-256\uFF1A": "New SHA-256:",
  "\u6587\u4EF6\u5DF2\u5220\u9664": "File deleted",
  "\u5F53\u524D\u6750\u6599\u672A\u5B8C\u6574\u663E\u793A": "Some content is not displayed",
  "\u6587\u4EF6\u6216\u8865\u4E01\u8D85\u8FC7\u9996\u6279\u663E\u793A\u5927\u5C0F\u3002": "The file or patch exceeds the initial display limit.",
  "\u5DF2\u8FD4\u56DE": "Returned",
  "\u5B57\u8282\u3002": "bytes.",
  "\u8865\u4E01\u5DF2\u622A\u65AD\uFF0C\u5B8C\u6574\u6B63\u6587\u53EF\u5728\u4E0B\u65B9\u5206\u5757\u8BFB\u53D6\u3002": "The patch is truncated. Read the full content in chunks below.",
  "\u589E\u5220\u7EDF\u8BA1\u4EC5\u8986\u76D6\u5DF2\u663E\u793A\u7684\u5DEE\u5F02\u3002": "Addition and deletion counts cover only the displayed diff.",
  "\u6587\u4EF6\u8DEF\u5F84\u5DF2\u53D8\u66F4\uFF1B\u5185\u5BB9\u5DEE\u5F02\u89C1\u6B63\u6587\u3002": "The file path has changed. Read the content to compare it.",
  "\u6B64\u6587\u4EF6\u6CA1\u6709\u53EF\u663E\u793A\u7684\u6587\u672C hunk\uFF0C\u53EF\u8BFB\u53D6\u539F\u6587\u6838\u5BF9\u3002": "This file has no displayable text hunks. Read the source to verify it.",
  "\u8BFB\u53D6\u5019\u9009\u6B63\u6587": "Read candidate content",
  "\u8BFB\u53D6\u57FA\u7EBF\u6B63\u6587": "Read baseline content",
  "\u6B63\u5728\u8BFB\u53D6\u2026": "Reading\u2026",
  "\u5019\u9009": "Candidate",
  "\u57FA\u7EBF": "Baseline",
  "\u5B8C\u6574\u6B63\u6587 \xB7 SHA-256": "full content \xB7 SHA-256",
  "\u5B57\u8282 \xB7": "bytes \xB7",
  "\u5DF2\u5B8C\u6574\u8BFB\u53D6": "Fully loaded",
  "\u5206\u5757\u8BFB\u53D6\u4E2D": "Partially loaded",
  "\u7EE7\u7EED\u8BFB\u53D6\u4E0B\u4E00\u5757": "Read next chunk",
  "\u5DF2\u63A5\u7EB3\u4EE3\u7801": "Accepted code",
  "\u5019\u9009\u4EE3\u7801": "Candidate code",
  "\u67E5\u770B\u5DF2\u63A5\u7EB3\u7684\u4EE3\u7801\u5DEE\u5F02\u3001\u72EC\u7ACB\u590D\u6838\u4E0E\u9A8C\u8BC1\u8BC1\u636E\u3002": "View the accepted code diff, independent review, and verification evidence.",
  "\u68C0\u67E5\u6587\u4EF6\u4E0E\u771F\u5B9E\u6E90\u7801\u5DEE\u5F02\uFF0C\u518D\u4F9D\u636E\u540C\u4E00\u7248\u672C\u7684\u8BC1\u636E\u63A5\u7EB3\u3002": "Inspect the files and source diff, then accept using evidence for the same revision.",
  "\u4EE3\u7801\u6539\u52A8\u5C06\u5728\u8FD9\u91CC\u6C47\u96C6": "Code changes appear here",
  "\u5148\u5B8C\u6210\u9700\u6C42\u3001\u8BBE\u8BA1\u548C\u4EFB\u52A1\u63A5\u7EB3\uFF0C\u518D\u8FD0\u884C\u4EE3\u7801\u5B9E\u73B0\u3002": "Accept the requirements, design, and tasks, then run implementation.",
  "\u8865\u4E01\u5C1A\u672A\u8BFB\u53D6": "Patch not loaded",
  "\u5019\u9009\u6811": "Candidate tree",
  "\u6B63\u5728\u8BFB\u53D6\u5DEE\u5F02\u2026": "Loading diff\u2026",
  "\u65E0\u6CD5\u8BFB\u53D6\u5DEE\u5F02": "Unable to load diff",
  "\u91CD\u8BD5": "Retry",
  "\u4E2A\u6587\u4EF6 \xB7": "files \xB7",
  "{count} \u4E2A\u6587\u4EF6": "Files: {count}",
  "\u6750\u6599\u5DF2\u5B8C\u6574\u8FD4\u56DE": "All content returned",
  "\u90E8\u5206\u6750\u6599\u9700\u7EE7\u7EED\u8BFB\u53D6": "More content available to load",
  "\u4EE3\u7801\u5DEE\u5F02\u663E\u793A\u65B9\u5F0F": "Code diff layout",
  "\u7EDF\u4E00": "Unified",
  "\u5206\u5C4F": "Split",
  "\u6298\u53E0\u5168\u90E8": "Collapse all",
  "\u5C55\u5F00\u5168\u90E8": "Expand all",
  "\u91CD\u65B0\u8F7D\u5165\u5DEE\u5F02": "Reload diff",
  "\u6B64\u5019\u9009\u6CA1\u6709\u4EE3\u7801\u5DEE\u5F02\u3002": "This candidate has no code changes.",
  "\u4EE3\u7801\u5DF2\u63A5\u7EB3": "Code accepted",
  "\u672C\u5019\u9009\u5DF2\u63A5\u7EB3\uFF0C\u76F8\u5173\u4EE3\u7801\u5DEE\u5F02\u3001\u72EC\u7ACB\u590D\u6838\u4E0E\u9A8C\u8BC1\u8BC1\u636E\u4FDD\u7559\u4F9B\u67E5\u9605\u3002\u540E\u7EED\u9700\u6C42\u8BF7\u65B0\u5EFA\u5DE5\u4F5C\u9879\u3002": "This candidate is accepted. Its code diff, independent review, and verification evidence remain available. Create a new work item for further requirements.",
  "\u63A5\u7EB3\u8BB0\u5F55\u66F4\u65B0\u4E8E": "Acceptance updated",
  "\xB7 \u4EE3\u7801": "\xB7 Code",
  "\xB7 \u57FA\u7EBF": "\xB7 Baseline",
  "\u63A5\u7EB3\u6761\u4EF6\u9884\u68C0": "Acceptance precheck",
  "\u91CD\u65B0\u68C0\u67E5": "Check again",
  "\u6B63\u5728\u68C0\u67E5\u5F53\u524D\u7248\u672C\u4E0E\u8BC1\u636E\u2026": "Checking the current revision and evidence\u2026",
  "\u9884\u68C0\u8BFB\u53D6\u5931\u8D25\uFF1A": "Unable to load precheck:",
  "\u622A\u81F3\u68C0\u67E5\u65F6\u523B\uFF0C\u670D\u52A1\u7AEF\u672A\u53D1\u73B0\u63A5\u7EB3\u963B\u585E\u3002": "No acceptance blockers were found at the time of this check.",
  "\u5F53\u524D\u5B58\u5728\u4EE5\u4E0B\u63A5\u7EB3\u963B\u585E\uFF1A": "The following issues block acceptance:",
  "\u68C0\u67E5\u4E8E": "Checked",
  "\xB7 \u6811": "\xB7 Tree",
  "\u9884\u68C0\u4E0E\u5DF2\u663E\u793A\u5DEE\u5F02\u7684\u5019\u9009\u6811\u4E0D\u540C\uFF0C\u8BF7\u91CD\u65B0\u8F7D\u5165\u5DEE\u5F02\u5E76\u68C0\u67E5\u3002": "The precheck and displayed diff refer to different candidate trees. Reload and inspect the diff.",
  "\u9884\u68C0\u53EA\u8BF4\u660E\u68C0\u67E5\u65F6\u523B\u7684\u6761\u4EF6\uFF1B\u63A5\u7EB3\u65F6\u670D\u52A1\u4F1A\u518D\u6B21\u68C0\u67E5\u7248\u672C\u3001\u5DE5\u4F5C\u533A\u3001\u6D4B\u8BD5\u4E0E\u72EC\u7ACB\u590D\u6838\u8BC1\u636E\u3002": "The precheck reflects conditions at the time of checking. Acceptance checks the revision, workspace, tests, and independent review evidence again.",
  "\u4EE3\u7801\u5DF2\u63A5\u7EB3 \xB7 \u63A5\u7EB3\u4E0E\u9A8C\u8BC1\u8BC1\u636E\u5DF2\u4FDD\u7559": "Code accepted \xB7 Acceptance and verification evidence preserved",
  "\u8BE5\u5019\u9009\u6709\u72EC\u7ACB\u590D\u6838\u8BB0\u5F55": "This candidate has an independent review record",
  "\u9700\u8981\u72EC\u7ACB\u4EE3\u7801\u590D\u6838": "Independent code review required",
  "\u5019\u9009\u5DF2\u96C6\u6210\u5230\u5DE5\u4F5C\u9879\u5206\u652F": "Candidate integrated into the work item branch",
  "\u63A5\u7EB3\u4EE3\u7801": "Accept code",
  "\u9A8C\u8BC1\u8BC1\u636E": "Verification evidence",
  "\u91CD\u65B0\u9A8C\u8BC1": "Run verification again",
  "\u5DF2\u6267\u884C\u9A8C\u8BC1\u547D\u4EE4": "Verification commands executed",
  "\u5185\u5BB9\u5DF2\u6539\u53D8": "Content changed",
  "\u901A\u8FC7": "Passed",
  "\u5931\u8D25": "Failed",
  "\u4EE3\u7801": "Code",
  "\xB7 \u9000\u51FA\u7801": "\xB7 Exit code",
  "\u6B64\u5019\u9009\u672A\u8BB0\u5F55\u9A8C\u8BC1\u8BC1\u636E\u3002": "No verification evidence was recorded for this candidate.",
  "\u5C1A\u672A\u4EA7\u751F\u9A8C\u8BC1\u8BC1\u636E\u3002\u53EF\u901A\u8FC7\u53F3\u4E0A\u89D2\u91CD\u65B0\u8FD0\u884C\u9A8C\u8BC1\u547D\u4EE4\u3002": "No verification evidence yet. Run verification again using the button above.",
  "\u5B9E\u73B0\u4EFB\u52A1": "Implementation tasks",
  "\u8FD8\u6CA1\u6709\u5B9E\u73B0\u4EFB\u52A1\u3002": "No implementation tasks yet.",
  "\u590D\u6838\u53D1\u73B0": "Review findings",
  "\u963B\u585E": "Blocker",
  "\u963B\u585E\u95EE\u9898": "Blocker",
  "\u8B66\u544A": "Warning",
  "\u4F8B\u5916\u7406\u7531": "Waiver reason",
  "\u8BF4\u660E\u4E3A\u4F55\u5141\u8BB8\u8BE5\u8B66\u544A\u8FDB\u5165\u540E\u7EED\u6B65\u9AA4": "Explain why this warning may proceed to later steps",
  "\u53D6\u6D88": "Cancel",
  "\u5DF2\u8BB0\u5F55\u4F8B\u5916\u51B3\u7B56": "Waiver decision recorded",
  "\u786E\u8BA4\u4F8B\u5916": "Confirm waiver",
  "\u8BB0\u5F55\u4F8B\u5916\u7406\u7531": "Record waiver reason",
  "\u5F53\u524D\u6CA1\u6709\u672A\u89E3\u51B3\u7684\u590D\u6838\u53D1\u73B0": "No unresolved review findings",
  "\u539F\u884C {value0}": "Original line {value0}",
  "\u65B0\u884C {value0}": "New line {value0}",
  "\u4E0A\u4E00\u5904\u53D8\u66F4": "Previous change",
  "\u65E0\u53D8\u66F4": "No changes",
  "\u4E0B\u4E00\u5904\u53D8\u66F4": "Next change",
  "# \u9879\u76EE\u7AE0\u7A0B\n\n## \u5DE5\u7A0B\u539F\u5219\n- \u9700\u6C42\u4E0E\u4EFB\u52A1\u5177\u6709\u7A33\u5B9A ID\u3002\n- \u4EE3\u7801\u6539\u52A8\u5FC5\u987B\u6709\u53EF\u8FD0\u884C\u7684\u6D4B\u8BD5\u3002\n- \u9700\u6C42\u3001\u8BBE\u8BA1\u548C\u5B9E\u73B0\u9700\u8981\u72EC\u7ACB\u590D\u6838\u3002\n": "# Project Constitution\n\n## Engineering Principles\n- Requirements and tasks have stable IDs.\n- Code changes must have runnable tests.\n- Requirements, design, and implementation require independent review.\n",
  "\u9879\u76EE\u7AE0\u7A0B\u5DF2\u4FDD\u5B58\u5230\u4ED3\u5E93\uFF1B\u65B0\u5C1D\u8BD5\u4F7F\u7528\u6B64\u5185\u5BB9": "Project constitution saved to the repository. New attempts use this content.",
  "\u9879\u76EE\u7AE0\u7A0B": "Project constitution",
  "\u9879\u76EE\u7AE0\u7A0B\u5DF2\u4ECE\u4ED3\u5E93\u91CD\u65B0\u8BFB\u53D6": "Project constitution reloaded from the repository",
  "\u5237\u65B0\u8BFB\u53D6": "Reload",
  "\u9879\u76EE\u7AE0\u7A0B\u8BFB\u53D6\u5931\u8D25": "Unable to read project constitution",
  "\u8BF7\u4FEE\u590D\u6587\u4EF6\u5185\u5BB9\u540E\u5237\u65B0\u8BFB\u53D6\uFF0C\u8BFB\u53D6\u6062\u590D\u524D\u65E0\u6CD5\u542F\u52A8\u5DE5\u7A0B\u6B65\u9AA4\u3002": "Fix the file and reload it. Workflow steps cannot start until it can be read.",
  "\u8BFB\u53D6\u4ED3\u5E93\u6839\u76EE\u5F55\u7684 AGENT.md \u548C AGENTS.md\u3002\u7AE0\u7A0B\u5185\u5BB9\u4F1A\u968F\u9700\u6C42\u3001\u8BBE\u8BA1\u3001\u5B9E\u73B0\u53CA\u590D\u6838\u56FA\u5B9A\u5230\u6BCF\u6B21\u5C1D\u8BD5\u4E2D\u3002": "Reads AGENT.md and AGENTS.md from the repository root. Each requirements, design, implementation, and review attempt retains a snapshot of the constitution.",
  "\u9879\u76EE\u7AE0\u7A0B\u6587\u4EF6": "Project constitution file",
  "\u5185\u5BB9 {value0}": "Content {value0}",
  "\u4FDD\u5B58\u540E\u521B\u5EFA\u6B64\u6587\u4EF6": "This file will be created when saved",
  "\u7AE0\u7A0B\u6B63\u6587": "Constitution content",
  "\u9879\u76EE\u7AE0\u7A0B\u6B63\u6587": "Project constitution content",
  "\u6D4F\u89C8\u5668\u5B58\u50A8\u4E0D\u53EF\u7528\uFF0C\u7AE0\u7A0B\u8349\u7A3F\u4EC5\u4FDD\u7559\u5728\u5F53\u524D\u7A97\u53E3\u3002\u8BF7\u4FDD\u5B58\u5230\u4ED3\u5E93\u540E\u518D\u5173\u95ED\u7A97\u53E3\u3002": "Browser storage is unavailable. The constitution draft is kept only in this window. Save it to the repository before closing.",
  "\u4ED3\u5E93\u7AE0\u7A0B\u5DF2\u6709\u65B0\u5185\u5BB9\uFF0C\u8349\u7A3F\u5DF2\u4FDD\u7559": "The repository constitution has changed. Your draft is preserved.",
  "\u67E5\u770B\u4ED3\u5E93\u5F53\u524D\u5185\u5BB9": "View current repository content",
  "\u8F7D\u5165\u5F53\u524D\u5185\u5BB9": "Load current content",
  "\u4FDD\u5B58\u5230\u4ED3\u5E93\u540E\u751F\u6548\uFF0C\u5DF2\u6709\u5DE5\u7A0B\u7ED3\u679C\u4F1A\u63D0\u793A\u8FC7\u671F\u3002Ctrl+S / Ctrl+Enter \u4FDD\u5B58\u3002": "Changes take effect after saving to the repository. Existing results will be marked stale. Ctrl+S / Ctrl+Enter to save.",
  "\u4FDD\u5B58\u9879\u76EE\u7AE0\u7A0B": "Save project constitution",
  "\u6700\u591A\u6DFB\u52A0 20 \u4EFD\u9700\u6C42\u6587\u6863": "You can add up to 20 requirements documents",
  "\u652F\u6301 Markdown \u548C TXT\uFF0C\u8BF7\u5C06\u5176\u4ED6\u683C\u5F0F\u5BFC\u51FA\u4E3A\u6587\u672C\u540E\u4E0A\u4F20": "Markdown and TXT are supported. Export other formats as text before uploading.",
  "{value0} \u8D85\u8FC7 512 KiB": "{value0} exceeds 512 KiB",
  "{value0} \u5FC5\u987B\u4F7F\u7528 UTF-8 \u7F16\u7801": "{value0} must use UTF-8 encoding",
  "{value0} \u4E3A\u7A7A\u6216\u5305\u542B\u4E8C\u8FDB\u5236\u5185\u5BB9": "{value0} is empty or contains binary content",
  "\u6587\u6863\u5DF2\u52A0\u5165\u8349\u7A3F\uFF1B\u4FDD\u5B58\u9700\u6C42\u540E AI \u624D\u4F1A\u4F7F\u7528": "Documents added to the draft. Save the requirements before AI can use them.",
  "\u9700\u6C42\u6587\u6863": "Requirements documents",
  "\u4E0A\u4F20\u6587\u6863": "Upload documents",
  "\u8865\u5145\u9700\u6C42-{value0}.md": "additional-requirements-{value0}.md",
  "\u7C98\u8D34\u6587\u6863": "Paste document",
  "\u4E0A\u4F20\u9700\u6C42\u6587\u6863": "Upload requirements documents",
  "\u652F\u6301 UTF-8 Markdown / TXT\u3002\u6BCF\u4EFD\u4E0D\u8D85\u8FC7 512 KiB\uFF0C\u9700\u6C42\u603B\u8BA1\u4E0D\u8D85\u8FC7 1 MiB\u3002": "Supports UTF-8 Markdown / TXT. Up to 512 KiB per document and 1 MiB for all requirements.",
  "\u4ED3\u5E93\u9700\u6C42\u6587\u6863\u8DEF\u5F84": "Repository requirements document path",
  "\u4ED3\u5E93\u76F8\u5BF9\u8DEF\u5F84\uFF0C\u4F8B\u5982 docs/requirements.md": "Repository-relative path, for example docs/requirements.md",
  "\u4ED3\u5E93\u6587\u6863\u5DF2\u52A0\u5165\u8349\u7A3F\uFF1B\u4FDD\u5B58\u540E\u4F7F\u7528\u6B64\u5185\u5BB9\u5FEB\u7167": "Repository document added to the draft. Its content snapshot will be used after saving.",
  "\u4ECE\u4ED3\u5E93\u5BFC\u5165": "Import from repository",
  "\u628A PRD\u3001\u9A8C\u6536\u6761\u4EF6\u6216\u80CC\u666F\u6750\u6599\u653E\u5728\u8FD9\u91CC": "Add PRDs, acceptance criteria, or background material here",
  "\u6587\u6863\u6B63\u6587\u4F1A\u968F\u9700\u6C42\u7248\u672C\u4F20\u7ED9 AI\u3002\u53EA\u6709\u9700\u6C42\u6B63\u6587\u65F6\u4E5F\u53EF\u4EE5\u5F00\u59CB\u5206\u6790\u3002": "Document content is sent to AI with the requirements revision. You can also start analysis with just the requirements text.",
  "\u4ED3\u5E93 \xB7 {value0}": "Repository \xB7 {value0}",
  "\u672C\u5730\u4E0A\u4F20": "Local upload",
  "\u5B57\u7B26": "characters",
  "{count} \u5B57\u7B26": "Characters: {count}",
  "\u6587\u6863\u540D\u79F0": "Document name",
  "\u9700\u6C42\u6587\u6863 {value0} \u540D\u79F0": "Requirements document {value0} name",
  "\u9700\u6C42\u6587\u6863 {value0} \u6B63\u6587": "Requirements document {value0} content",
  "\u79FB\u9664\u6B64\u6587\u6863": "Remove document",
  "\u9700\u6C42\u5DF2\u4FDD\u5B58\uFF1B\u65B0\u7684\u5206\u6790\u5C06\u8BFB\u53D6\u6B64\u7248\u672C": "Requirements saved. New analysis uses this revision.",
  "\u9700\u6C42\u8F93\u5165": "Requirements input",
  "\u63CF\u8FF0\u8981\u505A\u4EC0\u4E48\uFF0C\u628A\u5206\u6790\u4F9D\u636E\u653E\u5728\u540C\u4E00\u4E2A\u5730\u65B9\u3002": "Describe what to build and keep the analysis inputs together.",
  "\u8FD4\u56DE\u5F00\u53D1\u6D41\u7A0B": "Back to workflow",
  "\u7C98\u8D34\u9700\u6C42\uFF0C\u5199\u6E05\u7528\u6237\u573A\u666F\u3001\u529F\u80FD\u8FB9\u754C\u3001\u7EA6\u675F\u548C\u9A8C\u6536\u6761\u4EF6\u3002\u4E5F\u53EF\u4EE5\u901A\u8FC7\u4E0B\u65B9\u6587\u6863\u63D0\u4F9B\u5B8C\u6574\u9700\u6C42\u3002": "Paste requirements with user scenarios, scope, constraints, and acceptance criteria. You can also provide full requirements in the documents below.",
  "\u9700\u6C42\u5DF2\u6709\u65B0\u7248\u672C\uFF0C\u5F53\u524D\u8349\u7A3F\u5DF2\u4FDD\u7559": "A newer requirements revision is available. Your draft is preserved.",
  "\u53F3\u4FA7\u53EF\u67E5\u770B\u6700\u65B0\u7248\u672C\u3002\u6BD4\u8F83\u540E\u9009\u62E9\u5982\u4F55\u5904\u7406\u8349\u7A3F\u3002": "View the latest revision on the right. Compare it before deciding how to handle your draft.",
  "\u4E22\u5F03\u8349\u7A3F\uFF0C\u8F7D\u5165\u6700\u65B0\u9700\u6C42": "Discard draft and load latest requirements",
  "\u5DF2\u6BD4\u8F83\uFF0C\u4FDD\u7559\u6211\u7684\u8349\u7A3F": "Compared \xB7 Keep my draft",
  "\u5DE5\u4F5C\u9879\u5DF2\u7ECF\u63A5\u7EB3\u3002\u540E\u7EED\u9700\u6C42\u8BF7\u521B\u5EFA\u65B0\u7684\u5DE5\u4F5C\u9879\u3002": "This work item has been accepted. Create a new work item for further requirements.",
  "\u6D4F\u89C8\u5668\u5B58\u50A8\u7A7A\u95F4\u4E0D\u8DB3\uFF0C\u8349\u7A3F\u4EC5\u4FDD\u7559\u5728\u5F53\u524D\u7A97\u53E3\u3002\u8BF7\u5148\u4FDD\u5B58\u9700\u6C42\u518D\u5173\u95ED\u7A97\u53E3\u3002": "Browser storage is full. Your draft is kept only in this window. Save the requirements before closing.",
  "\u6709\u672A\u4FDD\u5B58\u8349\u7A3F \xB7 AI \u4F7F\u7528\u5DF2\u4FDD\u5B58\u7248\u672C \xB7 Ctrl+S \u4FDD\u5B58": "Unsaved draft \xB7 AI uses the saved revision \xB7 Ctrl+S to save",
  "\u5DF2\u4FDD\u5B58 \xB7 {value0}": "Saved \xB7 {value0}",
  "\u653E\u5F03\u8349\u7A3F": "Discard draft",
  "\u4FDD\u5B58\u9700\u6C42": "Save requirements",
  "\u5DF2\u4FDD\u5B58\u7684\u5206\u6790\u4F9D\u636E": "Saved analysis inputs",
  "\u65B0\u5C1D\u8BD5\u8BFB\u53D6\u5DF2\u4FDD\u5B58\u6B63\u6587\u548C\u5168\u90E8\u6587\u6863\u3002": "New attempts use the saved text and all documents.",
  "\u67E5\u770B\u9700\u6C42\u5386\u53F2\u7248\u672C": "View requirements history",
  " \xB7 \u5F53\u524D\u8F93\u5165": " \xB7 Current input",
  " \xB7 \u5386\u53F2\u8BB0\u5F55": " \xB7 History",
  "\u4EE5\u9644\u52A0\u9700\u6C42\u6587\u6863\u4E3A\u51C6": "See attached requirements documents",
  "\u4FDD\u5B58\u65B0\u9700\u6C42\u540E\uFF0C\u5DF2\u6709\u5206\u6790\u3001\u590D\u6838\u53CA\u4E0B\u6E38\u7ED3\u679C\u4F1A\u63D0\u793A\u8FC7\u671F\u3002\u65E7\u5C1D\u8BD5\u4FDD\u7559\u5176\u539F\u59CB\u8F93\u5165\uFF0C\u4FBF\u4E8E\u5BF9\u6BD4\u3002": "Saving new requirements marks existing analysis, reviews, and downstream results as stale. Previous attempts retain their original inputs for comparison.",
  "\u5DE5\u7A0B\u5DE5\u4F5C\u7A7A\u95F4": "Project workspace",
  "\u9009\u62E9\u5DE5\u7A0B\u5DE5\u4F5C\u7A7A\u95F4": "Choose project workspace",
  "\u6253\u5F00\u9879\u76EE\u76EE\u5F55\u521B\u5EFA\u5DE5\u4F5C\u7A7A\u95F4": "Open a project folder to create a workspace",
  "\u5DE5\u7A0B\u5DE5\u4F5C\u7A7A\u95F4\u9009\u9879": "Project workspace options",
  "\u5148\u8FD0\u884C": "Run",
  "\uFF0C\u5E76\u5728 OpenCode \u4E2D\u914D\u7F6E\u6A21\u578B\u4F9B\u5E94\u5546\uFF0C\u518D\u4FDD\u5B58\u670D\u52A1\u8FDE\u63A5\u5E76\u5237\u65B0\u6A21\u578B\u76EE\u5F55\u3002": ", configure model providers in OpenCode, then save the service connection and refresh the model catalog.",
  "\u8BF7\u4F7F\u7528\u53EF\u4FE1\u7684 OpenCode \u7528\u6237\u914D\u7F6E\u3002\u5F53\u524D\u4E0D\u52A0\u8F7D\u5DE5\u4F5C\u533A\u53CA\u7236\u76EE\u5F55\u4E2D\u7684\u9879\u76EE\u914D\u7F6E\u548C\u81EA\u5B9A\u4E49\u6269\u5C55\uFF1B\u4F9B\u5E94\u5546\u8BF7\u914D\u7F6E\u5728\u7528\u6237\u7EA7\u8BBE\u7F6E\u4E2D\u3002": "Use a trusted OpenCode user configuration. Project configurations and custom extensions in the workspace or parent directories are not loaded. Configure providers in user settings.",
  "OpenCode \u670D\u52A1\u5730\u5740": "OpenCode service URL",
  "\u7528\u6237\u540D \xB7 \u53EF\u9009": "Username \xB7 Optional",
  "\u542F\u7528\u670D\u52A1\u8BA4\u8BC1\u65F6\u586B\u5199": "Enter if service authentication is enabled",
  "\u5BC6\u7801 \xB7 \u53EF\u9009": "Password \xB7 Optional",
  "\u5DF2\u4FDD\u5B58\uFF1B\u7559\u7A7A\u4FDD\u7559\u539F\u5BC6\u7801": "Saved; leave blank to keep the existing password",
  "\u672A\u8BBE\u7F6E\u5BC6\u7801": "No password set",
  "\u53D6\u6D88\u6E05\u9664\u5BC6\u7801": "Cancel password removal",
  "\u6E05\u9664\u5DF2\u4FDD\u5B58\u5BC6\u7801": "Clear saved password",
  "\u4FDD\u5B58\u8FDE\u63A5\u65F6\u5C06\u6E05\u9664\u5BC6\u7801\u3002": "Saving the connection will remove the password.",
  "OpenCode \u670D\u52A1\u8FDE\u63A5\u5DF2\u4FDD\u5B58\uFF0C\u6A21\u578B\u76EE\u5F55\u5DF2\u5237\u65B0": "OpenCode service connection saved and model catalog refreshed",
  "\u4FDD\u5B58 OpenCode \u8FDE\u63A5": "Save OpenCode connection",
  "\u670D\u52A1\u8FDE\u63A5\u4FDD\u5B58\u5728\u672C\u673A\uFF0C\u4F9B\u6240\u6709\u5DE5\u7A0B\u4F7F\u7528\u3002\u89D2\u8272\u6A21\u578B\u548C\u6267\u884C\u5E95\u5EA7\u968F\u5F53\u524D\u5DE5\u7A0B\u4FDD\u5B58\u3002": "The service connection is stored locally for all projects. Role models and the execution harness are saved per project.",
  "[\u56FE\u7247\uFF1A{value0}]": "[Image: {value0}]",
  "\u6587\u6863\u76EE\u5F55": "Document contents",
  "\u76EE\u5F55": "Contents",
  "\u6536\u8D77\u4E0A\u4E0B\u6587": "Hide context",
  "\u6B65\u9AA4\u4E0A\u4E0B\u6587": "Step context",
  "\u8C03\u6574\u6B65\u9AA4\u4E0A\u4E0B\u6587\u5BBD\u5EA6": "Resize step context",
  "\u5173\u95ED\u6B65\u9AA4\u4E0A\u4E0B\u6587": "Close step context",
  "\u5F53\u524D\u5DE5\u4F5C\u9879": "Current work item",
  "\u5173\u95ED\u8BE6\u60C5": "Close details"
};

// packages/i18n/web-workflow.ts
var messages3 = {
  "\u9700\u6C42\u6709\u672A\u4FDD\u5B58\u8349\u7A3F\u6216\u7248\u672C\u51B2\u7A81\uFF0C\u8BF7\u5148\u4FDD\u5B58\u6216\u5904\u7406\u51B2\u7A81": "Requirements have an unsaved draft or a version conflict. Save them or resolve the conflict first.",
  "\u5C1A\u672A\u9009\u62E9\u5F53\u524D\u5E95\u5EA7\u7684\u8FDE\u63A5\u4E0E\u6A21\u578B\uFF0C\u8BF7\u5728\u6B65\u9AA4\u4E0A\u4E0B\u6587\u4E2D\u914D\u7F6E": "No connection and model selected for this backend. Configure them in the step context.",
  "\u5019\u9009\u4EE3\u7801\u5DF2\u63A5\u7EB3": "Candidate code accepted",
  "\u9636\u6BB5\u5DF2\u6D3E\u53D1\uFF0C\u8FD0\u884C\u7ED3\u679C\u4F1A\u81EA\u52A8\u66F4\u65B0": "Step dispatched. Results will update automatically.",
  " \u5DF2\u8FD0\u884C {value1} \u5206 {value2} \u79D2\u3002": " Running for {value1} min {value2} sec.",
  "\u5386\u53F2\u8FD0\u884C\u7684\u6B65\u9AA4": "Step from a previous run",
  "\u6B65\u9AA4\u4E0A\u4E0B\u6587": "Step context",
  "\u9009\u62E9\u6B65\u9AA4": "Select a step",
  "\u6267\u884C\u914D\u7F6E": "Execution settings",
  "\u9009\u62E9\u8FDE\u63A5\u4E0E\u6A21\u578B": "Select a connection and model",
  "\xB7 \u5F53\u524D\u914D\u7F6E": "\xB7 Current settings",
  "\u5F53\u524D\u5E95\u5EA7\uFF1A{backend}\u3002\u8282\u70B9\u8986\u76D6\u4F18\u5148\u4E8E\u6D41\u7A0B\u89D2\u8272\u548C\u9879\u76EE\u9ED8\u8BA4\uFF0C\u66F4\u6362\u914D\u7F6E\u7528\u4E8E\u65B0\u5C1D\u8BD5\u3002": "Current backend: {backend}. Step overrides take precedence over workflow roles and project defaults. Changes apply to new attempts.",
  "\u5F53\u524D\u6F84\u6E05\u4F7F\u7528 {target}\uFF1B\u672A\u91CD\u65B0\u9009\u62E9\u65F6\u6CBF\u7528\u539F\u6267\u884C\u914D\u7F6E\u3002": "This clarification uses {target}. Keep the original execution settings unless you select another target.",
  "\u9879\u76EE\u7AE0\u7A0B": "Project constitution",
  "\u8865\u5145\u5DE5\u7A0B\u89C4\u5219": "Additional engineering rules",
  "\u5F53\u524D\u5185\u5BB9 {hash} \xB7 \u67E5\u770B / \u7F16\u8F91": "Current content {hash} \xB7 View / edit",
  "\u8F93\u5165\u4F9D\u636E": "Input sources",
  "\u5DF2\u4FDD\u5B58\u9700\u6C42\u4E0E\u6587\u6863": "Saved requirements and documents",
  "\u7248\u672C {version} \xB7 {count} \u4EFD\u6587\u6863": "Version {version} \xB7 {count} documents",
  " \xB7 \u672C\u5730\u53E6\u6709\u8349\u7A3F": " \xB7 Local draft available",
  "\u5DF2\u63A5\u7EB3\u4F9D\u636E": "Accepted input",
  "\u5F53\u524D\u5019\u9009": "Current candidate",
  "\u7B49\u5F85\u7B26\u5408\u6761\u4EF6\u7684\u4E0A\u6E38\u4EA7\u7269": "Waiting for an eligible upstream artifact",
  "\u4E0A\u65B9\u4E3A\u5F53\u524D\u6750\u6599\uFF1B\u672C\u6B21\u5386\u53F2\u6267\u884C\u5B9E\u9645\u4F7F\u7528\u7684\u7248\u672C\u89C1\u8FD0\u884C\u8BE6\u60C5\u3002": "The materials above are current. See run details for the versions used by this historical execution.",
  "\u65B0\u5C1D\u8BD5\u56FA\u5B9A\u5F53\u524D\u7AE0\u7A0B\u4E0E\u5DF2\u4FDD\u5B58\u9700\u6C42\uFF1B\u539F\u6267\u884C\u7684\u51BB\u7ED3\u4F9D\u636E\u89C1\u8FD0\u884C\u8BE6\u60C5\u3002": "New attempts freeze the current constitution and saved requirements. See run details for the original execution's frozen inputs.",
  "\u6267\u884C\u76EE\u6807": "Execution objective",
  "\u6267\u884C\u9879\u76EE\u9A8C\u8BC1\u547D\u4EE4\uFF0C\u6838\u5BF9\u9000\u51FA\u7801\u4E0E\u5019\u9009\u4EE3\u7801\u54C8\u5E0C\u3002": "Run the project's verification commands and check exit codes and the candidate code hash.",
  "\u68C0\u67E5\u5DE5\u7A0B\u6761\u4EF6\u5E76\u4FDD\u5B58\u63A5\u7EB3\u51B3\u7B56\u3002": "Check engineering conditions and save the acceptance decision.",
  "\u7B2C {number} \u6B21\u5C1D\u8BD5 \xB7 \u67E5\u770B\u51BB\u7ED3\u8F93\u5165\u4E0E\u8EAB\u4EFD": "Attempt {number} \xB7 View frozen inputs and identity",
  "\u5F53\u524D\u4EFB\u52A1": "Current task",
  "\u56FA\u5B9A\u67E5\u770B": "Pinned view",
  " \xB7 \u5386\u53F2\u8FD0\u884C": " \xB7 Historical run",
  "\u8DDF\u968F\u5F53\u524D\u4EFB\u52A1": "Follow current task",
  "\u5C1A\u65E0\u6B65\u9AA4": "No steps yet",
  "\u56DE\u5230\u5F53\u524D\u4EFB\u52A1": "Back to current task",
  "\u67E5\u770B\u5168\u90E8 {count} \u9879\u5F85\u5904\u7406": "View all {count} pending items",
  "\u5F53\u524D\u8FD0\u884C\u4F7F\u7528\u65E7\u6A21\u677F\uFF1B\u65B0\u7248\u5DF2\u52A0\u5165\u72EC\u7ACB\u9700\u6C42\u6F84\u6E05\u3002\u5386\u53F2\u8FD0\u884C\u4F1A\u4FDD\u7559\u3002": "This run uses an older template. The latest template includes a separate clarification step. Historical runs are retained.",
  "\u5DF2\u521B\u5EFA\u5305\u542B\u9700\u6C42\u6F84\u6E05\u7684\u65B0\u8FD0\u884C\uFF0C\u5386\u53F2\u8BB0\u5F55\u4FDD\u7559": "Created a new run with requirements clarification. History is retained.",
  "\u542F\u7528\u542B\u6F84\u6E05\u7684\u65B0\u6D41\u7A0B": "Start a new workflow with clarification",
  "\u5F53\u524D\u6709\u6548\u901A\u8FC7 {completed} / {total} \u6B65": "Currently valid: {completed} / {total} steps passed",
  "\u5DE5\u4F5C\u9879\u5DF2\u4EA4\u4ED8": "Work item delivered",
  "\u5DE5\u4F5C\u9879\u5C1A\u672A\u4EA4\u4ED8": "Work item not yet delivered",
  "\u5F53\u524D\u6709\u6548\u901A\u8FC7\u6B65\u9AA4": "Currently valid passed steps",
  "\u5F53\u524D\u6709\u6548\u901A\u8FC7 {completed} / {total} \u6B65\uFF1A\u6267\u884C\u5DF2\u7ED3\u675F\u3001\u95E8\u7981\u901A\u8FC7\u4E14\u7248\u672C\u6709\u6548\uFF0C\u9700\u4EBA\u5DE5\u63A5\u7EB3\u7684\u6B65\u9AA4\u5DF2\u63A5\u7EB3\uFF1B{awaitingAcceptance} \u6B65\u5F85\u4EBA\u5DE5\u63A5\u7EB3\uFF0C{stale} \u6B65\u4E0A\u6E38\u5DF2\u53D8\u66F4\u3002\u767E\u5206\u6BD4\u4E0D\u4EE3\u8868\u4EA4\u4ED8\u3002": "{completed} / {total} steps currently valid: execution completed, gates passed, versions current, and required human acceptance recorded. {awaitingAcceptance} steps await human acceptance; upstream inputs changed for {stale} steps. This percentage does not indicate delivery.",
  "{count} \u6B65\u7684\u4E0A\u6E38\u4F9D\u636E\u5DF2\u53D8\u66F4\uFF0C\u6709\u6548\u901A\u8FC7\u8BA1\u6570\u968F\u4E4B\u56DE\u9000\u3002": "Upstream inputs changed for {count} steps, reducing the count of valid passed steps.",
  "\u5F53\u524D\u6B65\u9AA4\u7684\u5DE5\u4F5C\u5185\u5BB9": "Current step workspace",
  "\u8FD0\u884C\u6761\u4EF6": "Run conditions",
  "\u68C0\u67E5\u4E2D": "Checking",
  "\u8BFB\u53D6\u5931\u8D25": "Failed to load",
  "\u670D\u52A1\u7AEF\u6EE1\u8DB3 \xB7 \u672C\u5730\u5F85\u5904\u7406": "Server ready \xB7 Local action needed",
  "\u670D\u52A1\u7AEF\u6EE1\u8DB3": "Server ready",
  "\u670D\u52A1\u7AEF\u6761\u4EF6\u4E0D\u8DB3": "Server conditions unmet",
  "\u91CD\u8BD5\u68C0\u67E5": "Check again",
  "\u4FDD\u5B58\u9700\u6C42 / \u5904\u7406\u51B2\u7A81": "Save requirements / resolve conflicts",
  "\u4FEE\u590D\u9879\u76EE\u7AE0\u7A0B": "Repair project constitution",
  "\u5F53\u524D\u7ED3\u679C\u5DF2\u8FC7\u671F\uFF0C\u4F7F\u7528\u6700\u65B0\u5DF2\u4FDD\u5B58\u4F9D\u636E\u521B\u5EFA\u65B0\u5C1D\u8BD5\u3002": "The current result is stale. Create a new attempt using the latest saved inputs.",
  "\u9700\u8981\u7EE7\u7EED\u6B64\u6B65\u9AA4\u65F6\uFF0C\u8FD0\u884C\u6761\u4EF6\u4ECD\u987B\u5168\u90E8\u6EE1\u8DB3\u3002": "All run conditions must still be met to continue this step.",
  "\u63A5\u7EB3\u5019\u9009\u4EE3\u7801": "Accept candidate code",
  "\u8FD0\u884C\u6240\u9009\u6B65\u9AA4": "Run selected step",
  "\u521B\u5EFA\u65B0\u5C1D\u8BD5": "Create new attempt",
  "\u67E5\u770B {artifact}": "View {artifact}",
  "\u4FEE\u8BA2 {revision} \xB7 \u4EE5\u9009\u5B9A\u4FEE\u8BA2\u7684\u63A5\u7EB3\u72B6\u6001\u4E3A\u51C6": "Revision {revision} \xB7 Acceptance follows the selected revision",
  "\u5DE5\u7A0B\u6D41\u7A0B": "Engineering workflow",
  "{count} \u4E2A\u6B65\u9AA4": "{count} steps",
  "\u5206\u7EC4\u4EC5\u7528\u4E8E\u6D4F\u89C8\uFF0C\u6267\u884C\u987A\u5E8F\u4E0E\u4F9D\u8D56\u8BFB\u53D6\u6D41\u7A0B\u5B9A\u4E49\u3002": "Groups are for browsing. Execution order and dependencies follow the workflow definition.",
  "\u7F16\u8F91\u6D41\u7A0B": "Edit workflow",
  "\u6709\u6548\u901A\u8FC7 {count} / {total}": "Valid: {count} / {total} passed",
  "\u9700\u8981\u5904\u7406": "Action needed",
  "\u5DF2\u4FDD\u5B58\u9700\u6C42 \xB7 \u7248\u672C {version}": "Saved requirements \xB7 Version {version}",
  "{count} \u4EFD\u6587\u6863": "{count} documents",
  " + \u9700\u6C42\u6B63\u6587": " + requirement text",
  " \xB7 \u53E6\u6709\u672C\u5730\u8349\u7A3F\uFF0C\u5C1A\u672A\u4F9B\u65B0\u6267\u884C\u4F7F\u7528": " \xB7 Local draft not yet used by new executions",
  "\u67E5\u770B / \u7F16\u8F91": "View / edit",
  "\u5DE5\u7A0B\u95E8\u7981\u4EE5\u771F\u5B9E\u4EA7\u7269\u7248\u672C\u3001\u9A8C\u8BC1\u8BC1\u636E\u548C\u590D\u6838\u7ED3\u679C\u4E3A\u4F9D\u636E\u3002": "Engineering gates use actual artifact versions, verification evidence, and review results.",
  "\u5F85\u6267\u884C": "Pending",
  "\u542F\u52A8\u4E2D": "Starting",
  "\u8FD0\u884C\u4E2D": "Running",
  "\u5F85\u4EA4\u4E92": "Awaiting interaction",
  "\u5DF2\u7ED3\u675F": "Completed",
  "\u5931\u8D25": "Failed",
  "\u5DF2\u505C\u6B62": "Stopped",
  "\u5F85\u6838\u5BF9": "Needs reconciliation",
  "\u5F85\u68C0\u67E5": "Unchecked",
  "\u901A\u8FC7": "Passed",
  "\u963B\u585E": "Blocked",
  "\u8FC7\u671F": "Stale",
  "\u6267\u884C": "Execution",
  "\u95E8\u7981": "Gate",
  "\u65B0\u9C9C\u5EA6": "Freshness",
  "\u5F53\u524D\u6709\u6548": "Current",
  "\u4E0A\u6E38\u5DF2\u53D8\u66F4": "Upstream changed",
  "\u63A5\u7EB3": "Acceptance",
  "\u4EBA\u5DE5\u5DF2\u63A5\u7EB3": "Accepted by human",
  "\u5F85\u4EBA\u5DE5\u63A5\u7EB3": "Awaiting human acceptance",
  "\u7CFB\u7EDF\u5DF2\u786E\u8BA4": "Confirmed by system",
  "\u65E0\u72EC\u7ACB\u63A5\u7EB3\u52A8\u4F5C": "No separate acceptance required",
  "\u9700\u6C42": "Requirements",
  "\u8BBE\u8BA1": "Design",
  "\u4EFB\u52A1": "Tasks",
  "\u5B9E\u73B0": "Implementation",
  "\u4EA4\u4ED8": "Delivery",
  "\u6D41\u7A0B\u6B65\u9AA4": "Workflow steps",
  "\u6B63\u5728\u68C0\u67E5\u8FD0\u884C\u6761\u4EF6": "Checking run conditions",
  "\u65E0\u6CD5\u68C0\u67E5\u8FD0\u884C\u6761\u4EF6\uFF1A{message}": "Unable to check run conditions: {message}",
  "\u670D\u52A1\u7AEF\u6761\u4EF6\u5C1A\u672A\u6EE1\u8DB3": "Server conditions are not yet met",
  "\u670D\u52A1\u7AEF\u8FD0\u884C\u68C0\u67E5": "Server readiness check",
  "\u6B65\u9AA4\u8BB0\u5F55": "Step record",
  "\u5BA2\u6237\u7AEF\u68C0\u67E5": "Client check",
  "\u57FA\u4E8E\u5F53\u524D\u4F9D\u636E\u91CD\u65B0\u8FD0\u884C": "Rerun with current inputs",
  "\u8FD0\u884C\u6B64\u6B65\u9AA4": "Run this step",
  "\u670D\u52A1\u7AEF\u6761\u4EF6\u6EE1\u8DB3\uFF0C\u672C\u5730\u8F93\u5165\u5C1A\u9700\u5904\u7406\u3002": "Server conditions are met. Local inputs still need attention.",
  "\u8FD0\u884C\u6761\u4EF6\u5DF2\u6EE1\u8DB3\uFF0C\u53EF\u57FA\u4E8E\u5DF2\u4FDD\u5B58\u7684\u6750\u6599\u5F00\u59CB\u3002": "Run conditions are met. Start using the saved materials.",
  "\u65E0\u6CD5\u68C0\u67E5\u8FD0\u884C\u6761\u4EF6\uFF0C\u8BF7\u91CD\u8BD5\u68C0\u67E5\u3002": "Unable to check run conditions. Try again.",
  "\u6B63\u5728\u68C0\u67E5\u8FD0\u884C\u6761\u4EF6\u2026": "Checking run conditions\u2026",
  "\u5F53\u524D\u6B65\u9AA4\u8FD8\u7F3A\u5C11\u8FD0\u884C\u6761\u4EF6\u3002": "This step still has unmet run conditions.",
  "\u67E5\u770B\u4EA4\u4ED8\u8BC1\u636E": "View delivery evidence",
  "\u6B64\u5DE5\u4F5C\u9879\u5DF2\u4EA4\u4ED8\u3002\u6B65\u9AA4\u767E\u5206\u6BD4\u4E0E\u4EA4\u4ED8\u72B6\u6001\u5206\u522B\u8BB0\u5F55\u3002": "This work item has been delivered. Step progress and delivery status are recorded separately.",
  "\u56DE\u7B54\u9700\u6C42\u6F84\u6E05": "Answer requirements questions",
  "\u5904\u7406\u95EE\u9898\u6216\u6388\u6743": "Answer questions or authorize",
  " \xB7 \u8FD8\u6709 {value1} \u9879\u5F85\u5904\u7406": " \xB7 {value1} more pending items",
  "\u6838\u5BF9\u539F\u6267\u884C": "Reconcile original execution",
  "\u67E5\u770B\u672C\u6B21\u6267\u884C": "View this execution",
  "\u539F\u6267\u884C\u72B6\u6001\u5F85\u6838\u5BF9\uFF0C\u8BF7\u5148\u786E\u8BA4\u539F\u6267\u884C\u8EAB\u4EFD\u4E0E\u72B6\u6001\u3002": "The original execution needs reconciliation. Confirm its identity and state first.",
  "\u6B63\u5728\u7B49\u5F85\u4EA4\u4E92\u72B6\u6001\u540C\u6B65\uFF0C\u53EF\u67E5\u770B\u539F\u6267\u884C\u3002": "Waiting for interaction state to sync. You can view the original execution.",
  "\u672C\u6B21\u6267\u884C\u6B63\u5728\u8FDB\u884C\uFF0C\u8FD0\u884C\u8BE6\u60C5\u4FDD\u7559\u539F\u6267\u884C\u8EAB\u4EFD\u4E0E\u53EF\u7528\u63A7\u5236\u3002": "This execution is in progress. Run details retain the original execution identity and available controls.",
  "\u67E5\u770B\u5931\u8D25\u4E0E\u6062\u590D\u5165\u53E3": "View failure and recovery options",
  "\u67E5\u770B\u5DF2\u505C\u6B62\u7684\u6267\u884C": "View stopped execution",
  "\u5148\u68C0\u67E5\u539F\u6267\u884C\u7ED3\u679C\uFF0C\u518D\u51B3\u5B9A\u6062\u590D\u6216\u521B\u5EFA\u65B0\u5C1D\u8BD5\u3002": "Check the original execution result before resuming or creating a new attempt.",
  "\u5BA1\u9605\u5E76\u63A5\u7EB3\u5DF2\u590D\u6838\u4EA7\u7269": "Review and accept reviewed artifact",
  "{title} \xB7 \u5148\u68C0\u67E5\u590D\u6838\u8BC1\u636E\u548C\u63A5\u7EB3\u6761\u4EF6\u3002": "{title} \xB7 Check review evidence and acceptance conditions first.",
  "\u9605\u8BFB\u4EA7\u7269\u4E0E\u63A5\u7EB3\u6761\u4EF6": "Read artifact and acceptance conditions",
  "\u6267\u884C\u5DF2\u7ED3\u675F\uFF0C\u5DE5\u7A0B\u72B6\u6001\u8BF7\u5206\u522B\u67E5\u770B\u95E8\u7981\u3001\u63A5\u7EB3\u4E0E\u65B0\u9C9C\u5EA6\u3002": "Execution completed. Check gate, acceptance, and freshness separately.",
  "\u67E5\u770B\u7ED3\u679C\u4E0E\u8BC1\u636E": "View results and evidence",
  "\u6267\u884C\u5DF2\u7ED3\u675F\uFF1B\u67E5\u770B\u5B8C\u6574\u7ED3\u679C\u53CA\u5176\u51BB\u7ED3\u4F9D\u636E\u3002": "Execution completed. View the full result and its frozen inputs.",
  "\u6D41\u7A0B\u5DF2\u6682\u505C": "Workflow paused",
  "\u6B64\u6D41\u7A0B\u6682\u4E0D\u542F\u52A8\u65B0\u6B65\u9AA4": "New steps are unavailable for this workflow",
  "\u5F53\u524D\u6D41\u7A0B\u4E0D\u4F1A\u542F\u52A8\u65B0\u6B65\u9AA4\uFF0C\u5DF2\u6709\u6267\u884C\u4ECD\u53EF\u67E5\u770B\u548C\u6838\u5BF9\u3002": "This workflow will not start new steps. Existing executions can still be viewed and reconciled.",
  "\u91CD\u8BD5\u8FD0\u884C\u6761\u4EF6\u68C0\u67E5": "Retry run condition check",
  "\u5904\u7406\u9700\u6C42\u8349\u7A3F": "Resolve requirements draft",
  " \u6B64\u6B65\u9AA4\u4F7F\u7528\u7684\u4E0A\u6E38\u4F9D\u636E\u5DF2\u53D8\u66F4\uFF0C\u9700\u8981\u91CD\u65B0\u6838\u5B9E\u3002": " This step's upstream inputs have changed and need to be checked again.",
  " \u6D41\u7A0B\u5DF2\u6682\u505C\u540E\u7EED\u6D3E\u53D1\uFF0C\u5F53\u524D\u6267\u884C\u672A\u56E0\u6B64\u6682\u505C\u3002": " Further dispatch is paused. The current execution continues.",
  "\u5148\u6F84\u6E05\uFF0C\u518D\u8BBE\u8BA1": "Clarify before designing",
  "\u8FD0\u884C\u6B64\u6B65\u9AA4\u68C0\u67E5\u89C4\u683C\u4E2D\u7684\u5173\u952E\u672A\u77E5\u4FE1\u606F\u3002\u6709\u95EE\u9898\u65F6\u5728\u8FD9\u91CC\u56DE\u7B54\uFF1B\u7B54\u590D\u4F1A\u5199\u5165\u65B0\u7684\u89C4\u683C\u7248\u672C\u3002": "Run this step to check key unknowns in the specification. Answer questions here; your answers will be recorded in a new specification revision.",
  "\u65E7\u95EE\u7B54\u4F9D\u636E\u5DF2\u66F4\u65B0": "The previous Q&A inputs have changed",
  "\u8BF7\u57FA\u4E8E\u5F53\u524D\u89C4\u683C\u91CD\u65B0\u8FD0\u884C\u6F84\u6E05\u3002\u5386\u53F2\u95EE\u9898\u548C\u672C\u5730\u7B54\u590D\u8349\u7A3F\u4FDD\u7559\u5728\u4E0B\u65B9\u3002": "Rerun clarification using the current specification. Historical questions and local answer drafts are retained below.",
  "\u9700\u6C42\u6F84\u6E05\u5DF2\u5B8C\u6210": "Requirements clarification complete",
  "{length} \u9879\u7B54\u590D\u5DF2\u8BB0\u5F55\u5230\u4FEE\u8BA2\u540E\u7684\u89C4\u683C\uFF0C\u4E0B\u4E00\u6B65\u590D\u6838\u6B64\u7248\u672C\u3002": "{length} answers recorded in the revised specification. Review this version next.",
  "\u5DF2\u68C0\u67E5\u89C4\u683C\uFF0C\u5F53\u524D\u65E0\u9700\u989D\u5916\u63D0\u95EE\u3002\u4E0B\u4E00\u6B65\u590D\u6838\u6B64\u7248\u672C\u3002": "The specification has been checked. No additional questions are needed. Review this version next.",
  "\u67E5\u770B\u4FEE\u8BA2\u89C4\u683C": "View revised specification",
  "\u6B63\u5728\u5206\u6790\u6F84\u6E05\u4F9D\u636E": "Analyzing clarification inputs",
  "\u5206\u6790\u89C4\u683C\u548C\u5DF2\u63D0\u4EA4\u7684\u7B54\u590D\uFF0C\u68C0\u67E5\u662F\u5426\u8FD8\u9700\u8981\u786E\u8BA4\u5173\u952E\u51B3\u7B56\u3002": "Analyzing the specification and submitted answers to identify any remaining key decisions.",
  "\u67E5\u770B\u5386\u53F2\u95EE\u7B54\u4E0E\u7B54\u590D\u8349\u7A3F": "View historical Q&A and answer drafts",
  "\u67E5\u770B\u5386\u53F2\u95EE\u7B54": "View historical Q&A",
  "\u5C1A\u672A\u8BB0\u5F55\u7B54\u590D": "No answer recorded yet",
  "\u7B54\u590D\u8349\u7A3F\u5DF2\u4FDD\u5B58\u5230\u5DE5\u7A0B\u8BB0\u5F55": "Answer draft saved to project records",
  "\uFF1B\u5F53\u524D\u9875\u9762\u8349\u7A3F\u4ECD\u4FDD\u7559": "; the draft on this page is retained",
  "\u6B63\u5728\u4FDD\u5B58\u7B54\u590D\u8349\u7A3F\u2026": "Saving answer draft\u2026",
  "\u7B54\u590D\u5DF2\u8BB0\u5F55\uFF0C\u6B63\u5728\u7EE7\u7EED\u6F84\u6E05\u5E76\u4FEE\u8BA2\u89C4\u683C": "Answers recorded. Continuing clarification and revising the specification.",
  "\u9700\u6C42\u6F84\u6E05\u95EE\u7B54": "Requirements clarification Q&A",
  "\u786E\u8BA4\u5F71\u54CD\u8BBE\u8BA1\u7684\u5173\u952E\u95EE\u9898": "Confirm decisions that affect the design",
  "\u672C\u8F6E {count} \u4E2A\u95EE\u9898 \xB7 \u4F1A\u8BDD\u7D2F\u8BA1 {total} / 5": "{count} questions this round \xB7 {total} / 5 in this session",
  "\xB7 \u5DF2\u7B54\u590D": "\xB7 Answered",
  "\u4F60\u7684\u7B54\u590D": "Your answer",
  "\u6F84\u6E05\u7B54\u590D {id}": "Clarification answer {id}",
  "\u9009\u62E9\u5EFA\u8BAE\u7B54\u590D\uFF0C\u6216\u5199\u4E0B\u4F60\u7684\u51B3\u5B9A\u3002\u4E0D\u786E\u5B9A\u65F6\u8BF4\u660E\u76EE\u524D\u672A\u77E5\u7684\u4FE1\u606F\u3002": "Choose a suggested answer or write your decision. If you are unsure, describe what is still unknown.",
  "\u8BF7\u5148\u4FDD\u5B58\u9700\u6C42\u8349\u7A3F\u6216\u4FEE\u590D\u9879\u76EE\u7AE0\u7A0B\u8BFB\u53D6\u95EE\u9898\uFF0C\u518D\u63D0\u4EA4\u6F84\u6E05\u7B54\u590D\u3002": "Save the requirements draft or fix the project constitution before submitting clarification answers.",
  "\u6D4F\u89C8\u5668\u5B58\u50A8\u4E0D\u53EF\u7528\uFF0C\u672A\u540C\u6B65\u7684\u7B54\u590D\u4EC5\u4FDD\u7559\u5728\u5F53\u524D\u7A97\u53E3\u3002\u8BF7\u7B49\u5F85\u8349\u7A3F\u540C\u6B65\u5230\u5DE5\u7A0B\u8BB0\u5F55\u540E\u518D\u5173\u95ED\u7A97\u53E3\u3002": "Browser storage is unavailable. Unsynced answers are kept only in this window. Wait for the draft to sync to project records before closing.",
  "\u5DF2\u6BD4\u8F83\uFF0C\u4FDD\u5B58\u6211\u7684\u8349\u7A3F": "Compared. Save my draft",
  "\u67E5\u770B\u5DF2\u4FDD\u5B58\u7684\u7B54\u590D\u8349\u7A3F": "View saved answer draft",
  "\u672A\u586B\u5199": "Not answered",
  "\u672C\u8F6E\u95EE\u7B54\u5DF2\u4FDD\u7559\u4E3A\u5386\u53F2\uFF0C\u53EF\u4EE5\u91CD\u65B0\u8FD0\u884C\u9700\u6C42\u6F84\u6E05": "This round's Q&A is retained in history. You can rerun requirements clarification.",
  "\u91CD\u65B0\u5206\u6790": "Analyze again",
  "\u63D0\u4EA4\u7B54\u590D\u5E76\u7EE7\u7EED\u6F84\u6E05": "Submit answers and continue clarification",
  "\u7B54\u590D\u5DF2\u63D0\u4EA4\uFF0C\u6267\u884C\u7ED3\u679C\u4EE5\u5E95\u5EA7\u786E\u8BA4\u72B6\u6001\u4E3A\u51C6": "Answer submitted. Execution results follow the backend's confirmed state.",
  "\u65E0\u6CD5\u89E3\u6790\u6267\u884C\u8BF7\u6C42": "Unable to parse execution request",
  "\u8BF7\u6C42\u5B57\u6BB5\u4E0D\u5B8C\u6574\u3002\u8BF7\u4FDD\u7559\u539F\u6267\u884C\u5E76\u6838\u5BF9\uFF0C\u5C1A\u672A\u63D0\u4EA4\u4EFB\u4F55\u7B54\u590D\u3002": "Required request fields are missing. Retain and reconcile the original execution. No answer has been submitted.",
  "\u67E5\u770B\u539F\u59CB\u8BF7\u6C42": "View raw request",
  "\u5F85\u5904\u7406\u6267\u884C\u4EA4\u4E92": "Pending execution interaction",
  "\u8865\u5145\u5DE5\u7A0B\u4FE1\u606F": "Provide engineering information",
  "\u5B8C\u6210\u6267\u884C\u4FE1\u606F": "Complete execution information",
  "\u786E\u8BA4\u5DE5\u5177\u64CD\u4F5C": "Confirm tool operation",
  "\u786E\u8BA4\u6267\u884C\u8303\u56F4": "Confirm execution scope",
  "\u6267\u884C\u95EE\u9898 {value1}": "Execution question {value1}",
  "\u8BF7\u9009\u62E9": "Select an option",
  "\u672C\u6B21\u8BF7\u6C42\u9700\u8981\u660E\u786E\u6388\u6743\u3002": "This request requires explicit authorization.",
  "\u8BF7\u6C42\u53C2\u6570": "Request parameters",
  "\u5B58\u50A8\u4E0D\u53EF\u7528\uFF0C\u8349\u7A3F\u4EC5\u4FDD\u7559\u5728\u5F53\u524D\u7A97\u53E3\u3002": "Storage is unavailable. The draft is kept only in this window.",
  "\u63D0\u4EA4\u4E2D\u2026": "Submitting\u2026",
  "\u63D0\u4EA4\u56DE\u7B54": "Submit answers",
  "\u63D0\u4EA4\u8868\u5355": "Submit form",
  "\u62D2\u7EDD": "Decline",
  "Enter \u6362\u884C \xB7 Ctrl/Cmd+Enter \u63D0\u4EA4": "Enter for a new line \xB7 Ctrl/Cmd+Enter to submit",
  "\u5141\u8BB8\u4E00\u6B21": "Allow once",
  "\u505C\u6B62\u8BF7\u6C42\u5DF2\u63D0\u4EA4\uFF0C\u4EE5\u786E\u8BA4\u540E\u7684\u6267\u884C\u72B6\u6001\u4E3A\u51C6": "Stop requested. The confirmed execution state is authoritative.",
  "\u6062\u590D\u8BF7\u6C42\u5DF2\u63D0\u4EA4\uFF0C\u4FDD\u7559\u539F\u6267\u884C\u8EAB\u4EFD\u94FE": "Resume requested. The original execution identity chain is retained.",
  "\u5DF2\u63D0\u4EA4\u539F\u6267\u884C\u6838\u5BF9\u8BF7\u6C42": "Original execution reconciliation requested",
  "\u8FD8\u6CA1\u6709\u8FD0\u884C\u8BB0\u5F55": "No run history yet",
  "\u6BCF\u6B21\u5C1D\u8BD5\u4FDD\u7559\u56FA\u5B9A\u8F93\u5165\u3001\u6A21\u578B\u76EE\u6807\u4E0E\u6267\u884C\u8EAB\u4EFD\u3002": "Each attempt retains frozen inputs, its model target, and execution identity.",
  "\u8FD0\u884C\u8BE6\u60C5": "Run details",
  "\u6B63\u5728\u8BFB\u53D6\u5B8C\u6574\u8FD0\u884C\u6750\u6599\u2026": "Loading complete run materials\u2026",
  "\u65E0\u6CD5\u8BFB\u53D6\u5B8C\u6574\u8FD0\u884C\u6750\u6599": "Unable to load complete run materials",
  "\u91CD\u65B0\u8BFB\u53D6\u8BE6\u60C5": "Reload details",
  "\u5386\u53F2\u6B65\u9AA4": "Historical step",
  "\u5C1D\u8BD5 {number}": "Attempt {number}",
  "\u6240\u5C5E\u6B65\u9AA4\u5F53\u524D\u72B6\u6001": "Current state of the parent step",
  "\u8F93\u5165 Token": "Input tokens",
  "\u8F93\u51FA Token": "Output tokens",
  "\u5B9E\u9645\u8D39\u7528": "Actual cost",
  "\u4E0D\u8C03\u7528 API": "No API call",
  "\u672A\u77E5": "Unknown",
  "\u6267\u884C\u8EAB\u4EFD": "Execution identity",
  "\u6062\u590D\u7ED1\u5B9A": "Resume binding",
  "\u521D\u59CB\u7ED1\u5B9A": "Initial binding",
  "\u5C1A\u672A\u53D6\u5F97\u6267\u884C\u8EAB\u4EFD\uFF0C\u4E0D\u80FD\u636E\u6B64\u91CD\u590D\u6D3E\u53D1\u3002": "No execution identity has been obtained. Do not use this as a reason to dispatch again.",
  "\u672C\u6B21\u4F7F\u7528\u7684\u9700\u6C42": "Requirements used by this attempt",
  "\u5386\u53F2\u7248\u672C": "Historical version",
  " \xB7 \u5F53\u524D\u9700\u6C42\u5DF2\u66F4\u65B0": " \xB7 Current requirements have changed",
  "\u672C\u6B21\u4F7F\u7528\u7684\u9879\u76EE\u7AE0\u7A0B": "Project constitution used by this attempt",
  "\u5185\u5BB9": "Content",
  " \xB7 \u5F53\u524D\u7AE0\u7A0B\u5DF2\u66F4\u65B0": " \xB7 Current constitution has changed",
  "\u53CC\u89C6\u89D2\u590D\u6838\u62A5\u544A": "Review reports from both perspectives",
  "\u67E5\u770B\u56FA\u5B9A\u8F93\u5165\u4E0E\u4E0A\u4E0B\u6587": "View frozen inputs and context",
  "\u8F93\u5165\u54C8\u5E0C": "Input hash",
  "\u9636\u6BB5\u8F93\u51FA": "Step output",
  "\u6B63\u5728\u63D0\u4EA4\u63A7\u5236\u8BF7\u6C42\u2026": "Submitting control request\u2026",
  "\u505C\u6B62\u672C\u6B21\u6267\u884C": "Stop this execution",
  "\u6062\u590D\u539F\u6267\u884C": "Resume original execution",
  "{backend} \u4E0D\u652F\u6301\u6062\u590D\u539F\u6267\u884C\uFF1B\u53EF\u5148\u6838\u5BF9\u7ED3\u679C\uFF0C\u518D\u521B\u5EFA\u65B0\u5C1D\u8BD5\u3002": "{backend} does not support resuming the original execution. Reconcile its result before creating a new attempt.",
  "\u539F\u6267\u884C\u72B6\u6001\u5C1A\u672A\u786E\u8BA4\u3002\u8BF7\u5148\u6838\u5BF9\u8EAB\u4EFD\uFF0C\u907F\u514D\u521B\u5EFA\u91CD\u590D\u6267\u884C\u3002": "The original execution state is unconfirmed. Reconcile its identity first to avoid duplicate execution.",
  "\u6B63\u5728\u66F4\u65B0\u8FD0\u884C\u8BE6\u60C5\u2026": "Updating run details\u2026",
  "\u9700\u8981\u4FEE\u8BA2": "Revision needed",
  "\u8BC1\u636E\u4E0D\u8DB3": "Insufficient evidence",
  "\u9700\u6C42\u8986\u76D6\u68C0\u67E5": "Requirements coverage check",
  "\u53CD\u4F8B\u4E0E\u5931\u8D25\u8DEF\u5F84\u68C0\u67E5": "Counterexample and failure path check",
  "\u5F85\u786E\u8BA4": "Needs confirmation",
  "\u8BC1\u636E\u4E0E\u53CD\u4F8B": "Evidence and counterexamples",
  "\u53CD\u4F8B\uFF1A": "Counterexample:",
  "\u5DF2\u6392\u9664": "Ruled out",
  "\u5DF2\u590D\u73B0": "Reproduced",
  "\u5C1A\u672A\u6838\u9A8C": "Not yet verified",
  "\u5386\u53F2\u95EE\u9898\u590D\u9A8C \xB7 {count}": "Historical finding recheck \xB7 {count}",
  "\u5DF2\u4FEE\u590D": "Fixed",
  "\u672A\u89E3\u51B3": "Unresolved",
  "\u590D\u6838\u6279\u6B21 {group} \xB7 \u4E24\u4EFD\u72EC\u7ACB\u8BC1\u636E\u5171\u540C\u51B3\u5B9A\u95E8\u7981": "Review group {group} \xB7 Two independent reports determine the gate",
  "\u8FD0\u884C\u8BB0\u5F55": "Run history",
  "\u6B65\u9AA4": "Step",
  "\u7B5B\u9009\u8FD0\u884C\u6B65\u9AA4": "Filter runs by step",
  "\u5168\u90E8\u6B65\u9AA4": "All steps",
  "\u72B6\u6001": "State",
  "\u7B5B\u9009\u8FD0\u884C\u72B6\u6001": "Filter runs by state",
  "\u5168\u90E8\u72B6\u6001": "All states",
  "\u6B63\u5728\u8BFB\u53D6\u8FD0\u884C\u5217\u8868": "Loading run list",
  "\u91CD\u8BD5\u8BFB\u53D6\u5217\u8868": "Reload run list",
  "\u6CA1\u6709\u5339\u914D\u7684\u8FD0\u884C\u8BB0\u5F55\u3002": "No matching runs.",
  "\u8FD0\u884C\u6B65\u9AA4\u540E\uFF0C\u5C1D\u8BD5\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC\u3002": "Attempts will appear here after you run a step.",
  "\u9700\u6C42\u8986\u76D6": "Requirements coverage",
  "\u53CD\u4F8B\u68C0\u67E5": "Counterexample check",
  "\u4E0A\u4E00\u9875": "Previous",
  "0 \u9879": "0 items",
  "\u4E0B\u4E00\u9875": "Next",
  "\u6B65\u9AA4\u7684\u56DB\u9879\u5DE5\u7A0B\u4E8B\u5B9E": "The step's four engineering facts",
  "{label} \xB7 \u670D\u52A1\u7AEF\u539F\u503C {raw}": "{label} \xB7 Raw server value: {raw}",
  "{length} \u4E2A\u95EE\u9898 \xB7 \u89C4\u683C {value2}": "{length} questions \xB7 Specification {value2}",
  "\u56DE\u7B54\u6267\u884C\u95EE\u9898": "Answer execution questions",
  "\u586B\u5199\u6267\u884C\u8868\u5355": "Complete execution form",
  "\u786E\u8BA4\u672C\u6B21\u5DE5\u5177\u64CD\u4F5C": "Confirm this tool operation",
  "\u6267\u884C\u8BF7\u6C42": "Execution request",
  "{value1} \xB7 \u5C1D\u8BD5 {value2}": "{value1} \xB7 Attempt {value2}",
  "\u5904\u7406\u963B\u585E\u53D1\u73B0": "Resolve blocking finding",
  "\u5BA1\u9605\u590D\u6838\u8B66\u544A": "Review warning",
  "\u5BA1\u9605": "Review",
  "\u4F9D\u636E\u5DF2\u53D8\u66F4": "Inputs changed",
  "\u5DF2\u6709\u72EC\u7ACB\u590D\u6838": "Independent review available",
  "\u9700\u8981\u72EC\u7ACB\u590D\u6838": "Independent review required",
  "\u7248\u672C {value1} \xB7 {value2}": "Version {value1} \xB7 {value2}",
  "\u8865\u4E01": "Patch",
  "Sandbox \u793A\u4F8B": "Sandbox demo",
  "\u5C1A\u672A\u914D\u7F6E": "Not configured",
  "\u5176\u4ED6\u7F16\u8F91\u8005\u5DF2\u66F4\u65B0\u7B54\u590D\u8349\u7A3F\uFF0C\u8BF7\u6BD4\u8F83\u540E\u4FDD\u5B58": "Another editor updated the answer draft. Compare it before saving.",
  "\u7B54\u590D\u8349\u7A3F\u4ECD\u5728\u4FDD\u5B58\uFF0C\u8BF7\u7B49\u5F85\u540E\u518D\u5904\u7406\u51B2\u7A81": "The answer draft is still saving. Wait before resolving the conflict.",
  "\uFF1A": ": ",
  "\u672C\u5730\u9A8C\u6536\u540E\u7AEF": "Local acceptance backend"
};

// packages/i18n/server.ts
var messages4 = {
  "\u6682\u65F6\u5185\u7F6E\u4ECE\u7B7E\u540D\u6B63\u5F0F\u6E90\u7801\u6784\u5EFA\u7684 Maka 0.2.0 Runtime Host\uFF0C\u540E\u7EED\u5207\u6362\u5230\u6B63\u5F0F npm \u4F9D\u8D56\uFF1B\u59CB\u7EC8\u7981\u6B62\u5F00\u53D1\u6216\u9884\u53D1\u5E03\u7248\u672C\u3002": "The bundled Maka 0.2.0 Runtime Host is built from the signed official source release until an official npm package is available. Development and prerelease builds are always prohibited.",
  "\u89C4\u683C\u9A71\u52A8\u5F00\u53D1": "Specification-driven Development",
  "\u9700\u6C42\u89C4\u683C": "Requirements Specification",
  "\u9700\u6C42\u6F84\u6E05": "Requirements Clarification",
  "\u89C4\u683C\u590D\u6838": "Specification Review",
  "\u5DE5\u7A0B\u8BBE\u8BA1": "Engineering Design",
  "\u8BBE\u8BA1\u590D\u6838": "Design Review",
  "\u4EFB\u52A1\u62C6\u89E3": "Task Breakdown",
  "\u4EFB\u52A1\u590D\u6838": "Task Review",
  "\u4EE3\u7801\u5B9E\u73B0": "Implementation",
  "\u6D4B\u8BD5\u4E0E\u68C0\u67E5": "Tests and Checks",
  "\u4EE3\u7801\u590D\u6838": "Code Review",
  "\u6536\u655B\u4E0E\u5BF9\u9F50": "Convergence and Alignment",
  "\u6536\u655B\u590D\u6838": "Convergence Review",
  "\u63A5\u7EB3\u4EE3\u7801": "Accept Code",
  "\u8282\u70B9 ID \u91CD\u590D": "Duplicate node ID",
  "\u4E0A\u6E38\u672A\u63D0\u4F9B {0}": "An upstream node does not provide {0}",
  "\u6A21\u578B\u8282\u70B9\u9700\u8981\u914D\u7F6E\u89D2\u8272": "Model nodes require a role",
  "\u590D\u6838\u5FC5\u987B\u58F0\u660E\u5F53\u524D\u5019\u9009\u4EA7\u7269\uFF0C\u5DF2\u63A5\u7EB3\u8F93\u5165\u4EC5\u4F5C\u4E3A\u53C2\u8003\u4F9D\u636E": "A review must declare the current candidate artifact; accepted inputs are references only",
  "\u9700\u6C42\u6F84\u6E05\u4F7F\u7528 analyst \u89D2\u8272\uFF0C\u8BFB\u53D6\u5019\u9009 spec \u5E76\u4FEE\u8BA2 spec": "Requirements clarification must use the analyst role, read the candidate spec and revise spec",
  "{0} \u9700\u8981\u5728\u540E\u7EED\u6A21\u578B\u6D88\u8D39\u524D\u72EC\u7ACB\u590D\u6838": "{0} requires independent review before a later model consumes it",
  "\u6D41\u7A0B\u8981\u6C42\u5728\u89C4\u683C\u590D\u6838\u548C\u5DE5\u7A0B\u8BBE\u8BA1\u524D\u5B8C\u6210\u9700\u6C42\u6F84\u6E05": "This workflow requires requirements clarification before specification review and engineering design",
  "\u6D88\u8D39\u89C4\u683C\u7684\u590D\u6838\u6216\u8BBE\u8BA1\u6B65\u9AA4\u5FC5\u987B\u4F4D\u4E8E\u9700\u6C42\u6F84\u6E05\u4E4B\u540E": "Steps that consume the specification must follow requirements clarification",
  "\u6D41\u7A0B\u7F3A\u5C11\u5FC5\u9700\u9A8C\u8BC1\u8282\u70B9": "The workflow is missing a required verification node",
  "\u4EFB\u52A1\u4E0D\u80FD\u4F9D\u8D56\u81EA\u8EAB": "A task cannot depend on itself",
  "\u4EFB\u52A1\u6587\u6863\u9700\u8981 - [ ] T001 \u5F62\u5F0F\u7684\u4EFB\u52A1\u548C\u9A8C\u6536\u6761\u4EF6": "The task document must contain tasks in the - [ ] T001 format with acceptance conditions",
  "\u4EFB\u52A1 ID \u5FC5\u987B\u552F\u4E00": "Task IDs must be unique",
  "\u4EFB\u52A1\u4F9D\u8D56\u7F3A\u5931\u6216\u5F62\u6210\u73AF": "Task dependencies are missing or contain a cycle",
  "\u6587\u6863\u6B63\u5728\u63A5\u7EB3\u6216\u96C6\u6210\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5": "Documents are being accepted or integrated. Try again later",
  "\u4EE3\u7801\u6B63\u5728\u96C6\u6210\uFF0C\u8BF7\u5B8C\u6210\u540E\u518D\u4FEE\u8BA2\u6587\u6863": "Code is being integrated. Wait before revising documents",
  "\u4EA7\u7269\u540D\u79F0\u683C\u5F0F\u4E0D\u5408\u6CD5": "Invalid artifact name format",
  "\u4EA7\u7269\u63A5\u7EB3\u6B63\u5728\u6267\u884C": "Artifact acceptance is in progress",
  "\u4EA7\u7269\u5DF2\u53D8\u5316\uFF0C\u8BF7\u6BD4\u8F83\u6700\u65B0\u5185\u5BB9": "The artifact has changed. Compare the latest content",
  "\u89C4\u683C\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u91CD\u65B0\u6F84\u6E05": "The specification has changed. Run clarification again",
  "\u9605\u8BFB\u526F\u672C\u5199\u5165\u5931\u8D25\uFF0C\u5B8C\u6574\u6587\u6863\u4E0E\u64CD\u4F5C\u8BB0\u5F55\u5DF2\u4FDD\u7559\uFF1B\u8BF7\u4FEE\u590D\u76EE\u5F55\u6216\u6743\u9650\u540E\u91CD\u8BD5\u63A5\u7EB3": "Could not write the reading copy. The complete document and operation record are preserved; fix the directory or permissions, then retry acceptance",
  "\u7F3A\u5C11 {0}": "Missing {0}",
  "{0} \u5C1A\u672A\u63A5\u7EB3": "{0} has not been accepted",
  "{0} \u5DF2\u7F16\u8F91\uFF0C\u5F53\u524D\u7248\u672C\u5C1A\u672A\u63A5\u7EB3": "{0} was edited and its current revision has not been accepted",
  "{0} \u4F9D\u8D56\u7684\u9700\u6C42\u3001\u7AE0\u7A0B\u6216\u4E0A\u6E38\u7248\u672C\u5DF2\u53D8\u5316": "The requirements, guidance or upstream revision used by {0} has changed",
  "{0} \u6709\u672A\u89E3\u51B3\u7684\u590D\u6838\u53D1\u73B0": "{0} has unresolved review findings",
  "\u4E0A\u6E38\u4EA7\u7269\u5DF2\u53D8\u66F4\uFF0C\u8BF7\u521B\u5EFA\u65B0\u5C1D\u8BD5\u6216\u91CD\u65B0\u68C0\u67E5": "An upstream artifact has changed. Create a new attempt or check again",
  "\u4EE3\u7801\u6B63\u5728\u96C6\u6210\uFF0C\u8BF7\u5B8C\u6210\u540E\u518D\u63A5\u7EB3\u6587\u6863": "Code is being integrated. Wait before accepting documents",
  "\u4EA7\u7269\u6B63\u5728\u63A5\u7EB3": "Artifact acceptance is in progress",
  "\u4EA7\u7269\u7248\u672C\u5DF2\u53D8\u5316": "The artifact revision has changed",
  "\u4EA7\u7269\u4F9D\u8D56\u7684\u9700\u6C42\u3001\u7AE0\u7A0B\u6216\u4E0A\u6E38\u5DF2\u8FC7\u671F": "The requirements, guidance or upstream dependencies of this artifact are stale",
  "\u4EA7\u7269\u5185\u5BB9\u4E0D\u8DB3\u6216\u4ECD\u6709\u672A\u51B3\u95EE\u9898": "The artifact lacks sufficient content or still has unresolved questions",
  "\u5F53\u524D\u7248\u672C\u9700\u8981\u53CC\u89C6\u89D2\u72EC\u7ACB\u590D\u6838\u540E\u624D\u80FD\u63A5\u7EB3": "The current revision requires independent review from both perspectives before acceptance",
  "\u5F53\u524D\u7248\u672C\u4ECD\u6709\u963B\u585E\u590D\u6838\u53D1\u73B0": "The current revision still has blocking review findings",
  "\u5DE5\u4F5C\u7A7A\u95F4\u6587\u6863\u5728\u5E94\u7528\u5916\u53D1\u751F\u53D8\u66F4\uFF0C\u8BF7\u5BFC\u5165\u5E76\u6BD4\u8F83\u540E\u518D\u63A5\u7EB3": "A workspace document changed outside the app. Import and compare it before accepting",
  "\u63A5\u7EB3\u671F\u95F4\u9700\u6C42\u3001\u7AE0\u7A0B\u6216\u4E0A\u6E38\u5DF2\u53D8\u5316": "Requirements, guidance or upstream artifacts changed during acceptance",
  "\u6587\u6863\u5728\u5199\u5165\u524D\u53D1\u751F\u53D8\u5316": "The document changed before it could be written",
  "\u63A5\u7EB3\u76EE\u6807\u5DF2\u53D8\u5316": "The acceptance target has changed",
  "\u63A5\u7EB3\u76EE\u6807\u4F9D\u8D56\u7684\u9700\u6C42\u3001\u7AE0\u7A0B\u6216\u4E0A\u6E38\u5DF2\u8FC7\u671F": "The requirements, guidance or upstream dependencies of the acceptance target are stale",
  "\u8BF7\u5148\u751F\u6210\u9700\u6C42\u89C4\u683C\uFF0C\u518D\u5B8C\u6210\u9700\u6C42\u6F84\u6E05": "Generate the requirements specification before completing clarification",
  "\u5F53\u524D\u89C4\u683C\u5C1A\u672A\u5B8C\u6210\u9700\u6C42\u6F84\u6E05\uFF0C\u8BF7\u5148\u8FD0\u884C\u6F84\u6E05\u5E76\u63D0\u4EA4\u5FC5\u8981\u7B54\u590D": "The current specification has not completed clarification. Run clarification and submit the required answers",
  "{0} \u5FC5\u987B\u662F\u5927\u5C0F\u4E0D\u8D85\u8FC7 128 KiB \u7684\u6587\u672C\u6587\u4EF6": "{0} must be a text file no larger than 128 KiB",
  "{0} \u8D85\u8FC7 128 KiB": "{0} exceeds 128 KiB",
  "{0} \u5FC5\u987B\u4F7F\u7528 UTF-8 \u7F16\u7801": "{0} must use UTF-8 encoding",
  "{0} \u4E3A\u7A7A\u6216\u5305\u542B\u4E8C\u8FDB\u5236\u5185\u5BB9": "{0} is empty or contains binary data",
  "\u9879\u76EE\u7AE0\u7A0B\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u91CD\u65B0\u5206\u6790\u9700\u6C42": "Project guidance has changed. Analyze the requirements again",
  "\u9879\u76EE\u7AE0\u7A0B\u6216\u5DE5\u7A0B\u89C4\u5219\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u57FA\u4E8E\u5F53\u524D\u7248\u672C\u91CD\u65B0\u68C0\u67E5": "Project guidance or rules have changed. Check again using the current revision",
  "\u9879\u76EE\u7AE0\u7A0B\u5FC5\u987B\u662F\u975E\u7A7A UTF-8 \u6587\u672C\uFF0C\u5927\u5C0F\u4E0D\u8D85\u8FC7 128 KiB": "Project guidance must be non-empty UTF-8 text no larger than 128 KiB",
  "\u9879\u76EE\u7AE0\u7A0B\u6B63\u5728\u4FDD\u5B58": "Project guidance is being saved",
  "\u9879\u76EE\u7AE0\u7A0B\u5DF2\u5728\u5E94\u7528\u5916\u66F4\u65B0\uFF0C\u8BF7\u5237\u65B0\u5E76\u6BD4\u8F83\u540E\u4FDD\u5B58": "Project guidance changed outside the app. Refresh and compare it before saving",
  "\u9879\u76EE\u7AE0\u7A0B\u5728\u4FDD\u5B58\u671F\u95F4\u5DF2\u53D8\u5316": "Project guidance changed while it was being saved",
  "\u4ED3\u5E93 {0}": "Repository {0}",
  "\u7528\u6237\u4E0A\u4F20": "Uploaded by user",
  "\u7528\u6237\u7F16\u5199": "Written by user",
  "\u9700\u6C42\u6B63\u6587\u4E0D\u80FD\u5305\u542B\u4E8C\u8FDB\u5236\u5185\u5BB9": "Requirements cannot contain binary data",
  "\u6700\u591A\u6DFB\u52A0 20 \u4EFD\u6587\u6863\uFF0C\u6587\u6863\u6807\u8BC6\u5FC5\u987B\u552F\u4E00": "Add at most 20 documents with unique IDs",
  "\u8BF7\u586B\u5199\u9700\u6C42\u6B63\u6587\u6216\u6DFB\u52A0\u9700\u6C42\u6587\u6863": "Enter requirements or add requirement documents",
  "\u6587\u6863\u9700\u8981\u540D\u79F0\uFF0C\u652F\u6301 Markdown \u548C TXT": "Documents need a name and must use Markdown or TXT",
  "\u6BCF\u4EFD\u9700\u6C42\u6587\u6863\u4E0D\u80FD\u8D85\u8FC7 512 KiB": "Each requirement document must be no larger than 512 KiB",
  "\u4ED3\u5E93\u6587\u6863\u7F3A\u5C11\u76F8\u5BF9\u8DEF\u5F84": "The repository document has no relative path",
  "\u9700\u6C42\u6B63\u6587\u548C\u6587\u6863\u5408\u8BA1\u4E0D\u80FD\u8D85\u8FC7 1 MiB": "Requirements and documents must not exceed 1 MiB in total",
  "\u6B64\u5DE5\u4F5C\u9879\u5DF2\u63A5\u7EB3\uFF0C\u8BF7\u65B0\u5EFA\u5DE5\u4F5C\u9879\u8BB0\u5F55\u540E\u7EED\u9700\u6C42": "This work item is accepted. Create a new work item for further requirements",
  "\u9700\u6C42\u5DF2\u6709\u65B0\u7248\u672C\uFF0C\u8349\u7A3F\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u6BD4\u8F83\u6700\u65B0\u9700\u6C42\u540E\u518D\u4FDD\u5B58": "A newer requirements revision exists. Your draft is preserved; compare the latest requirements before saving",
  "\u9700\u6C42\u8F93\u5165\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u91CD\u65B0\u751F\u6210\u89C4\u683C\u5E76\u6F84\u6E05": "Requirements inputs changed. Generate the specification and clarify it again",
  "\u9700\u6C42\u8F93\u5165\u5DF2\u53D8\u66F4\uFF0C\u8BF7\u57FA\u4E8E\u65B0\u9700\u6C42\u91CD\u65B0\u5206\u6790\u6216\u590D\u6838": "Requirements inputs changed. Analyze or review the new requirements",
  "\u4ED3\u5E93\u9700\u6C42\u6587\u6863\u4EC5\u652F\u6301 Markdown \u548C TXT": "Repository requirement documents support Markdown and TXT only",
  "\u8BF7\u9009\u62E9\u4E00\u4E2A\u9700\u6C42\u6587\u6863\u6587\u4EF6": "Select a requirement document file",
  "\u9700\u6C42\u6587\u6863\u5FC5\u987B\u4F7F\u7528 UTF-8 \u7F16\u7801": "Requirement documents must use UTF-8 encoding",
  "\u590D\u6838\u4F9D\u636E\u5305\u542B\u4E92\u76F8\u51B2\u7A81\u7684\u4E0A\u6E38\u7248\u672C": "Review references contain conflicting upstream revisions",
  "\u4EE3\u7801\u590D\u6838\u81F3\u5C11\u9700\u8981\u4E00\u4E2A\u5DF2\u914D\u7F6E\u7684\u786E\u5B9A\u6027\u9A8C\u8BC1\u547D\u4EE4": "Code review requires at least one configured deterministic verification command",
  "\u590D\u6838\u7F3A\u5C11\u5F53\u524D\u4EE3\u7801\u7684\u6709\u6548 {0} \u9A8C\u8BC1\uFF0C\u8BF7\u5148\u8FD0\u884C\u6D4B\u8BD5\u4E0E\u68C0\u67E5": "The current code has no valid {0} verification. Run Tests and Checks first",
  "\u672C\u5730\u9A8C\u6536\u540E\u7AEF": "Local Acceptance Backend",
  "\u786E\u5B9A\u6027\u9A8C\u6536\u540E\u7AEF\uFF0C\u4E0D\u8C03\u7528\u6A21\u578B\uFF1B\u4EC5\u5141\u8BB8\u7528\u4E8E\u793A\u4F8B\u4ED3\u5E93\u548C\u5951\u7EA6\u6D4B\u8BD5": "Deterministic acceptance backend without model calls; restricted to the demo repository and contract tests",
  "\u4ECD\u6709\u672A\u89E3\u51B3\u95EE\u9898\u6216\u5360\u4F4D\u7B26\uFF0C\u8BF7\u4FEE\u8BA2\u540E\u91CD\u65B0\u590D\u6838": "Unresolved questions or placeholders remain. Revise and review again",
  "\u9A8C\u6536\u540E\u7AEF\u8FDB\u7A0B\u91CD\u542F\uFF1B\u8BF7\u521B\u5EFA\u65B0\u7684\u786E\u5B9A\u6027\u5C1D\u8BD5": "The acceptance backend restarted. Create a new deterministic attempt",
  "\u9A8C\u6536\u540E\u7AEF\u4E0D\u63D0\u4F9B\u6A21\u578B\u4EA4\u4E92": "The acceptance backend does not provide model interactions",
  "\u91CD\u542F\u540E\u8BF7\u521B\u5EFA\u65B0\u5C1D\u8BD5": "Create a new attempt after restarting",
  "\u65E0\u6CD5\u6062\u590D\u9A8C\u6536\u5C1D\u8BD5": "The acceptance attempt cannot be resumed",
  "\u5F53\u524D\u670D\u52A1\u6CA1\u6709\u542F\u7528\u5E95\u5EA7\u914D\u7F6E": "Runtime configuration is not enabled in this service",
  "\u9636\u6BB5\u6B63\u5728\u51C6\u5907\u6216\u5E95\u5EA7\u914D\u7F6E\u6B63\u5728\u4FDD\u5B58\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5": "A stage is being prepared or runtime configuration is being saved. Try again later",
  "OpenCode \u4ECD\u6709\u6267\u884C\u6216\u5F85\u6838\u5BF9\u5C1D\u8BD5\uFF0C\u8BF7\u5148\u5B8C\u6210\u6216\u786E\u8BA4\u505C\u6B62\u540E\u518D\u4FEE\u6539\u670D\u52A1\u914D\u7F6E": "OpenCode has active attempts or attempts awaiting reconciliation. Complete them or confirm they have stopped before changing service configuration",
  "\u9A8C\u6536\u540E\u7AEF\u4EC5\u7528\u4E8E\u5185\u7F6E\u9694\u79BB\u793A\u4F8B\u4ED3\u5E93": "The acceptance backend is restricted to the built-in isolated demo repository",
  "\u89D2\u8272\u9ED8\u8BA4\u6A21\u578B\u5FC5\u987B\u5C5E\u4E8E\u5DE5\u7A0B\u6240\u9009\u5E95\u5EA7": "Default role models must belong to the project execution backend",
  "\u542F\u52A8\u4E2D\u65AD\u4E14\u5C1A\u672A\u53D6\u5F97\u6267\u884C\u8EAB\u4EFD\uFF0C\u8BF7\u521B\u5EFA\u65B0\u5C1D\u8BD5\uFF1B\u672A\u81EA\u52A8\u91CD\u53D1": "Startup was interrupted before an execution identity was obtained. Create a new attempt; the request was not automatically resent",
  "\u542F\u52A8\u4E2D\u65AD\uFF0C\u672A\u81EA\u52A8\u91CD\u53D1\uFF1B\u8BF7\u521B\u5EFA\u65B0\u5C1D\u8BD5\u91CD\u65B0\u6267\u884C\u6574\u4E2A\u590D\u6838\u6279\u6B21": "Startup was interrupted and the request was not automatically resent. Create a new attempt to rerun the entire review group",
  "\u8FD0\u884C\u5DF2\u4E2D\u65AD\uFF0C\u6B63\u5728\u6838\u5BF9\u539F\u6267\u884C\u8EAB\u4EFD": "The run was interrupted. Reconciling the original execution identity",
  "\u6E90\u4ED3\u5E93\u5305\u542B\u672A\u63D0\u4EA4\u6539\u52A8\uFF0C\u8BF7\u5148\u9009\u62E9\u5E72\u51C0\u57FA\u7EBF\uFF1B\u5E94\u7528\u4E0D\u4F1A\u81EA\u52A8\u63D0\u4EA4\u6216\u91CD\u7F6E": "The source repository has uncommitted changes. Select a clean baseline; the app does not commit or reset them automatically",
  "\u9636\u6BB5\u6B63\u5728\u51C6\u5907\u6216\u4EE3\u7801\u6B63\u5728\u63A5\u7EB3\uFF0C\u8BF7\u7A0D\u540E\u4FDD\u5B58\u9700\u6C42": "A stage is being prepared or code is being accepted. Save requirements later",
  "\u9879\u76EE\u9636\u6BB5\u6B63\u5728\u51C6\u5907\u6216\u4EE3\u7801\u6B63\u5728\u63A5\u7EB3\uFF0C\u8BF7\u7A0D\u540E\u4FDD\u5B58\u7AE0\u7A0B": "A project stage is being prepared or code is being accepted. Save guidance later",
  "\u6D41\u7A0B\u6821\u9A8C\u5931\u8D25": "Workflow validation failed",
  "\u5DF2\u63A5\u7EB3\u7684\u5DE5\u4F5C\u9879\u8BF7\u901A\u8FC7\u65B0\u5DE5\u4F5C\u9879\u7EE7\u7EED\u5F00\u53D1": "Continue development of an accepted work item through a new work item",
  "\u5F53\u524D\u6D41\u7A0B\u4ECD\u5728\u6267\u884C\u6216\u7B49\u5F85\u7B54\u590D\uFF0C\u8BF7\u5148\u5B8C\u6210\u6216\u505C\u6B62\u5F53\u524D\u9636\u6BB5": "The workflow is executing or waiting for an answer. Complete or stop the current stage first",
  "\u8BF7\u4E3A\u5F53\u524D\u9636\u6BB5\u914D\u7F6E\u8FDE\u63A5\u548C\u6A21\u578B": "Configure a connection and model for this stage",
  "\u9879\u76EE\u7AE0\u7A0B\u8BFB\u53D6\u5931\u8D25\uFF1A{0}": "Could not read project guidance: {0}",
  "\u8BF7\u5728\u5DE5\u7A0B\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u9879\u76EE\u7AE0\u7A0B\u6216\u8865\u5145\u5DE5\u7A0B\u89C4\u5219": "Configure project guidance or additional rules in Project Settings",
  "\u6D41\u7A0B\u5DF2\u6682\u505C\u6216\u7ED3\u675F": "The workflow is paused or finished",
  "\u5F53\u524D\u9636\u6BB5\u4ECD\u5728\u6267\u884C\u6216\u5F85\u6838\u5BF9": "The current stage is executing or awaiting reconciliation",
  "\u4E32\u884C\u6D41\u7A0B\u6B63\u5728\u5904\u7406 {0}": "The sequential workflow is processing {0}",
  "\u8BF7\u5148\u586B\u5199\u9700\u6C42\u6B63\u6587\u6216\u6DFB\u52A0\u9700\u6C42\u6587\u6863": "Enter requirements or add requirement documents first",
  "{0} \u5C1A\u672A\u901A\u8FC7\u53CC\u89C6\u89D2\u72EC\u7ACB\u590D\u6838": "{0} has not passed independent review from both perspectives",
  "\u5C1A\u65E0\u5019\u9009\u4EE3\u7801": "No candidate code yet",
  "\u6F84\u6E05\u4F9D\u636E\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u91CD\u65B0\u5206\u6790\u89C4\u683C": "Clarification references changed. Analyze the specification again",
  "\u6F84\u6E05\u9636\u6BB5\u6B63\u5728\u542F\u52A8": "The clarification stage is starting",
  "\u6F84\u6E05\u95EE\u9898\u6216\u4F9D\u636E\u5DF2\u66F4\u65B0\uFF0C\u5F53\u524D\u7B54\u590D\u8349\u7A3F\u5DF2\u4FDD\u7559": "Clarification questions or references changed. Your answer draft is preserved",
  "\u6F84\u6E05\u4F9D\u636E\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u5206\u6790": "Clarification references changed. Analyze again",
  "\u8BF7\u56DE\u7B54\u672C\u8F6E\u6240\u6709\u95EE\u9898\uFF1B\u4E0D\u786E\u5B9A\u65F6\u8BF7\u660E\u786E\u8BF4\u660E\u672A\u77E5\u4FE1\u606F": "Answer all questions in this round. State explicitly when information is unknown",
  "\u6BCF\u9879\u6F84\u6E05\u7B54\u590D\u6700\u591A 4000 \u5B57\u7B26": "Each clarification answer is limited to 4,000 characters",
  "\u8BF7\u5148\u7B49\u5F85\u6216\u505C\u6B62\u5F53\u524D\u6A21\u578B\u6267\u884C": "Wait for or stop the current model execution first",
  "\u7B54\u590D\u8349\u7A3F\u9700\u8981\u5BF9\u5E94\u672C\u4F1A\u8BDD\u7684\u95EE\u9898\uFF0C\u6BCF\u9879\u6700\u591A 4000 \u5B57\u7B26": "Draft answers must match this session\u2019s questions, with at most 4,000 characters each",
  "\u5176\u4ED6\u7F16\u8F91\u8005\u5DF2\u66F4\u65B0\u7B54\u590D\u8349\u7A3F\uFF0C\u8BF7\u6BD4\u8F83\u540E\u4FDD\u5B58": "Another editor updated the answer draft. Compare before saving",
  "\u5DE5\u7A0B\u670D\u52A1\u6B63\u5728\u5173\u95ED\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5": "The engineering service is shutting down. Try again later",
  "\u5E95\u5EA7\u914D\u7F6E\u6B63\u5728\u4FDD\u5B58\uFF0C\u8BF7\u7A0D\u540E\u542F\u52A8\u9636\u6BB5": "Runtime configuration is being saved. Start the stage later",
  "\u5DE5\u4F5C\u9879\u6B63\u5728\u51C6\u5907\u5019\u9009\u6216\u96C6\u6210\u4EE3\u7801": "The work item is preparing a candidate or integrating code",
  "\u5F53\u524D\u5DE5\u4F5C\u9879\u6709\u6B63\u5728\u542F\u52A8\u7684\u9636\u6BB5": "A stage in this work item is starting",
  "\u8282\u70B9\u72B6\u6001\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5237\u65B0": "The node state changed. Refresh the page",
  "\u9A8C\u8BC1\u6B63\u5728\u6267\u884C": "Verification is in progress",
  "\u4ECD\u6709\u963B\u585E\u53D1\u73B0": "Blocking findings remain",
  "\u6267\u884C\u5E95\u5EA7\u4E0D\u53EF\u7528": "The execution backend is unavailable",
  "\u8BE5\u5E95\u5EA7\u7684\u53EA\u8BFB\u590D\u6838\u80FD\u529B\u5C1A\u672A\u901A\u8FC7\u9A8C\u8BC1": "This backend\u2019s read-only review capability has not been validated",
  "\u6240\u9009\u6A21\u578B\u6240\u5C5E\u5E95\u5EA7\u8EAB\u4EFD\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5237\u65B0\u76EE\u5F55\u5E76\u91CD\u65B0\u9009\u62E9": "The selected model\u2019s backend identity changed. Refresh the catalog and select it again",
  "\u6240\u9009\u6A21\u578B\u672A\u5728\u5F53\u524D\u5E95\u5EA7\u542F\u7528": "The selected model is not enabled on the current backend",
  "\u5F53\u524D\u5DE5\u4F5C\u9879\u6709\u6B63\u5728\u51C6\u5907\u7684\u4EE3\u7801\u6267\u884C": "This work item has a code execution being prepared",
  "\u5F53\u524D\u5DE5\u4F5C\u9879\u6709\u672A\u7ED3\u675F\u7684\u4EE3\u7801\u6267\u884C": "This work item has an unfinished code execution",
  "\u9636\u6BB5\u51C6\u5907\u671F\u95F4\u9700\u6C42\u3001\u7AE0\u7A0B\u6216\u8F93\u5165\u4EA7\u7269\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u91CD\u65B0\u8FD0\u884C\u4E0A\u6E38\u9636\u6BB5": "Requirements, guidance or input artifacts changed while preparing the stage. Rerun the upstream stage",
  "\u590D\u6838\u6B65\u9AA4\u5FC5\u987B\u58F0\u660E\u5F85\u590D\u6838\u4EA7\u7269": "A review step must declare the artifacts to review",
  "\u590D\u6838\u4F9D\u636E\u5DF2\u53D8\u5316\uFF0C\u6574\u4E2A\u590D\u6838\u6279\u6B21\u9700\u8981\u91CD\u65B0\u6267\u884C": "Review references changed. Rerun the entire review group",
  "\u5F53\u524D\u5019\u9009\u4EE3\u7801\u5DF2\u66FF\u6362\uFF0C\u8BF7\u91CD\u65B0\u590D\u6838": "The current code candidate was replaced. Review it again",
  "\u590D\u6838\u671F\u95F4\u4EE3\u7801\u53D1\u751F\u53D8\u66F4\uFF0C\u590D\u6838\u7ED3\u679C\u65E0\u6548": "Code changed during review. The review result is invalid",
  "\u590D\u6838\u671F\u95F4\u9A8C\u8BC1\u547D\u4EE4\u6216\u8BC1\u636E\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u590D\u6838": "Verification commands or evidence changed during review. Review again",
  "{0} \u7F3A\u5C11\u5019\u9009\u4EE3\u7801\u4F9D\u636E\uFF0C\u8BF7\u91CD\u65B0\u751F\u6210\u4EA7\u7269\u540E\u590D\u6838": "{0} has no candidate code reference. Regenerate the artifact before reviewing",
  "{0} \u5BF9\u5E94\u7684\u5019\u9009\u5DF2\u66FF\u6362\uFF0C\u8BF7\u91CD\u65B0\u751F\u6210\u4EA7\u7269": "The candidate associated with {0} was replaced. Regenerate the artifact",
  "{0} \u7684\u4EE3\u7801\u4F9D\u636E\u5DF2\u53D8\u66F4\uFF0C\u8BF7\u91CD\u65B0\u751F\u6210\u548C\u590D\u6838\u4EA7\u7269": "The code reference for {0} changed. Regenerate and review the artifact",
  "\u65E7\u590D\u6838\u5C1D\u8BD5\u7F3A\u5C11\u8BC1\u636E\u534F\u8BAE\uFF0C\u8BF7\u521B\u5EFA\u65B0\u7684\u590D\u6838\u5C1D\u8BD5": "This older review attempt has no evidence protocol. Create a new review attempt",
  "\u590D\u6838\u4E0D\u80FD\u751F\u6210\u4EA7\u7269\uFF0C\u5FC5\u987B\u663E\u5F0F\u8FD4\u56DE findings \u548C\u7ED3\u6784\u5316 review \u62A5\u544A": "Reviews cannot generate artifacts and must explicitly return findings and a structured review report",
  "\u590D\u6838\u53D1\u73B0\u6307\u5411\u672A\u58F0\u660E\u7684\u4EA7\u7269": "A review finding refers to an undeclared artifact",
  "\u53CC\u89C6\u89D2\u590D\u6838\u8BC1\u636E\u4E0D\u5B8C\u6574": "Evidence for review from both perspectives is incomplete",
  "\u4E24\u6B21\u590D\u6838\u5FC5\u987B\u4F7F\u7528\u540C\u4E00\u6279\u51BB\u7ED3\u6750\u6599\u4E0E\u914D\u7F6E": "Both reviews must use the same frozen materials and configuration",
  "\u5386\u53F2\u95EE\u9898\u590D\u9A8C": "Prior Finding Recheck",
  "\u9700\u6C42\u8986\u76D6\u6838\u5BF9\u5DF2\u7ED3\u675F\uFF0C\u6B63\u5728\u72EC\u7ACB\u68C0\u67E5\u53CD\u4F8B\u4E0E\u5931\u8D25\u8DEF\u5F84": "Requirements coverage review finished. Independently checking counterexamples and failure paths",
  "\u53CC\u89C6\u89D2\u590D\u9A8C\u901A\u8FC7\uFF1A{0}": "Review from both perspectives passed: {0}",
  "\u53CC\u89C6\u89D2\u590D\u6838\u672A\u901A\u8FC7\uFF0C\u8BF7\u4FEE\u8BA2\u95EE\u9898\u540E\u91CD\u65B0\u590D\u6838\uFF1B\u8BC1\u636E\u4E0D\u8DB3\u4E5F\u4F1A\u963B\u585E": "Review from both perspectives did not pass. Revise the findings and review again; insufficient evidence also blocks acceptance",
  "\u542F\u52A8\u51C6\u5907\u8D85\u8FC7\u9636\u6BB5\u65F6\u95F4\u4E0A\u9650": "Startup preparation exceeded the stage timeout",
  "\u9636\u6BB5\u9A8C\u6536\u901A\u8FC7": "Stage acceptance passed",
  "\u9636\u6BB5\u65F6\u95F4\u4E0A\u9650\u5DF2\u5230\uFF0C\u505C\u6B62\u6D3E\u53D1\u540E\u7EED\u4EFB\u52A1": "The stage timeout was reached. No further tasks will be dispatched",
  "\u9700\u6C42\u3001\u7AE0\u7A0B\u6216\u4E0A\u6E38\u5DF2\u53D8\u5316\uFF0C\u505C\u6B62\u6D3E\u53D1\u65E7\u4EFB\u52A1": "Requirements, guidance or upstream artifacts changed. Old tasks will no longer be dispatched",
  "\u4EFB\u52A1\u4F9D\u8D56\u65E0\u6CD5\u8C03\u5EA6": "Task dependencies cannot be scheduled",
  "\u4EFB\u52A1\u6267\u884C\u671F\u95F4\u9700\u6C42\u3001\u7AE0\u7A0B\u6216\u4E0A\u6E38\u5DF2\u53D8\u5316\uFF0C\u8BF7\u521B\u5EFA\u65B0\u5C1D\u8BD5": "Requirements, guidance or upstream artifacts changed during task execution. Create a new attempt",
  "\u4EFB\u52A1\u9A8C\u8BC1\u5931\u8D25\uFF0C\u9700\u4FEE\u8BA2\u540E\u91CD\u65B0\u6267\u884C": "Task verification failed. Revise and run again",
  "\u4EFB\u52A1\u5217\u8868\u4E3A\u7A7A": "The task list is empty",
  "\u9636\u6BB5\u5FC5\u987B\u8FD4\u56DE\u7B26\u5408\u4EA7\u7269\u5951\u7EA6\u7684 JSON\uFF1B\u8BF7\u67E5\u770B\u8FD0\u884C\u7ED3\u679C\u5E76\u4FEE\u8BA2\u6307\u4EE4": "The stage must return JSON matching the artifact contract. Inspect the result and revise the instructions",
  "\u6267\u884C\u7ED3\u679C\u4E0D\u660E\uFF0C\u5148\u6838\u5BF9\u539F\u8EAB\u4EFD": "The execution result is unknown. Reconcile the original identity first",
  "\u6267\u884C\u672A\u5B8C\u6210": "Execution did not finish",
  "\u6267\u884C\u671F\u95F4\u9700\u6C42\u3001\u9879\u76EE\u7AE0\u7A0B\u6216\u4E0A\u6E38\u53D1\u751F\u53D8\u66F4\uFF0C\u539F\u7ED3\u679C\u4E0D\u80FD\u653E\u884C\uFF0C\u8BF7\u521B\u5EFA\u65B0\u5C1D\u8BD5": "Requirements, project guidance or upstream artifacts changed during execution. The original result cannot proceed; create a new attempt",
  "\u9700\u6C42\u6F84\u6E05\u5FC5\u987B\u8FD4\u56DE\u7ED3\u6784\u5316 clarification \u7ED3\u679C": "Requirements clarification must return a structured clarification result",
  "\u672C\u8F6E\u6F84\u6E05\u7684\u89C4\u683C\u6216\u8F93\u5165\u5DF2\u66F4\u65B0": "The specification or inputs for this clarification round changed",
  "\u6F84\u6E05\u63D0\u95EE\u65F6\u4E0D\u751F\u6210\u89C4\u683C\uFF0C\u6574\u4E2A\u4F1A\u8BDD\u6700\u591A 5 \u4E2A\u5173\u952E\u95EE\u9898": "Do not generate a specification while asking clarification questions. The session permits at most 5 key questions",
  "\u6F84\u6E05\u95EE\u9898 ID \u5FC5\u987B\u552F\u4E00\uFF0C\u4E0D\u80FD\u91CD\u590D\u5DF2\u56DE\u7B54\u7684\u95EE\u9898": "Clarification question IDs must be unique and cannot repeat answered questions",
  "\u8BF7\u63D0\u4EA4\u6F84\u6E05\u7B54\u590D\uFF0C\u7B54\u590D\u4F1A\u5199\u5165\u4FEE\u8BA2\u540E\u7684\u89C4\u683C": "Submit clarification answers. They will be included in the revised specification",
  "\u5B8C\u6210\u6F84\u6E05\u524D\u5FC5\u987B\u8BB0\u5F55\u6240\u6709\u5DF2\u63D0\u51FA\u95EE\u9898\u7684\u7B54\u590D": "Record answers to every question before completing clarification",
  "\u5B8C\u6210\u6F84\u6E05\u65F6\u5FC5\u987B\u8FD4\u56DE\u5B8C\u6574\u7684 spec \u6587\u6863": "Completing clarification must return the complete spec document",
  "\u6F84\u6E05\u540E\u7684\u89C4\u683C\u4ECD\u6709\u672A\u51B3\u4FE1\u606F\uFF0C\u8BF7\u7EE7\u7EED\u6F84\u6E05": "The clarified specification still has unresolved information. Continue clarification",
  "\u5B9E\u9645\u4EA7\u7269\u4E0E\u9636\u6BB5\u58F0\u660E\u4E0D\u5339\u914D": "The actual artifacts do not match the stage declaration",
  "\u751F\u6210\u62A5\u544A\u671F\u95F4\u4EE3\u7801\u4F9D\u636E\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u751F\u6210": "The code reference changed while generating the report. Generate it again",
  "\u9636\u6BB5\u53D1\u73B0\u5FC5\u987B\u6307\u5411\u5F53\u524D\u4EA7\u7269\u6216\u51BB\u7ED3\u7684\u4E0A\u6E38\u4EA7\u7269": "Stage findings must refer to a current artifact or frozen upstream artifact",
  "\u4F9D\u636E\u6821\u9A8C\u53D1\u73B0\u963B\u585E\u95EE\u9898\uFF0C\u8BF7\u4FEE\u8BA2\u540E\u91CD\u65B0\u590D\u6838": "Reference validation found blocking issues. Revise and review again",
  "\u7B49\u5F85\u5F53\u524D\u4EA7\u7269\u72EC\u7ACB\u590D\u6838\u4E0E\u4EBA\u5DE5\u63A5\u7EB3": "Waiting for independent artifact review and human acceptance",
  "\u4EE3\u7801\u6B63\u5728\u96C6\u6210\uFF0C\u8BF7\u7A0D\u540E\u9A8C\u8BC1": "Code is being integrated. Verify later",
  "\u5F53\u524D\u5019\u9009\u6B63\u5728\u9A8C\u8BC1": "This candidate is being verified",
  "\u9879\u76EE\u5C1A\u672A\u914D\u7F6E\u786E\u5B9A\u6027\u9A8C\u8BC1\u547D\u4EE4": "No deterministic verification commands are configured for this project",
  "\u5FC5\u9700\u9A8C\u8BC1\u672A\u901A\u8FC7\uFF0C\u8BF7\u67E5\u770B\u547D\u4EE4\u8F93\u51FA": "Required verification did not pass. Inspect the command output",
  "\u5F53\u524D\u7248\u672C\u6B63\u5728\u590D\u6838\uFF0C\u8BF7\u7B49\u5F85\u590D\u6838\u7ED3\u679C": "The current revision is being reviewed. Wait for the results",
  "\u6B64\u5DE5\u4F5C\u9879\u5DF2\u7ECF\u63A5\u7EB3": "This work item is already accepted",
  "\u5019\u9009\u5DF2\u88AB\u65B0\u7684\u5C1D\u8BD5\u66FF\u4EE3": "A newer attempt superseded this candidate",
  "\u5DE5\u7A0B\u9636\u6BB5\u6B63\u5728\u542F\u52A8": "An engineering stage is starting",
  "\u5DE5\u4F5C\u9879\u8FD8\u6709\u6B63\u5728\u6267\u884C\u7684\u5019\u9009\u9A8C\u8BC1": "Candidate verification is still running for this work item",
  "\u5DE5\u4F5C\u9879\u8FD8\u6709\u672A\u7ED3\u675F\u6216\u5F85\u6838\u5BF9\u7684\u6267\u884C": "The work item has executions that are unfinished or awaiting reconciliation",
  "\u5DE5\u4F5C\u9879\u8FD8\u6709\u672A\u7ED3\u675F\u7684\u6267\u884C\u6216\u9A8C\u8BC1": "The work item has unfinished execution or verification",
  "\u9879\u76EE\u7AE0\u7A0B\u6216\u89C4\u5219\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5237\u65B0\u5DE5\u4F5C\u9879\u540E\u91CD\u65B0\u68C0\u67E5": "Project guidance or rules changed. Refresh the work item and check again",
  "\u5DE5\u7A0B\u6587\u6863\u5728\u5E94\u7528\u5916\u53D8\u5316\uFF0C\u8BF7\u5237\u65B0\u5E76\u6BD4\u8F83\u540E\u91CD\u65B0\u68C0\u67E5": "Engineering documents changed outside the app. Refresh, compare and check again",
  "\u5019\u9009\u4EE3\u7801\u7684\u6267\u884C\u6216\u539F\u59CB\u5DE5\u7A0B\u8F93\u5165\u5DF2\u65E0\u6548": "The candidate execution or original engineering inputs are invalid",
  "\u5019\u9009\u4EFB\u52A1\u5C1A\u672A\u5168\u90E8\u901A\u8FC7\u9A8C\u8BC1\u4E0E\u590D\u6838": "Not all candidate tasks passed verification and review",
  "\u5F53\u524D\u4EE3\u7801\u5185\u5BB9\u6CA1\u6709\u6709\u6548\u7684\u53CC\u89C6\u89D2\u72EC\u7ACB\u590D\u6838": "The current code has no valid independent review from both perspectives",
  "\u5F53\u524D\u4EE3\u7801\u7F3A\u5C11\u6709\u6548 {0} \u9A8C\u8BC1": "The current code has no valid {0} verification",
  "\u5F53\u524D\u4EE3\u7801\u6709\u963B\u585E\u53D1\u73B0": "The current code has blocking findings",
  "{0} \u5F53\u524D\u7248\u672C\u7F3A\u5C11\u53CC\u89C6\u89D2\u590D\u6838": "The current revision of {0} has not been reviewed from both perspectives",
  "\u5DE5\u4F5C\u9879\u57FA\u7EBF\u6216\u6E90\u4EE3\u7801\u5DF2\u7ECF\u53D8\u5316\uFF0C\u8BF7\u6BD4\u8F83\u5DEE\u5F02\u540E\u96C6\u6210": "The work item baseline or source code changed. Compare the differences before integrating",
  "\u68C0\u67E5\u671F\u95F4\u5DE5\u7A0B\u72B6\u6001\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u68C0\u67E5": "Engineering state changed during the check. Check again",
  "\u68C0\u67E5\u671F\u95F4\u539F\u59CB\u5DE5\u7A0B\u8F93\u5165\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u68C0\u67E5": "Original engineering inputs changed during the check. Check again",
  "\u5DE5\u4F5C\u9879\u6B63\u5728\u96C6\u6210": "The work item is being integrated",
  "\u9009\u5B9A\u5019\u9009\u5DF2\u88AB\u65B0\u5C1D\u8BD5\u66FF\u4EE3\uFF0C\u8BF7\u91CD\u65B0\u5BA1\u9605\u5F53\u524D\u5019\u9009": "A newer attempt superseded the selected candidate. Review the current candidate",
  "\u5019\u9009\u4EE3\u7801\u5728\u63A5\u7EB3\u51C6\u5907\u671F\u95F4\u53D1\u751F\u53D8\u5316\uFF0C\u9700\u91CD\u65B0\u9A8C\u8BC1": "Candidate code changed while preparing acceptance. Verify it again",
  "\u6587\u6863\u5728\u96C6\u6210\u671F\u95F4\u53D1\u751F\u53D8\u66F4": "Documents changed during integration",
  "\u96C6\u6210\u7ED3\u679C\u4E0E\u5DF2\u9A8C\u8BC1\u5019\u9009\u4E0D\u4E00\u81F4": "The integration result differs from the verified candidate",
  "\u786E\u5B9A\u6027\u9A8C\u8BC1\u4E0E\u72EC\u7ACB\u590D\u6838\u901A\u8FC7\u540E\u4EBA\u5DE5\u63A5\u7EB3": "Accepted by a human after deterministic verification and independent review passed",
  "\u542F\u52A8\u671F\u95F4\u672A\u53D6\u5F97\u6267\u884C\u8EAB\u4EFD\uFF0C\u4E0D\u80FD\u81EA\u52A8\u91CD\u53D1": "No execution identity was obtained during startup. The request cannot be automatically resent",
  "\u8BE5\u5C1D\u8BD5\u5DF2\u7531\u65B0\u7684\u6267\u884C\u63A5\u66FF\uFF0C\u4E0D\u80FD\u66F4\u6539\u5F53\u524D\u6B65\u9AA4\u72B6\u6001": "A newer execution superseded this attempt. It cannot change the current step state",
  "\u4E2D\u65AD\u4EFB\u52A1\u6838\u5BF9\u5931\u8D25\uFF0C\u8BF7\u521B\u5EFA\u65B0\u5C1D\u8BD5": "Could not reconcile the interrupted task. Create a new attempt",
  "\u4E2D\u65AD\u4EFB\u52A1\u7684\u51BB\u7ED3\u4F9D\u636E\u5DF2\u53D8\u5316\uFF0C\u8BF7\u521B\u5EFA\u65B0\u5C1D\u8BD5": "The interrupted task\u2019s frozen references changed. Create a new attempt",
  "\u4E2D\u65AD\u4EFB\u52A1\u7684\u786E\u5B9A\u6027\u9A8C\u8BC1\u672A\u901A\u8FC7\uFF0C\u8BF7\u521B\u5EFA\u65B0\u5C1D\u8BD5": "Deterministic verification of the interrupted task failed. Create a new attempt",
  "\u5DF2\u6838\u5BF9\u4E2D\u65AD\u4EFB\u52A1\uFF1B\u4EFB\u52A1\u5217\u8868\u5C1A\u672A\u5168\u90E8\u9A8C\u8BC1\uFF0C\u672A\u81EA\u52A8\u6D3E\u53D1\u5269\u4F59\u4EFB\u52A1\uFF0C\u8BF7\u521B\u5EFA\u65B0\u5C1D\u8BD5": "The interrupted task was reconciled, but the task list is not fully verified. Remaining tasks were not dispatched automatically; create a new attempt",
  "\u672A\u786E\u8BA4\u6267\u884C\u8EAB\u4EFD\uFF0C\u65E0\u6CD5\u505C\u6B62": "Cannot stop execution before its identity is confirmed",
  "\u5DE5\u4F5C\u9879\u6B63\u5728\u51C6\u5907\u6267\u884C\u6216\u96C6\u6210\u4EE3\u7801": "The work item is preparing execution or integrating code",
  "\u7F3A\u5C11\u6267\u884C\u8EAB\u4EFD": "Missing execution identity",
  "\u8BE5\u5C1D\u8BD5\u5DF2\u7531\u65B0\u7684\u6267\u884C\u63A5\u66FF\uFF0C\u8BF7\u67E5\u770B\u5F53\u524D\u5C1D\u8BD5": "A newer execution superseded this attempt. View the current attempt",
  "\u5DE5\u4F5C\u9879\u6B63\u5728\u96C6\u6210\u4EE3\u7801": "The work item is integrating code",
  "\u53EA\u80FD\u6062\u590D\u5DF2\u7ECF\u4E2D\u65AD\u7684\u6267\u884C": "Only interrupted executions can be resumed",
  "\u539F\u8FD0\u884C\u8F93\u5165\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u521B\u5EFA\u65B0\u5C1D\u8BD5": "The original run inputs are stale. Create a new attempt",
  "\u5E95\u5EA7\u65E0\u6CD5\u6062\u590D": "The backend cannot resume this execution",
  "\u8BE5\u4EA4\u4E92\u5DF2\u7ECF\u5904\u7406": "This interaction has already been handled",
  "\u8BF7\u8BB0\u5F55\u5904\u7406\u7406\u7531": "Record a reason for this decision",
  "\u963B\u585E\u53D1\u73B0\u5FC5\u987B\u4FEE\u8BA2\u76EE\u6807\u4EA7\u7269\u5E76\u901A\u8FC7\u53CC\u89C6\u89D2\u590D\u9A8C\uFF1B\u5355\u6B21\u6D4B\u8BD5\u901A\u8FC7\u4E0D\u80FD\u66FF\u4EE3\u95EE\u9898\u590D\u6838": "Blocking findings require revision of the target artifact and review from both perspectives. Passing one test cannot replace review of the finding",
  "\u89E3\u51B3\u963B\u585E\u95EE\u9898\u9700\u8981\u9A8C\u8BC1\u6216\u65B0\u590D\u6838\u8BC1\u636E": "Resolving a blocking finding requires verification or new review evidence",
  "\u8BC1\u636E\u6CA1\u6709\u901A\u8FC7\u9A8C\u8BC1\u6216\u5C5E\u4E8E\u5176\u4ED6\u5DE5\u4F5C\u9879": "The evidence did not pass verification or belongs to another work item",
  "\u963B\u585E\u95EE\u9898\u4E0D\u80FD\u4EC5\u4EE5\u7406\u7531\u8C41\u514D": "Blocking findings cannot be waived with a reason alone",
  "\u9879\u76EE\u9636\u6BB5\u6B63\u5728\u51C6\u5907\u6216\u4EE3\u7801\u6B63\u5728\u63A5\u7EB3\uFF0C\u8BF7\u7A0D\u540E\u66F4\u65B0\u5DE5\u7A0B\u8BBE\u7F6E": "A project stage is being prepared or code is being accepted. Update project settings later",
  "\u7B5B\u9009\u8282\u70B9\u4E0D\u5C5E\u4E8E\u5F53\u524D\u5DE5\u4F5C\u9879": "The filtered node does not belong to this work item",
  "\u8BB0\u5F55\u4E0D\u5B58\u5728": "The record does not exist",
  "\u8BB0\u5F55\u5DF2\u7ECF\u53D8\u5316\uFF0C\u8BF7\u6BD4\u8F83\u6700\u65B0\u7248\u672C": "The record changed. Compare the latest revision",
  "\u8BB0\u5F55\u5DF2\u88AB\u53E6\u4E00\u8FDB\u7A0B\u4FEE\u6539": "Another process modified the record",
  "\u4E8B\u4EF6\u6E38\u6807\u5FC5\u987B\u4E3A\u975E\u8D1F\u5B89\u5168\u6574\u6570": "The event cursor must be a non-negative safe integer",
  "\u5E42\u7B49\u952E\u5DF2\u7ECF\u7528\u4E8E\u4E0D\u540C\u64CD\u4F5C": "This idempotency key was already used for a different operation",
  "Git \u64CD\u4F5C\u5931\u8D25": "Git operation failed",
  "Git \u8F93\u51FA\u8FBE\u5230\u5B8C\u6574\u8BFB\u53D6\u4E0A\u9650\uFF0C\u8BF7\u7F29\u5C0F\u5019\u9009\u6539\u52A8\uFF1B\u4E0D\u80FD\u7528\u622A\u65AD\u7684\u5DEE\u5F02\u4F5C\u4E3A\u590D\u6838\u4F9D\u636E": "Git output exceeded the complete-read limit. Reduce the candidate changes; truncated differences cannot serve as review evidence",
  "\u65B0\u589E\u6587\u4EF6 {0} \u8D85\u8FC7\u590D\u6838\u6750\u6599\u4E0A\u9650\uFF0C\u8BF7\u62C6\u5C0F\u5019\u9009\u6539\u52A8": "New file {0} exceeds the review material limit. Reduce the candidate changes",
  "\u4E8C\u8FDB\u5236\u5185\u5BB9 SHA-256\uFF1A{0}\uFF1B\u6B63\u6587\u672A\u4F5C\u8BED\u4E49\u6838\u9A8C": "Binary content SHA-256: {0}; its contents have not been semantically reviewed",
  "\u5019\u9009\u8865\u4E01\u8D85\u8FC7\u590D\u6838\u6750\u6599\u4E0A\u9650\uFF0C\u8BF7\u62C6\u5C0F\u5019\u9009\u6539\u52A8": "The candidate patch exceeds the review material limit. Reduce the candidate changes",
  "Maka {0} \u4E0E\u56FA\u5B9A\u7248\u672C\u4E0D\u5339\u914D\uFF0C\u62D2\u7EDD\u81EA\u52A8\u4FEE\u6539": "Maka {0} does not match the pinned version. Automatic modification was refused",
  "\u9636\u6BB5\u8F93\u5165\u8D85\u8FC7 Maka \u6B63\u5F0F\u7248 0.2.0 \u7684 48 KiB UTF-8 \u6587\u672C\u4E0A\u9650\u3002\u8BF7\u7F29\u5C0F\u9700\u6C42\u3001\u4EA7\u7269\u6216\u5019\u9009\u8865\u4E01\u540E\u91CD\u8BD5\uFF1B\u5B8C\u6574\u5BA1\u6838\u4F9D\u636E\u4E0D\u80FD\u622A\u65AD\u3002": "Stage input exceeds the 48 KiB UTF-8 text limit of the official Maka 0.2.0 release. Reduce the requirements, artifacts or candidate patch and retry; complete review references cannot be truncated.",
  "\u8BF7\u5148\u8FD0\u884C npm run maka:setup": "Run npm run maka:setup first",
  "Maka Host \u65E0\u6CD5\u8FDE\u63A5\uFF1A{0}": "Cannot connect to Maka Host: {0}",
  "\u8BF7\u5148\u8FD0\u884C npm run build \u751F\u6210\u5DE5\u4F5C\u533A\u6269\u5C55": "Run npm run build first to build the workspace extension",
  "\u5DE5\u4F5C\u7A7A\u95F4\u5DE5\u5177\u6269\u5C55\u672A\u5C31\u7EEA": "The workspace tool extension is not ready",
  "\u4F7F\u7528 Host plan/explore \u53EA\u8BFB\u7B56\u7565\uFF1B\u771F\u5B9E\u4F9B\u5E94\u5546\u9A8C\u6536\u5F85\u8FDE\u63A5\u914D\u7F6E": "Uses the Host plan/explore read-only policy; real-provider validation awaits connection configuration",
  "\u6A21\u578B\u76EE\u5F55\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5237\u65B0": "The model catalog changed. Refresh the page",
  "\u5E95\u5EA7\u62D2\u7EDD\u542F\u52A8\u9636\u6BB5": "The backend refused to start the stage",
  "\u6267\u884C\u5E95\u5EA7\u8EAB\u4EFD\u5DF2\u53D8\u5316\uFF0C\u4E0D\u80FD\u7EE7\u7EED\u539F\u8FD0\u884C": "The execution backend identity changed. The original run cannot continue",
  "\u65E0\u6CD5\u6062\u590D": "Cannot resume",
  "Maka \u6B63\u5F0F\u7248\u4E0D\u652F\u6301\u6B64\u8FDE\u63A5\u534F\u8BAE": "The official Maka release does not support this connection protocol",
  "\u8FDE\u63A5\u540D\u79F0\u6216\u6A21\u578B\u76EE\u5F55\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5237\u65B0": "The connection name or model catalog changed. Refresh the page",
  "\u7981\u6B62\u4F7F\u7528 Maka \u5F00\u53D1\u6216\u9884\u53D1\u5E03\u7248\u672C\uFF1A{0}\uFF1B\u5185\u7F6E\u8FD0\u884C\u65F6\u53EA\u63A5\u53D7\u6B63\u5F0F release": "Maka development or prerelease versions are prohibited: {0}; the bundled runtime accepts official releases only",
  "Maka \u7248\u672C\u4E0D\u5339\u914D\uFF1A\u9700\u8981\u6B63\u5F0F release {0}\uFF0C\u5F53\u524D {1}": "Maka version mismatch: official release {0} is required; current version: {1}",
  "Maka \u6B63\u5F0F\u6E90\u7801\u6279\u51C6\u4FE1\u606F\u4E0D\u5B8C\u6574": "Official Maka source approval information is incomplete",
  "Maka \u6B63\u5F0F npm \u6279\u51C6\u4FE1\u606F\u4E0D\u5B8C\u6574": "Official Maka npm approval information is incomplete",
  "Maka \u6B63\u5F0F\u53D1\u5E03\u6765\u6E90\u6821\u9A8C\u5931\u8D25\uFF1A{0}": "Official Maka release provenance validation failed: {0}",
  "Maka \u6B63\u5F0F\u6E90\u7801\u6765\u6E90\u6821\u9A8C\u5931\u8D25\uFF1A{0}": "Official Maka source provenance validation failed: {0}",
  "Maka \u6E90\u7801\u6784\u5EFA\u9A8C\u8BC1\u8BB0\u5F55\u4E0D\u5B8C\u6574": "Maka source build verification records are incomplete",
  "OpenCode HTTP API \u6CA1\u6709\u539F\u8FD0\u884C\u7684\u5B89\u5168\u6062\u590D\u534F\u8BAE\uFF1B\u53EF\u4EE5\u91CD\u65B0\u6838\u5BF9\u539F\u4F1A\u8BDD\u72B6\u6001\uFF0C\u7EE7\u7EED\u6267\u884C\u9700\u521B\u5EFA\u65B0\u5C1D\u8BD5\u3002": "The OpenCode HTTP API has no safe resume protocol for the original run. You can reconcile the original session state; continuing execution requires a new attempt.",
  "OpenCode \u6B65\u6570\u91C7\u7528\u4F1A\u8BDD\u8F6E\u8BE2\u76D1\u6D4B\u548C\u5DE5\u5177\u6388\u6743\u9884\u7B97\uFF0C\u975E\u539F\u751F\u786C\u4E0A\u9650\uFF1B\u81EA\u52A8\u5141\u8BB8\u7684\u8BFB\u53D6\u53CA\u4E24\u6B21\u8F6E\u8BE2\u4E4B\u95F4\u53EF\u80FD\u7EE7\u7EED\u6267\u884C\u3002": "OpenCode step limits use session polling and a tool authorization budget, rather than a native hard limit. Automatically allowed reads and execution between polls can continue.",
  "\u53EA\u8BFB\u6267\u884C\u4F9D\u8D56\u53EF\u4FE1\u7684\u7528\u6237\u7EA7 OpenCode \u5DE5\u5177\u4E0E\u63D2\u4EF6\u914D\u7F6E\uFF1BHTTP API \u65E0\u6CD5\u8FA8\u8BA4\u540C\u540D\u5DE5\u5177\u8986\u76D6\uFF0C\u7528\u6237\u7EA7\u63D2\u4EF6\u4ECD\u53EF\u80FD\u8D8A\u8FC7\u5DE5\u5177\u6743\u9650\u3002\u5DE5\u4F5C\u533A\u672C\u5730\u914D\u7F6E\u4E0E\u6269\u5C55\u5728\u6FC0\u6D3B\u524D\u62D2\u7EDD\uFF1B\u5DE5\u7A0B\u9636\u6BB5\u53E6\u6709\u5DE5\u4F5C\u6811\u53D8\u5316\u68C0\u67E5\u963B\u585E\u5F02\u5E38\u5199\u5165\u3002": "Read-only execution depends on trusted user-level OpenCode tools and plugins. The HTTP API cannot detect overridden tool names, and user-level plugins can bypass tool permissions. Workspace-local configuration and extensions are rejected before activation; engineering stages also block unexpected writes through working-tree checks.",
  "OpenCode \u670D\u52A1\u5730\u5740\u5FC5\u987B\u662F\u6709\u6548\u7684\u672C\u673A HTTP(S) \u5730\u5740": "The OpenCode service URL must be a valid local HTTP(S) address",
  "OpenCode \u670D\u52A1\u5730\u5740\u53EA\u652F\u6301 localhost\u3001127.0.0.1 \u6216 [::1] \u7684 HTTP(S) \u6839\u5730\u5740\uFF0C\u4E0D\u63A5\u53D7\u5185\u5D4C\u51ED\u636E\u3001\u8DEF\u5F84\u6216\u67E5\u8BE2\u53C2\u6570": "The OpenCode service URL must be an HTTP(S) root URL on localhost, 127.0.0.1 or [::1], without embedded credentials, paths or query parameters",
  "OpenCode \u670D\u52A1\u6216\u914D\u7F6E\u6765\u6E90\u5DF2\u53D8\u5316\uFF0C\u4E0D\u80FD\u7EE7\u7EED\u539F\u8FD0\u884C": "The OpenCode service or configuration provenance changed. The original run cannot continue",
  "OpenCode \u6267\u884C\u5F15\u7528\u65E0\u6548": "Invalid OpenCode execution reference",
  "OpenCode \u5DE5\u4F5C\u533A\u5FC5\u987B\u4F4D\u4E8E SpecFlow \u5DE5\u4F5C\u533A\u76EE\u5F55\u5185": "The OpenCode workspace must be within the SpecFlow workspace directory",
  "OpenCode \u6267\u884C\u76EE\u5F55\u6216\u5176\u9879\u76EE\u7956\u5148\u5305\u542B\u672C\u5730\u914D\u7F6E/\u6269\u5C55 {0}\uFF1B\u4E3A\u907F\u514D\u5728\u6743\u9650\u5EFA\u7ACB\u524D\u52A0\u8F7D\u4EE3\u7801\uFF0C\u5DF2\u963B\u6B62\u5DE5\u4F5C\u533A\u8FDE\u63A5\u3002\u8BF7\u5C06\u7ECF\u8FC7\u4FE1\u4EFB\u5BA1\u67E5\u7684 OpenCode \u914D\u7F6E\u79FB\u81F3\u7528\u6237\u7EA7\u914D\u7F6E\u76EE\u5F55\u3002": "The OpenCode execution directory or one of its project ancestors contains local configuration/extensions: {0}. The workspace connection was blocked to avoid loading code before permissions are established. Move trusted and reviewed OpenCode configuration to the user-level configuration directory.",
  "\u6CA1\u6709\u6B64 OpenCode \u6267\u884C\u7684\u6301\u4E45\u5316\u8BB0\u5F55\uFF0C\u4E0D\u80FD\u63A5\u7BA1\u6216\u91CD\u65B0\u6D3E\u53D1": "There is no persistent record for this OpenCode execution. It cannot be taken over or dispatched again",
  "OpenCode \u4F1A\u8BDD\u5F15\u7528\u4E0E\u6301\u4E45\u5316\u8BB0\u5F55\u4E0D\u5339\u914D": "The OpenCode session reference does not match its persistent record",
  "OpenCode \u5DE5\u4F5C\u533A\u8DEF\u5F84\u5DF2\u53D8\u5316\uFF0C\u4E0D\u80FD\u7EE7\u7EED\u539F\u8FD0\u884C": "The OpenCode workspace path changed. The original run cannot continue",
  "OpenCode \u8FDE\u63A5\u5DF2\u5173\u95ED": "The OpenCode connection is closed",
  "OpenCode \u8BF7\u6C42\u672A\u786E\u8BA4\uFF1A\u670D\u52A1\u4E0D\u53EF\u8FBE\u3001\u8D85\u65F6\u6216\u8FD4\u56DE\u4E86\u91CD\u5B9A\u5411\uFF1B\u8BF7\u6838\u5BF9\u539F\u8FD0\u884C\u72B6\u6001": "The OpenCode request is unconfirmed: the service is unreachable, timed out or returned a redirect. Reconcile the original run state",
  "OpenCode \u8BF7\u6C42\u5931\u8D25\uFF08HTTP {0}\uFF09": "OpenCode request failed (HTTP {0})",
  "OpenCode \u8FD4\u56DE\u4E86\u65E0\u6548\u7684 JSON \u54CD\u5E94": "OpenCode returned an invalid JSON response",
  "OpenCode \u6CA1\u6709\u8FD4\u56DE\u53EF\u6838\u5BF9\u7684\u670D\u52A1\u8DEF\u5F84\u8EAB\u4EFD": "OpenCode did not return a verifiable service path identity",
  "OpenCode \u670D\u52A1\u8FD4\u56DE\u7684\u6267\u884C\u76EE\u5F55\u4E0E SpecFlow \u5DE5\u4F5C\u533A\u4E0D\u7B26": "The execution directory returned by OpenCode does not match the SpecFlow workspace",
  "OpenCode \u670D\u52A1\u7684\u6570\u636E\u6216\u914D\u7F6E\u76EE\u5F55\u8EAB\u4EFD\u5DF2\u53D8\u5316\uFF0C\u4E0D\u80FD\u7EE7\u7EED\u539F\u8FD0\u884C": "The OpenCode service data or configuration directory identity changed. The original run cannot continue",
  "OpenCode \u5065\u5EB7\u68C0\u67E5\u54CD\u5E94\u65E0\u6548": "Invalid OpenCode health check response",
  "OpenCode \u6A21\u578B\u76EE\u5F55\u54CD\u5E94\u65E0\u6548": "Invalid OpenCode model catalog response",
  "\u6A21\u578B\u76EE\u6807\u5C5E\u4E8E\u5176\u4ED6 OpenCode \u670D\u52A1\uFF0C\u8BF7\u5237\u65B0\u6A21\u578B\u5217\u8868": "The model target belongs to another OpenCode service. Refresh the model list",
  "\u6267\u884C\u6B65\u6570\u5FC5\u987B\u4E3A\u6B63\u6574\u6570": "The execution step limit must be a positive integer",
  "\u539F OpenCode \u5C1D\u8BD5\u7684\u51BB\u7ED3\u8F93\u5165\u6216\u5E95\u5EA7\u8EAB\u4EFD\u5DF2\u53D8\u5316": "The original OpenCode attempt\u2019s frozen inputs or backend identity changed",
  "OpenCode \u4F1A\u8BDD\u521B\u5EFA\u7ED3\u679C\u672A\u786E\u8BA4\uFF1B\u8BF7\u6838\u5BF9\u540E\u521B\u5EFA\u65B0\u5C1D\u8BD5": "OpenCode session creation is unconfirmed. Reconcile it before creating a new attempt",
  "OpenCode \u672A\u786E\u8BA4\u9694\u79BB\u4F1A\u8BDD\u7684\u6267\u884C\u76EE\u5F55\u548C\u6743\u9650\u89C4\u5219\uFF0C\u9636\u6BB5\u672A\u6D3E\u53D1": "OpenCode did not confirm the isolated session\u2019s execution directory and permissions. The stage was not dispatched",
  "OpenCode \u9636\u6BB5\u51BB\u7ED3\u8F93\u5165\u5DF2\u53D8\u5316": "The OpenCode stage\u2019s frozen inputs changed",
  "{0}\uFF1B\u6D3E\u53D1\u610F\u56FE\u5DF2\u4FDD\u5B58\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u91CD\u65B0\u53D1\u9001\u3002": "{0}; dispatch intent was saved and the request will not be automatically resent.",
  "OpenCode \u539F\u4F1A\u8BDD\u7684\u76EE\u5F55\u6216\u6743\u9650\u89C4\u5219\u5DF2\u53D8\u5316\uFF0C\u65E0\u6CD5\u7EE7\u7EED\u63A5\u7BA1": "The original OpenCode session\u2019s directory or permissions changed. It cannot be taken over",
  "OpenCode \u4F1A\u8BDD\u6D88\u606F\u6216\u72B6\u6001\u54CD\u5E94\u65E0\u6548": "Invalid OpenCode session messages or status response",
  "OpenCode \u89C2\u6D4B\u6B65\u6570\u8D85\u8FC7\u9636\u6BB5\u9884\u7B97\uFF0C\u5DF2\u505C\u6B62\u539F\u4F1A\u8BDD": "Observed OpenCode steps exceeded the stage budget. The original session was stopped",
  "OpenCode \u6267\u884C\u5931\u8D25": "OpenCode execution failed",
  "OpenCode \u89C2\u6D4B\u6B65\u6570\u8D85\u8FC7\u9636\u6BB5\u9884\u7B97": "Observed OpenCode steps exceeded the stage budget",
  "OpenCode \u4EA4\u4E92\u54CD\u5E94\u65E0\u6548": "Invalid OpenCode interaction response",
  "\u53EA\u8BFB OpenCode \u4F1A\u8BDD\u51FA\u73B0\u4E0D\u5141\u8BB8\u7684\u5DE5\u5177\u6388\u6743\u8BF7\u6C42\uFF0C\u5DF2\u62D2\u7EDD": "A disallowed tool authorization request in a read-only OpenCode session was denied",
  "\u5141\u8BB8\u6267\u884C {0}\uFF1A{1}": "Allow {0}: {1}",
  "\u5DE5\u5177\u8C03\u7528\u5931\u8D25": "Tool call failed",
  "\u7528\u6237\u62D2\u7EDD\u4E86 OpenCode \u5DE5\u5177\u64CD\u4F5C\uFF0C\u539F\u4F1A\u8BDD\u5DF2\u7EC8\u6B62": "The user denied the OpenCode tool operation. The original session was terminated",
  "OpenCode \u5DE5\u5177\u8C03\u7528\u5931\u8D25\uFF1A{0}": "OpenCode tool call failed: {0}",
  "OpenCode \u4F1A\u8BDD\u5DF2\u51C6\u5907\uFF0C\u9636\u6BB5\u5C1A\u672A\u6D3E\u53D1": "The OpenCode session is ready, but the stage has not been dispatched",
  "OpenCode \u4F1A\u8BDD\u7A7A\u95F2\uFF0C\u4F46\u7F3A\u5C11\u7ED1\u5B9A\u672C\u6B21\u6D88\u606F\u7684\u7EC8\u6B62\u51ED\u636E\uFF1B\u4E0D\u4F1A\u81EA\u52A8\u91CD\u65B0\u53D1\u9001\u6216\u6062\u590D": "The OpenCode session is idle, but no terminal receipt is bound to this message. It will not be automatically resent or resumed",
  "\u6B64 OpenCode \u8BF7\u6C42\u5DF2\u7ED3\u675F\u6216\u4E0D\u5C5E\u4E8E\u5F53\u524D\u8FD0\u884C": "This OpenCode request ended or does not belong to the current run",
  "OpenCode \u4EA4\u4E92\u7B54\u590D\u65E0\u6548": "Invalid OpenCode interaction answer",
  "OpenCode \u4EC5\u652F\u6301\u672C\u6B21\u5141\u8BB8\u6216\u62D2\u7EDD\u5DE5\u5177\u6388\u6743": "OpenCode supports allowing once or denying tool authorization only",
  "OpenCode \u5DE5\u5177\u6388\u6743\u9884\u7B97\u5DF2\u7528\u5B8C\uFF0C\u8BF7\u505C\u6B62\u539F\u5C1D\u8BD5": "The OpenCode tool authorization budget is exhausted. Stop the original attempt",
  "\u8BF7\u6309\u987A\u5E8F\u5B8C\u6574\u56DE\u7B54 OpenCode \u95EE\u9898": "Answer every OpenCode question in order",
  "OpenCode \u95EE\u9898\u8981\u6C42\u9009\u62E9\u7ED9\u5B9A\u9009\u9879": "This OpenCode question requires selecting a provided option",
  "OpenCode \u4EA4\u4E92\u7C7B\u578B\u65E0\u6548": "Invalid OpenCode interaction type",
  "\u6267\u884C\u5E95\u5EA7\u5DF2\u6CE8\u518C": "The execution backend is already registered",
  "\u6267\u884C\u5E95\u5EA7 {0} \u672A\u6CE8\u518C": "Execution backend {0} is not registered",
  "\u6A21\u578B\u76EE\u5F55\u8BFB\u53D6\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u5E95\u5EA7\u914D\u7F6E\u540E\u5237\u65B0": "Could not read the model catalog. Check the backend configuration and refresh",
  "\u6267\u884C\u5E95\u5EA7\u65E0\u6CD5\u8FDE\u63A5\uFF0C\u8BF7\u68C0\u67E5\u914D\u7F6E": "Cannot connect to the execution backend. Check its configuration",
  "\u5BA1\u6838\u62A5\u544A\u65E0\u6548\uFF1A{0}": "Invalid review report: {0}",
  "{0} \u5F15\u7528\u4E86\u672A\u77E5\u6750\u6599 {1}": "{0} references unknown material {1}",
  "{0} \u7684\u8BC1\u636E\u5FC5\u987B\u5305\u542B\u5177\u4F53\u539F\u6587\uFF0C\u4E0D\u80FD\u4F7F\u7528\u7A7A\u6CDB\u7ED3\u8BBA": "Evidence for {0} must include specific source text, rather than a generic conclusion",
  "{0} \u7684\u5F15\u6587\u4E0D\u5C5E\u4E8E\u51BB\u7ED3\u6750\u6599 {1}": "The quotation for {0} does not appear in frozen material {1}",
  "\u7ED3\u6784\u4E0D\u7B26\u5408\u5BA1\u6838\u534F\u8BAE": "The structure does not match the review protocol",
  "\u5BA1\u6838\u6279\u6B21\u6216\u5BA1\u6838\u89C6\u89D2\u4E0D\u5339\u914D": "The review group or perspective does not match",
  "\u51BB\u7ED3\u6750\u6599 ID \u91CD\u590D": "Duplicate frozen material IDs",
  "\u5BA1\u6838\u51C6\u5219\u4E3A\u7A7A\u6216 ID \u91CD\u590D": "Review criteria are empty or have duplicate IDs",
  "\u5305\u542B\u672A\u77E5\u51C6\u5219 {0}": "Unknown criterion {0}",
  "\u91CD\u590D\u68C0\u67E5\u51C6\u5219 {0}": "Duplicate check for criterion {0}",
  "\u51C6\u5219 {0} \u6CA1\u6709\u6392\u9664\u53CD\u4F8B\uFF0C\u4E0D\u80FD\u5224\u5B9A\u901A\u8FC7": "Criterion {0} did not rule out its counterexample and cannot pass",
  "\u51C6\u5219 {0} \u7684\u5931\u8D25\u7ED3\u8BBA\u4E0E\u53CD\u4F8B\u7ED3\u679C\u77DB\u76FE": "The failure conclusion for criterion {0} conflicts with its counterexample result",
  "\u7F3A\u5C11\u51C6\u5219 {0} \u7684\u68C0\u67E5": "Missing check for criterion {0}",
  "\u7F3A\u5C11\u53EF\u6838\u5BF9\u7684\u539F\u59CB\u9700\u6C42\u6750\u6599": "No verifiable original requirements material",
  "\u672A\u5F15\u7528\u539F\u59CB\u9700\u6C42\u6750\u6599 {0}": "Original requirements material {0} was not cited",
  "\u7F3A\u5C11\u5BA1\u6838\u5BF9\u8C61 {0} \u5F53\u524D\u7248\u672C\u7684\u8BC1\u636E": "Missing current-revision evidence for review subject {0}",
  "\u672A\u6838\u5BF9\u51BB\u7ED3\u7684 {0} \u6750\u6599 {1}": "Frozen {0} material {1} was not checked",
  "\u7F3A\u5C11\u4EBA\u7C7B\u7B80\u62A5\u4E0E\u6B63\u6587\u7684\u4E00\u81F4\u6027\u68C0\u67E5": "Missing consistency check between the human reading brief and complete document",
  "\u4EBA\u7C7B\u7B80\u62A5 {0} \u7F3A\u5C11\u5BF9\u5E94\u7684\u6B63\u6587\u6750\u6599": "Human reading brief {0} has no corresponding complete document material",
  "\u4EBA\u7C7B\u7B80\u62A5\u4E00\u81F4\u6027\u68C0\u67E5\u5FC5\u987B\u540C\u65F6\u5F15\u7528 {0} \u53CA\u5BF9\u5E94\u6B63\u6587 {1}": "The human brief consistency check must cite both {0} and its complete document {1}",
  "\u4EE3\u7801\u5BA1\u6838\u7F3A\u5C11 {0} \u6750\u6599\u8BC1\u636E": "Code review is missing {0} evidence",
  "\u5386\u53F2\u95EE\u9898 ID \u91CD\u590D": "Duplicate prior finding IDs",
  "\u5305\u542B\u672A\u77E5\u5386\u53F2\u95EE\u9898 {0}": "Unknown prior finding {0}",
  "\u91CD\u590D\u5904\u7406\u5386\u53F2\u95EE\u9898 {0}": "Duplicate resolution for prior finding {0}",
  "\u5386\u53F2\u95EE\u9898 {0}": "Prior finding {0}",
  "\u5386\u53F2\u95EE\u9898 {0} \u58F0\u79F0\u5DF2\u4FEE\u590D\uFF0C\u4F46\u672A\u63D0\u4F9B\u5BA1\u6838\u5BF9\u8C61\u5F53\u524D\u7248\u672C\u7684\u8BC1\u636E": "Prior finding {0} is claimed fixed without current-revision evidence from the review subject",
  "\u5386\u53F2\u4EE3\u7801\u95EE\u9898 {0} \u58F0\u79F0\u5DF2\u4FEE\u590D\uFF0C\u4F46\u672A\u63D0\u4F9B\u5B9E\u9645\u4EE3\u7801\u8BC1\u636E": "Prior code finding {0} is claimed fixed without actual code evidence",
  "\u7F3A\u5C11\u5386\u53F2\u95EE\u9898 {0} \u7684\u5904\u7406\u7ED3\u8BBA": "Missing resolution for prior finding {0}",
  "\u901A\u8FC7\u7ED3\u8BBA\u9700\u8981\u5168\u90E8\u51C6\u5219\u901A\u8FC7\u3001\u5168\u90E8\u53CD\u4F8B\u88AB\u6392\u9664\u4E14\u5386\u53F2\u963B\u585E\u95EE\u9898\u5DF2\u4FEE\u590D": "A pass verdict requires all criteria to pass, all counterexamples to be ruled out and all prior blockers to be fixed",
  "\u8981\u6C42\u4FEE\u8BA2\u65F6\u5FC5\u987B\u6307\u51FA\u5931\u8D25\u68C0\u67E5\u6216\u4ECD\u5B58\u5728\u7684\u95EE\u9898": "A revise verdict must identify a failed check or an unresolved finding",
  "\u65E0\u6CD5\u786E\u5B9A\u65F6\u5FC5\u987B\u8BF4\u660E\u672A\u786E\u8BA4\u7684\u68C0\u67E5\u3001\u53CD\u4F8B\u6216\u5386\u53F2\u95EE\u9898": "An inconclusive verdict must identify an unconfirmed check, counterexample or prior finding",
  "\u4EA7\u7269\u8DEF\u5F84\u5FC5\u987B\u4F4D\u4E8E\u5DE5\u4F5C\u7A7A\u95F4\u5185": "The artifact path must stay within the workspace",
  "\u4EA7\u7269\u8DEF\u5F84\u8D8A\u51FA\u5DE5\u4F5C\u7A7A\u95F4": "The artifact path escapes the workspace",
  "\u4EA7\u7269\u8DEF\u5F84\u5305\u542B\u8D8A\u754C\u94FE\u63A5": "The artifact path contains a link that escapes the workspace",
  "\u4EE3\u7801\u5185\u5BB9\u54C8\u5E0C\u4E0D\u63A5\u53D7\u7B26\u53F7\u94FE\u63A5\uFF1A{0}": "Code content hashing does not accept symbolic links: {0}",
  "\u547D\u4EE4\u53C2\u6570\u5305\u542B\u975E\u6CD5\u5B57\u7B26": "Command arguments contain invalid characters",
  "Windows \u6279\u5904\u7406\u53C2\u6570\u5305\u542B\u4E0D\u652F\u6301\u7684\u63A7\u5236\u5B57\u7B26": "Windows batch arguments contain unsupported control characters",
  "\u6267\u884C\u5DF2\u53D6\u6D88": "Execution was cancelled",
  "\u8BF7\u901A\u8FC7 SpecFlow \u684C\u9762\u5E94\u7528\u8BBF\u95EE": "Access this service through the SpecFlow desktop app",
  "\u8BF7\u901A\u8FC7\u672C\u5730\u5730\u5740\u8BBF\u95EE": "Access this service through a local address",
  "\u672C\u5730\u5DE5\u7A0B\u63A5\u53E3\u4E0D\u63A5\u53D7\u6B64\u6765\u6E90": "The local engineering API does not accept this origin",
  "\u672C\u5730\u5E94\u7528\u4F1A\u8BDD\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u5237\u65B0\u9875\u9762": "The local app session expired. Refresh the page",
  "\u8BF7\u6C42\u5B57\u6BB5\u4E0D\u7B26\u5408\u5951\u7EA6": "Request fields do not match the contract",
  "\u5185\u90E8\u64CD\u4F5C\u5931\u8D25": "An internal operation failed",
  "\u5199\u64CD\u4F5C\u9700\u8981\u5E42\u7B49\u952E": "Write operations require an idempotency key",
  "\u540C\u4E00\u4E2A\u64CD\u4F5C\u6B63\u5728\u6267\u884C": "The same operation is already in progress",
  "\u5F53\u524D\u540E\u7AEF\u4E0D\u652F\u6301\u8FDE\u63A5\u7BA1\u7406": "The current backend does not support connection management",
  "\u5BFC\u5165\u5185\u5BB9\u4FDD\u6301\u5019\u9009\u72B6\u6001\uFF0C\u9700\u5728\u672C\u673A\u91CD\u65B0\u590D\u6838\u4E0E\u63A5\u7EB3": "Imported content remains a candidate and must be reviewed and accepted again on this computer",
  "\u4E8B\u4EF6\u6E38\u6807\u4E0D\u53EF\u6062\u590D\uFF0C\u8BF7\u91CD\u65B0\u540C\u6B65\u5FEB\u7167": "The event cursor cannot be restored. Synchronize the snapshot again",
  "\u63A5\u53E3\u4E0D\u5B58\u5728": "The API endpoint does not exist",
  "\u672C\u673A\u5E95\u5EA7\u914D\u7F6E\u65E0\u6CD5\u8BFB\u53D6\uFF0C\u8BF7\u4FEE\u590D runtime-connections.json \u540E\u91CD\u542F\uFF1B\u672A\u8986\u76D6\u5DF2\u6709\u914D\u7F6E": "Cannot read local backend configuration. Fix runtime-connections.json and restart; existing configuration was not overwritten",
  "OpenCode \u7528\u6237\u540D\u5305\u542B\u65E0\u6548\u5B57\u7B26": "The OpenCode username contains invalid characters",
  "\u8BFB\u53D6\u4F4D\u7F6E\u5FC5\u987B\u4F4D\u4E8E UTF-8 \u5B57\u7B26\u8FB9\u754C": "The read offset must be on a UTF-8 character boundary",
  "Git \u8BFB\u53D6\u5931\u8D25": "Could not read Git data",
  "\u4E8C\u8FDB\u5236\u6B63\u6587\u672A\u4F5C\u8BED\u4E49\u6838\u9A8C": "Binary contents have not been semantically reviewed",
  "\u5F53\u524D\u4EC5\u8FD4\u56DE\u6587\u672C\u9996\u5757\u6216\u90E8\u5206\u8865\u4E01\uFF1B\u8BF7\u7EE7\u7EED\u6309\u5757\u8BFB\u53D6\u5B8C\u6574\u6B63\u6587": "Only the first text chunk or part of the patch is included. Continue reading chunks for the complete contents",
  "\u8BFB\u53D6\u5DEE\u5F02\u671F\u95F4\u5019\u9009\u53D1\u751F\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u52A0\u8F7D": "The candidate changed while reading differences. Reload it",
  "\u8BE5\u6587\u4EF6\u5C5E\u4E8E\u6392\u9664\u76EE\u5F55": "This file belongs to an excluded directory",
  "\u6587\u4EF6\u4E0D\u5728\u5F53\u524D\u5019\u9009\u5DEE\u5F02\u4E2D": "This file is not in the current candidate differences",
  "\u8BE5\u4FA7\u4E0D\u5B58\u5728\u6587\u4EF6\u6B63\u6587": "This side has no file content",
  "\u8BFB\u53D6\u4F4D\u7F6E\u8D85\u51FA\u6587\u4EF6\u5927\u5C0F": "The read offset exceeds the file size",
  "\u8BFB\u53D6\u6B63\u6587\u671F\u95F4\u5019\u9009\u53D1\u751F\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u52A0\u8F7D": "The candidate changed while reading its contents. Reload it",
  "\u540E\u7EED\u6B63\u6587\u5C1A\u672A\u63D0\u4F9B": "The remaining content has not been provided"
};
var openCodeCapabilityNotices = [
  "OpenCode HTTP API \u6CA1\u6709\u539F\u8FD0\u884C\u7684\u5B89\u5168\u6062\u590D\u534F\u8BAE\uFF1B\u53EF\u4EE5\u91CD\u65B0\u6838\u5BF9\u539F\u4F1A\u8BDD\u72B6\u6001\uFF0C\u7EE7\u7EED\u6267\u884C\u9700\u521B\u5EFA\u65B0\u5C1D\u8BD5\u3002",
  "OpenCode \u6B65\u6570\u91C7\u7528\u4F1A\u8BDD\u8F6E\u8BE2\u76D1\u6D4B\u548C\u5DE5\u5177\u6388\u6743\u9884\u7B97\uFF0C\u975E\u539F\u751F\u786C\u4E0A\u9650\uFF1B\u81EA\u52A8\u5141\u8BB8\u7684\u8BFB\u53D6\u53CA\u4E24\u6B21\u8F6E\u8BE2\u4E4B\u95F4\u53EF\u80FD\u7EE7\u7EED\u6267\u884C\u3002",
  "\u53EA\u8BFB\u6267\u884C\u4F9D\u8D56\u53EF\u4FE1\u7684\u7528\u6237\u7EA7 OpenCode \u5DE5\u5177\u4E0E\u63D2\u4EF6\u914D\u7F6E\uFF1BHTTP API \u65E0\u6CD5\u8FA8\u8BA4\u540C\u540D\u5DE5\u5177\u8986\u76D6\uFF0C\u7528\u6237\u7EA7\u63D2\u4EF6\u4ECD\u53EF\u80FD\u8D8A\u8FC7\u5DE5\u5177\u6743\u9650\u3002\u5DE5\u4F5C\u533A\u672C\u5730\u914D\u7F6E\u4E0E\u6269\u5C55\u5728\u6FC0\u6D3B\u524D\u62D2\u7EDD\uFF1B\u5DE5\u7A0B\u9636\u6BB5\u53E6\u6709\u5DE5\u4F5C\u6811\u53D8\u5316\u68C0\u67E5\u963B\u585E\u5F02\u5E38\u5199\u5165\u3002"
];
messages4[openCodeCapabilityNotices.join(" ")] = openCodeCapabilityNotices.map((source) => messages4[source]).join(" ");

// packages/i18n/desktop.ts
var messages5 = {
  "\u9009\u62E9\u6587\u4EF6\u5939": "Select Folder",
  "\u5BFC\u51FA": "Export",
  "\u684C\u9762\u63A5\u53E3\u4E0D\u63A5\u53D7\u6B64\u8C03\u7528\u6765\u6E90": "The desktop API does not accept requests from this source",
  "\u5B89\u88C5\u5305\u7F3A\u5C11 Node.js \u8FD0\u884C\u65F6\uFF0C\u8BF7\u91CD\u65B0\u5B89\u88C5\u6216\u8FD0\u884C npm run desktop:prepare\u3002": "The Node.js runtime is missing. Reinstall SpecFlow or run npm run desktop:prepare.",
  "\u672A\u627E\u5230\u53EF\u7528\u7684 Git\u3002Windows \u8BF7\u5B89\u88C5 Git for Windows\uFF1BmacOS \u8BF7\u5B89\u88C5 Xcode Command Line Tools \u6216 Git\uFF0C\u5B8C\u6210\u540E\u91CD\u65B0\u6253\u5F00 SpecFlow\u3002": "Git could not be found. Install Git for Windows on Windows, or Xcode Command Line Tools or Git on macOS, then reopen SpecFlow.",
  "SpecFlow \u670D\u52A1\u5DF2\u505C\u6B62": "SpecFlow service stopped",
  "\u5DE5\u7A0B\u670D\u52A1\u610F\u5916\u9000\u51FA\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u5E94\u7528\u3002\u8BCA\u65AD\u65E5\u5FD7\uFF1A{0}": "The engineering service stopped unexpectedly. Reopen the app. Diagnostic log: {0}",
  "\u5DE5\u7A0B\u670D\u52A1\u542F\u52A8\u8D85\u65F6\u3002\u8BCA\u65AD\u65E5\u5FD7\uFF1A{0}": "The engineering service timed out while starting. Diagnostic log: {0}",
  "\u5DE5\u7A0B\u670D\u52A1\u542F\u52A8\u5931\u8D25\uFF08{0}\uFF09\u3002\u8BCA\u65AD\u65E5\u5FD7\uFF1A{1}": "The engineering service failed to start ({0}). Diagnostic log: {1}",
  "\u6587\u4EF6": "File",
  "\u6253\u5F00\u6570\u636E\u76EE\u5F55": "Open Data Directory",
  "\u6253\u5F00\u8BCA\u65AD\u65E5\u5FD7": "Open Diagnostic Logs",
  "\u5173\u95ED\u7A97\u53E3": "Close Window",
  "\u9000\u51FA SpecFlow": "Quit SpecFlow",
  "\u7F16\u8F91": "Edit",
  "\u89C6\u56FE": "View",
  "\u5E2E\u52A9": "Help",
  "\u5173\u4E8E SpecFlow": "About SpecFlow",
  "\u64A4\u9500": "Undo",
  "\u91CD\u505A": "Redo",
  "\u526A\u5207": "Cut",
  "\u590D\u5236": "Copy",
  "\u7C98\u8D34": "Paste",
  "\u5168\u9009": "Select All",
  "\u91CD\u65B0\u52A0\u8F7D": "Reload",
  "\u5B9E\u9645\u5927\u5C0F": "Actual Size",
  "\u653E\u5927": "Zoom In",
  "\u7F29\u5C0F": "Zoom Out",
  "\u5207\u6362\u5168\u5C4F": "Toggle Full Screen",
  "\u9690\u85CF SpecFlow": "Hide SpecFlow",
  "\u9690\u85CF\u5176\u4ED6\u5E94\u7528": "Hide Others",
  "\u663E\u793A\u5168\u90E8": "Show All",
  "\u8F6F\u4EF6\u5DE5\u7A0B\u6D41\u7A0B\u5DE5\u4F5C\u53F0 \xB7 Maka Runtime Host\n{0}\n\u771F\u5B9E\u6A21\u578B\u8FDE\u63A5\u53EF\u5728\u5DE5\u7A0B\u8BBE\u7F6E\u4E2D\u6DFB\u52A0\u3002": "Software engineering workflow workbench \xB7 Maka Runtime Host\n{0}\nAdd model connections in Project Settings.",
  "SpecFlow \u66F4\u65B0\u5931\u8D25": "SpecFlow update failed",
  "\u8BF7\u91CD\u65B0\u6253\u5F00\u5E94\u7528\uFF0C\u6216\u4F7F\u7528\u65B0\u7248\u5B89\u88C5\u5305\u8986\u76D6\u5B89\u88C5\u3002\u5DE5\u7A0B\u6570\u636E\u5DF2\u4FDD\u7559\u3002\u8BCA\u65AD\u65E5\u5FD7\uFF1A{0}": "Reopen the app or install the latest package over this installation. Your project data has been preserved. Diagnostic log: {0}",
  "\u9009\u62E9 Git \u4ED3\u5E93": "Select a Git Repository",
  "\u65E0\u6548\u7684\u5DE5\u4F5C\u9879\u89C6\u56FE\u6807\u8BC6": "Invalid work item view ID",
  "\u65E0\u6548\u7684\u5DE5\u4F5C\u9879\u6807\u8BC6": "Invalid work item ID",
  "\u5BFC\u51FA\u5DE5\u7A0B\u8BB0\u5F55": "Export Project Evidence",
  "\u5DE5\u7A0B\u8BB0\u5F55": "Project Evidence",
  "\u5DE5\u7A0B\u8BB0\u5F55\u5BFC\u51FA\u5931\u8D25": "Could not export project evidence",
  "SpecFlow \u542F\u52A8\u5931\u8D25": "SpecFlow failed to start",
  "\u89C6\u56FE\u5B9A\u4F4D\u5B57\u6BB5\u4E0D\u7B26\u5408\u5951\u7EA6": "The view location fields do not match the contract",
  "\u8BED\u8A00\u8BBE\u7F6E\u65E0\u6548": "Invalid language setting",
  "\u6E90\u7801\u8FD0\u884C\u6A21\u5F0F\u4E0D\u5B89\u88C5\u66F4\u65B0\u3002\u8BF7\u5B89\u88C5\u6B63\u5F0F\u684C\u9762\u5305\uFF0C\u6216\u66F4\u65B0\u6E90\u7801\u540E\u91CD\u65B0\u6784\u5EFA\u3002": "Updates cannot be installed when running from source. Install an official desktop package or update the source and rebuild.",
  "\u5B89\u88C5\u5305\u7F3A\u5C11\u6709\u6548\u7684\u66F4\u65B0\u914D\u7F6E\u3002\u8BF7\u4ECE\u4E0B\u8F7D\u4E0E\u53D1\u884C\u8BF4\u660E\u9875\u9762\u83B7\u53D6\u65B0\u7248\u5B89\u88C5\u5305\u3002": "This installation has no valid update configuration. Get the latest installer from Downloads and Release Notes.",
  "\u6B63\u5728\u68C0\u67E5\u66F4\u65B0\u2026": "Checking for Updates\u2026",
  "\u53D1\u73B0\u65B0\u7248\u672C {0}": "Version {0} is available",
  "\u6B63\u5728\u4E0B\u8F7D {0}\uFF08{1}%\uFF09": "Downloading {0} ({1}%)",
  "{0} \u5DF2\u4E0B\u8F7D\uFF0C\u7B49\u5F85\u91CD\u542F\u5B89\u88C5": "{0} is downloaded and ready to install on restart",
  "\u6B63\u5728\u5173\u95ED\u5DE5\u7A0B\u670D\u52A1\u5E76\u5B89\u88C5\u66F4\u65B0\u2026": "Stopping the engineering service and installing the update\u2026",
  "\u6700\u8FD1\u68C0\u67E5\uFF1A{0}": "Last checked: {0}",
  "\u5C1A\u672A\u68C0\u67E5\u66F4\u65B0": "No update check yet",
  "\u68C0\u67E5\u66F4\u65B0\u2026": "Check for Updates\u2026",
  "\u4E0B\u8F7D\u66F4\u65B0\u2026": "Download Update\u2026",
  "SpecFlow \u66F4\u65B0": "SpecFlow Update",
  "\u5F53\u524D\u5DF2\u662F\u6700\u65B0\u7248\u672C\uFF08{0}\uFF09": "You are up to date ({0})",
  "\u53D1\u5E03\u65B9\u5C1A\u672A\u63D0\u4F9B\u6B63\u5F0F\u7248\u672C\u6216\u66F4\u65B0\u6587\u4EF6\u65F6\uFF0C\u4E5F\u4F1A\u51FA\u73B0\u6B64\u63D0\u793A\u3002\u5DE5\u7A0B\u6570\u636E\u4E0D\u53D7\u5F71\u54CD\u3002": "This can also happen when an official release or update files are unavailable. Your project data is unaffected.",
  "\u5F53\u524D\u7248\u672C\uFF1A{0}": "Current version: {0}",
  "\u786E\u5B9A": "OK",
  "\u5B89\u88C5 SpecFlow \u66F4\u65B0": "Install SpecFlow Update",
  "\u91CD\u542F\u5E76\u5B89\u88C5 {0}\uFF1F": "Restart and install {0}?",
  "\u8BF7\u5148\u4FDD\u5B58\u7F16\u8F91\u5185\u5BB9\u5E76\u7B49\u5F85\u6B63\u5728\u8FD0\u884C\u7684\u4EFB\u52A1\u7ED3\u675F\u3002\u5B89\u88C5\u5C06\u5173\u95ED\u5F53\u524D\u7A97\u53E3\u548C\u5DE5\u7A0B\u670D\u52A1\uFF0C\u5B8C\u6210\u540E\u91CD\u65B0\u6253\u5F00\u5E94\u7528\u3002\u5DE5\u7A0B\u6570\u636E\u4FDD\u5B58\u5728\u7528\u6237\u76EE\u5F55\u3002": "Save your edits and wait for running tasks to finish. Installation closes this window and the engineering service, then reopens the app. Project data is stored in your user directory.",
  "\u7A0D\u540E": "Later",
  "\u91CD\u542F\u5E76\u5B89\u88C5": "Restart and Install",
  "SpecFlow \u6709\u65B0\u7248\u672C": "SpecFlow Update Available",
  "\u5F53\u524D\u7248\u672C\uFF1A{0}\u3002\u4E0B\u8F7D\u671F\u95F4\u53EF\u7EE7\u7EED\u4F7F\u7528\uFF0C\u4E0B\u8F7D\u5B8C\u6210\u540E\u7531\u4F60\u51B3\u5B9A\u4F55\u65F6\u91CD\u542F\u3002": "Current version: {0}. You can keep working during the download and choose when to restart.",
  "\u5F53\u524D\u7248\u672C\uFF1A{0}\u3002\u6B64\u5B89\u88C5\u5305\u4F7F\u7528\u624B\u52A8\u66F4\u65B0\uFF0C\u8BF7\u4E0B\u8F7D\u5BF9\u5E94\u67B6\u6784\u7684\u5B89\u88C5\u5305\u8986\u76D6\u5B89\u88C5\u3002macOS \u5E94\u7528\u5185\u5B89\u88C5\u66F4\u65B0\u9700\u8981\u5DF2\u7B7E\u540D\u7684\u6B63\u5F0F\u7248\u672C\u3002": "Current version: {0}. This package requires manual updates. Download the installer for your architecture and install it over this version. Updates installed within the macOS app require a signed official release.",
  "\u4E0B\u8F7D\u66F4\u65B0": "Download Update",
  "\u6253\u5F00\u4E0B\u8F7D\u9875\u9762": "Open Downloads",
  "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002": "The operation failed. Try again later.",
  "{0} \u53EF\u7528\u3002\u70B9\u51FB\u67E5\u770B\uFF0C\u6216\u4ECE\u201C\u5E2E\u52A9 \u2192 \u68C0\u67E5\u66F4\u65B0\u201D\u7EE7\u7EED\u3002": "{0} is available. Click to view it, or continue from Help \u2192 Check for Updates.",
  "\u91CD\u542F\u5E76\u5B89\u88C5\u66F4\u65B0\u2026": "Restart and Install Update\u2026",
  "\u4E0B\u8F7D\u4E0E\u53D1\u884C\u8BF4\u660E": "Downloads and Release Notes",
  "\u65E0\u6CD5\u5B8C\u6210\u66F4\u65B0\u3002\u8BF7\u68C0\u67E5\u7F51\u7EDC\uFF0C\u6216\u524D\u5F80\u4E0B\u8F7D\u4E0E\u53D1\u884C\u8BF4\u660E\u9875\u9762\u624B\u52A8\u5B89\u88C5\u540E\u91CD\u8BD5\u3002": "The update could not be completed. Check your connection or install it manually from Downloads and Release Notes.",
  "{0} \u9605\u8BFB\u6458\u8981": "{0} Reading Summary",
  "\u6587\u6863\u8981\u70B9": "Document Highlights",
  "\u9605\u8BFB\u63D0\u793A": "Reading Note",
  "\u6B63\u6587\u6CA1\u6709\u53EF\u6458\u5F55\u7684\u6BB5\u843D\uFF0C\u8BF7\u67E5\u770B AI \u6267\u884C\u6587\u6863\u3002": "There are no paragraphs to excerpt. Read the AI execution document.",
  "\u8BF7\u67E5\u770B\u5B8C\u6574\u6267\u884C\u6587\u6863\u4E2D\u7684\u8BE6\u7EC6\u5185\u5BB9\u3002": "Read the complete execution document for details.",
  "\u9605\u8BFB\u7B80\u62A5": "READING BRIEF",
  "\u672C\u9875\u662F\u5BF9\u5E94\u4FEE\u8BA2\u7684\u4EBA\u7C7B\u7B80\u62A5\u3002": "This page is the human reading brief for the corresponding revision.",
  "\u672C\u9875\u6458\u5F55\u539F\u6587\u4E2D\u7684\u90E8\u5206\u6BB5\u843D\uFF0C\u53EF\u80FD\u7701\u7565\u4E0A\u4E0B\u6587\u3002": "This page excerpts selected paragraphs from the source and may omit context.",
  "\u540E\u7EED\u6267\u884C\u3001\u590D\u6838\u4E0E\u63A5\u7EB3\u4EE5\u5B8C\u6574 AI \u6267\u884C\u6587\u6863\u4E3A\u51C6\u3002": "Use the complete AI execution document for subsequent execution, review and acceptance.",
  "\u5B8C\u6574\u6587\u6863\uFF1A": "Complete document: ",
  "\u6765\u6E90\u7248\u672C\uFF1A": "Source revision: ",
  "\u672C\u9875\u968F\u6765\u6E90\u7248\u672C\u751F\u6210\uFF0C\u53EF\u79BB\u7EBF\u9605\u8BFB\u4E0E\u6253\u5370\u3002": "Generated with the source revision. Available for offline reading and printing."
};

// packages/i18n/defaults.ts
var messages6 = {
  "CSV \u5BFC\u5165\u9A8C\u6536\u9879\u76EE": "CSV import demo",
  "\u4E3A\u73B0\u6709\u9879\u76EE\u589E\u52A0 CSV \u5BFC\u5165": "Add CSV import to an existing project",
  "\u652F\u6301\u666E\u901A\u5B57\u6BB5\u3001\u5F15\u53F7\u4E2D\u9017\u53F7\u3001\u53CC\u5F15\u53F7\u8F6C\u4E49\u3001CRLF \u548C\u9519\u8BEF\u8F93\u5165\u3002": "Support plain fields, quoted commas, escaped quotes, CRLF, and invalid input.",
  "\u89C4\u683C\u9A71\u52A8\u5F00\u53D1": "Spec-driven development",
  "\u9700\u6C42\u89C4\u683C": "Requirements specification",
  "\u9700\u6C42\u6F84\u6E05": "Requirements clarification",
  "\u89C4\u683C\u590D\u6838": "Specification review",
  "\u5DE5\u7A0B\u8BBE\u8BA1": "Technical design",
  "\u8BBE\u8BA1\u590D\u6838": "Design review",
  "\u4EFB\u52A1\u62C6\u89E3": "Task breakdown",
  "\u4EFB\u52A1\u590D\u6838": "Task review",
  "\u4EE3\u7801\u5B9E\u73B0": "Implementation",
  "\u6D4B\u8BD5\u4E0E\u68C0\u67E5": "Tests and checks",
  "\u4EE3\u7801\u590D\u6838": "Code review",
  "\u6536\u655B\u4E0E\u5BF9\u9F50": "Convergence and alignment",
  "\u6536\u655B\u590D\u6838": "Convergence review",
  "\u63A5\u7EB3\u4EE3\u7801": "Accept code",
  "\u5B9E\u73B0\u8BF4\u660E": "Implementation notes",
  "\u5BF9\u9F50\u62A5\u544A": "Alignment report",
  "\u5206\u6790\u9700\u6C42\u548C\u4ED3\u5E93\uFF0C\u4EA7\u51FA\u5177\u6709\u9A8C\u6536\u6807\u51C6\u7684\u9700\u6C42\u89C4\u683C\u3002\u5B58\u5728\u672A\u77E5\u4FE1\u606F\u65F6\u63D0\u51FA\u660E\u786E\u95EE\u9898\u3002": "Analyze the requirements and repository. Produce a requirements specification with acceptance criteria, and ask clear questions about unknowns.",
  "\u68C0\u67E5\u89C4\u683C\u7684\u529F\u80FD\u8FB9\u754C\u3001\u5F02\u5E38\u573A\u666F\u3001\u6570\u636E\u7EA6\u675F\u548C\u9A8C\u6536\u6807\u51C6\u3002\u4EC5\u8BE2\u95EE\u5F71\u54CD\u8BBE\u8BA1\u548C\u9A8C\u8BC1\u7684\u5173\u952E\u95EE\u9898\uFF0C\u6574\u4E2A\u6F84\u6E05\u4F1A\u8BDD\u6700\u591A 5 \u4E2A\u95EE\u9898\u3002\u8BFB\u53D6\u5DF2\u6709\u7B54\u590D\uFF0C\u4FDD\u7559\u9700\u6C42 ID\uFF0C\u628A\u5DF2\u786E\u8BA4\u7684\u51B3\u7B56\u5199\u56DE\u5B8C\u6574\u9700\u6C42\u89C4\u683C\u3002": "Check functional boundaries, failure cases, data constraints, and acceptance criteria. Ask only questions that affect design or verification, with at most five questions in the entire clarification session. Read existing answers, preserve requirement IDs, and incorporate confirmed decisions into the complete specification.",
  "\u72EC\u7ACB\u68C0\u67E5\u89C4\u683C\u7684\u5B8C\u6574\u6027\u3001\u6B67\u4E49\u548C\u53EF\u9A8C\u8BC1\u6027\u3002": "Independently review the specification for completeness, ambiguity, and verifiability.",
  "\u4F9D\u636E\u5DF2\u63A5\u7EB3\u89C4\u683C\u5206\u6790\u73B0\u6709\u4EE3\u7801\uFF0C\u4EA7\u51FA\u6A21\u5757\u3001\u63A5\u53E3\u3001\u8BBE\u8BA1\u51B3\u7B56\u548C\u98CE\u9669\u3002": "Analyze the existing code against the accepted specification. Document modules, interfaces, design decisions, and risks.",
  "\u72EC\u7ACB\u68C0\u67E5\u5DE5\u7A0B\u8BBE\u8BA1\u662F\u5426\u6EE1\u8DB3\u9700\u6C42\uFF0C\u5B9A\u4F4D\u5177\u4F53\u95EE\u9898\u3002": "Independently check whether the technical design meets the requirements and identify specific issues.",
  "\u62C6\u89E3\u5B9E\u73B0\u4EFB\u52A1\u3002\u6BCF\u9879\u4EFB\u52A1\u5305\u542B\u552F\u4E00 ID\u3001\u4F9D\u8D56\u548C\u9A8C\u6536\u6761\u4EF6\u3002": "Break the implementation into tasks. Give each task a unique ID, dependencies, and acceptance criteria.",
  "\u68C0\u67E5\u4EFB\u52A1\u8986\u76D6\u3001\u4F9D\u8D56\u548C\u9A8C\u6536\u6761\u4EF6\u3002": "Review task coverage, dependencies, and acceptance criteria.",
  "\u6309\u5DF2\u63A5\u7EB3\u4EFB\u52A1\u6539\u52A8\u4EE3\u7801\uFF0C\u8FD0\u884C\u76F8\u5173\u6D4B\u8BD5\u5E76\u8BB0\u5F55\u5B9E\u73B0\u8BF4\u660E\u3002": "Implement the accepted tasks, run the relevant tests, and document the implementation.",
  "\u72EC\u7ACB\u68C0\u67E5\u8865\u4E01\u4E0E\u89C4\u683C\u3001\u4EFB\u52A1\u3001\u6D4B\u8BD5\u8986\u76D6\u662F\u5426\u4E00\u81F4\u3002": "Independently check that the patch, specification, tasks, and test coverage agree.",
  "\u6838\u5BF9\u9700\u6C42\u3001\u4EFB\u52A1\u3001\u4EE3\u7801\u4E0E\u9A8C\u8BC1\u8BC1\u636E\uFF0C\u4EA7\u51FA\u5BF9\u9F50\u62A5\u544A\u3002": "Cross-check requirements, tasks, code, and verification evidence. Produce an alignment report.",
  "\u590D\u6838\u5BF9\u9F50\u62A5\u544A\uFF0C\u786E\u8BA4\u6CA1\u6709\u9057\u6F0F\u9700\u6C42\u548C\u8BC1\u636E\u3002": "Review the alignment report and confirm that no requirements or evidence are missing.",
  "\u4EE3\u7801\u5FC5\u987B\u53EF\u9A8C\u8BC1\uFF1B\u9700\u6C42\u4E0E\u4EFB\u52A1\u5177\u6709\u7A33\u5B9A ID\uFF1B\u6240\u6709 AI \u4EA7\u7269\u9700\u8981\u72EC\u7ACB\u590D\u6838\uFF1B\u9A8C\u8BC1\u8BC1\u636E\u7ED1\u5B9A\u4EE3\u7801\u7248\u672C\u3002": "Code must be verifiable. Requirements and tasks must have stable IDs. All AI artifacts require independent review. Verification evidence must be bound to the code version."
};

// packages/i18n/plugin.ts
var messages7 = {
  "\u5DF2\u5173\u8054\u5F53\u524D\u5BF9\u8BDD\u5DE5\u7A0B": "Linked to the current chat project",
  "\u6062\u590D\u5DF2\u4FDD\u5B58\u56DE\u7B54": "Restore saved answers",
  "\u53D6\u6D88\u914D\u7F6E\u4FEE\u6539": "Discard configuration changes",
  "\u53D6\u6D88\u56DE\u7B54\u4FEE\u6539": "Discard answer changes",
  "\u6709\u672A\u4FDD\u5B58\u7684\u7F16\u8F91\u3002\u4FDD\u5B58\u6216\u53D6\u6D88\u7F16\u8F91\u540E\uFF0C\u5373\u53EF\u5207\u6362\u5DE5\u7A0B\u6216\u5DE5\u4F5C\u9879\u3002": "You have unsaved edits. Save or cancel them before switching projects or work items.",
  "\u6B63\u5728\u5173\u8054\u5F53\u524D\u5BF9\u8BDD\u5DE5\u7A0B\u2026": "Linking the current chat project\u2026",
  "\u5F53\u524D\u5BF9\u8BDD\u76EE\u5F55\u5DF2\u53D8\u5316\uFF0C\u4FDD\u5B58\u6216\u53D6\u6D88\u7F16\u8F91\u540E\u5C06\u81EA\u52A8\u5173\u8054\u3002": "The chat directory changed. Save or cancel your edits to link its project.",
  "\u65E0\u6CD5\u81EA\u52A8\u5173\u8054\u5F53\u524D\u5BF9\u8BDD\u76EE\u5F55\uFF0C\u8BF7\u624B\u52A8\u9009\u62E9\u5DE5\u7A0B\u6216\u6253\u5F00 Git \u4ED3\u5E93\u3002": "Could not link the chat directory. Select a project or open a Git repository.",
  "\u5F53\u524D\u4F1A\u8BDD\u7684\u5DE5\u7A0B\u76EE\u5F55\u4E0D\u53EF\u7528\uFF0C\u8BF7\u6253\u5F00\u5176\u4ED6\u672C\u5730 Git \u4ED3\u5E93\u3002": "The current chat project directory is unavailable. Open another local Git repository.",
  "\u8BED\u8A00\u8BBE\u7F6E\u672A\u80FD\u4FDD\u5B58\uFF0C\u8BF7\u91CD\u8BD5\u3002": "Could not save the language setting. Try again.",
  "\u4E3A {0} \u521B\u5EFA\u5DE5\u4F5C\u9879\u3002\u6BCF\u4E2A\u5DE5\u4F5C\u9879\u4F1A\u4F7F\u7528\u72EC\u7ACB\u7684\u5206\u652F\u4E0E\u5DE5\u4F5C\u533A\u3002": "Create a work item for {0}. Each work item uses a separate branch and workspace.",
  "\u63A5\u7EB3\u4EE5\u5B8C\u6574\u6267\u884C\u6587\u6863\u4E3A\u51C6\uFF1B\u672C\u7B80\u62A5\u4E0E\u4FEE\u8BA2 {0} \u5BF9\u5E94\u3002": "Acceptance uses the complete execution document. This brief corresponds to revision {0}.",
  "Specflow \u5DE5\u7A0B\u5DE5\u4F5C\u53F0": "Specflow Workbench",
  "\u4ECE\u9700\u6C42\u3001\u89C4\u683C\u5230\u590D\u6838\u4E0E\u9A8C\u6536": "From requirements and specifications to review and acceptance",
  "\u5F85\u6267\u884C": "Pending",
  "\u542F\u52A8\u4E2D": "Starting",
  "\u6267\u884C\u4E2D": "Running",
  "\u5F85\u56DE\u7B54": "Awaiting Answer",
  "\u5DF2\u7ED3\u675F": "Finished",
  "\u5931\u8D25": "Failed",
  "\u5DF2\u505C\u6B62": "Stopped",
  "\u5F85\u6838\u5BF9": "Awaiting Reconciliation",
  "\u5DF2\u901A\u8FC7": "Passed",
  "\u88AB\u963B\u585E": "Blocked",
  "\u5DF2\u8FC7\u671F": "Stale",
  "\u5DF2\u63A5\u7EB3": "Accepted",
  "\u8FDB\u884C\u4E2D": "Active",
  "\u5F85\u9A8C\u6536": "Ready for Acceptance",
  "\u5B9E\u73B0\u4E2D": "Implementing",
  "\u5F85\u63A5\u7EB3": "Candidate",
  "\u9700\u6C42\u89C4\u683C": "Requirements Specification",
  "\u5DE5\u7A0B\u8BBE\u8BA1": "Engineering Design",
  "\u4EFB\u52A1\u62C6\u89E3": "Task Breakdown",
  "\u5B9E\u73B0\u8BF4\u660E": "Implementation Notes",
  "\u5BF9\u9F50\u62A5\u544A": "Alignment Report",
  "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5\u3002": "The operation failed. Refresh and try again.",
  "\u4E0A\u6B21\u5199\u5165\u7684\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u5237\u65B0\u5E76\u6838\u5BF9\u5DE5\u7A0B\u8BB0\u5F55\u540E\u7EE7\u7EED\u3002": "The previous write has not been confirmed. Refresh and reconcile the project records before continuing.",
  "\u8BF7\u5148\u5237\u65B0\u5DE5\u7A0B\u72B6\u6001\uFF0C\u518D\u6267\u884C\u64CD\u4F5C\u3002": "Refresh the project state before continuing.",
  "\u64CD\u4F5C\u5DF2\u8BB0\u5F55\uFF0C\u6B63\u5728\u540C\u6B65\u5DE5\u7A0B\u72B6\u6001\u3002": "The operation was recorded. Synchronizing project state.",
  "\u5199\u5165\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u5237\u65B0\u5E76\u6838\u5BF9\u8FD0\u884C\u8BB0\u5F55\u3002": "The write result is unconfirmed. Refresh and reconcile the run records.",
  "\u5237\u65B0\u5DE5\u7A0B\u72B6\u6001": "Refresh Project State",
  "\u5DE5\u7A0B": "Project",
  "\uFF0B \u6253\u5F00\u4ED3\u5E93": "\uFF0B Open Repository",
  "\u9009\u62E9\u672C\u5730\u5DE5\u7A0B": "Select a Local Project",
  "\u5DE5\u4F5C\u9879": "Work Item",
  "\uFF0B \u65B0\u9700\u6C42": "\uFF0B New Requirement",
  "\u9009\u62E9\u5DE5\u4F5C\u9879": "Select a Work Item",
  "\u6B64\u5DE5\u7A0B\u8FD8\u6CA1\u6709\u9700\u6C42": "This project has no requirements yet",
  "\u6709\u672A\u4FDD\u5B58\u7684\u6B63\u6587\u7F16\u8F91\u3002\u4FDD\u5B58\u6216\u53D6\u6D88\u7F16\u8F91\u540E\uFF0C\u5373\u53EF\u5207\u6362\u5DE5\u7A0B\u6216\u5DE5\u4F5C\u9879\u3002": "You have unsaved content edits. Save or cancel them before switching projects or work items.",
  "\u5237\u65B0\u6838\u5BF9": "Refresh and Reconcile",
  "\u5DE5\u7A0B\u5DE5\u4F5C\u533A": "Project Workspace",
  "\u6D41\u7A0B": "Workflow",
  "\u6587\u6863": "Documents",
  "\u4EE3\u7801": "Code",
  "\u8FD0\u884C": "Runs",
  "\u6B63\u5728\u8BFB\u53D6\u672C\u5730\u5DE5\u7A0B\u2026": "Loading local project\u2026",
  "\u628A\u9700\u6C42\u53D8\u6210\u53EF\u9A8C\u8BC1\u7684\u5DE5\u7A0B": "Turn requirements into verifiable engineering",
  "\u6253\u5F00\u4E00\u4E2A\u672C\u5730 Git \u4ED3\u5E93\uFF0C\u4ECE\u9700\u6C42\u89C4\u683C\u5F00\u59CB\u5EFA\u7ACB\u5B8C\u6574\u7684\u5F00\u53D1\u8BB0\u5F55\u3002": "Open a local Git repository and start building a complete development record from the requirements specification.",
  "\u4ECE\u4E00\u4E2A\u65B0\u9700\u6C42\u5F00\u59CB": "Start with a new requirement",
  "\u4E3A": "Create a work item for",
  "\u521B\u5EFA\u5DE5\u4F5C\u9879\u3002\u6BCF\u4E2A\u5DE5\u4F5C\u9879\u4F1A\u4F7F\u7528\u72EC\u7ACB\u7684\u5206\u652F\u4E0E\u5DE5\u4F5C\u533A\u3002": ". Each work item uses a separate branch and workspace.",
  "\u672C\u5730\u5DE5\u7A0B\u8BB0\u5F55": "Local Project Records",
  "\u6B63\u5728\u64CD\u4F5C": "Working",
  "\u540C\u6B65\u4E2D": "Synchronizing",
  "DSH \u63D2\u4EF6": "DSH Plugin",
  "\u6253\u5F00\u672C\u5730 Git \u4ED3\u5E93": "Open a Local Git Repository",
  "\u521B\u5EFA\u65B0\u9700\u6C42": "Create a New Requirement",
  "\u5DE5\u7A0B\u540D\u79F0\uFF08\u53EF\u9009\uFF09": "Project Name (Optional)",
  "\u9700\u6C42\u540D\u79F0": "Requirement Name",
  "\u4ED3\u5E93\u7EDD\u5BF9\u8DEF\u5F84": "Absolute Repository Path",
  "\u9700\u6C42\u4E0E\u9A8C\u6536\u9884\u671F": "Requirements and Acceptance Expectations",
  "\u5E0C\u671B\u5B9E\u73B0\u4EC0\u4E48\uFF1F\u54EA\u4E9B\u884C\u4E3A\u4EE3\u8868\u5B8C\u6210\uFF1F": "What should be implemented? Which behaviors indicate completion?",
  "\u53D6\u6D88": "Cancel",
  "\u6253\u5F00\u5DE5\u7A0B": "Open Project",
  "\u521B\u5EFA\u5DE5\u4F5C\u9879": "Create Work Item",
  "\u5DE5\u7A0B\u6D41\u7A0B": "Engineering Workflow",
  "\u4E2A\u6B65\u9AA4\u5DF2\u901A\u8FC7": "steps passed",
  "\u6536\u8D77\u6B65\u9AA4": "Collapse Steps",
  "\u5207\u6362\u6B65\u9AA4": "Switch Step",
  "\u5EFA\u7ACB\u6D41\u7A0B": "Create Workflow",
  "\u6D41\u7A0B\u6B65\u9AA4": "Workflow Steps",
  "\u8FDE\u63A5\u4E0E\u6A21\u578B": "Connection and Model",
  "\u5728 DSH \u4E2D\u914D\u7F6E\u6A21\u578B\u540E\u5237\u65B0": "Configure models in DSH, then refresh",
  "\u8BF7\u5148\u5728 DSH \u914D\u7F6E\u53EF\u7528\u6A21\u578B\uFF0C\u518D\u5237\u65B0\u5DE5\u7A0B\u72B6\u6001\u3002": "Configure an available model in DSH, then refresh the project state.",
  "\u9700\u6C42\u6B63\u6587\u6709\u672A\u4FDD\u5B58\u7684\u7F16\u8F91\uFF0C\u8BF7\u5148\u4FDD\u5B58\u6216\u53D6\u6D88\uFF0C\u518D\u542F\u52A8\u6B65\u9AA4\u3002": "The requirements have unsaved edits. Save or cancel them before starting a step.",
  "\u505C\u6B62\u5F53\u524D\u5C1D\u8BD5": "Stop Current Attempt",
  "\u6838\u5BF9\u4EE3\u7801\u5E76\u9A8C\u6536": "Review and Accept Code",
  "\u542F\u52A8\u6B64\u6B65\u9AA4": "Start This Step",
  "\u91CD\u65B0\u6267\u884C": "Run Again",
  "\u4E0A\u4F20\u8D44\u6599": "Uploaded Material",
  "\u4ED3\u5E93\u8D44\u6599": "Repository Material",
  "\u7C98\u8D34\u8D44\u6599": "Pasted Material",
  "\u5DF2\u6709\u9700\u6C42\u8D44\u6599 \xB7": "Existing Requirement Documents \xB7",
  "\u4EFD": "documents",
  "\u9700\u6C42\u5DF2\u6709\u65B0\u4FEE\u8BA2\uFF0C\u5F53\u524D\u8349\u7A3F\u5DF2\u4FDD\u7559\u3002\u8BF7\u6BD4\u8F83\u6700\u65B0\u9700\u6C42\u540E\u7EE7\u7EED\u7F16\u8F91\u3002": "The requirements have a newer revision. Your draft is preserved; compare the latest requirements before editing further.",
  "\u539F\u59CB\u9700\u6C42\u4E0E\u5DE5\u4F5C\u533A": "Original Requirements and Workspace",
  "\u7F16\u8F91\u9700\u6C42\u6B63\u6587": "Edit Requirements",
  "\u57FA\u4E8E": "Based on",
  "\u4FDD\u5B58\u4F1A\u521B\u5EFA\u65B0\u7684\u9700\u6C42\u4FEE\u8BA2\uFF0C\u5DF2\u6709\u8D44\u6599\u4F1A\u4E00\u5E76\u4FDD\u7559\uFF1B\u53D7\u5F71\u54CD\u7684\u6B65\u9AA4\u9700\u8981\u91CD\u65B0\u5206\u6790\u6216\u590D\u6838\u3002": "Saving creates a new requirements revision and preserves existing documents. Affected steps must be analyzed or reviewed again.",
  "\u9700\u6C42\u5DF2\u6709\u65B0\u4FEE\u8BA2\u3002\u4F60\u7684\u6B63\u6587\u8349\u7A3F\u548C\u8D44\u6599\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u5148\u6BD4\u8F83\u6700\u65B0\u9700\u6C42\u3002": "The requirements have a newer revision. Your content draft and documents are preserved; compare the latest requirements first.",
  "\u67E5\u770B\u6700\u65B0\u9700\u6C42": "View Latest Requirements",
  "\u4EE5\u6700\u65B0\u4FEE\u8BA2\u7EE7\u7EED\u7F16\u8F91": "Continue Editing from Latest Revision",
  "\u4FDD\u7559\u4F60\u7684\u6B63\u6587\u8349\u7A3F\uFF0C\u5E76\u91C7\u7528\u6700\u65B0\u4FEE\u8BA2\u4E2D\u7684\u9700\u6C42\u8D44\u6599\u3002": "Keep your content draft and use the requirement documents from the latest revision.",
  "\u9700\u6C42\u6B63\u6587": "Requirements",
  "\u53D6\u6D88\u7F16\u8F91\u9700\u6C42": "Cancel Requirements Editing",
  "\u6B63\u5728\u4FDD\u5B58\u2026": "Saving\u2026",
  "\u4FDD\u5B58\u9700\u6C42": "Save Requirements",
  "\u9700\u6C42\u4FEE\u8BA2": "Requirements Revision",
  "\u7F16\u8F91\u9700\u6C42": "Edit Requirements",
  "\u5C1A\u672A\u586B\u5199\u9700\u6C42\u8BF4\u660E\u3002": "No requirements description yet.",
  "\u9700\u8981\u4F60\u7684\u51B3\u5B9A": "Your Decision Is Needed",
  "\u8865\u5168\u9700\u6C42\u4E2D\u7684\u5173\u952E\u95EE\u9898": "Resolve key questions in the requirements",
  "\u56DE\u7B54\u4F1A\u5199\u5165\u5F53\u524D\u89C4\u683C\uFF0C\u968F\u540E\u7EE7\u7EED\u6F84\u6E05\u3002\u6682\u65F6\u79BB\u5F00\u524D\u53EF\u4EE5\u4FDD\u5B58\u8349\u7A3F\u3002": "Answers are included in the current specification before clarification continues. Save a draft before leaving.",
  "\u4FDD\u5B58\u8349\u7A3F": "Save Draft",
  "\u63D0\u4EA4\u56DE\u7B54\u5E76\u7EE7\u7EED": "Submit Answers and Continue",
  '\u547D\u4EE4\u53C2\u6570\u8BF7\u586B\u5199 JSON \u5B57\u7B26\u4E32\u6570\u7EC4\uFF0C\u4F8B\u5982 ["run", "test"]\u3002': 'Enter command arguments as a JSON string array, such as ["run", "test"].',
  "\u5DE5\u7A0B\u914D\u7F6E\u4E0E\u9A8C\u8BC1\u547D\u4EE4": "Project Configuration and Verification Commands",
  "\u5206\u6790": "Analysis",
  "\u8BBE\u8BA1": "Design",
  "\u5F00\u53D1": "Development",
  "\u590D\u6838": "Review",
  "\u9ED8\u8BA4\u6A21\u578B": "Default Model",
  "\u6BCF\u6B21\u542F\u52A8\u65F6\u9009\u62E9": "Select When Starting Each Run",
  "\u5DE5\u7A0B\u89C4\u5219": "Project Rules",
  "\u9A8C\u8BC1\u547D\u4EE4": "Verification Command",
  "\u547D\u4EE4\u53C2\u6570\uFF08JSON \u6570\u7EC4\uFF09": "Command Arguments (JSON Array)",
  '\u9A8C\u8BC1\u5728\u5DE5\u4F5C\u9879\u7684\u72EC\u7ACB\u5DE5\u4F5C\u533A\u4E2D\u6267\u884C\u3002npm \u9879\u76EE\u53EF\u4F7F\u7528 npm \u4E0E ["run", "test"]\u3002': 'Verification runs in the work item\u2019s separate workspace. For npm projects, use npm with ["run", "test"].',
  "\u4FDD\u5B58\u5DE5\u7A0B\u914D\u7F6E": "Save Project Configuration",
  "\u4EA7\u7269\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC": "Artifacts will appear here",
  "\u5B8C\u6210\u9700\u6C42\u89C4\u683C\u3001\u5DE5\u7A0B\u8BBE\u8BA1\u6216\u4EFB\u52A1\u62C6\u89E3\u540E\uFF0C\u53EF\u9605\u8BFB\u5B8C\u6574\u6587\u6863\u5E76\u4EBA\u5DE5\u63A5\u7EB3\u3002": "After completing the requirements specification, engineering design or task breakdown, read the complete documents and accept them manually.",
  "\u6587\u6863\u5DF2\u6709\u65B0\u4FEE\u8BA2\uFF0C\u7F16\u8F91\u8349\u7A3F\u5DF2\u4FDD\u7559\u3002\u8BF7\u6BD4\u8F83\u6700\u65B0\u6587\u6863\u540E\u7EE7\u7EED\u7F16\u8F91\u3002": "The document has a newer revision. Your draft is preserved; compare the latest document before editing further.",
  "\u5DE5\u7A0B\u6587\u6863": "Project Documents",
  "\u4FEE\u8BA2": "Revision",
  "\u5DF2\u72EC\u7ACB\u590D\u6838": "Independently Reviewed",
  "\u5F85\u72EC\u7ACB\u590D\u6838": "Awaiting Independent Review",
  "\u7F16\u8F91\u6587\u6863": "Edit Document",
  "\u65B0\u5019\u9009\u6587\u6863\u5DF2\u4FDD\u5B58\uFF0C\u6B63\u5728\u540C\u6B65\u3002\u5B8C\u6210\u72EC\u7ACB\u590D\u6838\u540E\u624D\u80FD\u63A5\u7EB3\u3002": "The new candidate document is saved and synchronizing. Acceptance requires independent review.",
  "\u7F16\u8F91\u5B8C\u6574\u6267\u884C\u6587\u6863": "Edit Complete Execution Document",
  "\u4EBA\u5DE5\u4FEE\u6539\u4F1A\u751F\u6210\u65B0\u7684\u5019\u9009\u4FEE\u8BA2\uFF0C\u9700\u8981\u91CD\u65B0\u72EC\u7ACB\u590D\u6838\u4E0E\u63A5\u7EB3\u3002": "Manual edits create a new candidate revision requiring independent review and acceptance again.",
  "\u6587\u6863\u5DF2\u6709\u65B0\u4FEE\u8BA2\u3002\u4F60\u7684\u7F16\u8F91\u8349\u7A3F\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u5148\u6BD4\u8F83\u6700\u65B0\u6587\u6863\u3002": "The document has a newer revision. Your draft is preserved; compare the latest document first.",
  "\u67E5\u770B\u6700\u65B0\u6587\u6863": "View Latest Document",
  "\u4FDD\u7559\u4F60\u7684\u6B63\u6587\u8349\u7A3F\uFF0C\u5C06\u6700\u65B0\u6587\u6863\u8BBE\u4E3A\u4FDD\u5B58\u57FA\u7EBF\u3002": "Keep your content draft and use the latest document as the save baseline.",
  "\u6587\u6863 Markdown \u6B63\u6587": "Document Markdown Content",
  "\u53D6\u6D88\u7F16\u8F91\u6587\u6863": "Cancel Document Editing",
  "\u4FDD\u5B58\u65B0\u5019\u9009": "Save New Candidate",
  "\u6587\u6863\u9605\u8BFB\u65B9\u5F0F": "Document Reading Mode",
  "\u9605\u8BFB\u7B80\u62A5": "Reading Brief",
  "\u5B8C\u6574\u6267\u884C\u6587\u6863": "Complete Execution Document",
  "\u4EBA\u7C7B\u9605\u8BFB\u7B80\u62A5": "Human Reading Brief",
  "\u539F\u6587\u6458\u5F55": "Source Excerpts",
  "\u63A5\u7EB3\u4EE5\u5B8C\u6574\u6267\u884C\u6587\u6863\u4E3A\u51C6\uFF1B\u672C\u7B80\u62A5\u4E0E\u4FEE\u8BA2": "Acceptance uses the complete execution document. This brief corresponds to revision",
  "\u5BF9\u5E94\u3002": ".",
  "\u6B63\u5728\u751F\u6210\u9605\u8BFB\u89C6\u56FE\u2026": "Preparing reading view\u2026",
  "\u5F53\u524D\u6587\u6863\u5DF2\u63A5\u7EB3": "The current document is accepted",
  "\u590D\u6838\u5DF2\u5B8C\u6210\uFF0C\u53EF\u6838\u5BF9\u5E76\u63A5\u7EB3": "Review is complete. Check and accept the document",
  "\u5B8C\u6210\u72EC\u7ACB\u590D\u6838\u540E\u624D\u80FD\u63A5\u7EB3": "Independent review is required before acceptance",
  "\u5728 DSH Specflow \u9762\u677F\u4E2D\u6838\u5BF9\u5E76\u63A5\u7EB3": "Reviewed and accepted in the DSH Specflow panel",
  "\u63A5\u7EB3\u6B64\u4FEE\u8BA2": "Accept This Revision",
  "\u963B\u65AD\u9879": "Blocker",
  "\u590D\u6838\u5EFA\u8BAE": "Review Suggestion",
  "\u7B49\u5F85\u4EE3\u7801\u5019\u9009": "Waiting for Candidate Code",
  "\u5B9E\u73B0\u9636\u6BB5\u4F1A\u5728\u72EC\u7ACB\u5DE5\u4F5C\u533A\u4E2D\u4FEE\u6539\u4EE3\u7801\uFF0C\u9A8C\u8BC1\u4E0E\u590D\u6838\u8BB0\u5F55\u4F1A\u4FDD\u5B58\u5728\u8FD9\u91CC\u3002": "The implementation stage modifies code in a separate workspace. Verification and review records are kept here.",
  "\u4EE3\u7801\u5019\u9009": "Candidate Code",
  "\u57FA\u7EBF": "Baseline",
  "\u5019\u9009": "Candidate",
  "\u4EE3\u7801\u5DEE\u5F02": "Code Differences",
  "\u5F53\u524D\u5019\u9009\u6CA1\u6709\u6587\u672C\u5DEE\u5F02\u3002": "This candidate has no text differences.",
  "\u6B63\u5728\u8BFB\u53D6\u4EE3\u7801\u5DEE\u5F02\u2026": "Loading code differences\u2026",
  "\u9A8C\u8BC1\u8BC1\u636E": "Verification Evidence",
  "\xB7 \u5DF2\u8FC7\u671F": "\xB7 Stale",
  "\u9000\u51FA\u7801 {0}": "Exit code {0}",
  "\u6211\u5DF2\u6838\u5BF9\u4EE3\u7801\u5DEE\u5F02\u4E0E\u9A8C\u8BC1\u8BC1\u636E\uFF0C\u786E\u8BA4\u5C06\u5019\u9009\u6574\u5408\u5230\u5DE5\u7A0B": "I reviewed the code differences and verification evidence and approve integrating this candidate into the project",
  "\u8FD0\u884C\u9A8C\u8BC1": "Run Verification",
  "\u63A5\u7EB3\u4EE3\u7801": "Accept Code",
  "\u8FD0\u884C\u8BB0\u5F55\u4ECE\u9996\u6B21\u6D3E\u53D1\u5F00\u59CB": "Run records begin with the first dispatch",
  "\u6BCF\u6B21\u5C1D\u8BD5\u4FDD\u7559\u539F\u59CB\u6A21\u578B\u3001\u6267\u884C\u5E95\u5EA7\u3001\u7ED3\u679C\u548C\u9519\u8BEF\uFF0C\u65B9\u4FBF\u5B9A\u4F4D\u95EE\u9898\u3002": "Every attempt preserves its original model, backend, result and errors for troubleshooting.",
  "\u6267\u884C\u5C1D\u8BD5": "Execution Attempt",
  "\u5C1D\u8BD5 #": "Attempt #",
  "\u6267\u884C\u5E95\u5EA7": "Execution Backend",
  "\u8FDE\u63A5 / \u6A21\u578B": "Connection / Model",
  "\u542F\u52A8\u65F6\u95F4": "Started",
  "\u7ED3\u675F\u65F6\u95F4": "Finished",
  "\u6267\u884C\u4F1A\u8BDD": "Execution Session",
  "\u5C1A\u672A\u7ED1\u5B9A": "Not Bound Yet",
  "\u505C\u6B62": "Stop",
  "\u6838\u5BF9\u6267\u884C\u7ED3\u679C": "Reconcile Execution Result",
  "\u5C1D\u8BD5\u6062\u590D\u539F\u6267\u884C": "Try Resuming Original Execution",
  "\u539F\u6267\u884C\u4E0D\u652F\u6301\u6062\u590D\u3002\u6838\u5BF9\u7ED3\u679C\u540E\uFF0C\u53EF\u5728\u6D41\u7A0B\u4E2D\u91CD\u65B0\u6267\u884C\u6B64\u6B65\u9AA4\u3002": "The original execution cannot be resumed. Reconcile the result, then rerun this workflow step.",
  "\u8FD0\u884C\u8F93\u51FA": "Run Output",
  "\u5F53\u524D\u6CA1\u6709\u5DF2\u6301\u4E45\u5316\u7684\u8F93\u51FA\u3002": "No persisted output is available yet.",
  "\u539F\u59CB\u6267\u884C\u63D0\u793A": "Original Execution Prompt",
  "\u6B63\u5728\u8BFB\u53D6\u2026": "Loading\u2026",
  "\u8FD0\u884C\u6B63\u5728\u7B49\u5F85\u4F60\u7684\u56DE\u7B54": "The run is waiting for your answer",
  "\u56DE\u7B54\uFF08\u6587\u672C\u6216 JSON\uFF09": "Answer (Text or JSON)",
  "\u63D0\u4EA4\u7ED9\u5F53\u524D\u8FD0\u884C": "Submit to Current Run",
  "Specflow \u63D2\u4EF6\u6B63\u5728\u505C\u7528": "The Specflow plugin is stopping",
  "\u8BF7\u91CD\u65B0\u8BFB\u53D6 Specflow \u5FEB\u7167": "Read the Specflow snapshot again",
  "\u76F8\u540C\u547D\u4EE4\u6B63\u5728\u6267\u884C": "The same command is already running",
  "\u8BF7\u6C42\u5B57\u6BB5\u4E0D\u7B26\u5408 Specflow \u5951\u7EA6": "Request fields do not match the Specflow contract",
  "Specflow \u64CD\u4F5C\u5931\u8D25": "Specflow operation failed",
  "\u8BF7\u6C42\u5FC5\u987B\u4E3A JSON": "The request must be JSON",
  "Connection RPC envelope \u65E0\u6548": "Invalid Connection RPC envelope",
  "RPC endpoint \u4E0E method \u4E0D\u4E00\u81F4": "The RPC endpoint does not match its method",
  "\u8BF7\u6C42\u5DF2\u53D6\u6D88": "The request was cancelled",
  "DSH \u4E0D\u652F\u6301\u7EE7\u7EED\u539F\u6765\u7684\u4E2D\u65AD turn\uFF1B\u91CD\u542F\u540E\u53EA\u6838\u5BF9\u6301\u4E45\u4F1A\u8BDD\uFF0C\u4E0D\u81EA\u52A8\u6062\u590D\u6216\u91CD\u590D\u6D3E\u53D1\u3002": "DSH cannot continue an interrupted turn. After a restart, only persistent sessions are reconciled; execution is not automatically resumed or dispatched again.",
  "DSH profile \u6216\u6267\u884C\u8EAB\u4EFD\u5DF2\u53D8\u5316\uFF0C\u4E0D\u80FD\u63A5\u7BA1\u539F\u8FD0\u884C": "The DSH profile or execution identity changed. The original run cannot be taken over",
  "DSH \u6267\u884C\u5F15\u7528\u65E0\u6548": "Invalid DSH execution reference",
  "DSH \u5DE5\u4F5C\u533A\u5FC5\u987B\u4F4D\u4E8E Specflow \u7684\u9694\u79BB\u5DE5\u4F5C\u533A\u76EE\u5F55\u5185": "The DSH workspace must be within Specflow\u2019s isolated workspace directory",
  "\u6CA1\u6709\u539F DSH \u6267\u884C\u7684\u6301\u4E45\u8BB0\u5F55\uFF0C\u4E0D\u80FD\u91CD\u65B0\u6D3E\u53D1": "No persistent record exists for the original DSH execution. It cannot be dispatched again",
  "DSH \u5F15\u7528\u4E0E\u6301\u4E45\u8BB0\u5F55\u4E0D\u5339\u914D": "The DSH reference does not match its persistent record",
  "DSH \u9694\u79BB\u5DE5\u4F5C\u533A\u8EAB\u4EFD\u5DF2\u53D8\u5316": "The DSH isolated workspace identity changed",
  "DSH \u7F3A\u5C11 agents\u3001llm\u3001sessions \u6216 sessionPersistence \u670D\u52A1": "Required DSH services are missing: agents, llm, sessions or sessionPersistence",
  "\u8BF7\u5148\u5728 DSH \u4E2D\u914D\u7F6E\u53EF\u7528\u7684\u6A21\u578B\u63D0\u4F9B\u65B9\u3002": "Configure an available model provider in DSH first.",
  "DSH \u63D2\u4EF6\u6B63\u5728\u5173\u95ED": "The DSH plugin is shutting down",
  "\u6A21\u578B\u76EE\u6807\u5C5E\u4E8E\u5176\u4ED6 DSH profile\uFF0C\u8BF7\u5237\u65B0\u6A21\u578B\u76EE\u5F55": "The model target belongs to another DSH profile. Refresh the model catalog",
  "\u6700\u5927\u6B65\u6570\u5FC5\u987B\u4E3A\u6B63\u6574\u6570": "The maximum step count must be a positive integer",
  "\u539F DSH \u5C1D\u8BD5\u7684\u51BB\u7ED3\u8F93\u5165\u5DF2\u53D8\u5316": "The original DSH attempt\u2019s frozen inputs changed",
  "DSH \u6D3E\u53D1\u672A\u786E\u8BA4\uFF0C\u8BF7\u6838\u5BF9\u539F\u4F1A\u8BDD\uFF1A{0}": "DSH dispatch is unconfirmed. Reconcile the original session: {0}",
  "DSH \u4F1A\u8BDD\u7684\u5DE5\u4F5C\u533A\u4E0E\u539F\u5C1D\u8BD5\u4E0D\u7B26": "The DSH session workspace does not match the original attempt",
  "Specflow \u4F1A\u8BDD\u53EA\u5141\u8BB8\u5F53\u524D\u9694\u79BB\u5DE5\u4F5C\u533A\u7684\u4E13\u7528\u5DE5\u5177": "The Specflow session only permits dedicated tools for its current isolated workspace",
  "DSH \u6301\u4E45\u4F1A\u8BDD\u4E0E\u9694\u79BB\u5DE5\u4F5C\u533A\u4E0D\u5339\u914D": "The persistent DSH session does not match its isolated workspace",
  "DSH \u5C1D\u8BD5\u5C1A\u672A\u6D3E\u53D1\u3002": "The DSH attempt has not been dispatched.",
  "\u65E0\u6CD5\u6838\u5BF9\u539F DSH \u4F1A\u8BDD\uFF1A{0}": "Cannot reconcile the original DSH session: {0}",
  "\u539F DSH \u8F93\u5165\u5C1A\u65E0\u6301\u4E45\u63A5\u6536\u51ED\u636E\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u91CD\u53D1\u3002": "The original DSH input has no persistent acceptance receipt and will not be automatically resent.",
  "DSH \u8F93\u5165\u7F3A\u5C11\u53EF\u6838\u5BF9\u7684 turn \u8EAB\u4EFD\u3002": "The DSH input has no verifiable turn identity.",
  "\u539F DSH turn \u6CA1\u6709\u7EC8\u6001\uFF1B\u8BF7\u6838\u5BF9\u4F1A\u8BDD\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u91CD\u53D1\u3002": "The original DSH turn has no terminal state. Reconcile the session; the request will not be automatically resent.",
  "DSH \u6267\u884C\u8FBE\u5230\u6700\u5927 {0} \u6B65\uFF0C\u5DF2\u505C\u6B62\u3002": "The DSH execution reached its {0}-step limit and was stopped.",
  "DSH turn \u5B8C\u6210\u4F46\u672A\u8FD4\u56DE\u9636\u6BB5\u7ED3\u679C\u3002": "The DSH turn finished without returning a stage result.",
  "\u539F DSH turn \u88AB\u5BBF\u4E3B\u4E2D\u65AD\uFF1B\u4FDD\u7559\u539F\u8EAB\u4EFD\uFF0C\u9700\u4EBA\u5DE5\u6838\u5BF9\u540E\u521B\u5EFA\u65B0\u5C1D\u8BD5\u3002": "The host interrupted the original DSH turn. Its identity is preserved; reconcile it manually before creating a new attempt.",
  "DSH turn \u672A\u6210\u529F\u5B8C\u6210\uFF08{0}\uFF09\u3002": "The DSH turn did not finish successfully ({0}).",
  "\u6B64\u7248\u672C\u628A\u6F84\u6E05\u95EE\u9898\u4FDD\u5B58\u5728\u9636\u6BB5\u4EA7\u7269\u4E2D\uFF0C\u4E0D\u63D0\u4F9B\u4F1A\u8BDD\u5916\u7684\u6388\u6743\u6216\u95EE\u9898\u56DE\u590D": "This version stores clarification questions in stage artifacts and does not support authorization or question answers outside the session",
  "\u5DE5\u5177\u53C2\u6570\u5FC5\u987B\u4E3A\u5BF9\u8C61": "Tool arguments must be an object",
  "{0} \u5FC5\u987B\u4E3A\u5B57\u7B26\u4E32": "{0} must be a string",
  "old_text \u5FC5\u987B\u5728\u6587\u4EF6\u4E2D\u51FA\u73B0\u4E14\u53EA\u51FA\u73B0\u4E00\u6B21": "old_text must occur exactly once in the file",
  "\u53EA\u5141\u8BB8\u5DE5\u4F5C\u533A\u76F8\u5BF9\u8DEF\u5F84": "Only workspace-relative paths are permitted",
  "\u8DEF\u5F84\u8D8A\u8FC7\u5DE5\u4F5C\u533A\u6216\u6307\u5411 .git/\u7279\u6B8A\u8DEF\u5F84": "The path escapes the workspace or points to .git or a special path",
  "\u7B26\u53F7\u94FE\u63A5\u6307\u5411\u5DE5\u4F5C\u533A\u4E4B\u5916": "The symbolic link points outside the workspace",
  "\u5B9E\u9645\u8DEF\u5F84\u6307\u5411 .git": "The resolved path points to .git",
  "\u7236\u76EE\u5F55\u4F4D\u4E8E\u5DE5\u4F5C\u533A\u4E4B\u5916": "The parent directory is outside the workspace",
  "\u7236\u76EE\u5F55\u6307\u5411 .git": "The parent directory points to .git",
  "\u6587\u4EF6\u8DEF\u5F84\u5728\u6253\u5F00\u65F6\u53D1\u751F\u53D8\u5316": "The file path changed while opening it",
  "\u53EA\u652F\u6301\u4E0D\u8D85\u8FC7 1 MiB \u7684\u666E\u901A UTF-8 \u6587\u4EF6\uFF0C\u62D2\u7EDD\u786C\u94FE\u63A5": "Only regular UTF-8 files no larger than 1 MiB are supported; hard links are rejected",
  "\u6587\u4EF6\u4E0D\u662F\u652F\u6301\u7684 UTF-8 \u6587\u672C\u6216\u8D85\u51FA\u5927\u5C0F\u9650\u5236": "The file is not supported UTF-8 text or exceeds the size limit",
  "expected_hash \u5FC5\u987B\u4E3A\u8BFB\u53D6\u8FD4\u56DE\u7684 SHA-256\uFF0C\u65B0\u6587\u4EF6\u4F7F\u7528\u7A7A\u5B57\u7B26\u4E32": "expected_hash must be the SHA-256 returned by a read; use an empty string for new files",
  "\u53EA\u80FD\u5199\u5165\u4E0D\u8D85\u8FC7 1 MiB \u7684 UTF-8 \u6587\u672C": "Only UTF-8 text no larger than 1 MiB can be written",
  "\u6587\u4EF6\u5185\u5BB9\u5DF2\u53D8\u5316\uFF0C\u8BF7\u91CD\u65B0\u8BFB\u53D6\u5E76\u786E\u8BA4 expected_hash": "The file content changed. Read it again and confirm expected_hash",
  "\u62D2\u7EDD\u4FEE\u6539\u975E\u666E\u901A\u6587\u4EF6\u6216\u786C\u94FE\u63A5\u6587\u4EF6": "Modifying non-regular files or files with hard links is prohibited",
  "\u6587\u4EF6\u5199\u5165\u672A\u53D6\u5F97\u8FDB\u5C55": "The file write made no progress"
};

// packages/i18n/execution.ts
var messages8 = {
  "\u6267\u884C\u81EA\u7136\u7ED3\u675F": "Execution finished naturally",
  "\u6B65\u6570\u4E0A\u9650": "Step limit",
  "\u6D3E\u53D1\u6B21\u6570\u4E0A\u9650": "Dispatch limit",
  "\u6267\u884C\u65F6\u9650\u5DF2\u5230": "Execution deadline reached",
  "\u7528\u6237\u8BF7\u6C42\u505C\u6B62": "User requested a stop",
  "\u6388\u6743\u88AB\u62D2\u7EDD": "Permission denied",
  "\u4F9B\u5E94\u5546\u6267\u884C\u9519\u8BEF": "Provider execution error",
  "\u8F93\u5165\u5DF2\u53D8\u5316": "Inputs changed",
  "\u8FDE\u7EED\u65E0\u8FDB\u5C55": "No progress across successive rounds",
  "\u539F\u56E0\u672A\u77E5": "Unknown reason",
  "{value} + {count} \u9879\u672A\u77E5": "{value} + {count} unknown measurements",
  "\u6267\u884C\u63A7\u5236\u4E0E\u7528\u91CF": "Execution controls and usage",
  "\u6267\u884C\u622A\u6B62\u65F6\u95F4": "Execution deadline",
  "\u5386\u53F2\u8BB0\u5F55\u672A\u63D0\u4F9B": "Not available in this historical record",
  "\u505C\u6B62\u539F\u56E0": "Stop reason",
  "\u505C\u6B62\u786E\u8BA4": "Stop confirmation",
  "\u5DF2\u786E\u8BA4\u7EC8\u6001": "Terminal state confirmed",
  "\u6B63\u5728\u8BF7\u6C42\u505C\u6B62": "Requesting a stop",
  "\u5355\u6B21\u6267\u884C\u6B65\u6570": "Steps per execution",
  "\u539F\u751F\u4E0A\u9650": "Native limit",
  "\u89C2\u6D4B\u4FDD\u62A4": "Observed protection",
  "\u80FD\u529B\u672A\u77E5": "Capability unknown",
  "\u7D2F\u8BA1\u6D3E\u53D1\u4E0A\u9650": "Cumulative dispatch limits",
  "\u672C\u5C1D\u8BD5 {attempt} \xB7 \u672C\u6D41\u7A0B {run}": "This attempt: {attempt} \xB7 Workflow: {run}",
  "\u7528\u91CF\u53EF\u80FD\u4E0D\u5B8C\u6574\uFF0C\u672A\u77E5\u9879\u6CA1\u6709\u6309\u96F6\u8BA1\u7B97\u3002": "Usage may be incomplete. Unknown measurements are not counted as zero.",
  "\u89C2\u6D4B\u4FDD\u62A4\u4F1A\u8BF7\u6C42\u505C\u6B62\uFF0C\u4E0D\u80FD\u4FDD\u8BC1\u8FD0\u884C\u6070\u597D\u505C\u5728\u6307\u5B9A\u6B65\u6570\u3002": "Observed protection requests a stop; it cannot guarantee stopping at the exact step limit.",
  "\u505C\u6B62\u8BF7\u6C42\u5C1A\u672A\u786E\u8BA4\uFF1B\u8BF7\u6838\u5BF9\u539F\u6267\u884C\uFF0C\u4E0D\u80FD\u636E\u6B64\u5F00\u59CB\u65B0\u7684\u5199\u5165\u3002": "The stop is unconfirmed. Reconcile the original execution before starting another write.",
  "\u672C\u6B21\u4E0A\u4E0B\u6587\u6E05\u5355": "Context manifest for this attempt",
  "\u5B8C\u6574\u63D0\u793A\u8BCD {bytes} \u5B57\u8282": "Full prompt: {bytes} bytes",
  "{bytes} \u5B57\u8282": "{bytes} bytes",
  "\u5FC5\u9700\u6750\u6599": "Required source",
  "\u8F85\u52A9\u6750\u6599": "Supporting source",
  "\u81EA\u52A8\u63A8\u8FDB\u4E0E\u6709\u9650\u4FEE\u8BA2": "Automatic progression and bounded repair",
  "\u81EA\u52A8\u63A8\u8FDB\u8FD0\u884C\u5230\u9700\u8981\u4F60\u63A5\u7EB3\u3001\u6F84\u6E05\u6216\u6388\u6743\u7684\u4F4D\u7F6E\u3002\u81EA\u52A8\u4FEE\u8BA2\u53EA\u5904\u7406\u5F53\u524D\u76EE\u6807\uFF0C\u4FDD\u7559\u4EBA\u5DE5\u63A5\u7EB3\u3002": "Progress until acceptance, clarification, or permission needs your input. Repair stays within the current target and preserves human acceptance.",
  "\u63A8\u8FDB\u65F6\u5141\u8BB8\u6709\u9650\u81EA\u52A8\u4FEE\u8BA2": "Allow bounded repair during progression",
  "\u6700\u591A\u4FEE\u8BA2\u8F6E\u6570": "Maximum repair rounds",
  "\u505C\u6B62\u81EA\u52A8\u63A8\u8FDB": "Stop automatic progression",
  "\u8FD0\u884C\u5230\u4E0B\u4E00\u5904\u5F85\u5904\u7406": "Run until input is needed",
  "\u505C\u6B62\u81EA\u52A8\u4FEE\u8BA2": "Stop automatic repair",
  "\u81EA\u52A8\u4FEE\u8BA2\u5F53\u524D\u4EA7\u7269": "Repair the current artifact",
  "\u4FEE\u8BA2\u8FDB\u5EA6 {round} / {max}": "Repair progress: {round} / {max}",
  "\u6B63\u5728\u81EA\u52A8\u4FEE\u8BA2": "Automatic repair in progress",
  "\u6B63\u5728\u81EA\u52A8\u63A8\u8FDB": "Automatic progression in progress",
  "\u5DF2\u6682\u505C": "Paused",
  "\u68C0\u67E5\u5DF2\u901A\u8FC7": "Checks passed",
  "\u4FEE\u8BA2\u8F6E\u6570\u5DF2\u7528\u5B8C": "Repair round limit reached",
  "\u5019\u9009\u4EE3\u7801\u5DF2\u53D8\u5316": "Candidate code changed",
  "\u539F\u6267\u884C\u4ECD\u5F85\u6838\u5BF9": "The original execution needs reconciliation",
  "\u6267\u884C\u9884\u7B97\u5DF2\u7528\u5B8C": "Execution budget exhausted",
  "\u9700\u8981\u4EBA\u5DE5\u5904\u7406": "Manual action required",
  "\u81EA\u52A8\u5316\u64CD\u4F5C\u5DF2\u63D0\u4EA4": "Automation request submitted",
  "\u6B63\u5728\u7B49\u5F85\u6F84\u6E05\u6216\u6388\u6743": "Waiting for clarification or permission",
  "\u7B49\u5F85\u4EBA\u5DE5\u63A5\u7EB3": "Waiting for human acceptance",
  "\u9700\u8981\u660E\u786E\u91CD\u8BD5": "An explicit retry is required",
  "\u5DE5\u7A0B\u68C0\u67E5\u672A\u901A\u8FC7": "Engineering checks did not pass",
  "\u5DE5\u7A0B\u6761\u4EF6\u5F85\u786E\u8BA4": "Engineering conditions need confirmation",
  "\u6D41\u7A0B\u5C1A\u672A\u6FC0\u6D3B": "Workflow is not active",
  "{key} \u5FC5\u987B\u4E3A\u6B63\u5B89\u5168\u6574\u6570": "{key} must be a positive safe integer",
  "maxCostUsd \u5FC5\u987B\u4E3A\u6709\u9650\u6B63\u6570": "maxCostUsd must be a finite positive number",
  "strictCostLimit \u5FC5\u987B\u4E3A\u5E03\u5C14\u503C": "strictCostLimit must be a boolean",
  "\u4E25\u683C\u8D39\u7528\u9650\u5236\u5FC5\u987B\u63D0\u4F9B maxCostUsd": "A strict cost limit requires maxCostUsd",
  "\u5F53\u524D\u6267\u884C\u5E95\u5EA7\u4E0D\u652F\u6301\u4E25\u683C\u8D39\u7528\u4E0A\u9650\uFF1B\u4E0D\u80FD\u5C06\u5176\u9759\u9ED8\u6539\u6210\u89C2\u6D4B\u9608\u503C": "The execution backend does not support a strict cost ceiling; it cannot silently become an observed threshold",
  "\u6267\u884C\u622A\u6B62\u65F6\u95F4\u65E0\u6548": "The execution deadline is invalid",
  "\u6D3E\u53D1\u610F\u56FE\u7F3A\u5C11\u5E42\u7B49\u952E\u6216\u8F93\u5165\u54C8\u5E0C": "The dispatch intent is missing an idempotency key or input hash",
  "\u6D3E\u53D1\u7B56\u7565\u542B\u65E0\u6548\u9884\u7B97": "The dispatch policy has an invalid budget",
  "\u9884\u7559\u6B65\u6570\u5FC5\u987B\u4E3A\u6B63\u5B89\u5168\u6574\u6570": "Reserved steps must be a positive safe integer",
  "\u6D3E\u53D1\u5E42\u7B49\u952E\u5DF2\u7528\u4E8E\u4E0D\u540C\u7684\u8F93\u5165\u6216\u7B56\u7565": "The dispatch idempotency key was used for different inputs or policy",
  "\u5DF2\u91CA\u653E\u7684\u6D3E\u53D1\u610F\u56FE\u4E0D\u80FD\u91CD\u590D\u4F7F\u7528": "A released dispatch intent cannot be reused",
  "\u6D3E\u53D1\u5C1D\u8BD5\u4E0D\u5C5E\u4E8E\u6307\u5B9A\u6D41\u7A0B": "The attempt does not belong to this workflow",
  "\u4E0D\u80FD\u66F4\u6539\u5C1D\u8BD5\u51BB\u7ED3\u7684\u6267\u884C\u7B56\u7565": "The frozen execution policy cannot be changed",
  "\u672C\u6B21\u5C1D\u8BD5\u7684\u7D2F\u8BA1\u6D3E\u53D1\u6B21\u6570\u5DF2\u7528\u5B8C": "The attempt dispatch budget is exhausted",
  "\u672C\u6D41\u7A0B\u7684\u7D2F\u8BA1\u6D3E\u53D1\u6B21\u6570\u5DF2\u7528\u5B8C": "The workflow dispatch budget is exhausted",
  "\u65E0\u6CD5\u5C06\u4E0D\u540C\u5E95\u5EA7\u7684\u6B65\u6570\u76F8\u52A0\u4E3A\u540C\u4E00\u9884\u7B97": "Steps from different backends cannot be combined into one budget",
  "\u672C\u6B21\u5C1D\u8BD5\u7684\u7D2F\u8BA1\u9884\u7559\u6B65\u6570\u5DF2\u7528\u5B8C": "The attempt reserved step budget is exhausted",
  "\u65E0\u6CD5\u5728\u4E0D\u540C\u8BA1\u91CF\u5355\u4F4D\u95F4\u5151\u73B0\u6D41\u7A0B\u6B65\u6570\u4E0A\u9650\uFF0C\u8BF7\u4F7F\u7528\u6D3E\u53D1\u6B21\u6570\u9650\u5236": "A workflow step limit cannot span incompatible units; use a dispatch limit",
  "\u672C\u6D41\u7A0B\u7684\u7D2F\u8BA1\u9884\u7559\u6B65\u6570\u5DF2\u7528\u5B8C": "The workflow reserved step budget is exhausted",
  "\u5DF2\u77E5\u8D39\u7528\u8FBE\u5230\u89C2\u6D4B\u9608\u503C\uFF0C\u505C\u6B62\u540E\u7EED\u6D3E\u53D1": "Known costs reached the observed threshold; further dispatches are blocked",
  "\u6D3E\u53D1\u610F\u56FE\u72B6\u6001\u8F6C\u79FB\u65E0\u6548": "Invalid dispatch state transition",
  "\u53EA\u6709\u786E\u8BA4\u4ECE\u672A\u6D3E\u53D1\u7684\u64CD\u4F5C\u624D\u53EF\u91CA\u653E\u9884\u7B97": "Budget can only be released for operations confirmed never dispatched",
  "\u5B9E\u9645\u6B65\u6570\u5FC5\u987B\u6765\u81EA\u5DF2\u786E\u8BA4\u7EC8\u6001\u4E14\u4E3A\u975E\u8D1F\u6574\u6570": "Actual steps must be a nonnegative integer from a confirmed terminal state",
  "\u6D3E\u53D1\u610F\u56FE\u4E0D\u80FD\u66FF\u6362\u539F\u6267\u884C\u8EAB\u4EFD": "A dispatch intent cannot replace the original execution identity",
  "\u7528\u91CF {key} \u5FC5\u987B\u662F\u975E\u8D1F\u6570\u6216 null": "Usage {key} must be nonnegative or null",
  "\u7528\u91CF\u5FC5\u987B\u58F0\u660E\u8BA1\u91CF\u5668\u8303\u56F4": "Usage must declare its meter scope",
  "\u589E\u91CF\u7528\u91CF\u5FC5\u987B\u63D0\u4F9B\u7A33\u5B9A\u4E8B\u4EF6 ID": "Delta usage requires a stable event ID",
  "\u7D2F\u8BA1\u7528\u91CF\u5E8F\u53F7\u5FC5\u987B\u662F\u975E\u8D1F\u6574\u6570": "The cumulative usage sequence must be a nonnegative integer",
  "\u540C\u4E00\u8BA1\u91CF\u5668\u4E0D\u80FD\u6DF7\u5408\u7D2F\u8BA1\u4E0E\u589E\u91CF\u8BFB\u6570": "A meter cannot mix cumulative and delta readings",
  "\u540C\u4E00\u7528\u91CF\u4E8B\u4EF6\u8FD4\u56DE\u4E0D\u540C\u6570\u636E": "The same usage event returned conflicting data",
  "\u4E0A\u4E0B\u6587\u6750\u6599\u5FC5\u987B\u5177\u6709 sourceId": "Context sources must have a sourceId",
  "\u4E0A\u4E0B\u6587\u6750\u6599 {id} \u7684\u5185\u5BB9\u54C8\u5E0C\u4E0D\u5339\u914D": "Content hash mismatch for context source {id}",
  "\u4E0A\u4E0B\u6587\u6750\u6599 {id} \u5B58\u5728\u51B2\u7A81\u7248\u672C": "Context source {id} has conflicting versions",
  "\u4E0A\u4E0B\u6587\u5B57\u8282\u4E0A\u9650\u5FC5\u987B\u4E3A\u6B63\u6574\u6570": "The context byte limit must be a positive integer",
  "\u68C0\u67E5\u6D3E\u53D1\u5B57\u8282\u4E0A\u9650\u5FC5\u987B\u63D0\u4F9B\u5B9E\u9645\u5B8C\u6574\u63D0\u793A\u8BCD": "The complete actual prompt is required to check the dispatch byte limit",
  "\u5B8C\u6574\u9636\u6BB5\u8F93\u5165\u8D85\u8FC7\u5E95\u5EA7\u6587\u672C\u4E0A\u9650\uFF1B\u8BF7\u7F29\u5C0F\u6750\u6599\uFF0C\u4E0D\u5F97\u9759\u9ED8\u622A\u65AD": "The full step input exceeds the backend text limit; reduce the sources without silent truncation",
  "\u4EFB\u52A1\u6587\u6863\u9700\u8981\u7ED3\u6784\u5316 TaskSpec \u6216 - [ ] T001 \u5F62\u5F0F\u7684\u4EFB\u52A1": "The task document requires structured TaskSpec or - [ ] T001 tasks",
  "\u4EFB\u52A1\u4F9D\u8D56\u4E0D\u80FD\u91CD\u590D": "Task dependencies must be unique",
  "\u4EFB\u52A1\u4F9D\u8D56\u6307\u5411\u4E0D\u5B58\u5728\u7684\u4EFB\u52A1": "A dependency refers to a missing task",
  "\u4EFB\u52A1\u5141\u8BB8\u8DEF\u5F84\u4E0D\u80FD\u8D8A\u51FA\u5DE5\u4F5C\u533A": "Allowed task paths must remain inside the workspace",
  "\u7ED3\u6784\u5316\u4EFB\u52A1\u4E0D\u662F\u6709\u6548 JSON": "The structured task document is not valid JSON",
  "\u7ED3\u6784\u5316\u4EFB\u52A1\u5FC5\u987B\u7B26\u5408 TaskSpec v1\uFF0C\u5E76\u663E\u5F0F\u63D0\u4F9B\u4F9D\u8D56\u53CA\u9A8C\u6536\u6761\u4EF6": "Structured tasks must follow TaskSpec v1 with explicit dependencies and acceptance criteria",
  "\u4EFB\u52A1\u4F9D\u8D56\u5FC5\u987B\u4F7F\u7528\u660E\u786E\u4EFB\u52A1 ID\uFF1B\u4E0D\u80FD\u6839\u636E\u81EA\u7136\u8BED\u8A00\u731C\u6D4B": "Dependencies require explicit task IDs; they cannot be inferred from prose",
  "\u4EFB\u52A1\u6307\u5B9A\u7684\u9A8C\u8BC1\u547D\u4EE4\u672A\u5728\u5DE5\u7A0B\u914D\u7F6E\u4E2D\u767B\u8BB0": "A task verification command is not registered in the project configuration",
  "\u6700\u7EC8\u5FC5\u9700\u9A8C\u8BC1\u547D\u4EE4\u672A\u914D\u7F6E": "A required final verification command is not configured",
  "\u6211\u5DF2\u786E\u8BA4\u672C\u673A\u9A8C\u8BC1\u547D\u4EE4\u53CA\u5176\u5B50\u8FDB\u7A0B\u5DF2\u5168\u90E8\u7ED3\u675F\u3002": "I have confirmed that the local verification commands and all their child processes have ended.",
  "\u53EA\u6709\u786E\u8BA4\u672C\u673A\u9A8C\u8BC1\u547D\u4EE4\u53CA\u5176\u5B50\u8FDB\u7A0B\u5168\u90E8\u7ED3\u675F\u540E\uFF0C\u624D\u53EF\u89E3\u9664\u6B64\u963B\u585E\u3002\u662F\u5426\u786E\u8BA4\uFF1F": "Only clear this block after confirming that the local verification commands and all child processes have ended. Confirm?",
  "\u9A8C\u8BC1\u8FDB\u7A0B\u7684\u7EC8\u6001\u5C1A\u672A\u786E\u8BA4\u3002\u8BF7\u5148\u68C0\u67E5\u672C\u673A\u8FDB\u7A0B\uFF1B\u786E\u8BA4\u524D\u4E0D\u4F1A\u5F00\u59CB\u65B0\u7684\u5199\u5165\u6216\u63A5\u7EB3\u3002": "The verification process has no confirmed terminal state. Check local processes first; new writes and acceptance stay blocked until confirmation.",
  "\u786E\u8BA4\u9A8C\u8BC1\u8FDB\u7A0B\u5DF2\u5168\u90E8\u7ED3\u675F": "Confirm all verification processes have ended",
  "\u505C\u6B62\u9A8C\u8BC1\u8BF7\u6C42\u5DF2\u63D0\u4EA4": "Verification stop requested",
  "\u505C\u6B62\u9A8C\u8BC1\u547D\u4EE4": "Stop verification commands",
  "\u9A8C\u8BC1\u8FDB\u7A0B\u786E\u8BA4\u5DF2\u8BB0\u5F55": "Verification process confirmation recorded",
  "\u81EA\u52A8\u5316\u6B63\u5728\u7BA1\u7406\u6B64\u6D41\u7A0B\uFF0C\u8BF7\u5148\u505C\u6B62\u81EA\u52A8\u63A8\u8FDB\u6216\u4FEE\u8BA2\u518D\u624B\u52A8\u6D3E\u53D1\u3002": "Automation is managing this workflow. Stop automatic progression or repair before dispatching manually.",
  "\u9A8C\u8BC1\u8FDB\u7A0B\u8FD8\u672A\u786E\u8BA4\u505C\u6B62\u3002\u6838\u5BF9\u672C\u673A\u8FDB\u7A0B\u540E\uFF0C\u624B\u52A8\u786E\u8BA4\u89E3\u9664\u963B\u585E\u3002": "The verification process has not been confirmed stopped. Check local processes, then confirm manually to clear the block.",
  "\u6838\u5BF9\u9A8C\u8BC1\u8FDB\u7A0B": "Check verification processes"
};

// packages/i18n/execution-diagnostics.ts
var messages9 = {
  "\u6267\u884C\u5DF2\u8BF7\u6C42\u505C\u6B62\uFF0C\u4E0D\u80FD\u6D3E\u53D1\u540E\u7EED\u64CD\u4F5C": "A stop was requested; further actions cannot be dispatched",
  "\u9636\u6BB5\u65F6\u95F4\u4E0A\u9650\u5DF2\u5230\uFF0C\u4E0D\u80FD\u6D3E\u53D1\u540E\u7EED\u64CD\u4F5C": "The step deadline was reached; further actions cannot be dispatched",
  "\u8BF7\u9009\u62E9\u9700\u8981\u4FEE\u8BA2\u7684\u751F\u6210\u9636\u6BB5\uFF1B\u590D\u6838\u5BF9\u8C61\u6CA1\u6709\u552F\u4E00\u751F\u6210\u5C1D\u8BD5": "Select the producer step to repair; the review subjects do not have one unique producer attempt",
  "\u5F53\u524D\u9636\u6BB5\u6CA1\u6709\u53EF\u4FEE\u8BA2\u7684\u751F\u6210\u5C1D\u8BD5": "This step has no producer attempt to repair",
  "\u4FEE\u8BA2\u5FC5\u987B\u6307\u5411\u5F53\u524D\u6D41\u7A0B\u4E2D\u7684\u751F\u6210\u9636\u6BB5": "Repair must target a producer step in the current workflow",
  "\u4FEE\u8BA2\u6240\u5C5E\u6D41\u7A0B\u5DF2\u6682\u505C\u6216\u7ED3\u675F": "The workflow containing this repair is paused or finished",
  "\u4FEE\u8BA2\u7684\u9700\u6C42\u3001\u7AE0\u7A0B\u6216\u4E0A\u6E38\u5DF2\u53D8\u5316": "The repair requirements, constitution, or upstream inputs changed",
  "\u4FEE\u8BA2\u7684\u8F93\u5165\u3001\u9A8C\u8BC1\u914D\u7F6E\u6216\u63A5\u7EB3\u57FA\u7EBF\u5DF2\u53D8\u5316": "The repair inputs, verification configuration, or acceptance baseline changed",
  "\u4FEE\u8BA2\u76EE\u6807\u6587\u6863\u5728\u81EA\u52A8\u5316\u671F\u95F4\u88AB\u5176\u4ED6\u64CD\u4F5C\u4FEE\u6539": "Another operation changed the repair target document during automation",
  "\u4FEE\u8BA2\u7F3A\u5C11\u590D\u6838\u9636\u6BB5\u8BB0\u5F55": "The repair is missing its review step record",
  "\u4FEE\u8BA2\u5E95\u5EA7\u7F3A\u5C11\u590D\u6838\u6A21\u578B\uFF0C\u8BF7\u5148\u914D\u7F6E\u540C\u4E00\u5E95\u5EA7\u7684\u590D\u6838\u89D2\u8272": "Configure a reviewer model on the repair backend before continuing",
  "\u9636\u6BB5\u72B6\u6001\u5DF2\u53D8\u5316\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u65B0\u9009\u62E9\u4FEE\u8BA2": "The step changed; refresh before selecting repair again",
  "\u5F53\u524D\u5DE5\u4F5C\u9879\u6B63\u5728\u51C6\u5907\u81EA\u52A8\u5316": "Automation is being prepared for this work item",
  "\u5DE5\u4F5C\u9879\u5DF2\u6709\u6D3B\u52A8\u4FEE\u8BA2\u5468\u671F": "The work item already has an active repair cycle",
  "\u5DE5\u4F5C\u9879\u4ECD\u6709\u6D3B\u52A8\u6216\u672A\u786E\u8BA4\u6267\u884C\uFF0C\u4E0D\u80FD\u53E6\u5EFA\u4FEE\u8BA2\u5C1D\u8BD5": "The work item has active or unconfirmed execution; another repair attempt cannot start",
  "\u53EA\u6709\u5DF2\u786E\u8BA4\u5B8C\u6210\u7684\u751F\u6210\u5C1D\u8BD5\u53EF\u4EE5\u4FEE\u8BA2\uFF1B\u5148\u6838\u5BF9\u5931\u8D25\u6216\u53D6\u6D88\u7684\u6267\u884C": "Only a producer with confirmed completion can be repaired; reconcile failed or cancelled execution first",
  "\u6267\u884C\u56E0\u6743\u9650\u3001\u53D6\u6D88\u3001\u65F6\u9650\u6216\u5E95\u5EA7\u6545\u969C\u505C\u6B62\uFF0C\u4E0D\u80FD\u81EA\u52A8\u4FEE\u6539\u4EE3\u7801": "Execution stopped for permission, cancellation, deadline, or backend failure; automatic code repair is blocked",
  "\u539F\u5C1D\u8BD5\u7684\u51BB\u7ED3\u8F93\u5165\u5DF2\u8FC7\u671F": "The original attempt has stale frozen inputs",
  "\u53EA\u6709\u4EE3\u7801\u5B9E\u73B0\u9636\u6BB5\u53EF\u4EE5\u521B\u5EFA\u4EE3\u7801\u4FEE\u8BA2": "Only an implementation step can create a code repair",
  "\u5931\u8D25\u5019\u9009\u5DF2\u88AB\u66FF\u6362": "The failed candidate was replaced",
  "\u5931\u8D25\u5019\u9009\u6CA1\u6709\u7A33\u5B9A\u7EC8\u6001\u5FEB\u7167\u6216\u5DF2\u88AB\u5916\u90E8\u4FEE\u6539\uFF0C\u8BF7\u5148\u6838\u5BF9": "Reconcile the failed candidate: it has no stable terminal snapshot or was changed externally",
  "\u5F53\u524D\u6CA1\u6709\u5DF2\u8BB0\u5F55\u7684\u5931\u8D25\u8BC1\u636E\u9700\u8981\u4FEE\u8BA2": "There is no recorded failure evidence requiring repair",
  "\u4FEE\u8BA2\u51C6\u5907\u671F\u95F4\u9636\u6BB5\u53D1\u751F\u53D8\u5316": "The step changed while repair was being prepared",
  "\u4FEE\u8BA2\u5FEB\u7167\u5DF2\u53D1\u751F\u51B2\u7A81\uFF0C\u4E0D\u80FD\u81EA\u52A8\u91CD\u8BD5": "The repair snapshot has a conflict and cannot retry automatically",
  "\u5931\u8D25\u5019\u9009\u5DF2\u88AB\u53E6\u4E00\u5019\u9009\u66FF\u6362": "Another candidate replaced the failed candidate",
  "\u5931\u8D25\u5019\u9009\u5728\u4FEE\u8BA2\u5F00\u59CB\u524D\u88AB\u4FEE\u6539": "The failed candidate changed before repair started",
  "\u4FEE\u8BA2\u5468\u671F\u5DF2\u7ECF\u505C\u6B62": "The repair cycle has stopped",
  "\u6D3E\u751F\u671F\u95F4\u539F\u5019\u9009\u53D1\u751F\u53D8\u5316": "The parent candidate changed while its successor was being created",
  "\u5019\u9009\u6FC0\u6D3B\u524D\u5DF2\u88AB\u5176\u4ED6\u64CD\u4F5C\u66FF\u6362": "Another operation replaced the candidate before activation",
  "\u4FEE\u8BA2\u6B65\u9AA4\u7F3A\u5C11\u5DF2\u6301\u4E45\u5316\u7684\u6267\u884C\u8EAB\u4EFD": "The repair step has no persisted execution identity",
  "\u4FEE\u8BA2\u7ED3\u675F\u540E\u7684\u5019\u9009\u5185\u5BB9\u53D1\u751F\u53D8\u5316": "The candidate changed after repair finished",
  "\u751F\u6210\u671F\u95F4\u76EE\u6807\u6587\u6863\u88AB\u5176\u4ED6\u64CD\u4F5C\u66FF\u6362": "Another operation replaced the target document during generation",
  "\u5F53\u524D\u76EE\u6807\u7F3A\u5C11\u5FC5\u9700\u72EC\u7ACB\u590D\u6838": "The current target is missing its required independent review",
  "\u590D\u6838\u9636\u6BB5\u8BB0\u5F55\u7F3A\u5931": "The review step record is missing",
  "\u6D41\u7A0B\u5DF2\u7ECF\u53D8\u5316\uFF0C\u8BF7\u5237\u65B0": "The workflow changed; refresh before continuing",
  "\u53EA\u6709\u6D3B\u52A8\u6D41\u7A0B\u53EF\u4EE5\u5F00\u542F\u81EA\u52A8\u63A8\u8FDB": "Automatic progression requires an active workflow",
  "\u8BF7\u9009\u62E9\u81EA\u52A8\u63A8\u8FDB\u6216\u81EA\u52A8\u4FEE\u8BA2": "Select automatic progression or automatic repair",
  "\u4FEE\u8BA2\u8F6E\u6570\u5FC5\u987B\u4E3A 1 \u5230 10 \u7684\u6574\u6570": "Repair rounds must be an integer from 1 to 10",
  "\u5DE5\u4F5C\u9879\u5DF2\u6709\u6D3B\u52A8\u81EA\u52A8\u5316": "The work item already has active automation",
  "\u65E0\u8FDB\u5C55\u4E0A\u9650\u5FC5\u987B\u4E3A\u6B63\u6574\u6570": "The no-progress limit must be a positive integer",
  "\u4EE3\u7801\u4FEE\u8BA2\u5FC5\u987B\u7ED1\u5B9A\u5931\u8D25\u5019\u9009": "Code repair must be bound to the failed candidate",
  "\u4FEE\u8BA2\u5FC5\u987B\u56FA\u5B9A\u76EE\u6807\u3001\u4E0A\u6E38\u548C\u63A5\u7EB3\u57FA\u7EBF": "Repair must freeze its target, upstream inputs, and acceptance baseline",
  "\u4FEE\u8BA2\u5468\u671F\u672A\u5904\u4E8E\u6D3B\u52A8\u72B6\u6001": "The repair cycle is not active",
  "\u524D\u4E00\u8F6E\u5C1A\u672A\u5B8C\u6210\u6216\u5DF2\u7ECF\u901A\u8FC7": "The previous round is unfinished or has already passed",
  "\u4FEE\u8BA2\u8F6E\u6570\u5DF2\u8017\u5C3D": "The repair round budget is exhausted",
  "\u5F53\u524D\u6CA1\u6709\u6D3B\u52A8\u4FEE\u8BA2\u8F6E": "There is no active repair round",
  "\u4FEE\u8BA2\u6B65\u9AA4\u4E0D\u80FD\u5012\u9000\u6216\u8DF3\u8FC7\u9A8C\u8BC1\u4E0E\u590D\u6838": "Repair cannot move backwards or skip verification and review",
  "\u4FEE\u8BA2\u8BC4\u4F30\u5FC5\u987B\u901A\u8FC7 assessRepairRound": "Repair assessment must use assessRepairRound",
  "\u540C\u4E00\u8F6E\u4FEE\u8BA2\u7684\u6267\u884C\u8EAB\u4EFD\u4E0D\u80FD\u66FF\u6362": "A repair round cannot replace its execution identity",
  "\u6210\u529F\u4FEE\u8BA2\u5FC5\u987B\u5B8C\u6210\u9A8C\u8BC1\u548C\u590D\u6838\uFF1B\u8F93\u51FA\u6216\u9A8C\u8BC1\u5931\u8D25\u65F6\u53EF\u76F4\u63A5\u8BC4\u4F30\u5931\u8D25": "Successful repair requires verification and review; invalid output or failed verification may be assessed as failed immediately",
  "\u9A8C\u8BC1\u671F\u95F4\u4E2D\u65AD\uFF0C\u8BF7\u6838\u5BF9\u672C\u673A\u9A8C\u8BC1\u8FDB\u7A0B\u505C\u6B62\u540E\u518D\u91CD\u65B0\u9A8C\u8BC1": "Verification was interrupted; confirm local verification processes have stopped before verifying again",
  "\u6D3E\u53D1\u51C6\u5907\u5DF2\u7ECF\u5F00\u59CB\uFF0C\u6062\u590D\u65F6\u53EA\u6838\u5BF9\u539F\u8EAB\u4EFD": "Dispatch preparation has started; recovery only reconciles the original identity",
  "\u542F\u52A8\u4E2D\u65AD\u4E14\u5C1A\u672A\u53D6\u5F97\u6267\u884C\u8EAB\u4EFD\uFF0C\u672A\u81EA\u52A8\u91CD\u53D1\uFF1B\u8BF7\u6838\u5BF9\u540E\u521B\u5EFA\u65B0\u5C1D\u8BD5": "Startup was interrupted before an identity was obtained; no automatic resend occurred. Reconcile before creating a new attempt",
  "\u542F\u52A8\u4E2D\u65AD\u4E14\u6267\u884C\u8EAB\u4EFD\u672A\u77E5\uFF0C\u672A\u81EA\u52A8\u91CD\u53D1": "Startup was interrupted with an unknown execution identity; no automatic resend occurred",
  "\u5DE5\u4F5C\u9879\u6B63\u5728\u51C6\u5907\u6216\u96C6\u6210": "The work item is being prepared or integrated",
  "\u539F\u6267\u884C\u6216\u9A8C\u8BC1\u5C1A\u672A\u786E\u8BA4\u505C\u6B62": "The original execution or verification has not been confirmed stopped",
  "\u5F53\u524D\u5DE5\u4F5C\u9879\u6B63\u5728\u81EA\u52A8\u4FEE\u8BA2\uFF0C\u8BF7\u5148\u505C\u6B62\u4FEE\u8BA2\u5468\u671F": "Stop the active repair cycle before manually dispatching this work item",
  "\u5F53\u524D\u6D41\u7A0B\u7531\u81EA\u52A8\u5316\u6267\u884C\uFF0C\u8BF7\u5148\u505C\u6B62\u81EA\u52A8\u5316\u518D\u624B\u52A8\u6D3E\u53D1": "Stop automation before manually dispatching this workflow",
  "\u6240\u5C5E\u6D41\u7A0B\u5DF2\u6682\u505C\u6216\u7ED3\u675F": "The parent workflow is paused or finished",
  "\u81EA\u52A8\u63A8\u8FDB\u5DF2\u7ECF\u505C\u6B62\uFF0C\u4E0D\u80FD\u7EE7\u7EED\u6D3E\u53D1": "Automatic progression stopped; further dispatch is blocked",
  "\u4FEE\u8BA2\u5468\u671F\u6216\u5F53\u524D\u8F6E\u6B21\u5DF2\u7ECF\u53D8\u5316\uFF0C\u4E0D\u80FD\u7EE7\u7EED\u6D3E\u53D1": "The repair cycle or round changed; further dispatch is blocked",
  "\u6240\u5C5E\u81EA\u52A8\u63A8\u8FDB\u5DF2\u7ECF\u505C\u6B62": "The parent automatic progression has stopped",
  "\u6D3E\u53D1\u5DF2\u51C6\u5907\u6216\u7ED3\u679C\u672A\u77E5\uFF0C\u4E0D\u80FD\u91CD\u590D\u542F\u52A8": "Dispatch is prepared or its outcome is unknown; it cannot be started again",
  "\u6240\u5C5E\u6D41\u7A0B\u6216\u5F53\u524D\u5C1D\u8BD5\u5DF2\u7ECF\u53D8\u5316\uFF0C\u4E0D\u80FD\u7EE7\u7EED\u6D3E\u53D1": "The parent workflow or current attempt changed; further dispatch is blocked",
  "\u4FEE\u8BA2\u5468\u671F\u5DF2\u505C\u6B62": "The repair cycle stopped",
  "\u81EA\u52A8\u63A8\u8FDB\u5DF2\u505C\u6B62": "Automatic progression stopped",
  "\u6D3E\u53D1\u524D\u53D1\u73B0\u9700\u6C42\u3001\u7AE0\u7A0B\u6216\u8F93\u5165\u5DF2\u7ECF\u53D8\u5316": "Requirements, constitution, or inputs changed before dispatch",
  "\u4FEE\u8BA2\u7684\u539F\u59CB\u9700\u6C42\u3001\u7AE0\u7A0B\u6216\u4E0A\u6E38\u5DF2\u8FC7\u671F": "The repair has stale original requirements, constitution, or upstream inputs",
  "\u4FEE\u8BA2\u7684\u63A5\u7EB3\u57FA\u7EBF\u5DF2\u7ECF\u53D8\u5316": "The repair acceptance baseline changed",
  "\u539F\u6267\u884C\u5C1A\u672A\u786E\u8BA4\u505C\u6B62": "The original execution has not been confirmed stopped",
  "\u5F53\u524D\u4FEE\u8BA2\u8F6E\u5DF2\u6D3E\u53D1": "The current repair round has already been dispatched",
  "\u53EA\u8BFB\u8F93\u51FA\u4FEE\u8BA2\u671F\u95F4\u5019\u9009\u4EE3\u7801\u53D1\u751F\u53D8\u5316": "Candidate code changed during read-only output repair",
  "\u4FEE\u8BA2\u540E\u7684\u786E\u5B9A\u6027\u9A8C\u8BC1\u672A\u901A\u8FC7": "Deterministic verification failed after repair",
  "\u53EA\u8BFB\u683C\u5F0F\u4FEE\u8BA2\u4E0D\u80FD\u6D3E\u53D1\u672A\u5B8C\u6210\u7684\u4EE3\u7801\u4EFB\u52A1": "Read-only output repair cannot dispatch unfinished coding tasks",
  "\u6700\u7EC8\u5019\u9009\u5168\u91CF\u9A8C\u8BC1\u672A\u901A\u8FC7": "Full verification failed for the final candidate",
  "\u5E95\u5EA7\u5C1A\u672A\u786E\u8BA4\u6267\u884C\u7EC8\u6B62": "The backend has not confirmed execution termination",
  "\u9A8C\u8BC1\u8FDB\u7A0B\u505C\u6B62\u72B6\u6001\u5C1A\u672A\u786E\u8BA4": "The verification process has not been confirmed stopped",
  "\u9636\u6BB5\u65F6\u95F4\u4E0A\u9650\u5DF2\u5230\uFF0C\u6267\u884C\u5DF2\u505C\u6B62": "The step deadline was reached and execution stopped",
  "\u505C\u6B62\u5DF2\u786E\u8BA4\uFF1B\u8FDF\u5230\u7ED3\u679C\u4FDD\u7559\u4F9B\u5BA1\u9605": "The stop was confirmed; late results are retained for review",
  "\u6267\u884C\u505C\u6B62\uFF0C\u7ED3\u679C\u672A\u81EA\u52A8\u653E\u884C": "Execution stopped; its results were not automatically approved",
  "\u5019\u9009\u4ECD\u6709\u672A\u7ED3\u675F\u6216\u5F85\u6838\u5BF9\u6267\u884C\uFF0C\u4E0D\u80FD\u540C\u65F6\u9A8C\u8BC1": "The candidate has unfinished or unresolved execution; concurrent verification is blocked",
  "\u4EFB\u52A1\u5F15\u7528\u4E86\u672A\u914D\u7F6E\u7684\u9A8C\u8BC1\u547D\u4EE4": "The task references an unconfigured verification command",
  "\u9A8C\u8BC1\u5DF2\u8BF7\u6C42\u505C\u6B62\uFF0C\u4E0D\u80FD\u542F\u52A8\u540E\u7EED\u547D\u4EE4": "Verification stop was requested; further commands cannot start",
  "\u9A8C\u8BC1\u9636\u6BB5\u65F6\u95F4\u4E0A\u9650\u5DF2\u5230": "The verification deadline was reached",
  "\u5F53\u524D\u6CA1\u6709\u53EF\u505C\u6B62\u7684\u9A8C\u8BC1": "There is no verification to stop",
  "\u4EC5\u53EF\u5728\u6838\u5BF9\u4E2D\u65AD\u9A8C\u8BC1\u8FDB\u7A0B\u505C\u6B62\u540E\u8BB0\u5F55\u5904\u7406\u7406\u7531": "Only confirm an interrupted verification after checking that its processes have stopped",
  "\u4EBA\u5DE5\u5DF2\u786E\u8BA4\u9A8C\u8BC1\u8FDB\u7A0B\u505C\u6B62\uFF0C\u8BF7\u91CD\u65B0\u8FD0\u884C\u9A8C\u8BC1": "Verification processes were manually confirmed stopped; run verification again",
  "\u6062\u590D\u6D3E\u53D1\u56DE\u6267\u4E22\u5931\uFF0C\u4E0D\u80FD\u5C06\u65E7\u6267\u884C\u7EC8\u6001\u5F53\u4F5C\u65B0\u6267\u884C\u7ED3\u679C": "The resume receipt was lost; the old terminal state cannot represent the new execution",
  "\u9A8C\u8BC1\u671F\u95F4\u4E2D\u65AD\uFF0C\u539F\u9A8C\u8BC1\u8FDB\u7A0B\u505C\u6B62\u72B6\u6001\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u4EBA\u5DE5\u6838\u5BF9\u8FDB\u7A0B\u540E\u5904\u7406": "Verification was interrupted and its processes are unconfirmed; manually check them before continuing",
  "\u539F\u5C1D\u8BD5\u65F6\u9650\u5DF2\u5230\uFF0C\u6062\u590D\u4E0D\u80FD\u91CD\u7F6E\u65F6\u9650": "The original attempt deadline was reached; resume cannot reset it",
  "\u539F\u9A8C\u8BC1\u8FDB\u7A0B\u505C\u6B62\u72B6\u6001\u5C1A\u672A\u786E\u8BA4": "The original verification processes have not been confirmed stopped",
  "\u5E95\u5EA7\u65E0\u6CD5\u8BC1\u660E\u6062\u590D\u4F1A\u7EE7\u627F\u5269\u4F59\u6B65\u6570\uFF0C\u4E25\u683C\u7D2F\u8BA1\u6B65\u6570\u7B56\u7565\u7981\u6B62\u6062\u590D": "The backend cannot prove resume preserves remaining steps; a strict cumulative step policy blocks resume",
  "\u6062\u590D\u6D3E\u53D1\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u4E0D\u80FD\u91CD\u590D\u6062\u590D": "The resume dispatch is unconfirmed and cannot be repeated",
  "\u6240\u5C5E\u81EA\u52A8\u4FEE\u8BA2\u5DF2\u505C\u6B62\uFF0C\u4E0D\u80FD\u521B\u5EFA\u6216\u6D3E\u53D1\u4FEE\u8BA2": "The parent automatic repair stopped; no repair can be created or dispatched",
  "\u4FEE\u8BA2\u5019\u9009\u7684\u5F53\u524D\u7248\u672C\u9A8C\u8BC1\u672A\u901A\u8FC7": "Verification failed for the current repaired candidate",
  "\u72EC\u7ACB\u590D\u6838\u5DF2\u901A\u8FC7\uFF0C\u7B49\u5F85\u4EBA\u5DE5\u63A5\u7EB3\u5F53\u524D\u4EA7\u7269": "Independent review passed; the current artifact awaits human acceptance",
  "\u4FEE\u8BA2\u5FEB\u7167\u64CD\u4F5C\u9700\u8981\u4EBA\u5DE5\u6838\u5BF9": "The repair snapshot operation needs manual reconciliation",
  "\u539F\u6267\u884C\u6216\u9A8C\u8BC1\u5C1A\u672A\u786E\u8BA4\u505C\u6B62\uFF0C\u5DE5\u4F5C\u533A\u4ECD\u88AB\u5360\u7528": "Original execution or verification is unconfirmed; the workspace remains occupied",
  "\u5E95\u5EA7\u8FD4\u56DE\u7684\u6267\u884C\u8EAB\u4EFD\u4E0E\u51BB\u7ED3\u76EE\u6807\u4E0D\u4E00\u81F4\uFF0C\u672A\u6D3E\u53D1\u6A21\u578B": "The backend returned an execution identity that differs from the frozen target; the model was not dispatched",
  "\u4FEE\u8BA2\u5E95\u5EA7\u8EAB\u4EFD\u5DF2\u53D8\u5316\uFF0C\u8BF7\u6838\u5BF9\u539F\u6267\u884C\u76EE\u6807": "The repair backend identity changed; reconcile the original target",
  "\u51BB\u7ED3\u7684\u4FEE\u8BA2\u6A21\u578B\u672A\u5728\u539F\u5E95\u5EA7\u542F\u7528": "The frozen repair model is not available on the original backend",
  "\u53EA\u8BFB\u9636\u6BB5\u7684\u5DE5\u4F5C\u533A\u5185\u5BB9\u53D1\u751F\u53D8\u5316\uFF0C\u4E0D\u80FD\u53D1\u5E03\u4EA7\u7269": "The workspace changed during a read-only stage; its artifacts cannot be published",
  "\u4EFB\u52A1\u4FEE\u6539\u8D85\u51FA\u5DF2\u6279\u51C6\u8DEF\u5F84\u8303\u56F4\uFF0C\u505C\u6B62\u540E\u7EED\u6D3E\u53D1\u5E76\u4FDD\u7559\u5019\u9009": "Task changes exceeded the approved paths; further dispatches stopped and the candidate was preserved"
};

// packages/i18n/index.ts
var englishMessages = Object.freeze({ ...messages7, ...messages4, ...messages5, ...messages6, ...messages, ...messages2, ...messages3, ...messages8, ...messages9 });
function normalizeLocale(value) {
  const languageList = typeof value === "string" ? value : value?.join(",") || "";
  const preferences = languageList.split(",").map((entry, index) => {
    const [language, ...parameters] = entry.trim().split(";");
    const quality = parameters.find((parameter) => parameter.trim().startsWith("q="));
    return { language: language.toLowerCase(), weight: quality ? Number(quality.trim().slice(2)) : 1, index };
  }).filter((entry) => entry.weight > 0 && entry.weight <= 1).sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const { language } of preferences) {
    if (/^en(?:[-_]|$)/.test(language)) return "en";
    if (/^zh(?:[-_]|$)/.test(language)) return "zh-CN";
  }
  return "zh-CN";
}
var escapePattern = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var placeholder = /\{([a-zA-Z0-9_]+)\}/g;
var interpolate = (message, values) => message.replace(placeholder, (match, key) => Object.hasOwn(values, key) ? String(values[key] ?? "") : match);
var patterns = Object.entries(englishMessages).filter(([source]) => /\{[a-zA-Z0-9_]+\}/.test(source)).map(([source, translated]) => {
  const keys = [];
  let offset = 0, pattern = "";
  for (const match of source.matchAll(placeholder)) {
    pattern += escapePattern(source.slice(offset, match.index)) + "([\\s\\S]*?)";
    keys.push(match[1]);
    offset = match.index + match[0].length;
  }
  pattern += escapePattern(source.slice(offset));
  return { pattern: new RegExp(`^${pattern}$`), keys, translated, specificity: source.replace(placeholder, "").length };
}).sort((a, b) => b.specificity - a.specificity);
function translate(source, locale2, values = {}) {
  if (locale2 !== "en") return interpolate(source, values);
  if (Object.hasOwn(englishMessages, source)) return interpolate(englishMessages[source], values);
  if (source.length <= 32768 && /\p{Script=Han}/u.test(source)) for (const entry of patterns) {
    const match = entry.pattern.exec(source);
    if (match) return interpolate(entry.translated, Object.fromEntries(entry.keys.map((key, index) => [key, match[index + 1]])));
  }
  return interpolate(source, values);
}
function formatDate(date, locale2) {
  if (!date) return "\u2014";
  const value = new Date(date);
  if (!Number.isFinite(value.getTime())) return "\u2014";
  return new Intl.DateTimeFormat(locale2 === "en" ? "en-US" : "zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).format(value);
}

// apps/web/src/i18n.ts
var preferenceKey = "specflow-locale";
function initialLocale() {
  if (typeof window === "undefined") return "zh-CN";
  if (window.specflowDesktop?.initialLocale) return window.specflowDesktop.initialLocale;
  try {
    const saved = localStorage.getItem(preferenceKey);
    if (saved === "en" || saved === "zh-CN") return saved;
  } catch {
  }
  return normalizeLocale(navigator.languages?.length ? navigator.languages : navigator.language);
}
var locale = initialLocale();
var listeners = /* @__PURE__ */ new Set();
var getLocale = () => locale;
var t = (source, values) => translate(source, locale, values);
var localizedDate = (date) => formatDate(date, locale);
var subscribe = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
var useLocale = () => (0, import_react.useSyncExternalStore)(subscribe, getLocale, getLocale);
function applyDocumentLocale() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  document.title = t("SpecFlow \xB7 \u5DE5\u7A0B\u5DE5\u4F5C\u53F0");
}
async function setLocale(next, options = {}) {
  if (next !== "en" && next !== "zh-CN") return;
  if (typeof window !== "undefined" && window.specflowDesktop?.setLocale) await window.specflowDesktop.setLocale(next);
  locale = next;
  try {
    localStorage.setItem(preferenceKey, next);
  } catch {
  }
  if (options.updateDocument !== false) applyDocumentLocale();
  for (const listener of listeners) listener();
}
var localizedLabels = (labels2) => new Proxy(labels2, { get: (target, key, receiver) => {
  const value = Reflect.get(target, key, receiver);
  return typeof value === "string" ? t(value) : value;
} });

// plugins/deepseek-specflow/src/client.tsx
var import_react4 = require("react");

// apps/web/src/workflowCopy.ts
var workflowSources = [
  "\u89C4\u683C\u9A71\u52A8\u5F00\u53D1",
  "\u9700\u6C42\u89C4\u683C",
  "\u9700\u6C42\u6F84\u6E05",
  "\u89C4\u683C\u590D\u6838",
  "\u5DE5\u7A0B\u8BBE\u8BA1",
  "\u8BBE\u8BA1\u590D\u6838",
  "\u4EFB\u52A1\u62C6\u89E3",
  "\u4EFB\u52A1\u590D\u6838",
  "\u4EE3\u7801\u5B9E\u73B0",
  "\u6D4B\u8BD5\u4E0E\u68C0\u67E5",
  "\u4EE3\u7801\u590D\u6838",
  "\u6536\u655B\u4E0E\u5BF9\u9F50",
  "\u6536\u655B\u590D\u6838",
  "\u63A5\u7EB3\u4EE3\u7801",
  "\u5206\u6790\u9700\u6C42\u548C\u4ED3\u5E93\uFF0C\u4EA7\u51FA\u5177\u6709\u9A8C\u6536\u6807\u51C6\u7684\u9700\u6C42\u89C4\u683C\u3002\u5B58\u5728\u672A\u77E5\u4FE1\u606F\u65F6\u63D0\u51FA\u660E\u786E\u95EE\u9898\u3002",
  "\u68C0\u67E5\u89C4\u683C\u7684\u529F\u80FD\u8FB9\u754C\u3001\u5F02\u5E38\u573A\u666F\u3001\u6570\u636E\u7EA6\u675F\u548C\u9A8C\u6536\u6807\u51C6\u3002\u4EC5\u8BE2\u95EE\u5F71\u54CD\u8BBE\u8BA1\u548C\u9A8C\u8BC1\u7684\u5173\u952E\u95EE\u9898\uFF0C\u6574\u4E2A\u6F84\u6E05\u4F1A\u8BDD\u6700\u591A 5 \u4E2A\u95EE\u9898\u3002\u8BFB\u53D6\u5DF2\u6709\u7B54\u590D\uFF0C\u4FDD\u7559\u9700\u6C42 ID\uFF0C\u628A\u5DF2\u786E\u8BA4\u7684\u51B3\u7B56\u5199\u56DE\u5B8C\u6574\u9700\u6C42\u89C4\u683C\u3002",
  "\u72EC\u7ACB\u68C0\u67E5\u89C4\u683C\u7684\u5B8C\u6574\u6027\u3001\u6B67\u4E49\u548C\u53EF\u9A8C\u8BC1\u6027\u3002",
  "\u4F9D\u636E\u5DF2\u63A5\u7EB3\u89C4\u683C\u5206\u6790\u73B0\u6709\u4EE3\u7801\uFF0C\u4EA7\u51FA\u6A21\u5757\u3001\u63A5\u53E3\u3001\u8BBE\u8BA1\u51B3\u7B56\u548C\u98CE\u9669\u3002",
  "\u72EC\u7ACB\u68C0\u67E5\u5DE5\u7A0B\u8BBE\u8BA1\u662F\u5426\u6EE1\u8DB3\u9700\u6C42\uFF0C\u5B9A\u4F4D\u5177\u4F53\u95EE\u9898\u3002",
  "\u62C6\u89E3\u5B9E\u73B0\u4EFB\u52A1\u3002\u6BCF\u9879\u4EFB\u52A1\u5305\u542B\u552F\u4E00 ID\u3001\u4F9D\u8D56\u548C\u9A8C\u6536\u6761\u4EF6\u3002",
  "\u68C0\u67E5\u4EFB\u52A1\u8986\u76D6\u3001\u4F9D\u8D56\u548C\u9A8C\u6536\u6761\u4EF6\u3002",
  "\u6309\u5DF2\u63A5\u7EB3\u4EFB\u52A1\u6539\u52A8\u4EE3\u7801\uFF0C\u8FD0\u884C\u76F8\u5173\u6D4B\u8BD5\u5E76\u8BB0\u5F55\u5B9E\u73B0\u8BF4\u660E\u3002",
  "\u72EC\u7ACB\u68C0\u67E5\u8865\u4E01\u4E0E\u89C4\u683C\u3001\u4EFB\u52A1\u3001\u6D4B\u8BD5\u8986\u76D6\u662F\u5426\u4E00\u81F4\u3002",
  "\u6838\u5BF9\u9700\u6C42\u3001\u4EFB\u52A1\u3001\u4EE3\u7801\u4E0E\u9A8C\u8BC1\u8BC1\u636E\uFF0C\u4EA7\u51FA\u5BF9\u9F50\u62A5\u544A\u3002",
  "\u590D\u6838\u5BF9\u9F50\u62A5\u544A\uFF0C\u786E\u8BA4\u6CA1\u6709\u9057\u6F0F\u9700\u6C42\u548C\u8BC1\u636E\u3002"
];
var canonicalSources = /* @__PURE__ */ new Map();
for (const source of workflowSources) {
  canonicalSources.set(source, source);
  if (messages6[source]) canonicalSources.set(messages6[source], source);
  if (englishMessages[source]) canonicalSources.set(englishMessages[source], source);
}
function workflowText(text) {
  const source = canonicalSources.get(text);
  if (!source) return text;
  return getLocale() === "en" ? englishMessages[source] || messages6[source] || text : source;
}

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
    execution: { label: t("\u6267\u884C"), value: t(executionLabels[node.execution]), raw: node.execution, tone: node.execution === "failed" ? "danger" : ["waiting_interaction", "reconciling"].includes(node.execution) ? "warning" : "neutral" },
    gate: { label: t("\u95E8\u7981"), value: t(gateLabels[node.gate]), raw: node.gate, tone: node.gate === "passed" ? "success" : node.gate === "blocked" ? "danger" : node.gate === "stale" ? "warning" : "neutral" },
    freshness: { label: t("\u65B0\u9C9C\u5EA6"), value: node.freshness === "fresh" ? t("\u5F53\u524D\u6709\u6548") : t("\u4E0A\u6E38\u5DF2\u53D8\u66F4"), raw: node.freshness, tone: node.freshness === "fresh" ? "neutral" : "warning" },
    acceptance: { label: t("\u63A5\u7EB3"), value: human ? node.acceptance === "accepted" ? t("\u4EBA\u5DE5\u5DF2\u63A5\u7EB3") : t("\u5F85\u4EBA\u5DE5\u63A5\u7EB3") : node.acceptance === "accepted" ? t("\u7CFB\u7EDF\u5DF2\u786E\u8BA4") : t("\u65E0\u72EC\u7ACB\u63A5\u7EB3\u52A8\u4F5C"), raw: node.acceptance, tone: human && node.acceptance !== "accepted" ? "warning" : node.acceptance === "accepted" ? "success" : "neutral" },
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
var import_react2 = require("react");

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
      output.push(href && !link[1] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href, target: href.startsWith("#") ? void 0 : "_blank", rel: "noreferrer", children: link[2] }, key) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react2.Fragment, { children: link[1] ? t("[\u56FE\u7247\uFF1A{value0}]", { value0: link[2] }) : link[2] }, key));
    }
    offset = token.lastIndex;
  }
  output.push(text.slice(offset));
  return output;
}
function MarkdownView({ content, idPrefix = "document", onSelectText }) {
  const imagePlaceholder = t("[\u56FE\u7247\uFF1A{value0}]", { value0: "" });
  const parsed = (0, import_react2.useMemo)(() => {
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
  }, [content, idPrefix, imagePlaceholder]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "markdown-layout", children: [
    parsed.headings.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", { className: "markdown-toc", "aria-label": t("\u6587\u6863\u76EE\u5F55"), children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: t("\u76EE\u5F55") }),
      parsed.headings.map((heading) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", { href: `#${heading.id}`, style: { paddingInlineStart: `${Math.min(heading.depth - 1, 3) * 10}px` }, children: heading.text }, heading.id))
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", { className: "markdown-document", "aria-label": t("Markdown \u9884\u89C8"), onMouseUp: () => {
      const selection = window.getSelection();
      if (selection && selection.toString()) onSelectText?.(selection.toString());
    }, children: parsed.blocks })
  ] });
}

// apps/web/src/AutomationControls.tsx
var import_react3 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
function automationReason(reason) {
  const labels2 = { completed: "\u68C0\u67E5\u5DF2\u901A\u8FC7", workflow_finished: "\u68C0\u67E5\u5DF2\u901A\u8FC7", round_limit: "\u4FEE\u8BA2\u8F6E\u6570\u5DF2\u7528\u5B8C", no_progress: "\u8FDE\u7EED\u65E0\u8FDB\u5C55", input_stale: "\u8F93\u5165\u5DF2\u53D8\u5316", candidate_drift: "\u5019\u9009\u4EE3\u7801\u5DF2\u53D8\u5316", permission_denied: "\u6388\u6743\u88AB\u62D2\u7EDD", execution_unknown: "\u539F\u6267\u884C\u4ECD\u5F85\u6838\u5BF9", budget_exhausted: "\u6267\u884C\u9884\u7B97\u5DF2\u7528\u5B8C", user_cancelled: "\u7528\u6237\u8BF7\u6C42\u505C\u6B62", unrepairable: "\u9700\u8981\u4EBA\u5DE5\u5904\u7406", waiting_for_input: "\u6B63\u5728\u7B49\u5F85\u6F84\u6E05\u6216\u6388\u6743", human_action_required: "\u7B49\u5F85\u4EBA\u5DE5\u63A5\u7EB3", artifact_acceptance_required: "\u7B49\u5F85\u4EBA\u5DE5\u63A5\u7EB3", explicit_retry_required: "\u9700\u8981\u660E\u786E\u91CD\u8BD5", gate_blocked: "\u5DE5\u7A0B\u68C0\u67E5\u672A\u901A\u8FC7", gate_unchecked: "\u5DE5\u7A0B\u6761\u4EF6\u5F85\u786E\u8BA4", readiness_unknown: "\u5DE5\u7A0B\u6761\u4EF6\u5F85\u786E\u8BA4", workflow_inactive: "\u6D41\u7A0B\u5C1A\u672A\u6FC0\u6D3B", automation_inactive: "\u5DF2\u6682\u505C", node_missing: "\u9700\u8981\u4EBA\u5DE5\u5904\u7406", workflow_invalid: "\u9700\u8981\u4EBA\u5DE5\u5904\u7406" };
  return reason ? t(labels2[reason] || reason) : "";
}
function AutomationControls({ workflowRun, node, definition, repairs = [], automations = [], disabled, startBlocked, compact = false, onCommand }) {
  const id = (0, import_react3.useId)(), [autoRepair, setAutoRepair] = (0, import_react3.useState)(false), [maxRounds, setMaxRounds] = (0, import_react3.useState)(2);
  const repair = repairs.filter((repair2) => repair2.workflowRunId === workflowRun.id).at(-1);
  const automation = automations.filter((automation2) => automation2.workflowRunId === workflowRun.id).at(-1);
  const repairActive = repair?.state === "active", automationActive = automation?.state === "active";
  const nodeActive = !!node && ["starting", "running", "waiting_interaction", "reconciling"].includes(node.execution);
  const canRepair = !!node && ["agent", "review", "verify"].includes(node.type) && node.gate === "blocked" && node.freshness === "fresh" && !nodeActive && !repairActive && !automationActive;
  const blocked = disabled || startBlocked || workflowRun.state !== "active";
  const buttonClass = compact ? "" : "outline-button";
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { className: compact ? "sf-details" : "context-details automation-controls", open: repairActive || automationActive || void 0, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("summary", { children: t("\u81EA\u52A8\u63A8\u8FDB\u4E0E\u6709\u9650\u4FEE\u8BA2") }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: compact ? "sf-hint" : "run-control-note", children: t("\u81EA\u52A8\u63A8\u8FDB\u8FD0\u884C\u5230\u9700\u8981\u4F60\u63A5\u7EB3\u3001\u6F84\u6E05\u6216\u6388\u6743\u7684\u4F4D\u7F6E\u3002\u81EA\u52A8\u4FEE\u8BA2\u53EA\u5904\u7406\u5F53\u524D\u76EE\u6807\uFF0C\u4FDD\u7559\u4EBA\u5DE5\u63A5\u7EB3\u3002") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: compact ? "sf-checkbox" : "automation-option", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { type: "checkbox", checked: autoRepair, disabled: blocked || automationActive || repairActive, onChange: (event) => setAutoRepair(event.target.checked) }),
        " ",
        t("\u63A8\u8FDB\u65F6\u5141\u8BB8\u6709\u9650\u81EA\u52A8\u4FEE\u8BA2")
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("label", { className: compact ? "sf-field" : "automation-option", htmlFor: id, children: [
        t("\u6700\u591A\u4FEE\u8BA2\u8F6E\u6570"),
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("select", { id, value: maxRounds, disabled: blocked || automationActive || repairActive, onChange: (event) => setMaxRounds(Number(event.target.value)), children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: 1, children: "1" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("option", { value: 2, children: "2" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: compact ? "sf-actions" : "run-actions", children: [
        automationActive ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: buttonClass, disabled, onClick: () => onCommand("stopAutomation", automation.id), children: t("\u505C\u6B62\u81EA\u52A8\u63A8\u8FDB") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: buttonClass, disabled: blocked || nodeActive || repairActive, onClick: () => onCommand("startAutomation", workflowRun.id, { expectedRevision: workflowRun.revision, autoAdvance: true, autoRepair, maxRepairRounds: maxRounds }), children: t("\u8FD0\u884C\u5230\u4E0B\u4E00\u5904\u5F85\u5904\u7406") }),
        repairActive ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: buttonClass, disabled, onClick: () => onCommand("stopRepair", repair.id), children: t("\u505C\u6B62\u81EA\u52A8\u4FEE\u8BA2") }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: buttonClass, disabled: blocked || !canRepair, onClick: () => {
          if (node) onCommand("startRepair", node.id, { expectedRevision: node.revision, maxRounds });
        }, children: t("\u81EA\u52A8\u4FEE\u8BA2\u5F53\u524D\u4EA7\u7269") })
      ] }),
      repair && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { role: "status", children: [
        t("\u4FEE\u8BA2\u8FDB\u5EA6 {round} / {max}", { round: repair.rounds.length, max: repair.maxRounds }),
        " \xB7 ",
        repairActive ? t("\u6B63\u5728\u81EA\u52A8\u4FEE\u8BA2") : automationReason(repair.stopReason) || t("\u5DF2\u6682\u505C")
      ] }),
      automation && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { role: "status", children: automationActive ? t("\u6B63\u5728\u81EA\u52A8\u63A8\u8FDB") : automationReason(automation.pauseReason) || (automation.state === "completed" ? t("\u68C0\u67E5\u5DF2\u901A\u8FC7") : t("\u5DF2\u6682\u505C")) })
    ] })
  ] });
}

// apps/web/src/ExecutionFacts.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function executionReason(reason) {
  const labels2 = {
    natural_completion: "\u6267\u884C\u81EA\u7136\u7ED3\u675F",
    step_limit: "\u6B65\u6570\u4E0A\u9650",
    attempt_limit: "\u6D3E\u53D1\u6B21\u6570\u4E0A\u9650",
    deadline: "\u6267\u884C\u65F6\u9650\u5DF2\u5230",
    user_cancelled: "\u7528\u6237\u8BF7\u6C42\u505C\u6B62",
    permission_denied: "\u6388\u6743\u88AB\u62D2\u7EDD",
    provider_error: "\u4F9B\u5E94\u5546\u6267\u884C\u9519\u8BEF",
    input_stale: "\u8F93\u5165\u5DF2\u53D8\u5316",
    no_progress: "\u8FDE\u7EED\u65E0\u8FDB\u5C55",
    unknown: "\u539F\u56E0\u672A\u77E5"
  };
  return reason ? t(labels2[reason]) : "\u2014";
}
function usageValue(attempt, meter) {
  const summary = attempt.usageSummary;
  const value = summary ? summary[meter] : attempt.usage?.[meter];
  if (value == null) return t("\u672A\u77E5");
  const formatted = meter === "costUsd" ? `$${value}` : String(value);
  return summary?.unknownCounts[meter] ? t("{value} + {count} \u9879\u672A\u77E5", { value: formatted, count: summary.unknownCounts[meter] }) : formatted;
}
function ExecutionFacts({ attempt, compact = false }) {
  const factClass = compact ? "sf-run-facts" : "execution-facts";
  const detailsClass = compact ? "sf-details" : "context-details";
  const policy = attempt.policy;
  const enforcement = policy?.capabilities?.details?.stepLimit.enforcement || policy?.capabilities?.stepLimit;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("dl", { className: factClass, "aria-label": t("\u6267\u884C\u63A7\u5236\u4E0E\u7528\u91CF"), children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: t("\u8F93\u5165 Token") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: usageValue(attempt, "inputTokens") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: t("\u8F93\u51FA Token") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: usageValue(attempt, "outputTokens") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: t("\u5B9E\u9645\u8D39\u7528") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: attempt.target.backend === "sandbox" ? t("\u4E0D\u8C03\u7528 API") : usageValue(attempt, "costUsd") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: t("\u6267\u884C\u622A\u6B62\u65F6\u95F4") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: attempt.deadlineAt ? localizedDate(attempt.deadlineAt) : t("\u5386\u53F2\u8BB0\u5F55\u672A\u63D0\u4F9B") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: t("\u505C\u6B62\u539F\u56E0") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: executionReason(attempt.stopReason) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: t("\u505C\u6B62\u786E\u8BA4") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: attempt.stopRequestedAt ? attempt.terminalConfirmedAt ? t("\u5DF2\u786E\u8BA4\u7EC8\u6001") : t("\u6B63\u5728\u8BF7\u6C42\u505C\u6B62") : attempt.terminalConfirmedAt ? t("\u5DF2\u786E\u8BA4\u7EC8\u6001") : "\u2014" })
      ] }),
      policy && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: t("\u5355\u6B21\u6267\u884C\u6B65\u6570") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("dd", { children: [
            policy.limits.maxSteps,
            " \xB7 ",
            enforcement === "native" ? t("\u539F\u751F\u4E0A\u9650") : enforcement === "observed" ? t("\u89C2\u6D4B\u4FDD\u62A4") : t("\u80FD\u529B\u672A\u77E5")
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dt", { children: t("\u7D2F\u8BA1\u6D3E\u53D1\u4E0A\u9650") }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("dd", { children: t("\u672C\u5C1D\u8BD5 {attempt} \xB7 \u672C\u6D41\u7A0B {run}", { attempt: policy.limits.maxDispatches, run: policy.limits.maxRunDispatches }) })
        ] })
      ] })
    ] }),
    attempt.usageSummary?.completeness !== "complete" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: compact ? "sf-hint" : "run-control-note", children: t("\u7528\u91CF\u53EF\u80FD\u4E0D\u5B8C\u6574\uFF0C\u672A\u77E5\u9879\u6CA1\u6709\u6309\u96F6\u8BA1\u7B97\u3002") }),
    enforcement === "observed" && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: compact ? "sf-hint" : "run-control-note", children: t("\u89C2\u6D4B\u4FDD\u62A4\u4F1A\u8BF7\u6C42\u505C\u6B62\uFF0C\u4E0D\u80FD\u4FDD\u8BC1\u8FD0\u884C\u6070\u597D\u505C\u5728\u6307\u5B9A\u6B65\u6570\u3002") }),
    attempt.stopRequestedAt && !attempt.terminalConfirmedAt && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { role: "status", className: compact ? "sf-hint" : "run-control-note", children: t("\u505C\u6B62\u8BF7\u6C42\u5C1A\u672A\u786E\u8BA4\uFF1B\u8BF7\u6838\u5BF9\u539F\u6267\u884C\uFF0C\u4E0D\u80FD\u636E\u6B64\u5F00\u59CB\u65B0\u7684\u5199\u5165\u3002") }),
    attempt.contextManifest && /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("details", { className: detailsClass, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("summary", { children: t("\u672C\u6B21\u4E0A\u4E0B\u6587\u6E05\u5355") }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: t("\u5B8C\u6574\u63D0\u793A\u8BCD {bytes} \u5B57\u8282", { bytes: attempt.contextManifest.promptBytes ?? t("\u672A\u77E5") }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("ul", { children: attempt.contextManifest.entries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("li", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: entry.sourceId }),
          " \xB7 ",
          t("{bytes} \u5B57\u8282", { bytes: entry.bytes }),
          " \xB7 ",
          entry.required ? t("\u5FC5\u9700\u6750\u6599") : t("\u8F85\u52A9\u6750\u6599"),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("br", {}),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("code", { style: { overflowWrap: "anywhere", wordBreak: "break-word" }, children: entry.contentHash })
        ] }, entry.sourceId)) })
      ] })
    ] })
  ] });
}

// apps/web/src/VerificationRecovery.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
function VerificationRecovery({ disabled, compact = false, onConfirm }) {
  const confirm = () => {
    const reason = t("\u6211\u5DF2\u786E\u8BA4\u672C\u673A\u9A8C\u8BC1\u547D\u4EE4\u53CA\u5176\u5B50\u8FDB\u7A0B\u5DF2\u5168\u90E8\u7ED3\u675F\u3002");
    if (window.confirm(t("\u53EA\u6709\u786E\u8BA4\u672C\u673A\u9A8C\u8BC1\u547D\u4EE4\u53CA\u5176\u5B50\u8FDB\u7A0B\u5168\u90E8\u7ED3\u675F\u540E\uFF0C\u624D\u53EF\u89E3\u9664\u6B64\u963B\u585E\u3002\u662F\u5426\u786E\u8BA4\uFF1F"))) onConfirm(reason);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: compact ? "sf-inline-error" : "verification-recovery", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: t("\u9A8C\u8BC1\u8FDB\u7A0B\u7684\u7EC8\u6001\u5C1A\u672A\u786E\u8BA4\u3002\u8BF7\u5148\u68C0\u67E5\u672C\u673A\u8FDB\u7A0B\uFF1B\u786E\u8BA4\u524D\u4E0D\u4F1A\u5F00\u59CB\u65B0\u7684\u5199\u5165\u6216\u63A5\u7EB3\u3002") }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: compact ? "" : "outline-button", disabled, onClick: confirm, children: t("\u786E\u8BA4\u9A8C\u8BC1\u8FDB\u7A0B\u5DF2\u5168\u90E8\u7ED3\u675F") })
  ] });
}

// plugins/deepseek-specflow/package.json
var package_default = {
  name: "dsh-plugin-specflow",
  version: "0.1.1",
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
var client_default = ".sf-workbench{--sf-paper:#f5f6f2;--sf-panel:#fffefb;--sf-ink:#243c38;--sf-muted:#63766a;--sf-line:#dce4d9;--sf-accent:#0b4940;--sf-soft:#e6eee3;--sf-warning:#846128;--sf-danger:#a14638;box-sizing:border-box;display:flex;flex-direction:column;height:100%;min-height:0;color:var(--sf-ink);background:var(--sf-paper);font:13px/1.65 'Segoe UI','Microsoft YaHei UI','Microsoft YaHei',sans-serif;container-type:inline-size}\n.sf-workbench *{box-sizing:border-box}.sf-workbench button,.sf-workbench input,.sf-workbench textarea,.sf-workbench select{font:inherit;color:inherit}.sf-workbench button{cursor:pointer;border:1px solid var(--sf-line);border-radius:5px;padding:7px 10px;background:var(--sf-panel);line-height:1.45}.sf-workbench button:disabled{opacity:.48;cursor:not-allowed}.sf-workbench button:hover:not(:disabled){background:var(--sf-soft);border-color:#98b6a1}.sf-workbench :is(button,input,textarea,select,summary,a):focus-visible{outline:2px solid #338c78;outline-offset:3px}.sf-workbench :is(input,textarea,select){min-width:0;width:100%;border:1px solid var(--sf-line);border-radius:5px;padding:8px 9px;background:var(--sf-panel)}.sf-workbench textarea{resize:vertical;line-height:1.8}.sf-workbench h2,.sf-workbench h3,.sf-workbench h4,.sf-workbench p{margin:0}.sf-workbench code,.sf-workbench pre{font-family:'Cascadia Code',Consolas,monospace}.sf-workbench pre{font-size:11px;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere;margin:9px 0;max-height:520px;overflow:auto}.sf-workbench .sf-primary{color:#fff;background:var(--sf-accent);border-color:var(--sf-accent)}.sf-workbench .sf-primary:hover:not(:disabled){background:#156354;border-color:#156354}.sf-workbench .sf-stop{color:var(--sf-danger);border-color:#d4b7aa}.sf-header{display:flex;align-items:center;justify-content:space-between;padding:15px 17px 12px;border-bottom:1px solid var(--sf-line);flex-shrink:0}.sf-header>div{display:flex;align-items:center;gap:9px}.sf-header strong{font-size:21px;letter-spacing:-.65px;font-weight:600}.sf-header strong>span{color:#bb9150}.sf-brand-mark{display:grid;place-items:center;width:27px;height:27px;border-radius:7px;background:var(--sf-accent);color:white;font-size:17px;font-weight:600}.sf-header .sf-icon-button{width:30px;height:30px;padding:0;font-size:21px;border-color:transparent;background:transparent}.sf-context{padding:8px 17px 14px;flex-shrink:0}.sf-label-row{display:flex;justify-content:space-between;align-items:center;margin:7px 0;color:var(--sf-muted);font-size:11px}.sf-label-row button{border-color:transparent;background:transparent;padding:2px 0;color:var(--sf-accent);font-size:11px}.sf-path{display:block;overflow-wrap:anywhere;font-size:10px;line-height:1.8;color:var(--sf-muted);margin:6px 0}.sf-context>.sf-path{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sf-messages:empty{display:none}.sf-alert{margin:0 14px 12px;padding:11px 12px;border:1px solid #dfbead;background:#fbf0e9;color:var(--sf-danger);font-size:12px;overflow-wrap:anywhere}.sf-alert button{display:block;margin-top:9px;font-size:11px}.sf-notice{padding:0 17px 10px;font-size:11px;color:var(--sf-accent)}.sf-tabs{display:flex;border-block:1px solid var(--sf-line);padding:0 15px;gap:8px;flex-shrink:0}.sf-tabs button{position:relative;flex:1;padding:11px 5px;border:0;border-radius:0;background:transparent;color:var(--sf-muted);font-size:12px}.sf-tabs button.sf-active{color:var(--sf-accent);font-weight:600;box-shadow:inset 0 -2px var(--sf-accent)}.sf-count{display:inline-grid;place-items:center;min-width:16px;height:16px;border-radius:8px;background:#e6d8b9;color:#77551c;margin-left:5px;font-size:10px}.sf-body{min-height:0;overflow:auto;flex:1;padding:17px;scrollbar-width:thin}.sf-item-heading{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:0 0 18px;margin-bottom:16px;border-bottom:1px solid var(--sf-line)}.sf-item-heading h2{width:100%;font-size:19px;line-height:1.6;font-weight:600;overflow-wrap:anywhere;letter-spacing:-.3px}.sf-item-heading>code{font-size:10px;color:var(--sf-muted);overflow-wrap:anywhere}.sf-badge{display:inline-flex;align-items:center;padding:3px 6px;line-height:1.4;font-size:10px;border-radius:3px;background:var(--sf-soft);color:var(--sf-muted);white-space:nowrap}.sf-state-running,.sf-state-starting{color:var(--sf-accent);background:#dceee5}.sf-state-failed,.sf-state-blocked{background:#f6e2db;color:var(--sf-danger)}.sf-state-accepted,.sf-state-passed,.sf-state-ready{background:#dfeee2;color:#356b48}.sf-state-stale,.sf-state-waiting_interaction,.sf-state-reconciling,.sf-state-candidate{background:#f0e7d3;color:var(--sf-warning)}.sf-section-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:13px}.sf-section-heading h3,.sf-card h3{font-size:14px;font-weight:600}.sf-section-heading p{font-size:11px;color:var(--sf-muted);margin-top:4px}.sf-stages{display:flex;flex-direction:column;gap:4px;margin-bottom:17px}.sf-stages .sf-stage{display:flex;align-items:center;text-align:left;gap:9px;padding:10px 9px;border-color:transparent;background:transparent}.sf-stage>span:nth-child(2){flex:1;min-width:0}.sf-stage strong{display:block;font-size:12px;font-weight:500;overflow-wrap:anywhere}.sf-stage small{display:block;font-size:10px;margin-top:3px;color:var(--sf-muted)}.sf-stage-number{font-size:10px;font-family:Consolas,monospace;color:#83958a;width:19px;flex-shrink:0}.sf-stages .sf-stage.sf-selected{background:var(--sf-soft);border-color:#ccd9c8;box-shadow:inset 3px 0 var(--sf-accent)}.sf-stage.sf-selected .sf-stage-number{color:var(--sf-accent)}.sf-card{padding:15px;border:1px solid var(--sf-line);border-radius:6px;background:var(--sf-panel);margin:0 0 17px}.sf-facts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0 15px}.sf-facts>div{min-width:0}.sf-facts dt{font-size:10px;color:var(--sf-muted)}.sf-facts dd{font-size:11px;margin:3px 0 0;overflow-wrap:anywhere}.sf-field{display:flex;flex-direction:column;gap:7px;font-size:11px;color:var(--sf-muted);margin:11px 0}.sf-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:15px}.sf-actions>button{font-size:12px}.sf-inline-error{padding:10px;border-left:2px solid var(--sf-danger);background:#f9ece6;color:var(--sf-danger);font-size:12px;overflow-wrap:anywhere}.sf-blockers{padding:12px 12px 12px 26px;margin:12px 0;background:#f3ecd9;border:1px solid #e0d4b7;border-radius:4px;color:var(--sf-warning);font-size:11px}.sf-blockers li+li{margin-top:7px}.sf-hint{color:var(--sf-muted);font-size:11px;line-height:1.9;margin:9px 0!important}.sf-details{border-block:1px solid var(--sf-line);padding:11px 0;margin:15px 0;font-size:12px}.sf-details summary,.sf-evidence summary{cursor:pointer;font-size:12px;color:var(--sf-muted)}.sf-details>p{margin-top:10px}.sf-preserve{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.9}.sf-form{padding:15px;margin:0 15px 15px;border:1px solid #bdcfbd;border-radius:6px;background:var(--sf-panel)}.sf-form h3{font-size:14px;margin-bottom:14px}.sf-form>label{display:block;font-size:11px;color:var(--sf-muted);margin:10px 0 5px}.sf-empty{text-align:center;padding:38px 8px 45px}.sf-empty-mark{display:grid;place-items:center;background:var(--sf-soft);color:var(--sf-accent);width:46px;height:46px;border-radius:10px;font-size:27px;margin:0 auto 17px}.sf-empty h3{font-size:16px;line-height:1.7;font-weight:500}.sf-empty p{font-size:12px;color:var(--sf-muted);line-height:1.9;margin:11px auto 0;max-width:300px}.sf-loading{color:var(--sf-muted);font-size:12px;padding:14px 0;line-height:1.9}.sf-footer{display:flex;align-items:center;gap:7px;padding:9px 17px;border-top:1px solid var(--sf-line);font-size:10px;color:var(--sf-muted);flex-shrink:0}.sf-footer>span:last-child{margin-left:auto}.sf-status-dot{width:5px;height:5px;background:#478973;border-radius:50%}.sf-eyebrow{display:block;font-size:10px;letter-spacing:1px;color:#6e9279;margin-bottom:8px}.sf-clarification{border-color:#b9cfb8;background:#f4f8ef}.sf-question{padding-top:15px;margin-top:16px;border-top:1px solid var(--sf-line)}.sf-question label{display:flex;align-items:flex-start;gap:8px;font-size:12px;font-weight:600}.sf-question label>span{font:10px/1.8 Consolas,monospace;color:var(--sf-muted)}.sf-question>p{font-size:11px;line-height:1.9;margin:7px 0 11px;color:var(--sf-muted)}.sf-options{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}.sf-options button{text-align:left;font-size:11px}.sf-options button[aria-pressed=true]{background:#e0eddf;border-color:#83a58b;color:var(--sf-accent)}.sf-clarification>textarea{margin-top:7px}.sf-document-heading{display:flex;align-items:center;gap:9px;flex-wrap:wrap;color:var(--sf-muted);font-size:10px;margin:11px 0}.sf-segmented{display:flex;gap:3px;padding:3px;background:var(--sf-soft);border-radius:5px;margin:16px 0}.sf-segmented button{flex:1;font-size:11px;background:transparent;border-color:transparent}.sf-segmented button[aria-pressed=true]{background:var(--sf-panel);border-color:var(--sf-line);color:var(--sf-accent)}.sf-reading{padding:17px 0}.sf-reading h3{font:600 23px/1.6 Georgia,'Microsoft YaHei',serif;letter-spacing:-.5px}.sf-reading-summary{font-size:13px;line-height:1.95;white-space:pre-wrap;margin:13px 0 22px!important}.sf-reading>section{margin:18px 0;border-top:1px solid var(--sf-line);padding-top:15px}.sf-reading h4{display:flex;gap:10px;font-size:13px;font-weight:600}.sf-reading h4>span{color:var(--sf-muted);font:10px/2 Consolas,monospace}.sf-reading ul{padding-left:18px;margin:10px 0}.sf-reading li{font-size:12px;line-height:1.95;white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0}.sf-accept-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border-block:1px solid var(--sf-line);padding:13px 0;margin-top:15px}.sf-accept-bar>span{color:var(--sf-muted);font-size:11px}.sf-accept-bar button{font-size:11px}.sf-finding{padding:12px;border:1px solid var(--sf-line);margin-top:13px}.sf-finding p{margin:9px 0;font-size:12px}.sf-finding code{font-size:10px;color:var(--sf-muted)}.sf-document{line-height:1.9;overflow-wrap:anywhere}.sf-document .markdown-toc{border-left:2px solid var(--sf-line);padding-left:10px;margin:16px 0}.sf-document .markdown-toc>strong{font-size:11px;color:var(--sf-muted)}.sf-document .markdown-toc a{display:block;font-size:11px;line-height:2;color:var(--sf-accent);text-decoration:none}.sf-document h1{font-size:22px;line-height:1.6}.sf-document h2{font-size:19px}.sf-document h3{font-size:16px}.sf-document h4{font-size:14px}.sf-document :is(h1,h2,h3,h4,h5,h6){margin:20px 0 10px}.sf-document p{margin:10px 0;font-size:12px}.sf-document pre,.sf-document blockquote{padding:12px;background:var(--sf-soft);border-radius:4px;margin:11px 0}.sf-document code{font-size:11px}.sf-document :is(ul,ol){padding-left:22px;font-size:12px}.sf-document a{color:var(--sf-accent);text-underline-offset:3px}.sf-document .markdown-table-scroll{overflow:auto}.sf-document table{border-collapse:collapse;font-size:11px;white-space:nowrap}.sf-document :is(td,th){border:1px solid var(--sf-line);padding:7px 9px}.sf-run-facts{margin:10px 0;display:flex;flex-direction:column;gap:10px}.sf-run-facts>div{min-width:0}.sf-run-facts dt{font-size:10px;color:var(--sf-muted)}.sf-run-facts dd{margin:2px 0 0;overflow-wrap:anywhere;font-size:12px}.sf-subheading{font-size:12px;margin:20px 0 12px!important}.sf-evidence{border:1px solid var(--sf-line);padding:11px;margin:8px 0}.sf-evidence summary{display:flex;gap:8px;align-items:center}.sf-checkbox{display:flex;align-items:flex-start;gap:8px;font-size:11px;line-height:1.9;margin-top:18px}.sf-checkbox input{width:14px;flex-shrink:0;margin-top:4px;accent-color:var(--sf-accent)}.sf-diff{background:var(--sf-panel);padding:11px}.sf-document hr{border:0;border-top:1px solid var(--sf-line);margin:18px 0}\n@container (max-width:300px){.sf-body{padding:13px}.sf-header{padding-inline:13px}.sf-context{padding-inline:13px}.sf-stage small{font-size:9px}.sf-stages .sf-stage{gap:6px;padding:9px 6px}.sf-stage>.sf-badge{font-size:9px}.sf-stage-number{width:16px}.sf-card{padding:12px}.sf-tabs{padding-inline:10px;gap:3px}.sf-facts{gap:8px}.sf-actions .sf-primary{width:100%}}\nbody[data-ds-dark-theme] .sf-workbench{--sf-paper:#1d2621;--sf-panel:#232f27;--sf-ink:#e0e9df;--sf-muted:#a6b6a7;--sf-line:#3d4d40;--sf-accent:#a8d1b1;--sf-soft:#2b3d2e;--sf-warning:#ddc58d;--sf-danger:#edb1a2}body[data-ds-dark-theme] .sf-workbench .sf-primary{background:#365f44;border-color:#56795b;color:#f0f6ed}body[data-ds-dark-theme] .sf-workbench .sf-primary:hover:not(:disabled){background:#426e4e;border-color:#719376}body[data-ds-dark-theme] .sf-workbench button:hover:not(:disabled){border-color:#7a9b7d}body[data-ds-dark-theme] .sf-brand-mark{background:#365f44}body[data-ds-dark-theme] .sf-stage.sf-selected{border-color:#5e7d60!important}body[data-ds-dark-theme] .sf-alert,body[data-ds-dark-theme] .sf-inline-error{background:#412d26;border-color:#78574b}body[data-ds-dark-theme] .sf-blockers{background:#3c3826;border-color:#645d3c}body[data-ds-dark-theme] .sf-clarification{background:#243326;border-color:#506c4b}body[data-ds-dark-theme] .sf-options button[aria-pressed=true]{background:#345036;border-color:#7a9b7d}body[data-ds-dark-theme] .sf-state-running,body[data-ds-dark-theme] .sf-state-starting,body[data-ds-dark-theme] .sf-state-accepted,body[data-ds-dark-theme] .sf-state-passed,body[data-ds-dark-theme] .sf-state-ready{background:#304a35;color:#b5d7b5}body[data-ds-dark-theme] .sf-state-failed,body[data-ds-dark-theme] .sf-state-blocked{background:#4b3029;color:#edb1a2}body[data-ds-dark-theme] .sf-state-stale,body[data-ds-dark-theme] .sf-state-waiting_interaction,body[data-ds-dark-theme] .sf-state-reconciling,body[data-ds-dark-theme] .sf-state-candidate{background:#49402c;color:#ddc58d}\n@media(prefers-color-scheme:dark){html:not([data-ds-theme-source]) .sf-workbench{--sf-paper:#1d2621;--sf-panel:#232f27;--sf-ink:#e0e9df;--sf-muted:#a6b6a7;--sf-line:#3d4d40;--sf-accent:#a8d1b1;--sf-soft:#2b3d2e;--sf-warning:#ddc58d;--sf-danger:#edb1a2}html:not([data-ds-theme-source]) .sf-workbench .sf-primary{background:#365f44;border-color:#56795b;color:#f0f6ed}html:not([data-ds-theme-source]) .sf-workbench .sf-primary:hover:not(:disabled){background:#426e4e;border-color:#719376}html:not([data-ds-theme-source]) .sf-workbench button:hover:not(:disabled){border-color:#7a9b7d}html:not([data-ds-theme-source]) .sf-brand-mark{background:#365f44}html:not([data-ds-theme-source]) .sf-stage.sf-selected{border-color:#5e7d60!important}html:not([data-ds-theme-source]) .sf-alert,html:not([data-ds-theme-source]) .sf-inline-error{background:#412d26;border-color:#78574b}html:not([data-ds-theme-source]) .sf-blockers{background:#3c3826;border-color:#645d3c}html:not([data-ds-theme-source]) .sf-clarification{background:#243326;border-color:#506c4b}html:not([data-ds-theme-source]) .sf-options button[aria-pressed=true]{background:#345036;border-color:#7a9b7d}html:not([data-ds-theme-source]) .sf-state-running,html:not([data-ds-theme-source]) .sf-state-starting,html:not([data-ds-theme-source]) .sf-state-accepted,html:not([data-ds-theme-source]) .sf-state-passed,html:not([data-ds-theme-source]) .sf-state-ready{background:#304a35;color:#b5d7b5}html:not([data-ds-theme-source]) .sf-state-failed,html:not([data-ds-theme-source]) .sf-state-blocked{background:#4b3029;color:#edb1a2}html:not([data-ds-theme-source]) .sf-state-stale,html:not([data-ds-theme-source]) .sf-state-waiting_interaction,html:not([data-ds-theme-source]) .sf-state-reconciling,html:not([data-ds-theme-source]) .sf-state-candidate{background:#49402c;color:#ddc58d}}\n\n.sf-requirement-actions{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:13px 0}.sf-requirement-actions>button,.sf-document-heading>button{font-size:11px}.sf-document-heading>button{margin-left:auto}.sf-editor-version{font:10px/1.7 Consolas,monospace;color:var(--sf-muted);overflow-wrap:anywhere}.sf-editor{padding:13px;margin:13px 0;border:1px solid var(--sf-line);border-radius:5px;background:var(--sf-panel)}.sf-editor .sf-section-heading{align-items:flex-start}.sf-editor .sf-section-heading h3{font-size:13px}.sf-document-editor textarea{font:12px/1.9 'Cascadia Code',Consolas,monospace;min-height:300px}.sf-editor-conflict{margin:13px 0;padding:12px;border:1px solid var(--sf-warning);border-radius:4px;background:var(--sf-soft);color:var(--sf-warning);font-size:11px;line-height:1.9}.sf-editor-conflict>details{margin:10px 0;color:var(--sf-ink)}.sf-editor-conflict>details>p{margin-top:10px}.sf-editor-conflict>button{font-size:11px;margin-top:8px}.sf-requirement-documents{margin:16px 0;color:var(--sf-ink)}.sf-requirement-documents>h4{font-size:11px;font-weight:500;color:var(--sf-muted);margin-bottom:9px}.sf-requirement-documents>details{border:1px solid var(--sf-line);border-radius:4px;padding:10px;margin:7px 0}.sf-requirement-documents summary{overflow-wrap:anywhere;font-size:11px}.sf-requirement-documents summary>span{font-size:10px;color:var(--sf-muted);margin-left:8px}.sf-requirement-documents pre{font-size:11px}.sf-requirements>.sf-preserve{margin-top:12px}.sf-document-editor .sf-actions{margin-bottom:2px}\n.sf-header .sf-language{width:auto;max-width:105px;padding:5px 7px;font-size:11px}.sf-workbench[lang=en] .sf-facts{grid-template-columns:repeat(2,minmax(0,1fr))}.sf-workbench[lang=en] .sf-actions{flex-wrap:wrap}.sf-workbench[lang=en] :is(button,summary,h3,label){overflow-wrap:anywhere}\n";

// plugins/deepseek-specflow/src/client.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
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
    guide: [{ id: "workbench", order: 40, title: () => t("Specflow \u5DE5\u7A0B\u5DE5\u4F5C\u53F0"), description: () => t("\u4ECE\u9700\u6C42\u3001\u89C4\u683C\u5230\u590D\u6838\u4E0E\u9A8C\u6536") }]
  }), "specflow: tab type");
  ctx.effect(() => ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register(
    { name: "sidebar.right.pane.tab", key: TAB_ID, inject: () => ({ connection: ctx.connection }) },
    SpecflowPanel
  )), "specflow: tab body");
}
var labels = localizedLabels({
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
});
var logicalLabels = localizedLabels({ spec: "\u9700\u6C42\u89C4\u683C", plan: "\u5DE5\u7A0B\u8BBE\u8BA1", tasks: "\u4EFB\u52A1\u62C6\u89E3", implementation: "\u5B9E\u73B0\u8BF4\u660E", convergence: "\u5BF9\u9F50\u62A5\u544A" });
var activeStates = ["starting", "running", "waiting_interaction", "reconciling"];
var short = (value) => value ? value.slice(0, 8) : "\u2014";
var time = localizedDate;
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
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-empty", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "sf-empty-mark", "aria-hidden": "true", children: "\u25C7" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: title }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children })
  ] });
}
function Badge({ value, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: `sf-badge sf-state-${value}`, children: children ?? labels[value] ?? value });
}
function SpecflowPanel(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(SessionPanel, { ...props }, props.sessionId);
}
function SessionPanel({ connection, sessionId, useTabInfo, useSessions, useSession, useProjection }) {
  const locale2 = useLocale();
  const originalCwd = useSessions((state) => state.byId[sessionId]?.cwd);
  const sessionOpen = useSession((state) => state.openState === "open");
  const projectedCwd = useProjection("workingDirectory");
  const cwd = typeof projectedCwd === "string" && projectedCwd ? projectedCwd : originalCwd;
  const [languageError, setLanguageError] = (0, import_react4.useState)(false);
  const { tab } = useTabInfo();
  const storageKey = pendingKey(sessionId);
  const [previousWrite] = (0, import_react4.useState)(() => rememberedWrite(connection, storageKey));
  const [bootstrap, setBootstrap] = (0, import_react4.useState)();
  const [snapshot, setSnapshot] = (0, import_react4.useState)();
  const [projectId, setProjectId] = (0, import_react4.useState)(""), [itemId, setItemId] = (0, import_react4.useState)("");
  const [section, setSection] = (0, import_react4.useState)("flow");
  const [busy, setBusy] = (0, import_react4.useState)(false), [loading, setLoading] = (0, import_react4.useState)(true);
  const [error, setError] = (0, import_react4.useState)(previousWrite ? "\u4E0A\u6B21\u5199\u5165\u7684\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u5237\u65B0\u5E76\u6838\u5BF9\u5DE5\u7A0B\u8BB0\u5F55\u540E\u7EE7\u7EED\u3002" : ""), [notice, setNotice] = (0, import_react4.useState)("");
  const [uncertain, setUncertain] = (0, import_react4.useState)(!!previousWrite), [refreshKey, setRefreshKey] = (0, import_react4.useState)(0);
  const [form, setForm] = (0, import_react4.useState)();
  const [editing, setEditing] = (0, import_react4.useState)({});
  const reportDraft = (0, import_react4.useCallback)((kind, value) => setEditing((current2) => current2[kind] === value ? current2 : { ...current2, [kind]: value }), []);
  const [association, setAssociation] = (0, import_react4.useState)({});
  const handledContext = (0, import_react4.useRef)(void 0), context = (0, import_react4.useRef)(cwd);
  context.current = cwd;
  const alive = (0, import_react4.useRef)(true), lock = (0, import_react4.useRef)(false), selection = (0, import_react4.useRef)({ projectId, itemId });
  const uncertainWrite = (0, import_react4.useRef)(!!previousWrite), explicitRefresh = (0, import_react4.useRef)(false);
  const controlsId = (0, import_react4.useId)();
  if (selection.current.projectId !== projectId || selection.current.itemId !== itemId) selection.current = { projectId, itemId };
  const select = (projectId2, itemId2 = "") => {
    selection.current = { projectId: projectId2, itemId: itemId2 };
    setProjectId(projectId2);
    setItemId(itemId2);
    setSnapshot(void 0);
  };
  const lifetime = (0, import_react4.useRef)(void 0);
  if (!lifetime.current) lifetime.current = new AbortController();
  const read = (0, import_react4.useCallback)((request, signal) => readSpecflow(connection, { ...request, locale: locale2 }, AbortSignal.any([lifetime.current.signal, tab.signal, ...signal ? [signal] : []])), [connection, tab.signal, locale2]);
  (0, import_react4.useEffect)(() => {
    alive.current = true;
    if (lifetime.current?.signal.aborted) lifetime.current = new AbortController();
    return () => {
      alive.current = false;
      lifetime.current?.abort();
    };
  }, []);
  (0, import_react4.useEffect)(() => {
    setEditing({});
  }, [projectId, itemId]);
  (0, import_react4.useEffect)(() => {
    if (!tab.visible) return;
    let current2 = true, timer;
    const controller = new AbortController();
    const sync = async () => {
      const requestedSelection = selection.current;
      try {
        const initial = await read({ resource: "bootstrap" }, controller.signal);
        if (!current2) return;
        if (selection.current !== requestedSelection) return;
        setBootstrap(initial);
        const selected = selection.current;
        const project2 = initial.projects.find((project3) => project3.id === selected.projectId) ?? (cwd ? void 0 : initial.projects[0]);
        const items2 = initial.workItems.filter((item2) => item2.projectId === project2?.id);
        const item = items2.find((item2) => item2.id === selected.itemId) ?? items2[0];
        setProjectId(project2?.id ?? "");
        setItemId(item?.id ?? "");
        const value = item ? await read({ resource: "snapshot", id: item.id }, controller.signal) : void 0;
        if (!current2 || selection.current !== requestedSelection) return;
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
  }, [read, tab.visible, projectId, itemId, refreshKey, cwd]);
  const command = async (operation, id, input, quiet = false) => {
    if (lock.current || uncertain || !tab.visible || !bootstrap?.canWrite) throw new Error(t("\u8BF7\u5148\u5237\u65B0\u5DE5\u7A0B\u72B6\u6001\uFF0C\u518D\u6267\u884C\u64CD\u4F5C\u3002"));
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    const pending2 = { operation, id, idempotencyKey: crypto.randomUUID(), startedAt: (/* @__PURE__ */ new Date()).toISOString() };
    rememberWrite(connection, storageKey, pending2);
    const clearPending = () => {
      if (rememberedWrite(connection, storageKey)?.idempotencyKey === pending2.idempotencyKey) rememberWrite(connection, storageKey);
    };
    try {
      const result = await commandSpecflow(connection, { operation, id, input, locale: getLocale(), idempotencyKey: pending2.idempotencyKey }, AbortSignal.any([lifetime.current.signal, tab.signal]));
      clearPending();
      if (alive.current) {
        if (!quiet) setNotice("\u64CD\u4F5C\u5DF2\u8BB0\u5F55\uFF0C\u6B63\u5728\u540C\u6B65\u5DE5\u7A0B\u72B6\u6001\u3002");
        setRefreshKey((value) => value + 1);
      }
      return result;
    } catch (error2) {
      const failure = error2;
      const status = failure?.details?.status;
      const rejected = failure?.code === "INVALID_REQUEST" || typeof status === "number" && status >= 400 && status < 500;
      const unknown = !rejected;
      if (!unknown) clearPending();
      if (alive.current) {
        setUncertain(unknown);
        uncertainWrite.current = unknown;
        if (!quiet || unknown) setError(`${errorMessage(error2)}${unknown ? ` ${t("\u5199\u5165\u7ED3\u679C\u5C1A\u672A\u786E\u8BA4\uFF0C\u8BF7\u5237\u65B0\u5E76\u6838\u5BF9\u8FD0\u884C\u8BB0\u5F55\u3002")}` : ""}`);
      }
      throw error2;
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const refresh = () => {
    if (association.failed) handledContext.current = void 0;
    explicitRefresh.current = true;
    setLoading(true);
    setRefreshKey((value) => value + 1);
  };
  const run = (operation, id, input) => {
    void command(operation, id, input).catch(() => {
    });
  };
  const hasDraft = Object.values(editing).some(Boolean);
  const contextPending = !!cwd && handledContext.current !== cwd;
  const writesBlocked = busy || uncertain || !bootstrap?.canWrite || !tab.visible || !!error;
  const disabled = writesBlocked || contextPending && !hasDraft && !form;
  const project = bootstrap?.projects.find((project2) => project2.id === projectId);
  const items = bootstrap?.workItems.filter((item) => item.projectId === projectId) ?? [];
  const current = snapshot?.item.id === itemId ? snapshot : void 0;
  const pending = current?.clarifications.filter((clarification) => clarification.state === "waiting_answers").length ?? 0;
  const pendingInteractions = current?.interactions.filter((interaction) => interaction.state === "pending") ?? [];
  (0, import_react4.useEffect)(() => {
    if (!sessionOpen || !cwd || handledContext.current === cwd || !bootstrap?.canWrite || !tab.visible || busy || uncertain || error || hasDraft || form) return;
    const directory = cwd;
    handledContext.current = directory;
    setAssociation({ cwd: directory });
    select("");
    void command("associateProject", void 0, { rootPath: directory }, true).then((value) => {
      if (!alive.current || context.current !== directory) return;
      const result = value;
      setBootstrap((previous) => previous && { ...previous, projects: [...previous.projects.filter((project2) => project2.id !== result.project.id), result.project] });
      select(result.project.id, result.workItemId);
      setAssociation({ cwd: directory, linked: true });
    }).catch(() => {
      if (alive.current && context.current === directory) setAssociation({ cwd: directory, failed: true });
    });
  }, [sessionOpen, cwd, bootstrap?.canWrite, tab.visible, busy, uncertain, error, hasDraft, form, refreshKey]);
  const chooseProject = (id) => {
    handledContext.current = cwd;
    setAssociation({ cwd });
    select(id);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-workbench", lang: locale2, "data-specflow-panel": true, "data-session-id": sessionId, "aria-busy": loading || busy, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("header", { className: "sf-header", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "sf-brand-mark", "aria-hidden": "true", children: "S" }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("strong", { children: [
          "Specflow",
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: "." })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("select", { className: "sf-language", "aria-label": t("\u754C\u9762\u8BED\u8A00"), value: locale2, disabled: busy, onChange: (event) => {
          setLanguageError(false);
          void setLocale(event.target.value, { updateDocument: false }).catch(() => setLanguageError(true));
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "zh-CN", children: "\u4E2D\u6587" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "en", children: "English" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "sf-icon-button", title: t("\u5237\u65B0\u5DE5\u7A0B\u72B6\u6001"), "aria-label": t("\u5237\u65B0\u5DE5\u7A0B\u72B6\u6001"), disabled: busy, onClick: refresh, children: "\u21BB" })
      ] })
    ] }),
    languageError && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-inline-error", role: "alert", children: t("\u8BED\u8A00\u8BBE\u7F6E\u672A\u80FD\u4FDD\u5B58\uFF0C\u8BF7\u91CD\u8BD5\u3002") }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-context", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-label-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("label", { htmlFor: `${controlsId}-project`, children: t("\u5DE5\u7A0B") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", disabled: writesBlocked || hasDraft, onClick: () => setForm(form === "project" ? void 0 : "project"), children: t("\uFF0B \u6253\u5F00\u4ED3\u5E93") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("select", { id: `${controlsId}-project`, value: projectId, disabled: busy || hasDraft, onChange: (event) => chooseProject(event.target.value), children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "", disabled: true, children: t("\u9009\u62E9\u672C\u5730\u5DE5\u7A0B") }),
        bootstrap?.projects.map((project2) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: project2.id, children: project2.name }, project2.id))
      ] }),
      project && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("code", { className: "sf-path", title: project.rootPath, children: project.rootPath }),
      cwd && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-hint", title: cwd, children: contextPending && (hasDraft || form) ? t("\u5F53\u524D\u5BF9\u8BDD\u76EE\u5F55\u5DF2\u53D8\u5316\uFF0C\u4FDD\u5B58\u6216\u53D6\u6D88\u7F16\u8F91\u540E\u5C06\u81EA\u52A8\u5173\u8054\u3002") : association.cwd === cwd && association.linked ? t("\u5DF2\u5173\u8054\u5F53\u524D\u5BF9\u8BDD\u5DE5\u7A0B") : association.cwd === cwd && association.failed ? t("\u65E0\u6CD5\u81EA\u52A8\u5173\u8054\u5F53\u524D\u5BF9\u8BDD\u76EE\u5F55\uFF0C\u8BF7\u624B\u52A8\u9009\u62E9\u5DE5\u7A0B\u6216\u6253\u5F00 Git \u4ED3\u5E93\u3002") : contextPending || busy && !association.linked ? t("\u6B63\u5728\u5173\u8054\u5F53\u524D\u5BF9\u8BDD\u5DE5\u7A0B\u2026") : "" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-label-row", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("label", { htmlFor: `${controlsId}-item`, children: t("\u5DE5\u4F5C\u9879") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", disabled: disabled || hasDraft || !project, onClick: () => setForm(form === "item" ? void 0 : "item"), children: t("\uFF0B \u65B0\u9700\u6C42") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("select", { id: `${controlsId}-item`, value: itemId, disabled: busy || hasDraft || !items.length, onChange: (event) => select(projectId, event.target.value), children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "", disabled: true, children: items.length ? t("\u9009\u62E9\u5DE5\u4F5C\u9879") : t("\u6B64\u5DE5\u7A0B\u8FD8\u6CA1\u6709\u9700\u6C42") }),
        items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: item.id, children: item.name }, item.id))
      ] }),
      hasDraft && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-hint", children: t("\u6709\u672A\u4FDD\u5B58\u7684\u7F16\u8F91\u3002\u4FDD\u5B58\u6216\u53D6\u6D88\u7F16\u8F91\u540E\uFF0C\u5373\u53EF\u5207\u6362\u5DE5\u7A0B\u6216\u5DE5\u4F5C\u9879\u3002") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-messages", "aria-live": "polite", children: [
      error && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-alert", role: "alert", children: [
        t(error),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", disabled: busy, onClick: refresh, children: t("\u5237\u65B0\u6838\u5BF9") })
      ] }),
      notice && !error && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-notice", role: "status", children: t(notice) })
    ] }),
    form && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(CreateForm, { kind: form, disabled, projectId, command, onCancel: () => setForm(void 0), onCreated: (result) => {
      setForm(void 0);
      if (form === "project") chooseProject(result.id);
      else select(projectId, result.id);
    } }, form),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("nav", { className: "sf-tabs", "aria-label": t("\u5DE5\u7A0B\u5DE5\u4F5C\u533A"), children: [["flow", t("\u6D41\u7A0B")], ["documents", t("\u6587\u6863")], ["code", t("\u4EE3\u7801")], ["runs", t("\u8FD0\u884C")]].map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", "aria-current": section === key ? "page" : void 0, className: section === key ? "sf-active" : "", onClick: () => setSection(key), children: [
      label,
      key === "flow" && pending > 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "sf-count", children: pending })
    ] }, key)) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("main", { className: "sf-body", children: loading && !current ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-loading", role: "status", children: t("\u6B63\u5728\u8BFB\u53D6\u672C\u5730\u5DE5\u7A0B\u2026") }) : !project ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Empty, { title: t("\u628A\u9700\u6C42\u53D8\u6210\u53EF\u9A8C\u8BC1\u7684\u5DE5\u7A0B"), children: t("\u6253\u5F00\u4E00\u4E2A\u672C\u5730 Git \u4ED3\u5E93\uFF0C\u4ECE\u9700\u6C42\u89C4\u683C\u5F00\u59CB\u5EFA\u7ACB\u5B8C\u6574\u7684\u5F00\u53D1\u8BB0\u5F55\u3002") }) : !current ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Empty, { title: t("\u4ECE\u4E00\u4E2A\u65B0\u9700\u6C42\u5F00\u59CB"), children: t("\u4E3A {0} \u521B\u5EFA\u5DE5\u4F5C\u9879\u3002\u6BCF\u4E2A\u5DE5\u4F5C\u9879\u4F1A\u4F7F\u7528\u72EC\u7ACB\u7684\u5206\u652F\u4E0E\u5DE5\u4F5C\u533A\u3002", { 0: project.name }) }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-item-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h2", { children: current.item.name }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Badge, { value: current.item.status }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("code", { title: current.item.branch, children: current.item.branch })
      ] }),
      pendingInteractions.map((interaction) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(InteractionCard, { id: interaction.id, request: interaction.request, command, disabled, onEditingChange: (value) => reportDraft(`interaction:${interaction.id}`, value) }, interaction.id)),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { hidden: section !== "flow", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Flow, { snapshot: current, bootstrap, read, run, command, disabled, visible: tab.visible && section === "flow", onCode: () => setSection("code"), onRequirementsEditingChange: (value) => reportDraft("requirements", value), onDraftChange: reportDraft }, current.item.id) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { hidden: section !== "documents", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Documents, { snapshot: current, read, run, command, disabled, visible: tab.visible && section === "documents", onEditingChange: (value) => reportDraft("artifact", value) }, current.item.id) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { hidden: section !== "code", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Code, { snapshot: current, read, run, disabled, visible: tab.visible && section === "code" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { hidden: section !== "runs", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Runs, { snapshot: current, bootstrap, read, run, disabled, visible: tab.visible && section === "runs" }) })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("footer", { className: "sf-footer", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "sf-status-dot" }),
      t("\u672C\u5730\u5DE5\u7A0B\u8BB0\u5F55"),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: busy ? t("\u6B63\u5728\u64CD\u4F5C") : loading ? t("\u540C\u6B65\u4E2D") : t("DSH \u63D2\u4EF6") })
    ] })
  ] });
}
function CreateForm({ kind, projectId, command, onCreated, onCancel, disabled }) {
  const prefix = (0, import_react4.useId)(), [name, setName] = (0, import_react4.useState)(""), [content, setContent] = (0, import_react4.useState)("");
  const submit = async (event) => {
    event.preventDefault();
    try {
      const result = await command(kind === "project" ? "registerProject" : "createWorkItem", void 0, kind === "project" ? { rootPath: content.trim(), name: name.trim() || void 0 } : { projectId, name: name.trim(), request: content.trim(), kind: "feature", documents: [] });
      onCreated(result);
    } catch {
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("form", { className: "sf-form", onSubmit: submit, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: kind === "project" ? t("\u6253\u5F00\u672C\u5730 Git \u4ED3\u5E93") : t("\u521B\u5EFA\u65B0\u9700\u6C42") }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("label", { htmlFor: `${prefix}-name`, children: kind === "project" ? t("\u5DE5\u7A0B\u540D\u79F0\uFF08\u53EF\u9009\uFF09") : t("\u9700\u6C42\u540D\u79F0") }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { id: `${prefix}-name`, autoFocus: true, value: name, required: kind === "item", maxLength: 200, onChange: (event) => setName(event.target.value) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("label", { htmlFor: `${prefix}-content`, children: kind === "project" ? t("\u4ED3\u5E93\u7EDD\u5BF9\u8DEF\u5F84") : t("\u9700\u6C42\u4E0E\u9A8C\u6536\u9884\u671F") }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("textarea", { id: `${prefix}-content`, rows: kind === "project" ? 2 : 5, value: content, required: true, onChange: (event) => setContent(event.target.value), placeholder: kind === "project" ? "C:\\projects\\my-app" : t("\u5E0C\u671B\u5B9E\u73B0\u4EC0\u4E48\uFF1F\u54EA\u4E9B\u884C\u4E3A\u4EE3\u8868\u5B8C\u6210\uFF1F") }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", disabled, onClick: onCancel, children: t("\u53D6\u6D88") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "sf-primary", disabled: disabled || !content.trim() || kind === "item" && !name.trim(), children: kind === "project" ? t("\u6253\u5F00\u5DE5\u7A0B") : t("\u521B\u5EFA\u5DE5\u4F5C\u9879") })
    ] })
  ] });
}
function Flow({ snapshot, bootstrap, read, run, command, disabled, visible, onCode, onRequirementsEditingChange, onDraftChange }) {
  const latest = snapshot.runs.at(-1);
  const nodes = snapshot.nodes.filter((node2) => node2.workflowRunId === latest?.id);
  const [chosen, setChosen] = (0, import_react4.useState)(""), [override, setOverride] = (0, import_react4.useState)(""), [showStages, setShowStages] = (0, import_react4.useState)(false);
  const [editingRequirements, setEditingRequirements] = (0, import_react4.useState)(false);
  const node = nodes.find((node2) => node2.id === chosen) ?? selectCurrentNode(latest, nodes);
  const definition = latest?.definition.nodes.find((definition2) => definition2.id === node?.nodeId);
  const [readiness, setReadiness] = (0, import_react4.useState)();
  const readinessKey = `${node?.id}:${node?.revision}:${snapshot.item.revision}:${snapshot.project.revision}:${snapshot.requirements.current.id}:${snapshot.artifacts.map((artifact) => artifact.revision).join(",")}`;
  const backend = snapshot.project.executionBackend ?? "dsh";
  const targets = bootstrap.catalog.targets.filter((target) => target.backend === backend);
  const configured = definition?.target ?? (definition?.role ? latest?.definition.roles[definition.role] ?? snapshot.project.defaults[definition.role] : void 0);
  const selected = targets.find((target) => targetKey(target) === override) ?? (configured?.backend === backend ? configured : targets[0]);
  const modelStage = !!node && ["agent", "review", "clarify"].includes(node.type);
  const active = !!node && activeStates.includes(node.execution);
  const automated = snapshot.automationRuns?.some((value) => value.workflowRunId === latest?.id && value.state === "active") || snapshot.repairCycles?.some((value) => value.workflowRunId === latest?.id && value.state === "active");
  const clarification = snapshot.clarifications.find((session) => session.nodeRunId === node?.id && session.state === "waiting_answers");
  const completed = nodes.filter((node2) => getStepStatus(node2, latest?.definition.nodes.find((definition2) => definition2.id === node2.nodeId)).effectivelyPassed).length;
  (0, import_react4.useEffect)(() => {
    setOverride("");
  }, [node?.id, backend]);
  (0, import_react4.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-section-heading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: t("\u5DE5\u7A0B\u6D41\u7A0B") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { children: [
          completed,
          " / ",
          nodes.length,
          " ",
          t("\u4E2A\u6B65\u9AA4\u5DF2\u901A\u8FC7")
        ] })
      ] }),
      latest ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", "aria-expanded": showStages, onClick: () => setShowStages((value) => !value), children: [
        showStages ? t("\u6536\u8D77\u6B65\u9AA4") : t("\u5207\u6362\u6B65\u9AA4"),
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { "aria-hidden": "true", children: showStages ? "\u25B4" : "\u25BE" })
      ] }) : snapshot.workflows[0] && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "sf-primary", disabled, onClick: () => run("createRun", void 0, { workflowId: snapshot.workflows[0].id }), children: t("\u5EFA\u7ACB\u6D41\u7A0B") })
    ] }),
    showStages && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "sf-stages", "aria-label": t("\u6D41\u7A0B\u6B65\u9AA4"), children: nodes.map((stage, index) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", className: stage.id === node?.id ? "sf-stage sf-selected" : "sf-stage", "aria-pressed": stage.id === node?.id, onClick: () => {
      setChosen(stage.id);
      setShowStages(false);
    }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "sf-stage-number", children: String(index + 1).padStart(2, "0") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { children: workflowText(stage.name) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("small", { children: [
          getStepStatus(stage, latest?.definition.nodes.find((definition2) => definition2.id === stage.nodeId)).gate.value,
          " \xB7 ",
          getStepStatus(stage, latest?.definition.nodes.find((definition2) => definition2.id === stage.nodeId)).acceptance.value
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Badge, { value: stage.execution })
    ] }, stage.id)) }),
    node && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "sf-card sf-stage-detail", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-section-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: workflowText(node.name) }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Badge, { value: node.freshness === "stale" ? "stale" : node.execution })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dl", { className: "sf-facts", children: Object.values(getStepStatus(node, definition)).filter((value) => typeof value !== "boolean").map((fact) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dt", { children: fact.label }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dd", { children: fact.value })
      ] }, fact.label)) }),
      modelStage && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "sf-field", children: [
        t("\u8FDE\u63A5\u4E0E\u6A21\u578B"),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("select", { "aria-label": t("\u8FDE\u63A5\u4E0E\u6A21\u578B"), value: selected ? targetKey(selected) : "", disabled: disabled || active, onChange: (event) => setOverride(event.target.value), children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "", disabled: true, children: t("\u5728 DSH \u4E2D\u914D\u7F6E\u6A21\u578B\u540E\u5237\u65B0") }),
          configured && configured.backend === backend && !targets.some((target) => targetKey(target) === targetKey(configured)) && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("option", { value: targetKey(configured), children: [
            configured.connectionSlug,
            " / ",
            configured.model
          ] }),
          targets.map((target) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("option", { value: targetKey(target), children: [
            target.connectionSlug,
            " / ",
            target.model
          ] }, targetKey(target)))
        ] })
      ] }),
      node.error && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-inline-error", children: t(node.error) }),
      (checked?.reasons.length || node.blockers.length) > 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("ul", { className: "sf-blockers", children: [.../* @__PURE__ */ new Set([...checked?.reasons ?? [], ...node.blockers])].map((reason) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("li", { children: reason }, reason)) }),
      modelStage && !selected && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-hint", children: t("\u8BF7\u5148\u5728 DSH \u914D\u7F6E\u53EF\u7528\u6A21\u578B\uFF0C\u518D\u5237\u65B0\u5DE5\u7A0B\u72B6\u6001\u3002") }),
      automated && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-hint", children: t("\u81EA\u52A8\u5316\u6B63\u5728\u7BA1\u7406\u6B64\u6D41\u7A0B\uFF0C\u8BF7\u5148\u505C\u6B62\u81EA\u52A8\u63A8\u8FDB\u6216\u4FEE\u8BA2\u518D\u624B\u52A8\u6D3E\u53D1\u3002") }),
      editingRequirements && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-hint", children: t("\u9700\u6C42\u6B63\u6587\u6709\u672A\u4FDD\u5B58\u7684\u7F16\u8F91\uFF0C\u8BF7\u5148\u4FDD\u5B58\u6216\u53D6\u6D88\uFF0C\u518D\u542F\u52A8\u6B65\u9AA4\u3002") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "sf-actions", children: active && node.type === "verify" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "sf-stop", disabled: disabled || !!node.verificationStopRequestedAt, onClick: () => run("stopVerification", node.id), children: node.verificationStopRequestedAt ? t("\u6B63\u5728\u8BF7\u6C42\u505C\u6B62") : t("\u505C\u6B62\u9A8C\u8BC1\u547D\u4EE4") }) : active && node.currentAttemptId ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "sf-stop", disabled, onClick: () => run("stopAttempt", node.currentAttemptId), children: t("\u505C\u6B62\u5F53\u524D\u5C1D\u8BD5") }) : node.type === "human" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "sf-primary", onClick: onCode, children: t("\u6838\u5BF9\u4EE3\u7801\u5E76\u9A8C\u6536") }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "sf-primary", disabled: disabled || automated || editingRequirements || !checked?.ready || modelStage && !selected || !!clarification || latest?.state !== "active", onClick: () => run("startNode", node.id, { expectedRevision: node.revision, ...selected && modelStage ? { target: selected } : {} }), children: node.execution === "pending" ? t("\u542F\u52A8\u6B64\u6B65\u9AA4") : t("\u91CD\u65B0\u6267\u884C") }) })
    ] }),
    node?.verificationUnconfirmed && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(VerificationRecovery, { compact: true, disabled, onConfirm: (reason) => run("confirmNodeVerificationStopped", node.id, { expectedRevision: node.revision, reason }) }),
    latest && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(AutomationControls, { compact: true, workflowRun: latest, node, definition, repairs: snapshot.repairCycles, automations: snapshot.automationRuns, disabled, startBlocked: editingRequirements, onCommand: run }),
    clarification && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Clarification, { session: clarification, draft: snapshot.clarificationDrafts.find((draft) => draft.sessionId === clarification.id), command, disabled, onEditingChange: (value) => onDraftChange("clarification", value) }, clarification.id),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ProjectSettings, { project: snapshot.project, targets, command, disabled, onEditingChange: (value) => onDraftChange("settings", value) }, snapshot.project.id),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Requirements, { snapshot, command, disabled, onEditingChange: (value) => {
      setEditingRequirements(value);
      onRequirementsEditingChange(value);
    } })
  ] });
}
function RequirementDocuments({ documents }) {
  if (!documents.length) return null;
  const sourceNames = { upload: t("\u4E0A\u4F20\u8D44\u6599"), repository: t("\u4ED3\u5E93\u8D44\u6599"), pasted: t("\u7C98\u8D34\u8D44\u6599") };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-requirement-documents", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("h4", { children: [
      t("\u5DF2\u6709\u9700\u6C42\u8D44\u6599 \xB7"),
      " ",
      documents.length,
      " ",
      t("\u4EFD")
    ] }),
    documents.map((document2) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("details", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("summary", { children: [
        document2.name,
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: sourceNames[document2.source] })
      ] }),
      document2.repositoryPath && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("code", { className: "sf-path", children: document2.repositoryPath }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("pre", { children: document2.content })
    ] }, document2.id))
  ] });
}
function Requirements({ snapshot, command, disabled, onEditingChange }) {
  const current = snapshot.requirements.current;
  const [draft, setDraft] = (0, import_react4.useState)();
  const [saving, setSaving] = (0, import_react4.useState)(false), [error, setError] = (0, import_react4.useState)("");
  const prefix = (0, import_react4.useId)();
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
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("details", { className: "sf-details sf-requirements", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("summary", { children: t("\u539F\u59CB\u9700\u6C42\u4E0E\u5DE5\u4F5C\u533A") }),
    draft ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("form", { className: "sf-editor", onSubmit: save, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-section-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: t("\u7F16\u8F91\u9700\u6C42\u6B63\u6587") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "sf-editor-version", children: [
          t("\u57FA\u4E8E"),
          " ",
          short(draft.expectedRevisionId)
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-hint", children: t("\u4FDD\u5B58\u4F1A\u521B\u5EFA\u65B0\u7684\u9700\u6C42\u4FEE\u8BA2\uFF0C\u5DF2\u6709\u8D44\u6599\u4F1A\u4E00\u5E76\u4FDD\u7559\uFF1B\u53D7\u5F71\u54CD\u7684\u6B65\u9AA4\u9700\u8981\u91CD\u65B0\u5206\u6790\u6216\u590D\u6838\u3002") }),
      (conflict || error) && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-editor-conflict", role: "alert", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: conflict ? t("\u9700\u6C42\u5DF2\u6709\u65B0\u4FEE\u8BA2\u3002\u4F60\u7684\u6B63\u6587\u8349\u7A3F\u548C\u8D44\u6599\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u5148\u6BD4\u8F83\u6700\u65B0\u9700\u6C42\u3002") : t(error) }),
        conflict && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("summary", { children: t("\u67E5\u770B\u6700\u65B0\u9700\u6C42") }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-preserve", children: current.request }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(RequirementDocuments, { documents: current.documents })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", disabled: saving, onClick: () => {
            setDraft((value) => value && { ...value, expectedRevisionId: current.id, documents: current.documents.map((document2) => ({ ...document2 })) });
            setError("");
          }, children: t("\u4EE5\u6700\u65B0\u4FEE\u8BA2\u7EE7\u7EED\u7F16\u8F91") }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-hint", children: t("\u4FDD\u7559\u4F60\u7684\u6B63\u6587\u8349\u7A3F\uFF0C\u5E76\u91C7\u7528\u6700\u65B0\u4FEE\u8BA2\u4E2D\u7684\u9700\u6C42\u8D44\u6599\u3002") })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "sf-field", htmlFor: `${prefix}-request`, children: [
        t("\u9700\u6C42\u6B63\u6587"),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("textarea", { id: `${prefix}-request`, "aria-label": t("\u9700\u6C42\u6B63\u6587"), rows: 10, maxLength: 2e6, value: draft.request, disabled: saving, onChange: (event) => setDraft((value) => value && { ...value, request: event.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(RequirementDocuments, { documents: draft.documents }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", disabled: saving, onClick: close, children: t("\u53D6\u6D88\u7F16\u8F91\u9700\u6C42") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "sf-primary", disabled: disabled || saving || conflict || !draft.request.trim() && !draft.documents.length, children: saving ? t("\u6B63\u5728\u4FDD\u5B58\u2026") : t("\u4FDD\u5B58\u9700\u6C42") })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-requirement-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "sf-editor-version", children: [
          t("\u9700\u6C42\u4FEE\u8BA2"),
          " ",
          short(current.id)
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", disabled: disabled || snapshot.item.status === "accepted", onClick: () => {
          setDraft({ expectedRevisionId: current.id, request: current.request, documents: current.documents.map((document2) => ({ ...document2 })) });
          setError("");
          onEditingChange(true);
        }, children: t("\u7F16\u8F91\u9700\u6C42") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-preserve", children: current.request || t("\u5C1A\u672A\u586B\u5199\u9700\u6C42\u8BF4\u660E\u3002") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(RequirementDocuments, { documents: current.documents })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("code", { className: "sf-path", children: snapshot.item.workspace })
  ] });
}
function Clarification({ session, draft, command, disabled, onEditingChange }) {
  const [answers, setAnswers] = (0, import_react4.useState)(() => ({ ...draft?.answers }));
  const [savedAnswers, setSavedAnswers] = (0, import_react4.useState)(answers);
  const reportEditing = (0, import_react4.useRef)(onEditingChange);
  reportEditing.current = onEditingChange;
  const prefix = (0, import_react4.useId)();
  const questions = session.questions.filter((question) => !question.answer);
  const dirty = questions.some((question) => (answers[question.id] ?? "") !== (savedAnswers[question.id] ?? ""));
  (0, import_react4.useEffect)(() => {
    reportEditing.current?.(dirty);
  }, [dirty]);
  (0, import_react4.useEffect)(() => () => {
    reportEditing.current?.(false);
  }, []);
  const submit = async (event) => {
    event.preventDefault();
    try {
      await command("answerClarification", session.id, { expectedRevision: session.revision, answers: questions.map((question) => ({ questionId: question.id, answer: answers[question.id]?.trim() })) });
      setSavedAnswers({ ...answers });
    } catch {
    }
  };
  const saveDraft = async () => {
    try {
      await command("saveClarificationDraft", session.id, { expectedRevision: draft?.revision ?? 0, answers });
      setSavedAnswers({ ...answers });
    } catch {
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("form", { className: "sf-card sf-clarification", onSubmit: submit, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "sf-eyebrow", children: t("\u9700\u8981\u4F60\u7684\u51B3\u5B9A") }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: t("\u8865\u5168\u9700\u6C42\u4E2D\u7684\u5173\u952E\u95EE\u9898") }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-hint", children: t("\u56DE\u7B54\u4F1A\u5199\u5165\u5F53\u524D\u89C4\u683C\uFF0C\u968F\u540E\u7EE7\u7EED\u6F84\u6E05\u3002\u6682\u65F6\u79BB\u5F00\u524D\u53EF\u4EE5\u4FDD\u5B58\u8349\u7A3F\u3002") }),
    questions.map((question, index) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-question", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { htmlFor: `${prefix}-${index}`, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: String(index + 1).padStart(2, "0") }),
        question.question
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: question.reason }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "sf-options", children: question.options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", "aria-pressed": answers[question.id] === option, disabled, onClick: () => setAnswers((value) => ({ ...value, [question.id]: option })), children: option }, option)) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("textarea", { id: `${prefix}-${index}`, rows: 3, required: true, maxLength: 4e3, disabled, value: answers[question.id] ?? "", onChange: (event) => setAnswers((value) => ({ ...value, [question.id]: event.target.value })) })
    ] }, question.id)),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-actions", children: [
      dirty && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", disabled, onClick: () => setAnswers({ ...savedAnswers }), children: t("\u6062\u590D\u5DF2\u4FDD\u5B58\u56DE\u7B54") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", disabled, onClick: () => {
        void saveDraft();
      }, children: t("\u4FDD\u5B58\u8349\u7A3F") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "sf-primary", disabled: disabled || questions.some((question) => !answers[question.id]?.trim()), children: t("\u63D0\u4EA4\u56DE\u7B54\u5E76\u7EE7\u7EED") })
    ] })
  ] });
}
function ProjectSettings({ project, targets, command, disabled, onEditingChange }) {
  const test = project.commands.find((command2) => command2.id === "test") ?? project.commands[0];
  const [rules, setRules] = (0, import_react4.useState)(project.rules), [executable, setExecutable] = (0, import_react4.useState)(test?.executable ?? "node");
  const [args, setArgs] = (0, import_react4.useState)(JSON.stringify(test?.args ?? ["--test"])), [revision, setRevision] = (0, import_react4.useState)(project.revision), [error, setError] = (0, import_react4.useState)("");
  const [defaults, setDefaults] = (0, import_react4.useState)(project.defaults);
  const fingerprint = (rules2, executable2, args2, defaults2) => JSON.stringify([rules2, executable2, args2, ...["analyst", "architect", "developer", "reviewer"].map((role) => defaults2[role] ? targetKey(defaults2[role]) : "")]);
  const [baseline, setBaseline] = (0, import_react4.useState)(() => fingerprint(project.rules, test?.executable ?? "node", JSON.stringify(test?.args ?? ["--test"]), project.defaults));
  const dirty = fingerprint(rules, executable, args, defaults) !== baseline;
  const reportEditing = (0, import_react4.useRef)(onEditingChange);
  reportEditing.current = onEditingChange;
  (0, import_react4.useEffect)(() => {
    reportEditing.current?.(dirty);
  }, [dirty]);
  (0, import_react4.useEffect)(() => () => {
    reportEditing.current?.(false);
  }, []);
  const restore = (value) => {
    const test2 = value.commands.find((command2) => command2.id === "test") ?? value.commands[0];
    const executable2 = test2?.executable ?? "node", args2 = JSON.stringify(test2?.args ?? ["--test"]);
    setRules(value.rules);
    setExecutable(executable2);
    setArgs(args2);
    setDefaults(value.defaults);
    setRevision(value.revision);
    setError("");
    setBaseline(fingerprint(value.rules, executable2, args2, value.defaults));
  };
  (0, import_react4.useEffect)(() => {
    if (!dirty && project.revision !== revision) restore(project);
  }, [project.revision]);
  const prefix = (0, import_react4.useId)();
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
      restore(updated);
    } catch {
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("details", { className: "sf-details", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("summary", { children: t("\u5DE5\u7A0B\u914D\u7F6E\u4E0E\u9A8C\u8BC1\u547D\u4EE4") }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("form", { className: "sf-settings-form", onSubmit: submit, children: [
      [["analyst", t("\u5206\u6790")], ["architect", t("\u8BBE\u8BA1")], ["developer", t("\u5F00\u53D1")], ["reviewer", t("\u590D\u6838")]].map(([role, label]) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "sf-field", htmlFor: `${prefix}-${role}`, children: [
        label,
        " ",
        t("\u9ED8\u8BA4\u6A21\u578B"),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("select", { id: `${prefix}-${role}`, value: defaults[role] ? targetKey(defaults[role]) : "", disabled, onChange: (event) => {
          const target = targets.find((target2) => targetKey(target2) === event.target.value);
          setDefaults((value) => {
            const next = { ...value };
            if (target) next[role] = target;
            else delete next[role];
            return next;
          });
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "", children: t("\u6BCF\u6B21\u542F\u52A8\u65F6\u9009\u62E9") }),
          targets.map((target) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("option", { value: targetKey(target), children: [
            target.connectionSlug,
            " / ",
            target.model
          ] }, targetKey(target)))
        ] })
      ] }, role)),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "sf-field", htmlFor: `${prefix}-rules`, children: [
        t("\u5DE5\u7A0B\u89C4\u5219"),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("textarea", { id: `${prefix}-rules`, rows: 4, value: rules, onChange: (event) => setRules(event.target.value), disabled })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "sf-field", htmlFor: `${prefix}-executable`, children: [
        t("\u9A8C\u8BC1\u547D\u4EE4"),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { id: `${prefix}-executable`, value: executable, onChange: (event) => setExecutable(event.target.value), required: true, disabled, placeholder: "npm" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "sf-field", htmlFor: `${prefix}-args`, children: [
        t("\u547D\u4EE4\u53C2\u6570\uFF08JSON \u6570\u7EC4\uFF09"),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { id: `${prefix}-args`, value: args, onChange: (event) => setArgs(event.target.value), disabled, placeholder: '["run", "test"]' })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-hint", children: t('\u9A8C\u8BC1\u5728\u5DE5\u4F5C\u9879\u7684\u72EC\u7ACB\u5DE5\u4F5C\u533A\u4E2D\u6267\u884C\u3002npm \u9879\u76EE\u53EF\u4F7F\u7528 npm \u4E0E ["run", "test"]\u3002') }),
      error && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-inline-error", children: t(error) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-actions", children: [
        dirty && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", disabled, onClick: () => restore(project), children: t("\u53D6\u6D88\u914D\u7F6E\u4FEE\u6539") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "submit", disabled: disabled || !executable.trim(), children: t("\u4FDD\u5B58\u5DE5\u7A0B\u914D\u7F6E") })
      ] })
    ] })
  ] });
}
function Documents({ snapshot, read, run, command, disabled, visible, onEditingChange }) {
  const [chosen, setChosen] = (0, import_react4.useState)(""), [mode, setMode] = (0, import_react4.useState)("reading");
  const artifact = snapshot.artifacts.find((artifact2) => artifact2.id === chosen) ?? snapshot.artifacts[0];
  const revision = snapshot.revisions.find((revision2) => revision2.id === artifact?.currentRevisionId);
  const [reading, setReading] = (0, import_react4.useState)(), [error, setError] = (0, import_react4.useState)("");
  const [draft, setDraft] = (0, import_react4.useState)();
  const [saving, setSaving] = (0, import_react4.useState)(false), [saveError, setSaveError] = (0, import_react4.useState)(""), [savedRevisionId, setSavedRevisionId] = (0, import_react4.useState)("");
  const [savedArtifactBaseline, setSavedArtifactBaseline] = (0, import_react4.useState)(0);
  const editorId = (0, import_react4.useId)();
  (0, import_react4.useEffect)(() => {
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
  if (!artifact || !revision) return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Empty, { title: t("\u4EA7\u7269\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC"), children: t("\u5B8C\u6210\u9700\u6C42\u89C4\u683C\u3001\u5DE5\u7A0B\u8BBE\u8BA1\u6216\u4EFB\u52A1\u62C6\u89E3\u540E\uFF0C\u53EF\u9605\u8BFB\u5B8C\u6574\u6587\u6863\u5E76\u4EBA\u5DE5\u63A5\u7EB3\u3002") });
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
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "sf-field", children: [
      t("\u5DE5\u7A0B\u6587\u6863"),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("select", { "aria-label": t("\u5DE5\u7A0B\u6587\u6863"), value: artifact.id, disabled: !!draft || saving || awaitingRevision, onChange: (event) => {
        setChosen(event.target.value);
        setSavedRevisionId("");
      }, children: snapshot.artifacts.map((artifact2) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: artifact2.id, children: logicalLabels[artifact2.logicalId] ?? artifact2.logicalId }, artifact2.id)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-document-heading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Badge, { value: accepted ? "accepted" : "candidate" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { children: [
        t("\u4FEE\u8BA2"),
        " ",
        short(revision.id)
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: revision.reviewed ? t("\u5DF2\u72EC\u7ACB\u590D\u6838") : t("\u5F85\u72EC\u7ACB\u590D\u6838") }),
      !draft && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", disabled: disabled || saving || awaitingRevision, onClick: () => {
        setDraft({ artifactId: artifact.id, expectedRevision: artifact.revision, sourceRevisionId: revision.id, content: revision.content });
        setSaveError("");
        onEditingChange(true);
      }, children: t("\u7F16\u8F91\u6587\u6863") })
    ] }),
    awaitingRevision && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-hint", role: "status", children: t("\u65B0\u5019\u9009\u6587\u6863\u5DF2\u4FDD\u5B58\uFF0C\u6B63\u5728\u540C\u6B65\u3002\u5B8C\u6210\u72EC\u7ACB\u590D\u6838\u540E\u624D\u80FD\u63A5\u7EB3\u3002") }),
    draft ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("form", { className: "sf-editor sf-document-editor", onSubmit: save, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-section-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: t("\u7F16\u8F91\u5B8C\u6574\u6267\u884C\u6587\u6863") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: "sf-editor-version", children: [
          t("\u57FA\u4E8E"),
          " ",
          short(draft.sourceRevisionId)
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-hint", children: t("\u4EBA\u5DE5\u4FEE\u6539\u4F1A\u751F\u6210\u65B0\u7684\u5019\u9009\u4FEE\u8BA2\uFF0C\u9700\u8981\u91CD\u65B0\u72EC\u7ACB\u590D\u6838\u4E0E\u63A5\u7EB3\u3002") }),
      (conflict || saveError) && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-editor-conflict", role: "alert", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: conflict ? t("\u6587\u6863\u5DF2\u6709\u65B0\u4FEE\u8BA2\u3002\u4F60\u7684\u7F16\u8F91\u8349\u7A3F\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u5148\u6BD4\u8F83\u6700\u65B0\u6587\u6863\u3002") : t(saveError) }),
        conflict && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("details", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("summary", { children: t("\u67E5\u770B\u6700\u65B0\u6587\u6863") }),
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("pre", { children: revision.content })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", disabled: saving, onClick: () => {
            setDraft((value) => value && { ...value, expectedRevision: artifact.revision, sourceRevisionId: revision.id });
            setSaveError("");
          }, children: t("\u4EE5\u6700\u65B0\u4FEE\u8BA2\u7EE7\u7EED\u7F16\u8F91") }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-hint", children: t("\u4FDD\u7559\u4F60\u7684\u6B63\u6587\u8349\u7A3F\uFF0C\u5C06\u6700\u65B0\u6587\u6863\u8BBE\u4E3A\u4FDD\u5B58\u57FA\u7EBF\u3002") })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "sf-field", htmlFor: editorId, children: [
        t("\u6587\u6863 Markdown \u6B63\u6587"),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("textarea", { id: editorId, "aria-label": t("\u6587\u6863 Markdown \u6B63\u6587"), rows: 18, maxLength: 2e6, value: draft.content, disabled: saving, onChange: (event) => setDraft((value) => value && { ...value, content: event.target.value }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", disabled: saving, onClick: () => {
          setDraft(void 0);
          setSaveError("");
          onEditingChange(false);
        }, children: t("\u53D6\u6D88\u7F16\u8F91\u6587\u6863") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "sf-primary", disabled: disabled || saving || conflict || !draft.content.trim(), children: saving ? t("\u6B63\u5728\u4FDD\u5B58\u2026") : t("\u4FDD\u5B58\u65B0\u5019\u9009") })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-segmented", "aria-label": t("\u6587\u6863\u9605\u8BFB\u65B9\u5F0F"), children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", "aria-pressed": mode === "reading", onClick: () => setMode("reading"), children: t("\u9605\u8BFB\u7B80\u62A5") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", "aria-pressed": mode === "source", onClick: () => setMode("source"), children: t("\u5B8C\u6574\u6267\u884C\u6587\u6863") })
      ] }),
      error && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-inline-error", children: t(error) }),
      mode === "source" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "sf-document", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(MarkdownView, { content: revision.content, idPrefix: `specflow-${revision.id}` }) }) : reading ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("article", { className: "sf-reading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "sf-eyebrow", children: reading.mode === "authored" ? t("\u4EBA\u7C7B\u9605\u8BFB\u7B80\u62A5") : t("\u539F\u6587\u6458\u5F55") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: reading.brief.title }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-reading-summary", children: reading.brief.summary }),
        reading.brief.sections.map((section, index) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("h4", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: String(index + 1).padStart(2, "0") }),
            section.title
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("ul", { children: section.items.map((item, index2) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("li", { children: item }, index2)) })
        ] }, index)),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-hint", children: t("\u63A5\u7EB3\u4EE5\u5B8C\u6574\u6267\u884C\u6587\u6863\u4E3A\u51C6\uFF1B\u672C\u7B80\u62A5\u4E0E\u4FEE\u8BA2 {0} \u5BF9\u5E94\u3002", { 0: short(reading.sourceRevisionId) }) })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-loading", children: t("\u6B63\u5728\u751F\u6210\u9605\u8BFB\u89C6\u56FE\u2026") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-accept-bar", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { children: accepted ? t("\u5F53\u524D\u6587\u6863\u5DF2\u63A5\u7EB3") : revision.reviewed ? t("\u590D\u6838\u5DF2\u5B8C\u6210\uFF0C\u53EF\u6838\u5BF9\u5E76\u63A5\u7EB3") : t("\u5B8C\u6210\u72EC\u7ACB\u590D\u6838\u540E\u624D\u80FD\u63A5\u7EB3") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "sf-primary", disabled: disabled || awaitingRevision || accepted || !revision.reviewed, onClick: () => run("acceptArtifact", artifact.id, { expectedRevision: artifact.revision, reason: t("\u5728 DSH Specflow \u9762\u677F\u4E2D\u6838\u5BF9\u5E76\u63A5\u7EB3") }), children: accepted ? t("\u5DF2\u63A5\u7EB3") : t("\u63A5\u7EB3\u6B64\u4FEE\u8BA2") })
      ] })
    ] }),
    snapshot.findings.filter((finding) => finding.status === "open" && finding.targetLogicalId === artifact.logicalId).map((finding) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-finding", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Badge, { value: "blocked", children: finding.severity === "blocker" ? t("\u963B\u65AD\u9879") : t("\u590D\u6838\u5EFA\u8BAE") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: finding.body }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("code", { children: finding.location })
    ] }, finding.id))
  ] });
}
function Code({ snapshot, read, run, disabled, visible }) {
  const candidate = snapshot.candidates.at(-1);
  const [diff, setDiff] = (0, import_react4.useState)(), [precheck, setPrecheck] = (0, import_react4.useState)(), [error, setError] = (0, import_react4.useState)("");
  const [acknowledged, setAcknowledged] = (0, import_react4.useState)(false);
  const key = `${candidate?.id}:${candidate?.revision}:${snapshot.evidence.map((evidence) => evidence.revision).join(",")}:${snapshot.findings.map((finding) => finding.revision).join(",")}`;
  (0, import_react4.useEffect)(() => {
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
  if (!candidate) return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Empty, { title: t("\u7B49\u5F85\u4EE3\u7801\u5019\u9009"), children: t("\u5B9E\u73B0\u9636\u6BB5\u4F1A\u5728\u72EC\u7ACB\u5DE5\u4F5C\u533A\u4E2D\u4FEE\u6539\u4EE3\u7801\uFF0C\u9A8C\u8BC1\u4E0E\u590D\u6838\u8BB0\u5F55\u4F1A\u4FDD\u5B58\u5728\u8FD9\u91CC\u3002") });
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-section-heading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: t("\u4EE3\u7801\u5019\u9009") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Badge, { value: candidate.status })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("dl", { className: "sf-facts", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dt", { children: t("\u57FA\u7EBF") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("code", { children: short(candidate.baseCommit) }) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dt", { children: t("\u5019\u9009") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("code", { children: short(candidate.checkpointCommit) }) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("code", { className: "sf-path", children: candidate.workspace }),
    error && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-inline-error", children: t(error) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("details", { open: true, className: "sf-details", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("summary", { children: t("\u4EE3\u7801\u5DEE\u5F02") }),
      diff?.candidateId === candidate.id ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("pre", { className: "sf-diff", children: diff.text || t("\u5F53\u524D\u5019\u9009\u6CA1\u6709\u6587\u672C\u5DEE\u5F02\u3002") }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-loading", children: t("\u6B63\u5728\u8BFB\u53D6\u4EE3\u7801\u5DEE\u5F02\u2026") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h4", { className: "sf-subheading", children: t("\u9A8C\u8BC1\u8BC1\u636E") }),
    snapshot.evidence.filter((evidence) => evidence.candidateId === candidate.id).map((evidence) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("details", { className: "sf-evidence", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("summary", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Badge, { value: evidence.status }),
        evidence.command.id,
        evidence.stale && ` \xB7 ${t("\u5DF2\u8FC7\u671F")}`
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("pre", { children: [evidence.stdout, evidence.stderr].filter(Boolean).join("\n") || t("\u9000\u51FA\u7801 {0}", { "0": evidence.exitCode }) })
    ] }, evidence.id)),
    precheck?.blockers.length ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("ul", { className: "sf-blockers", children: precheck.blockers.map((blocker) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("li", { children: blocker.message }, blocker.code)) }) : null,
    candidate.status !== "accepted" && /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "sf-checkbox", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("input", { type: "checkbox", checked: acknowledged, onChange: (event) => setAcknowledged(event.target.checked), disabled: !diff || disabled }),
        t("\u6211\u5DF2\u6838\u5BF9\u4EE3\u7801\u5DEE\u5F02\u4E0E\u9A8C\u8BC1\u8BC1\u636E\uFF0C\u786E\u8BA4\u5C06\u5019\u9009\u6574\u5408\u5230\u5DE5\u7A0B")
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", disabled, onClick: () => run("verifyCandidate", candidate.id), children: t("\u8FD0\u884C\u9A8C\u8BC1") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "sf-primary", disabled: disabled || !precheck?.ready || !acknowledged || !diff, onClick: () => run("acceptCode", candidate.id), children: t("\u63A5\u7EB3\u4EE3\u7801") })
      ] })
    ] })
  ] });
}
function Runs({ snapshot, bootstrap, read, run, disabled, visible }) {
  const [chosen, setChosen] = (0, import_react4.useState)(""), [detail, setDetail] = (0, import_react4.useState)(), [error, setError] = (0, import_react4.useState)("");
  const attempt = snapshot.attempts.find((attempt2) => attempt2.id === chosen) ?? snapshot.attempts.at(-1);
  (0, import_react4.useEffect)(() => {
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
  if (!attempt) return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Empty, { title: t("\u8FD0\u884C\u8BB0\u5F55\u4ECE\u9996\u6B21\u6D3E\u53D1\u5F00\u59CB"), children: t("\u6BCF\u6B21\u5C1D\u8BD5\u4FDD\u7559\u539F\u59CB\u6A21\u578B\u3001\u6267\u884C\u5E95\u5EA7\u3001\u7ED3\u679C\u548C\u9519\u8BEF\uFF0C\u65B9\u4FBF\u5B9A\u4F4D\u95EE\u9898\u3002") });
  const binding = snapshot.bindings.filter((binding2) => binding2.attemptId === attempt.id).at(-1);
  const canResume = !!bootstrap.catalog.backends.find((backend) => backend.id === attempt.target.backend)?.capabilities.canResume;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("label", { className: "sf-field", children: [
      t("\u6267\u884C\u5C1D\u8BD5"),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("select", { value: attempt.id, onChange: (event) => setChosen(event.target.value), children: [...snapshot.attempts].reverse().map((attempt2) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("option", { value: attempt2.id, children: [
        workflowText(snapshot.nodes.find((node) => node.id === attempt2.nodeRunId)?.name || ""),
        " \xB7 #",
        attempt2.number,
        " \xB7 ",
        labels[attempt2.execution]
      ] }, attempt2.id)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "sf-card", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-section-heading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("h3", { children: [
          t("\u5C1D\u8BD5 #"),
          attempt.number
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Badge, { value: attempt.execution })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("dl", { className: "sf-run-facts", children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dt", { children: t("\u6267\u884C\u5E95\u5EA7") }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dd", { children: attempt.target.backend })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dt", { children: t("\u8FDE\u63A5 / \u6A21\u578B") }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("dd", { children: [
            attempt.target.connectionSlug,
            " / ",
            attempt.target.model
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dt", { children: t("\u542F\u52A8\u65F6\u95F4") }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dd", { children: time(attempt.startedAt) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dt", { children: t("\u7ED3\u675F\u65F6\u95F4") }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dd", { children: time(attempt.finishedAt) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dt", { children: t("\u6267\u884C\u4F1A\u8BDD") }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("code", { children: binding?.ref.sessionId ?? t("\u5C1A\u672A\u7ED1\u5B9A") }) })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ExecutionFacts, { attempt: detail || attempt, compact: true }),
      detail?.id === attempt.id && detail.verificationPending && detail.verificationLive === false && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(VerificationRecovery, { compact: true, disabled, onConfirm: (reason) => run("confirmVerificationStopped", attempt.id, { expectedRevision: (detail || attempt).revision, reason }) }),
      (detail?.error || detail?.controlError || attempt.error || attempt.controlError || error) && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-inline-error", children: t(detail?.error || detail?.controlError || attempt.error || attempt.controlError || error) }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-actions", children: [
        activeStates.includes(attempt.execution) && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", className: "sf-stop", disabled, onClick: () => run("stopAttempt", attempt.id), children: t("\u505C\u6B62") }),
        attempt.execution === "reconciling" && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", disabled, onClick: () => run("reconcileAttempt", attempt.id), children: t("\u6838\u5BF9\u6267\u884C\u7ED3\u679C") }),
        canResume && ["failed", "cancelled"].includes(attempt.execution) && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", disabled, onClick: () => run("resumeAttempt", attempt.id), children: t("\u5C1D\u8BD5\u6062\u590D\u539F\u6267\u884C") })
      ] }),
      !canResume && ["failed", "cancelled"].includes(attempt.execution) && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "sf-hint", children: t("\u539F\u6267\u884C\u4E0D\u652F\u6301\u6062\u590D\u3002\u6838\u5BF9\u7ED3\u679C\u540E\uFF0C\u53EF\u5728\u6D41\u7A0B\u4E2D\u91CD\u65B0\u6267\u884C\u6B64\u6B65\u9AA4\u3002") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("details", { className: "sf-details", open: true, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("summary", { children: t("\u8FD0\u884C\u8F93\u51FA") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("pre", { children: detail?.output ?? t("\u5F53\u524D\u6CA1\u6709\u5DF2\u6301\u4E45\u5316\u7684\u8F93\u51FA\u3002") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("details", { className: "sf-details", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("summary", { children: t("\u539F\u59CB\u6267\u884C\u63D0\u793A") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("pre", { children: detail?.prompt ?? t("\u6B63\u5728\u8BFB\u53D6\u2026") })
    ] })
  ] });
}
function InteractionCard({ id, request, command, disabled, onEditingChange }) {
  const prefix = (0, import_react4.useId)(), [answer, setAnswer] = (0, import_react4.useState)("");
  const [savedAnswer, setSavedAnswer] = (0, import_react4.useState)("");
  const dirty = answer !== savedAnswer;
  const reportEditing = (0, import_react4.useRef)(onEditingChange);
  reportEditing.current = onEditingChange;
  (0, import_react4.useEffect)(() => {
    reportEditing.current?.(dirty);
  }, [dirty]);
  (0, import_react4.useEffect)(() => () => {
    reportEditing.current?.(false);
  }, []);
  const submit = async (event) => {
    event.preventDefault();
    let value = answer;
    try {
      value = JSON.parse(answer);
    } catch {
    }
    try {
      await command("answerInteraction", id, { answer: value });
      setSavedAnswer(answer);
    } catch {
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("form", { className: "sf-card sf-clarification", onSubmit: submit, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: t("\u8FD0\u884C\u6B63\u5728\u7B49\u5F85\u4F60\u7684\u56DE\u7B54") }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("pre", { children: typeof request === "string" ? request : JSON.stringify(request, null, 2) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("label", { htmlFor: prefix, children: t("\u56DE\u7B54\uFF08\u6587\u672C\u6216 JSON\uFF09") }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("textarea", { id: prefix, rows: 3, value: answer, onChange: (event) => setAnswer(event.target.value), required: true, disabled }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "sf-actions", children: [
      dirty && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", disabled, onClick: () => setAnswer(savedAnswer), children: t("\u53D6\u6D88\u56DE\u7B54\u4FEE\u6539") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { className: "sf-primary", disabled: disabled || !answer.trim(), children: t("\u63D0\u4EA4\u7ED9\u5F53\u524D\u8FD0\u884C") })
    ] })
  ] });
}

return module.exports;
} });
