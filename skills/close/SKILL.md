---
name: close
description: Use when the user invokes /session-closure:close, or asks to close out, wrap up or run a retro on a session after a resolved problem, debug cycle or completed task — turns what the session taught into the cheapest mechanism that still enforces it (hook, gate, rules file, runbook, CLAUDE.md), instead of one more paragraph nobody reads.
---

# session-closure

**North star:** the number of things anyone has to **remember** should not grow with experience. Every
lesson ends up in the **lowest-friction place where it still binds**, and most of the time the right
answer is *"nowhere, because it already enforces itself"*.

Why it is designed this way, with the numbers: `docs/design-rationale.md` in the plugin repository.
You don't need it to run a closure.

**Language:** talk to the user in the language they are using. Rule text written to their files
follows the language already used in the destination file.

---

## Phase 1 · Analysis

### 1.0 · Inventory first, before any cap

Lessons are lost when the analysis picks *what to look at* before looking. So the first step is an
inventory of the **whole session** — not the last stretch, not "since the previous closure" — with
one line per event from each of these five sources:

| Source | What it looks like |
|---|---|
| Tool calls that failed or were repeated | non-zero exit, error result, same call twice |
| Hook blocks and hook feedback | a denied PreToolUse, a Stop hook that refused to end the turn, a guard's warning |
| Anomalous verification results | a subagent or check that came back red-but-not-really, flaky, "passed, but…" |
| Unrequested environment repairs | anything the agent ran to fix its own setup: regenerate, reinstall, restart, clear a cache |
| User corrections | "I don't get it", "that's not true", "why?", "give me the steps", "and?", a repeated request, a rejected proposal |

The last three leave **no failed tool call** behind, so a scan of errors alone misses them. A repair
the agent made in passing is the strongest signal of all: the environment broke once and will break
again.

Each inventory line ends in exactly one of: **→ rule** (goes on to the analysis below),
**→ level 0** (name the hook, gate or rule that already covers it), or **→ dropped** (a falsifiable
reason). No line is left without a verdict. The caps below apply **after** this, by merging lines of
the same class — never by not listing them.

**A second closure in the same session** inventories the whole session again and crosses it against
what the previous closure persisted (its ledger line, the files it wrote). Say the range in one line.
"Nothing new since the last closure" is only valid if the previous closure's inventory covered every
line.

**The inventory always comes from the transcript, never from memory.** Hand the session's `.jsonl`
(and any other session the closure covers) to a cheap subagent (Sonnet/Haiku, never the session
model) and ask it for all five sources explicitly — hook feedback and subagent reports are entries
too, not only `tool_result` errors and user messages. The agent that did the work is the worst judge
of what went wrong in it: by closing time, a repair it made in passing feels like progress, not like
a failure. Recalling the session instead of reading it is the single most common way a closure ends
in "Nothing to save" with lessons on the table. Only if no transcript is reachable, build it from
memory and say so in the range line.

### 1.1 · Analysis

120 words max. No narrative, no repeated context, no explaining the obvious.

**Root cause** — 1 line + category
`[environment | dependencies | configuration | architecture | data | tooling | interpretation | execution]`

**Wasted iterations** — max 3, taken from the inventory lines marked **→ rule**, merged by class,
`[assumption → error]`. *Zero failures ≠ nothing to report*: with no rework, switch the lens to
EFFICIENCY — up to 3 `[avoidable cost → cheaper alternative]`. With neither: `None material` — valid
only when every inventory line has a level-0 or dropped verdict. Never fabricate entries.

**Break point** — the exact change that resolved it: file / command / decision.

**Reusable rules (1-3)** — one per problem class. Imperative, verifiable, ≤ 12 words. Fewer is
better. **Each one carries its signature**, on a line below:

```
Signature: <pattern detectable in the tool_input>   →  candidate for mechanization
Signature: none — <why, in falsifiable form>        →  goes to text
```

Falsifiable = checkable ("a hook cannot read the user's turn"). *"It's complicated"* or *"needs
judgment"* without saying which judgment, no.

**Internal check** — does the root cause explain everything? does each rule stop its class from
coming back? does every inventory line have a verdict? what was learned and not persisted, and why?

---

## Phase 2 · The destination ladder

**Walk it in order and stop at the first level that applies.** These are not equivalent options:
dropping a level is a cheap defeat; skipping the ones above is the failure this exists to stop.

