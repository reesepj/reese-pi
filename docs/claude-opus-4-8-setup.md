# Running Claude Opus 4.8 with the Pi Agent

This note records how we pointed the agent at **Claude Opus 4.8**
(`claude-opus-4-8`) and how we verified it was actually serving that model.

## Background

The agent talks to Claude by shelling out to the Claude Code CLI in headless
("print") mode:

```
claude -p --output-format json --model <model-id> [--resume <session>] <message>
```

The model is selected by the `--model` flag passed on that command line.

## What we changed

The model id was hardcoded in the bot entry point and was still pointing at the
previous Opus release. We bumped it to `claude-opus-4-8`.

**File:** `bot.py` (line ~29)

```diff
- cmd = ["claude", "-p", "--output-format", "json", "--model", "claude-opus-4-7"]
+ cmd = ["claude", "-p", "--output-format", "json", "--model", "claude-opus-4-8"]
```

> Note: this bot lives in a separate project directory
> (`~/projects/telegram-claude-bot`), not in this repo. The id documented here is
> the one that matters: `claude-opus-4-8`.

## How we proved it is really Opus 4.8

Self-reported model names are not proof. The authoritative source is the session
transcript that the Claude Code harness writes per turn — the `"model"` field is
stamped from the actual API response, not something the model can fake.

Transcripts live under:

```
~/.claude/projects/<project-slug>/<session-uuid>.jsonl
```

Grepping the live session's transcript showed the served model on every
assistant API turn:

```
"model":"claude-opus-4-8"   # every real assistant turn
"model":"<synthetic>"       # injected / non-API lines
```

That `claude-opus-4-8` value is the proof the change took effect.

## Note on "fast mode"

`/fast` is a **client-side, interactive-TUI toggle only**. It is never written to
any settings file (`grep fast` across all settings + `claude.json` returns
nothing), and it does not exist on the headless `claude -p` path the agent uses.
So there is no "fast mode" state to turn off when running through the agent —
speed/effort on this path is controlled by flags in `bot.py`, not `/fast`.

## Operational notes

- The agent's systemd unit loads an `EnvironmentFile` (`.env`) holding
  `TELEGRAM_BOT_TOKEN` and `ALLOWED_USER_ID`. If that file is missing, the
  service fails to start (`Failed to load environment files`) and lands in an
  `activating (auto-restart)` loop. Restore `.env`, then:
  ```
  sudo systemctl restart telegram-claude-bot
  systemctl status telegram-claude-bot --no-pager
  ```
- Run privileged commands locally; never paste passwords or tokens into the chat.
