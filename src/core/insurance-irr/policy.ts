/**
 * The insurance-irr core's intake (issue #65). Validates a whole policy at
 * the boundary (`input.ts`), resolves the financial year against a rules
 * file exactly as the CTC decoder does, and echoes back what was accepted —
 * the figures, the terms, the scenarios — each as the core now holds them.
 *
 * No IRR, no comparison column and no classification exists yet: this is the
 * seam later tickets build on, and it reads no rules group (issue #65 —
 * `financial_year` only picks the file, to prove it exists).
 */
import { money, rate, rupeesToPaise, type Money, type Rate } from "../money.ts";
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

export interface DecodedSurvivalBenefit {
  year: number;
  amount: Money;
}

export interface DecodedScenario {
  name: string;
  maturity_benefit: Money;
  survival_benefits: DecodedSurvivalBenefit[];
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

export interface DecodedPolicy {
  financial_year: string;
  rules_file: string;
  issued_on?: string;
  linked: boolean;
  annual_premium: Money;
  premium_paying_term: number;
  policy_term: number;
  sum_assured: Money;
  scenarios: DecodedScenario[];
  premiums_paid: number;
  surrender_value?: Money;
  paid_up?: DecodedPaidUp;
  inflation: Rate;
  benchmarks?: DecodedBenchmark[];
  term_premium?: DecodedTermPremium;
  other_premiums_aggregate?: Money;
  /**
   * Every document cited anywhere above, deduplicated; see `sources.ts`.
   * Empty until a later ticket reads a rules group.
   */
  sources: Source[];
}

export function intake(raw: unknown): DecodedPolicy {
  const input = validatePolicyInput(raw);
  const rules = rulesFor(input.financial_year);

  const policy: Omit<DecodedPolicy, "sources"> = {
    financial_year: input.financial_year,
    rules_file: rules.path,
    ...(input.issued_on === undefined ? {} : { issued_on: input.issued_on }),
    linked: input.linked,
    annual_premium: money(rupeesToPaise(input.annual_premium)),
    premium_paying_term: input.premium_paying_term,
    policy_term: input.policy_term,
    sum_assured: money(rupeesToPaise(input.sum_assured)),
    scenarios: input.scenarios.map(decodeScenario),
    premiums_paid: input.premiums_paid,
    ...(input.surrender_value === undefined
      ? {}
      : { surrender_value: money(rupeesToPaise(input.surrender_value)) }),
    ...(input.paid_up === undefined ? {} : { paid_up: decodePaidUp(input.paid_up) }),
    inflation: rate(input.inflation_bp),
    ...(input.benchmarks === undefined ? {} : { benchmarks: input.benchmarks.map(decodeBenchmark) }),
    ...(input.term_premium === undefined ? {} : { term_premium: decodeTermPremium(input.term_premium) }),
    ...(input.other_premiums_aggregate === undefined
      ? {}
      : { other_premiums_aggregate: money(rupeesToPaise(input.other_premiums_aggregate)) }),
  };

  return { ...policy, sources: sourcesIn(policy) };
}

function decodeScenario(scenario: ScenarioInput): DecodedScenario {
  return {
    name: scenario.name,
    maturity_benefit: money(rupeesToPaise(scenario.maturity_benefit)),
    survival_benefits: scenario.survival_benefits.map(decodeSurvivalBenefit),
  };
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
