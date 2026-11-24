// Copyright (c) 2026 Flisk Landscape
// SPDX-License-Identifier: MIT
// Unit tests for stalled-merge-queue: when a queue counts as stalled, what is done with its head, and that a
// dequeue is confirmed by re-reading the queue, not by trusting the mutation's result.
import assert from "node:assert/strict";
import test from "node:test";
import { applyPlan, confirmDequeued, conflictComment, DEQUEUE_MUTATION, dequeuePullRequest, ENQUEUE_MUTATION, enqueuePullRequest, headPlan, listMergeGroupRuns, listQueue, parseArgs, QUEUE_QUERY, stalledQueue, stallSummary, STALE_MS } from "./stalled-merge-queue.mjs";

const NOW = Date.parse("2026-11-22T10:06:00Z");

const entry = (position, prNumber, over = {}) => ({
	position,
	state: "QUEUED",
	headCommit: null,
	pullRequest: { number: prNumber, id: `PR_${prNumber}`, mergeable: "MERGEABLE", state: "OPEN", ...over.pullRequest },
	...over,
});

const mergeGroupRun = (id, status, updatedAt) => ({ id, status, event: "merge_group", updatedAt });

// The 2026-11-22 incident (flisk-sh/flisk#5105): 48 entries, position 1 gone, nothing has a headCommit, the last batch finished hours ago.
const INCIDENT_ENTRIES = [entry(2, 4792), entry(3, 4835), entry(4, 4941)];
const INCIDENT_RUNS = [mergeGroupRun(100, "completed", "2026-11-22T04:26:00Z")];

test("stalledQueue returns the head entry when entries have no batch, no run is active and the newest run is older than 30 minutes", () => {
	const head = stalledQueue({ entries: INCIDENT_ENTRIES, runs: INCIDENT_RUNS, now: NOW });
	assert.equal(head.pullRequest.number, 4792);
	assert.equal(head.position, 2);
});

test("stalledQueue returns nothing while a batch run is queued or in progress", () => {
	for (const status of ["queued", "in_progress"]) {
		const runs = [mergeGroupRun(101, status, "2026-11-22T10:05:00Z"), ...INCIDENT_RUNS];
		assert.equal(stalledQueue({ entries: INCIDENT_ENTRIES, runs, now: NOW }), null);
	}
});

for (const status of ["requested", "waiting", "pending"]) {
	test(`stalledQueue leaves the queue alone while a merge group run is ${status}`, () => {
		const runs = [mergeGroupRun(101, status, "2026-11-22T08:06:00Z"), ...INCIDENT_RUNS];
		assert.equal(stalledQueue({ entries: INCIDENT_ENTRIES, runs, now: NOW }), null);
	});
}

test("stalledQueue returns nothing for an empty queue", () => {
	assert.equal(stalledQueue({ entries: [], runs: INCIDENT_RUNS, now: NOW }), null);
	assert.equal(stalledQueue({ entries: [], runs: [], now: NOW }), null);
});

test("stalledQueue returns nothing when the newest merge_group run ended less than 30 minutes ago", () => {
	const runs = [mergeGroupRun(102, "completed", "2026-11-22T09:56:00Z")]; // 10 minutes before NOW
	assert.equal(stalledQueue({ entries: INCIDENT_ENTRIES, runs, now: NOW }), null);
});

test("stalledQueue returns nothing when any entry has a headCommit (a batch is building for it)", () => {
	const entries = [entry(1, 4792, { headCommit: "abc123" }), entry(2, 4835)];
	assert.equal(stalledQueue({ entries, runs: INCIDENT_RUNS, now: NOW }), null);
});

test("stalledQueue treats a queue with entries, no headCommit and no merge_group runs at all as stalled", () => {
	const head = stalledQueue({ entries: INCIDENT_ENTRIES, runs: [], now: NOW });
	assert.equal(head.pullRequest.number, 4792);
});

