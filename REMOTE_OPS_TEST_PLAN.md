# Remote Ops Agent — End-to-End Testing Plan

Use this checklist to validate the full system from Telegram.

## 1. Basic Capture & Todo Creation
**Send in Telegram:**
```
/capture Fix the mobile responsiveness on the landing page hero section
```

**Expected:**
- Todo created with `owner = "telegram-remote"`
- Agent confirms with todo ID
- Todo appears when running `todo list`

**Evidence to collect:**
- Todo ID from agent reply
- Output of `todo list status=pending`

---

## 2. Multi-step Plan with Dependencies
**Send in Telegram:**
```
/plan Build improved landing page with hero, testimonials, and pricing
```

**Expected:**
- Parent todo created
- 2–4 child todos created with `blockedBy` linking to parent
- Agent returns parent todo ID + short summary

**Evidence to collect:**
- List of created todos showing `blockedBy` relationships

---

## 3. Daily / Periodic Brief
**Send in Telegram:**
```
/daily-brief
```

**Expected:**
- Structured brief with open tasks, memories, and suggested actions
- Phone-friendly formatting

**Evidence to collect:**
- Screenshot or copy of the brief response

---

## 4. Handoff from Desktop → Telegram
**In a normal terminal session, run:**
```bash
pi -e extensions/personal-ops.ts
/handoff Testing richer handoff context with lecture-catch-up summary
```

**Then in Telegram send:**
```
Continue with the handoff test
```

**Expected:**
- Agent reads `.pi/state/handoff.json`
- Shows rich context (Goal, Accomplishments, Current Work, Next Actions)
- Marks the handoff as picked up (`pickedUpAt`)

**Evidence to collect:**
- Content of `.pi/state/handoff.json` before and after
- Agent response showing handoff context

---

## 5. Memory / Preference Storage
**Send in Telegram:**
```
/remember pref.telegram_style: keep replies under 5 lines when possible
```

**Expected:**
- Memory stored successfully
- Agent confirms

**Evidence to collect:**
- Output of `memory_search query=pref.telegram_style`

---

## 6. Verification Flow (Optional)
After completing any of the above tasks, send:
```
Can you verify that the landing page changes were made?
```

**Expected:**
- Agent uses `remote_verify` or suggests verification steps
- Clear evidence-based response

---

## Quick Smoke Test Sequence (Recommended Order)
1. `/capture Test task from phone`
2. `/plan Test plan with 3 steps`
3. `/daily-brief`
4. Desktop → `/handoff Testing handoff context`
5. Telegram continuation message
6. `/remember pref.test: testing memory from Telegram`

Run this sequence and report any issues or unexpected behavior.