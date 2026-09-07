/**
 * The insurance-irr core's intake (issue #65). Validates a whole policy at
 * the boundary (`input.ts`), resolves the financial year against a rules
 * file exactly as the CTC decoder does, and echoes back what was accepted —
 * the figures, the terms, the scenarios — each as the core now holds them.
 *
 * Issue #66 adds the first arithmetic: each scenario's cash flows are
 * reduced to a nominal IRR (`irr.ts`) and a real return against the typed
 * inflation figure (`real-return.ts`), and the `classifications` array
 * (`classifications.ts`) states what those figures mean without
 * recommending anything (ADR 0001). The inflation figure itself is read
 * back against the RBI's own statutory target (`inflation-target.ts`,
 * ADR 0013): never a default, but cited as the target when the two agree.
 *
 * Issue #67 adds GST (`gst.ts`, ADR 0012): the typed `annual_premium` is
 * always the pre-GST premium, and this module adds the rules file's rate to
 * it before the IRR solver ever sees a cash outflow, so `gst_on_premium`'s
 * `cash_outflow` — not the bare premium — is what every scenario's IRR
 * reconciles.
 */
import { applyRate, money, rate, rupeesToPaise, type Money, type Rate } from "../money.ts";
import { resolveRulesFile, rulesFilePathFor, type RulesFile } from "../rules/files.ts";
import { RulesFileError } from "../rules/loader.ts";
import { InsuranceError } from "./errors.ts";
import {
  validatePolicyInput,
  type BenchmarkInput,
  type PaidUpInput,
  type ScenarioInput,
  type SourceInput,
  type SurvivalBenefitInput,
  type TermPremiumInput,
} from "./input.ts";
import { sourcesIn, type Source } from "../sources.ts";
import { solveIrr, type PolicyFlows } from "./irr.ts";
import { realReturnBp, REAL_RETURN_METHOD } from "./real-return.ts";
import { classificationsFor, type Classification } from "./classifications.ts";
import { inflationTargetFor, type InflationTarget, type InflationTargetCitation } from "./inflation-target.ts";
import { gstOnIndividualLifeInsuranceFor, type Gst, type GstCitation } from "./gst.ts";

export interface DecodedSurvivalBenefit {
  year: number;
  amount: Money;
}

/** A real return by the Fisher relation (ADR 0005); `method` names the formula, never the napkin subtraction. */
export interface RealReturn {
  bp: number;
  display: string;
  method: string;
}

export interface DecodedScenario {
  name: string;
  maturity_benefit: Money;
  survival_benefits: DecodedSurvivalBenefit[];
  /** Floored, in basis points; `null` when the search never finds a sign change within −9999..10000 bp (ADR 0004). */
  irr: Rate | null;
  /** `null` exactly when `irr` is `null` — there is no nominal rate to compare against inflation. */
  real_return: RealReturn | null;
}

export interface DecodedPaidUp {
  maturity_benefit: Money;
  survival_benefits: DecodedSurvivalBenefit[];
  sum_assured: Money;
}

export interface DecodedBenchmark {
  name: string;
  rate: Rate;
  net_of_tax: boolean;
  source?: SourceInput;
}

export interface DecodedTermPremium {
  amount: Money;
  sum_assured: Money;
}

/**
 * GST on the typed premium (issue #67, ADR 0012 [insurance-irr]): the rate
 * the rules file carries today, its citation, and the resulting cash
 * outflow — premium plus that rate, applied through `applyRate` — which is
 * what every scenario's IRR reconciles from here on, not the bare premium.
 */
export interface GstOnPremium {
  rate: Rate;
  source: GstCitation;
  cash_outflow: Money;
}

/**
 * The typed inflation figure, read back against the RBI's own statutory
 * target (ADR 0013): `source` is the rules file's citation when the two
 * agree, in basis points, and the literal string `"user-typed"` otherwise.
 * `assumption` is the one sentence ADR 0013 authors in the core rather than
 * leaves to the skill, and it exists only in the branch it describes — a
 * user-typed figure carries no assumption about where it came from beyond
 * `source` already saying so.
 */
export interface InflationReading {
  bp: number;
  display: string;
  source: InflationTargetCitation | "user-typed";
  assumption?: string;
}

const INFLATION_TARGET_ASSUMPTION = "user-confirmed; a statutory target, not a forecast";

export interface DecodedPolicy {
  financial_year: string;
  rules_file: string;
  issued_on?: string;
  linked: boolean;
  annual_premium: Money;
  gst_on_premium: GstOnPremium;
  premium_paying_term: number;
  policy_term: number;
  sum_assured: Money;
  scenarios: DecodedScenario[];
  premiums_paid: number;
  surrender_value?: Money;
  paid_up?: DecodedPaidUp;
  inflation: InflationReading;
  benchmarks?: DecodedBenchmark[];
  term_premium?: DecodedTermPremium;
  other_premiums_aggregate?: Money;
  /**
   * Facts about the scenarios' own figures, never a recommendation
   * (ADR 0001, ADR 0015); see `classifications.ts`.
   */
  classifications: Classification[];
  /**
   * Every document cited anywhere above, deduplicated; see `sources.ts`.
   */
  sources: Source[];
}

