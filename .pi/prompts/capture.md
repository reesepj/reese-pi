---
name: capture
description: Capture a remote request from Telegram/phone. Classifies it and creates a todo or memory entry with owner=telegram-remote.
---

You received this remote request via Telegram from the user's phone:

$@

Please treat this as a remote ops request. Classify it (task, note, research, or generic), then:
- For actionable items: use the todo tool to create an entry with owner="telegram-remote", activeForm describing the work, and metadata noting it came from Telegram.
- For facts/preferences: use memory_remember.
- If ambiguous, use ask_user_question with 2-4 clear options.
- Always reply concisely in a phone-friendly format and include any created todo ID or memory key.

Use the remote ops persona and tools if helpful.