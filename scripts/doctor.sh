#!/usr/bin/env bash
set -u -o pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FAILED=0
WARNED=0

ok() { printf '✓ %s\n' "$*"; }
warn() { printf '⚠ %s\n' "$*"; WARNED=1; }
fail() { printf '✗ %s\n' "$*"; FAILED=1; }
info() { printf '• %s\n' "$*"; }

run_required() {
  local label="$1"
  shift
  printf '\n==> %s\n' "$label"
  if "$@"; then
    ok "$label"
  else
    fail "$label"
  fi
}

run_optional() {
  local label="$1"
  shift
  printf '\n==> %s\n' "$label"
  if "$@"; then
    ok "$label"
  else
    warn "$label"
  fi
}

printf 'Reese Pi doctor\n'
printf 'root: %s\n' "$ROOT"

printf '\n==> Required commands\n'
for cmd in git npm pi uv tmux; do
  if command -v "$cmd" >/dev/null 2>&1; then
    ok "$cmd: $(command -v "$cmd")"
  else
    fail "missing required command: $cmd"
  fi
done

printf '\n==> Optional commands\n'
for cmd in just bun browser-harness; do
  if command -v "$cmd" >/dev/null 2>&1; then
    ok "$cmd: $(command -v "$cmd")"
  else
    warn "missing optional command: $cmd"
  fi
done
if command -v google-chrome >/dev/null 2>&1 || command -v chromium >/dev/null 2>&1 || command -v chromium-browser >/dev/null 2>&1; then
  ok "Chrome/Chromium available"
else
  warn "Chrome/Chromium not found; browser harness needs one"
fi

printf '\n==> Pi version\n'
if command -v pi >/dev/null 2>&1; then
  PI_VERSION="$(pi --version 2>&1 | tr -d '\r' | sed -n '1p')"
  info "pi: ${PI_VERSION:-unknown}"
  EXPECTED="$(node -e 'const p=require("./package.json"); const v=p.devDependencies?.["@earendil-works/pi-coding-agent"]||""; console.log(v.replace(/^[^0-9]*/, ""));' 2>/dev/null || true)"
  if [ -n "${EXPECTED:-}" ] && [ -n "${PI_VERSION:-}" ] && [ "$PI_VERSION" != "$EXPECTED" ]; then
    warn "Pi CLI $PI_VERSION differs from dev dependency $EXPECTED"
  else
    ok "Pi CLI matches dev dependency"
  fi
else
  fail "cannot check Pi version"
fi

printf '\n==> Environment\n'
[ -f .env ] && ok ".env exists" || warn ".env missing; copy .env.sample"
if grep -q '^BU_CDP_URL=' .env 2>/dev/null; then
  ok "BU_CDP_URL configured"
else
  warn "BU_CDP_URL missing; browser harness may not connect"
fi

run_required "Project Pi package list" pi list

if [ -d node_modules ]; then
  run_required "Extension/script typecheck" npm run typecheck:extensions
else
  fail "root node_modules missing; run npm install"
fi

if [ -d apps/verifier/node_modules ]; then
  run_required "Verifier typecheck" npm --prefix apps/verifier run typecheck
else
  fail "apps/verifier/node_modules missing; run npm install --prefix apps/verifier"
fi

if command -v browser-harness >/dev/null 2>&1; then
  run_optional "Browser Harness smoke" browser-harness navigate --url about:blank --headless
fi

printf '\n==> Git worktree\n'
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  CHANGES="$(git status --short)"
  if [ -n "$CHANGES" ]; then
    warn "worktree has changes"
    printf '%s\n' "$CHANGES"
  else
    ok "worktree clean"
  fi
else
  warn "not inside a git worktree"
fi

printf '\nSummary: '
if [ "$FAILED" -ne 0 ]; then
  printf 'failed\n'
  exit 1
fi
if [ "$WARNED" -ne 0 ]; then
  printf 'passed with warnings\n'
  exit 0
fi
printf 'healthy\n'
