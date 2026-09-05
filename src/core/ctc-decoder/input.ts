/**
 * The typed offer as the skill submits it, validated at the boundary.
 * Amounts are whole rupees; the core converts them to paise (ADR 0002).
 * Unknown keys are rejected, so a ticket adding a field extends this file.
 *
 * Each component either names a `type` the rules file's catalogue knows, or
 * classifies itself inline. Inline means all three of `certainty`, `form` and
 * `recurring` (and `instrument` for equity): the two axes alone cannot separate
 * a joining bonus from basic pay, which share both of them and differ only in
 * recurring, so a defaulted flag would be the decoder quietly guessing.
 * `classification.ts` reads them, so the catalogue and the user's own answer
 * are held to one vocabulary (ADR 0004).
 *
 * An equity grant carries one more block, `equity`, holding what the letter says
 * about the shares: whether the company is listed, the units and prices where it
 * states them, and the vesting schedule, which is required and must account for
 * the whole grant (ADR 0005). Every figure in it is typed from the letter; no
 * growth rate is accepted anywhere, in this file or below it.
 */
import { isFinancialYear } from "../financial-year.ts";
import {
  annualise,
  BASIS_POINTS_PER_UNIT,
  formatIndianRupees,
  rupeesToPaise,
  RUPEE_INPUT_CAP,
  type Period,
} from "../money.ts";
import { readClassification, type Classification } from "./classification.ts";
import { DecoderError } from "./errors.ts";
import { PF_WAGE_BASES, type PfWageBase, type TakeHomeRequest } from "./take-home.ts";

/** How the user asked for this component to be classified. */
export type ComponentClassificationInput =
  | { kind: "catalogue"; type: string }
  | { kind: "inline"; classification: Classification };

/**
 * A vesting schedule as the letter states it: what share of the grant arrives in
 * each year, in basis points, and the months before which nothing arrives at
 * all. Typed from the letter and never looked up — this repository must not
 * carry a claim about how a named employer vests (ADR 0005).
 */
export interface VestingInput {
  /** One entry per year, in order, each a share of the whole grant in basis points. */
  years: number[];
  cliff_months?: number;
}

/**
 * The part of an equity grant that is not classification: what the letter says
 * about the shares themselves. Each field is checked here for its own shape
 * only. Which combinations make sense is a question about the instrument, which
 * the catalogue answers rather than the caller, so `equity.ts` settles it once
 * the component has been classified.
 */
export interface EquityGrantInput {
  /** Whether the shares have a market price at all; the whole valuation turns on it. */
  listed: boolean;
  units?: number;
  /** Grant-date fair market value per unit, in whole rupees. */
  grant_date_fair_market_value?: number;
  /** Exercise price per unit, in whole rupees. */
  strike?: number;
  /** The discount a share purchase plan offers, in basis points, as the letter states it. */
  discount_basis_points?: number;
  /** Absent only where the instrument has no vesting to state; `equity.ts` decides which. */
  vesting?: VestingInput;
}

export interface OfferComponentInput {
  name: string;
  amount: number;
  period: Period;
  classify: ComponentClassificationInput;
  /** Months for which a one-time component may be clawed back, when the letter states one. */
  clawback_months?: number;
  /** Present only for an equity grant; `decode.ts` holds it to the classification. */
  equity?: EquityGrantInput;
}

export interface OfferInput {
  financial_year: string;
  components: OfferComponentInput[];
  /**
   * Present when the caller typed the one thing take-home cannot be derived
   * without: which wage the employer computes provident fund on. There is no
   * default, because both answers are ordinary and guessing between them would
   * move the monthly figure by thousands.
   */
  take_home?: TakeHomeRequest;
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
  "instrument",
  "clawback_months",
  "equity",
];
const EQUITY_KEYS = [
  "listed",
  "units",
  "grant_date_fair_market_value",
  "strike",
  "discount_basis_points",
  "vesting",
];
const VESTING_KEYS = ["years", "cliff_months"];
const INLINE_KEYS = ["certainty", "form", "recurring", "instrument"];

export function validateOfferInput(raw: unknown): OfferInput {
  const root = expectObject(raw, "", [
    "financial_year",
    "components",
    "pf_wage_base",
    "professional_tax",
  ]);

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

  const takeHome = validateTakeHomeRequest(root);
  const validated = components.map((component, index) =>
    validateComponent(component, `components[${index}]`),
  );
  rejectTotalAboveCap(validated);

  return {
    financial_year: financialYear,
    components: validated,
    ...(takeHome === undefined ? {} : { take_home: takeHome }),
  };
}

/**
 * The cap binds the total as well as each figure, because rates are applied to
 * sums — a slab charge and the provident fund wage are both totals of several
 * components — and it is the product of paise and basis points that has to stay
 * a safe integer (ADR 0002, ADR 0012). Capping only the parts would let enough
 * of them add up to break that, and the core would fail as a crash rather than
 * as a rejection naming the problem.
 */
