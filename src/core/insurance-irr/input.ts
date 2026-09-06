/**
 * A whole policy as the skill submits it, validated at the boundary (issue
 * #65). Amounts are whole rupees; the core converts them to paise. Rates are
 * basis points, in −9999..10000. Unknown keys are rejected, so a later ticket
 * adding a field extends this file.
 *
 * This ticket validates structure only: nothing here computes an IRR, a
 * column or a classification. Only what is structurally impossible is
 * rejected (ADR 0016 [insurance-irr]) — a term premium at or above the policy
 * premium, a surrender value above premiums paid, or a paid-up benefit above
 * the maturity benefit are merely unusual, and are accepted here for a later
 * ticket to classify.
 */
import { isFinancialYear } from "../financial-year.ts";
import { formatIndianRupees, rupeesToPaise, RUPEE_INPUT_CAP } from "../money.ts";
import { InsuranceError } from "./errors.ts";

export interface SurvivalBenefitInput {
  year: number;
  amount: number;
}

export interface ScenarioInput {
  name: string;
  maturity_benefit: number;
  survival_benefits: SurvivalBenefitInput[];
}

export interface PaidUpInput {
  maturity_benefit: number;
  survival_benefits: SurvivalBenefitInput[];
  sum_assured: number;
}

export interface SourceInput {
  title: string;
  url: string;
}

export interface BenchmarkInput {
  name: string;
  rate_bp: number;
  net_of_tax: boolean;
  source?: SourceInput;
}

export interface TermPremiumInput {
  amount: number;
  sum_assured: number;
}

export interface PolicyInput {
  financial_year: string;
  issued_on?: string;
  linked: boolean;
  annual_premium: number;
  premium_paying_term: number;
  policy_term: number;
  sum_assured: number;
  scenarios: ScenarioInput[];
  /** Whole premiums paid so far; 0 means the policy has not yet been bought. */
  premiums_paid: number;
  surrender_value?: number;
  paid_up?: PaidUpInput;
  inflation_bp: number;
  benchmarks?: BenchmarkInput[];
  term_premium?: TermPremiumInput;
  other_premiums_aggregate?: number;
}

const CAP_PAISE = rupeesToPaise(RUPEE_INPUT_CAP);
const MIN_RATE_BP = -9999;
const MAX_RATE_BP = 10000;
const GUARANTEED_SCENARIO = "guaranteed";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const POLICY_KEYS = [
  "financial_year",
  "issued_on",
  "linked",
  "annual_premium",
  "premium_paying_term",
  "policy_term",
  "sum_assured",
  "scenarios",
  "premiums_paid",
  "surrender_value",
  "paid_up",
  "inflation_bp",
  "benchmarks",
  "term_premium",
  "other_premiums_aggregate",
];
const SCENARIO_KEYS = ["name", "maturity_benefit", "survival_benefits"];
const SURVIVAL_BENEFIT_KEYS = ["year", "amount"];
const PAID_UP_KEYS = ["maturity_benefit", "survival_benefits", "sum_assured"];
const BENCHMARK_KEYS = ["name", "rate_bp", "net_of_tax", "source"];
const SOURCE_KEYS = ["title", "url"];
const TERM_PREMIUM_KEYS = ["amount", "sum_assured"];

