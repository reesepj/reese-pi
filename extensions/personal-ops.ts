/**
 * personal-ops — Remote Telegram Ops Agent
 *
 * Tools + persona for handling remote requests from phone via Telegram.
 */

import { Type } from "@mariozechner/pi-ai";
import { defineTool, type ExtensionAPI } from "@mariozechner/pi-coding-agent";

// ━━ Tools ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const remoteCaptureTool = defineTool({
	name: "remote_capture",
	label: "Remote Capture",
	description: "Capture a request received via Telegram from your phone.",
	parameters: Type.Object({
		text: Type.String({ description: "The full message or request from Telegram" }),
	}),
	async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
		return {
			content: [{ type: "text", text: `REMOTE CAPTURE: ${params.text}` }],
			details: { captured: params.text, source: "telegram" },
		};
	},
});

const remoteBriefTool = defineTool({
	name: "remote_brief",
	label: "Remote Brief",
	description: "Generate a phone-friendly ops brief.",
	parameters: Type.Object({
		includeCompleted: Type.Optional(Type.Boolean({ default: false })),
	}),
	async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
		return {
			content: [{ type: "text", text: "REMOTE BRIEF requested" }],
			details: { includeCompleted: params.includeCompleted ?? false },
		};
	},
});

const remoteRememberTool = defineTool({
	name: "remote_remember",
	label: "Remote Remember",
	description: "Store a fact or preference received from a remote Telegram session.",
	parameters: Type.Object({
		key: Type.String({ description: "Memory key" }),
		value: Type.String({ description: "The fact or value" }),
		category: Type.Optional(Type.String({ enum: ["pref", "project", "lesson", "tool"] })),
	}),
	async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
		return {
			content: [{ type: "text", text: `REMOTE REMEMBER: ${params.key}` }],
			details: { key: params.key, value: params.value, category: params.category },
		};
	},
});

const remoteVerifyTool = defineTool({
	name: "remote_verify",
	label: "Remote Verify",
	description: "Verify claims made during remote work from Telegram.",
	parameters: Type.Object({
		claim: Type.String({ description: "The specific claim to verify" }),
		context: Type.Optional(Type.String({ description: "Additional context" })),
	}),
	async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
		return {
			content: [{
				type: "text",
				text: `REMOTE VERIFY: ${params.claim}\n\nCheck state and report evidence.`
			}],
			details: { claim: params.claim, context: params.context },
		};
	},
});

