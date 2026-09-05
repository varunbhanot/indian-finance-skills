/**
 * Resolves a financial year to its rules file on disk and loads it.
 * Paths are reported relative to the repository root so output is stable
 * across machines.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadRulesDocument, RulesFileError, type RulesDocument } from "./loader.ts";

export const REPOSITORY_ROOT = resolve(import.meta.dirname, "..", "..", "..");
export const RULES_DIRECTORY = "rules";

const RULES_FILE_PATTERN = /^fy(\d{4}-\d{2})\.yaml$/;

export function rulesFilePathFor(financialYear: string): string {
  return `${RULES_DIRECTORY}/fy${financialYear}.yaml`;
}

/** Every `rules/fy*.yaml`, as [relative path, financial year named by the file]. */
export function listRulesFiles(): Array<{ path: string; financial_year: string }> {
  return readdirSync(join(REPOSITORY_ROOT, RULES_DIRECTORY))
    .filter((name) => name.endsWith(".yaml"))
    .sort()
    .map((name) => {
      const match = RULES_FILE_PATTERN.exec(name);
      if (match === null || match[1] === undefined) {
        throw new RulesFileError(
          "invalid_financial_year",
          `${RULES_DIRECTORY}/${name}`,
          "rules files must be named fy<YYYY-YY>.yaml",
        );
      }
      return { path: `${RULES_DIRECTORY}/${name}`, financial_year: match[1] };
    });
}

export function rulesFileExists(financialYear: string): boolean {
  return listRulesFiles().some((file) => file.financial_year === financialYear);
}

/** Loads and validates the rules file at a repository-relative path such as `rules/fy2026-27.yaml`. */
export function readRulesFile(relativePath: string): RulesDocument {
  const text = readFileSync(join(REPOSITORY_ROOT, relativePath), "utf8");
  const document = loadRulesDocument(text);
  const named = RULES_FILE_PATTERN.exec(relativePath.slice(RULES_DIRECTORY.length + 1))?.[1];
  if (named !== undefined && named !== document.financial_year) {
    throw new RulesFileError(
      "invalid_financial_year",
      `${relativePath}:financial_year`,
      `file is named for ${named} but declares ${document.financial_year}`,
    );
  }
  return document;
}
