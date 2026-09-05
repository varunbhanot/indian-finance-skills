/**
 * The invariant marginal relief exists to hold, checked through the CLI seam on
 * a sweep either side of every surcharge threshold in both regimes.
 *
 * A fixture is one input and its exact output, so it cannot express a claim
 * about *two* salaries — and the claim marginal relief is for is exactly that:
 * crossing a surcharge threshold must not cost more than it earns. This is the
 * invariant check that says it (CLAUDE.md), and it runs the same entrypoint the
 * fixtures do, one process per salary, asserting nothing below the seam.
 *
 * What it asserts, and where the statute stops:
 *
 * 1. Income-tax plus surcharge never rises by more than the total income does.
 *    That is the ceiling in Finance Act, 2026 s.3(5) and First Schedule Part I-B
 *    Paragraph F Table 2, and it is the whole of what they cap.
 * 2. Every rupee of the rest of the rise is the cess. The ceiling does not cover
 *    the cess (s.3(15) imposes it separately on tax as increased by surcharge),
 *    so take-home does still fall a little on crossing a threshold — by the cess
 *    on the income gained, and by nothing else. `fixtures/marginal-relief`'s
 *    README works one crossing through in rupees.
 *
 * The sweep is expensive — a process per salary — so it is deliberately narrow:
 * the pairs that actually straddle a threshold, not a dense range.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

/**
 * The thresholds, in whole rupees, that the rules file's surcharge bands begin
 * at. Written here rather than read from the rules, because a test that took its
 * boundaries from the file it is testing would move with it and stop checking
 * anything; the fixtures' READMEs carry the same figures from the statute.
 */
const THRESHOLDS = [5000000, 10000000, 20000000, 50000000];
/** How far above a threshold to look. Big enough to leave the relief band at the top end. */
const STEPS = [10, 250000, 2000000];
/** The standard deduction of each regime, so a gross salary can be aimed at a chosen total income. */
const STANDARD_DEDUCTION = { new: 75000, old: 50000 } as const;
const CESS_RATE_PERCENT = 4;

interface Charged {
  totalIncome: number;
  taxAndSurcharge: number;
  taxPayable: number;
}

function chargedAt(totalIncomeRupees: number, regime: "new" | "old"): Charged {
  const salary = totalIncomeRupees + STANDARD_DEDUCTION[regime];
  const offer = {
    financial_year: "2026-27",
    pf_wage_base: "full_basic",
    components: [{ name: "Basic", type: "basic", amount: salary, period: "annual" }],
  };
  const stdout = execFileSync(
    process.execPath,
    ["src/cli/ctc-decoder.ts", JSON.stringify(offer)],
    { encoding: "utf8" },
  );
  const decoded = JSON.parse(stdout);
  const under = decoded.take_home.regimes.find((one: { regime: string }) => one.regime === regime);
  const tax = under.bases[0].deductions.income_tax;
  return {
    totalIncome: tax.total_income.after.paise,
    taxAndSurcharge: tax.tax_after_rebate.paise + (tax.surcharge?.amount.paise ?? 0),
    taxPayable: tax.tax_payable.after.paise,
  };
}

for (const regime of ["new", "old"] as const) {
  for (const threshold of THRESHOLDS) {
    const at = chargedAt(threshold, regime);

    for (const step of STEPS) {
      test(`${regime} regime: crossing ₹${threshold} by ₹${step} costs no more than it earns`, () => {
        const above = chargedAt(threshold + step, regime);
        const earned = above.totalIncome - at.totalIncome;
        assert.ok(earned > 0, "the sweep must actually raise total income");

        // The statutory ceiling: income-tax and surcharge may rise by at most
        // the income did. Without marginal relief this fails by the whole
        // surcharge on the first rupee across.
        const charged = above.taxAndSurcharge - at.taxAndSurcharge;
        assert.ok(
          charged <= earned,
          `income-tax and surcharge rose by ${charged} paise on ${earned} paise of income`,
        );

        // And the rest of the rise is the cess on it, and nothing else — which
        // is why take-home falls a little across a threshold rather than not at
        // all. Both figures pass through the ₹10 rounding of tax payable, so
        // this is checked to within one rounding unit either way.
        const paid = above.taxPayable - at.taxPayable;
        const cess = (charged * CESS_RATE_PERCENT) / 100;
        assert.ok(
          Math.abs(paid - (charged + cess)) <= 1000,
          `tax payable rose by ${paid} paise; tax, surcharge and the cess on them account for ${charged + cess}`,
        );
      });
    }
  }
}
