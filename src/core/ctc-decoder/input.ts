/**
 * The typed offer as the skill submits it, validated at the boundary.
 * Amounts are whole rupees; the core converts them to paise (ADR 0002).
 * Unknown keys are rejected, so a ticket adding a field extends this file.
 */
import { isFinancialYear } from "../financial-year.ts";
import { annualise, formatIndianRupees, rupeesToPaise, RUPEE_INPUT_CAP, type Period } from "../money.ts";
import { DecoderError } from "./errors.ts";

export interface OfferComponentInput {
  name: string;
  amount: number;
  period: Period;
}

export interface OfferInput {
  financial_year: string;
  components: OfferComponentInput[];
}

const PERIODS: ReadonlySet<string> = new Set(["annual", "monthly"]);
const CAP_PAISE = rupeesToPaise(RUPEE_INPUT_CAP);

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
  const component = expectObject(raw, path, ["name", "amount", "period"]);

  const name = component["name"];
  if (typeof name !== "string" || name.trim() === "") {
    throw invalid(`${path}.name`, "name must be a non-empty string");
  }

  const period = component["period"];
  if (typeof period !== "string" || !PERIODS.has(period)) {
    throw invalid(`${path}.period`, 'period must be "annual" or "monthly"');
  }

  const amount = validateAmount(component["amount"], period as Period, `${path}.amount`);
  return { name, amount, period: period as Period };
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
