// Copyright (c) 2026 Flisk Landscape
// SPDX-License-Identifier: MIT
// Wakes a merge queue that stalled with entries but no batch building them. On 2026-11-22 the entry at position 1 left
// the queue for a merge conflict at about the same time as the batch ahead of it merged; GitHub then never started a
// batch for the next entry, so 48 PRs sat QUEUED with headCommit: null for six hours while main was green
// (https://github.com/flisk-sh/flisk/issues/5105). Run by the shared workflow .github/workflows/stalled-merge-queue.yml.
//
//   node scripts/stalled-merge-queue.mjs --repo <owner/name> [--stale-minutes <n>] [--dry-run]
//
// A queue is stalled when it has entries, none of them has a headCommit (no batch is being built for any of them), no
// merge_group run is active, and the newest merge_group run is older than 30 minutes (--stale-minutes). The head entry
// (lowest position) is then fixed according to its PR's mergeable state:
//
//   - CONFLICTING: dequeue it and comment on the PR asking for a rebase. Never re-queue it: it would stall again.
//   - MERGEABLE: re-queue it (dequeue + enqueue), which makes GitHub start a batch.
//
// dequeuePullRequest sometimes returns the error "Failed to remove PR from the merge queue" even though it removed the
// PR, so after dequeuing the queue is read again and the PR's absence is what counts, not the mutation's result.
// Reads the token from GH_TOKEN and shells out to `gh`.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const STALE_MS = 30 * 60 * 1000;
const ACTIVE_RUN_STATUSES = new Set(["queued", "in_progress", "requested", "waiting", "pending"]);

// The stalled queue's head entry (lowest position), or null when the queue is healthy. Pure: entries and runs are
// plain objects as read from the API, now is epoch millis.
export function stalledQueue({ entries, runs, now, staleMs = STALE_MS }) {
	if (!entries || entries.length === 0) return null;
	if (entries.some((entry) => entry.headCommit)) return null;
	const mergeGroupRuns = (runs ?? []).filter((run) => run.event === "merge_group");
	const active = mergeGroupRuns.some((run) => ACTIVE_RUN_STATUSES.has(run.status));
	if (active) return null;
	const newest = mergeGroupRuns.reduce((a, b) => (!a || Date.parse(b.updatedAt) > Date.parse(a.updatedAt) ? b : a), null);
	if (newest && now - Date.parse(newest.updatedAt) < staleMs) return null;
	return entries.reduce((head, entry) => (entry.position < head.position ? entry : head));
}

// A one-line description of a stalled head entry for the log. The API's pullRequest field is nullable, and an entry
// whose pull request cannot be read still blocks the queue: it is reported and left alone, never crashed on.
export function stallSummary(head) {
	const pr = head.pullRequest;
	return pr ? `#${pr.number} at position ${head.position}, mergeable=${pr.mergeable}` : `entry at position ${head.position}, pull request unknown`;
}

// What to do with the stalled head entry, from its PR's mergeable state. CONFLICTING is dequeued with a comment and
// never re-queued; MERGEABLE is re-queued; anything else (UNKNOWN, closed PR, unreadable PR) is left alone and only
// logged.
export function headPlan(pullRequest) {
	switch (pullRequest?.mergeable) {
		case "CONFLICTING":
			return { dequeue: true, enqueue: false, comment: true };
		case "MERGEABLE":
			return { dequeue: true, enqueue: true, comment: false };
		default:
			return null;
	}
}

// Whether prNumber was in the queue before and is gone after: the dequeue worked, whatever the mutation said.
export function confirmDequeued(beforeEntries, afterEntries, prNumber) {
	const was = beforeEntries.some((entry) => entry.pullRequest?.number === prNumber);
	const is = afterEntries.some((entry) => entry.pullRequest?.number === prNumber);
	return was && !is;
}

// Reads the flags: --repo (default $GITHUB_REPOSITORY), --stale-minutes (default 30), --dry-run. Returns null when a
// value is missing or malformed.
export function parseArgs(argv, env = {}) {
	const value = (flag) => {
		const at = argv.indexOf(flag);
		return at >= 0 ? argv[at + 1] : undefined;
	};
	const repo = value("--repo") ?? env.GITHUB_REPOSITORY;
	if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return null;
	const minutes = argv.includes("--stale-minutes") ? value("--stale-minutes") : undefined;
	if (argv.includes("--stale-minutes") && !/^\d+$/.test(minutes ?? "")) return null;
	return { repo, staleMs: minutes === undefined ? STALE_MS : Number(minutes) * 60 * 1000, dryRun: argv.includes("--dry-run") };
}

export function conflictComment(prNumber) {
	return [
		`The merge queue stalled behind #${prNumber}: it sat at the head of the queue with merge conflicts and no batch was ever built for it, so every PR behind it waited (https://github.com/flisk-sh/flisk/issues/5105).`,
		``,
		`I removed it from the merge queue. Please rebase onto the latest \`main\` (the conflicts were with files on main), push, and enable auto-merge again — once the checks pass, the PR rejoins the queue on its own.`,
		``,
		`_Posted by the shared stalled-merge-queue workflow (flisk-sh/.github)._`,
	].join("\n");
}

