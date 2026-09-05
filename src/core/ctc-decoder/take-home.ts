/**
 * Steady-state take-home under the new regime, on two bases: variable pay at
 * zero, and variable pay at its quoted target.
 *
 * "Steady state" is what makes this derivable rather than listed. Every figure
 * here is built from recurring cash-now components — the ones the employee sees
 * again next year — so a one-time joining bonus, a retiral, a benefit in kind
 * and an equity grant are all outside it, and each is named in `excludes`
 * rather than quietly dropped.
 *
 * No rate, threshold or rounding unit is written here; all of them are read from
 * the rules file, and a rule the file does not carry stops the computation with
 * the key it wanted (CLAUDE.md). Rounding happens at exactly the two points the
 * statute names and nowhere else: total income to its unit before the slabs are
 * walked, and tax payable to its unit after the cess.
 */
import {
  annualise,
  applyRate,
  money,
  perMonth,
  roundToMultipleOfRupees,
  rupeesToPaise,
  type Money,
} from "../money.ts";
import type { Classification } from "./classification.ts";
import { RulesReader, type Citation, type RulesNode } from "./rules-reader.ts";
import { countsTowardGuaranteedRecurringCash, countsTowardRecurringCashAtTarget } from "./totals.ts";

/** How the employer computes the employee's provident fund contribution. */
export const PF_WAGE_BASES = ["full_basic", "statutory_ceiling"] as const;
export type PfWageBase = (typeof PF_WAGE_BASES)[number];

/** What the caller typed that only the take-home figures need. */
export interface TakeHomeRequest {
  pf_wage_base: PfWageBase;
  /** Annual professional tax in whole rupees, when the user knows their state's figure. */
  professional_tax?: number;
}

/** A decoded component reduced to what take-home needs. */
export interface TakeHomeComponent {
  name: string;
  annual_paise: number;
  classification: Classification;
  /** The catalogue entry that classified it, absent when the user classified it inline. */
  catalogue_entry?: string;
}

/** A figure and the period it belongs to, both stated, never one inferred from the other. */
export interface PeriodicMoney {
  annual: Money;
  monthly: Money;
}

export interface EmployeePf extends PeriodicMoney {
  basis: PfWageBase;
  /** The wage the rate was applied to, after the ceiling if the caller chose it. */
  wage: PeriodicMoney;
  /** The components the wage was summed from, by the name the user typed. */
  wage_components: string[];
  rate_basis_points: number;
  rate_rules_key: string;
  /** Present only when the ceiling was chosen, whether or not it bit. */
  ceiling?: { monthly: Money; applied: boolean; citation: Citation };
}