test("stalledQueue ignores non-merge_group runs when looking for activity and recency", () => {
	const runs = [
		{ id: 200, status: "in_progress", event: "pull_request", updatedAt: "2026-11-22T10:05:00Z" },
		mergeGroupRun(100, "completed", "2026-11-22T04:26:00Z"),
	];
	assert.equal(stalledQueue({ entries: INCIDENT_ENTRIES, runs, now: NOW }).pullRequest.number, 4792);
});

test("stalledQueue picks the lowest position as head, whatever the entry order", () => {
	const entries = [entry(5, 5001), entry(2, 4792), entry(9, 5010)];
	assert.equal(stalledQueue({ entries, runs: INCIDENT_RUNS, now: NOW }).position, 2);
});

test("stalledQueue honours a custom stale threshold", () => {
	const runs = [mergeGroupRun(100, "completed", "2026-11-22T09:50:00Z")]; // 16 minutes before NOW
	assert.equal(stalledQueue({ entries: INCIDENT_ENTRIES, runs, now: NOW }), null);
	assert.equal(stalledQueue({ entries: INCIDENT_ENTRIES, runs, now: NOW, staleMs: 10 * 60 * 1000 }).pullRequest.number, 4792);
	assert.equal(STALE_MS, 30 * 60 * 1000);
});

// The API's pullRequest field is nullable: an entry whose pull request cannot be read is still picked as the stalled
// head, so the log path in main must not dereference it before headPlan answers "no action".
test("stalledQueue can return a head with no pull request, and stallSummary describes it without crashing", () => {
	const orphan = entry(1, 0, { pullRequest: null });
	assert.equal(stalledQueue({ entries: [orphan, entry(2, 4792)], runs: INCIDENT_RUNS, now: NOW }), orphan);
	assert.equal(headPlan(orphan.pullRequest), null);
	assert.equal(stallSummary(orphan), "entry at position 1, pull request unknown");
});

test("stallSummary names the PR, its position and its mergeable state when there is one", () => {
	assert.equal(stallSummary(entry(2, 4792)), "#4792 at position 2, mergeable=MERGEABLE");
	assert.equal(
		stallSummary(entry(3, 4835, { pullRequest: { number: 4835, id: "PR_4835", mergeable: "UNKNOWN", state: "OPEN" } })),
		"#4835 at position 3, mergeable=UNKNOWN",
	);
});

test("headPlan dequeues a CONFLICTING head with a PR comment and never re-queues it", () => {
	assert.deepEqual(headPlan({ number: 4792, mergeable: "CONFLICTING" }), { dequeue: true, enqueue: false, comment: true });
});

test("headPlan re-queues (dequeue + enqueue) a MERGEABLE head with no batch", () => {
	assert.deepEqual(headPlan({ number: 4792, mergeable: "MERGEABLE" }), { dequeue: true, enqueue: true, comment: false });
});

test("headPlan leaves any other mergeable state alone", () => {
	for (const mergeable of ["UNKNOWN", undefined, null]) {
		assert.equal(headPlan({ number: 1, mergeable }), null);
	}
	assert.equal(headPlan(null), null);
});

test("confirmDequeued is true only when the PR was queued before and is gone after", () => {
	const before = INCIDENT_ENTRIES;
	const after = INCIDENT_ENTRIES.filter((e) => e.pullRequest.number !== 4792);
	assert.equal(confirmDequeued(before, after, 4792), true);
	assert.equal(confirmDequeued(before, INCIDENT_ENTRIES, 4792), false); // still queued: mutation failed for real
	assert.equal(confirmDequeued(after, after, 4792), false); // was never there
});

test("dequeuePullRequest does not throw on the spurious 'Failed to remove PR' error; other errors propagate", () => {
	const spurious = Object.assign(new Error("GraphQL error"), { stderr: 'errors: [{message:"Failed to remove PR from the merge queue"}]' });
	assert.equal(dequeuePullRequest("o/r", "PR_1", () => { throw spurious; }), "maybe-dequeued");
	assert.equal(dequeuePullRequest("o/r", "PR_1", () => "42\n"), "dequeued");
	assert.throws(() => dequeuePullRequest("o/r", "PR_1", () => { throw new Error("HTTP 500"); }), /HTTP 500/);
});

