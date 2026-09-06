/**
 * A skill installed into another project can still reach its core (ADR 0020).
 *
 * `npx skills add varunbhanot/indian-finance-skills` copies a skill's directory
 * and nothing beside it, so the repository root that `npm run <name>` needs is
 * not there. The route that works from anywhere is the package's `bin`:
 * `npx --yes --package=github:varunbhanot/indian-finance-skills <name> '<json>'`.
 * Three things have to hold for that, and each is easy to forget when adding a
 * skill, so each is a test rather than a note:
 *
 *   1. every entrypoint in `src/cli/` is declared as a `bin` in `package.json`,
 *      and every `bin` points at a file that exists there;
 *   2. every bin file starts with `#!/usr/bin/env node`, which is what lets npm
 *      link it and the shell hand it to Node;
 *   3. every `SKILL.md` names its bin through the `--package=github:...` form,
 *      so the skill is not written for the clone alone.
 *
 * What this does not check: that the git install itself succeeds. That needs
 * the network, and CI runs without it; the fixtures already prove the file the
 * bin points at, and `npm install` from a path proves the link.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const packageSpec = "github:varunbhanot/indian-finance-skills";
const shebang = "#!/usr/bin/env node";

const manifest = JSON.parse(readFileSync(join(repositoryRoot, "package.json"), "utf8")) as {
  bin?: unknown;
};

test("package.json declares its bins as a name-to-path object", () => {
  assert.ok(
    typeof manifest.bin === "object" && manifest.bin !== null && !Array.isArray(manifest.bin),
    `package.json has no "bin" object. A skill installed by the skills CLI reaches the core through ` +
      `npx --package=${packageSpec} <bin>, and there is no bin to reach — see ADR 0020.`,
  );
});

const bins = new Map(
  Object.entries((manifest.bin ?? {}) as Record<string, string>).sort(([a], [b]) =>
    a.localeCompare(b),
  ),
);

for (const [name, path] of bins) {
  test(`bin ${name} points at an entrypoint under src/cli/ that begins with a shebang`, () => {
    assert.ok(
      path.startsWith("src/cli/"),
      `bin ${name} is ${path}; entrypoints live in src/cli/ (CLAUDE.md, Tooling)`,
    );
    const file = join(repositoryRoot, path);
    assert.ok(existsSync(file), `bin ${name} names ${path}, which does not exist`);
    const firstLine = readFileSync(file, "utf8").split("\n", 1)[0];
    assert.equal(
      firstLine,
      shebang,
      `${path} must start with "${shebang}": npm links the bin to this file and the shell needs ` +
        `the line to hand it to Node. Without it the installed skill's command fails before Node runs.`,
    );
  });
}

test("every entrypoint in src/cli/ is a bin", () => {
  const entrypoints = readdirSync(join(repositoryRoot, "src", "cli"))
    .filter((name) => name.endsWith(".ts"))
    .sort();
  const declared = new Set(bins.values());
  for (const name of entrypoints) {
    const path = `src/cli/${name}`;
    assert.ok(
      declared.has(path),
      `${path} is not a bin in package.json, so a skill installed outside the repository cannot ` +
        `reach it. Add "<name>": "${path}" under "bin" — see ADR 0020.`,
    );
  }
});

const skillsRoot = join(repositoryRoot, ".claude", "skills");
for (const name of readdirSync(skillsRoot).sort()) {
  const skillFile = join(skillsRoot, name, "SKILL.md");
  if (!existsSync(skillFile)) continue; // the layout test reports that one

  test(`skill ${name} names its bin through the npx form, not the clone's npm run alone`, () => {
    const text = readFileSync(skillFile, "utf8");
    const named = [...bins.keys()].filter((bin) =>
      text.includes(`--package=${packageSpec} ${bin} `),
    );
    assert.ok(
      named.length > 0,
      `.claude/skills/${name}/SKILL.md never says ` +
        `"npx --yes --package=${packageSpec} <bin> '<json>'" for any bin in package.json ` +
        `(${[...bins.keys()].join(", ")}). The skills CLI copies this directory and nothing beside it, ` +
        `so "npm run" from the repository root has nowhere to run — see ADR 0020.`,
    );
  });
}