export function validatePolicyInput(raw: unknown): PolicyInput {
  const root = expectObject(raw, "", POLICY_KEYS);

  const financialYear = root["financial_year"];
  if (typeof financialYear !== "string") {
    throw invalid("financial_year", 'financial_year is required, as a string such as "2026-27"');
  }
  if (!isFinancialYear(financialYear)) {
    throw new InsuranceError({
      code: "invalid_financial_year",
      message: `financial_year must be written YYYY-YY naming consecutive years, got ${JSON.stringify(financialYear)}`,
      path: "financial_year",
    });
  }

  const linked = root["linked"];
  if (typeof linked !== "boolean") {
    throw invalid("linked", "linked must be true or false: whether the policy is unit-linked decides the taxability band");
  }

  const premiumPayingTerm = validateWholeYears(root["premium_paying_term"], "premium_paying_term");
  const policyTerm = validateWholeYears(root["policy_term"], "policy_term");
  if (premiumPayingTerm > policyTerm) {
    throw new InsuranceError({
      code: "premium_paying_term_exceeds_policy_term",
      message: `premium_paying_term (${premiumPayingTerm}) must not exceed policy_term (${policyTerm})`,
      path: "premium_paying_term",
      details: { premium_paying_term: premiumPayingTerm, policy_term: policyTerm },
    });
  }

  const annualPremium = validateWholeRupees(root["annual_premium"], "annual_premium", "annual_premium");
  const sumAssured = validateWholeRupees(root["sum_assured"], "sum_assured", "sum_assured");

  const rawScenarios = root["scenarios"];
  if (!Array.isArray(rawScenarios) || rawScenarios.length === 0) {
    throw invalid("scenarios", "scenarios must be a non-empty array, guaranteed first");
  }
  const scenarios = rawScenarios.map((scenario, index) =>
    validateScenario(scenario, `scenarios[${index}]`, policyTerm),
  );
  if (scenarios[0]?.name !== GUARANTEED_SCENARIO) {
    throw new InsuranceError({
      code: "scenarios_without_guaranteed_first",
      message: `scenarios[0].name must be ${JSON.stringify(GUARANTEED_SCENARIO)}, got ${JSON.stringify(scenarios[0]?.name)}`,
      path: "scenarios[0].name",
    });
  }
  rejectDuplicateScenarioNames(scenarios);
  rejectFlowsAboveCap(annualPremium, premiumPayingTerm, scenarios);

  const premiumsPaid = validatePremiumsPaid(root["premiums_paid"], premiumPayingTerm);

  const issuedOn = root["issued_on"];
  if (issuedOn !== undefined) validateIssuedOn(issuedOn);
  if (premiumsPaid >= 1 && issuedOn === undefined) {
    throw new InsuranceError({
      code: "in_force_without_issued_on",
      message: "issued_on is required once premiums_paid is 1 or more: an in-force policy's issue date has no honest default",
      path: "issued_on",
      details: { premiums_paid: premiumsPaid },
    });
  }

  const surrenderValue = validateOptionalWholeRupees(root["surrender_value"], "surrender_value");
  const paidUp = validatePaidUp(root["paid_up"], policyTerm);
  const inflationBp = validateRateBasisPoints(root["inflation_bp"], "inflation_bp", "inflation_bp", {
    required: true,
  });
  const benchmarks = validateBenchmarks(root["benchmarks"]);
  const termPremium = validateTermPremium(root["term_premium"]);
  const otherPremiumsAggregate = validateOptionalWholeRupees(
    root["other_premiums_aggregate"],
    "other_premiums_aggregate",
  );

  return {
    financial_year: financialYear,
    ...(issuedOn === undefined ? {} : { issued_on: issuedOn as string }),
    linked,
    annual_premium: annualPremium,
    premium_paying_term: premiumPayingTerm,
    policy_term: policyTerm,
    sum_assured: sumAssured,
    scenarios,
    premiums_paid: premiumsPaid,
    ...(surrenderValue === undefined ? {} : { surrender_value: surrenderValue }),
    ...(paidUp === undefined ? {} : { paid_up: paidUp }),
    inflation_bp: inflationBp as number,
    ...(benchmarks === undefined ? {} : { benchmarks }),
    ...(termPremium === undefined ? {} : { term_premium: termPremium }),
    ...(otherPremiumsAggregate === undefined ? {} : { other_premiums_aggregate: otherPremiumsAggregate }),
  };
}

function validateScenario(raw: unknown, path: string, policyTerm: number): ScenarioInput {
  const scenario = expectObject(raw, path, SCENARIO_KEYS);

  const name = scenario["name"];
  if (typeof name !== "string" || name.trim() === "") {
    throw invalid(`${path}.name`, "name must be a non-empty string");
  }

  const maturityBenefit = validateWholeRupees(
    scenario["maturity_benefit"],
    `${path}.maturity_benefit`,
    "maturity_benefit",
  );

  const rawSurvivalBenefits = scenario["survival_benefits"];
  const survivalBenefits =
    rawSurvivalBenefits === undefined
      ? []
      : validateSurvivalBenefits(rawSurvivalBenefits, `${path}.survival_benefits`, policyTerm);

  return { name, maturity_benefit: maturityBenefit, survival_benefits: survivalBenefits };
}

function validateSurvivalBenefits(
  raw: unknown,
  path: string,
  policyTerm: number,
): SurvivalBenefitInput[] {
  if (!Array.isArray(raw)) {
    throw invalid(path, "survival_benefits must be an array of { year, amount }");
  }
  return raw.map((benefit, index) => validateSurvivalBenefit(benefit, `${path}[${index}]`, policyTerm));
}

