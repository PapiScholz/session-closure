# Design rationale — why Phase 2 is a ladder, not a menu

This file records the measurement behind the current design of `session-closure` and the checks that
were run, so the decision doesn't have to be re-argued from scratch. The numbers come from about two
months of real use by the author across several projects.

## The question

*"Has session-closure actually saved time and tokens since it was created?"*

Answering it took two full audits: reading the skill-candidates registry row by row, counting memory
entries by type, grepping transcripts to see whether the skills it created were ever invoked again,
and checking on disk which hooks really existed. That cost was itself the first finding — and the
reason `~/.claude/closure-ledger.md` exists now.

## What the measurement showed

| What | Number |
|---|---|
| `skill-candidates.md` | 32 rows: 4 `created`, 9 `rejected`, **19 `candidate`** unresolved (59 % in limbo) |
| Reason for rejections | **9 of 9**: the RED didn't fail, or a subagent without the skill matched the recipe |
| Adoption of created skills | 13 invocations in 9 sessions · 3 · 1 · **zero** for the fourth |
| Skills respecting their own scope rule | 2 of 4: two single-project skills lived in the global palette |
| Registry size | 22,951 bytes, with a written "prune to ~60 lines" rule never applied |
| Hooks: real blocks counted in transcripts | 40, 9, 6, 5, 5 and 3 sessions for the six existing hooks |
| Mechanizations produced by closures | **zero** |
| hookify rules created since the plugin was enabled | **zero** |

Two more cracks: `Status` was terminal on paper but not in practice (a `rejected — do not repropose`
row picked up a 4th occurrence with no explanation, twice), and of 24 project memories only one came
from a closure — a correction *about the skill itself*.

## The diagnosis

The old Phase 2 destination table had eight rows and **all eight were text**. The author's own triage
in their global `CLAUDE.md` said the opposite: *mechanize the rule as a hook or a test first — it
leaves the file and stops depending on someone remembering to read it*, with compression last on
purpose. The skill could never choose step 1 because it wasn't on the menu.

The telling case: a lesson about raising a timeout instead of removing the waste had been documented
for three weeks, and the same mistake was made anyway — because the row lived in a file that is only
read **during the closure**, that is, afterwards.

The contrast sat next door: `mechanization-candidates.md`, which feeds a size guard on the global
`CLAUDE.md`, had 4 rules that enforced themselves and stayed alive. That file worked; the skill's
didn't.

## The change

The ladder (Phase 2 of `SKILL.md`) replaces the table: walk it in order and stop at the first level
that applies. Dropping a level is a cheap defeat; skipping the ones above is the failure the design
exists to stop.

What made the redesign viable was noticing that **mechanizing no longer costs a script**: the
`hookify` plugin accepts a rule as frontmatter + regex + message. Before, mechanizing cost 40-190
lines of hook code plus a `settings.json` registration, so writing a paragraph always won. With level
1a, mechanizing is **cheaper than documenting** — the missing incentive.

## Checks run the same day

1. **The hookify engine works.** A rule blocking Windows-style paths passed to `tar` in Git Bash
   returned `permissionDecision: deny` for the bad case; the POSIX variant and an unrelated command
   passed clean. **Four traps were found in the attempt**, without which a rule loads and never fires
   — they are in `references/mechanize.md`. The first version didn't fire because the frontmatter
   parser doesn't process escapes and `\\s` stayed literal: exactly the failure level 1a promises to
   avoid, found by watching it go red.

2. **The lesson-batching guard is registered and still bites.** 4 bullets to a `CLAUDE.md` without the
   marker → blocked; with `<!-- ROUTING-TABLE-EMITTED -->` → allowed. It is the one mechanism that
   backs this skill: without it, Phase 2.5 would be prose. It now ships inside the plugin.

3. **RED of the ladder** with three lessons already persisted from the session, to check that it
   doesn't send everything to the same place:

   | Lesson | Level | Why |
   |---|---|---|
   | Windows `C:/` path passed to `tar`/`scp` in Git Bash | **1a** | Unambiguous regex over `command` |
   | Text meant to be copied goes inline, not as an attachment | **6** | No signature: depends on what the user will do with it |
   | Use a separate user-data dir so tests don't touch the real DB | **4** | The testing runbook is the place; nothing in `tool_input` tells a test run from a real one |

   Three lessons, three different levels. Had all three landed on the same one, the rewrite would not
   have been accepted.

## What stays measured for next time

`SKILL.md` went from **19,009 to 11,283 bytes (−41 %)** with noticeably more functionality, in three
layers: `SKILL.md` is only the flow; the numbers and the why live here; and how to write a mechanism
lives in `references/mechanize.md`, read **only when a closure routed something to level 1 or 2**.
That is most of the saving: most closures never reach that level and don't pay for those lines.

If the ledger shows in a few months that the `Levels` column is still full of 4-6, the problem wasn't
the table and has to be looked for elsewhere.
