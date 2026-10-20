# OpenCode execution adapter

This adapter connects to a user-started `opencode serve` over its local HTTP API.
It does not install, start, bundle, or reconfigure OpenCode, its plugins, or its model
providers. Providers are configured in OpenCode; SpecFlow enumerates the connected
providers through `/provider` and freezes a specific provider/model for each attempt.

The protocol was checked against official OpenCode source tags:

- `v1.19.3`, commit `e3c4eb242585dcd77be1a867391b7c25fd47ce52`.
- `v1.2.27`, commit `4ee426ba549131c4903a71dfb6259200467aca81`.

Official references: [HTTP server](https://opencode.ai/docs/server/),
[SDK](https://opencode.ai/docs/sdk/),
[current inspected source](https://github.com/anomalyco/opencode/tree/e3c4eb242585dcd77be1a867391b7c25fd47ce52).

Each attempt receives a separate session with an explicit directory and persisted
session permission rules. An execution journal records the message ID, frozen-input
digest, session, workspace, dispatch intent, and final result. Dispatch intent is
saved **before** calling `prompt_async`. If the response is lost, SpecFlow can query
that same message after restarting; it never sends the prompt again automatically.
An idle session without a matching completed assistant message remains `unknown`.
The adapter reads complete message text and does not truncate artifact output.

The endpoint accepts only HTTP(S) root URLs on `localhost`, `127.0.0.1`, or `[::1]`.
Requests reject redirects and use a timeout. HTTP Basic Auth is passed in memory;
passwords and raw authorization headers are not journaled. Execution references bind
to the endpoint, local state/configuration source, username, and workspace root. The
service's `/path` data/config identity is also persisted and checked before continued
execution. Every workspace is resolved through `realpath` and must stay inside the
configured SpecFlow workspace root.

Read-only review uses a deny-by-default session rule, allowing the permission names
`read`, `glob`, `grep`, `list`, and `question`; shell, edit/write, subagents, external
directories, and tools with other permission names remain denied. The service must
return the exact requested rules before a prompt is dispatched. This relies on
**trusted user-level OpenCode configuration and tool implementations**. OpenCode
allows a custom tool to replace a built-in name such as `read`, and its HTTP tool
catalog exposes no reliable implementation origin. A same-name replacement or a
user-installed plugin can execute code outside these tool permissions. SpecFlow's
permission rules are not an operating-system sandbox and cannot prove arbitrary
user-level plugins are read-only. Engineering review also checks `treeHash` and
blocks acceptance if the reviewed working tree changes; that detects a write but
does not prevent its side effects.

Project configuration is treated as untrusted repository content. Before **every
directory-scoped HTTP request**, including the initial `/path` identity check, the
adapter conservatively checks the local execution directory and all ancestors up to
the filesystem root. A repository-controlled `.git` marker cannot hide inherited
configuration from this check. A local `.opencode` entry or
`opencode.json` / `opencode.jsonc` blocks connection with
`OPENCODE_UNTRUSTED_CONFIG`. This includes `.opencode/tool(s)`, `.opencode/plugin(s)`,
configuration-based plugins, and symlinks at these entry points. The check happens
before OpenCode can initialize the instance and execute those extensions. This
release conservatively rejects all local OpenCode configuration, including ordinary
model-only files, rather than trying to prove JSONC, substituted variables, provider
modules, and dependency scripts cannot load code. Move reviewed configuration to
the trusted user-level configuration directory. The documented user-level
`~/.opencode` location is part of the trusted server configuration boundary.

This local check cannot isolate an already-running external server from malicious
global configuration or concurrent changes by another process. Use a trusted
OpenCode server and user-level tool configuration for read-only stages.

Normal execution asks for tool authorization, except the allowed reading/question
tools, and forbids subagents and external-directory access. Permission replies are
always scoped to one request, never saved as permanent/project approvals.

OpenCode has no per-prompt hard step limit in these inspected releases. Its
`agent.steps` setting adds a final-step instruction; that setting does not terminate
the loop. SpecFlow therefore reports `stepLimit: 'observed'`: a background poll counts
assistant step starts and aborts a session observed to exceed `maxSteps`, while
explicit tool approvals have a separate `maxSteps` budget. Reading tools and work
between polls may continue before an abort is observed. This is a monitoring guard,
not a strict execution-step bound. Existing workflow timeouts remain applicable.

Safe execution resumption is unavailable (`canResume: false`). Querying a persisted
session is supported, but the adapter never interprets a new prompt as resuming the
old run. A new execution requires an explicit new attempt. Stopping also requires
matching terminal evidence: an abort receipt and an idle server alone do not prove
that a delayed asynchronous dispatch has ended.

Run the local HTTP protocol contract tests with:

```powershell
node --import tsx --test tests/opencode-adapter.test.ts
```

The tests cover asynchronous dispatch, lost receipts and restart, workspace and
identity checks, complete artifact output, permission/question replies, permission
rules, local-extension rejection before instance activation, cancellation evidence,
step-budget monitoring, HTTP errors, and redirect rejection without calling a cloud
model.