const gh = (args) => execFileSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

// dequeuePullRequest can report "Failed to remove PR from the merge queue" after removing the PR, so that error is
// not treated as a failure here; the caller re-reads the queue and confirms with confirmDequeued.
export const DEQUEUE_MUTATION = "mutation($id:ID!){dequeuePullRequest(input:{id:$id}){clientMutationId}}";
export const ENQUEUE_MUTATION = "mutation($id:ID!){enqueuePullRequest(input:{pullRequestId:$id}){mergeQueueEntry{position}}}";
export const QUEUE_QUERY =
	"query($owner:String!,$name:String!,$branch:String!){repository(owner:$owner,name:$name){mergeQueue(branch:$branch){entries(first:100){nodes{position state headCommit{oid} pullRequest{number id mergeable state}}}}}}";

export function dequeuePullRequest(repo, prId, run = gh) {
	try {
		run(["api", "graphql", "-f", `query=${DEQUEUE_MUTATION}`, "-F", `id=${prId}`]);
		return "dequeued";
	} catch (err) {
		if (/Failed to remove PR from the merge queue/.test(`${err.stderr ?? ""}${err.message ?? ""}`)) return "maybe-dequeued";
		throw err;
	}
}

export function enqueuePullRequest(repo, prId, run = gh) {
	run(["api", "graphql", "-f", `query=${ENQUEUE_MUTATION}`, "-F", `id=${prId}`]);
	return "enqueued";
}

// The queue's entries, [] when the branch has no merge queue.
export function listQueue(repo, branch, run = gh) {
	const [owner, name] = repo.split("/");
	const out = run(["api", "graphql", "-f", `query=${QUEUE_QUERY}`, "-F", `owner=${owner}`, "-F", `name=${name}`, "-F", `branch=${branch}`, "--jq", ".data.repository.mergeQueue.entries.nodes // []"]);
	return JSON.parse(out);
}

function defaultBranch(repo) {
	const out = gh(["api", `repos/${repo}`, "--jq", ".default_branch"]);
	return out.trim();
}

export function listMergeGroupRuns(repo, run = gh) {
	const out = run(["api", `repos/${repo}/actions/runs?event=merge_group&per_page=20`, "--jq", ".workflow_runs[] | {status, event, updatedAt: .updated_at}"]);
	const runs = [];
	for (const line of out.split("\n")) if (line.trim()) runs.push(JSON.parse(line));
	return runs;
}

function commentOnPr(repo, prNumber, body) {
	gh(["pr", "comment", String(prNumber), "--repo", repo, "--body", body]);
}

// Runs one stalled head through its plan. run, readQueue and comment are injectable for tests; dryRun only logs.
// beforeEntries is the queue snapshot taken before the dequeue, so the spurious dequeuePullRequest error can be
// distinguished from a real failure by re-reading the queue afterwards.
export function applyPlan({ repo, branch, beforeEntries, head, plan, dryRun = false, run = gh, readQueue = listQueue, comment = commentOnPr }) {
	const pr = head.pullRequest;
	const lines = [];
	if (plan.dequeue) {
		lines.push(`${dryRun ? "would dequeue" : dequeuePullRequest(repo, pr.id, run)} #${pr.number}`);
		if (!dryRun) {
			// the mutation's result is not trusted: re-read the queue and confirm the PR is gone
			const after = readQueue(repo, branch);
			if (!confirmDequeued(beforeEntries, after, pr.number)) throw new Error(`dequeue of #${pr.number} could not be confirmed in the queue`);
			lines.push(`confirmed: #${pr.number} is out of the queue`);
		}
	}
	if (plan.enqueue) {
		lines.push(`${dryRun ? "would enqueue" : enqueuePullRequest(repo, pr.id, run)} #${pr.number}`);
	}
	if (plan.comment) {
		const body = conflictComment(pr.number);
		lines.push(`${dryRun ? "would comment on" : "commenting on"} #${pr.number}`);
		if (!dryRun) comment(repo, pr.number, body);
	}
	return lines;
}

function main(argv) {
	const args = parseArgs(argv, process.env);
	if (!args) {
		console.error("usage: stalled-merge-queue.mjs --repo <owner/name> [--stale-minutes <n>] [--dry-run]");
		return 2;
	}
	const { repo, staleMs, dryRun } = args;
	const branch = defaultBranch(repo);
	const entries = listQueue(repo, branch);
	const head = stalledQueue({ entries, runs: listMergeGroupRuns(repo), now: Date.now(), staleMs });
	if (!head) {
		console.log(`merge queue on ${branch}: ${entries.length} entr(ies), no stall`);
		return 0;
	}
	const plan = headPlan(head.pullRequest);
	console.log(`merge queue on ${branch} stalled: ${stallSummary(head)}`);
	if (!plan) {
		console.log(`no action for mergeable=${head.pullRequest?.mergeable ?? "unknown"}`);
		return 0;
	}
	for (const line of applyPlan({ repo, branch, beforeEntries: entries, head, plan, dryRun })) console.log(line);
	return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
