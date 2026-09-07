/**
 * GST on an individual life insurance premium (issue #67, ADR 0012
 * [insurance-irr]), read from `rules/fy<YYYY-YY>.yaml`'s
 * `groups.gst.individual_life_insurance` entry. The typed premium is always
 * the pre-GST premium a quote states -- there is no inclusive/exclusive
 * input (ADR 0012) -- so `policy.ts` adds this rate to it and carries both
 * the rate and the resulting cash outflow in the output as
 * `gst_on_premium`; that cash outflow, not the bare premium, is what the IRR
 * solver treats as the outflow from here on. Group policies are out of
 * scope (ADR 0012): this module never reads anything but the individual
 * entry, and today that entry is nil.
 *
 * A small, self-contained reader in the same shape as `inflation-target.ts`
 * and for the same reason: the CTC decoder's `RulesNode.citation()`
 * (`../ctc-decoder/rules-reader.ts`) throws a `DecoderError`, which this
 * skill may not raise, and lifting it to be error-generic is a bigger change
 * than one group needs.
 */
import type { RulesFile } from "../rules/files.ts";
import type { RulesGroup, RulesValue } from "../rules/loader.ts";
import type { Source } from "../sources.ts";
import { InsuranceError } from "./errors.ts";

const GROUP_NAME = "gst";
const ENTRY_NAME = "individual_life_insurance";
const GROUP_KEY = `groups.${GROUP_NAME}`;
const ENTRY_KEY = `${GROUP_KEY}.${ENTRY_NAME}`;

/** Where the rate came from; the same shape `InflationTargetCitation` carries. */
export interface GstCitation {
  section: string;
  document: Source;
  retrieved: string;
  rules_key: string;
  note?: string;
}

export interface Gst {
  rate_bp: number;
  citation: GstCitation;
}

export function gstOnIndividualLifeInsuranceFor(rules: RulesFile): Gst {
  const group = rules.document.groups[GROUP_NAME];
  if (group === undefined) {
    throw new InsuranceError({
      code: "rule_absent",
      message: `${rules.path} carries no ${GROUP_KEY}: the GST rate on an individual life insurance premium is absent, so the cash outflow cannot be computed`,
      details: { rules_file: rules.path, rules_key: GROUP_KEY },
    });
  }
  const entry = entryOf(rules, group);
  return { rate_bp: rateBp(rules, entry), citation: citationOf(rules, group) };
}

function entryOf(rules: RulesFile, group: RulesGroup): { [key: string]: RulesValue } {
  const value = group[ENTRY_NAME];
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InsuranceError({
      code: "rule_absent",
      message: `${rules.path} carries no ${ENTRY_KEY}: the GST rate on an individual life insurance premium is absent, so the cash outflow cannot be computed`,
      details: { rules_file: rules.path, rules_key: ENTRY_KEY },
    });
  }
  return value;
}

function rateBp(rules: RulesFile, entry: { [key: string]: RulesValue }): number {
  const value = entry["rate"];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw invalid(rules, `${ENTRY_KEY}.rate`, "expected a whole number of basis points");
  }
  return value;
}

/** The rate's provenance sits on the `gst` group itself, not the nested entry: one notification, one citation. */
function citationOf(rules: RulesFile, group: RulesGroup): GstCitation {
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
    rules_key: ENTRY_KEY,
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
