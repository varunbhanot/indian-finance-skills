/**
 * Two invariants over every fixture's expected output, checked at the CLI seam
 * like everything else: they read `expected.json`, which is the exact stdout
 * `fixtures.test.ts` holds the decoder to, and nothing below it.
 *
 * A fixture can only assert its own output. These are the claims about *every*
 * output, and they are the two ADR 0007 rests on:
 *
 * 1. `sources` is the complete, deduplicated union of the documents cited
 *    anywhere in the output. If it were merely close, the narration's links
 *    would be a subset of what the figures actually rest on.
 * 2. Nothing in the output tells the reader what to do. The decoder states what
 *    is true and cites it; the words below are how a recommendation gets in, and
 *    they are absent by design rather than by habit.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const fixturesRoot = join(resolve(import.meta.dirname, ".."), "fixtures");

const outputs = readdirSync(fixturesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => ({ name: entry.name, path: join(fixturesRoot, entry.name, "expected.json") }))
  .filter((fixture) => existsSync(fixture.path))
  .map((fixture) => ({
    name: fixture.name,
    output: JSON.parse(readFileSync(fixture.path, "utf8")) as { sources?: unknown },
  }));

test("there is at least one decoded fixture to check", () => {
  assert.ok(outputs.length > 0);
});

for (const { name, output } of outputs) {
  test(`fixture ${name} lists every source it cites, and only those`, () => {
    const { sources, ...cited } = output;
    assert.deepEqual(sources, documentsIn(cited), "sources must be the union of the documents cited above it");
  });

  test(`fixture ${name} states facts and never a recommendation`, () => {
    for (const [path, text] of stringsIn(output, "")) {
      for (const advice of ADVISORY) {
        assert.ok(
          !advice.test(text),
          `${path} reads as advice, matching ${advice}: ${JSON.stringify(text.slice(0, 200))}`,
        );
      }
    }
  });
}

/**
 * The turns of phrase that carry a recommendation. Deliberately about wording
 * rather than intent, because that is what a test can hold: a sentence telling
 * the reader what to do has to reach for one of these, and none of them can
 * appear in a statement of what a rule says. `considerations` is a word two of
 * the rules file's statutory quotes use, so the boundary on `consider` matters.
 */
const ADVISORY = [
  /\byou should\b/i,
  /\brecommend/i,
  /\bsuggest/i,
  /\badvis(e|es|ed|able|ory|ice)\b/i,
  /\bconsider\b/i,
  /\bnegotiat/i,
  /\bask for\b/i,
  /\bpush for\b/i,
  /\bbetter off\b/i,
  /\bopt for\b/i,
  /\bought to\b/i,
  /\bmake sure\b/i,
  /\bideally\b/i,
  /\btoo (low|high|little|much)\b/i,
];

/** Every `{ title, url }` in a value, deduplicated by URL, in the order first met. */
function documentsIn(value: unknown): { title: string; url: string }[] {
  const byUrl = new Map<string, { title: string; url: string }>();
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node !== "object" || node === null) return;
    const { title, url } = node as { title?: unknown; url?: unknown };
    if (typeof title === "string" && typeof url === "string" && !byUrl.has(url)) {
      byUrl.set(url, { title, url });
    }
    for (const child of Object.values(node)) walk(child);
  };
  walk(value);
  return [...byUrl.values()];
}

/** Every string in a value, with the path it sits at, so a failure names the field. */
function* stringsIn(value: unknown, path: string): Generator<[string, string]> {
  if (typeof value === "string") {
    yield [path, value];
    return;
  }
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) yield* stringsIn(item, `${path}[${index}]`);
    return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, child] of Object.entries(value)) yield* stringsIn(child, `${path}.${key}`);
}
