#!/usr/bin/env bash
set -euo pipefail

skill_args=()
shopt -s nullglob
for dir in "$HOME"/.claude/skills/seo*; do
  if [ -d "$dir" ]; then
    skill_args+=(--skill "$dir")
  fi
done
shopt -u nullglob

if [ "${#skill_args[@]}" -eq 0 ]; then
  echo "pi-seo: no SEO skills found under ~/.claude/skills/seo*" >&2
  exit 1
fi

exec pi --no-skills "${skill_args[@]}" "$@"
