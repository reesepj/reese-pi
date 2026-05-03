---
description: Prime context for the Pi Verifier Agent — two-process builder/verifier system
---

# Purpose

A two-process Pi system: a Builder Pi spawns a sibling Verifier Pi (in tmux) that observes builder turns and runs read-only verification with a generic verifier persona. This command orients you on the runtime and current build state.

## Workflow

1. Run `git ls-files` to see what's tracked.
2. Read the public doc:
   - `README.md` — install, quick-start, architecture overview, direction matrix, state machine, limitations
3. Read the runtime TypeScript (use the Read tool on each):
   - `apps/verifier/verifiable.ts` — builder side: socket server, lifecycle event forwarding, prompt receipt
   - `apps/verifier/verifier.ts` — verifier side: input lock, socket client, `verifier_prompt` tool, Report parser
   - `apps/verifier/verifiable-footer.ts` — `BuilderInputEditor` (model/ctx/verifier-status in input border)
   - `apps/verifier/_shared/ipc.ts` — envelope union types + JSONL framing
   - `apps/verifier/_shared/launcher.ts` — `$TMUX`-aware spawn + wrapper-script (sidesteps macOS ARG_MAX)
   - `apps/verifier/_shared/frontmatter.ts` — persona parser
   - `apps/verifier/_shared/socket-path.ts` — socket path resolution (macOS 104-byte budget)
   - `apps/verifier/_shared/env.ts` — env var helpers
4. Read the persona contract:
   - `.pi/verifier/agents/verifier.md` — persona (CONFIDENCE ladder, atomic-decomposition)
   - `.pi/verifier/prompts/verify_on_stop.md` — per-cycle user prompt template
5. Read `justfile` for runnable recipes (`verifier`, `clean`, `prime`).
6. Summarize your understanding of the project: purpose, stack, structure, key files, and entry points.
