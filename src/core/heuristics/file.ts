/**
 * `heuristics.yaml` on disk. One file, at the repository root, not scoped to a
 * financial year (ADR 0006) — and deliberately not inside `rules/`, whose every
 * file must be named `fy<YYYY-YY>.yaml` and carry sourced statutory fact.
 *
 * `CTC_DECODER_HEURISTICS_FILE` names a different repository-relative file, so
 * a fixture can pin a heuristics document this repository does not ship and
 * prove that changing a threshold changes what the decoder flags with no code
 * change. Same affordance, and the same reasoning, as ADR 0009's rules
 * directory: a test seam outside the JSON contract, which nothing in the skill
 * layer sets.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { REPOSITORY_ROOT } from "../rules/files.ts";
import { loadHeuristicsDocument, type HeuristicsDocument } from "./loader.ts";

export const DEFAULT_HEURISTICS_FILE = "heuristics.yaml";

/** Resolved per call, so a test can change it. */
export function heuristicsFilePath(): string {
  return process.env["CTC_DECODER_HEURISTICS_FILE"] ?? DEFAULT_HEURISTICS_FILE;
}

export interface HeuristicsFile {
  /** Repository-relative, e.g. `heuristics.yaml`. */
  path: string;
  document: HeuristicsDocument;
}

/** The heuristics file, or undefined when the repository carries none. */
export function loadHeuristics(path: string = heuristicsFilePath()): HeuristicsFile | undefined {
  let text: string;
  try {
    text = readFileSync(join(REPOSITORY_ROOT, path), "utf8");
  } catch {
    return undefined;
  }
  return { path, document: loadHeuristicsDocument(text) };
}
