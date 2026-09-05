/**
 * The flags a decoded offer raises: facts about the package worth a reader's
 * attention, each carrying the figures it rests on and what it stands on.
 *
 * **A flag states a fact and never a recommendation** (ADR 0007). Nothing here
 * says a share is too low, or that anything should change. The core emits a
 * `code`, the figures, and the basis; what the flag *means* is the skill's to
 * say (CLAUDE.md's two-layer rule), which is why no sentence of prose is
 * written in this file. The only sentences that reach the output are data: a
 * `rationale` the author wrote in `heuristics.yaml`, and a `statement` the
 * rules file quotes from a statute.
 *
 * Like `sources.ts`, this is a reading *of* the finished output rather than a
 * step in building it, so it takes the assembled parts and derives from them.
 *
 * ## Three kinds, not two
 *
 * Ticket #13 named two, `rule | heuristic`, and asked that every flag carry
 * either `sources` or `rationale` and never both. Two does not cover what the
 * flags actually stand on, because two of them stand on the offer letter:
 *
 * - **heuristic** — an authored threshold in `heuristics.yaml`, carrying its
 *   `rationale` (ADR 0006).
 * - **statute** — a statement the rules file quotes, carrying its `citation`.
 * - **letter** — a fact the user typed off their own offer letter: a clawback
 *   period, a cliff. Neither law nor judgement, and it carries neither, because
 *   it stands on the letter and inventing a citation for it would be the output
 *   claiming an authority it does not have.
 *
 * The point of `kind` is that a reader can tell law from opinion (spec #4,
 * story 49). A third value that says "this is only what your letter says" makes
 * that sharper, not looser, which is why the ticket's binary is widened here
 * rather than followed.
 */
import { divideWithRemainder } from "../arithmetic.ts";
import { applyRate, rate, shareInBasisPoints, type Money, type Rate } from "../money.ts";
import { BASIS_POINTS_PER_UNIT } from "../money.ts";
import type { HeuristicsFile } from "../heuristics/file.ts";
import type { Heuristic } from "../heuristics/loader.ts";
import type { DecodedComponent } from "./decode.ts";
import { DecoderError } from "./errors.ts";
import type { Citation } from "./rules-reader.ts";
import type { OfferTotals } from "./totals.ts";
import type { Basic } from "./basic.ts";
import type { YearByYear } from "./year-by-year.ts";

export type FlagKind = "heuristic" | "statute" | "letter";

/** The authored threshold a heuristic flag fired against, and why it sits there. */
export interface FlagThreshold {
  /** The key in the heuristics file, so a reader can go and argue with it. */
  heuristics_key: string;
  value: Rate;
  rationale: string;
}

export interface Flag {
  code: string;
  kind: FlagKind;
  /** The figures the flag rests on, by name; every one of them appears above it in the output. */
  measured: { [name: string]: Money | Rate };
  /** The components or grants this is about, by the name the user typed. */
  names: string[];
  /** Heuristic flags only. */
  threshold?: FlagThreshold;
  /** Statute flags only: the rules file's own words, and where they come from. */
  statement?: string;
  citation?: Citation;
  /** Letter flags only: a period the letter states. */
  months?: number;
}

/** What the flags read, assembled: every part is already in the output. */
export interface FlagInput {
  components: readonly DecodedComponent[];
  totals: OfferTotals;
  year_by_year: YearByYear;
  basic?: Basic;
}

export function flagsFor(offer: FlagInput, heuristics: HeuristicsFile): Flag[] {
  return [
    ...variablePayShare(offer, heuristics),
    ...basicShare(offer, heuristics),
    ...backLoaded(offer, heuristics),
    ...oneTimeShare(offer, heuristics),
    ...unvaluableShare(offer, heuristics),
    ...nonCashShare(offer, heuristics),
    ...clawbacks(offer),
    ...cliffs(offer),
    ...perquisites(offer),
  ];
}

/* ---------------------------------------------------------------- heuristic */

function variablePayShare(offer: FlagInput, heuristics: HeuristicsFile): Flag[] {
  const key = "variable_pay_share";
  const threshold = thresholdRate(heuristics, key, "at_or_above_rate");
  const share = shareInBasisPoints(
    offer.totals.variable_pay_at_target.paise,
    offer.totals.headline_ctc.paise,
  );
  if (share === undefined || share < threshold.value.bp) return [];
  return [
    {
      code: "variable-pay-share",
      kind: "heuristic",
      measured: {
        variable_pay_at_target: money(offer.totals.variable_pay_at_target),
        headline_ctc: money(offer.totals.headline_ctc),
        share_of_headline_ctc: rate(share),
      },
      names: offer.totals.variable_pay_at_target.components,
      threshold,
    },
  ];
}

