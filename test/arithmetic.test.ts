/**
 * `divideSignedWithRemainder` is core arithmetic with no fixture of its own
 * (issue #64): nothing built yet calls it through a CLI seam, so it is
 * exercised here directly instead, the way `rules-loader.test.ts` exercises
 * the rules loader.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { divideSignedWithRemainder, divideWithRemainder } from "../src/core/arithmetic.ts";

test("a non-negative dividend divides exactly as divideWithRemainder does", () => {
  assert.deepEqual(divideSignedWithRemainder(7, 2), divideWithRemainder(7, 2));
  assert.deepEqual(divideSignedWithRemainder(0, 5), { quotient: 0, remainder: 0 });
});

test("a negative dividend divides its magnitude and reapplies the sign to both quotient and remainder", () => {
  assert.deepEqual(divideSignedWithRemainder(-7, 2), { quotient: -3, remainder: -1 });
});

test("a negative dividend that divides evenly leaves no signed remainder", () => {
  assert.deepEqual(divideSignedWithRemainder(-10, 5), { quotient: -2, remainder: 0 });
});

test("a balance rolled forward by a positive rate stays exact for a negative starting balance", () => {
  // The shape the IRR solver rolls a balance forward with: balance × (10000 + bp) ÷ 10000.
  const balance = -100_000;
  const bp = 800;
  const rolled = divideSignedWithRemainder(balance * (10_000 + bp), 10_000);
  assert.equal(rolled.quotient, -108_000);
});
