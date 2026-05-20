
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
pi-coms-net-server             # HTTP/SSE Pi-to-Pi hub
pi-coms --name dev             # networked Pi-to-Pi client
pi-coms-claude --name claude   # networked Claude-backed Pi agent
pi-browser-harness-chrome      # isolated Chrome profile for browser-harness
```

Repo-local equivalents:

```bash
just v
just local-coms --name planner
just coms-net-server
just coms --name dev
just coms-claude --name claude
just browser-harness-chrome
```

## Browser Harness web tool

Start the isolated Chrome profile:

```bash
pi-browser-harness-chrome
```

Then in another terminal:

```bash
source .env
browser-harness --doctor
browser-harness <<'PY'
new_tab("https://example.com")
wait_for_load()
print(page_info())
PY
```

## Verifier loop

```bash
pi-verifier
```

The builder runs in your terminal. A verifier agent runs in a sibling tmux/window and watches the builder session JSONL. When the verifier finds a failed claim, it sends corrective feedback back into the builder as a follow-up turn.

## What is intentionally not replicated

For safety, the installer does **not** copy secrets or account state:

- `.env` API keys
- Claude Code login/session state
- xAI OAuth tokens
- Telegram bot tokens
- browser cookies/profiles

Fill `.env` and run provider logins per workstation.

## Vespera artwork

The hero image was generated through Hermes/Vespera using this local Vespera reference set:

```text
~/.hermes/vespera-gallery/no-blazer-20260511-031558/
```

Reference direction: no blazer, no suit jacket; black silk high-neck, cinematic/noir, dark hair, hazel direct gaze, command-room operator energy.

Generated repo asset:

```text
images/reese-pi-vespera-hermes-hero-v2.png
```

## Full install docs

See [`INSTALL_WORKSTATION.md`](./INSTALL_WORKSTATION.md) for details, pinned versions, and troubleshooting notes.