export interface SlabCharge {
  from: Money;
  /** Absent on the final slab, which has no upper bound. */
  upto?: Money;
  rate_basis_points: number;
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

export interface Rounded {
  before: Money;
  after: Money;
  unit_rupees: number;
  citation: Citation;
}

export interface IncomeTax {
  period: "annual";
  regime: "new";
  salary: Money;
  standard_deduction: { amount: Money; citation: Citation };
  total_income: Rounded;
  slabs: { charges: SlabCharge[]; total: Money; citation: Citation };
  rebate: Rebate;
  tax_after_rebate: Money;
  cess: { rate_basis_points: number; amount: Money; citation: Citation };
  tax_payable: Rounded;
}

export interface TakeHomeOnBasis {
  basis: "variable-pay-at-zero" | "variable-pay-at-target";
  gross_recurring_cash: PeriodicMoney & { components: string[] };
  deductions: {
    employee_pf: EmployeePf;
    professional_tax?: PeriodicMoney;
    income_tax: IncomeTax;
    total: PeriodicMoney;
  };
  take_home: PeriodicMoney;
}

export interface Exclusion {
  name: string;
  why: string;
}

export interface TakeHome {
  regime: "new";
  bases: TakeHomeOnBasis[];
  excludes: Exclusion[];
}

export function takeHomeFor(
  components: readonly TakeHomeComponent[],
  request: TakeHomeRequest,
  reader: RulesReader,
): TakeHome {
  const epf = reader.group("epf");
  const incomeTax = reader.group("income_tax");
  const rounding = reader.group("statutory_rounding");

  const employeePf = employeePfFor(components, request.pf_wage_base, epf);
  const professionalTax =
    request.professional_tax === undefined
      ? undefined
      : periodic(rupeesToPaise(request.professional_tax));

  const bases = [
    {
      basis: "variable-pay-at-zero" as const,
      included: countsTowardGuaranteedRecurringCash,
    },
    {
      basis: "variable-pay-at-target" as const,
      included: countsTowardRecurringCashAtTarget,
    },
  ].map(({ basis, included }) => {
    const counted = components.filter((component) => included(component.classification));
    const gross = sum(counted);
    const tax = incomeTaxFor(gross, incomeTax, rounding);
    const total = employeePf.annual.paise + (professionalTax?.annual.paise ?? 0) + tax.tax_payable.after.paise;
    return {
      basis,
      gross_recurring_cash: {
        ...periodic(gross),
        components: counted.map((component) => component.name),
      },
      deductions: {
        employee_pf: employeePf,
        ...(professionalTax === undefined ? {} : { professional_tax: professionalTax }),
        income_tax: tax,
        total: periodic(total),
      },
      take_home: periodic(gross - total),
    };
  });

  return { regime: "new", bases, excludes: excludesFor(request) };
}

/**
 * The employee's own provident fund contribution: the rules' employee rate on
 * the wage the rules name as its base, either in full or capped at the
 * statutory ceiling, per the caller's typed choice. The rules file says which
 * catalogue entries make up that wage, so no component type is named here
 * (ADR 0004).
 */
function employeePfFor(
  components: readonly TakeHomeComponent[],
  basis: PfWageBase,
  epf: RulesNode,
): EmployeePf {
  const wageEntries = new Set(epf.strings("wage_components"));
  const included = components.filter(
    (component) =>
      component.catalogue_entry !== undefined && wageEntries.has(component.catalogue_entry),
  );
  const fullWage = sum(included);

  const ceilingNode = epf.child("wage_ceiling");
  const ceilingMonthly = rupeesToPaise(ceilingNode.integer("monthly_rupees"));
  const ceilingAnnual = annualise(ceilingMonthly, "monthly");
  const capped = basis === "statutory_ceiling" && fullWage > ceilingAnnual;
  const wage = capped ? ceilingAnnual : fullWage;
  const rate = epf.rate("employee_rate");

  return {
    basis,
    wage: periodic(wage),
    wage_components: included.map((component) => component.name),
    rate_basis_points: rate,
    rate_rules_key: `${epf.key}.employee_rate`,
    ...(basis === "statutory_ceiling"
      ? {
          ceiling: {
            monthly: money(ceilingMonthly),
            applied: capped,
            citation: ceilingNode.citation(),
          },
        }
      : {}),
    ...periodic(applyRate(wage, rate)),
  };
}

function incomeTaxFor(salaryPaise: number, incomeTax: RulesNode, rounding: RulesNode): IncomeTax {
  const newRegime = incomeTax.child("new_regime");

  const standardDeductionNode = newRegime.child("standard_deduction");
  // Never more than the salary it is deducted from: a negative total income is
  // not a smaller tax bill, it is an arithmetic mistake.
  const standardDeduction = atMost(
    rupeesToPaise(standardDeductionNode.integer("amount")),
    salaryPaise,
  );

  const totalIncomeRule = rounding.child("total_income");
  const totalIncomeUnit = totalIncomeRule.integer("unit_rupees");
  const totalIncomeBefore = salaryPaise - standardDeduction;
  const totalIncome = roundToMultipleOfRupees(totalIncomeBefore, totalIncomeUnit);

  const slabsNode = newRegime.child("slabs");
  const charges = chargesFor(totalIncome, slabsNode);
  const taxBeforeRebate = charges.reduce((running, charge) => running + charge.tax.paise, 0);

  const rebateNode = newRegime.child("rebate");
  const rebateThreshold = rupeesToPaise(rebateNode.integer("total_income_threshold"));
  const rebateMaximum = rupeesToPaise(rebateNode.integer("maximum"));
  const rebateApplies = totalIncome <= rebateThreshold;
  const rebateAmount = rebateApplies ? atMost(rebateMaximum, taxBeforeRebate) : 0;
  const taxAfterRebate = taxBeforeRebate - rebateAmount;

  const cessNode = incomeTax.child("cess");
  const cessRate = cessNode.rate("rate");
  const cess = applyRate(taxAfterRebate, cessRate);

  const taxPayableRule = rounding.child("tax_payable");
  const taxPayableUnit = taxPayableRule.integer("unit_rupees");
  const taxAndCess = taxAfterRebate + cess;

  return {
    period: "annual",
    regime: "new",
    salary: money(salaryPaise),
    standard_deduction: {
      amount: money(standardDeduction),
      citation: standardDeductionNode.citation(),
    },
    total_income: {
      before: money(totalIncomeBefore),
      after: money(totalIncome),
      unit_rupees: totalIncomeUnit,
      citation: totalIncomeRule.citation(),
    },
    slabs: { charges, total: money(taxBeforeRebate), citation: slabsNode.citation() },
    rebate: {
      applied: rebateApplies,
      total_income_threshold: money(rebateThreshold),
      maximum: money(rebateMaximum),
      amount: money(rebateAmount),
      citation: rebateNode.citation(),
    },
    tax_after_rebate: money(taxAfterRebate),
    cess: { rate_basis_points: cessRate, amount: money(cess), citation: cessNode.citation() },
    tax_payable: {
      before: money(taxAndCess),
      after: money(roundToMultipleOfRupees(taxAndCess, taxPayableUnit)),
      unit_rupees: taxPayableUnit,
      citation: taxPayableRule.citation(),
    },
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
    const rate = band.rate("rate");
    charges.push({
      from: money(from),
      ...(upto === undefined ? {} : { upto: money(upto) }),
      rate_basis_points: rate,
      income_in_band: money(inBand),
      tax: money(applyRate(inBand, rate)),
    });
    if (upto === undefined) break;
    from = upto;
  }
  return charges;
}

/**
 * What this estimate does not attempt, named so the skill can say so rather than
 * letting a confident figure imply completeness. The professional tax entry
 * appears only when the user did not type one, since a typed figure is in the
 * breakdown instead.
 */
function excludesFor(request: TakeHomeRequest): Exclusion[] {
  return [
    {
      name: "HRA exemption",
      why: "Depends on rent actually paid and the city of residence, neither of which the offer letter states. The new regime does not allow it in any case.",
    },
    {
      name: "Chapter VI-A deductions",
      why: "Depend on the taxpayer's own investments and payments, not on the offer.",
    },
    {
      name: "Employer NPS deduction",
      why: "Available against the employer's contribution, which is a retiral rather than recurring cash and so sits outside this estimate.",
    },
    ...(request.professional_tax === undefined
      ? [
          {
            name: "Professional tax",
            why: "Levied by the state, not by the Union, and no figure was typed. Take-home here is that much too high.",
          },
        ]
      : []),
    {
      name: "Perquisite tax on vesting equity",
      why: "Arises on vest or exercise at slab rate, on a value this decoder refuses to guess (ADR 0005).",
    },
    {
      name: "Surcharge and marginal relief",
      why: "Not yet computed by this decoder; the tax shown is therefore too low above the first surcharge threshold.",
    },
    {
      name: "One-time components",
      why: "A joining bonus, relocation or retention bonus is taxable in the year it is paid, but this is the steady-state year.",
    },
    {
      name: "Benefits in kind and retirals",
      why: "Neither reaches the bank account as cash, and the tax on the taxable part of an employer contribution is not modelled.",
    },
  ];
}

function sum(components: readonly TakeHomeComponent[]): number {
  return components.reduce((running, component) => running + component.annual_paise, 0);
}

function periodic(annualPaise: number): PeriodicMoney {
  return { annual: money(annualPaise), monthly: money(perMonth(annualPaise)) };
}

function atMost(value: number, limit: number): number {
  return value > limit ? limit : value;
}