function rejectTotalAboveCap(components: readonly OfferComponentInput[]): void {
  const total = components.reduce(
    (running, component) => running + annualise(rupeesToPaise(component.amount), component.period),
    0,
  );
  if (total <= CAP_PAISE) return;
  throw aboveCap(
    "components",
    `the components add up to ${formatIndianRupees(total)} a year, above the ${formatIndianRupees(CAP_PAISE)} the decoder accepts`,
  );
}

/** The one shape of an `above_cap` rejection, whatever figure exceeded it. */
function aboveCap(path: string, message: string): DecoderError {
  return new DecoderError({ code: "above_cap", message, path, details: { cap_rupees: RUPEE_INPUT_CAP } });
}

/**
 * Take-home is computed when, and only when, `pf_wage_base` is typed. A
 * professional tax figure on its own would be a number the caller supplied and
 * the decoder never used, so it is refused rather than ignored.
 */
function validateTakeHomeRequest(root: { [key: string]: unknown }): TakeHomeRequest | undefined {
  const wageBase = root["pf_wage_base"];
  const professionalTax = root["professional_tax"];

  if (wageBase === undefined) {
    if (professionalTax !== undefined) {
      throw invalid(
        "professional_tax",
        "professional_tax is only used in the take-home figures, which need pf_wage_base as well",
      );
    }
    return undefined;
  }
  if (typeof wageBase !== "string" || !PF_WAGE_BASES.includes(wageBase as PfWageBase)) {
    throw invalid(
      "pf_wage_base",
      `pf_wage_base must be one of ${PF_WAGE_BASES.join(", ")}, got ${JSON.stringify(wageBase)}`,
    );
  }

  return {
    pf_wage_base: wageBase as PfWageBase,
    ...(professionalTax === undefined
      ? {}
      : {
          professional_tax: validateWholeRupees(
            professionalTax,
            "professional_tax",
            "professional_tax",
          ),
        }),
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

  const amount = validatePeriodicRupees(component["amount"], period as Period, `${path}.amount`, "amount");
  const classify = validateClassification(component, path);
  const clawbackMonths = validateClawbackMonths(component["clawback_months"], `${path}.clawback_months`);
  const equity = validateEquityGrant(component["equity"], `${path}.equity`);

  return {
    name,
    amount,
    period: period as Period,
    classify,
    ...(clawbackMonths === undefined ? {} : { clawback_months: clawbackMonths }),
    ...(equity === undefined ? {} : { equity }),
  };
}

/**
 * The shape of an equity grant's own fields. Every figure per unit is capped
 * like any other typed amount, and `units` with it, so that the product
 * `equity.ts` takes of the two can be bounded without either operand having
 * already left the safe range (ADR 0002).
 */
function validateEquityGrant(raw: unknown, path: string): EquityGrantInput | undefined {
  if (raw === undefined) return undefined;
  const grant = expectObject(raw, path, EQUITY_KEYS);

  const listed = grant["listed"];
  if (typeof listed !== "boolean") {
    throw invalid(
      `${path}.listed`,
      "listed must be true or false: whether the shares have a market price is what decides whether the grant can be valued at all",
    );
  }

  const units = validateUnits(grant["units"], `${path}.units`);
  const fairMarketValue = validatePerUnitRupees(grant, "grant_date_fair_market_value", path);
  const strike = validatePerUnitRupees(grant, "strike", path);
  const discount = validateDiscountBasisPoints(
    grant["discount_basis_points"],
    `${path}.discount_basis_points`,
  );
  const vesting = validateVesting(grant["vesting"], `${path}.vesting`);

  return {
    listed,
    ...(units === undefined ? {} : { units }),
    ...(fairMarketValue === undefined ? {} : { grant_date_fair_market_value: fairMarketValue }),
    ...(strike === undefined ? {} : { strike }),
    ...(discount === undefined ? {} : { discount_basis_points: discount }),
    ...(vesting === undefined ? {} : { vesting }),
  };
}

/** A price per unit: whole rupees, held to the same cap as any other typed figure. */
function validatePerUnitRupees(
  grant: { [key: string]: unknown },
  field: string,
  path: string,
): number | undefined {
  const raw = grant[field];
  return raw === undefined ? undefined : validateWholeRupees(raw, `${path}.${field}`, field);
}

/**
 * The schedule, echoed as typed and refused unless it accounts for the whole
 * grant. A schedule summing to anything but 10000 basis points describes a
 * grant the letter has not fully described, and averaging the difference away
 * is exactly the reading ADR 0005 exists to refuse.
 *
 * Whether a schedule is required at all is the instrument's question, not this
 * one's: a grant that vests must state how, and a share purchase plan has
 * nothing to state. `equity.ts` asks it.
 */
function validateVesting(raw: unknown, path: string): VestingInput | undefined {
  if (raw === undefined) return undefined;
  const vesting = expectObject(raw, path, VESTING_KEYS);

  const rawYears = vesting["years"];
  if (!Array.isArray(rawYears) || rawYears.length === 0) {
    throw invalid(`${path}.years`, "years must be a non-empty array of basis points, one entry per year");
  }
  const years = rawYears.map((share, index) => {
    const yearPath = `${path}.years[${index}]`;
    if (typeof share !== "number" || !Number.isInteger(share) || share < 0 || share > BASIS_POINTS_PER_UNIT) {
      throw invalid(
        yearPath,
        `a year's share must be a whole number of basis points between 0 and ${BASIS_POINTS_PER_UNIT}, got ${JSON.stringify(share)}`,
      );
    }
    return share;
  });

  const total = years.reduce((running, share) => running + share, 0);
  if (total !== BASIS_POINTS_PER_UNIT) {
    throw new DecoderError({
      code: "vesting_schedule_not_whole",
      message: `${path}.years: a vesting schedule must account for the whole grant, which is ${BASIS_POINTS_PER_UNIT} basis points; these ${years.length} years total ${total}`,
      path: `${path}.years`,
      details: { basis_points: total, expected_basis_points: BASIS_POINTS_PER_UNIT, years: years.length },
    });
  }

  const cliffMonths = vesting["cliff_months"];
  if (cliffMonths === undefined) return { years };
  if (typeof cliffMonths !== "number" || !Number.isInteger(cliffMonths) || cliffMonths <= 0) {
    throw invalid(`${path}.cliff_months`, "cliff_months must be a whole number of months greater than zero");
  }
  return { years, cliff_months: cliffMonths };
}

/** A count of units: whole, at least one, and bounded like a rupee figure so products of the two stay safe. */
function validateUnits(raw: unknown, path: string): number | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw <= 0) {
    throw invalid(path, "units must be a whole number greater than zero");
  }
  if (raw > RUPEE_INPUT_CAP) {
    throw aboveCap(path, `units must not exceed ${RUPEE_INPUT_CAP}, got ${raw}`);
  }
  return raw;
}

