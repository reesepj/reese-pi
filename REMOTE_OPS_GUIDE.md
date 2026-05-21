# Remote Ops Agent — Usage Guide

Turn your Telegram into a powerful remote control surface for this workstation.

## Setup (one time)
1. Make sure the Telegram bridge is connected (`/telegram-connect` + `/start` in the bot)
2. Launch the ops agent:
   ```bash
   just personal-ops
   ```
   or
   ```bash
   pi -e extensions/personal-ops.ts
   ```

## Available Telegram Commands

| Command          | What it does                                              | Example |
|------------------|-----------------------------------------------------------|--------|
| `/capture`       | Capture any request and turn it into a tracked todo or memory | `/capture Fix the hero section on mobile` |
| `/plan`          | Create a multi-step plan with parent + dependent child todos | `/plan Build new landing page` |
| `/brief`         | Quick overview of open remote work                        | `/brief` |
| `/daily-brief`   | Rich daily/periodic summary with suggestions              | `/daily-brief` |
| `/remember`      | Store a durable preference or fact                        | `/remember pref.telegram_style: keep replies short` |
| `/handoff`       | Continue work that was handed off from desktop            | `/handoff` |

You can also just send normal messages — the agent will classify them automatically.

## Key Behaviors
- All created todos use `owner = "telegram-remote"`
- Plans create linked todos using `blockedBy`
- Handoff from desktop carries rich context (goal, accomplishments, current work, next actions)
- The agent follows `pref.telegram_style` when set
- After multi-step work, the agent can use `remote_verify`

## Handoff (Desktop → Telegram)
You can run `/handoff <note>` in a normal Pi session on desktop. This saves rich context (current work, accomplishments, next actions) so you can continue seamlessly from your phone.

The handoff file is marked as picked up when the agent injects the context. Current implementation uses a safe mark-used approximation because Telegram-origin detection is not available in before_agent_start.

## Tips
- Keep messages reasonably short for best results
- Use `/daily-brief` at the start or end of your day
- The agent carries rich context during handoff for continuity

## Files
- `extensions/personal-ops.ts` — Core tools + persona + handoff logic
- `.pi/prompts/*.md` — Telegram command templates (including `/handoff`)
- `.pi/state/handoff.json` — Temporary handoff state (marked as picked up after injection)
- `REMOTE_OPS_GUIDE.md` — This file
- `REMOTE_OPS_TEST_PLAN.md` — Testing scenarios (parked for later use)

---

Built with the Personal Ops Agent system.