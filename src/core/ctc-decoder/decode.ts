/**
 * The CTC decoder's deterministic core. It normalises the offer (whole rupees
 * to paise, monthly amounts annualised), classifies every component on the two
 * axes from the rules file's catalogue or the axes typed inline (ADR 0004), and
 * derives the totals from those classifications.
 *
 * Nothing here decides what a component type means; that is the rules file's
 * job, and a type it does not carry is reported, not guessed.
 */
import { annualise, money, rupeesToPaise, type Money, type Period } from "../money.ts";
import { resolveRulesFile, rulesFilePathFor, type RulesFile } from "../rules/files.ts";
import { RulesFileError } from "../rules/loader.ts";
import {
  CATALOGUE_ENTRIES_KEY,
  CATALOGUE_GROUP_KEY,
  readComponentCatalogue,
  type ClassificationBasis,
  type ComponentCatalogue,
} from "./catalogue.ts";
import { basicFor, type Basic } from "./basic.ts";
import {
  readingOf,
  rejectValuationsAboveCap,
  valueGrant,
  type EquityGrant,
} from "./equity.ts";
import type {
  Certainty,
  Classification,
  ClassifiedComponent,
  Form,
  Instrument,
} from "./classification.ts";
import { DecoderError } from "./errors.ts";
import { validateOfferInput, type OfferComponentInput } from "./input.ts";
import type { Source } from "./rules-reader.ts";
import { sourcesIn } from "./sources.ts";
import { takeHomeFor, type TakeHome } from "./take-home.ts";
import { countsTowardGuaranteedRecurringCash, totalsFor, type OfferTotals } from "./totals.ts";

/**
 * Which rule classified a component: a catalogue entry, with the basis that
 * entry stands on (a statute, or the author's judgement), or the user's own
 * answer, which stands on nothing but their reading of the letter.
 */
export type ClassifiedBy =
  | { kind: "catalogue"; entry: string; rules_key: string; basis: ClassificationBasis }
  | { kind: "inline" };

export interface DecodedComponent {
  name: string;
  /** The amount and period exactly as the user entered them, for the narration to quote. */
  as_typed: { amount: Money; period: Period };
  annual: Money;
  certainty: Certainty;
  form: Form;
  recurring: boolean;
  instrument?: Instrument;
  clawback_months?: number;
  counts_toward_guaranteed_recurring_cash: boolean;
  classified_by: ClassifiedBy;
  /** Present exactly when the form is equity: what the grant is held at, and how (ADR 0005). */
  equity?: EquityGrant;
}

export interface DecodedOffer {
  financial_year: string;
  rules_file: string;
  components: DecodedComponent[];
  totals: OfferTotals;
  /**
   * Basic's share of fixed pay and what it drives. Present only when the rules
   * file says which components are basic pay; see `basic.ts`.
   */
  basic?: Basic;
  /** Present only when the caller typed `pf_wage_base`; see `input.ts`. */
  take_home?: TakeHome;
  /** Every document cited anywhere above, deduplicated; see `sources.ts`. */
  sources: Source[];
}

export function decode(raw: unknown): DecodedOffer {
  const input = validateOfferInput(raw);
  const rules = rulesFor(input.financial_year);
  const catalogue = readComponentCatalogue(rules);

  const decoded = input.components.map((component, index) =>
    decodeComponent(component, `components[${index}]`, rules, catalogue),
  );
  rejectValuationsAboveCap(
    decoded.flatMap((one) => (one.component.equity === undefined ? [] : [one.component.equity])),
  );

  // The one shape every reading of the offer takes (`ClassifiedComponent`):
  // built once, and passed whole rather than taken apart and reassembled per
  // reading, which is how a field added to it reaches every reading at once.
  const classified: ClassifiedComponent[] = decoded.map((one) => ({
    name: one.component.name,
    annual_paise: one.component.annual.paise,
    classification: one.classification,
    ...(one.component.classified_by.kind === "catalogue"
      ? { catalogue_entry: one.component.classified_by.entry }
      : {}),
    ...(one.component.equity === undefined ? {} : { equity: readingOf(one.component.equity) }),
  }));

  const totals = totalsFor(classified);
  const basic = basicFor(classified, totals.fixed_pay.paise, rules);

  const decodedOffer = {
    financial_year: input.financial_year,
    rules_file: rules.path,
    components: decoded.map((one) => one.component),
    totals,
    ...(basic === undefined ? {} : { basic }),
    ...(input.take_home === undefined
      ? {}
      : { take_home: takeHomeFor(classified, input.take_home, rules) }),
  };
  // Last, and over the whole of it: the sources are a reading of the output, so
  // they are collected once it exists rather than gathered along the way.
  return { ...decodedOffer, sources: sourcesIn(decodedOffer) };
}

