/**
 * Guaranteed surrender value (GSV) floors, and the pro-rata paid-up sum
 * assured floor (issue #69, ADR 0008 [insurance-irr], ADR 0017
 * [insurance-irr]), read from `rules/fy<YYYY-YY>.yaml`'s
 * `groups.surrender_value_floors` entry: IRDAI (Insurance Products)
 * Regulations, 2024, Schedule I, clause 4(A)(a), with the pro-rata paid-up
 * rule at clause 4(A)(a)(7).
 *
 * The GSV floor is a percentage of total premiums paid, less survival
 * benefits already paid, fixed by the policy year a surrender falls in; a
 * regular-premium and a single-premium policy read different schedules
 * (`premium_paying_term === 1` names the single-premium one, ADR 0017
 * [insurance-irr]). A year the regulation leaves to the insurer's own
 * "smooth progression" carries no band here, and `surrenderValueFloorFor`
 * returns `undefined` rather than inventing a percentage between two the
 * regulation states (ADR 0008 [insurance-irr]); the caller reports that as
 * `insurer-defined` with a `null` floor.
 *
 * The pro-rata paid-up sum assured floor needs no rate from this file at
 * all — it is a ratio of whole premium counts already in the input — so
 * `paidUpSumAssuredFloorCitationFor` exists only to carry clause
 * 4(A)(a)(7)'s citation, never a number.
 *
 * A small, self-contained reader in the same shape as `gst.ts`,
 * `inflation-target.ts` and `taxability.ts`, for the same reason given
 * there: the CTC decoder's `RulesNode` throws a `DecoderError`, which this
 * skill may not raise.
 */
import type { RulesFile } from "../rules/files.ts";
import type { RulesGroup, RulesValue } from "../rules/loader.ts";
import type { Source } from "../sources.ts";
import { InsuranceError } from "./errors.ts";

const GROUP_NAME = "surrender_value_floors";
const GROUP_KEY = `groups.${GROUP_NAME}`;
const PAID_UP_KEY = `${GROUP_KEY}.paid_up_sum_assured_floor`;

/** `premium_paying_term === 1` names `"single"`; every other term names `"regular"` (ADR 0017 [insurance-irr]). */
export type PremiumMode = "regular" | "single";

/** The same citation shape `GstCitation`, `InflationTargetCitation` and `TaxabilityCitation` carry. */
export interface SurrenderFloorCitation {
  section: string;
  document: Source;
  retrieved: string;
  rules_key: string;
  note?: string;
}

export interface FloorReading {
  rate_bp: number;
  citation: SurrenderFloorCitation;
}

interface FloorBand {
  from_year?: number;
  to_year?: number;
  /** The last N policy years of the term; present instead of `from_year`/`to_year`, never with them. */
  last_years?: number;
  rate_bp: number;
  rules_key: string;
}

/**
 * The GSV floor percentage for a surrender in `policyYear` of a `policyTerm`-year
 * policy, or `undefined` when the regulation leaves that year to the
 * insurer's own smooth progression (ADR 0008 [insurance-irr]) — never
 * interpolated.
 */
export function surrenderValueFloorFor(
  rules: RulesFile,
  premiumMode: PremiumMode,
  policyYear: number,
  policyTerm: number,
): FloorReading | undefined {
  const group = groupOf(rules);
  const scheduleKey = premiumMode === "single" ? "single_premium" : "regular_premium";
  const band = matchBand(bandsOf(rules, group, scheduleKey), policyYear, policyTerm);
  if (band === undefined) return undefined;
  return { rate_bp: band.rate_bp, citation: citationFor(rules, group, groupSection(rules, group), band.rules_key, groupNote(group)) };
}

/** Clause 4(A)(a)(7)'s citation; the pro-rata ratio it fixes needs no rate from this file. */
export function paidUpSumAssuredFloorCitationFor(rules: RulesFile): SurrenderFloorCitation {
  const group = groupOf(rules);
  const entry = mapAt(rules, group, "paid_up_sum_assured_floor", PAID_UP_KEY);
  const section = entry["section"];
  if (typeof section !== "string" || section.trim() === "") {
    throw invalid(rules, `${PAID_UP_KEY}.section`, "expected the provision as a string");
  }
  const note = entry["note"];
  return citationFor(rules, group, section, PAID_UP_KEY, typeof note === "string" ? note : undefined);
}

/**
 * The band `policyYear` falls in. A "last N years of the term" band takes
 * priority over a fixed-year range: the regulation carves the tail of the
 * term out from the general schedule by name, so for a term short enough
 * that the two overlap, the tail wins (ADR 0017 [insurance-irr]).
 */
