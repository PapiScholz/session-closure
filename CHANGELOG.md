# Changelog

## 1.2.0 — 2026-11-27

- Removed the bundled `lesson-batching-guard` hook: the Claude directory accepts script files only
  from Verified organizations. The plugin is now Markdown only. The routing table in Phase 2.5 is
  still required, and the skill offers the block as a level 1 rule for the user's own setup.
- CI checks run inline in the workflows instead of separate scripts.

## 1.1.0 — 2026-10-28

- The analysis starts with an inventory of the whole session, built from the transcript by a cheap
  subagent every time (before: only for compacted sessions). Five sources: failed or repeated calls,
  hook blocks and feedback, anomalous verification results, unrequested environment repairs, and user
  corrections. Every entry gets a verdict before the 3-rule cap applies.
- A second closure in the same session re-inventories the whole session instead of the stretch since
  the previous one.
- What was inventoried but not saved is shown to the user, one line each, including after "Nothing to
  save.". Why: `docs/design-rationale.md` § 1.1.0.

## 1.0.1 — 2026-10-21

- Analysis reads every message the user typed, not only failed and repeated tool calls: a user
  correction is rework that leaves no error. Applies to compacted sessions and multi-session closures.

## 1.0.0 — 2026-10-13

First public release as a Claude Code plugin.

- `/session-closure:close` skill: analysis, destination ladder (levels 0-7), routing table,
  plain-language confirmation, mandatory RED for hooks and gates, skill-candidate registry, ledger.
- Bundled `lesson-batching-guard` PreToolUse hook (Node, cross-platform).
- Optional integration with hookify and superpowers/skill-creator; works without them.
