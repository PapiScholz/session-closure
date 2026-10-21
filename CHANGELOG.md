# Changelog

## 1.0.1 — 2026-10-21

- Analysis reads every message the user typed, not only failed and repeated tool calls: a user
  correction is rework that leaves no error. Applies to compacted sessions and multi-session closures.

## 1.0.0 — 2026-10-13

First public release as a Claude Code plugin.

- `/session-closure:close` skill: analysis, destination ladder (levels 0-7), routing table,
  plain-language confirmation, mandatory RED for hooks and gates, skill-candidate registry, ledger.
- Bundled `lesson-batching-guard` PreToolUse hook (Node, cross-platform).
- Optional integration with hookify and superpowers/skill-creator; works without them.
