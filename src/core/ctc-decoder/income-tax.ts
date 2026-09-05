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
 * Its own module because it is its own subject: the slabs, the rebate, the
 * surcharge and the cess are four rules that stack in one order, and that order
 * is the whole of what this file knows. The old and new regimes share every
 * step — only the rules group each reads from differs (`new_regime` or
 * `old_regime`) — so one function serves both, and a caller names which regime
 * it wants.
 *
 * The order the four are applied in: the slabs are walked, the rebate comes off
 * the tax, the surcharge is a percentage of what is left, the statute's own
 * ceiling caps the tax and surcharge together where the total income has only
 * just crossed a surcharge threshold, and the cess is charged on the two of them
 * as the rules file's own note on the cess requires. Rebate and surcharge never
 * meet in practice — under this rules file the rebate is gone long before the
 * first surcharge threshold — so the one place the order could be argued is one
 * the figures never reach.
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

/** The surcharge band a total income fell in, as the rules file states it. */
export interface SurchargeBand {
  above: Money;
  /** Absent on the final band, which has no upper bound. */
  upto?: Money;
  rate: Rate;
}

/**
 * The statute's ceiling on income-tax plus surcharge for a total income that has
 * only just crossed a surcharge threshold. Every term of the formula is carried,
 * because the ceiling is the whole explanation of the relief: it is the tax and
 * surcharge at the threshold, plus every rupee earned above it.
 */
export interface MarginalRelief {
  applied: boolean;
  /** The threshold the ceiling is measured from: the band's own lower bound. */
  threshold: Money;
  /** Income-tax and surcharge on the threshold amount itself. */
  tax_and_surcharge_at_threshold: Money;
  /** How far the total income runs above the threshold. */
  income_above_threshold: Money;
  /** The two above added: the ceiling on income-tax plus surcharge. */
  ceiling: Money;
  /** What the ceiling took off the surcharge; zero where the ceiling did not bite. */
  amount: Money;
  citation: Citation;
}

export interface Surcharge {
  band: SurchargeBand;
  /** The band's rate applied to the income-tax, before the ceiling. */
  before_relief: Money;
  marginal_relief: MarginalRelief;
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
  /** Absent below the first surcharge threshold, where the statute charges none. */
  surcharge?: Surcharge;
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

  const charging: ChargingRules = {
    slabs: regimeNode.child("slabs"),
    rebate: regimeNode.child("rebate"),
    surcharge: regimeNode.child("surcharge"),
  };
  const charged = chargeOn(totalIncome.after.paise, charging);

  const surcharge = surchargeFor(
    charged,
    totalIncome.after.paise,
    charging,
    incomeTax.child("marginal_relief"),
  );
  const taxAndSurcharge = charged.taxAfterRebate + (surcharge?.amount.paise ?? 0);

  const cessNode = incomeTax.child("cess");
  const cessRate = cessNode.rateBasisPoints("rate");
  const cess = applyRate(taxAndSurcharge, cessRate);

  return {
    period: "annual",
    regime,
    salary: money(salaryPaise),
    standard_deduction: {
      amount: money(standardDeduction),
      citation: standardDeductionNode.citation(),
    },
    total_income: totalIncome,
    slabs: {
      charges: charged.charges,
      total: money(charged.taxBeforeRebate),
      citation: charging.slabs.citation(),
    },
    rebate: {
      applied: charged.rebateApplied,
      total_income_threshold: money(charged.rebateThreshold),
      maximum: money(charged.rebateMaximum),
      amount: money(charged.rebateAmount),
      citation: charging.rebate.citation(),
    },
    tax_after_rebate: money(charged.taxAfterRebate),
    ...(surcharge === undefined ? {} : { surcharge }),
    cess: { rate: rate(cessRate), amount: money(cess), citation: cessNode.citation() },
    tax_payable: roundStatutorily(taxAndSurcharge + cess, rounding.child("tax_payable")),
  };
}

/** The three rules a total income is charged under, kept together because they are always read together. */
interface ChargingRules {
  slabs: RulesNode;
  rebate: RulesNode;
  surcharge: RulesNode;
}

/**
 * Everything a total income is charged before the cess: the slab walk, the
 * rebate off it, and the surcharge band it falls in with that band's rate on
 * what remains. Marginal relief needs exactly this for a second, hypothetical
 * total income — the threshold the real one has just crossed — so it is a
 * function of a total income and nothing else.
 */