/**
 * Basic below the band's floor. The ceiling is carried too, because the flag is
 * about a band and half of one would not say what the other half is.
 */
function basicShare(offer: FlagInput, heuristics: HeuristicsFile): Flag[] {
  const basic = offer.basic;
  const share = basic?.share_of_fixed_pay;
  if (basic === undefined || share === undefined) return [];

  const key = "basic_share_band";
  const floor = thresholdRate(heuristics, key, "floor_rate");
  const ceiling = thresholdRate(heuristics, key, "ceiling_rate");
  if (share.bp >= floor.value.bp) return [];
  return [
    {
      code: "basic-share",
      kind: "heuristic",
      measured: {
        basic: basic.annual,
        fixed_pay: money(offer.totals.fixed_pay),
        share_of_fixed_pay: share,
        typical_band_floor: floor.value,
        typical_band_ceiling: ceiling.value,
      },
      names: basic.components,
      threshold: floor,
    },
  ];
}

/**
 * A grant whose first year takes less than the threshold's share of what an
 * even schedule would give it. Measured against the schedule's own even share
 * (`10000 ÷ years`), so a three-year grant is judged against a third rather
 * than against a quarter.
 */
function backLoaded(offer: FlagInput, heuristics: HeuristicsFile): Flag[] {
  const key = "back_loaded";
  const threshold = thresholdRate(heuristics, key, "year_one_below_even_share_rate");

  return offer.components.flatMap((component) => {
    const years = component.equity?.vesting?.years;
    const first = years?.[0];
    if (years === undefined || first?.share === undefined || years.length < 2) return [];

    const evenShare = divideWithRemainder(BASIS_POINTS_PER_UNIT, years.length).quotient;
    if (first.share.bp >= applyRate(evenShare, threshold.value.bp)) return [];
    return [
      {
        code: "back-loaded",
        kind: "heuristic" as const,
        measured: {
          year_one_share: first.share,
          even_share: rate(evenShare),
        },
        names: [component.name],
        threshold,
      },
    ];
  });
}

/**
 * One-time components against year one, on the zero basis because that is the
 * honest one.
 *
 * It reads the year-by-year table's own year-one figures rather than
 * `totals.one_time_components`, and the difference matters: that total counts
 * every non-recurring component, and an equity grant is one. But a grant is not
 * a payment that lands and then stops — it spreads over the years its schedule
 * names, and the table already puts it in the equity columns instead. This flag
 * is about the drop from year one to year two, so it measures the thing that
 * actually drops: cash that arrives once.
 */
function oneTimeShare(offer: FlagInput, heuristics: HeuristicsFile): Flag[] {
  const key = "one_time_share";
  const threshold = thresholdRate(heuristics, key, "at_or_above_rate");

  const zeroBasis = offer.year_by_year.bases.find((one) => one.basis === "variable-pay-at-zero");
  const yearOne = zeroBasis?.years[0];
  if (zeroBasis === undefined || yearOne === undefined) return [];
  const share = shareInBasisPoints(yearOne.one_time.paise, zeroBasis.year_one.paise);
  if (share === undefined || share < threshold.value.bp) return [];
  return [
    {
      code: "one-time-share",
      kind: "heuristic",
      measured: {
        one_time_in_year_one: yearOne.one_time,
        year_one: zeroBasis.year_one,
        share_of_year_one: rate(share),
      },
      names: zeroBasis.average.one_time_components,
      threshold,
    },
  ];
}

/** The unvaluable grants against the headline, both on the claimed basis (ADR 0016). */
function unvaluableShare(offer: FlagInput, heuristics: HeuristicsFile): Flag[] {
  const key = "unvaluable_share";
  const threshold = thresholdRate(heuristics, key, "at_or_above_rate");
  const share = shareInBasisPoints(
    offer.totals.unvaluable_equity.paise,
    offer.totals.headline_ctc.paise,
  );
  if (share === undefined || share < threshold.value.bp) return [];
  return [
    {
      code: "unvaluable-share",
      kind: "heuristic",
      measured: {
        unvaluable_equity_as_claimed: money(offer.totals.unvaluable_equity),
        headline_ctc: money(offer.totals.headline_ctc),
        share_of_headline_ctc: rate(share),
      },
      names: offer.totals.unvaluable_equity.components,
      threshold,
    },
  ];
}