// ━━ Extension ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function personalOpsExtension(pi: ExtensionAPI) {
	pi.registerTool(remoteCaptureTool);
	pi.registerTool(remoteBriefTool);
	pi.registerTool(remoteRememberTool);
	pi.registerTool(remoteVerifyTool);

	// CLI /handoff command — transfer current session context to Telegram
	pi.registerCommand("handoff", {
		description: "Handoff current work to Telegram so you can continue from your phone",
		handler: async (args, ctx) => {
			const note = args.trim() || "Session handed off from desktop";
			const handoffData = {
				timestamp: new Date().toISOString(),
				cwd: process.cwd(),
				note,
				lastPrompt: note,
				contextSummary: "Remote Ops Agent — turning Telegram into full remote control for this workstation.",
				lectureCatchup: {
					goal: "Build reliable remote ops system so user can control workstation from phone via Telegram.",
					majorAccomplishments: [
						"Telegram bridge connected and working",
						"Prompt templates created (/capture, /plan, /brief, /daily-brief, /remember, /handoff)",
						"/plan supports dependent todos via blockedBy",
						"Daily/periodic brief template added",
"/handoff implemented with richer context + safe mark-used pickup",
						"Stale context bug fixed with automatic injection"
					],
					keyEvents: [
						"Todo update tool had persistent issues",
						"Handoff context improved from minimal to lecture-catch-up style",
						"Handoff pickup marking added (safe mark-used approximation)"
					],
					knownIssues: [
						"Todo list updates sometimes fail in current environment",
						"Handoff still needs real-world multi-device testing"
					],
					remainingWork: [
						"Real end-to-end testing from phone (#10)",
						"Polish and final documentation"
					]
				},
				currentWork: note || "Testing / improving the handoff feature and remote commands",
				nextActions: [
					"Test handoff pickup and context quality",
					"Try /plan with dependent todos from Telegram",
					"Use /daily-brief for status updates"
				],
				availableCommands: ['/capture', '/plan', '/brief', '/daily-brief', '/remember', '/handoff']
			};

			// Persist handoff state so Telegram can read it
			const fs = await import("node:fs");
			const path = await import("node:path");
			const stateDir = ".pi/state";
			if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
			fs.writeFileSync(path.join(stateDir, "handoff.json"), JSON.stringify(handoffData, null, 2));

			ctx.ui.notify("Handoff saved — continue in Telegram", "info");
		},
	});

	pi.on("before_agent_start", async (event) => {
		// Auto-inject current handoff context if file exists
		let handoffContext = "";
		try {
			const fs = await import("node:fs");
			const path = await import("node:path");
			const handoffPath = path.join(".pi", "state", "handoff.json");
if (fs.existsSync(handoffPath)) {
				const data = JSON.parse(fs.readFileSync(handoffPath, "utf8"));
				handoffContext = `\n\nACTIVE HANDOFF CONTEXT (Lecture Catch-up):\n- Goal: ${data.lectureCatchup?.goal || data.contextSummary || "Remote Ops"}\n- Major Accomplishments: ${(data.lectureCatchup?.majorAccomplishments || []).join(" | ")}\n- Key Events: ${(data.lectureCatchup?.keyEvents || []).join(" | ")}\n- Known Issues: ${(data.lectureCatchup?.knownIssues || []).join(" | ")}\n- Remaining Work: ${(data.lectureCatchup?.remainingWork || []).join(" | ")}\n- Current Work: ${data.currentWork || data.note}\n- From: ${data.cwd || "unknown"} at ${data.timestamp}\n\nContinue this work from Telegram.`;

				// Safe mark-used: we mark the handoff as picked up on any agent start.
				// We cannot reliably detect Telegram origin in before_agent_start,
				// so this is a safe approximation rather than true Telegram-gated cleanup.
				try {
					data.pickedUpAt = new Date().toISOString();
					fs.writeFileSync(handoffPath, JSON.stringify(data, null, 2));
				} catch (e) {
					// ignore mark-used errors
				}
			}
		} catch (e) {
			// ignore handoff read errors
		}

		const remoteGuidance = `
REMOTE TELEGRAM OPS PERSONA (active when extension loaded):

You are the Personal Ops Agent for this workstation. All [telegram] messages are remote requests from the user's phone.

Handoff detection:
- If a .pi/state/handoff.json file exists, read it and treat the note + lastPrompt as the active context to continue.
- After successfully picking up a handoff, delete or mark the file as used.

Classification rules (use these explicitly):
1. Task / actionable or multi-step goal → todo(create) with owner="telegram-remote". For plans, create a parent todo then child todos linked with blockedBy.
2. Note / fact / preference → memory_remember (category: pref | project | lesson)
3. Ambiguous or needs clarification → ask_user_question (2-4 options)
4. Research, check, analyze URL or page → consider browser-harness
5. After any multi-step work or claim → use remote_verify tool or the verifier loop
6. Daily or periodic check-in → use the daily-brief prompt template
7. Handoff from desktop → acknowledge context transfer and continue the same work in Telegram

Always:
- Reply concisely and phone-friendly
- Include todo ID or memory key when created
- Use telegram_attach for files
- Keep the pref.telegram_style in mind when responding

This guidance is active for the session.`;

		return {
			systemPrompt: `${event.systemPrompt}\n\n${remoteGuidance}${handoffContext}`,
		};
	});

	console.log("✅ personal-ops extension loaded — remote ops tools + persona active");
}