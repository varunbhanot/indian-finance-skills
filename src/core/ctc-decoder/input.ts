/**
 * The typed offer as the skill submits it, validated at the boundary.
 * Amounts are whole rupees; the core converts them to paise (ADR 0002).
 * Unknown keys are rejected, so a ticket adding a field extends this file.
 *
 * Each component either names a `type` the rules file's catalogue knows, or
 * classifies itself inline. Inline means all three of `certainty`, `form` and
 * `recurring`: the two axes alone cannot separate a joining bonus from basic
 * pay, which share both of them and differ only in recurring, so a defaulted
 * flag would be the decoder quietly guessing (ADR 0004).
 */
import { isFinancialYear } from "../financial-year.ts";
import { annualise, formatIndianRupees, rupeesToPaise, RUPEE_INPUT_CAP, type Period } from "../money.ts";
import { isCertainty, isForm, type Classification } from "./classification.ts";
import { DecoderError } from "./errors.ts";

/** How the user asked for this component to be classified. */
export type ComponentClassificationInput =
  | { kind: "catalogue"; type: string }
  | { kind: "inline"; classification: Classification };

export interface OfferComponentInput {
  name: string;
  amount: number;
  period: Period;
  classify: ComponentClassificationInput;
  /** Months for which a one-time component may be clawed back, when the letter states one. */
  clawback_months?: number;
}

export interface OfferInput {
  financial_year: string;
  components: OfferComponentInput[];
}

const PERIODS: ReadonlySet<string> = new Set(["annual", "monthly"]);
const CAP_PAISE = rupeesToPaise(RUPEE_INPUT_CAP);
const COMPONENT_KEYS = [
  "name",
  "amount",
  "period",
  "type",
  "certainty",
  "form",
  "recurring",
  "clawback_months",
];

export function validateOfferInput(raw: unknown): OfferInput {
  const root = expectObject(raw, "", ["financial_year", "components"]);

  const financialYear = root["financial_year"];
  if (typeof financialYear !== "string") {
    throw invalid("financial_year", 'financial_year is required, as a string such as "2026-27"');
  }
  if (!isFinancialYear(financialYear)) {
    throw new DecoderError({
      code: "invalid_financial_year",
      message: `financial_year must be written YYYY-YY naming consecutive years, got ${JSON.stringify(financialYear)}`,
      path: "financial_year",
    });
  }

  const components = root["components"];
  if (!Array.isArray(components) || components.length === 0) {
    throw invalid("components", "components must be a non-empty array");
  }

  return {
    financial_year: financialYear,
    components: components.map((component, index) =>
      validateComponent(component, `components[${index}]`),
    ),
  };
}

function validateComponent(raw: unknown, path: string): OfferComponentInput {
  const component = expectObject(raw, path, COMPONENT_KEYS);

  const name = component["name"];
  if (typeof name !== "string" || name.trim() === "") {
    throw invalid(`${path}.name`, "name must be a non-empty string");
  }

  const period = component["period"];
  if (typeof period !== "string" || !PERIODS.has(period)) {
    throw invalid(`${path}.period`, 'period must be "annual" or "monthly"');
  }

  const amount = validateAmount(component["amount"], period as Period, `${path}.amount`);
  const classify = validateClassification(component, path);
  const clawbackMonths = validateClawbackMonths(component["clawback_months"], `${path}.clawback_months`);

  return {
    name,
    amount,
    period: period as Period,
    classify,
    ...(clawbackMonths === undefined ? {} : { clawback_months: clawbackMonths }),
  };
}

/** Either a catalogue type or the axes inline, never both and never neither. */
function validateClassification(
  component: { [key: string]: unknown },
  path: string,
): ComponentClassificationInput {
  const type = component["type"];
  const inlineKeys = ["certainty", "form", "recurring"].filter(
    (key) => component[key] !== undefined,
  );

  if (type !== undefined) {
    if (typeof type !== "string" || type.trim() === "") {
      throw invalid(`${path}.type`, "type must be a non-empty string naming a catalogue entry");
    }
    if (inlineKeys.length > 0) {
      throw invalid(
        `${path}.${inlineKeys[0]}`,
        `a component names a catalogue type or classifies itself inline, not both; ${JSON.stringify(type)} already names a type`,
      );
    }
    return { kind: "catalogue", type };
  }

  if (inlineKeys.length === 0) {
    throw invalid(
      `${path}.type`,
      "a component must name a catalogue type, or give certainty, form and recurring inline",
    );
  }

  const certainty = component["certainty"];
  if (!isCertainty(certainty)) {
    throw invalid(
      `${path}.certainty`,
      `certainty must be guaranteed, conditional-on-performance, conditional-on-tenure or conditional-on-liquidity, got ${JSON.stringify(certainty)}`,
    );
  }
  const form = component["form"];
  if (!isForm(form)) {
    throw invalid(
      `${path}.form`,
      `form must be cash-now, deferred-cash, locked-savings, equity or benefit-in-kind, got ${JSON.stringify(form)}`,
    );
  }
  const recurring = component["recurring"];
  if (typeof recurring !== "boolean") {
    throw invalid(
      `${path}.recurring`,
      "recurring must be true or false: the axes alone do not separate a one-time component from a monthly one",
    );
  }
  return { kind: "inline", classification: { certainty, form, recurring } };
}

function validateClawbackMonths(raw: unknown, path: string): number | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw <= 0) {
    throw invalid(path, "clawback_months must be a whole number of months greater than zero");
  }
  return raw;
}

/**
 * Whole, non-negative rupees, and at most ₹100 crore both as typed and once
 * annualised, so every later product of paise and basis points stays a safe
 * integer (spec #4).
 */
function validateAmount(raw: unknown, period: Period, path: string): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    throw invalid(path, "amount must be a number of whole rupees");
  }
  if (!Number.isInteger(raw)) {
    throw new DecoderError({
      code: "fractional_rupees",
      message: `amount must be whole rupees, got ${raw}`,
      path,
    });
  }
  if (raw < 0) {
    throw new DecoderError({
      code: "negative_amount",
      message: `amount must not be negative, got ${raw}`,
      path,
    });
  }
  const annualPaise = annualise(rupeesToPaise(raw), period);
  if (annualPaise > CAP_PAISE) {
    const typed = formatIndianRupees(rupeesToPaise(raw));
    const annual = formatIndianRupees(annualPaise);
    throw new DecoderError({
      code: "above_cap",
      message:
        period === "monthly"
          ? `amount must not exceed ${formatIndianRupees(CAP_PAISE)} a year; ${typed} monthly is ${annual} a year`
          : `amount must not exceed ${formatIndianRupees(CAP_PAISE)}, got ${typed}`,
      path,
      details: { cap_rupees: RUPEE_INPUT_CAP },
    });
  }
  return raw;
}

function expectObject(
  raw: unknown,
  path: string,
  allowedKeys: readonly string[],
): { [key: string]: unknown } {
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

function invalid(path: string, message: string): DecoderError {
  return new DecoderError({
    code: "invalid_input",
    message: path === "" ? message : `${path}: ${message}`,
    path,
  });
}
