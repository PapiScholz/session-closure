# How to write a mechanism (levels 1a and 1b)

Read only when Phase 2 routed a rule to level 1. Most closures never get here.

## Level 1a — hookify rule

Requires the official `hookify` plugin. If it isn't installed, go to level 1b (or suggest installing
it — the rule is then a few lines of frontmatter instead of a script).

Frontmatter + regex + the message you want to read when it fires. The plugin registers its own hooks
(`PreToolUse`, `PostToolUse`, `Stop`, `UserPromptSubmit`).

```
---
name: <slug>
enabled: true
event: bash | file | stop | prompt | all
action: block | warn          # default warn
pattern: <regex>
---
Message: what happened, why the error doesn't name it, and the way out.
```

Fields a condition can look at: `command`, `file_path`, `new_text`, `old_text`, `content`,
`user_prompt`. For more than one condition, `conditions:` with `field` / `operator` / `pattern`
(`regex_match`, `contains`, `equals`, `not_contains`, `starts_with`, `ends_with`), ANDed.

### Four traps — without them the rule loads and never fires

1. **The frontmatter parser doesn't process escapes.** The regex takes **single** backslashes (`\s`,
   `\b`). A `\\s` copied from a script stays literal and matches nothing.
2. **The glob is `.claude/hookify.*.local.md` relative to the CWD**: there is no global scope. A rule
   that applies across repos is **level 1b**, not 1a.
3. `event: bash` covers the **Bash** tool and `file` covers Edit/Write/MultiEdit. **Other shell tools
   (e.g. PowerShell on Windows) are not covered by any event.**
4. The engine **always exits 0** and blocks by returning `permissionDecision: deny` in its JSON: an
   internal error is swallowed and comes back green.

### The `.local` in the name

hookify requires it (its loader looks for that glob). It does **not** mean "personal to this
machine". Decide explicitly whether to commit it, and if the repo's `.gitignore` ignores other
`.local` files, say there why this one is kept — or the next person ignores it "for consistency" and
kills the guard.

### Testing it cold

No need to invoke the real tool; feed the payload to the executor:

```bash
export CLAUDE_PLUGIN_ROOT="$(ls -d ~/.claude/plugins/cache/*/hookify/*/ | tail -1)"
cd <repo with the rule>
echo '{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"<bad case>"}}' \
  | python3 "$CLAUDE_PLUGIN_ROOT/hooks/pretooluse.py"
```

Expected: `permissionDecision: deny` for the bad case, `{}` for the nearby legitimate case. **`{}` for
both = the rule didn't load or the regex doesn't match** — almost always trap 1.

Delegate the writing to `/hookify` with the signature and message already drafted.

## Level 1b — hook script

When a regex isn't enough (running a real parser, reading `transcript_path` to look at the last human
turn) **or** when the rule holds across more than one repo.

A cheap subagent (Sonnet/Haiku) writes it: it receives signature, pattern and event; it returns the
script, its tests and the RED result. Language: whatever the user's other hooks use (sh, node,
PowerShell); node or sh is the portable choice. Canonical shape:

- Read the raw JSON event from stdin; on parse error, exit 0.
- Exit 0 early and cheaply when it doesn't apply; filter on `tool_input.command` or `.file_path`.
- Block with `exit 2` + a message on stderr. Any other non-zero exit is a non-blocking error.
- The message says what happened, the concrete way out, and **that the command did NOT run**.
- Header comment with the real incident that motivated it, with a date.

Registration in `settings.json` (`hooks.PreToolUse` / `PostToolUse` with a `matcher`) can be done
with the built-in `update-config` skill. `PreToolUse` stops before; `PostToolUse` only detects after
(useful when the damage isn't visible in the input).

### Platform notes

- **Windows:** console output may mangle non-ASCII characters in stderr — keep block messages ASCII.
  A PowerShell hook is invoked as `powershell -NoProfile -File <path>`.
- **All platforms:** test with the exact payload shape the harness sends (`tool_name`, `tool_input`,
  `transcript_path`), not a hand-simplified one.

## Warn without blocking

`action: warn` in 1a, or `hookSpecificOutput.additionalContext` in a 1b script. This is the way out
for rules that would fall to text out of fear of false positives: a warning at the moment of risk is
worth more than a bullet read at the start of the session.

## Mandatory RED

Inject the case it must catch, watch it block, revert, and **also** try a nearby legitimate case to
rule out the false positive. A mechanism never seen red may not even be registered.
