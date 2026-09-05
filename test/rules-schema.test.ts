/**
 * CI schema check (ADR 0001, ADR 0002): every rules file on disk must load,
 * which means every leaf sits inside a group carrying `source` and
 * `retrieved`, every rate fits in basis points, and the file's declared
 * financial year matches its name.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_RULES_DIRECTORY, listRulesFiles, loadRulesFile } from "../src/core/rules/files.ts";

// Named explicitly: this checks the repository's own rules, never a directory a
// fixture or an ambient CTC_DECODER_RULES_DIR points at (ADR 0009).
const files = listRulesFiles(DEFAULT_RULES_DIRECTORY);

test("there is at least one rules file", () => {
  assert.ok(files.length > 0, "rules/ holds no fy<YYYY-YY>.yaml");
});

for (const file of files) {
  test(`${file.path} loads under the rules schema`, () => {
    assert.doesNotThrow(() => loadRulesFile(file));
  });
}
