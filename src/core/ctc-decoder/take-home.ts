/**
 * Steady-state take-home under the new regime, on two bases: variable pay at
 * zero, and variable pay at its quoted target.
 *
 * "Steady state" is what makes this derivable rather than listed. Every figure
 * is built from recurring cash-now components — the ones the employee sees
 * again next year — so a one-time joining bonus, a retiral, a benefit in kind
 * and an equity grant are all outside it, and each is named in `excludes`
 * rather than quietly dropped.
 *
 * `excludes` carries names and nothing else. What each exclusion means, and
 * what it costs the reader, is the skill's to say: the core classifies, the
 * skill narrates (CLAUDE.md's two-layer rule). The caveats that are statutory
 * — that the rebate needs a resident individual, that the rules file's rebate
 * has a marginal relief this does not compute — travel instead as the `note` on
 * the citation beside the figure they qualify, sourced rather than recalled.
 */
import { annualise, applyRate, money, perMonth, rate, rupeesToPaise, type Money, type Rate } from "../money.ts";
import type { Classification } from "./classification.ts";
import { incomeTaxFor, type IncomeTax } from "./income-tax.ts";
import { rulesGroup, type Citation, type RulesNode } from "./rules-reader.ts";
import type { RulesFile } from "../rules/files.ts";
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

export interface EmployeePf {
  basis: PfWageBase;
  /** The contribution itself: the rate applied to the wage below. */
  contribution: PeriodicMoney;
  /** The wage the rate was applied to, after the ceiling if the caller chose it. */
  wage: PeriodicMoney;
  /** The components the wage was summed from, by the name the user typed. */
  wage_components: string[];
  rate: Rate;
  rate_citation: Citation;
  /** Which catalogue entries the rules file counts as the wage, and on what authority. */
  wage_citation: Citation;
  /** Present only when the ceiling was chosen, whether or not it bit. */
  ceiling?: { monthly: Money; applied: boolean; citation: Citation };
}

export interface TakeHomeOnBasis {
  basis: "variable-pay-at-zero" | "variable-pay-at-target";
  /**
   * The recurring cash the tax is computed on. On the zero basis this is
   * exactly CONTEXT.md's *guaranteed recurring cash*, and equals the total of
   * that name; on the target basis it is that plus variable pay, which is no
   * longer guaranteed, so it is not given the glossary's term.
   */
  recurring_cash: PeriodicMoney & { components: string[] };
  deductions: {
    employee_pf: EmployeePf;
    professional_tax?: PeriodicMoney;
    income_tax: IncomeTax;
    total: PeriodicMoney;
  };
  take_home: PeriodicMoney;
}

export interface TakeHome {
  regime: "new";
  bases: TakeHomeOnBasis[];
  /** What this estimate does not attempt, by name, for the skill to narrate. */
  excludes: string[];
}

export function takeHomeFor(
  components: readonly TakeHomeComponent[],
  request: TakeHomeRequest,
  rules: RulesFile,
): TakeHome {
  const epf = rulesGroup(rules, "epf");
  const incomeTax = rulesGroup(rules, "income_tax");
  const rounding = rulesGroup(rules, "statutory_rounding");

  const employeePf = employeePfFor(components, request.pf_wage_base, epf);
  const professionalTax =
    request.professional_tax === undefined
      ? undefined
      : periodic(rupeesToPaise(request.professional_tax));

  const bases = [
    { basis: "variable-pay-at-zero" as const, included: countsTowardGuaranteedRecurringCash },
    { basis: "variable-pay-at-target" as const, included: countsTowardRecurringCashAtTarget },
  ].map(({ basis, included }) => {
    const counted = components.filter((component) => included(component.classification));
    const gross = sum(counted);
    const tax = incomeTaxFor(gross, incomeTax, rounding);
    const total =
      employeePf.contribution.annual.paise +
      (professionalTax?.annual.paise ?? 0) +
      tax.tax_payable.after.paise;
    return {
      basis,
      recurring_cash: {
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
  const wageNode = epf.child("wage_components");
  const wageEntries = new Set(wageNode.strings("entries"));
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

  const rateNode = epf.child("employee_rate");
  const basisPoints = rateNode.rate("rate");

  return {
    basis,
    contribution: periodic(applyRate(wage, basisPoints)),
    wage: periodic(wage),
    wage_components: included.map((component) => component.name),
    rate: rate(basisPoints),
    rate_citation: rateNode.citation(),
    wage_citation: wageNode.citation(),
    ...(basis === "statutory_ceiling"
      ? {
          ceiling: {
            monthly: money(ceilingMonthly),
            applied: capped,
            citation: ceilingNode.citation(),
          },
        }
      : {}),
  };
}

/**
 * The professional tax entry appears only when the user did not type one, since
 * a typed figure is in the breakdown instead.
 */
function excludesFor(request: TakeHomeRequest): string[] {
  return [
    "HRA exemption",
    "Chapter VI-A deductions",
    "Employer NPS deduction",
    ...(request.professional_tax === undefined ? ["Professional tax"] : []),
    "Perquisite tax on vesting equity",
    "Surcharge",
    "Marginal relief on the rebate",
    "One-time components",
    "Benefits in kind and retirals",
  ];
}

function sum(components: readonly TakeHomeComponent[]): number {
  return components.reduce((running, component) => running + component.annual_paise, 0);
}

function periodic(annualPaise: number): PeriodicMoney {
  return { annual: money(annualPaise), monthly: money(perMonth(annualPaise)) };
}
