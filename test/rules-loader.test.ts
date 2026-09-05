import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRulesDocument, RulesFileError } from "../src/core/rules/loader.ts";

const header = "financial_year: 2026-27\n";

test("a rate written as a decimal fraction loads as integer basis points", () => {
  const doc = loadRulesDocument(
    header +
      `groups:
  epf:
    source: https://example.test/epf
    retrieved: 2026-09-05
    employee_rate: 0.12
    slabs:
      - upto: 300000
        rate: 0.05
      - upto: 700000
        rate: 0.1
`,
  );
  assert.equal(doc.financial_year, "2026-27");
  assert.deepEqual(doc.groups.epf, {
    source: "https://example.test/epf",
    retrieved: "2026-09-05",
    employee_rate: 1200,
    slabs: [
      { upto: 300000, rate: 500 },
      { upto: 700000, rate: 1000 },
    ],
  });
});

test("a whole-number rate of 1 loads as 10000 basis points", () => {
  const doc = loadRulesDocument(
    header +
      `groups:
  g:
    source: https://example.test
    retrieved: 2026-09-05
    rate: 1
`,
  );
  assert.equal(doc.groups.g?.rate, 10000);
});

test("a rate with more precision than basis points can hold is refused", () => {
  assert.throws(
    () =>
      loadRulesDocument(
        header +
          `groups:
  g:
    source: https://example.test
    retrieved: 2026-09-05
    rate: 0.00125
`,
      ),
    (e: unknown) =>
      e instanceof RulesFileError &&
      e.code === "rate_precision" &&
      e.path === "groups.g.rate",
  );
});

test("a rate written in exponent notation is refused", () => {
  assert.throws(
    () =>
      loadRulesDocument(
        header +
          `groups:
  g:
    source: https://example.test
    retrieved: 2026-09-05
    rate: 5e-2
`,
      ),
    (e: unknown) => e instanceof RulesFileError && e.code === "rate_format",
  );
});

test("a non-integer number that is not a rate is refused", () => {
  assert.throws(
    () =>
      loadRulesDocument(
        header +
          `groups:
  g:
    source: https://example.test
    retrieved: 2026-09-05
    ceiling: 15000.5
`,
      ),
    (e: unknown) =>
      e instanceof RulesFileError &&
      e.code === "non_integer_value" &&
      e.path === "groups.g.ceiling",
  );
});

test("a value outside any group is refused", () => {
  assert.throws(
    () =>
      loadRulesDocument(
        header +
          `cess_rate: 0.04
groups: {}
`,
      ),
    (e: unknown) =>
      e instanceof RulesFileError &&
      e.code === "value_outside_group" &&
      e.path === "cess_rate",
  );
});

test("a group without source is refused", () => {
  assert.throws(
    () =>
      loadRulesDocument(
        header +
          `groups:
  g:
    retrieved: 2026-09-05
    rate: 0.04
`,
      ),
    (e: unknown) =>
      e instanceof RulesFileError &&
      e.code === "group_missing_source" &&
      e.path === "groups.g",
  );
});

test("a group without retrieved date is refused", () => {
  assert.throws(
    () =>
      loadRulesDocument(
        header +
          `groups:
  g:
    source: https://example.test
    rate: 0.04
`,
      ),
    (e: unknown) =>
      e instanceof RulesFileError &&
      e.code === "group_missing_retrieved" &&
      e.path === "groups.g",
  );
});

test("a group whose source is not an https URL is refused", () => {
  assert.throws(
    () =>
      loadRulesDocument(
        header +
          `groups:
  g:
    source: from memory
    retrieved: 2026-09-05
    rate: 0.04
`,
      ),
    (e: unknown) =>
      e instanceof RulesFileError && e.code === "group_source_not_url",
  );
});

test("a group whose retrieved date is malformed is refused", () => {
  assert.throws(
    () =>
      loadRulesDocument(
        header +
          `groups:
  g:
    source: https://example.test
    retrieved: yesterday
    rate: 0.04
`,
      ),
    (e: unknown) =>
      e instanceof RulesFileError && e.code === "group_retrieved_not_date",
  );
});

test("effective dates are kept on the group when present", () => {
  const doc = loadRulesDocument(
    header +
      `groups:
  ltcg:
    source: https://example.test
    retrieved: 2026-09-05
    effective_from: 2026-07-23
    effective_to: 2027-03-31
    rate: 0.125
`,
  );
  assert.deepEqual(doc.groups.ltcg, {
    source: "https://example.test",
    retrieved: "2026-09-05",
    effective_from: "2026-07-23",
    effective_to: "2027-03-31",
    rate: 1250,
  });
});

test("a file with no groups loads", () => {
  const doc = loadRulesDocument(header + "groups: {}\n");
  assert.deepEqual(doc, { financial_year: "2026-27", groups: {} });
});

test("a missing financial_year is refused", () => {
  assert.throws(
    () => loadRulesDocument("groups: {}\n"),
    (e: unknown) =>
      e instanceof RulesFileError && e.code === "missing_financial_year",
  );
});

test("a top-level key other than financial_year and groups is refused", () => {
  assert.throws(
    () => loadRulesDocument(header + "groups: {}\nnotes: hi\n"),
    (e: unknown) =>
      e instanceof RulesFileError &&
      e.code === "value_outside_group" &&
      e.path === "notes",
  );
});