/** Retirals plus benefits in kind: what is in CTC and is not cash now. */
function nonCashShare(offer: FlagInput, heuristics: HeuristicsFile): Flag[] {
  const key = "non_cash_share";
  const threshold = thresholdRate(heuristics, key, "at_or_above_rate");

  const nonCash = offer.totals.retirals.paise + offer.totals.benefits_in_kind.paise;
  const share = shareInBasisPoints(nonCash, offer.totals.headline_ctc.paise);
  if (share === undefined || share < threshold.value.bp) return [];
  return [
    {
      code: "non-cash-share",
      kind: "heuristic",
      measured: {
        retirals: money(offer.totals.retirals),
        benefits_in_kind: money(offer.totals.benefits_in_kind),
        headline_ctc: money(offer.totals.headline_ctc),
        share_of_headline_ctc: rate(share),
      },
      names: [
        ...offer.totals.retirals.components,
        ...offer.totals.benefits_in_kind.components,
      ],
      threshold,
    },
  ];
}

/* ------------------------------------------------------------------- letter */

function clawbacks(offer: FlagInput): Flag[] {
  return offer.components.flatMap((component) =>
    component.clawback_months === undefined
      ? []
      : [
          {
            code: "clawback",
            kind: "letter" as const,
            measured: { amount: component.annual },
            names: [component.name],
            months: component.clawback_months,
          },
        ],
  );
}

function cliffs(offer: FlagInput): Flag[] {
  return offer.components.flatMap((component) => {
    const cliff = component.equity?.vesting?.cliff_months;
    return cliff === undefined
      ? []
      : [
          {
            code: "cliff",
            kind: "letter" as const,
            measured: { grant_as_claimed: component.equity?.claimed ?? component.annual },
            names: [component.name],
            months: cliff,
          },
        ];
  });
}

/* ------------------------------------------------------------------ statute */

/**
 * That a vesting grant's value is salary, in the rules file's own words. One
 * flag per instrument present, because the Act treats a unit and an option
 * differently and each carries its own statement and citation.
 */
function perquisites(offer: FlagInput): Flag[] {
  const byInstrument = new Map<string, { flag: Flag; }>();
  for (const component of offer.components) {
    const grant = component.equity;
    const instrument = component.instrument;
    if (grant === undefined || instrument === undefined) continue;

    const existing = byInstrument.get(instrument);
    if (existing !== undefined) {
      existing.flag.names.push(component.name);
      continue;
    }
    byInstrument.set(instrument, {
      flag: {
        code: "equity-perquisite",
        kind: "statute",
        measured: { equity_as_claimed: grant.claimed, equity_as_valued: grant.valued },
        names: [component.name],
        statement: grant.perquisite.statement,
        citation: grant.perquisite.citation,
      },
    });
  }
  return [...byInstrument.values()].map((one) => one.flag);
}

/* ------------------------------------------------------------------ reading */

/**
 * One rate off the heuristics file. A key the file does not carry is reported
 * as absent naming the key, never defaulted — the same discipline the rules
 * reader applies, for the same reason (CLAUDE.md).
 */
function thresholdRate(
  heuristics: HeuristicsFile,
  key: string,
  field: string,
): FlagThreshold {
  const entry: Heuristic | undefined = heuristics.document.thresholds[key];
  if (entry === undefined) throw absent(heuristics, `thresholds.${key}`);
  const value = entry[field];
  if (typeof value !== "number") throw absent(heuristics, `thresholds.${key}.${field}`);
  return { heuristics_key: `thresholds.${key}.${field}`, value: rate(value), rationale: entry.rationale };
}

function absent(heuristics: HeuristicsFile, key: string): DecoderError {
  return new DecoderError({
    code: "rule_absent",
    message: `${heuristics.path} carries no ${key}: the threshold is absent, so the flag it would settle cannot be raised`,
    details: { heuristics_file: heuristics.path, heuristics_key: key },
  });
}

/** A `Total` carries component names this reading does not want repeated inside `measured`. */
function money(total: Money & { components?: string[] }): Money {
  return { paise: total.paise, display: total.display };
}
