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

/** Which equity instrument, when the form is equity, and meaningless otherwise. */
export const INSTRUMENTS = ["rsu", "option", "espp"] as const;
export type Instrument = (typeof INSTRUMENTS)[number];

export interface Classification {
  certainty: Certainty;
  form: Form;
  /** True when the component arrives every year, false for a one-time item. */
  recurring: boolean;
  /** Present exactly when the form is equity; `readClassification` holds both halves of that. */
  instrument?: Instrument;
}

/**
 * What an equity valuation contributes to every other reading of the offer.
 * The valuation itself, and the reasons behind it, are `equity.ts`'s; these are
 * the two facts the totals need, declared here so the readings do not have to
 * know how a grant was valued in order to leave it out of a cash figure.
 */
export interface EquityReading {
  /** What the grant is held at. Nil whenever the decoder refuses to value it (ADR 0005). */
  valued_paise: number;
  /** True for a grant held at nil because it cannot be valued, rather than because it is worth nil. */
  unvaluable: boolean;
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
  /** Present exactly when the form is equity; see `EquityReading`. */
  equity?: EquityReading;
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

  // The instrument is required by the equity form and refused by every other,
  // rather than merely allowed: it is what picks the valuation (ADR 0005), so a
  // grant without one could not be valued, and a salary line with one would be
  // carrying an answer to a question nobody asked of it.
  const instrument = read("instrument");
  if (form !== "equity") {
    if (instrument !== undefined) {
      throw reject(
        "instrument",
        `instrument names which equity instrument a grant is, so it belongs only to the equity form, not to ${form}`,
      );
    }
    return { certainty, form, recurring };
  }
  if (!isInstrument(instrument)) {
    throw reject(
      "instrument",
      `the equity form must name an instrument: one of ${INSTRUMENTS.join(", ")}, got ${JSON.stringify(instrument)}`,
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