test("conflictComment asks for a rebase and explains why the PR left the queue", () => {
	const body = conflictComment(4792);
	assert.match(body, /#4792|4792/);
	assert.match(body, /rebase/i);
	assert.match(body, /merge queue/i);
	assert.match(body, /issues\/5105/);
});

// applyPlan with injected fakes: the dequeue mutation "fails" spuriously, but the re-read queue shows the PR gone.
test("applyPlan confirms a dequeue by re-reading the queue, not by trusting the mutation result", () => {
	const spurious = Object.assign(new Error("GraphQL error"), { stderr: "Failed to remove PR from the merge queue" });
	const calls = [];
	const run = (args) => {
		calls.push(args.join(" "));
		if (args.join(" ").includes("dequeuePullRequest")) throw spurious;
		return "";
	};
	const after = INCIDENT_ENTRIES.filter((e) => e.pullRequest.number !== 4792);
	const lines = applyPlan({
		repo: "o/r",
		branch: "main",
		beforeEntries: INCIDENT_ENTRIES,
		head: INCIDENT_ENTRIES[0],
		plan: { dequeue: true, enqueue: true, comment: true },
		run,
		readQueue: () => after,
		comment: (repo, number, body) => calls.push(`comment ${repo} ${number} ${body.length}`),
	});
	assert.ok(lines.some((l) => l.includes("maybe-dequeued #4792")));
	assert.ok(lines.some((l) => l.includes("confirmed: #4792 is out of the queue")));
	assert.ok(lines.some((l) => l.includes("enqueued #4792")));
	assert.ok(lines.some((l) => l.includes("commenting on #4792")));
	assert.ok(calls.some((c) => c.includes("enqueuePullRequest")));
	assert.ok(calls.some((c) => c.startsWith("comment o/r 4792")));
});

test("applyPlan throws when the PR is still in the queue after the dequeue", () => {
	const run = (args) => {
		if (args.join(" ").includes("dequeuePullRequest")) throw Object.assign(new Error("x"), { stderr: "Failed to remove PR from the merge queue" });
		return "";
	};
	assert.throws(
		() =>
			applyPlan({
				repo: "o/r",
				branch: "main",
				beforeEntries: INCIDENT_ENTRIES,
				head: INCIDENT_ENTRIES[0],
				plan: { dequeue: true, enqueue: false, comment: true },
				run,
				readQueue: () => INCIDENT_ENTRIES,
				comment: () => {},
			}),
		/could not be confirmed/,
	);
});

test("applyPlan in dry-run performs no mutations and no comments", () => {
	const calls = [];
	const lines = applyPlan({
		repo: "o/r",
		branch: "main",
		beforeEntries: INCIDENT_ENTRIES,
		head: INCIDENT_ENTRIES[0],
		plan: { dequeue: true, enqueue: true, comment: true },
		dryRun: true,
		run: (...args) => calls.push(args),
		readQueue: () => {
			throw new Error("must not re-read the queue in dry-run");
		},
		comment: () => {
			throw new Error("must not comment in dry-run");
		},
	});
	assert.equal(calls.length, 0);
	assert.ok(lines.some((l) => l.includes("would dequeue #4792")));
	assert.ok(lines.some((l) => l.includes("would enqueue #4792")));
	assert.ok(lines.some((l) => l.includes("would comment on #4792")));
});

test("applyPlan for a conflicting head dequeues and comments but never enqueues", () => {
	const calls = [];
	const after = INCIDENT_ENTRIES.filter((e) => e.pullRequest.number !== 4792);
	const lines = applyPlan({
		repo: "o/r",
		branch: "main",
		beforeEntries: INCIDENT_ENTRIES,
		head: entry(2, 4792, { pullRequest: { number: 4792, id: "PR_4792", mergeable: "CONFLICTING", state: "OPEN" } }),
		plan: headPlan({ number: 4792, mergeable: "CONFLICTING" }),
		run: (args) => {
			calls.push(args.join(" "));
			return "";
		},
		readQueue: () => after,
		comment: () => calls.push("comment"),
	});
	assert.ok(!calls.some((c) => c.includes("enqueuePullRequest")));
	assert.ok(calls.some((c) => c.includes("dequeuePullRequest")));
	assert.ok(calls.some((c) => c === "comment"));
	assert.ok(lines.some((l) => l.includes("commenting on #4792")));
});

test("parseArgs reads the repo, the stale threshold and dry-run; bad input gives null", () => {
	assert.deepEqual(parseArgs(["--repo", "o/r"]), { repo: "o/r", staleMs: STALE_MS, dryRun: false });
	assert.deepEqual(parseArgs(["--repo", "o/r", "--stale-minutes", "10", "--dry-run"]), { repo: "o/r", staleMs: 10 * 60 * 1000, dryRun: true });
	assert.equal(parseArgs([], { GITHUB_REPOSITORY: "o/r" }).repo, "o/r"); // falls back to the workflow's own repo
	assert.equal(parseArgs([]), null);
	assert.equal(parseArgs(["--repo", "not a repo"]), null);
	assert.equal(parseArgs(["--repo", "o/r", "--stale-minutes", "soon"]), null);
	assert.equal(parseArgs(["--repo", "o/r", "--stale-minutes"]), null);
});

// gh api graphql only accepts a query as `-f query=<text>`; a bare text is "invalid key" and every run would fail.
test("every GraphQL call passes its text as a query= field", () => {
	const seen = [];
	const run = (args) => {
		seen.push(args);
		return "[]";
	};
	listQueue("o/r", "main", run);
	enqueuePullRequest("o/r", "PR_1", run);
	dequeuePullRequest("o/r", "PR_1", run);
	assert.deepEqual(
		seen.map((args) => args[args.indexOf("-f") + 1]),
		[`query=${QUEUE_QUERY}`, `query=${ENQUEUE_MUTATION}`, `query=${DEQUEUE_MUTATION}`],
	);
});

test("listQueue passes owner, name and branch as variables and returns the entry nodes", () => {
	let args;
	const entries = listQueue("flisk-sh/flisk", "main", (a) => {
		args = a;
		return JSON.stringify(INCIDENT_ENTRIES);
	});
	assert.deepEqual(entries, INCIDENT_ENTRIES);
	for (const field of ["owner=flisk-sh", "name=flisk", "branch=main"]) assert.ok(args.includes(field), field);
	assert.match(args[args.indexOf("--jq") + 1], /mergeQueue\.entries\.nodes \/\/ \[\]/); // a branch with no queue gives []
});

test("the queue query reads headCommit with a subfield and the mutations select fields their payloads have", () => {
	assert.match(QUEUE_QUERY, /headCommit\{oid\}/);
	assert.match(DEQUEUE_MUTATION, /dequeuePullRequest\(input:\{id:\$id\}\)\{clientMutationId\}/);
	assert.match(ENQUEUE_MUTATION, /enqueuePullRequest\(input:\{pullRequestId:\$id\}\)\{mergeQueueEntry\{position\}\}/);
});

test("listMergeGroupRuns asks for merge_group runs and maps them to {status, event, updatedAt}", () => {
	let args;
	const runs = listMergeGroupRuns("o/r", (a) => {
		args = a;
		return '{"status":"completed","event":"merge_group","updatedAt":"2026-11-22T04:26:00Z"}\n\n{"status":"queued","event":"merge_group","updatedAt":"2026-11-22T05:00:00Z"}\n';
	});
	assert.equal(runs.length, 2);
	assert.equal(runs[1].status, "queued");
	assert.match(args[1], /^repos\/o\/r\/actions\/runs\?event=merge_group/);
	assert.match(args[args.indexOf("--jq") + 1], /updatedAt: \.updated_at/); // a bare `updated_at` is a jq function call
});
