<p align="center">
  <img src="./images/reese-pi-simple-hero.svg" alt="Reese Pi — agent workstation" width="100%">
</p>

# Reese Pi

A reproducible Pi Agent workstation: verifier loop, Claude Code routing, Pi-to-Pi agent communication, Browser Harness web control, memory/todo/question tools, Telegram integration, and Plannotator — all wired behind one install script.

This repo is designed so a fresh machine can clone once, run one script, and get the same launch commands and project Pi package setup as this workstation.

## One-click install

```bash
git clone https://github.com/reesepj/reese-pi.git
cd reese-pi
bash scripts/install-workstation.sh
```

The installer pins and installs the current package set from this workstation:

- `pi-claude-cli` for Claude Code-backed Pi models
- `pi-xai-oauth` for xAI/Grok OAuth models
- `pi-mcp-adapter`
- `@samfp/pi-memory`
- `@juicesharp/rpiv-ask-user-question`
- `@juicesharp/rpiv-todo`
- `@llblab/pi-telegram`
- `@plannotator/pi-extension`
- Browser Harness from `browser-use/browser-harness`
- local Pi-to-Pi communication extensions from `pi-vs-claude-code`

## Launch commands

After install, these wrappers are symlinked into `~/.local/bin`:

```bash
pi-verifier                    # launch builder + verifier loop
pi-local-coms --name planner   # same-machine Pi-to-Pi agent
pi-hub                         # HTTP/SSE Pi-to-Pi hub
pi-client dev                  # networked Pi-to-Pi client
pi-client-claude claude        # networked Claude-backed Pi agent
pi-browser-harness-chrome      # isolated Chrome profile for browser-harness
```

Repo-local equivalents:

```bash
just v
just local-coms --name planner
just hub
just client dev
just client-claude claude
just browser-harness-chrome
just doctor                    # run workstation health checks
```

## Browser Harness web tool

Start the isolated Chrome profile:

```bash
pi-browser-harness-chrome
```

Then in another terminal:

```bash
source .env
browser-harness --help
browser-harness navigate --url https://example.com --headless
```

## Verifier loop

```bash
pi-verifier
```

The builder runs in your terminal. A verifier agent runs in a sibling tmux/window and watches the builder session JSONL. When the verifier finds a failed claim, it sends corrective feedback back into the builder as a follow-up turn.

## Health checks

```bash
just doctor
just typecheck-all
```

`doctor` checks required CLIs, Pi package registration, extension/script typechecks, verifier typecheck, gbrain MCP wiring, and optional Browser Harness readiness.

## gbrain context + MCP

This repo auto-loads `extensions/gbrain-context.ts`, which adds:

```text
/gbrain-context                 # concise operating brief
/gbrain-context Titan strategy  # query gbrain from Pi
gbrain_context({"mode":"brief"})
gbrain_context({"mode":"query","query":"Titan strategy"})
gbrain_context({"mode":"get","slug":"systems/productivity-cell/active-work-queue"})
```

The project-local `.mcp.json` also exposes `gbrain serve` to Pi through `pi-mcp-adapter` using the proxy `mcp` tool:

```text
mcp({ server: "gbrain" })
mcp({ search: "query" })
mcp({ tool: "gbrain_query", args: '{"question":"..."}' })
```

