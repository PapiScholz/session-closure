import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const GUARD = fileURLToPath(new URL("../hooks/lesson-batching-guard.mjs", import.meta.url));

function run(stdin) {
  const r = spawnSync(process.execPath, [GUARD], { input: stdin, encoding: "utf8" });
  return { code: r.status, stderr: r.stderr };
}

const bullets = (n) => Array.from({ length: n }, (_, i) => `- **lesson ${i}** (2026-10): rule ${i}`).join("\n");
const edit = (file_path, new_string) =>
  JSON.stringify({ hook_event_name: "PreToolUse", tool_name: "Edit", tool_input: { file_path, old_string: "x", new_string } });

test("blocks 4 bullets to CLAUDE.md without the marker", () => {
  const r = run(edit("/repo/CLAUDE.md", bullets(4)));
  assert.equal(r.code, 2);
  assert.match(r.stderr, /BLOCKED: this Edit adds 4/);
  assert.match(r.stderr, /did NOT run/);
});

test("allows 4 bullets when the routing-table marker is present", () => {
  const r = run(edit("/repo/CLAUDE.md", bullets(4) + "\n<!-- ROUTING-TABLE-EMITTED -->"));
  assert.equal(r.code, 0);
});

test("allows 3 bullets", () => {
  assert.equal(run(edit("/repo/CLAUDE.md", bullets(3))).code, 0);
});

test("ignores files that are not CLAUDE.md", () => {
  assert.equal(run(edit("/repo/docs/runbook.md", bullets(10))).code, 0);
});

test("matches CLAUDE.md case-insensitively and with Windows paths", () => {
  assert.equal(run(edit("C:\\Users\\me\\.claude\\claude.md", bullets(4))).code, 2);
});

test("counts CRLF content", () => {
  assert.equal(run(edit("/repo/CLAUDE.md", bullets(4).replace(/\n/g, "\r\n"))).code, 2);
});

test("sums bullets across MultiEdit edits", () => {
  const payload = JSON.stringify({
    tool_name: "MultiEdit",
    tool_input: {
      file_path: "/repo/CLAUDE.md",
      edits: [
        { old_string: "a", new_string: bullets(2) },
        { old_string: "b", new_string: bullets(2) },
      ],
    },
  });
  assert.equal(run(payload).code, 2);
});

test("plain bullets without bold are not lessons", () => {
  const plain = Array.from({ length: 6 }, (_, i) => `- item ${i}`).join("\n");
  assert.equal(run(edit("/repo/CLAUDE.md", plain)).code, 0);
});

test("fails open on malformed JSON and empty stdin", () => {
  assert.equal(run("{not json").code, 0);
  assert.equal(run("").code, 0);
});
