/**
 * The heuristics schema (ADR 0006). Two files hold the decoder's numbers, and
 * the whole point of splitting them is that a reader can tell law from opinion
 * by which file a number sits in. That guarantee is only as good as the two
 * schemas being opposites, so this checks the half the rules schema cannot:
 *
 * - every threshold carries a `rationale`, which is what stands in for a source;
 * - no threshold carries a `source` at any depth, because a URL here would be a
 *   statutory claim wearing an opinion's clothes — and it would pass every
 *   other check, since a source is exactly what the *other* schema demands.
 *
 * The repository's own file is checked too, so a threshold added without a
 * reason fails in CI rather than when a user asks for the flag it settles.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_HEURISTICS_FILE, loadHeuristics } from "../src/core/heuristics/file.ts";
import { HeuristicsFileError, loadHeuristicsDocument } from "../src/core/heuristics/loader.ts";

// Named explicitly: this checks the repository's own judgement, never a file a
// fixture or an ambient CTC_DECODER_HEURISTICS_FILE points at (ADR 0009).
const heuristics = loadHeuristics(DEFAULT_HEURISTICS_FILE);

test(`${DEFAULT_HEURISTICS_FILE} exists and loads`, () => {
  assert.ok(heuristics !== undefined, `${DEFAULT_HEURISTICS_FILE} is missing`);
});

test("every threshold in the repository's file gives a reason", () => {
  for (const [name, entry] of Object.entries(heuristics?.document.thresholds ?? {})) {
    assert.ok(
      entry.rationale.trim().length > 0,
      `thresholds.${name} carries no rationale, so nothing says why the number is where it is`,
    );
  }
});

test("a threshold without a rationale is refused", () => {
  assert.throws(
    () => loadHeuristicsDocument("thresholds:\n  variable_pay_share:\n    at_or_above_rate: 0.20\n"),
    (error: unknown) =>
      error instanceof HeuristicsFileError && error.code === "threshold_missing_rationale",
  );
});

test("a threshold carrying a source is refused", () => {
  assert.throws(
    () =>
      loadHeuristicsDocument(
        "thresholds:\n  variable_pay_share:\n    rationale: because\n    source: https://example.test\n",
      ),
    (error: unknown) =>
      error instanceof HeuristicsFileError && error.code === "threshold_carries_source",
  );
});

test("a source nested deeper inside a threshold is refused too", () => {
  assert.throws(
    () =>
      loadHeuristicsDocument(
        "thresholds:\n  variable_pay_share:\n    rationale: because\n    band:\n      source: https://example.test\n",
      ),
    (error: unknown) =>
      error instanceof HeuristicsFileError && error.code === "threshold_carries_source",
  );
});

test("a value outside any threshold is refused", () => {
  assert.throws(
    () => loadHeuristicsDocument("financial_year: 2026-27\nthresholds: {}\n"),
    (error: unknown) =>
      error instanceof HeuristicsFileError && error.code === "unknown_top_level_key",
  );
});

test("a rate is read as basis points, by the same path the rules file uses", () => {
  const document = loadHeuristicsDocument(
    "thresholds:\n  variable_pay_share:\n    rationale: because\n    at_or_above_rate: 0.205\n",
  );
  assert.equal(document.thresholds["variable_pay_share"]?.["at_or_above_rate"], 2050);
});
