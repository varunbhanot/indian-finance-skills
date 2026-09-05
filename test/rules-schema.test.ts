/**
 * CI schema check (ADR 0001, ADR 0002): every rules file on disk must load,
 * which means every leaf sits inside a group carrying `source` and
 * `retrieved`, every rate fits in basis points, and the file's declared
 * financial year matches its name.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { listRulesFiles, loadRulesFile } from "../src/core/rules/files.ts";

const files = listRulesFiles();

test("there is at least one rules file", () => {
  assert.ok(files.length > 0, "rules/ holds no fy<YYYY-YY>.yaml");
});

for (const file of files) {
  test(`${file.path} loads under the rules schema`, () => {
    assert.doesNotThrow(() => loadRulesFile(file));
  });
}
