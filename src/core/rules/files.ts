/**
 * The rules files on disk: which financial years exist, and loading one.
 * Paths are reported relative to the repository root so output is stable
 * across machines.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadRulesDocument, RulesFileError, type RulesDocument } from "./loader.ts";

export const REPOSITORY_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const RULES_DIRECTORY = "rules";
const RULES_FILE_PATTERN = /^fy(\d{4}-\d{2})\.yaml$/;

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
  return `${RULES_DIRECTORY}/fy${financialYear}.yaml`;
}

/** Every `rules/*.yaml`, sorted; a file not named `fy<YYYY-YY>.yaml` is an error. */
export function listRulesFiles(): RulesFileEntry[] {
  return readdirSync(join(REPOSITORY_ROOT, RULES_DIRECTORY))
    .filter((name) => name.endsWith(".yaml"))
    .sort()
    .map((name) => {
      const financialYear = RULES_FILE_PATTERN.exec(name)?.[1];
      if (financialYear === undefined) {
        throw new RulesFileError(
          "invalid_financial_year",
          `${RULES_DIRECTORY}/${name}`,
          "rules files must be named fy<YYYY-YY>.yaml",
        );
      }
      return { path: `${RULES_DIRECTORY}/${name}`, financial_year: financialYear };
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