| Level | Destination | When |
|---|---|---|
| **0** | None — already enforced | Base behavior already does it (RED does not fail), or an existing hook/gate covers it |
| **1a** | `<repo>/.claude/hookify.<slug>.local.md` | The rule is **a regex over one event field** and the `hookify` plugin is installed. Zero code |
| **1b** | Hook script + registration in `settings.json` | Needs real logic (parsing, reading the transcript), **or** the rule holds across repos, **or** no hookify |
| **2** | Repo test / gate | Can be asserted over the file tree, the diff or the build |
| **3** | `~/.claude/rules/<topic>.md` | Cross-project mechanics tied to a file type; its `paths:` loads it on demand |
| **4** | `<repo>/docs/<topic>.md` | Episodic lesson of one repo. Append to the matching runbook |
| **5** | `<repo>/CLAUDE.md` | Invariant the agent needs in **every** session of that repo |
| **6** | `~/.claude/CLAUDE.md` | ≥2 distinct projects **and** doesn't fit 1-5. Requires eviction |
| **7** | New or existing skill | Not a rule: a repeatable **flow** of ≥3 steps. See Phase 4 |

**When in doubt, never an always-on file** — neither the global nor the repo `CLAUDE.md`: both load
every session and both have a ceiling. Doubt drops to `docs/<topic>.md` or to level 0.

**Has a signature but isn't mechanized today → still add a row to
`~/.claude/mechanization-candidates.md`**, with the falsifiable reason. That is what lets it be
refuted later: an "impossible" row can sit for days on a premise nobody verified.

**Eviction before level 6:** measure `~/.claude/CLAUDE.md` in bytes. Default budget **25,000 bytes,
hard ceiling 30,000** — use the user's own numbers if their file states a budget. Over budget, move
the oldest lesson-style bullet out (to a runbook or `docs/`) before adding. If it would cross the
ceiling, drop to `<repo>/CLAUDE.md` instead.

**If you routed anything to level 1 or 2, read `references/mechanize.md` now** — the hookify rule
format, the four traps without which it never fires, the shape of a hook script, how to test it
cold, and the RED. Don't read it earlier: most closures never reach that level.

---

## Phase 2.5 · Routing table (MANDATORY, PRE-EXECUTION)

**Before any Edit**, emit this table, one row per rule. No merging; if they all land in the same file
the reasoning still goes row by row — writing "same" is forbidden.

```
| # | Rule (≤10 words) | Level | Destination (exact path) | Signature | Reason (≤15 words) |
```

- [ ] **Rows ≤ 3.** If Phase 1 produced more, merge or drop here.
- [ ] Each rule in its own row (no two lessons separated by a comma).
- [ ] Every rule with `Signature: <pattern>` is at level 0-2, **or** the reason for skipping is written.
- [ ] **Two or more rules at level ≥4 → reread the `Signature` column.** Batching to text is the
      failure mode this phase exists to stop.
- [ ] Destination global `CLAUDE.md`: the ≥2 projects are named in the reason.
- [ ] A rule that duplicates something already in `~/.claude/CLAUDE.md` → destination `None`.

Backed by this plugin's `lesson-batching-guard` hook: it blocks an Edit that adds >3 bullets to any
`CLAUDE.md` in one call unless the `new_string` carries the literal marker
`<!-- ROUTING-TABLE-EMITTED -->`.

---

## Phase 2.6 · Explain it to the user (before writing anything)

To the user, **one line per change**, in plain language — no "level", "signature", "RED" or
"hookify":

```
N. <what changes> — you'll notice: <nothing / it stops you when… / it warns you when…>
```

Max 25 words per line, and **nothing else**: Phase 1, the routing table and the "Final output" block
are internal work, not shown unless asked. End with "OK?" and wait. Applies to **every**
destination.

**What was left out is shown too.** After the change lines, one line per inventory entry that ended
in level 0 or dropped: `- <what happened> — not saved: <already covered by X / reason>`. A closure
that saves nothing still shows this list ("Nothing to save." followed by it): a silent "Nothing to
save" gives the user no way to notice a missed lesson.

---

## Phase 3 · Execution

**Tiered human-in-the-loop**: everything goes through the Phase 2.6 summary and its OK; whatever can
block tomorrow additionally needs an explicit OK per item.

| What gets written | Regime |
|---|---|
| hookify rule `action: block`, hook script, `settings.json` change, new gate/test | **Ask for explicit OK** — it will block you tomorrow |
| New skill | **Ask for OK** (Phase 4) |
| hookify rule `action: warn` | 2.6 summary + OK |
| `rules/`, `docs/<topic>.md`, `<repo>/CLAUDE.md`, global `CLAUDE.md`, project memory | 2.6 summary + OK |

**Every level 1-2 mechanism goes through RED before it is accepted**: inject the case it must catch,
watch it block or fail, revert, and also try a nearby legitimate case to rule out a false positive.
A mechanism never seen red may not even be registered.

Anchors: runbook → append in its style with origin `(YYYY-MM)`; `<repo>/CLAUDE.md` → under
`## Lessons Learned`, `- **title** (YYYY-MM): rule`; `rules/<topic>.md` → only if the file ALREADY
exists and its `paths:` matches, a `##` section + `Seen: <project> <YYYY-MM>`; global `CLAUDE.md` →
under the section that holds cross-project rules (create `## Lessons` if there is none),
`**title**: rule`.

