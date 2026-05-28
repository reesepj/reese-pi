<p align="center">
  <img src="./images/reese-pi-simple-hero.svg" alt="Reese Pi — agent workstation" width="100%">
</p>

# Reese Pi

A reproducible Pi Agent workstation: verifier loop, Claude Code routing, Pi-to-Pi agent communication, Browser Harness web control, memory/todo/question tools, and Telegram integration — all wired behind one install script.

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
- Browser Harness from `browser-use/browser-harness`
- local Pi-to-Pi communication extensions from `pi-vs-claude-code`

## Launch commands

After install, these wrappers are symlinked into `~/.local/bin`:

```bash
pi-lite                        # lean everyday profile
pi-full                        # full default project profile
pi-verifier                    # launch builder + verifier loop
pi-local-coms --name planner   # same-machine Pi-to-Pi agent
pi-hub                         # HTTP/SSE Pi-to-Pi hub
pi-client dev                  # networked Pi-to-Pi client
pi-client-claude claude        # networked Claude-backed Pi agent
pi-seo                         # opt-in SEO-heavy skill profile
pi-browser-harness-chrome      # isolated Chrome profile for browser-harness
```

Repo-local equivalents:

```bash
just lite
just full
just v
just local-coms --name planner
just hub
just client dev
just client-claude claude
just seo
just browser-harness-chrome
just doctor                    # run workstation health checks
```

## Skill profiles

Default launches now use medium thinking and exclude the heavy `~/.claude/skills/seo*` catalog. Plannotator and SEO stay out of the default package/tool set.

Profiles:

```bash
pi-lite   # no skills/prompts/context files; daily tools only
pi-full   # default project setup, minus SEO skills
pi-seo    # opt-in SEO-heavy skill suite
```

Repo-local equivalents:

```bash
just lite
just full
just seo
```

Session hygiene: start a fresh session for unrelated work, and use `/compact` after large implementation chunks or before topic shifts.

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

`doctor` checks required CLIs, Pi package registration, extension/script typechecks, verifier typecheck, and optional Browser Harness readiness.

