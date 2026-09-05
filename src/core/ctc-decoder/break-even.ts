/**
 * The break-even deduction (spec #17): the total Chapter VI-A and HRA
 * deductions at which the old regime's tax on this offer equals the new
 * regime's. Above it the old regime's tax is the lower of the two; below it
 * the new regime's is. It complements the two regimes' figures already beside
 * it in `take-home.ts` rather than replacing them (spec #11) — this is the
 * single number a reader can check against their own deductions instead of
 * reconstructing both regimes' arithmetic themselves.
 *
 * No new arithmetic is invented here. Both regimes' tax are computed by
 * `incomeTaxFor`, the same function `take-home.ts` calls, called at a reduced
 * salary: passing `grossPaise − deduction` in place of the salary reduces the
 * total income it derives by exactly that deduction, whatever the standard
 * deduction and rebate do with the result — including a deduction large
 * enough to make the reduced salary negative, which `incomeTaxFor` already
 * carries to a total income of zero rather than a negative one, so no floor
 * needs restating here.
 *
 * The old regime's tax is non-increasing in the deduction: more deducted
 * never raises it. That makes "the smallest deduction at which it no longer
 * exceeds the new regime's tax" findable by binary search, in rupees, over
 * `0 .. grossRupees` — the point beyond which the old regime's taxable income
 * is already exhausted and its tax already at its floor of zero. Three
 * outcomes follow from where that point lands:
 *
 * - it lands at zero: the old regime's tax is already at or below the new
 *   regime's without any additional deduction, so there is no positive
 *   threshold to report;
 * - it lands above zero and the two are exactly equal there: that is the
 *   break-even;
 * - it lands above zero but the old regime's tax has already dropped below
 *   the new regime's without ever landing on it exactly — the statutory
 *   rounding this file's own `roundStatutorily` performs, and the old
 *   regime's rebate cliff (a rupee either side of its threshold loses the
 *   whole rebate, not a sliver of it: see `rules/fy2026-27.yaml`'s note on
 *   `income_tax.old_regime.rebate`), can both make the old regime's tax skip
 *   straight past a value instead of passing through it. Either way, no
 *   deduction makes the two regimes' tax equal, and that is reported rather
 *   than the nearest number.
 */
import { divideWithRemainder } from "../arithmetic.ts";
import { money, rupeesToPaise, type Money } from "../money.ts";
import { incomeTaxFor } from "./income-tax.ts";
import type { RulesNode } from "./rules-reader.ts";
import type { Basis } from "./totals.ts";

export type BreakEvenDeduction =
  | { basis: Basis; kind: "deduction"; amount: Money; assumes: string[] }
  | { basis: Basis; kind: "old-regime-wins-at-zero"; assumes: string[] }
  | { basis: Basis; kind: "old-regime-never-wins"; assumes: string[] };

/**
 * The three atomic conditions `take-home.ts`'s `assumesFor` also names, kept
 * here rather than copied into it, so the two lists cannot silently drift
 * apart on a later change to either. `take-home.ts` imports the ones its own
 * `assumesFor` needs; this module's own `ASSUMES` below is all three, since
 * both regimes' slabs and rebate are read here — the old regime's age band
 * alongside the residency both regimes' rebates require.
 */
export const ASSUMES_BELOW_60 = "Below 60 years of age";
export const ASSUMES_RESIDENT_INDIVIDUAL = "A resident individual";
export const ASSUMES_STEADY_STATE = "Steady state: no one-time component";

/** Named, not explained: what has to be true for this figure to be the right one, for the skill to say out loud. */
const ASSUMES = [ASSUMES_BELOW_60, ASSUMES_RESIDENT_INDIVIDUAL, ASSUMES_STEADY_STATE];

export function breakEvenDeductionFor(
  basis: Basis,
  grossPaise: number,
  incomeTax: RulesNode,
  rounding: RulesNode,
): BreakEvenDeduction {
  const newTax = incomeTaxFor(grossPaise, incomeTax, rounding, "new").tax_payable.after.paise;
  const oldTaxAt = (deductionRupees: number): number =>
    incomeTaxFor(grossPaise - rupeesToPaise(deductionRupees), incomeTax, rounding, "old").tax_payable.after.paise;

  const grossRupees = divideWithRemainder(grossPaise, 100).quotient;
  const deduction = smallestAtOrBelow(newTax, grossRupees, oldTaxAt);

  if (deduction === 0) return { basis, kind: "old-regime-wins-at-zero", assumes: ASSUMES };
  if (oldTaxAt(deduction) === newTax) {
    return { basis, kind: "deduction", amount: money(rupeesToPaise(deduction)), assumes: ASSUMES };
  }
  return { basis, kind: "old-regime-never-wins", assumes: ASSUMES };
}

/**
 * The smallest deduction, in whole rupees, at which `oldTaxAt` no longer
 * exceeds `newTax` — found by binary search because `oldTaxAt` is
 * non-increasing in its argument, never because the two are known to meet
 * exactly there (`breakEvenDeductionFor` checks that separately). `hi` starts
 * at the whole gross salary, which is always a true bound: a deduction that
 * size drives the old regime's taxable income to zero, and its tax with it,
 * which cannot exceed a new-regime tax of zero or more.
 */
function smallestAtOrBelow(newTax: number, hi: number, oldTaxAt: (deductionRupees: number) => number): number {
  let lo = 0;
  let upper = hi;
  while (lo < upper) {
    const half = divideWithRemainder(upper - lo, 2).quotient;
    const mid = lo + half;
    if (oldTaxAt(mid) <= newTax) {
      upper = mid;
    } else {
      lo = mid + 1;
    }
  }
  return lo;
}