---

## Phase 4 · Coverage

The question is not *"does this deserve a skill?"* but **"does this already enforce itself?"**. A
purely conversational session → report `Coverage: none` and don't read the registry.

**1 · Candidates (0-2).** A flow of ≥3 steps, stable shape, executed by the agent this session,
re-runnable outside this context, not covered by an installed skill. Zero is the expected outcome.

**2 · RED runs FIRST**, before proposing anything: run the flow in a fresh subagent *without* the
proposed skill and see whether it fails. (If `superpowers:writing-skills` or `skill-creator` is
installed, use its RED procedure.) This is where proposals usually die: the recipe already lived in an
always-on `CLAUDE.md` and the base agent followed it. A RED that doesn't fail is `rejected` **with
evidence**.

**3 · Registry** `~/.claude/skill-candidates.md` (create it with the header below if missing).
Semantic matching — the slug is an anchor, not a matcher. Match → `Times`++ and append
`<project> <YYYY-MM-DD>`. No match → new `candidate` row.

```
| Slug | Flow (1 line) | Times | Seen | Status |
```

- **Byte cap: ≤ 12,000.** Prune the oldest `created`/`rejected` rows first.
- **A `candidate` that doesn't gain `Times` in 30 days → `rejected — did not recur`.**
- **A recurrence on a `rejected` row forces an explicit verdict**, not a loose note: *did it expose a
  failure mode the rejection's RED didn't cover?* Yes → back to `candidate`; no → stays `rejected`
  **with the reason it doesn't reopen**.

**4 · Maturity.** `Times ≥ 3`, or `≥ 2` in **distinct** projects (a renamed repo is ONE project).
Independent filter: if the flow depends on one repo's machinery — its scripts, its gates, its
vocabulary — it is repo-scoped even if you've seen something similar elsewhere.

**5 · Adoption of what already exists**, before proposing a new one: count real invocations by
grepping the session transcripts (`~/.claude/projects/**/*.jsonl`) for `"skill":"<slug>"`. A skill
created and never invoked is the same failure as a rule never read, only more expensive. Zero in 30
days → `created — no adoption`.

**6 · Scope and name.** 1 project → `<repo>/.claude/skills/<slug>/SKILL.md`; ≥2 →
`~/.claude/skills/<slug>/SKILL.md`. **One path only**: two copies register the same `/slash` from two
sources. The name is decided here, not inherited from the slug: repo-scoped **drops the project
prefix** (the repo is already the namespace); global **carries no project name**, verb first. Test:
*would you type it from memory in six months, standing in another repository?* Check for collisions.

**7 · Propose — max 1 per closure**, and only with RED red:

```
Mature skill candidate: <slug>   Seen: N times in M projects (<projects/dates>)
RED: failed at <what> — without the skill, the agent <did what wrong>
Scope: repo|global → <path>   ·   Invoked as: /<name>   ·   Why both: <1 line>
What it would automate: <2-3 lines>   ·   Skeleton: trigger, inputs, steps, output
Redundancy risk: <what already lives in CLAUDE.md/runbooks and why it still adds value>

Create it? (yes / no → rejected / change scope or name → tell me which)
```

Yes → write the skill at that one path (with `superpowers:writing-skills` or `skill-creator` if
installed); row to `created — <scope>: <path>`. No → `rejected` with a 1-line reason.

---

## Phase 5 · Ledger and loop

One append-only line in `~/.claude/closure-ledger.md` (create it with this header if missing):

```
| Date | Project | Rules | Levels | Mechanized | Tokens |
```

`Levels` is the north-star metric: if over the months the distribution doesn't shift toward 0/1/2,
closures are producing text, not automation.

**The loop:** re-evaluate **exactly one** `evaluated-not-mechanizable` row of
`~/.claude/mechanization-candidates.md`, oldest first, round-robin. One question: *is its reason
still true?* Harness capabilities change. If it still holds, update the date and move on.

`mechanization-candidates.md` header, if it has to be created:

```
| Rule | Signature | Status | Reason (falsifiable) | Date |
```

---

## Budget

- **Soft ceiling ~25k tokens** in the session itself. Subagents only for the named cases (the
  transcript inventory of Phase 1.0, a level-1b hook script, the skill RED of Phase 4), on
  Sonnet/Haiku — never inheriting the session model. The transcript inventory is not optional to
  save budget: it is the step that finds the lessons.
- **Registries on condition only**: `skill-candidates.md` only if Phase 4 found a candidate;
  `mechanization-candidates.md` only if some rule has a signature, or it's the loop's turn.

---

## Final output

```
Destination: [level + path]   ·   Justification: [≤15 words]
Rule persisted: [text or "None"]   ·   RED: [red verified / n/a]
---
Coverage: [<n> registered / proposed: <slug> / covered by /<skill> / none]
Ledger: [line written]   ·   Loop: [row re-evaluated, or none]
```
