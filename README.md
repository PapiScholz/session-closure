# session-closure

A Claude Code plugin for the end of a working session. Run `/session-closure:close` after you have
fixed a bug, finished a debugging cycle or completed a task. It does a short root-cause analysis,
then turns each lesson into the **cheapest mechanism that still enforces it**: a hook, a test, a
scoped rules file or a runbook entry. Adding another paragraph to `CLAUDE.md` is the last resort.

## Why

Lessons written as prose pile up in always-on files that nobody re-reads at the moment it matters.
So the plugin works toward one goal: **the number of things anyone has to remember should not grow
with experience.** It does that with a *destination ladder* that it walks in order, stopping at the
first level that applies:

| Level | Destination |
|---|---|
| 0 | Nothing: it already enforces itself |
| 1 | A hook ([hookify](https://github.com/anthropics/claude-plugins-official) rule or a script) |
| 2 | A test or gate in the repo |
| 3 | `~/.claude/rules/<topic>.md` (loaded only for matching files) |
| 4 | `<repo>/docs/<topic>.md` runbook |
| 5 | `<repo>/CLAUDE.md` |
| 6 | `~/.claude/CLAUDE.md` (with a size budget and eviction) |
| 7 | A new skill, proposed only after a failing baseline test |

Every hook or gate it proposes is tested first: the plugin injects the bad case, checks that the
mechanism blocks it, and checks that a similar legitimate case still passes. Nothing gets written
until you approve a plain-language summary of the changes. Changes that could block you later
(hooks, `settings.json`, new tests) each need their own explicit OK.

## Install

From the Claude plugin directory, once it is listed there. Or from this repository:

```bash
claude plugin marketplace add PapiScholz/session-closure
claude plugin install session-closure@papischolz
```

Then, at the end of a session:

```
/session-closure:close
```

## What it runs, reads and writes

This section is the full list of what the plugin does on your machine:

- **One hook**, `hooks/lesson-batching-guard.mjs`, registered as `PreToolUse` on `Edit|MultiEdit`.
  It reads the tool input that Claude Code passes on stdin. If an edit to a file named `CLAUDE.md`
  adds more than 3 bullets that look like lessons (`- **...`), it blocks the edit. You can let the
  edit through by including the marker `<!-- ROUTING-TABLE-EMITTED -->`. It runs locally, makes no
  network calls and writes nothing. It needs `node` on your `PATH`. Without `node` the hook errors,
  but it never blocks.
- **The skill** (`skills/close/SKILL.md`) asks Claude to read and append to these files in your
  home directory, creating them with a header if they're missing:
  - `~/.claude/closure-ledger.md`: one line per closure, used to check whether closures are
    producing automation or just text.
  - `~/.claude/mechanization-candidates.md`: rules that could become hooks, with a falsifiable
    reason why they haven't yet.
  - `~/.claude/skill-candidates.md`: repeated workflows that might become skills.
- On approval only, it edits the destinations in the ladder: your repo's `CLAUDE.md`/`docs/`/tests,
  `~/.claude/CLAUDE.md`, `~/.claude/rules/`, hook files and `settings.json`.
- To check whether past skills are actually used, it may grep your local session transcripts
  (`~/.claude/projects/**/*.jsonl`). It sends nothing anywhere.

## Optional companions

- **hookify** (official plugin): makes level 1 a few lines of frontmatter instead of a script.
  Without it, the skill writes a hook script.
- **superpowers** `writing-skills` or **skill-creator**: used for the baseline test before
  proposing a new skill, if you have them installed. Without them, the skill runs the baseline
  with a plain subagent.

## Development

```bash
node --test "tests/*.test.mjs"
claude plugin validate .
```

Design notes and the measurements that shaped the ladder: [docs/design-rationale.md](docs/design-rationale.md).

## License

[MIT](LICENSE)
