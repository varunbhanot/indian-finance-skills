/**
 * The two axes every offer component is classified on, plus the recurring flag
 * (ADR 0004). The vocabulary lives here because it is the model; which type
 * carries which value lives in the rules file, because that is data.
 *
 * Nothing here is a bucket. Gratuity is deferred *and* conditional on tenure;
 * an insurance premium is guaranteed but never cash. Every total in
 * `totals.ts` is a predicate over these three fields, so a component type added
 * to the rules file lands in the right totals with no code change.
 */

/** How sure the employee is of receiving the component at all. */
export const CERTAINTIES = [
  "guaranteed",
  "conditional-on-performance",
  "conditional-on-tenure",
  "conditional-on-liquidity",
] as const;
export type Certainty = (typeof CERTAINTIES)[number];

/** What the employee receives, if they receive it. */
export const FORMS = [
  "cash-now",
  "deferred-cash",
  "locked-savings",
  "equity",
  "benefit-in-kind",
] as const;
export type Form = (typeof FORMS)[number];

/** Only meaningful when the form is equity. */
export const INSTRUMENTS = ["rsu", "option", "espp"] as const;
export type Instrument = (typeof INSTRUMENTS)[number];

export interface Classification {
  certainty: Certainty;
  form: Form;
  /** True when the component arrives every year, false for a one-time item. */
  recurring: boolean;
  instrument?: Instrument;
}

export function isCertainty(value: unknown): value is Certainty {
  return CERTAINTIES.includes(value as Certainty);
}

export function isForm(value: unknown): value is Form {
  return FORMS.includes(value as Form);
}

export function isInstrument(value: unknown): value is Instrument {
  return INSTRUMENTS.includes(value as Instrument);
}
