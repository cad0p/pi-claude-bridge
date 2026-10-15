#!/usr/bin/env node
// Unit tests for forking CC's session when pi's history goes back to an earlier turn (tree-fork.ts).

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findForkPoint, fingerprint } from "../src/tree-fork.js";

let clock = 1000;
const user = (text) => ({ role: "user", content: [{ type: "text", text }], timestamp: clock++ });
const assistant = (text, stopReason = "stop") => ({ role: "assistant", content: [{ type: "text", text }], stopReason, timestamp: clock++ });
const toolResult = (id) => ({ role: "toolResult", toolCallId: id, content: [{ type: "text", text: "ok" }], timestamp: clock++ });

// CC's records for the same three turns: each prompt chains off whatever CC
// recorded last, which is not always the assistant message (here, an attachment).
const prompt = (uuid, parentUuid, text) => ({ type: "user", uuid, parentUuid, message: { role: "user", content: [{ type: "text", text }] } });
const reply = (uuid, parentUuid) => ({ type: "assistant", uuid, parentUuid, message: { role: "assistant", content: [{ type: "text", text: "r" }] } });
const attachment = (uuid, parentUuid) => ({ type: "attachment", uuid, parentUuid, attachment: { type: "total_tokens_reminder" } });

const u1 = user("one"), a1 = assistant("A"), u2 = user("two"), a2 = assistant("B"), u3 = user("three");
const synced = [u1, a1, u2, a2, u3].map(fingerprint);
const records = [
	prompt("p1", null, "one"), reply("r1", "p1"), attachment("x1", "r1"),
	prompt("p2", "x1", "two"), reply("r2", "p2"),
	prompt("p3", "r2", "three"),
];

describe("findForkPoint", () => {
	it("forks at the chain entry before the first dropped prompt", () => {
		assert.deepEqual(findForkPoint([u1, a1], synced, records), { uuid: "x1" });
		assert.deepEqual(findForkPoint([u1, a1, u2, a2], synced, records), { uuid: "r2" });
	});

	it("refuses a history that is not shorter than the synced one", () => {
		assert.match(findForkPoint([u1, a1, u2, a2, u3], synced, records).reason, /not shorter/);
	});

	it("refuses a history that is not a prefix of the synced one, such as a branch summary", () => {
		assert.match(findForkPoint([u1, user("summary of the branch")], synced, records).reason, /diverges/);
	});

	it("refuses a cut in the middle of a turn", () => {
		const call = assistant("calling", "toolUse");
		const result = toolResult("t1");
		const s = [u1, call, result, assistant("done"), u2].map(fingerprint);
		assert.match(findForkPoint([u1, call], s, records).reason, /mid-turn/);
		assert.match(findForkPoint([u1, call, result], s, records).reason, /mid-turn/);
	});

	it("refuses when CC's prompts do not match pi's, as when CC recorded a steer as an attachment", () => {
		const other = [prompt("p1", null, "something else"), reply("r1", "p1"), prompt("p2", "r1", "two")];
		assert.match(findForkPoint([u1, a1], synced, other).reason, /prompt 0 differs/);
	});

	it("refuses when CC's session does not reach the next prompt", () => {
		assert.match(findForkPoint([u1, a1], synced, records.slice(0, 3)).reason, /prompts, need more/);
	});

	it("skips tool-result records and sidechains when counting prompts", () => {
		const withTools = [
			prompt("p1", null, "one"),
			{ type: "user", uuid: "tr", parentUuid: "p1", message: { role: "user", content: [{ type: "tool_result", tool_use_id: "t", content: [] }] } },
			{ ...prompt("side", "tr", "a subagent prompt"), isSidechain: true },
			reply("r1", "tr"),
			prompt("p2", "r1", "two"),
		];
		assert.deepEqual(findForkPoint([u1, a1], synced, withTools), { uuid: "r1" });
	});
});
