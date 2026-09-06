/**
 * `.claude/skills/` holds this project's finance skills and nothing else.
 *
 * This repository once carried 26 copies of `mattpocock/skills` in that
 * directory — general-purpose engineering tooling (TDD, triage, code review)
 * for whoever works *on* the repo. Claude Code loads every one of them for
 * whoever clones it, so someone who came for the CTC decoder got a slash menu
 * of 27 skills, one of which was about their offer letter. The tooling is the
 * maintainer's, not the project's; it is now loaded per person from Matt
 * Pocock's own plugin, and CONTRIBUTING.md says how.
 *
 * Deleting it once is not the same as keeping it out. A vendored skill arrives
 * by being copied in, and a copy is easy to make and easy to wave through in a
 * diff of a hundred added files. So the rule is a test rather than a note: a
 * skill in this repository is a real directory that describes itself, and
 * anything else in there fails here before it reaches main.
 *
 * The three shapes below are each a way a borrowed skill has actually shown up.
 * A symlink is the vendored layout this repository tried before deciding the
 * files should not be here at all. A `vendor/` directory is where those files
 * were staged. A skills-directory plugin (`.claude-plugin/plugin.json`) is the
 * layout that would namespace them as `/<plugin>:<skill>`, which loads at
 * project scope only after a workspace trust dialog Claude Code on the web
 * does not present — so it would also quietly take the finance skills' company
 * away in exactly the environment most people use.
 *
 * What this does not police: what a skill *says*. That is the traceability
 * eval's job (ADR 0003) and the output invariants' (ADR 0007). This asks only
 * whether the thing is ours.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, lstatSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const skillsRoot = join(repositoryRoot, ".claude", "skills");

/**
 * `readdir` without `withFileTypes`, because a `Dirent` for a symlink to a
 * directory answers `isDirectory()` differently across platforms. `lstat` is
 * the question we actually mean: what is the entry itself, not what it points
 * at.
 */
const entries = readdirSync(skillsRoot).sort();

test("there is at least one skill to check", () => {
  assert.ok(
    entries.length > 0,
    `${skillsRoot} is empty; this repository's reason to exist is the skills in it`,
  );
});

for (const name of entries) {
  const entry = join(skillsRoot, name);

  test(`skill ${name} is a real directory, not a link to borrowed tooling`, () => {
    const stats = lstatSync(entry);
    assert.ok(
      !stats.isSymbolicLink(),
      `.claude/skills/${name} is a symlink. A skill here is written for this project and lives here; ` +
        `a link points at something vendored in. Engineering tooling loads from its own plugin instead — see CONTRIBUTING.md.`,
    );
    assert.ok(stats.isDirectory(), `.claude/skills/${name} is not a directory`);
  });

  test(`skill ${name} describes itself`, () => {
    for (const required of ["SKILL.md", "README.md"]) {
      assert.ok(
        existsSync(join(entry, required)),
        `.claude/skills/${name}/${required} is missing. Every skill in this repository states what it does ` +
          `and what it will not do; a directory that cannot say so is not one of ours.`,
      );
    }
  });

  test(`skill ${name} is a skill and not a bundled plugin`, () => {
    assert.ok(
      !existsSync(join(entry, ".claude-plugin")),
      `.claude/skills/${name} carries a .claude-plugin manifest, which makes it a skills-directory plugin. ` +
        `Those load at project scope only after the workspace trust dialog, which Claude Code on the web does not present, ` +
        `so the skill would be missing there.`,
    );
  });
}

test("no vendored skill tree is checked in", () => {
  assert.ok(
    !existsSync(join(repositoryRoot, "vendor")),
    `vendor/ exists. Third-party skills are not vendored into this repository: they load per person from their own ` +
      `plugin, so that someone who clones this repo gets the finance skills and nothing else. See CONTRIBUTING.md.`,
  );
});
