#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Pi Verifier Agent workstation install"
echo "    repo: $ROOT"

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: required command not found: $1" >&2
    return 1
  fi
}

need git
need npm
LATEST_PI_VERSION="$(npm view @earendil-works/pi-coding-agent version --silent 2>/dev/null | tr -d '\r' | sed -n '1p' || true)"
if ! command -v pi >/dev/null 2>&1; then
  echo "==> Pi CLI not found; installing @earendil-works/pi-coding-agent globally with npm"
  npm install -g "@earendil-works/pi-coding-agent${LATEST_PI_VERSION:+@$LATEST_PI_VERSION}"
else
  CURRENT_PI_VERSION="$(pi --version 2>&1 | tr -d '\r' | sed -n '1p' || true)"
  if [ -n "$LATEST_PI_VERSION" ] && [ "$CURRENT_PI_VERSION" != "$LATEST_PI_VERSION" ]; then
    echo "==> Updating Pi CLI: ${CURRENT_PI_VERSION:-unknown} -> $LATEST_PI_VERSION"
    npm install -g "@earendil-works/pi-coding-agent@$LATEST_PI_VERSION"
  fi
fi
need pi
need uv

if ! command -v claude >/dev/null 2>&1; then
  echo "WARN: 'claude' CLI not found. pi-claude-cli is installed, but Claude Code models require Claude Code installed and logged in." >&2
fi

if ! command -v just >/dev/null 2>&1; then
  echo "WARN: 'just' not found. Install it to use repo recipes (e.g. 'just v')." >&2
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "WARN: 'bun' not found. Networked coms server recipe requires Bun (same as this workstation)." >&2
fi

if ! command -v google-chrome >/dev/null 2>&1 && ! command -v chromium >/dev/null 2>&1 && ! command -v chromium-browser >/dev/null 2>&1; then
  echo "WARN: Chrome/Chromium not found on PATH. Browser Harness needs Chrome/Chromium." >&2
fi

echo "==> Installing workstation typecheck dependencies"
if [ -f package.json ]; then
  npm install
fi

echo "==> Installing verifier extension dependencies"
if [ -f apps/verifier/package.json ]; then
  npm install --prefix apps/verifier
fi

echo "==> Installing project Pi packages"
# Pinned to the versions/commits from the source workstation for reproducibility.
packages=(
  "https://github.com/BlockedPath/pi-xai-oauth.git@8f1b4927454362d8dfa36298b4cae0199c8c2c7a"
  "https://github.com/rchern/pi-claude-cli.git@e0c9a12ac21be4c197e82795f7207746f3183028"
  "npm:pi-mcp-adapter@2.6.1"
  "npm:@samfp/pi-memory@1.3.2"
  "npm:@juicesharp/rpiv-ask-user-question@1.9.0"
  "npm:@juicesharp/rpiv-todo@1.9.0"
  "npm:@llblab/pi-telegram@0.11.2"
  "npm:@plannotator/pi-extension@0.19.18"
)

for pkg in "${packages[@]}"; do
  echo "    pi install -l $pkg"
  pi install -l "$pkg"
done

echo "==> Installing Browser Harness"
# Do not use .pi/tools: Pi treats that as the legacy custom-tools directory
# and warns that tools must migrate to extensions. Browser Harness is an
# external editable tool, so keep it under .pi/vendor instead.
mkdir -p .pi/vendor
if [ -d .pi/tools/browser-harness ] && [ ! -d .pi/vendor/browser-harness ]; then
  mv .pi/tools/browser-harness .pi/vendor/browser-harness
  rmdir .pi/tools 2>/dev/null || true
fi
if [ -d .pi/vendor/browser-harness/.git ]; then
  git -C .pi/vendor/browser-harness pull --ff-only
else
  git clone https://github.com/browser-use/browser-harness.git .pi/vendor/browser-harness
fi
(
  cd .pi/vendor/browser-harness
  uv tool install -e . --force
)

if [ -d "$HOME/.claude/skills" ]; then
  echo "==> Registering Browser Harness as a Claude Code skill"
  rm -rf "$HOME/.claude/skills/browser-harness"
  ln -s "$ROOT/.pi/vendor/browser-harness" "$HOME/.claude/skills/browser-harness"
else
  echo "WARN: ~/.claude/skills not found; skipping Browser Harness Claude skill symlink." >&2
fi

if [ ! -f .env ]; then
  echo "==> Creating .env from .env.sample"
  cp .env.sample .env
fi

if ! grep -q '^BU_CDP_URL=' .env 2>/dev/null; then
  cat >> .env <<'EOF'

# Browser Harness web/search tool
BU_CDP_URL=http://127.0.0.1:9222
EOF
fi

echo "==> Installing launch command wrappers"
mkdir -p "$HOME/.local/bin"
for cmd in pi-verifier pi-local-coms pi-coms-net-server pi-coms pi-coms-claude pi-browser-harness-chrome; do
  ln -sf "$ROOT/scripts/bin/$cmd" "$HOME/.local/bin/$cmd"
done

case ":$PATH:" in
  *":$HOME/.local/bin:"*) ;;
  *) echo "WARN: $HOME/.local/bin is not on PATH. Add it to use pi-verifier/pi-coms/... commands globally." >&2 ;;
esac

echo "==> Verifying Pi package registration"
pi list

echo
cat <<'EOF'
Install complete.

Next steps:
  1. Fill API keys / tokens in .env as needed.
  2. Start Browser Harness Chrome when you need browser/web search:
       just browser-harness-chrome
     In another terminal:
       source .env && browser-harness --doctor
  3. Check workstation health:
       just doctor
  4. Start the verifier agent:
       just v

One-line install on another workstation after this repo is on GitHub:
  git clone https://github.com/reesepj/reese-pi.git && cd reese-pi && bash scripts/install-workstation.sh
EOF
