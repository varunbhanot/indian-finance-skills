/**
 * Maturity-proceeds taxability (issue #68, ADR 0010 [insurance-irr]): the
 * three independent conditions of the Income-tax Act, 2025, Schedule II
 * (see section 11), Table Sl. No. 2, read from `rules/fy<YYYY-YY>.yaml`'s
 * `groups.life_insurance_maturity_exemption` entry — the premium-to-sum-
 * assured ratio for the band the policy's issue date falls in, the
 * aggregate premium threshold that band carries (linked and non-linked
 * distinguished), and whether that aggregate is even known — plus the
 * death-benefit exemption, which is unconditional and carried in every
 * output so a taxability flag is never read as "your family gets taxed".
 * No tax amount is ever computed (ADR 0010): the taxable figure would
 * depend on the holder's whole return, which this module never sees.
 *
 * The policy's `issued_on` picks the band; the evaluation `financial_year`
 * (already resolved to `rules` by the caller) picks the rules file. Neither
 * is inferred from the other (ADR 0016 [insurance-irr]). Absence of
 * `issued_on` means "issued on or after today" (ADR 0016), which this
 * module reads as the one band the rules file leaves open-ended, rather
 * than by comparing against a wall-clock date the deterministic core does
 * not read.
 *
 * A small, self-contained reader in the same shape as `gst.ts` and
 * `inflation-target.ts`, for the same reason given there: the CTC
 * decoder's `RulesNode` throws a `DecoderError`, which this skill may not
 * raise.
 */
import { money, rate, rupeesToPaise, shareInBasisPoints, BASIS_POINTS_PER_UNIT, type Money } from "../money.ts";
import type { RulesFile } from "../rules/files.ts";
import type { RulesGroup, RulesValue } from "../rules/loader.ts";
import type { Source } from "../sources.ts";
import { InsuranceError } from "./errors.ts";
import type { Classification } from "./classifications.ts";

const GROUP_NAME = "life_insurance_maturity_exemption";
const GROUP_KEY = `groups.${GROUP_NAME}`;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** The same citation shape `GstCitation` and `InflationTargetCitation` carry. */
export interface TaxabilityCitation {
  section: string;
  document: Source;
  retrieved: string;
  rules_key: string;
  note?: string;
}

export interface TaxabilityInput {
  /** The policy's issue date; absent means issued on or after today (ADR 0016 [insurance-irr]). */
  issued_on?: string;
  linked: boolean;
  annual_premium: Money;
  sum_assured: Money;
  other_premiums_aggregate?: Money;
}

interface Band {
  issued_from: string;
  /** Absent on the one open-ended band a policy not yet issued is read against. */
  issued_to?: string;
  ratio_bp: number;
  aggregate_threshold_linked_paise?: number;
  aggregate_threshold_non_linked_paise?: number;
  /** This band's own dotted key, e.g. `groups.life_insurance_maturity_exemption.bands[4]`. */
  rules_key: string;
}

export function taxabilityClassificationsFor(rules: RulesFile, input: TaxabilityInput): Classification[] {
  const group = groupOf(rules);
  const band = bandFor(rules, bandsOf(rules, group), input.issued_on);
  const groupCitation = citationFor(rules, group, GROUP_KEY);
  const bandCitation = citationFor(rules, group, band.rules_key);

  const classifications: Classification[] = [];

  if (input.annual_premium.paise * BASIS_POINTS_PER_UNIT > input.sum_assured.paise * band.ratio_bp) {
    // A ratio against a nil sum assured is not a figure the tool states
    // (`shareInBasisPoints` returns `undefined` for a nil whole); the
    // classification still fires from the cross-multiplication above, which
    // needs no division and so has no such gap, but `measured` then carries
    // only the threshold and the two figures it was measured from.
    const actualRatioBp = shareInBasisPoints(input.annual_premium.paise, input.sum_assured.paise);
    classifications.push({
      code: "premium-exceeds-10pc-of-sum-assured",
      kind: "statute",
      measured: {
        annual_premium: input.annual_premium,
        sum_assured: input.sum_assured,
        ...(actualRatioBp === undefined ? {} : { premium_to_sum_assured_ratio: rate(actualRatioBp) }),
        threshold_ratio: rate(band.ratio_bp),
      },
      citation: bandCitation,
    });
  }

  const thresholdPaise = input.linked
    ? band.aggregate_threshold_linked_paise
    : band.aggregate_threshold_non_linked_paise;
  if (thresholdPaise !== undefined) {
    if (input.other_premiums_aggregate === undefined) {
      classifications.push({
        code: "aggregate-unknown",
        kind: "statute",
        measured: { threshold: money(thresholdPaise) },
        citation: bandCitation,
      });
    } else if (input.other_premiums_aggregate.paise > thresholdPaise) {
      classifications.push({
        code: "aggregate-exceeds-threshold",
        kind: "statute",
        measured: { other_premiums_aggregate: input.other_premiums_aggregate, threshold: money(thresholdPaise) },
        citation: bandCitation,
      });
    }
  }

  classifications.push({
    code: "death-benefit-exempt-regardless",
    kind: "statute",
    measured: {},
    citation: groupCitation,
  });

  return classifications;
}

