/**
 * The no-float lint (ADR 0002) must catch what it claims to, and the core
 * must pass it. `npm run lint` is the CI entrypoint; this test proves the
 * lint's teeth against a scratch file that breaks every rule.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "..");
const lintScript = join(repositoryRoot, "scripts", "lint-no-floats.ts");

function runLint(...directories: string[]) {
  return spawnSync(process.execPath, [lintScript, ...directories], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
}

test("src/core contains no floating-point arithmetic", () => {
  const result = runLint();
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("the lint reports every kind of floating-point use it forbids", () => {
  const directory = mkdtempSync(join(tmpdir(), "no-floats-"));
  writeFileSync(
    join(directory, "bad.ts"),
    [
      "export const literal = 0.5;",
      "export const exponent = 1e3;",
      "export const quotient = 10 / 4;",
      "export const power = 2 ** 3;",
      "export const rounded = Math.floor(3);",
      "export const parsed = parseFloat('1.5');",
      "export const converted = Number('12');",
      "export const unary = +'12';",
      "export const fixed = (1).toFixed(2);",
      "export const bigIntQuotient = 10n / 4n;",
      "export const okHex = 0x1e;",
      "export const okInt = parseInt('12', 10) * 3 % 2;",
    ].join("\n"),
  );
  const result = runLint(directory);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  const lines = result.stdout.trim().split("\n");
  const reported = lines.filter((line) => line.includes("bad.ts:")).map((line) => line.split(":")[1]);
  assert.deepEqual(reported, ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
});
