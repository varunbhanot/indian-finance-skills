/**
 * The component catalogue as the rules file carries it (ADR 0004): a map of
 * component type to its classification, and to the basis that justifies it —
 * a titled statute, or an authored rationale (ADR 0010).
 *
 * The catalogue is data, so everything in this file is reading and checking,
 * never a default. A rules file with no `components` group yields `undefined`,
 * which the decoder reports as an absent rule; a rules file whose catalogue is
 * malformed is a rejection naming the key. Neither is guessed at.
 *
 * Reads with `rules-reader.ts`'s own primitives (`isRulesMap`, `rulesFileInvalid`)
 * rather than a second copy of them: the two files refuse a bad rules value in
 * one voice. It does not read through `RulesNode` itself, because a catalogue
 * entry's basis is either a statute — its `title` and `source` — or the author's
 * own `rationale`, a shape `RulesNode.citation()` does not carry.
 */
import type { RulesFile } from "../rules/files.ts";
import type { RulesValue } from "../rules/loader.ts";
import { readClassification, type Classification } from "./classification.ts";
import { isRulesMap, rulesFileInvalid, type Source } from "./rules-reader.ts";

const CATALOGUE_GROUP = "components";
export const CATALOGUE_GROUP_KEY = `groups.${CATALOGUE_GROUP}`;
export const CATALOGUE_ENTRIES_KEY = `${CATALOGUE_GROUP_KEY}.entries`;

/** Why an entry classifies as it does: law, or the author's judgement (ADR 0006, ADR 0010). */
export type ClassificationBasis =
  | { kind: "statute"; document: Source }
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
    throw rulesFileInvalid(rules, CATALOGUE_ENTRIES_KEY, "entries must be a map of component types");
  }

  const entries = new Map<string, CatalogueEntry>();
  for (const [type, rawEntry] of Object.entries(rawEntries)) {
    const rulesKey = `${CATALOGUE_ENTRIES_KEY}.${type}`;
    if (!isRulesMap(rawEntry)) {
      throw rulesFileInvalid(rules, rulesKey, "a catalogue entry must be a map");
    }
    entries.set(type, {
      type,
      classification: readClassification(
        (field) => rawEntry[field],
        (field, message) => rulesFileInvalid(rules, `${rulesKey}.${field}`, message),
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
    throw rulesFileInvalid(
      rules,
      rulesKey,
      "an entry cites a statute as its source or states a rationale, not both",
    );
  }
  if (source !== undefined) {
    if (typeof source !== "string" || !source.startsWith("https://")) {
      throw rulesFileInvalid(rules, `${rulesKey}.source`, "an entry's source must be an https URL");
    }
    // The statute an entry cites is a different paper from the group's, so the
    // entry names it: an untitled one could not reach the output's consolidated
    // source list (ADR 0015).
    const title = entry["title"];
    if (typeof title !== "string" || title.trim() === "") {
      throw rulesFileInvalid(
        rules,
        `${rulesKey}.title`,
        "an entry citing a statute must title it, so the output can name every source it cites",
      );
    }
    return { kind: "statute", document: { title, url: source } };
  }
  if (typeof rationale === "string" && rationale.trim() !== "") {
    return { kind: "judgement", rationale };
  }
  throw rulesFileInvalid(
    rules,
    rulesKey,
    "an entry must carry a source, when a statute settles its classification, or a rationale, when the author does",
  );
}
