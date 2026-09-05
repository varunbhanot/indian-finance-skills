/**
 * Loads `heuristics.yaml`: the authored judgement behind the decoder's flags
 * (ADR 0006).
 *
 * Its schema is the rules schema's opposite number, and deliberately so. A
 * rules group **must** carry a `source`; a heuristic **must not**, and must
 * carry a `rationale` instead. That is the whole reason the two live in
 * separate files: a reader has to be able to tell law from opinion by which
 * file a number sits in, and a `source:` in this one would destroy that in the
 * quietest possible way.
 *
 * Values are read by the rules loader's own `loadRulesValue`, so a threshold
 * written `0.20` becomes 2000 basis points by the same digit-reading path as a
 * tax rate, with no floating-point arithmetic anywhere (ADR 0002, ADR 0008).
 * The *schema* differs; the *values* do not.
 *
 * There is no financial year here. "That is a lot of variable pay" is not a
 * tax-year concept, so this file is not FY-scoped and carries no
 * `financial_year` key.
 */
import { parseDocument, isMap, type Node } from "yaml";
import { loadRulesValue, type RulesValue } from "../rules/loader.ts";

export type HeuristicsFileErrorCode =
  | "yaml_syntax"
  | "not_a_map"
  | "missing_thresholds"
  | "thresholds_not_map"
  | "threshold_not_map"
  | "threshold_missing_rationale"
  | "threshold_carries_source"
  | "value_outside_threshold"
  | "unknown_top_level_key";

export class HeuristicsFileError extends Error {
  readonly code: HeuristicsFileErrorCode;
  readonly path: string;

  constructor(code: HeuristicsFileErrorCode, path: string, message: string) {
    super(path === "" ? message : `${path}: ${message}`);
    this.name = "HeuristicsFileError";
    this.code = code;
    this.path = path;
  }
}

/** One authored threshold: why it is where it is, and whatever figures it sets. */
export interface Heuristic {
  /** The author's reason. Required, and the only thing standing in for a source. */
  rationale: string;
  [key: string]: RulesValue;
}

export interface HeuristicsDocument {
  thresholds: { [name: string]: Heuristic };
}

const THRESHOLDS = "thresholds";

export function loadHeuristicsDocument(text: string): HeuristicsDocument {
  const document = parseDocument(text, { keepSourceTokens: true });
  if (document.errors.length > 0) {
    const first = document.errors[0];
    throw new HeuristicsFileError("yaml_syntax", "", first?.message ?? "could not parse YAML");
  }

  const root = document.contents;
  if (!isMap(root)) {
    throw new HeuristicsFileError("not_a_map", "", `the document must be a map with one key, ${THRESHOLDS}`);
  }

  const thresholds: { [name: string]: Heuristic } = {};
  let seen = false;
  for (const pair of root.items) {
    const key = keyOf(pair.key);
    if (key !== THRESHOLDS) {
      throw new HeuristicsFileError(
        "unknown_top_level_key",
        key,
        `the only top-level key is ${THRESHOLDS}; every value lives inside a named threshold`,
      );
    }
    seen = true;
    const node = pair.value as Node | null;
    if (!isMap(node)) {
      throw new HeuristicsFileError("thresholds_not_map", THRESHOLDS, `${THRESHOLDS} must be a map of named thresholds`);
    }
    for (const entry of node.items) {
      const name = keyOf(entry.key);
      thresholds[name] = readThreshold(entry.value as Node | null, `${THRESHOLDS}.${name}`, name);
    }
  }
  if (!seen) {
    throw new HeuristicsFileError("missing_thresholds", "", `the document must carry ${THRESHOLDS}`);
  }
  return { thresholds };
}

function readThreshold(node: Node | null, path: string, name: string): Heuristic {
  if (!isMap(node)) {
    throw new HeuristicsFileError("threshold_not_map", path, "a threshold must be a map carrying at least a rationale");
  }
  const value = loadRulesValue(node, path, name);
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new HeuristicsFileError("threshold_not_map", path, "a threshold must be a map carrying at least a rationale");
  }

  rejectSourceAnywhere(value, path);

  const rationale = value["rationale"];
  if (typeof rationale !== "string" || rationale.trim() === "") {
    throw new HeuristicsFileError(
      "threshold_missing_rationale",
      `${path}.rationale`,
      "a heuristic carries a rationale in place of a source: say why the threshold is where it is",
    );
  }
  return { ...value, rationale };
}

/**
 * No `source` at any depth. A URL here would be a statutory claim standing in a
 * file of opinions, which is the one confusion ADR 0006 exists to prevent — and
 * it would pass every other check, because a source is what the *other* schema
 * demands.
 */
function rejectSourceAnywhere(value: RulesValue, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectSourceAnywhere(item, `${path}[${index}]`));
    return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, child] of Object.entries(value)) {
    if (key === "source") {
      throw new HeuristicsFileError(
        "threshold_carries_source",
        `${path}.${key}`,
        "a heuristic is authored judgement and carries no source; a value with a source belongs in rules/ (ADR 0006)",
      );
    }
    rejectSourceAnywhere(child, `${path}.${key}`);
  }
}

function keyOf(key: unknown): string {
  const scalar = (key as { value?: unknown } | null)?.value;
  if (typeof scalar === "string") return scalar;
  throw new HeuristicsFileError("not_a_map", "", "keys must be strings");
}
