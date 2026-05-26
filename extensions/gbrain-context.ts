/**
 * gbrain-context — concise operating context from gbrain for Pi.
 *
 * This intentionally does not dump the whole brain into every turn. It gives
 * the agent a small, explicit tool for current priorities, paused lanes, and
 * relevant memory lookup when that context matters.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const execFileP = promisify(execFile);
const DEFAULT_TIMEOUT_MS = 20_000;
const ACTIVE_QUEUE_SLUG = "systems/productivity-cell/active-work-queue";

type GbrainRun = {
	ok: boolean;
	stdout: string;
	stderr: string;
	error?: string;
};

function cleanOutput(text: string): string {
	return text
		.split("\n")
		.filter((line) => !line.includes("[ai.gateway] recipe"))
		.join("\n")
		.trim();
}

function truncate(text: string, max = 6_000): string {
	if (text.length <= max) return text;
	return `${text.slice(0, max - 120).trim()}\n\n[truncated ${text.length - max} chars]`;
}

async function runGbrain(args: string[], timeoutMs = DEFAULT_TIMEOUT_MS): Promise<GbrainRun> {
	try {
		const result = await execFileP("gbrain", args, {
			cwd: process.env.HOME,
			timeout: timeoutMs,
			maxBuffer: 1024 * 1024,
			env: {
				...process.env,
				PATH: `${process.env.HOME}/.local/bin:${process.env.PATH ?? ""}`,
			},
		});
		return {
			ok: true,
			stdout: cleanOutput(result.stdout ?? ""),
			stderr: cleanOutput(result.stderr ?? ""),
		};
	} catch (err: any) {
		return {
			ok: false,
			stdout: cleanOutput(err?.stdout ?? ""),
			stderr: cleanOutput(err?.stderr ?? ""),
			error: err?.killed ? "gbrain command timed out" : (err?.message ?? String(err)),
		};
	}
}

function section(markdown: string, heading: string): string {
	const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const re = new RegExp(`^## ${escaped}\\s*$([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, "m");
	const match = markdown.match(re);
	return match?.[1]?.trim() ?? "";
}

function summarizeFocus(activeQueue: string): string {
	const focus = section(activeQueue, "Current focus restriction");
	const highest = section(activeQueue, "Current highest-leverage move");
	return [
		focus ? `Focus restriction: ${focus.replace(/\s+/g, " ")}` : "",
		highest ? `Highest-leverage move: ${highest.replace(/\s+/g, " ")}` : "",
	].filter(Boolean).join("\n");
}

function topActiveTasks(activeQueue: string, limit = 5): string[] {
	const active = section(activeQueue, "Active tasks");
	const rows = active.split("\n").filter((line) => /^\|\s*\d+\s*\|/.test(line));
	return rows.slice(0, limit).map((row) => {
		const cells = row.split("|").slice(1, -1).map((cell) => cell.trim().replace(/\s+/g, " "));
		const [priority, task, owner, nextAction, _artifact, path, status] = cells;
		const pathHint = path ? ` (${path.replace(/`/g, "")})` : "";
		return `${priority}. ${task} — ${status || "unknown"}; next: ${nextAction || "n/a"}; owner: ${owner || "n/a"}${pathHint}`;
	});
}

function latestPages(listOutput: string, limit = 8): string[] {
	return listOutput.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.slice(0, limit)
		.map((line) => {
			const [slug, type, date, ...titleParts] = line.split("\t");
			const title = titleParts.join(" ").trim();
			return `- ${title || slug} (${type || "?"}, ${date || "?"}) — ${slug}`;
		});
}

async function buildBrief(): Promise<string> {
	const [stats, latest, activeQueue] = await Promise.all([
		runGbrain(["stats"], 15_000),
		runGbrain(["list", "-n", "12"], 15_000),
		runGbrain(["get", ACTIVE_QUEUE_SLUG], 20_000),
	]);

	const lines: string[] = ["# gbrain operating context"];
	if (stats.ok && stats.stdout) {
		const statLine = stats.stdout.split("\n").slice(0, 6).join("; ").replace(/\s+/g, " ");
		lines.push(`\nStats: ${statLine}`);
	} else {
		lines.push(`\nStats unavailable: ${stats.error ?? stats.stderr}`);
	}

	if (activeQueue.ok && activeQueue.stdout) {
		const focus = summarizeFocus(activeQueue.stdout);
		if (focus) lines.push(`\n${focus}`);
		const tasks = topActiveTasks(activeQueue.stdout, 5);
		if (tasks.length) lines.push("\nTop active tasks:\n" + tasks.map((t) => `- ${t}`).join("\n"));
	} else {
		lines.push(`\nActive queue unavailable: ${activeQueue.error ?? activeQueue.stderr}`);
	}

	if (latest.ok && latest.stdout) {
		const pages = latestPages(latest.stdout, 8);
		if (pages.length) lines.push("\nLatest pages:\n" + pages.join("\n"));
	}

	return truncate(lines.join("\n"), 8_000);
}

async function runMode(params: { mode?: string; query?: string; slug?: string; limit?: number }): Promise<string> {
	const mode = (params.mode ?? "brief").toLowerCase();
	if (mode === "brief") return buildBrief();
	if (mode === "stats") {
		const res = await runGbrain(["stats"]);
		return res.ok ? res.stdout : `gbrain stats failed: ${res.error ?? res.stderr}`;
	}
	if (mode === "list") {
		const limit = String(Math.max(1, Math.min(params.limit ?? 20, 50)));
		const res = await runGbrain(["list", "-n", limit]);
		return res.ok ? truncate(res.stdout, 8_000) : `gbrain list failed: ${res.error ?? res.stderr}`;
	}
	if (mode === "get") {
		if (!params.slug) return "mode=get requires slug";
		const res = await runGbrain(["get", params.slug]);
		return res.ok ? truncate(res.stdout, 12_000) : `gbrain get failed: ${res.error ?? res.stderr}`;
	}
	if (mode === "query" || mode === "search") {
		if (!params.query) return `mode=${mode} requires query`;
		const res = await runGbrain([mode, params.query, "--no-expand"], 30_000);
		return res.ok ? truncate(res.stdout, 12_000) : `gbrain ${mode} failed: ${res.error ?? res.stderr}`;
	}
	return `Unknown mode: ${mode}. Use brief, stats, list, get, search, or query.`;
}

export default function gbrainContextExtension(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "gbrain_context",
		label: "GBrain Context",
		description: "Fetch concise operating context or lookup memory from local gbrain. Modes: brief, stats, list, get, search, query.",
		promptSnippet: "Fetch current operating context, paused lanes, active priorities, or relevant memory from gbrain.",
		promptGuidelines: [
			"Use gbrain_context before acting on current priorities, paused work lanes, project history, or ambiguous remote-ops requests where durable memory may matter.",
			"Do not treat gbrain_context output as fresh truth until it has been fetched in the current turn when the answer depends on current operating state.",
		],
		parameters: Type.Object({
			mode: Type.Optional(Type.String({ description: "brief | stats | list | get | search | query. Default: brief." })),
			query: Type.Optional(Type.String({ description: "Search/query text for mode=search or mode=query." })),
			slug: Type.Optional(Type.String({ description: "Page slug for mode=get." })),
			limit: Type.Optional(Type.Number({ description: "List result limit for mode=list. Max 50." })),
		}),
		async execute(_toolCallId, params) {
			const text = await runMode(params);
			return {
				content: [{ type: "text" as const, text }],
				details: { mode: params.mode ?? "brief" },
			};
		},
	});

	pi.registerCommand("gbrain-context", {
		description: "Show concise operating context from gbrain",
		handler: async (args, ctx) => {
			const trimmed = args.trim();
			const text = trimmed
				? await runMode({ mode: "query", query: trimmed })
				: await buildBrief();
			pi.sendMessage({
				customType: "gbrain-context",
				content: text,
				display: true,
				details: { query: trimmed || null },
			});
			ctx.ui.notify("gbrain context added", "info");
		},
	});

	pi.on("before_agent_start", async (event) => ({
		systemPrompt: `${event.systemPrompt}\n\nGBrain is available through the gbrain_context tool for durable operating context. Use it when current priorities, paused lanes, project history, or ReeseBrain/gbrain memory could affect the answer. Keep fetched gbrain summaries concise in user replies.`,
	}));

	console.log("✅ gbrain-context extension loaded — gbrain_context tool + /gbrain-context command active");
}
