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
import type {
  Certainty,
  Classification,
  ClassifiedComponent,
  EquityReading,
  Form,
} from "./classification.ts";

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
  /** What the letter claims the equity grants are worth, whatever they were valued at. */
  equity_as_claimed: Total;
  /** What the decoder holds those same grants at (ADR 0005). */
  equity_as_valued: Total;
  /**
   * The **claimed** value of the grants the decoder refuses to value — the same
   * basis as `equity_as_claimed` and not as `equity_as_valued`, which holds
   * every one of them at nil. It answers "how much of what the letter counted
   * rests on a figure nobody can check", so it has to be the letter's number.
   * Never dropped from the output, and in no total of cash.
   */
  unvaluable_equity: Total;
}

/** Cash-now and recurring, with certainty narrowed to whichever set the caller names. */
function isRecurringCashOfCertainty(
  classification: Classification,
  certainties: ReadonlySet<Certainty>,
): boolean {
  return (
    certainties.has(classification.certainty) &&
    classification.form === "cash-now" &&
    classification.recurring
  );
}

const GUARANTEED: ReadonlySet<Certainty> = new Set(["guaranteed"]);
const GUARANTEED_OR_AT_TARGET: ReadonlySet<Certainty> = new Set([
  "guaranteed",
  "conditional-on-performance",
]);

/**
 * Guaranteed recurring cash, derived and never listed: the components that are
 * simultaneously certain, cash, and annual. Gratuity fails the first two,
 * employer PF the second, a joining bonus the third — none of them by name.
 */
export function countsTowardGuaranteedRecurringCash(classification: Classification): boolean {
  return isRecurringCashOfCertainty(classification, GUARANTEED);
}

/**
 * The same reading with variable pay at its quoted target: still cash, still
 * annual, but no longer only what is certain. The two predicates differ in one
 * axis, which is the whole difference between the two bases take-home is
 * reported on.
 */
export function countsTowardRecurringCashAtTarget(classification: Classification): boolean {
  return isRecurringCashOfCertainty(classification, GUARANTEED_OR_AT_TARGET);
}

/**
 * A one-time component that lands whole in the year it arrives. Non-recurring,
 * and not equity: a grant is non-recurring too, but its value arrives over the
 * years its schedule names rather than all at once, so the year-by-year reading
 * spreads it instead and counting it here would count it in year one as well.
 * That is the one place the two readings of "one-time" differ —
 * `one_time_components` below is every non-recurring component, grants included,
 * because as a *total* the grant is a one-time award and belongs in it.
 */
export function landsWholeInYearOne(classification: Classification): boolean {
  return !classification.recurring && classification.form !== "equity";
}

/**
 * The two bases every reading of an offer is reported on, each paired with the
 * predicate that selects its recurring cash: variable pay at zero, and variable
 * pay at its quoted target. Declared once, because take-home and the
 * year-by-year table report the same two bases in the same order and a second
 * list is how the two would come to disagree about what a basis is. The order
 * carries no preference (ADR 0007).
 */
export const BASES = [
  { basis: "variable-pay-at-zero", counts: countsTowardGuaranteedRecurringCash },
  { basis: "variable-pay-at-target", counts: countsTowardRecurringCashAtTarget },
] as const;

export type Basis = (typeof BASES)[number]["basis"];

/**
 * Retirals are derived as "counted in CTC, but not cash now" — the deferred and
 * locked-savings forms. That is broader than the three employer contributions
 * CONTEXT.md names: a user-defined deferred component joins them. Broader is
 * the honest reading, since what the user needs to know is which part of CTC
 * they cannot spend, and narrowing it would mean naming component types in
 * code, which is what ADR 0004 exists to avoid.
 */
const RETIRAL_FORMS: ReadonlySet<Form> = new Set<Form>(["locked-savings", "deferred-cash"]);

export function totalsFor(components: readonly ClassifiedComponent[]): OfferTotals {
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
    // The three equity readings, and the gap between the first two is the point
    // of them: what the letter counted, and what survives a refusal to forecast
    // a share price. None of them is a cash total, and none can become one —
    // equity is not the cash-now form, so every cash figure above excludes it
    // whatever it was valued at.
    equity_as_claimed: total(components, (classification) => classification.form === "equity"),
    equity_as_valued: totalOfGrants(components, (equity) => equity.valued_paise),
    unvaluable_equity: totalOfGrants(components, (equity, component) =>
      equity.unvaluable ? component.annual_paise : undefined,
    ),
  };
}

/**
 * The one shape a total takes: what each component contributes, or nothing when
 * it is outside the reading. Both builders below reduce to this, so a figure and
 * the names beside it can never come apart — `components` lists exactly what was
 * added up, whichever reading did the adding.
 */
function totalOf(
  components: readonly ClassifiedComponent[],
  contribution: (component: ClassifiedComponent) => number | undefined,
): Total {
  const included: { name: string; paise: number }[] = [];
  for (const component of components) {
    const paise = contribution(component);
    if (paise !== undefined) included.push({ name: component.name, paise });
  }
  return {
    ...money(included.reduce((sum, one) => sum + one.paise, 0)),
    components: included.map((one) => one.name),
  };
}

/** A total of the amounts as typed, over the components a predicate on the axes admits. */
function total(
  components: readonly ClassifiedComponent[],
  includes: (classification: Classification) => boolean,
): Total {
  return totalOf(components, (component) =>
    includes(component.classification) ? component.annual_paise : undefined,
  );
}

/**
 * A total over the equity grants alone, summing whatever figure the reading
 * names rather than the amount typed — because what a grant is held at is not
 * what the letter counted it as.
 */
function totalOfGrants(
  components: readonly ClassifiedComponent[],
  paiseOf: (equity: EquityReading, component: ClassifiedComponent) => number | undefined,
): Total {
  return totalOf(components, (component) =>
    component.equity === undefined ? undefined : paiseOf(component.equity, component),
  );
}
