// Fails if personal paths or private project names leak into the published plugin.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const PATTERNS = [
  /ezesc/i,
  /C:\\Users\\/i,
  /\bnandi\b/i,
  /\bsgg\b/i,
  /almac[eé]n/i,
  /macritex/i,
  /graphify/i,
  /# INVARIANTS/,
  /HEUR[IÍ]STICAS/i,
];
const ROOTS = [".claude-plugin", "skills", "hooks", "docs", "README.md", "CHANGELOG.md"];

function* walk(p) {
  if (statSync(p).isDirectory()) for (const e of readdirSync(p)) yield* walk(join(p, e));
  else yield p;
}

const hits = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    readFileSync(file, "utf8").split(/\r?\n/).forEach((line, i) => {
      for (const re of PATTERNS) if (re.test(line)) hits.push(`${file}:${i + 1}: ${re} -> ${line.trim()}`);
    });
  }
}
if (hits.length) {
  console.error(hits.join("\n"));
  process.exit(1);
}
console.log("No personal leftovers found.");