interface Charge {
  charges: SlabCharge[];
  taxBeforeRebate: number;
  rebateThreshold: number;
  rebateMaximum: number;
  rebateApplied: boolean;
  rebateAmount: number;
  taxAfterRebate: number;
  /** Absent below the first threshold: the rules file's bands start above it. */
  band: BandMatch | undefined;
  surcharge: number;
}

function chargeOn(totalIncome: number, rules: ChargingRules): Charge {
  const charges = chargesFor(totalIncome, rules.slabs);
  const taxBeforeRebate = charges.reduce((running, charge) => running + charge.tax.paise, 0);

  const rebateThreshold = rupeesToPaise(rules.rebate.integer("total_income_threshold"));
  const rebateMaximum = rupeesToPaise(rules.rebate.integer("maximum"));
  const rebateApplied = totalIncome <= rebateThreshold;
  const rebateAmount = rebateApplied ? atMost(rebateMaximum, taxBeforeRebate) : 0;
  const taxAfterRebate = taxBeforeRebate - rebateAmount;

  const band = bandFor(totalIncome, rules.surcharge);
  return {
    charges,
    taxBeforeRebate,
    rebateThreshold,
    rebateMaximum,
    rebateApplied,
    rebateAmount,
    taxAfterRebate,
    band,
    surcharge: band === undefined ? 0 : applyRate(taxAfterRebate, band.rateBasisPoints),
  };
}

/**
 * The surcharge, with the statute's ceiling already applied, or nothing at all
 * where the total income reaches no band — the rules file's bands begin above
 * the first threshold, so a salary below it has no surcharge line rather than a
 * zero one.
 *
 * The ceiling is read from the total income at the band's own lower bound: the
 * rules file records that each regime's relief table measures from exactly the
 * `above` figures of that regime's surcharge bands, so the threshold is not a
 * second table to be encoded. Charging that threshold through the same three
 * rules is what makes "income-tax and surcharge on the threshold amount" mean
 * the same thing here as in the statute — at a threshold the band before it
 * applies, which is why the surcharge there is usually, but not always, nil.
 */
function surchargeFor(
  charged: Charge,
  totalIncome: number,
  rules: ChargingRules,
  marginalRelief: RulesNode,
): Surcharge | undefined {
  const band = charged.band;
  if (band === undefined) return undefined;

  const atThreshold = chargeOn(band.above, rules);
  const taxAndSurchargeAtThreshold = atThreshold.taxAfterRebate + atThreshold.surcharge;
  const incomeAboveThreshold = totalIncome - band.above;
  const ceiling = taxAndSurchargeAtThreshold + incomeAboveThreshold;
  const payable = charged.taxAfterRebate + charged.surcharge;
  const relieved = payable > ceiling ? payable - ceiling : 0;

  return {
    band: {
      above: money(band.above),
      ...(band.upto === undefined ? {} : { upto: money(band.upto) }),
      rate: rate(band.rateBasisPoints),
    },
    before_relief: money(charged.surcharge),
    marginal_relief: {
      applied: relieved > 0,
      threshold: money(band.above),
      tax_and_surcharge_at_threshold: money(taxAndSurchargeAtThreshold),
      income_above_threshold: money(incomeAboveThreshold),
      ceiling: money(ceiling),
      amount: money(relieved),
      citation: marginalRelief.citation(),
    },
    amount: money(charged.surcharge - relieved),
    citation: rules.surcharge.citation(),
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

/** A surcharge band as read from the rules file, in paise. */
interface BandMatch {
  above: number;
  upto?: number;
  rateBasisPoints: number;
}

/**
 * The first surcharge band the total income falls in, or nothing where it
 * reaches none. A band is written as the statute words it — the income must
 * *exceed* `above`, and not exceed `upto` where the band has one — so a total
 * income sitting exactly on a threshold belongs to the band below it, and one
 * sitting exactly on the first threshold belongs to no band at all.
 */
function bandFor(totalIncome: number, surcharge: RulesNode): BandMatch | undefined {
  for (const band of surcharge.items("bands")) {
    const above = rupeesToPaise(band.integer("above"));
    if (totalIncome <= above) continue;
    const uptoNode = band.optionalChild("upto");
    const upto = uptoNode === undefined ? undefined : rupeesToPaise(uptoNode.asInteger());
    if (upto !== undefined && totalIncome > upto) continue;
    return {
      above,
      ...(upto === undefined ? {} : { upto }),
      rateBasisPoints: band.rateBasisPoints("rate"),
    };
  }
  return undefined;
}

function atMost(value: number, limit: number): number {
  return value > limit ? limit : value;
}