function groupOf(rules: RulesFile): RulesGroup {
  const group = rules.document.groups[GROUP_NAME];
  if (group === undefined) {
    throw new InsuranceError({
      code: "rule_absent",
      message: `${rules.path} carries no ${GROUP_KEY}: the maturity-proceeds exemption bands are absent, so taxability cannot be classified`,
      details: { rules_file: rules.path, rules_key: GROUP_KEY },
    });
  }
  return group;
}

function bandsOf(rules: RulesFile, group: RulesGroup): Band[] {
  const raw = group["bands"];
  if (!Array.isArray(raw) || raw.length === 0) {
    throw invalid(rules, `${GROUP_KEY}.bands`, "expected a non-empty list of issue-date bands");
  }
  return raw.map((item, index) => bandOf(rules, item, index));
}

function bandOf(rules: RulesFile, raw: RulesValue, index: number): Band {
  const key = `${GROUP_KEY}.bands[${index}]`;
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw invalid(rules, key, "expected a map with issued_from and ratio_rate");
  }

  const issuedFrom = raw["issued_from"];
  if (typeof issuedFrom !== "string" || !DATE_PATTERN.test(issuedFrom)) {
    throw invalid(rules, `${key}.issued_from`, "expected a date written YYYY-MM-DD");
  }
  const issuedTo = raw["issued_to"];
  if (issuedTo !== undefined && (typeof issuedTo !== "string" || !DATE_PATTERN.test(issuedTo))) {
    throw invalid(rules, `${key}.issued_to`, "expected a date written YYYY-MM-DD");
  }
  const ratioBp = raw["ratio_rate"];
  if (typeof ratioBp !== "number" || !Number.isInteger(ratioBp)) {
    throw invalid(rules, `${key}.ratio_rate`, "expected a whole number of basis points");
  }
  const aggregateLinked = optionalWholeRupees(rules, raw, key, "aggregate_threshold_linked");
  const aggregateNonLinked = optionalWholeRupees(rules, raw, key, "aggregate_threshold_non_linked");

  return {
    issued_from: issuedFrom,
    ...(issuedTo === undefined ? {} : { issued_to: issuedTo }),
    ratio_bp: ratioBp,
    ...(aggregateLinked === undefined
      ? {}
      : { aggregate_threshold_linked_paise: rupeesToPaise(aggregateLinked) }),
    ...(aggregateNonLinked === undefined
      ? {}
      : { aggregate_threshold_non_linked_paise: rupeesToPaise(aggregateNonLinked) }),
    rules_key: key,
  };
}

function optionalWholeRupees(
  rules: RulesFile,
  raw: { [key: string]: RulesValue },
  key: string,
  field: string,
): number | undefined {
  const value = raw[field];
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw invalid(rules, `${key}.${field}`, "expected a whole number of rupees");
  }
  return value;
}

/**
 * The band `issued_on` falls in, or — absent, meaning issued on or after
 * today (ADR 0016 [insurance-irr]) — the one band the file leaves
 * open-ended. Comparison is on the `YYYY-MM-DD` strings directly: every
 * date is fixed-width, so lexical and calendar order agree.
 */
function bandFor(rules: RulesFile, bands: readonly Band[], issuedOn: string | undefined): Band {
  if (issuedOn === undefined) {
    const current = bands.find((band) => band.issued_to === undefined);
    if (current === undefined) {
      throw invalid(rules, `${GROUP_KEY}.bands`, "expected one open-ended band for a policy not yet issued");
    }
    return current;
  }
  const match = bands.find(
    (band) => issuedOn >= band.issued_from && (band.issued_to === undefined || issuedOn <= band.issued_to),
  );
  if (match === undefined) {
    throw new InsuranceError({
      code: "issued_on_before_earliest_exemption_band",
      message: `issued_on (${issuedOn}) predates every issue-date band in ${GROUP_KEY}: the earliest starts ${bands[0]?.issued_from}`,
      path: "issued_on",
      details: { issued_on: issuedOn, rules_key: GROUP_KEY },
    });
  }
  return match;
}

function citationFor(rules: RulesFile, group: RulesGroup, rulesKey: string): TaxabilityCitation {
  const title = group["title"];
  const section = group["section"];
  const note = group["note"];
  if (typeof title !== "string" || title.trim() === "") {
    throw invalid(rules, `${GROUP_KEY}.title`, "expected a title naming the document");
  }
  if (typeof section !== "string" || section.trim() === "") {
    throw invalid(rules, `${GROUP_KEY}.section`, "expected the provision as a string");
  }
  return {
    section,
    document: { title, url: group.source },
    retrieved: group.retrieved,
    rules_key: rulesKey,
    ...(typeof note === "string" ? { note } : {}),
  };
}

function invalid(rules: RulesFile, key: string, message: string): InsuranceError {
  return new InsuranceError({
    code: "rules_file_invalid",
    message: `${rules.path}:${key} ${message}`,
    details: { rules_file: rules.path, rules_key: key },
  });
}
