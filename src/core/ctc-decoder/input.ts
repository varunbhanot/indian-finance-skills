/**
 * The typed offer as the skill submits it, validated at the boundary.
 * Amounts are whole rupees; the core converts them to paise (ADR 0002).
 */
import { RUPEE_INPUT_CAP, type Period } from "../money.ts";
import { rulesFileExists, rulesFilePathFor } from "../rules/files.ts";
import { isConsecutiveFinancialYear } from "../rules/loader.ts";
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

export function validateOfferInput(raw: unknown): OfferInput {
  const root = expectObject(raw, "", ["financial_year", "components"]);

  const financialYear = root["financial_year"];
  if (typeof financialYear !== "string") {
    throw invalid("financial_year", "financial_year is required, as a string such as \"2026-27\"");
  }
  if (!isConsecutiveFinancialYear(financialYear)) {
    throw new DecoderError({
      code: "invalid_financial_year",
      message: `financial_year must be written YYYY-YY naming consecutive years, got ${JSON.stringify(financialYear)}`,
      path: "financial_year",
    });
  }
  if (!rulesFileExists(financialYear)) {
    throw new DecoderError({
      code: "unknown_financial_year",
      message: `No rules file for financial year ${financialYear}: expected ${rulesFilePathFor(financialYear)}`,
      path: "financial_year",
      details: { financial_year: financialYear, expected_file: rulesFilePathFor(financialYear) },
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

  const amount = validateAmount(component["amount"], `${path}.amount`);
  return { name, amount, period: period as Period };
}

function validateAmount(raw: unknown, path: string): number {
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
  if (raw > RUPEE_INPUT_CAP) {
    throw new DecoderError({
      code: "above_cap",
      message: `amount must not exceed ₹100 crore (${RUPEE_INPUT_CAP} rupees), got ${raw}`,
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
