# One-click workstation install

Use this when setting up this Pi Agent on another workstation.

## Prerequisites

Install these first:

- `git`
- Node/npm
- `pi`
- `uv`
- `just` recommended
- Chrome or Chromium recommended for Browser Harness

## Install

```bash
git clone https://github.com/disler/the-verifier-agent.git
cd the-verifier-agent
bash scripts/install-workstation.sh
```

The installer will:

1. Install verifier extension dependencies in `apps/verifier/`.
2. Install all project Pi packages into `.pi/settings.json` / `.pi/npm` / `.pi/git`, pinned to this workstation's versions/commits:
   - `https://github.com/BlockedPath/pi-xai-oauth.git@8f1b4927454362d8dfa36298b4cae0199c8c2c7a`
   - `https://github.com/rchern/pi-claude-cli.git@e0c9a12ac21be4c197e82795f7207746f3183028`
   - `npm:pi-mcp-adapter@2.6.1`
   - `npm:@samfp/pi-memory@1.3.2`
   - `npm:@juicesharp/rpiv-ask-user-question@1.9.0`
   - `npm:@juicesharp/rpiv-todo@1.9.0`
   - `npm:@llblab/pi-telegram@0.11.2`
   - `npm:@plannotator/pi-extension@0.19.18`
3. Clone and install Browser Harness into `.pi/vendor/browser-harness` with `uv tool install -e .`.
4. Symlink Browser Harness into `~/.claude/skills/browser-harness` when Claude Code skills are available.
5. Create `.env` from `.env.sample` if needed.
6. Install global launch wrappers into `~/.local/bin`.

## After install

Fill `.env` with any provider keys/tokens you need.

Start Browser Harness Chrome when you need web/browser work:

```bash
just browser-harness-chrome
```

In another terminal, verify Browser Harness:

```bash
source .env
browser-harness --doctor
```

Start the verifier agent:

```bash
just v
# or, after installer symlinks launch wrappers:
pi-verifier
```

Launch commands replicated by the installer:

| Command | Equivalent repo recipe |
| --- | --- |
| `pi-verifier` | `just v` |
| `pi-local-coms --name planner` | `just local-coms --name planner` |
| `pi-coms-net-server` | `just coms-net-server` |
| `pi-coms --name dev` | `just coms --name dev` |
| `pi-coms-claude --name claude` | `just coms-claude --name claude` |
| `pi-browser-harness-chrome` | `just browser-harness-chrome` |

## Upload/update GitHub

```bash
git add .gitignore .pi/settings.json .pi/git/.gitignore .pi/npm/.gitignore \
  .env.sample justfile extensions scripts INSTALL_WORKSTATION.md patches index.html

git commit -m "Add one-click workstation installer"
git push origin main
```