function decodeComponent(
  component: OfferComponentInput,
  path: string,
  rules: RulesFile,
  catalogue: ComponentCatalogue | undefined,
): { component: DecodedComponent; classification: Classification } {
  const { classification, classifiedBy } = classify(component, path, rules, catalogue);
  const clawbackMonths = component.clawback_months;
  if (clawbackMonths !== undefined && classification.recurring) {
    throw new DecoderError({
      code: "clawback_on_recurring_component",
      message: `${path}.clawback_months: a clawback period belongs to a one-time component, but ${JSON.stringify(component.name)} is classified as recurring`,
      path: `${path}.clawback_months`,
      details: { name: component.name, clawback_months: clawbackMonths },
    });
  }

  const typedPaise = rupeesToPaise(component.amount);
  const annualPaise = annualise(typedPaise, component.period);
  const equity = equityFor(component, classification, annualPaise, path, rules);
  return {
    component: {
      name: component.name,
      as_typed: { amount: money(typedPaise), period: component.period },
      annual: money(annualPaise),
      certainty: classification.certainty,
      form: classification.form,
      recurring: classification.recurring,
      ...(classification.instrument === undefined ? {} : { instrument: classification.instrument }),
      ...(clawbackMonths === undefined ? {} : { clawback_months: clawbackMonths }),
      counts_toward_guaranteed_recurring_cash: countsTowardGuaranteedRecurringCash(classification),
      classified_by: classifiedBy,
      ...(equity === undefined ? {} : { equity }),
    },
    classification,
  };
}

/**
 * The `equity` block belongs to the equity form and to no other, and the
 * classification is what settles which one this is — which is why the check
 * lives here rather than at the input boundary, where a component naming a
 * catalogue type has not yet been classified. Absent where it is needed and
 * present where it is not are both rejections, for the same reason: either way
 * the output would carry a grant the caller did not describe, or a description
 * the decoder never read.
 */
function equityFor(
  component: OfferComponentInput,
  classification: Classification,
  annualPaise: number,
  path: string,
  rules: RulesFile,
): EquityGrant | undefined {
  const instrument = classification.instrument;
  if (instrument === undefined) {
    if (component.equity === undefined) return undefined;
    throw new DecoderError({
      code: "invalid_input",
      message: `${path}.equity: an equity block describes a grant of shares, but ${JSON.stringify(component.name)} is classified as ${classification.form}`,
      path: `${path}.equity`,
      details: { name: component.name, form: classification.form },
    });
  }
  if (component.equity === undefined) {
    throw new DecoderError({
      code: "invalid_input",
      message: `${path}.equity: ${JSON.stringify(component.name)} is classified as equity, so it needs an equity block giving at least whether the company is listed and how the grant vests`,
      path: `${path}.equity`,
      details: { name: component.name, instrument },
    });
  }
  return valueGrant(component.equity, instrument, annualPaise, `${path}.equity`, rules);
}

function classify(
  component: OfferComponentInput,
  path: string,
  rules: RulesFile,
  catalogue: ComponentCatalogue | undefined,
): { classification: Classification; classifiedBy: ClassifiedBy } {
  if (component.classify.kind === "inline") {
    return {
      classification: component.classify.classification,
      classifiedBy: { kind: "inline" },
    };
  }

  const type = component.classify.type;
  if (catalogue === undefined) {
    throw new DecoderError({
      code: "rule_absent",
      message: `${rules.path} carries no component catalogue: the rule at ${CATALOGUE_GROUP_KEY} is absent`,
      path: `${path}.type`,
      details: { rules_file: rules.path, rules_key: CATALOGUE_GROUP_KEY },
    });
  }

  const entry = catalogue.get(type);
  if (entry === undefined) {
    throw new DecoderError({
      code: "unknown_component_type",
      message: `${path}.type: ${rules.path} has no component catalogue entry for ${JSON.stringify(type)}; give certainty, form and recurring inline instead`,
      path: `${path}.type`,
      details: { type, rules_file: rules.path, rules_key: CATALOGUE_ENTRIES_KEY },
    });
  }

  return {
    classification: entry.classification,
    classifiedBy: {
      kind: "catalogue",
      entry: entry.type,
      rules_key: entry.rules_key,
      basis: entry.basis,
    },
  };
}

/** The rules file for the typed financial year; a missing or malformed file is a rejection. */
function rulesFor(financialYear: string): RulesFile {
  const expectedFile = rulesFilePathFor(financialYear);
  let rules: RulesFile | undefined;
  try {
    rules = resolveRulesFile(financialYear);
  } catch (error) {
    if (!(error instanceof RulesFileError)) throw error;
    throw new DecoderError({
      code: "rules_file_invalid",
      message: `${expectedFile} failed the rules schema: ${error.message}`,
      path: "financial_year",
      details: { rules_file: expectedFile, rules_error: error.code },
    });
  }
  if (rules === undefined) {
    throw new DecoderError({
      code: "unknown_financial_year",
      message: `No rules file for financial year ${financialYear}: expected ${expectedFile}`,
      path: "financial_year",
      details: { financial_year: financialYear, expected_file: expectedFile },
    });
  }
  return rules;
}