function matchBand(bands: readonly FloorBand[], policyYear: number, policyTerm: number): FloorBand | undefined {
  const lastYearsBand = bands.find(
    (band) => band.last_years !== undefined && policyYear > policyTerm - band.last_years && policyYear <= policyTerm,
  );
  if (lastYearsBand !== undefined) return lastYearsBand;
  return bands.find(
    (band) => band.from_year !== undefined && policyYear >= band.from_year && policyYear <= (band.to_year as number),
  );
}

function groupOf(rules: RulesFile): RulesGroup {
  const group = rules.document.groups[GROUP_NAME];
  if (group === undefined) {
    throw new InsuranceError({
      code: "rule_absent",
      message: `${rules.path} carries no ${GROUP_KEY}: the guaranteed surrender value and paid-up sum assured floors are absent, so an in-force reading cannot be classified`,
      details: { rules_file: rules.path, rules_key: GROUP_KEY },
    });
  }
  return group;
}

function bandsOf(
  rules: RulesFile,
  group: RulesGroup,
  scheduleKey: "regular_premium" | "single_premium",
): FloorBand[] {
  const scheduleKeyFull = `${GROUP_KEY}.${scheduleKey}`;
  const schedule = mapAt(rules, group, scheduleKey, scheduleKeyFull);
  const raw = schedule["bands"];
  if (!Array.isArray(raw) || raw.length === 0) {
    throw invalid(rules, `${scheduleKeyFull}.bands`, "expected a non-empty list of policy-year bands");
  }
  return raw.map((item, index) => bandOf(rules, item, `${scheduleKeyFull}.bands[${index}]`));
}

function bandOf(rules: RulesFile, raw: RulesValue, key: string): FloorBand {
  const map = expectMap(rules, raw, key, "expected a map naming a policy-year band");

  const rateBp = map["rate"];
  if (typeof rateBp !== "number" || !Number.isInteger(rateBp)) {
    throw invalid(rules, `${key}.rate`, "expected a whole number of basis points");
  }

  const lastYears = map["last_years"];
  if (lastYears !== undefined) {
    if (typeof lastYears !== "number" || !Number.isInteger(lastYears) || lastYears < 1) {
      throw invalid(rules, `${key}.last_years`, "expected a whole number of years, at least 1");
    }
    return { last_years: lastYears, rate_bp: rateBp, rules_key: key };
  }

  const fromYear = wholeYear(rules, map, key, "from_year");
  const toYear = wholeYear(rules, map, key, "to_year");
  if (toYear < fromYear) {
    throw invalid(rules, key, `to_year (${toYear}) must not be before from_year (${fromYear})`);
  }
  return { from_year: fromYear, to_year: toYear, rate_bp: rateBp, rules_key: key };
}

function wholeYear(
  rules: RulesFile,
  map: { [key: string]: RulesValue },
  key: string,
  field: string,
): number {
  const value = map[field];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw invalid(rules, `${key}.${field}`, "expected a whole number of policy years, at least 1");
  }
  return value;
}

function mapAt(
  rules: RulesFile,
  group: RulesGroup,
  field: string,
  key: string,
): { [key: string]: RulesValue } {
  return expectMap(rules, group[field], key, `expected a map at ${key}`);
}

function expectMap(rules: RulesFile, raw: RulesValue | undefined, key: string, message: string): { [key: string]: RulesValue } {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw invalid(rules, key, message);
  }
  return raw;
}

function groupSection(rules: RulesFile, group: RulesGroup): string {
  const section = group["section"];
  if (typeof section !== "string" || section.trim() === "") {
    throw invalid(rules, `${GROUP_KEY}.section`, "expected the provision as a string");
  }
  return section;
}

function groupNote(group: RulesGroup): string | undefined {
  const note = group["note"];
  return typeof note === "string" ? note : undefined;
}

function citationFor(
  rules: RulesFile,
  group: RulesGroup,
  section: string,
  rulesKey: string,
  note: string | undefined,
): SurrenderFloorCitation {
  const title = group["title"];
  if (typeof title !== "string" || title.trim() === "") {
    throw invalid(rules, `${GROUP_KEY}.title`, "expected a title naming the document");
  }
  return {
    section,
    document: { title, url: group.source },
    retrieved: group.retrieved,
    rules_key: rulesKey,
    ...(note === undefined ? {} : { note }),
  };
}

function invalid(rules: RulesFile, key: string, message: string): InsuranceError {
  return new InsuranceError({
    code: "rules_file_invalid",
    message: `${rules.path}:${key} ${message}`,
    details: { rules_file: rules.path, rules_key: key },
  });
}
