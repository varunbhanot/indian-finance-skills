/**
 * The RBI inflation target, read from `rules/fy<YYYY-YY>.yaml`'s
 * `inflation_target` group (ADR 0013 [insurance-irr]): a statutory target
 * under section 45ZA of the RBI Act, never a default. `inflation_bp` stays
 * mandatory input; this module only tells the caller the target's own rate
 * and citation, so `policy.ts` can compare the typed figure against it and
 * cite it when the two agree.
 *
 * A small, self-contained reader rather than a second copy of the CTC
 * decoder's `RulesNode` (`../ctc-decoder/rules-reader.ts`): that reader's
 * `citation()` throws a `DecoderError`, which this skill may not raise, and
 * lifting it to be error-generic is a bigger change than one group needs.
 * What it reads here is exactly the citation shape `Citation` already
 * carries, so the two skills still agree on what a citation looks like.
 */
import type { RulesFile } from "../rules/files.ts";
import type { RulesGroup } from "../rules/loader.ts";
import type { Source } from "../sources.ts";
import { InsuranceError } from "./errors.ts";

const GROUP_NAME = "inflation_target";
const GROUP_KEY = `groups.${GROUP_NAME}`;

/** The provenance of the target, in the same shape the CTC decoder's own citations carry. */
export interface InflationTargetCitation {
  section: string;
  document: Source;
  retrieved: string;
  rules_key: string;
  note?: string;
}

export interface InflationTarget {
  rate_bp: number;
  citation: InflationTargetCitation;
}

export function inflationTargetFor(rules: RulesFile): InflationTarget {
  const group = rules.document.groups[GROUP_NAME];
  if (group === undefined) {
    throw new InsuranceError({
      code: "rule_absent",
      message: `${rules.path} carries no ${GROUP_KEY}: the statutory inflation target is absent, so a typed figure cannot be compared against it`,
      details: { rules_file: rules.path, rules_key: GROUP_KEY },
    });
  }
  return { rate_bp: rateBp(rules, group), citation: citationOf(rules, group) };
}

function rateBp(rules: RulesFile, group: RulesGroup): number {
  const value = group["rate"];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw invalid(rules, `${GROUP_KEY}.rate`, "expected a whole number of basis points");
  }
  return value;
}

function citationOf(rules: RulesFile, group: RulesGroup): InflationTargetCitation {
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
    rules_key: GROUP_KEY,
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