function validateSurvivalBenefit(raw: unknown, path: string, policyTerm: number): SurvivalBenefitInput {
  const benefit = expectObject(raw, path, SURVIVAL_BENEFIT_KEYS);

  const year = benefit["year"];
  if (typeof year !== "number" || !Number.isInteger(year)) {
    throw invalid(`${path}.year`, "year must be a whole number naming a policy year");
  }
  if (year < 1 || year > policyTerm) {
    throw new InsuranceError({
      code: "survival_benefit_outside_policy_term",
      message: `${path}.year: a survival benefit must fall in years 1..${policyTerm}, got ${year}`,
      path: `${path}.year`,
      details: { year, policy_term: policyTerm },
    });
  }

  const amount = validateWholeRupees(benefit["amount"], `${path}.amount`, "amount");
  return { year, amount };
}

function rejectDuplicateScenarioNames(scenarios: readonly ScenarioInput[]): void {
  const seen = new Set<string>();
  for (const [index, scenario] of scenarios.entries()) {
    if (seen.has(scenario.name)) {
      throw new InsuranceError({
        code: "duplicate_scenario_name",
        message: `scenarios[${index}].name: ${JSON.stringify(scenario.name)} already names an earlier scenario`,
        path: `scenarios[${index}].name`,
        details: { name: scenario.name },
      });
    }
    seen.add(scenario.name);
  }
}

/**
 * The cap binds each scenario's own total flow, not the scenarios summed
 * together: each scenario is a self-consistent world (ADR 0006
 * [insurance-irr]), so the sum that has to stay a safe integer is the one
 * roll-forward will actually take through it — total premiums out plus that
 * scenario's benefits in.
 */
function rejectFlowsAboveCap(
  annualPremiumRupees: number,
  premiumPayingTerm: number,
  scenarios: readonly ScenarioInput[],
): void {
  const totalPremiumsPaise = rupeesToPaise(annualPremiumRupees) * premiumPayingTerm;
  for (const [index, scenario] of scenarios.entries()) {
    const benefitsPaise = scenario.survival_benefits.reduce(
      (running, benefit) => running + rupeesToPaise(benefit.amount),
      rupeesToPaise(scenario.maturity_benefit),
    );
    const total = totalPremiumsPaise + benefitsPaise;
    if (total <= CAP_PAISE) continue;
    throw aboveCap(
      `scenarios[${index}]`,
      `scenarios[${index}]'s flows add up to ${formatIndianRupees(total)} (premiums plus benefits), above the ${formatIndianRupees(CAP_PAISE)} the core accepts`,
    );
  }
}

function validatePremiumsPaid(raw: unknown, premiumPayingTerm: number): number {
  if (raw === undefined) return 0;
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 0) {
    throw invalid("premiums_paid", "premiums_paid must be a whole number of premiums, zero or more");
  }
  if (raw > premiumPayingTerm) {
    throw new InsuranceError({
      code: "premiums_paid_exceeds_premium_paying_term",
      message: `premiums_paid (${raw}) must not exceed premium_paying_term (${premiumPayingTerm})`,
      path: "premiums_paid",
      details: { premiums_paid: raw, premium_paying_term: premiumPayingTerm },
    });
  }
  return raw;
}

function validateIssuedOn(raw: unknown): void {
  if (typeof raw !== "string" || !DATE_PATTERN.test(raw)) {
    throw invalid("issued_on", "issued_on must be a date written YYYY-MM-DD");
  }
}

function validatePaidUp(raw: unknown, policyTerm: number): PaidUpInput | undefined {
  if (raw === undefined) return undefined;
  const paidUp = expectObject(raw, "paid_up", PAID_UP_KEYS);

  const maturityBenefit = validateWholeRupees(
    paidUp["maturity_benefit"],
    "paid_up.maturity_benefit",
    "maturity_benefit",
  );
  const rawSurvivalBenefits = paidUp["survival_benefits"];
  const survivalBenefits =
    rawSurvivalBenefits === undefined
      ? []
      : validateSurvivalBenefits(rawSurvivalBenefits, "paid_up.survival_benefits", policyTerm);
  const sumAssured = validateWholeRupees(paidUp["sum_assured"], "paid_up.sum_assured", "sum_assured");

  return { maturity_benefit: maturityBenefit, survival_benefits: survivalBenefits, sum_assured: sumAssured };
}

function validateBenchmarks(raw: unknown): BenchmarkInput[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    throw invalid("benchmarks", "benchmarks must be an array of { name, rate_bp, net_of_tax }");
  }
  return raw.map((benchmark, index) => validateBenchmark(benchmark, `benchmarks[${index}]`));
}

