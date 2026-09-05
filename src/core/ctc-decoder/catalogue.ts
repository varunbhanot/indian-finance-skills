/**
 * The component catalogue as the rules file carries it (ADR 0004): a map of
 * component type to its classification, and to the basis that justifies it —
 * a statute's URL, or an authored rationale (ADR 0010).
 *
 * The catalogue is data, so everything in this file is reading and checking,
 * never a default. A rules file with no `components` group yields `undefined`,
 * which the decoder reports as an absent rule; a rules file whose catalogue is
 * malformed is a rejection naming the key. Neither is guessed at.
 */
import type { RulesFile } from "../rules/files.ts";
import type { RulesValue } from "../rules/loader.ts";
import { readClassification, type Classification } from "./classification.ts";
import { DecoderError } from "./errors.ts";

const CATALOGUE_GROUP = "components";
export const CATALOGUE_GROUP_KEY = `groups.${CATALOGUE_GROUP}`;
export const CATALOGUE_ENTRIES_KEY = `${CATALOGUE_GROUP_KEY}.entries`;

/** Why an entry classifies as it does: law, or the author's judgement (ADR 0006, ADR 0010). */
export type ClassificationBasis =
  | { kind: "statute"; source: string }
  | { kind: "judgement"; rationale: string };

export interface CatalogueEntry {
  /** The catalogue key, e.g. `employer_pf`. */
  type: string;
  classification: Classification;
  basis: ClassificationBasis;
  /** Where in the rules file this entry sits, for the output to quote. */
  rules_key: string;
}

export type ComponentCatalogue = ReadonlyMap<string, CatalogueEntry>;

/** The catalogue in a rules file, or undefined when the file carries no such group. */
export function readComponentCatalogue(rules: RulesFile): ComponentCatalogue | undefined {
  const group = rules.document.groups[CATALOGUE_GROUP];
  if (group === undefined) return undefined;

  const rawEntries = group["entries"];
  if (!isRulesMap(rawEntries)) {
    throw malformed(rules, CATALOGUE_ENTRIES_KEY, "entries must be a map of component types");
  }

  const entries = new Map<string, CatalogueEntry>();
  for (const [type, rawEntry] of Object.entries(rawEntries)) {
    const rulesKey = `${CATALOGUE_ENTRIES_KEY}.${type}`;
    if (!isRulesMap(rawEntry)) {
      throw malformed(rules, rulesKey, "a catalogue entry must be a map");
    }
    entries.set(type, {
      type,
      classification: readClassification(
        (field) => rawEntry[field],
        (field, message) => malformed(rules, `${rulesKey}.${field}`, message),
      ),
      basis: readBasis(rules, rawEntry, rulesKey),
      rules_key: rulesKey,
    });
  }
  return entries;
}

/**
 * An entry's classification either follows from a statute, which it cites, or it
 * is the author's judgement, which it states. The group's own source says where
 * the catalogue's vocabulary comes from and cannot stand in for either, so an
 * entry carrying neither is refused rather than quietly inheriting it.
 */
function readBasis(
  rules: RulesFile,
  entry: { [key: string]: RulesValue },
  rulesKey: string,
): ClassificationBasis {
  const source = entry["source"];
  const rationale = entry["rationale"];

  if (source !== undefined && rationale !== undefined) {
    throw malformed(
      rules,
      rulesKey,
      "an entry cites a statute as its source or states a rationale, not both",
    );
  }
  if (source !== undefined) {
    if (typeof source !== "string" || !source.startsWith("https://")) {
      throw malformed(rules, `${rulesKey}.source`, "an entry's source must be an https URL");
    }
    return { kind: "statute", source };
  }
  if (typeof rationale === "string" && rationale.trim() !== "") {
    return { kind: "judgement", rationale };
  }
  throw malformed(
    rules,
    rulesKey,
    "an entry must carry a source, when a statute settles its classification, or a rationale, when the author does",
  );
}

function isRulesMap(value: RulesValue | undefined): value is { [key: string]: RulesValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function malformed(rules: RulesFile, rulesKey: string, message: string): DecoderError {
  return new DecoderError({
    code: "rules_file_invalid",
    message: `${rules.path}:${rulesKey} ${message}`,
    details: { rules_file: rules.path, rules_key: rulesKey },
  });
}
