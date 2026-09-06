/**
 * The fixture suite: the only behavioural tests of the deterministic core.
 *
 * One directory per fixture at `fixtures/<skill>/<name>/`, holding `input.json`
 * and either `expected.json` (stdout must equal it, exit 0, stderr empty) or
 * `expected-error.json` (stderr must equal it, exit non-zero, stdout empty).
 * Every fixture runs through `npm run <skill> -- '<json>'`, the same
 * entrypoint that skill uses (ADR 0003 [ctc-decoder]); the skill directory is
 * what names the script, so nothing inside a fixture has to. Nothing is
 * tested below that seam. `lib/fixtures.ts` does the discovery.
 *
 * A fixture may also hold a `rules/` directory, or a `heuristics.yaml`. When it
 * does, the core reads that instead of the repository's own, which is how a
 * fixture exercises a document this repository does not ship: a rules file
 * missing a group, one carrying a catalogue entry that does not exist yet, or a
 * heuristics file whose thresholds differ — which is how "changing a threshold
 * changes what is flagged, with no code change" is shown rather than asserted
 * (ADR 0009, ADR 0006). Both variables are named for the CTC decoder because
 * they predate any other entrypoint, but the loader they steer
 * (`src/core/rules/files.ts`) is shared, so a fixture pinning `rules/` pins it
 * for whichever skill it belongs to.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { listFixtures, repositoryRoot } from "./lib/fixtures.ts";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function runCli(skill: string, inputJson: string, pinned: PinnedDocuments) {
  // Always set both variables, never inherit them: a fixture without its own
  // documents must read the repository's, whatever the surrounding shell says.
  const result = spawnSync(npm, ["run", "--silent", skill, "--", inputJson], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      CTC_DECODER_RULES_DIR: pinned.rules ?? "rules",
      CTC_DECODER_HEURISTICS_FILE: pinned.heuristics ?? "heuristics.yaml",
    },
  });
  if (result.error !== undefined) throw result.error;
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** The documents a fixture pins for itself, each falling back to the repository's. */
interface PinnedDocuments {
  rules?: string;
  heuristics?: string;
}

const fixtures = listFixtures();

test("there is at least one fixture", () => {
  assert.ok(fixtures.length > 0);
});

for (const { skill, label, directory, relative } of fixtures) {
  const input = readFileSync(join(directory, "input.json"), "utf8");
  const expectedPath = join(directory, "expected.json");
  const expectedErrorPath = join(directory, "expected-error.json");
  const pinned: PinnedDocuments = {
    ...(existsSync(join(directory, "rules")) ? { rules: `${relative}/rules` } : {}),
    ...(existsSync(join(directory, "heuristics.yaml"))
      ? { heuristics: `${relative}/heuristics.yaml` }
      : {}),
  };

  if (existsSync(expectedPath)) {
    test(`fixture ${label} decodes as expected`, () => {
      const expected: unknown = JSON.parse(readFileSync(expectedPath, "utf8"));
      const run = runCli(skill, input, pinned);
      assert.equal(run.stderr, "", "stderr must be empty on success");
      assert.equal(run.status, 0, "exit status must be 0 on success");
      assert.deepEqual(JSON.parse(run.stdout), expected);
    });
  } else if (existsSync(expectedErrorPath)) {
    test(`fixture ${label} is rejected as expected`, () => {
      const expected: unknown = JSON.parse(readFileSync(expectedErrorPath, "utf8"));
      const run = runCli(skill, input, pinned);
      assert.equal(run.stdout, "", "stdout must be empty on error");
      assert.notEqual(run.status, 0, "exit status must be non-zero on error");
      assert.deepEqual(JSON.parse(run.stderr), expected);
    });
  } else {
    test(`fixture ${label} names an expectation`, () => {
      assert.fail(`${label} has neither expected.json nor expected-error.json`);
    });
  }
}
