/**
 * CI schema check (ADR 0001, ADR 0002): every rules file on disk must load,
 * which means every leaf sits inside a group carrying `source` and
 * `retrieved`, every rate fits in basis points, and the file's declared
 * financial year matches its name.
 *
 * And one guarantee the loader cannot give, because it is about the file as a
 * whole rather than any one value (ADR 0015): every document a rules file cites
 * is titled, and titled once. The output's consolidated `sources` list names
 * each document it cites, so an untitled `source` could not reach the reader,
 * and one URL under two titles would reach them as whichever came first.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_RULES_DIRECTORY, listRulesFiles, loadRulesFile } from "../src/core/rules/files.ts";
import type { RulesDocument } from "../src/core/rules/loader.ts";

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

  test(`${file.path} titles every document it cites, exactly once`, () => {
    const titles = new Map<string, string>();
    for (const [key, { title, url }] of citedDocumentsIn(loadRulesFile(file).document)) {
      const already = titles.get(url);
      if (already === undefined) titles.set(url, title);
      else assert.equal(title, already, `${key} titles ${url} differently from an earlier citation`);
    }
  });
}

/**
 * Every `source` in a rules document, paired with the title of the paper it
 * points at: the value's own `title`, or the nearest enclosing one that titles
 * the same URL — which is exactly how `RulesNode.citation()` resolves it, so
 * this check fails on the same files the decoder would refuse, in CI rather
 * than at the moment a user asks for the figure.
 */
function citedDocumentsIn(document: RulesDocument): [string, { title: string; url: string }][] {
  const cited: [string, { title: string; url: string }][] = [];

  const walk = (value: unknown, key: string, enclosing: { title: string; url: string } | undefined): void => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${key}[${index}]`, enclosing));
      return;
    }
    if (typeof value !== "object" || value === null) return;

    const map = value as { [name: string]: unknown };
    const url = map["source"];
    const ownTitle = map["title"];
    const here =
      typeof ownTitle === "string" && typeof url === "string" ? { title: ownTitle, url } : enclosing;

    if (typeof url === "string") {
      assert.ok(
        here !== undefined && here.url === url,
        `${key} cites ${url} but nothing titles that document`,
      );
      cited.push([key, here]);
    }
    for (const [name, child] of Object.entries(map)) walk(child, `${key}.${name}`, here);
  };

  walk(document.groups, "groups", undefined);
  return cited;
}
