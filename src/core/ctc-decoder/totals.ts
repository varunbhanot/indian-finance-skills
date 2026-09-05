/**
 * The totals a decoded offer carries. Every one of them is a predicate over the
 * two axes and the recurring flag (ADR 0004), summed over the components that
 * satisfy it, and every one names the components it was built from so the
 * skill can trace a figure back to lines on the letter.
 *
 * The totals overlap on purpose: they are readings of one package, not a
 * partition of it. A joining bonus is fixed pay *and* a one-time component;
 * gratuity is a retiral that no total of cash includes.
 */
import { money, type Money } from "../money.ts";
import type { Classification, Form } from "./classification.ts";

/** A component reduced to what a total needs: what it is worth, and what it is. */
export interface TotallableComponent {
  name: string;
  annual_paise: number;
  classification: Classification;
}

export interface Total extends Money {
  /** The names, as typed, of the components summed into this figure. */
  components: string[];
}

export interface OfferTotals {
  headline_ctc: Total;
  fixed_pay: Total;
  variable_pay_at_target: Total;
  guaranteed_recurring_cash: Total;
  retirals: Total;
  one_time_components: Total;
  benefits_in_kind: Total;
}

/**
 * Guaranteed recurring cash, derived and never listed: the components that are
 * simultaneously certain, cash, and annual. Gratuity fails the first two,
 * employer PF the second, a joining bonus the third — none of them by name.
 */
export function countsTowardGuaranteedRecurringCash(classification: Classification): boolean {
  return (
    classification.certainty === "guaranteed" &&
    classification.form === "cash-now" &&
    classification.recurring
  );
}

/**
 * The same reading with variable pay at its quoted target: still cash, still
 * annual, but no longer only what is certain. The two predicates differ in one
 * axis, which is the whole difference between the two bases take-home is
 * reported on.
 */
export function countsTowardRecurringCashAtTarget(classification: Classification): boolean {
  return (
    (classification.certainty === "guaranteed" ||
      classification.certainty === "conditional-on-performance") &&
    classification.form === "cash-now" &&
    classification.recurring
  );
}

/**
 * Retirals are derived as "counted in CTC, but not cash now" — the deferred and
 * locked-savings forms. That is broader than the three employer contributions
 * CONTEXT.md names: a user-defined deferred component joins them. Broader is
 * the honest reading, since what the user needs to know is which part of CTC
 * they cannot spend, and narrowing it would mean naming component types in
 * code, which is what ADR 0004 exists to avoid.
 */
const RETIRAL_FORMS: ReadonlySet<Form> = new Set<Form>(["locked-savings", "deferred-cash"]);

export function totalsFor(components: readonly TotallableComponent[]): OfferTotals {
  return {
    headline_ctc: total(components, () => true),
    // Fixed pay is everything not contingent on performance, which still
    // includes one-time items (CONTEXT.md) — it is not guaranteed recurring cash.
    fixed_pay: total(
      components,
      (classification) => classification.certainty !== "conditional-on-performance",
    ),
    variable_pay_at_target: total(
      components,
      (classification) => classification.certainty === "conditional-on-performance",
    ),
    guaranteed_recurring_cash: total(components, countsTowardGuaranteedRecurringCash),
    retirals: total(components, (classification) => RETIRAL_FORMS.has(classification.form)),
    one_time_components: total(components, (classification) => !classification.recurring),
    benefits_in_kind: total(
      components,
      (classification) => classification.form === "benefit-in-kind",
    ),
  };
}

function total(
  components: readonly TotallableComponent[],
  includes: (classification: Classification) => boolean,
): Total {
  const included = components.filter((component) => includes(component.classification));
  const paise = included.reduce((sum, component) => sum + component.annual_paise, 0);
  return { ...money(paise), components: included.map((component) => component.name) };
}