function validateBenchmark(raw: unknown, path: string): BenchmarkInput {
  const benchmark = expectObject(raw, path, BENCHMARK_KEYS);

  const name = benchmark["name"];
  if (typeof name !== "string" || name.trim() === "") {
    throw invalid(`${path}.name`, "name must be a non-empty string");
  }
  const rateBp = validateRateBasisPoints(benchmark["rate_bp"], `${path}.rate_bp`, "rate_bp", {
    required: true,
  });
  const netOfTax = benchmark["net_of_tax"];
  if (typeof netOfTax !== "boolean") {
    throw invalid(`${path}.net_of_tax`, "net_of_tax must be true or false");
  }
  const source = validateSource(benchmark["source"], `${path}.source`);

  return { name, rate_bp: rateBp as number, net_of_tax: netOfTax, ...(source === undefined ? {} : { source }) };
}

function validateSource(raw: unknown, path: string): SourceInput | undefined {
  if (raw === undefined) return undefined;
  const source = expectObject(raw, path, SOURCE_KEYS);
  const title = source["title"];
  const url = source["url"];
  if (typeof title !== "string" || title.trim() === "") {
    throw invalid(`${path}.title`, "title must be a non-empty string");
  }
  if (typeof url !== "string" || !url.startsWith("https://")) {
    throw invalid(`${path}.url`, "url must be an https URL");
  }
  return { title, url };
}

function validateTermPremium(raw: unknown): TermPremiumInput | undefined {
  if (raw === undefined) return undefined;
  const termPremium = expectObject(raw, "term_premium", TERM_PREMIUM_KEYS);
  const amount = validateWholeRupees(termPremium["amount"], "term_premium.amount", "amount");
  const sumAssured = validateWholeRupees(
    termPremium["sum_assured"],
    "term_premium.sum_assured",
    "sum_assured",
  );
  return { amount, sum_assured: sumAssured };
}

/** A whole number of policy years: at least one, with no fraction — a term is never "expected error". */
function validateWholeYears(raw: unknown, path: string): number {
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 1) {
    throw invalid(path, `${path} must be a whole number of years, at least 1`);
  }
  return raw;
}

/** The one shape of an `above_cap` rejection, whatever figure exceeded it. */
function aboveCap(path: string, message: string): InsuranceError {
  return new InsuranceError({ code: "above_cap", message, path, details: { cap_rupees: RUPEE_INPUT_CAP } });
}

/**
 * Whole, non-negative rupees, and at most ₹100 crore, so every later product
 * of paise and basis points stays a safe integer.
 */
function validateWholeRupees(raw: unknown, path: string, label: string): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    throw invalid(path, `${label} must be a number of whole rupees`);
  }
  if (!Number.isInteger(raw)) {
    throw new InsuranceError({
      code: "fractional_rupees",
      message: `${label} must be whole rupees, got ${raw}`,
      path,
    });
  }
  if (raw < 0) {
    throw new InsuranceError({
      code: "negative_amount",
      message: `${label} must not be negative, got ${raw}`,
      path,
    });
  }
  if (rupeesToPaise(raw) > CAP_PAISE) {
    throw aboveCap(
      path,
      `${label} must not exceed ${formatIndianRupees(CAP_PAISE)}, got ${formatIndianRupees(rupeesToPaise(raw))}`,
    );
  }
  return raw;
}

function validateOptionalWholeRupees(raw: unknown, path: string): number | undefined {
  if (raw === undefined) return undefined;
  return validateWholeRupees(raw, path, path);
}

/** A rate in basis points, within −9999..10000; `required` names the field for the message when absent. */
function validateRateBasisPoints(
  raw: unknown,
  path: string,
  label: string,
  { required }: { required: boolean },
): number | undefined {
  if (raw === undefined) {
    if (required) throw invalid(path, `${label} is required, in basis points`);
    return undefined;
  }
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    throw invalid(path, `${label} must be a whole number of basis points`);
  }
  if (raw < MIN_RATE_BP || raw > MAX_RATE_BP) {
    throw new InsuranceError({
      code: "rate_out_of_range",
      message: `${label} must be between ${MIN_RATE_BP} and ${MAX_RATE_BP} basis points, got ${raw}`,
      path,
      details: { value: raw, minimum: MIN_RATE_BP, maximum: MAX_RATE_BP },
    });
  }
  return raw;
}

function expectObject(raw: unknown, path: string, allowedKeys: readonly string[]): { [key: string]: unknown } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw invalid(path, `expected an object with keys ${allowedKeys.join(", ")}`);
  }
  const object = raw as { [key: string]: unknown };
  for (const key of Object.keys(object)) {
    if (!allowedKeys.includes(key)) {
      throw invalid(path === "" ? key : `${path}.${key}`, `unknown key ${JSON.stringify(key)}`);
    }
  }
  return object;
}

function invalid(path: string, message: string): InsuranceError {
  return new InsuranceError({
    code: "invalid_input",
    message: path === "" ? message : `${path}: ${message}`,
    path,
  });
}
