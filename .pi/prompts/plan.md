---
name: plan
description: Create a tracked multi-step remote plan from a Telegram goal. Creates parent todo + dependent steps.
---

The user sent this remote planning request from their phone via Telegram:

$@

Please create a structured remote plan using the todo tool:

1. First create a **parent todo** with:
   - subject = main goal
   - owner = "telegram-remote"
   - activeForm = "executing remote plan from phone"
   - description = full request

2. Then create **child todos** for each logical step, setting:
   - blockedBy = [parent todo id]
   - owner = "telegram-remote"
   - clear activeForm for each step

3. Reply with a short phone-friendly summary + the parent todo ID.

Example structure:
- Parent: "Build new landing page"
- Child 1: "Write hero section" (blockedBy parent)
- Child 2: "Add testimonials" (blockedBy parent)

Keep the final reply concise for mobile.