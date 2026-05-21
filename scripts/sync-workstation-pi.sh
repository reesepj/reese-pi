#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MANIFEST="public/data/pi-workstation-manifest.json"
LOG_PREFIX="[reese-pi-sync]"

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "$LOG_PREFIX missing required command: $1" >&2
    exit 1
  fi
}

need git
need npm
need pi
need python3

mkdir -p "$(dirname "$MANIFEST")"

CURRENT_PI_VERSION="$(pi --version 2>/dev/null | tr -d '\r' | sed -n '1p' || true)"
LATEST_PI_VERSION="$(npm view @earendil-works/pi-coding-agent version --silent 2>/dev/null | tr -d '\r' | sed -n '1p' || true)"
if [[ -n "$LATEST_PI_VERSION" && "$CURRENT_PI_VERSION" != "$LATEST_PI_VERSION" ]]; then
  echo "$LOG_PREFIX updating Pi CLI: ${CURRENT_PI_VERSION:-unknown} -> $LATEST_PI_VERSION"
  npm install -g "@earendil-works/pi-coding-agent@$LATEST_PI_VERSION"
  CURRENT_PI_VERSION="$(pi --version 2>/dev/null | tr -d '\r' | sed -n '1p' || true)"
fi

PI_LIST="$(pi list 2>/dev/null || true)"

python3 - "$MANIFEST" "$CURRENT_PI_VERSION" "$LATEST_PI_VERSION" <<'PY'
import hashlib, json, os, subprocess, sys
from datetime import datetime, timezone
from pathlib import Path

out = Path(sys.argv[1])
current = sys.argv[2]
latest = sys.argv[3]
root = Path.cwd()

allow_roots = [
    Path('.pi/settings.json'),
    Path('.pi/prompts'),
    Path('.pi/skills'),
    Path('extensions'),
    Path('scripts'),
    Path('justfile'),
    Path('README.md'),
    Path('INSTALL_WORKSTATION.md'),
    Path('REMOTE_OPS_GUIDE.md'),
    Path('REMOTE_OPS_TEST_PLAN.md'),
    Path('pi-extension-cheat-sheet.html'),
]

files = []
for rel in allow_roots:
    p = root / rel
    if not p.exists():
        continue
    if p.is_file():
        candidates = [p]
    else:
        candidates = [x for x in p.rglob('*') if x.is_file()]
    for f in candidates:
        rel_f = f.relative_to(root).as_posix()
        if any(part in rel_f for part in ['node_modules/', '.env', 'agent-sessions/', '/state/', '/vendor/', '/git/', '/npm/']):
            continue
        data = f.read_bytes()
        files.append({
            'path': rel_f,
            'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest(),
        })

packages = []
try:
    listing = subprocess.run(['pi', 'list'], cwd=root, check=False, text=True, capture_output=True, timeout=30).stdout
    for line in listing.splitlines():
        stripped = line.strip()
        if stripped.startswith(('npm:', 'https://')):
            packages.append(stripped)
except Exception:
    listing = ''

manifest = {
    'schema': 'reese-pi.workstation-sync.v1',
    'piCli': {
        'currentVersion': current or None,
        'latestNpmVersion': latest or None,
        'upToDate': bool(current and latest and current == latest),
    },
    'packages': packages,
    'trackedWorkstationFiles': sorted(files, key=lambda x: x['path']),
    'safety': {
        'publicRepo': True,
        'secretPolicy': 'Stage allowlisted Pi workstation files only; never stage .env, sessions, caches, runtime state, node_modules, vendor clones, or secrets.',
        'requiredGate': 'gitleaks protect --staged --redact',
    },
}

# Keep the manifest stable when nothing meaningful changed so the cron does not
# create timestamp-only commits. The commit time already records sync time.
new_text = json.dumps(manifest, indent=2) + '\n'
if out.exists():
    old_text = out.read_text()
    try:
        old_obj = json.loads(old_text)
        old_obj.pop('generatedAt', None)  # tolerate the older manifest shape
        if old_obj == manifest:
            raise SystemExit(0)
    except SystemExit:
        raise
    except Exception:
        pass
out.write_text(new_text)
PY

# Stage only public-safe workstation/Pi reproducibility files.
git add \
  .pi/settings.json \
  .pi/prompts \
  .pi/skills \
  extensions \
  scripts \
  justfile \
  README.md \
  INSTALL_WORKSTATION.md \
  REMOTE_OPS_GUIDE.md \
  REMOTE_OPS_TEST_PLAN.md \
  pi-extension-cheat-sheet.html \
  public/data/pi-workstation-manifest.json 2>/dev/null || true

if git diff --cached --quiet; then
  echo "$LOG_PREFIX no public-safe workstation changes to publish"
  exit 0
fi

if command -v gitleaks >/dev/null 2>&1; then
  gitleaks protect --staged --redact
fi

git commit -m "Sync Pi workstation state"
git pull --rebase origin main
git push origin main

echo "$LOG_PREFIX pushed latest Pi workstation state"
