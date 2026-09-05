/**
 * The two axes every offer component is classified on, plus the recurring flag
 * (ADR 0004). The vocabulary lives here because it is the model; which type
 * carries which value lives in the rules file, because that is data.
 *
 * Nothing here is a bucket. Gratuity is deferred *and* conditional on tenure;
 * an insurance premium is guaranteed but never cash. Every total in
 * `totals.ts` is a predicate over these three fields, so a component type added
 * to the rules file lands in the right totals with no code change.
 *
 * A classification arrives at the core from two places — the rules file's
 * catalogue and the user's own inline answer — and `readClassification` is the
 * only thing that reads one, so the two boundaries cannot drift apart or
 * disagree about what the axis values are.
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

/**
 * A component once the decoder has classified it: what it is worth, what it
 * is, and which catalogue entry said so. The one shape every reading of an
 * offer takes — the totals, basic pay, take-home — so a field added here
 * reaches all of them without anyone copying it across.
 */
export interface ClassifiedComponent {
  /** The name as the user typed it, which is how every reading names it back. */
  name: string;
  annual_paise: number;
  classification: Classification;
  /** The catalogue entry that classified it, absent when the user classified it inline. */
  catalogue_entry?: string;
}

/**
 * Reads the three fields (and `instrument` when the form is equity) from
 * wherever they were written. `read` fetches a field by name; `reject` builds
 * the rejection each caller reports — a rules-file error for the catalogue, an
 * input error for the user's own answer.
 */
export function readClassification(
  read: (field: string) => unknown,
  reject: (field: string, message: string) => Error,
): Classification {
  const certainty = read("certainty");
  if (!isCertainty(certainty)) {
    throw reject(
      "certainty",
      `certainty must be one of ${CERTAINTIES.join(", ")}, got ${JSON.stringify(certainty)}`,
    );
  }
  const form = read("form");
  if (!isForm(form)) {
    throw reject("form", `form must be one of ${FORMS.join(", ")}, got ${JSON.stringify(form)}`);
  }
  const recurring = read("recurring");
  if (typeof recurring !== "boolean") {
    throw reject(
      "recurring",
      "recurring must be true or false: the two axes alone do not separate a one-time component from a monthly one",
    );
  }

  const instrument = read("instrument");
  if (instrument === undefined) return { certainty, form, recurring };
  if (!isInstrument(instrument)) {
    throw reject(
      "instrument",
      `instrument must be one of ${INSTRUMENTS.join(", ")}, got ${JSON.stringify(instrument)}`,
    );
  }
  return { certainty, form, recurring, instrument };
}

function isCertainty(value: unknown): value is Certainty {
  return CERTAINTIES.includes(value as Certainty);
}

function isForm(value: unknown): value is Form {
  return FORMS.includes(value as Form);
}

function isInstrument(value: unknown): value is Instrument {
  return INSTRUMENTS.includes(value as Instrument);
}
