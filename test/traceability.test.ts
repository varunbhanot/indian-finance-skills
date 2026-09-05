/**
 * Runs the traceability eval (ADR 0003, issue #15) over every recorded
 * transcript under `fixtures/transcripts/`. Needs no network and no model:
 * the transcripts are checked in, and `test/lib/traceability.ts` does the
 * checking. `fixtures/transcripts/README.md` documents what a transcript
 * holds and why.
 *
 * A directory named `broken-*` is not a recording at all: it exists only to
 * prove the eval fails when it should, so it is held to the opposite
 * expectation from every other transcript here. `EXPECTED_FAILURE` names the
 * one value each such fixture must be caught naming, so passing for the wrong
 * reason (an unrelated bug that also produces failures) is itself a failure.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { checkTranscript, describeFailures, type Transcript } from "./lib/traceability.ts";

const transcriptsRoot = join(resolve(import.meta.dirname, ".."), "fixtures", "transcripts");

/** The one value a `broken-*` fixture's failure must name, so the test does not pass by accident. */
const EXPECTED_FAILURE: Record<string, string> = {
  "broken-derived-figure": "₹6,00,000",
  "broken-uncited-url": "https://www.indiacode.nic.in/handle/123456789/not-actually-cited.pdf",
};

const names = readdirSync(transcriptsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

test("there is at least one transcript to check", () => {
  assert.ok(names.length > 0);
});

for (const name of names) {
  const transcript = JSON.parse(
    readFileSync(join(transcriptsRoot, name, "transcript.json"), "utf8"),
  ) as Transcript;

  if (name.startsWith("broken-")) {
    test(`transcript ${name} is caught by the eval`, () => {
      const failures = checkTranscript(transcript);
      const expected = EXPECTED_FAILURE[name];
      assert.ok(expected !== undefined, `${name} needs an entry in EXPECTED_FAILURE`);
      assert.ok(failures.length > 0, `expected the eval to fail ${name}, and it did not`);
      assert.ok(
        failures.some((failure) => failure.value === expected),
        `expected a failure naming ${expected}, got:\n${describeFailures(failures)}`,
      );
    });
    continue;
  }

  test(`transcript ${name} is traceable to its tool events`, () => {
    const failures = checkTranscript(transcript);
    assert.deepEqual(failures, [], describeFailures(failures));
  });
}
