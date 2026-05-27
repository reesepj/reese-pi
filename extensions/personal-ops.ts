/**
 * personal-ops — Remote Telegram Ops Agent
 *
 * Tools + persona for handling remote requests from phone via Telegram.
 */

import { Type } from "typebox";
import { defineTool, type ExtensionAPI } from "@earendil-works/pi-coding-agent";

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

	let handoffInjectedPath: string | null = null;

	function isTelegramPrompt(text: string): boolean {
		return /(^|\n)\s*\[telegram\]/i.test(text);
	}

	// CLI /handoff command — transfer current session context to Telegram
	pi.registerCommand("handoff", {
		description: "Handoff current work to Telegram so you can continue from your phone",
		handler: async (args, ctx) => {
			const note = args.trim() || "Session handed off from desktop";
			const handoffData = {
				status: "pending",
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
						"/handoff implemented with richer context + Telegram-gated pickup",
						"Stale context bug fixed with automatic injection"
					],
					keyEvents: [
						"Todo update tool had persistent issues",
						"Handoff context improved from minimal to lecture-catch-up style",
						"Handoff pickup marking added after Telegram injection"
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
		// Auto-inject current handoff context only for Telegram-origin turns.
		// This prevents a normal desktop Pi prompt from accidentally consuming
		// a handoff intended for the phone.
		let handoffContext = "";
		try {
			const fs = await import("node:fs");
			const path = await import("node:path");
			const handoffPath = path.join(".pi", "state", "handoff.json");
			const telegramTurn = isTelegramPrompt(event.prompt ?? "");
			if (telegramTurn && fs.existsSync(handoffPath)) {
				const data = JSON.parse(fs.readFileSync(handoffPath, "utf8"));
				if (!data.acknowledgedAt) {
					handoffContext = `\n\nACTIVE HANDOFF CONTEXT (Lecture Catch-up):\n- Goal: ${data.lectureCatchup?.goal || data.contextSummary || "Remote Ops"}\n- Major Accomplishments: ${(data.lectureCatchup?.majorAccomplishments || []).join(" | ")}\n- Key Events: ${(data.lectureCatchup?.keyEvents || []).join(" | ")}\n- Known Issues: ${(data.lectureCatchup?.knownIssues || []).join(" | ")}\n- Remaining Work: ${(data.lectureCatchup?.remainingWork || []).join(" | ")}\n- Current Work: ${data.currentWork || data.note}\n- From: ${data.cwd || "unknown"} at ${data.timestamp}\n\nContinue this work from Telegram.`;

					data.status = "injected";
					data.injectedAt = new Date().toISOString();
					data.injectedPromptPreview = String(event.prompt ?? "").slice(0, 240);
					fs.writeFileSync(handoffPath, JSON.stringify(data, null, 2));
					handoffInjectedPath = handoffPath;
				}
			}
		} catch (e) {
			// ignore handoff read/write errors
		}

		const remoteGuidance = `
REMOTE TELEGRAM OPS:
[telegram] is a phone remote request. Be concise and action-oriented.
Use ACTIVE HANDOFF CONTEXT if present; it will be acknowledged after the turn.
Use todo for multi-step work, memory_remember for durable facts/preferences, ask_user_question only when blocked, browser tools for web checks, and telegram_attach for files. Verify nontrivial claims with tools/tests before final.`;

		return {
			systemPrompt: `${event.systemPrompt}\n\n${remoteGuidance}${handoffContext}`,
		};
	});

	pi.on("agent_end", async () => {
		if (!handoffInjectedPath) return;
		try {
			const fs = await import("node:fs");
			const data = JSON.parse(fs.readFileSync(handoffInjectedPath, "utf8"));
			if (!data.acknowledgedAt) {
				data.status = "acknowledged";
				data.acknowledgedAt = new Date().toISOString();
				// Backward-compatible field for docs/scripts that still check pickedUpAt.
				data.pickedUpAt = data.acknowledgedAt;
				fs.writeFileSync(handoffInjectedPath, JSON.stringify(data, null, 2));
			}
		} catch (e) {
			// ignore handoff acknowledgement errors
		} finally {
			handoffInjectedPath = null;
		}
	});

	console.log("✅ personal-ops extension loaded — remote ops tools + persona active");
}
