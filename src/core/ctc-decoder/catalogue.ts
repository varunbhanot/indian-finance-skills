/**
 * The component catalogue as the rules file carries it (ADR 0004): a map of
 * component type to its classification, with the source that justifies it.
 *
 * The catalogue is data, so everything in this file is reading and checking,
 * never a default. A rules file with no `components` group yields `undefined`,
 * which the decoder reports as an absent rule; a rules file whose catalogue is
 * malformed is a rejection naming the key. Neither is guessed at.
 */
import type { RulesFile } from "../rules/files.ts";
import type { RulesValue } from "../rules/loader.ts";
import {
  isCertainty,
  isForm,
  isInstrument,
  type Classification,
} from "./classification.ts";
import { DecoderError } from "./errors.ts";

export const CATALOGUE_GROUP = "components";
export const CATALOGUE_GROUP_KEY = `groups.${CATALOGUE_GROUP}`;
export const CATALOGUE_ENTRIES_KEY = `${CATALOGUE_GROUP_KEY}.entries`;

export interface CatalogueEntry {
  /** The catalogue key, e.g. `employer_pf`. */
  type: string;
  classification: Classification;
  /** The entry's own source when it has one, else the group's. */
  source: string;
  /** Where in the rules file this entry sits, for the output to quote. */
  rules_key: string;
}

export interface ComponentCatalogue {
  entries: ReadonlyMap<string, CatalogueEntry>;
}

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
      classification: readClassification(rules, rawEntry, rulesKey),
      source: readEntrySource(rules, rawEntry, rulesKey, group.source),
      rules_key: rulesKey,
    });
  }
  return { entries };
}

function readClassification(
  rules: RulesFile,
  entry: { [key: string]: RulesValue },
  rulesKey: string,
): Classification {
  const certainty = entry["certainty"];
  if (!isCertainty(certainty)) {
    throw malformed(
      rules,
      `${rulesKey}.certainty`,
      `certainty must be one of the axis values (ADR 0004), got ${JSON.stringify(certainty)}`,
    );
  }
  const form = entry["form"];
  if (!isForm(form)) {
    throw malformed(
      rules,
      `${rulesKey}.form`,
      `form must be one of the axis values (ADR 0004), got ${JSON.stringify(form)}`,
    );
  }
  const recurring = entry["recurring"];
  if (typeof recurring !== "boolean") {
    throw malformed(rules, `${rulesKey}.recurring`, "recurring must be true or false");
  }

  const instrument = entry["instrument"];
  if (instrument === undefined) return { certainty, form, recurring };
  if (!isInstrument(instrument)) {
    throw malformed(
      rules,
      `${rulesKey}.instrument`,
      `instrument must be rsu, option or espp, got ${JSON.stringify(instrument)}`,
    );
  }
  return { certainty, form, recurring, instrument };
}

function readEntrySource(
  rules: RulesFile,
  entry: { [key: string]: RulesValue },
  rulesKey: string,
  groupSource: string,
): string {
  const source = entry["source"];
  if (source === undefined) return groupSource;
  if (typeof source !== "string" || !source.startsWith("https://")) {
    throw malformed(rules, `${rulesKey}.source`, "an entry's source must be an https URL");
  }
  return source;
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
