/**
 * Basic as a share of fixed pay, and the facts about what that share drives
 * (spec #7).
 *
 * Every fact here is a rule and its citation, never a suggestion (ADR 0007).
 * The core states that the employer's provident fund contribution is computed
 * on the base basic sits in, at a rate, up to a ceiling; that gratuity accrues
 * on the same figure, by a formula, after a qualifying period; and that the
 * house rent allowance exemption exists and is bounded. What any of that is
 * worth to the reader is the skill's to say, and what to do about it is nobody's
 * but the user's (CLAUDE.md's two-layer rule).
 *
 * Which components are basic pay is read from the rules file, never named here
 * (ADR 0004), and only a component the catalogue classified can be one: a line
 * the user classified inline carries no catalogue entry, so it is outside the
 * base whatever they called it. Note the asymmetry that follows: it is in the
 * numerator, and — through `totals.fixed_pay` — still in the denominator, so
 * `basic.components` and `totals.fixed_pay.components` are both named in the
 * output and a reader can see which lines are in which.
 *
 * `groups.basic_pay` is how a rules file opts into this reading at all: without
 * it there is no `basic` block, which is how the same decoder reads a rules file
 * that predates the reading. Once a file opts in, the reading must be whole — a
 * missing `epf`, `gratuity` or `hra` group is `rule_absent` naming the key, not
 * a fact quietly dropped from `drives`. The two answers are to two different
 * questions: "this file does not do this reading" and "this file does it, and is
 * incomplete".
 *
 * No figure of provident fund, gratuity or house rent allowance is computed
 * here. The share is the only arithmetic in this file.
 */
import { money, rate, rupeesToPaise, shareInBasisPoints, type Money, type Rate } from "../money.ts";
import type { RulesFile } from "../rules/files.ts";
import { hasRulesGroup, rulesGroup, type Citation, type RulesNode } from "./rules-reader.ts";

/** A decoded component reduced to what this reading needs: its worth, and what classified it. */
export interface ClassifiedComponent {
  name: string;
  annual_paise: number;
  /** The catalogue entry that classified it, absent when the user classified it inline. */
  catalogue_entry?: string;
}

/** The components a statutory base is made of, as the rules file names them and as the user typed them. */
export interface WageBase {
  /** The catalogue entries the rules file counts into the base. */
  entries: string[];
  /** The components of this offer that fall inside it, by the name the user typed. */
  components: string[];
  citation: Citation;
}

/**
 * One thing basic drives, discriminated by `drives` because the three rest on
 * three different statutes and carry three different sets of terms. Each names
 * the rules it stands on, and each of those carries its own citation.
 */
export type BasicDrives = EmployerPfDriven | GratuityDriven | HraExemptionDriven;

export interface EmployerPfDriven {
  drives: "employer-pf";
  wage_base: WageBase;
  rate: Rate;
  rate_citation: Citation;
  /** The monthly wage the contribution is capped at, where the employer applies it. */
  ceiling: { monthly: Money; citation: Citation };
}

export interface GratuityDriven {
  drives: "gratuity";
  wage_base: WageBase;
  /** Days of wages per completed year, and the days the monthly wage is divided by. */
  accrual: { days_of_wages: number; days_in_month: number; citation: Citation };
  qualifying_service: { years: number; citation: Citation };
}

/**
 * The exemption, and nothing more. The Act settles that it exists and that its
 * extent is prescribed elsewhere; the citation's `note` says what the rules file
 * could and could not source, and no limb of it is computed anywhere.
 */
export interface HraExemptionDriven {
  drives: "hra-exemption";
  citation: Citation;
}

export interface Basic {
  /** The components the rules file counts as basic pay, by the name the user typed. */
  components: string[];
  annual: Money;
  /**
   * Basic over `totals.fixed_pay`, which is the denominator and is reported
   * beside it. Absent where fixed pay is nil, since a share of nothing is
   * neither zero nor everything.
   */
  share_of_fixed_pay?: Rate;
  /** Which catalogue entries are basic pay, and on what authority. */
  citation: Citation;
  drives: BasicDrives[];
}

