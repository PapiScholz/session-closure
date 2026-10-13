#!/usr/bin/env node
// PreToolUse guard: block batching >3 lesson bullets into a CLAUDE.md in one Edit.
//
// Fires on Edit/MultiEdit whose file_path targets any CLAUDE.md (repo or global).
// Counts new bullets that look like lesson entries (lines starting with "- **").
// If >3 in a single tool call AND the marker "ROUTING-TABLE-EMITTED" is absent,
// block with exit 2 so the model redoes the /session-closure:close Phase 2.5
// routing table before writing.
//
// Escape hatch: include the literal `<!-- ROUTING-TABLE-EMITTED -->` in the
// new_string when the routing table was actually emitted this turn. The marker
// is honesty-based but has to be typed on purpose.
//
// Origin: dumping a whole session's lessons into one CLAUDE.md in a single Edit
// was the most common way closures turned into unread text.
//
// Local only: reads the hook event from stdin, writes to stderr, no network.

import { readFileSync } from "node:fs";

const MAX_BULLETS = 3;
const MARKER = "ROUTING-TABLE-EMITTED";
const BULLET = /^\s*-\s\*\*/;

function evaluate(event) {
  const input = event?.tool_input;
  const filePath = input?.file_path;
  if (typeof filePath !== "string" || !/CLAUDE\.md$/i.test(filePath)) return null;

  const chunks = [];
  if (typeof input.new_string === "string") chunks.push(input.new_string);
  if (Array.isArray(input.edits)) {
    for (const e of input.edits) {
      if (typeof e?.new_string === "string") chunks.push(e.new_string);
    }
  }
  if (chunks.length === 0) return null;

  const joined = chunks.join("\n");
  const bullets = joined.split(/\r?\n/).filter((l) => BULLET.test(l)).length;
  if (bullets <= MAX_BULLETS || joined.includes(MARKER)) return null;

  return [
    `BLOCKED: this Edit adds ${bullets} lesson-style bullets (- **...) to ${filePath} in one call. The edit did NOT run.`,
    "Batching >3 lessons into one destination is the failure mode /session-closure:close Phase 2.5 exists to stop.",
    "Do this:",
    "  1. Emit the per-rule routing table (| # | Rule | Level | Destination | Signature | Reason |) in the chat, one row per bullet.",
    `  2. Merge/drop until <=${MAX_BULLETS} rules survive.`,
    "  3. Split the remaining rules across their real destinations (hooks, tests, runbooks, other repos, None for duplicates).",
    "  4. Retry with the marker '<!-- ROUTING-TABLE-EMITTED -->' inside new_string once the table exists.",
  ].join("\n");
}

function main() {
  let event;
  try {
    event = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    process.exit(0);
  }
  const message = evaluate(event);
  if (!message) process.exit(0);
  process.stderr.write(message + "\n");
  process.exit(2);
}

main();
