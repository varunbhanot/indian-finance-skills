/**
 * Money is integer paise (ADR 0002). Display strings use Indian digit
 * grouping and are produced here and nowhere else (ADR 0003).
 */
export interface Money {
  paise: number;
  display: string;
}

export type Period = "annual" | "monthly";

export const PAISE_PER_RUPEE = 100;
export const MONTHS_PER_YEAR = 12;
/** ₹100 crore: the largest single figure accepted as input, keeping every product of paise and basis points a safe integer. */
export const RUPEE_INPUT_CAP = 1_000_000_000;

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
