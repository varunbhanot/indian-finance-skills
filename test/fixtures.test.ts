/**
 * The fixture suite: the only behavioural tests of the deterministic core.
 *
 * One directory per fixture under `fixtures/`, holding `input.json` and either
 * `expected.json` (stdout must equal it, exit 0, stderr empty) or
 * `expected-error.json` (stderr must equal it, exit non-zero, stdout empty).
 * Every fixture runs through `npm run ctc-decoder -- '<json>'`, the same
 * entrypoint the skill uses (ADR 0003). Nothing is tested below that seam.
 *
 * A fixture may also hold a `rules/` directory. When it does, the decoder reads
 * that directory instead of the repository's `rules/`, which is how a fixture
 * exercises a rules file this repository does not ship: one missing a group, or
 * one carrying a catalogue entry that does not exist yet (ADR 0009).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const fixturesRoot = join(repositoryRoot, "fixtures");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function runDecoder(inputJson: string, rulesDirectory?: string) {
  const result = spawnSync(npm, ["run", "--silent", "ctc-decoder", "--", inputJson], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env:
      rulesDirectory === undefined
        ? process.env
        : { ...process.env, CTC_DECODER_RULES_DIR: rulesDirectory },
  });
  if (result.error !== undefined) throw result.error;
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

const fixtureNames = readdirSync(fixturesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

test("there is at least one fixture", () => {
  assert.ok(fixtureNames.length > 0);
});

for (const name of fixtureNames) {
  const directory = join(fixturesRoot, name);
  const input = readFileSync(join(directory, "input.json"), "utf8");
  const expectedPath = join(directory, "expected.json");
  const expectedErrorPath = join(directory, "expected-error.json");
  const rulesDirectory = existsSync(join(directory, "rules"))
    ? `fixtures/${name}/rules`
    : undefined;

  if (existsSync(expectedPath)) {
    test(`fixture ${name} decodes as expected`, () => {
      const expected: unknown = JSON.parse(readFileSync(expectedPath, "utf8"));
      const run = runDecoder(input, rulesDirectory);
      assert.equal(run.stderr, "", "stderr must be empty on success");
      assert.equal(run.status, 0, "exit status must be 0 on success");
      assert.deepEqual(JSON.parse(run.stdout), expected);
    });
  } else if (existsSync(expectedErrorPath)) {
    test(`fixture ${name} is rejected as expected`, () => {
      const expected: unknown = JSON.parse(readFileSync(expectedErrorPath, "utf8"));
      const run = runDecoder(input, rulesDirectory);
      assert.equal(run.stdout, "", "stdout must be empty on error");
      assert.notEqual(run.status, 0, "exit status must be non-zero on error");
      assert.deepEqual(JSON.parse(run.stderr), expected);
    });
  } else {
    test(`fixture ${name} names an expectation`, () => {
      assert.fail(`${name} has neither expected.json nor expected-error.json`);
    });
  }
}
