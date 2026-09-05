/**
 * Steady-state take-home under both regimes, each on two bases: variable pay
 * at zero, and variable pay at its quoted target.
 *
 * "Steady state" is what makes this derivable rather than listed. Every figure
 * is built from recurring cash-now components — the ones the employee sees
 * again next year — so a one-time joining bonus, a retiral, a benefit in kind
 * and an equity grant are all outside it. That is one of the conditions
 * `assumes` states, alongside the other things that have to be true for these
 * figures to be the right ones: which regime applies, that the taxpayer is a
 * resident individual (the rules file's rebate needs one), and — for the old
 * regime only — that they are below 60, since its slabs differ by age band and
 * only that band is computed (spec #11).
 *
 * `excludes` is a different list: facts about a steady-state year that this
 * estimate does not compute even though they could apply to one (spec #9).
 * Both lists carry names and nothing else. What each one means, and what it
 * costs the reader, is the skill's to say (CLAUDE.md's two-layer rule); a
 * caveat that is itself statutory, rather than a fact about this computation,
 * travels as the `note` on the citation beside the figure it qualifies instead.
 *
 * The two regimes are computed from the same recurring cash and the same
 * employee PF and professional tax — only the income tax step differs — and
 * are reported side by side as two facts of one input, in an array so neither
 * position reads as a preference (ADR 0007, spec #11).
 */
import {
  applyRate,
  periodic,
  rate,
  rupeesToPaise,
  type Money,
  type PeriodicMoney,
  type Rate,
} from "../money.ts";
import {
  ASSUMES_BELOW_60,
  ASSUMES_RESIDENT_INDIVIDUAL,
  ASSUMES_STEADY_STATE,
  breakEvenDeductionFor,
  type BreakEvenDeduction,
} from "./break-even.ts";
import type { ClassifiedComponent } from "./classification.ts";
import { incomeTaxFor, type IncomeTax, type Regime } from "./income-tax.ts";
import { rulesGroup, type Citation, type RulesNode } from "./rules-reader.ts";
import type { RulesFile } from "../rules/files.ts";
import { BASES, type Basis } from "./totals.ts";
import { pfWageCeilingFor, wageBaseFor, wageUnder, type PfWageBase } from "./wage-base.ts";

const REGIMES: readonly Regime[] = ["new", "old"];

/** What the caller typed that only the take-home figures need. */
export interface TakeHomeRequest {
  pf_wage_base: PfWageBase;
  /** Annual professional tax in whole rupees, when the user knows their state's figure. */
  professional_tax?: number;
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
  basis: Basis;
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

export interface TakeHomeUnderRegime {
  regime: Regime;
  bases: TakeHomeOnBasis[];
  /** What has to be true for these figures to be the right ones, by name. */
  assumes: string[];
  /** What this estimate does not attempt, by name, for the skill to narrate. */
  excludes: string[];
}

export interface TakeHome {
  /** Both regimes, as facts of the same input; the order carries no preference (ADR 0007). */
  regimes: TakeHomeUnderRegime[];
  /**
   * The break-even deduction on each basis (spec #17): the point at which the
   * old regime's tax stops exceeding the new regime's. Derived from the same
   * two regimes above rather than a third computation of its own; see
   * `break-even.ts`.
   */
  break_even: BreakEvenDeduction[];
}

export function takeHomeFor(
  components: readonly ClassifiedComponent[],
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

  // The recurring cash on each basis is the same whatever regime taxes it, so
  // it — and the gross it sums to, which break-even needs as well as every
  // regime's bases — is derived once here.
  const grossByBasis = BASES.map(({ basis, counts }) => {
    const counted = components.filter((component) => counts(component.classification));
    return { basis, counted, gross: sum(counted) };
  });

  // Closes over the rules groups and the two non-tax deductions, which every
  // basis of every regime shares; only the basis and the regime vary.
  function basisFor(
    basis: Basis,
    counted: readonly ClassifiedComponent[],
    gross: number,
    regime: Regime,
  ): TakeHomeOnBasis {
    const tax = incomeTaxFor(gross, incomeTax, rounding, regime);
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
  }

  const regimes = REGIMES.map((regime) => ({
    regime,
    bases: grossByBasis.map(({ basis, counted, gross }) => basisFor(basis, counted, gross, regime)),
    assumes: assumesFor(regime),
    excludes: excludesFor(request, regime),
  }));

  const breakEven = grossByBasis.map(({ basis, gross }) =>
    breakEvenDeductionFor(basis, gross, incomeTax, rounding),
  );

  return { regimes, break_even: breakEven };
}

/**
 * Named, not explained: spec #9 asks only that the estimate's conditions be
 * stated, and every reason behind them is already sourced elsewhere — the
 * rebate's residency requirement and the old regime's age band both in their
 * own citation's `note`, the rest in this module's own doc comment above.
 */
function assumesFor(regime: Regime): string[] {
  return [
    regime === "new" ? "The new regime" : "The old regime",
    ...(regime === "old" ? [ASSUMES_BELOW_60] : []),
    ASSUMES_RESIDENT_INDIVIDUAL,
    ASSUMES_STEADY_STATE,
  ];
}

/**
 * The employee's own provident fund contribution: the rules' employee rate on
 * the wage the rules name as its base (`wage-base.ts`), either in full or
 * capped at the statutory ceiling, per the caller's typed choice.
 */
function employeePfFor(
  components: readonly ClassifiedComponent[],
  basis: PfWageBase,
  epf: RulesNode,
): EmployeePf {
  const wage = wageBaseFor(components, epf.child("wage_components"));

  const ceiling = pfWageCeilingFor(epf);
  const wagePaise = wageUnder(basis, wage.annual_paise, ceiling);
  // The ceiling was chosen and actually bit, which is a different fact from
  // chosen and not: a basic already under it is capped by nothing.
  const capped = wagePaise !== wage.annual_paise;

  const rateNode = epf.child("employee_rate");
  const basisPoints = rateNode.rateBasisPoints("rate");

  return {
    basis,
    contribution: periodic(applyRate(wagePaise, basisPoints)),
    wage: periodic(wagePaise),
    wage_components: wage.base.components,
    rate: rate(basisPoints),
    rate_citation: rateNode.citation(),
    wage_citation: wage.base.citation,
    ...(basis === "statutory_ceiling"
      ? { ceiling: { monthly: ceiling.monthly, applied: capped, citation: ceiling.citation } }
      : {}),
  };
}

/**
 * Spec #9's five named exclusions, the same under both regimes: the
 * professional tax entry appears only when the user did not type one, since a
 * typed figure is in the breakdown instead. Under the old regime, HRA
 * exemption and Chapter VI-A deductions are real deductions this estimate
 * chooses not to compute rather than ones the regime forbids outright, so
 * spec #11 adds one more line naming what that makes the figure: a floor,
 * never an overstatement, since every excluded deduction can only lower tax
 * further.
 */
function excludesFor(request: TakeHomeRequest, regime: Regime): string[] {
  return [
    "HRA exemption",
    "Chapter VI-A deductions",
    "Employer NPS deduction",
    ...(request.professional_tax === undefined ? ["Professional tax"] : []),
    "Perquisite tax on vesting equity",
    ...(regime === "old"
      ? ["Floor: excluding HRA exemption and Chapter VI-A deductions can only lower this further, never raise it"]
      : []),
  ];
}

function sum(components: readonly ClassifiedComponent[]): number {
  return components.reduce((running, component) => running + component.annual_paise, 0);
}
