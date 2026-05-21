# Pi Verifier Agent — justfile
#
# Recipes for the v1 verifier system.
#
# Conventions per /just skill:
#   - `default` recipe lists available commands (silent listing).
#   - `set dotenv-load` so a project-local `.env` is loaded automatically.

set dotenv-load := true

# Show available recipes (default when running bare `just`)
default:
    @just --list

# Launch builder + auto-spawn verifier (generic `verifier` persona)
verifier:
    pi -e ./apps/verifier/verifiable.ts -e ./apps/verifier/cross-agent.ts --verifiable

# Shortcut alias — `j v` ≡ `j verifier`
v: verifier

# Prime context in an interactive Claude Code session
prime:
    claude --dangerously-skip-permissions --model "opus[1m]" "/prime"

# Prime context in an interactive pi session (prefers `ipi` shell function if defined, else `pi`)
primepi:
    @zsh -ic 'if typeset -f ipi >/dev/null 2>&1 || command -v ipi >/dev/null 2>&1; then ipi "/prime"; else pi "/prime"; fi'

# Kill any stale verifier tmux sessions, sockets, and breadcrumbs from prior runs
clean:
    -tmux ls 2>/dev/null | grep '^verifier-' | cut -d: -f1 | xargs -I{} tmux kill-session -t {}
    -rm -f /tmp/pi-verifier/*.sock
    -rm -f .pi/state/verifier-*.sock.ref
    @echo "clean: stale verifier state removed"

# ------------------------ Pi-to-Pi agent communication ------------------------

# Same-machine peer-to-peer messaging between Pi agents.
# Example: just local-coms --name planner --purpose "Plans work" --color "#36F9F6"
local-coms *args:
    pi -e extensions/coms.ts {{args}}

# Personal Ops Agent — Telegram remote prompt channel + intelligent inbox
# Launch this to make your phone Telegram DM a full remote control surface for this workstation.
# Send any prompt from phone; agent classifies, tracks with todo/memory, replies with proof.
# Example: just personal-ops
personal-ops:
    pi -e extensions/personal-ops.ts --verifiable

# Shortcut
ops: personal-ops

# Start a local coms-net HTTP/SSE hub (binds 127.0.0.1, OS-claimed port by default).
coms-net-server:
    -lsof -ti :${PI_COMS_NET_PORT:-52965} | xargs -r kill -TERM 2>/dev/null
    bun scripts/coms-net-server.ts

# Start a LAN-visible coms-net hub. Requires PI_COMS_NET_AUTH_TOKEN.
coms-net-server-lan:
    -lsof -ti :${PI_COMS_NET_PORT:-52965} | xargs -r kill -TERM 2>/dev/null
    PI_COMS_NET_HOST=0.0.0.0 bun scripts/coms-net-server.ts

# Networked Pi-to-Pi client. Auto-discovers ~/.pi/coms-net/projects/<project>/server.json.
# Example: just coms --name dev --purpose "Dev agent"
coms *args:
    pi -e extensions/coms-net.ts {{args}}

# Networked client pinned to the workspace default Claude provider/model.
coms-claude *args:
    pi -e extensions/coms-net.ts --provider pi-claude-cli --model claude-sonnet-4-5 {{args}}

# ------------------------ Browser Harness web tool ------------------------

# Launch an isolated Chrome profile with CDP enabled for browser-harness.
browser-harness-chrome:
    mkdir -p "$HOME/.cache/browser-harness/chrome-profile"
    google-chrome --remote-debugging-port=9222 --user-data-dir="$HOME/.cache/browser-harness/chrome-profile" --no-first-run --no-default-browser-check about:blank

# Check browser-harness installation and browser connection.
browser-harness-doctor:
    browser-harness --doctor

# Smoke-test browser-harness by opening example.com and printing page info.
browser-harness-smoke:
    browser-harness <<'PY'
    new_tab("https://example.com")
    wait_for_load()
    print(page_info())
    PY
