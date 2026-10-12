# Project instructions

Claude Code will review all outputs, including code and plans, after each task is completed.

## Bundled Maka

- Bundle only official Apache Maka releases. Never bundle dev, nightly, snapshot, RC, placeholder or other development builds.
- Temporarily build the bundled runtime from the signed official Apache Maka 0.2.0 source release. Ship only Runtime Host and its production dependencies; keep source, compiler, tests, CLI/Eval and build caches outside the desktop package.
- Pin the release, source checksum and signer fingerprint. Never rename a development package to a release version. Switch to a formal npm package after the user resolves Maka's npm publishing.
- Installation, runtime loading and desktop packaging must enforce the release policy. If a formal release cannot be obtained or adapted, report that limitation and do not fall back to a development build.
- Use Maka as the current execution harness. Defer independent harness selection, switching, registry and additional adapters until the user explicitly resumes that work.
