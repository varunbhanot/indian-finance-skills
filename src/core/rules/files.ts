/**
 * The rules files on disk: which financial years exist, and loading one.
 * Paths are reported relative to the repository root so output is stable
 * across machines.
 *
 * `CTC_DECODER_RULES_DIR` names a different repository-relative directory to
 * read them from. It exists so a fixture can pin a rules document this
 * repository does not ship -- one missing a group, or one carrying a catalogue
 * entry that does not exist yet -- without a second CLI seam (ADR 0009). It is
 * a test affordance: nothing in `rules/` or the skill layer sets it.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadRulesDocument, RulesFileError, type RulesDocument } from "./loader.ts";

export const REPOSITORY_ROOT = resolve(import.meta.dirname, "..", "..", "..");
export const DEFAULT_RULES_DIRECTORY = "rules";
const RULES_FILE_PATTERN = /^fy(\d{4}-\d{2})\.yaml$/;

/** The directory rules files are read from, resolved per call so a test can change it. */
function rulesDirectory(): string {
  return process.env["CTC_DECODER_RULES_DIR"] ?? DEFAULT_RULES_DIRECTORY;
}

export interface RulesFileEntry {
  /** Repository-relative, e.g. `rules/fy2026-27.yaml`. */
  path: string;
  /** The financial year the filename names. */
  financial_year: string;
}

export interface RulesFile extends RulesFileEntry {
  document: RulesDocument;
}

export function rulesFilePathFor(financialYear: string): string {
  return `${rulesDirectory()}/fy${financialYear}.yaml`;
}

/**
 * Every `fy<YYYY-YY>.yaml` in a rules directory, sorted; another name is an
 * error. Pass `directory` to read one other than the decoder's, which is what
 * the schema check does so it always sees this repository's own rules.
 */
export function listRulesFiles(directory: string = rulesDirectory()): RulesFileEntry[] {
  return readdirSync(join(REPOSITORY_ROOT, directory))
    .filter((name) => name.endsWith(".yaml"))
    .sort()
    .map((name) => {
      const financialYear = RULES_FILE_PATTERN.exec(name)?.[1];
      if (financialYear === undefined) {
        throw new RulesFileError(
          "invalid_financial_year",
          `${directory}/${name}`,
          "rules files must be named fy<YYYY-YY>.yaml",
        );
      }
      return { path: `${directory}/${name}`, financial_year: financialYear };
    });
}

/** Loads a listed rules file and checks it declares the year its name promises. */
export function loadRulesFile(entry: RulesFileEntry): RulesFile {
  const document = loadRulesDocument(readFileSync(join(REPOSITORY_ROOT, entry.path), "utf8"));
  if (document.financial_year !== entry.financial_year) {
    throw new RulesFileError(
      "invalid_financial_year",
      `${entry.path}:financial_year`,
      `file is named for ${entry.financial_year} but declares ${document.financial_year}`,
    );
  }
  return { ...entry, document };
}

/** The rules file for a financial year, or undefined when none exists. */
export function resolveRulesFile(financialYear: string): RulesFile | undefined {
  const entry = listRulesFiles().find((file) => file.financial_year === financialYear);
  return entry === undefined ? undefined : loadRulesFile(entry);
}