export function intake(raw: unknown): DecodedPolicy {
  const input = validatePolicyInput(raw);
  const rules = rulesFor(input.financial_year);
  const inflationTarget = inflationTargetFor(rules);
  const gst = gstOnIndividualLifeInsuranceFor(rules);

  const annualPremiumPaise = rupeesToPaise(input.annual_premium);
  const cashOutflowPaise = annualPremiumPaise + applyRate(annualPremiumPaise, gst.rate_bp);

  const flows: PolicyFlows = {
    premium_paying_term: input.premium_paying_term,
    policy_term: input.policy_term,
    annual_cash_outflow_paise: cashOutflowPaise,
  };
  const solved = input.scenarios.map((scenario) => solveScenario(scenario, flows, input.inflation_bp));

  const policy: Omit<DecodedPolicy, "sources"> = {
    financial_year: input.financial_year,
    rules_file: rules.path,
    ...(input.issued_on === undefined ? {} : { issued_on: input.issued_on }),
    linked: input.linked,
    annual_premium: money(annualPremiumPaise),
    gst_on_premium: gstOnPremiumFor(gst, cashOutflowPaise),
    premium_paying_term: input.premium_paying_term,
    policy_term: input.policy_term,
    sum_assured: money(rupeesToPaise(input.sum_assured)),
    scenarios: solved.map((one) => one.scenario),
    premiums_paid: input.premiums_paid,
    ...(input.surrender_value === undefined
      ? {}
      : { surrender_value: money(rupeesToPaise(input.surrender_value)) }),
    ...(input.paid_up === undefined ? {} : { paid_up: decodePaidUp(input.paid_up) }),
    inflation: inflationReadingFor(input.inflation_bp, inflationTarget),
    ...(input.benchmarks === undefined ? {} : { benchmarks: input.benchmarks.map(decodeBenchmark) }),
    ...(input.term_premium === undefined ? {} : { term_premium: decodeTermPremium(input.term_premium) }),
    ...(input.other_premiums_aggregate === undefined
      ? {}
      : { other_premiums_aggregate: money(rupeesToPaise(input.other_premiums_aggregate)) }),
    classifications: solved.flatMap((one) => one.classifications),
  };

  return { ...policy, sources: sourcesIn(policy) };
}

/** One scenario reduced to its IRR, real return and classifications, alongside the figures it was already carrying. */
function solveScenario(
  scenario: ScenarioInput,
  flows: PolicyFlows,
  inflationBp: number,
): { scenario: DecodedScenario; classifications: Classification[] } {
  const maturityBenefit = money(rupeesToPaise(scenario.maturity_benefit));
  const survivalBenefits = scenario.survival_benefits.map(decodeSurvivalBenefit);

  const irr = solveIrr(flows, { maturity_benefit: maturityBenefit, survival_benefits: survivalBenefits });
  const realReturn = irr.rate_bp === null ? null : realReturnBp(irr.rate_bp, inflationBp);

  const decoded: DecodedScenario = {
    name: scenario.name,
    maturity_benefit: maturityBenefit,
    survival_benefits: survivalBenefits,
    irr: irr.rate_bp === null ? null : rate(irr.rate_bp),
    real_return: realReturn === null ? null : { ...rate(realReturn), method: REAL_RETURN_METHOD },
  };

  return { scenario: decoded, classifications: classificationsFor(scenario.name, irr, realReturn) };
}

function decodeSurvivalBenefit(benefit: SurvivalBenefitInput): DecodedSurvivalBenefit {
  return { year: benefit.year, amount: money(rupeesToPaise(benefit.amount)) };
}

function decodePaidUp(paidUp: PaidUpInput): DecodedPaidUp {
  return {
    maturity_benefit: money(rupeesToPaise(paidUp.maturity_benefit)),
    survival_benefits: paidUp.survival_benefits.map(decodeSurvivalBenefit),
    sum_assured: money(rupeesToPaise(paidUp.sum_assured)),
  };
}

function decodeBenchmark(benchmark: BenchmarkInput): DecodedBenchmark {
  return {
    name: benchmark.name,
    rate: rate(benchmark.rate_bp),
    net_of_tax: benchmark.net_of_tax,
    ...(benchmark.source === undefined ? {} : { source: benchmark.source }),
  };
}

function decodeTermPremium(termPremium: TermPremiumInput): DecodedTermPremium {
  return {
    amount: money(rupeesToPaise(termPremium.amount)),
    sum_assured: money(rupeesToPaise(termPremium.sum_assured)),
  };
}

/** The rate the rules file carries, its citation, and the cash outflow already computed from it. */
function gstOnPremiumFor(gst: Gst, cashOutflowPaise: number): GstOnPremium {
  return { rate: rate(gst.rate_bp), source: gst.citation, cash_outflow: money(cashOutflowPaise) };
}

/** The typed inflation figure, cited against the rules file's target when the two agree bp for bp (ADR 0013). */
function inflationReadingFor(inflationBp: number, target: InflationTarget): InflationReading {
  const { bp, display } = rate(inflationBp);
  if (inflationBp === target.rate_bp) {
    return { bp, display, source: target.citation, assumption: INFLATION_TARGET_ASSUMPTION };
  }
  return { bp, display, source: "user-typed" };
}

/** The rules file for the typed financial year; a missing or malformed file is a rejection. */
function rulesFor(financialYear: string): RulesFile {
  const expectedFile = rulesFilePathFor(financialYear);
  let rules: RulesFile | undefined;
  try {
    rules = resolveRulesFile(financialYear);
  } catch (error) {
    if (!(error instanceof RulesFileError)) throw error;
    throw new InsuranceError({
      code: "invalid_input",
      message: `${expectedFile} failed the rules schema: ${error.message}`,
      path: "financial_year",
      details: { rules_file: expectedFile, rules_error: error.code },
    });
  }
  if (rules === undefined) {
    throw new InsuranceError({
      code: "unknown_financial_year",
      message: `No rules file for financial year ${financialYear}: expected ${expectedFile}`,
      path: "financial_year",
      details: { financial_year: financialYear, expected_file: expectedFile },
    });
  }
  return rules;
}
