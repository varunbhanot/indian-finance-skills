/**
 * A skill installed into another project can still reach its core (ADR 0020).
 *
 * `npx skills add varunbhanot/indian-finance-skills` copies a skill's directory
 * and nothing beside it, so the repository root that `npm run <name>` needs is
 * not there. Reaching the entrypoint through an npm install instead — a `bin`,
 * run via `npx` — does not work either: Node refuses to strip types from any
 * file resolved under `node_modules`, which is exactly where an npm install
 * puts one, and there is no flag to lift that. The route that actually works
 * is a plain `git clone` into a cache directory, outside any `node_modules`,
 * with `node <clone>/src/cli/<file>.ts '<json>'` run against it directly.
 *
 * So every `SKILL.md` that gives the repository-root form
 * (`npm run <name> -- ...`) must also give this second form, naming a real
 * file under `src/cli/` — a skill written only for the clone silently strands
 * everyone who installed it any other way.
 *
 * What this does not check: that the clone-and-run sequence actually succeeds
 * against the network. That needs git and the network, which CI runs without;
 * the fixtures already prove the file the command names behaves correctly
 * once reached.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const skillsRoot = join(repositoryRoot, ".claude", "skills");

const npmRunPattern = /npm run ([a-z0-9-]+)/;
const clonedNodePattern = /node ~?[^\s'"]*\/src\/cli\/([a-zA-Z0-9-]+\.ts)/;

for (const name of readdirSync(skillsRoot).sort()) {
  const skillFile = join(skillsRoot, name, "SKILL.md");
  if (!existsSync(skillFile)) continue; // the layout test reports that one

  const text = readFileSync(skillFile, "utf8");
  const npmRunMatch = npmRunPattern.exec(text);
  if (npmRunMatch === null) continue; // no CLI seam to check
  const npmRunName = npmRunMatch[1];

  test(`skill ${name} gives a clone-and-run form alongside its npm run form`, () => {
    const clonedMatch = clonedNodePattern.exec(text);
    assert.ok(
      clonedMatch !== null,
      `.claude/skills/${name}/SKILL.md gives "npm run ${npmRunName}" but never ` +
        `"node <clone>/src/cli/<file>.ts": that form has no repository root to run from once ` +
        `the skills CLI has copied this directory elsewhere, and an npm-installed copy cannot run ` +
        `its .ts source at all (Node refuses to strip types under node_modules) — see ADR 0020.`,
    );

    if (clonedMatch === null) return; // already reported by the assertion above
    const clonedFile = clonedMatch[1];
    assert.ok(clonedFile !== undefined, "regex has one capturing group, so a match always fills it");
    const file = join(repositoryRoot, "src", "cli", clonedFile);
    assert.ok(
      existsSync(file),
      `.claude/skills/${name}/SKILL.md names src/cli/${clonedFile} for the clone-and-run form, ` +
        `which does not exist`,
    );
  });
}

test("at least one skill documents the clone-and-run form", () => {
  const anyDocumented = readdirSync(skillsRoot).some((name) => {
    const skillFile = join(skillsRoot, name, "SKILL.md");
    return existsSync(skillFile) && clonedNodePattern.test(readFileSync(skillFile, "utf8"));
  });
  assert.ok(
    anyDocumented,
    "no SKILL.md documents reaching its core through a cached clone; this test would pass " +
      "vacuously if every skill dropped its npm run line, so this checks the positive case too",
  );
});
