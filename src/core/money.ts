/**
 * Money is integer paise (ADR 0002). Display strings use Indian digit
 * grouping and are produced here and nowhere else (ADR 0003).
 */
import { divideWithRemainder } from "./arithmetic.ts";

export interface Money {
  paise: number;
  display: string;
}

export type Period = "annual" | "monthly";

export const PAISE_PER_RUPEE = 100;
export const MONTHS_PER_YEAR = 12;
/** ₹100 crore: the largest single figure accepted as input, keeping every product of paise and basis points a safe integer. */
export const RUPEE_INPUT_CAP = 1_000_000_000;
/** A rate of 1 (100%) once the rules loader has converted it to basis points. */
export const BASIS_POINTS_PER_UNIT = 10000;

export function rupeesToPaise(wholeRupees: number): number {
  return wholeRupees * PAISE_PER_RUPEE;
}

export function annualise(paise: number, period: Period): number {
  return period === "monthly" ? paise * MONTHS_PER_YEAR : paise;
}

export function money(paise: number): Money {
  return { paise, display: formatIndianRupees(paise) };
}

/** `123456700` paise → `₹12,34,567`; `5050` → `₹50.50`. Pure string handling: no division. */
export function formatIndianRupees(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const digits = String(paise < 0 ? -paise : paise).padStart(3, "0");
  const rupees = digits.slice(0, -2);
  const fraction = digits.slice(-2);
  const lastThree = rupees.slice(-3);
  const rest = rupees.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  const grouped = rest === "" ? lastThree : `${rest},${lastThree}`;
  return `${sign}₹${grouped}${fraction === "00" ? "" : `.${fraction}`}`;
}

/**
 * Applies a rate to an amount: `paise × basisPoints ÷ 10000`, with the
 * sub-paise remainder discarded rather than rounded (ADR 0012). Rounding
 * happens only where a statute says so.
 */
export function applyRate(paise: number, basisPoints: number): number {
  return divideWithRemainder(paise * basisPoints, BASIS_POINTS_PER_UNIT).quotient;
}

/**
 * A month of an annual figure, truncated towards zero. The discarded remainder
 * is under a rupee a year, and twelve monthly figures may therefore fall a few
 * paise short of the annual one they came from; that is why every figure the
 * decoder emits names its own period rather than inviting the reader to
 * multiply one out of the other.
 *
 * A negative figure is not nonsense to be refused here: deductions the user
 * typed can exceed the pay they were typed against, and a take-home below zero
 * is the honest report of that.
 */
export function perMonth(annualPaise: number): number {
  const negative = annualPaise < 0;
  const magnitude = negative ? -annualPaise : annualPaise;
  const month = divideWithRemainder(magnitude, MONTHS_PER_YEAR).quotient;
  return negative ? -month : month;
}

/**
 * Rounds to the nearest whole multiple of `unitRupees`, halves upward: the
 * shape of both statutory rounding rules, whose unit comes from the rules file
 * and never from here.
 *
 * The ₹10 rule is worded as "ignore the paise, then round the rupee figure",
 * which is this same half-up rounding: the paise can only change the outcome at
 * an exact `₹…5.00`, where both readings round up.
 */
export function roundToMultipleOfRupees(paise: number, unitRupees: number): number {
  const unitPaise = rupeesToPaise(unitRupees);
  const { quotient, remainder } = divideWithRemainder(paise, unitPaise);
  const units = remainder * 2 >= unitPaise ? quotient + 1 : quotient;
  return units * unitPaise;
}