/**
 * The basic reading of an offer, or nothing when the rules file does not say
 * which components are basic pay.
 */
export function basicFor(
  components: readonly ClassifiedComponent[],
  fixedPayPaise: number,
  rules: RulesFile,
): Basic | undefined {
  if (!hasRulesGroup(rules, "basic_pay")) return undefined;

  const base = wageBaseFor(components, rulesGroup(rules, "basic_pay").child("catalogue_entries"));
  const annualPaise = componentsIn(components, base.entries).reduce(
    (running, one) => running + one.annual_paise,
    0,
  );
  const share = shareInBasisPoints(annualPaise, fixedPayPaise);

  return {
    components: base.components,
    annual: money(annualPaise),
    ...(share === undefined ? {} : { share_of_fixed_pay: rate(share) }),
    citation: base.citation,
    drives: [employerPf(components, rules), gratuity(components, rules), hraExemption(rules)],
  };
}

/**
 * The employer's own provident fund contribution: computed on the base the
 * rules file names, at the employer rate, and capped at the statutory wage
 * ceiling where the employer applies it. No contribution is computed — the
 * employee's own share is the one the decoder computes, and it does so in
 * `take-home.ts` from the caller's typed answer about which wage the employer
 * uses. That answer is not asked for here, so the ceiling is stated rather than
 * applied.
 */
function employerPf(components: readonly ClassifiedComponent[], rules: RulesFile): EmployerPfDriven {
  const epf = rulesGroup(rules, "epf");
  const rateNode = epf.child("employer_rate");
  const ceilingNode = epf.child("wage_ceiling");
  return {
    drives: "employer-pf",
    wage_base: wageBaseFor(components, epf.child("wage_components")),
    rate: rate(rateNode.rateBasisPoints("rate")),
    rate_citation: rateNode.citation(),
    ceiling: {
      monthly: money(rupeesToPaise(ceilingNode.integer("monthly_rupees"))),
      citation: ceilingNode.citation(),
    },
  };
}

/**
 * Gratuity accrual: the formula, the qualifying period, and the base it is
 * computed on. The formula's terms are carried as the two whole numbers the
 * statute states rather than as a rate, because that is what it states — the
 * quotient of fifteen and twenty-six is not a figure the Act writes down, and
 * writing it here would be the core deciding how to read the Explanation.
 */
function gratuity(components: readonly ClassifiedComponent[], rules: RulesFile): GratuityDriven {
  const group = rulesGroup(rules, "gratuity");
  const accrual = group.child("accrual");
  const qualifying = group.child("qualifying_service");
  return {
    drives: "gratuity",
    wage_base: wageBaseFor(components, group.child("wage_components")),
    accrual: {
      days_of_wages: accrual.integer("days_of_wages"),
      days_in_month: accrual.integer("days_in_month"),
      citation: accrual.citation(),
    },
    qualifying_service: { years: qualifying.integer("years"), citation: qualifying.citation() },
  };
}

function hraExemption(rules: RulesFile): HraExemptionDriven {
  return { drives: "hra-exemption", citation: rulesGroup(rules, "hra").child("exemption").citation() };
}

/**
 * A statutory wage base as this offer meets it: the catalogue entries the rules
 * file counts into it, and which of the user's own lines fall inside. Three
 * rules name a base this way — basic pay itself, the provident fund's, and
 * gratuity's — and each names its own, so no component type is named in code.
 */
function wageBaseFor(components: readonly ClassifiedComponent[], node: RulesNode): WageBase {
  const entries = node.strings("entries");
  return {
    entries,
    components: componentsIn(components, entries).map((one) => one.name),
    citation: node.citation(),
  };
}

/** The components inside a base, which only a catalogue entry can put one in. */
function componentsIn(
  components: readonly ClassifiedComponent[],
  entries: readonly string[],
): ClassifiedComponent[] {
  const included = new Set(entries);
  return components.filter(
    (one) => one.catalogue_entry !== undefined && included.has(one.catalogue_entry),
  );
}
