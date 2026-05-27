#!/usr/bin/env bash
set -euo pipefail

# Minimal everyday profile: no skills/prompts/context files, and only daily-use tools.
# Override with PI_LITE_TOOLS=read,grep,... if needed.
TOOLS="${PI_LITE_TOOLS:-read,edit,bash,grep,find,ls,todo,ask_user_question,gbrain_context,memory_search,memory_remember,memory_forget,memory_lessons,memory_stats}"

exec pi \
  --no-skills \
  --no-prompt-templates \
  --no-context-files \
  --tools "$TOOLS" \
  "$@"