/** A discount as the letter states it, in basis points: below the whole price, and above nothing. */
function validateDiscountBasisPoints(raw: unknown, path: string): number | undefined {
  if (raw === undefined) return undefined;
  if (
    typeof raw !== "number" ||
    !Number.isInteger(raw) ||
    raw <= 0 ||
    raw >= BASIS_POINTS_PER_UNIT
  ) {
    throw invalid(
      path,
      `discount_basis_points must be a whole number of basis points between 1 and ${BASIS_POINTS_PER_UNIT - 1}, got ${JSON.stringify(raw)}`,
    );
  }
  return raw;
}

/** Either a catalogue type or the axes inline, never both and never neither. */
function validateClassification(
  component: { [key: string]: unknown },
  path: string,
): ComponentClassificationInput {
  const type = component["type"];
  const inlineGiven = INLINE_KEYS.filter((key) => component[key] !== undefined);

  if (type !== undefined) {
    if (typeof type !== "string" || type.trim() === "") {
      throw invalid(`${path}.type`, "type must be a non-empty string naming a catalogue entry");
    }
    if (inlineGiven.length > 0) {
      throw invalid(
        `${path}.${inlineGiven[0]}`,
        `a component names a catalogue type or classifies itself inline, not both; ${JSON.stringify(type)} already names a type`,
      );
    }
    return { kind: "catalogue", type };
  }

  if (inlineGiven.length === 0) {
    throw invalid(
      `${path}.type`,
      "a component must name a catalogue type, or give certainty, form and recurring inline",
    );
  }

  return {
    kind: "inline",
    classification: readClassification(
      (field) => component[field],
      (field, message) => invalid(`${path}.${field}`, message),
    ),
  };
}

function validateClawbackMonths(raw: unknown, path: string): number | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw <= 0) {
    throw invalid(path, "clawback_months must be a whole number of months greater than zero");
  }
  return raw;
}

/**
 * Whole, non-negative rupees, and at most ₹100 crore, so every later product of
 * paise and basis points stays a safe integer (spec #4). This is the check for
 * a figure that stands on its own — a price per unit, which has no period to
 * annualise over and none to report in a rejection.
 */
function validateWholeRupees(raw: unknown, path: string, label: string): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    throw invalid(path, `${label} must be a number of whole rupees`);
  }
  if (!Number.isInteger(raw)) {
    throw new DecoderError({
      code: "fractional_rupees",
      message: `${label} must be whole rupees, got ${raw}`,
      path,
    });
  }
  if (raw < 0) {
    throw new DecoderError({
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

/**
 * The same check for a figure the letter states per period: the cap binds what
 * it comes to over a year, so ₹1 crore a month is refused and says why.
 */
function validatePeriodicRupees(
  raw: unknown,
  period: Period,
  path: string,
  label: string,
): number {
  const rupees = validateWholeRupees(raw, path, label);
  const annualPaise = annualise(rupeesToPaise(rupees), period);
  if (annualPaise > CAP_PAISE) {
    throw aboveCap(
      path,
      `${label} must not exceed ${formatIndianRupees(CAP_PAISE)} a year; ${formatIndianRupees(rupeesToPaise(rupees))} monthly is ${formatIndianRupees(annualPaise)} a year`,
    );
  }
  return rupees;
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
