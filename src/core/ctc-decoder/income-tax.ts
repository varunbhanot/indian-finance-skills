/**
 * Income tax on a salary under either regime, for one financial year.
 *
 * Every rate, threshold and rounding unit is read from the rules file; nothing
 * statutory is written here, and a rule the file does not carry stops the
 * computation naming the key it wanted (CLAUDE.md). Rounding happens at exactly
 * the two points the rules file names — total income before the slabs are
 * walked, tax payable after the cess — and nowhere else, which is why the
 * figures either side of them keep their paise.
 *
 * Its own module because it is its own subject: surcharge is a separate
 * ticket that extends this computation, not the take-home assembly around it.
 * The old and new regimes share every step here — only the rules group each
 * reads from differs (`new_regime` or `old_regime`) — so one function serves
 * both, and a caller names which regime it wants.
 */
import {
  applyRate,
  money,
  rate,
  roundToMultipleOfRupees,
  rupeesToPaise,
  type Money,
  type Rate,
} from "../money.ts";
import type { Citation, RulesNode } from "./rules-reader.ts";

/** One band of the slab table, and what this income was charged in it. */
export interface SlabCharge {
  from: Money;
  /** Absent on the final band, which has no upper bound. */
  upto?: Money;
  rate: Rate;
  income_in_band: Money;
  tax: Money;
}

export interface Rebate {
  applied: boolean;
  total_income_threshold: Money;
  maximum: Money;
  amount: Money;
  citation: Citation;
}

/** A figure either side of a statutory rounding, with the rule that rounded it. */
export interface Rounded {
  before: Money;
  after: Money;
  unit_rupees: number;
  citation: Citation;
}

export type Regime = "new" | "old";

export interface IncomeTax {
  period: "annual";
  regime: Regime;
  salary: Money;
  standard_deduction: { amount: Money; citation: Citation };
  total_income: Rounded;
  slabs: { charges: SlabCharge[]; total: Money; citation: Citation };
  rebate: Rebate;
  tax_after_rebate: Money;
  cess: { rate: Rate; amount: Money; citation: Citation };
  tax_payable: Rounded;
}

export function incomeTaxFor(
  salaryPaise: number,
  incomeTax: RulesNode,
  rounding: RulesNode,
  regime: Regime,
): IncomeTax {
  const regimeNode = incomeTax.child(`${regime}_regime`);

  const standardDeductionNode = regimeNode.child("standard_deduction");
  // Never more than the salary it is deducted from, as the rules file's own
  // note records: a negative total income is not a smaller tax bill.
  const standardDeduction = atMost(
    rupeesToPaise(standardDeductionNode.integer("amount")),
    salaryPaise,
  );

  const totalIncome = roundStatutorily(salaryPaise - standardDeduction, rounding.child("total_income"));

  const slabsNode = regimeNode.child("slabs");
  const charges = chargesFor(totalIncome.after.paise, slabsNode);
  const taxBeforeRebate = charges.reduce((running, charge) => running + charge.tax.paise, 0);

  const rebateNode = regimeNode.child("rebate");
  const rebateThreshold = rupeesToPaise(rebateNode.integer("total_income_threshold"));
  const rebateMaximum = rupeesToPaise(rebateNode.integer("maximum"));
  const rebateApplies = totalIncome.after.paise <= rebateThreshold;
  const rebateAmount = rebateApplies ? atMost(rebateMaximum, taxBeforeRebate) : 0;
  const taxAfterRebate = taxBeforeRebate - rebateAmount;

  const cessNode = incomeTax.child("cess");
  const cessRate = cessNode.rateBasisPoints("rate");
  const cess = applyRate(taxAfterRebate, cessRate);

  return {
    period: "annual",
    regime,
    salary: money(salaryPaise),
    standard_deduction: {
      amount: money(standardDeduction),
      citation: standardDeductionNode.citation(),
    },
    total_income: totalIncome,
    slabs: { charges, total: money(taxBeforeRebate), citation: slabsNode.citation() },
    rebate: {
      applied: rebateApplies,
      total_income_threshold: money(rebateThreshold),
      maximum: money(rebateMaximum),
      amount: money(rebateAmount),
      citation: rebateNode.citation(),
    },
    tax_after_rebate: money(taxAfterRebate),
    cess: { rate: rate(cessRate), amount: money(cess), citation: cessNode.citation() },
    tax_payable: roundStatutorily(taxAfterRebate + cess, rounding.child("tax_payable")),
  };
}

/** Applies one rounding rule, reporting the figure either side of it and the rule itself. */
function roundStatutorily(paise: number, rule: RulesNode): Rounded {
  const unitRupees = rule.integer("unit_rupees");
  return {
    before: money(paise),
    after: money(roundToMultipleOfRupees(paise, unitRupees)),
    unit_rupees: unitRupees,
    citation: rule.citation(),
  };
}

/** One charge per band the income reaches, each showing the slice it was charged on. */
function chargesFor(totalIncome: number, slabs: RulesNode): SlabCharge[] {
  let from = 0;
  const charges: SlabCharge[] = [];
  for (const band of slabs.items("bands")) {
    const uptoRupees = band.optionalChild("upto");
    const upto = uptoRupees === undefined ? undefined : rupeesToPaise(uptoRupees.asInteger());
    const ceiling = upto === undefined ? totalIncome : atMost(upto, totalIncome);
    const inBand = ceiling > from ? ceiling - from : 0;
    const basisPoints = band.rateBasisPoints("rate");
    charges.push({
      from: money(from),
      ...(upto === undefined ? {} : { upto: money(upto) }),
      rate: rate(basisPoints),
      income_in_band: money(inBand),
      tax: money(applyRate(inBand, basisPoints)),
    });
    if (upto === undefined) break;
    from = upto;
  }
  return charges;
}

function atMost(value: number, limit: number): number {
  return value > limit ? limit : value;
}
