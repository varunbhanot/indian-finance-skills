/**
 * What the employer's own provident fund contribution, as the letter states it,
 * says about the wage base behind it (issue #31).
 *
 * An Indian CTC annexure states the employer's contribution as an *amount*, not
 * as the policy that produced it. "Employer's contribution to PF — ₹21,600 p.a."
 * is ₹1,800 a month, which is the employer rate on the ₹15,000 statutory
 * ceiling; another letter shows the same rate on the whole of basic. The policy
 * is in the letter, as a consequence rather than as a statement, so this reads
 * it back out instead of asking the user to.
 *
 * **A reading, never a validation.** A figure consistent with neither base is
 * reported as consistent with neither, and the decode succeeds. Real letters
 * round, real employers split the contribution differently, and a mismatch is a
 * fact the reader should see rather than a reason to refuse their offer.
 *
 * It settles nothing on the user's behalf either. `take_home` still needs
 * `pf_wage_base` typed; this only turns the question the skill asks from a quiz
 * into a confirmation (CLAUDE.md's two-layer rule — the arithmetic is here, the
 * question is the skill's).
 *
 * It sits at the top of the output rather than inside `basic.drives`, where the
 * same rate and ceiling already are, because it needs nothing from
 * `groups.basic_pay`: a rules file that does not do the basic reading still
 * knows what the employer's contribution is computed on, and the reading holds
 * either way.
 */
import { annualise, applyRate, money, periodic, rate, rupeesToPaise, type Money, type PeriodicMoney, type Rate } from "../money.ts";
import type { ClassifiedComponent } from "./classification.ts";
import type { RulesFile } from "../rules/files.ts";
import { hasRulesGroup, rulesGroup, type Citation } from "./rules-reader.ts";
import { wageBaseFor, PF_WAGE_BASES, type PfWageBase } from "./wage-base.ts";

/** One wage base measured against the offer, and whether the letter's figure lands on it. */
export interface EmployerPfOnBasis {
  basis: PfWageBase;
  /** The wage the rate would be applied to under this base. */
  wage: PeriodicMoney;
  /** The contribution that base implies: the employer rate on that wage. */
  contribution: PeriodicMoney;
  /** Whether the offer's own employer contribution equals it, to the paise. */
  matches: boolean;
}

export interface EmployerPfReading {
  /** The offer's employer contribution lines, by the name the user typed. */
  components: string[];
  /** Which catalogue entries the rules file counts as the employer's contribution. */
  components_citation: Citation;
  /** What those lines add up to: the figure being read. */
  contribution: PeriodicMoney;
  /** Both bases measured, so the comparison is shown rather than asserted. */
  bases: EmployerPfOnBasis[];
  /**
   * The bases the letter's figure is consistent with: one, both, or — where it
   * lands on neither — none at all.
   */
  implies: PfWageBase[];
  /**
   * True where the base is at or below the ceiling, so the two bases give the
   * same wage and no figure computed from them could tell them apart.
   */
  bases_coincide: boolean;
  /** The offer's lines inside the provident fund wage base, by the name the user typed. */
  wage_components: string[];
  wage_citation: Citation;
  rate: Rate;
  rate_citation: Citation;
  ceiling: { monthly: Money; citation: Citation };
}

/**
 * The reading, or nothing at all when there is nothing to read: a rules file
 * with no `epf` group, or an offer whose letter states no employer
 * contribution. Absent is not a nil figure — no line, no reading.
 */
export function employerPfReadingFor(
  components: readonly ClassifiedComponent[],
  rules: RulesFile,
): EmployerPfReading | undefined {
  if (!hasRulesGroup(rules, "epf")) return undefined;
  const epf = rulesGroup(rules, "epf");

  const contributions = wageBaseFor(components, epf.child("employer_components"));
  if (contributions.included.length === 0) return undefined;

  const wage = wageBaseFor(components, epf.child("wage_components"));
  const ceilingNode = epf.child("wage_ceiling");
  const ceilingMonthly = rupeesToPaise(ceilingNode.integer("monthly_rupees"));
  const ceilingAnnual = annualise(ceilingMonthly, "monthly");
  const rateNode = epf.child("employer_rate");
  const basisPoints = rateNode.rateBasisPoints("rate");

  const bases = PF_WAGE_BASES.map((basis) =>
    onBasis(basis, wagePaiseFor(basis, wage.annual_paise, ceilingAnnual), basisPoints, contributions.annual_paise),
  );

  return {
    components: contributions.base.components,
    components_citation: contributions.base.citation,
    contribution: periodic(contributions.annual_paise),
    bases,
    implies: bases.filter((one) => one.matches).map((one) => one.basis),
    bases_coincide: wage.annual_paise <= ceilingAnnual,
    wage_components: wage.base.components,
    wage_citation: wage.base.citation,
    rate: rate(basisPoints),
    rate_citation: rateNode.citation(),
    ceiling: { monthly: money(ceilingMonthly), citation: ceilingNode.citation() },
  };
}

/**
 * The ceiling caps the base rather than replacing it, which is why a base
 * already below the ceiling gives the same wage under both — and why the two
 * bases can be indistinguishable rather than merely close.
 */
function wagePaiseFor(basis: PfWageBase, wagePaise: number, ceilingAnnual: number): number {
  if (basis === "full_basic") return wagePaise;
  return wagePaise > ceilingAnnual ? ceilingAnnual : wagePaise;
}

/**
 * Equality to the paise, with no tolerance. A tolerance would be an authored
 * threshold, and an authored threshold belongs in `heuristics.yaml` with a
 * rationale beside it (ADR 0006) rather than in a comparison here; until one is
 * written, a letter that rounds is a letter that matches neither base, which is
 * what the reader is told.
 */
function onBasis(
  basis: PfWageBase,
  wagePaise: number,
  basisPoints: number,
  contributionPaise: number,
): EmployerPfOnBasis {
  const implied = applyRate(wagePaise, basisPoints);
  return {
    basis,
    wage: periodic(wagePaise),
    contribution: periodic(implied),
    matches: implied === contributionPaise,
  };
}
