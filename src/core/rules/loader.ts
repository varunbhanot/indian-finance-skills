/**
 * Loads a `rules/fy<YYYY-YY>.yaml` document into the shape the core reads.
 *
 * Contract (ADR 0001, ADR 0002, ADR 0008):
 * - Top level carries exactly `financial_year` and `groups`.
 * - Every value lives inside a group; every group carries `source` (an https
 *   URL) and `retrieved` (YYYY-MM-DD), optionally `effective_from` and
 *   `effective_to`.
 * - A value under a key named `rate` or ending in `_rate` is a decimal fraction
 *   in the file and an integer number of basis points once loaded. The
 *   conversion reads the digits as written, so `0.05` becomes 500 without any
 *   floating-point arithmetic, and a fraction with more than four decimal
 *   places is refused rather than truncated.
 * - Every other number must be a plain integer as written.
 */
import { parseDocument, isMap, isSeq, isScalar, type Node, type Pair } from "yaml";
import { isFinancialYear } from "../financial-year.ts";

export type RulesFileErrorCode =
  | "yaml_syntax"
  | "not_a_map"
  | "missing_financial_year"
  | "invalid_financial_year"
  | "missing_groups"
  | "groups_not_map"
  | "value_outside_group"
  | "group_not_map"
  | "group_missing_source"
  | "group_source_not_url"
  | "group_missing_retrieved"
  | "group_retrieved_not_date"
  | "group_effective_not_date"
  | "rate_format"
  | "rate_precision"
  | "non_integer_value"
  | "unsupported_value";

export class RulesFileError extends Error {
  readonly code: RulesFileErrorCode;
  readonly path: string;

  constructor(code: RulesFileErrorCode, path: string, message: string) {
    super(path === "" ? message : `${path}: ${message}`);
    this.name = "RulesFileError";
    this.code = code;
    this.path = path;
  }
}

export type RulesValue =
  | number
  | string
  | boolean
  | RulesValue[]
  | { [key: string]: RulesValue };

export interface RulesGroup {
  source: string;
  retrieved: string;
  effective_from?: string;
  effective_to?: string;
  [key: string]: RulesValue | undefined;
}

export interface RulesDocument {
  financial_year: string;
  groups: { [name: string]: RulesGroup };
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PLAIN_INTEGER = /^-?\d+$/;
const PLAIN_DECIMAL = /^(\d+)(?:\.(\d+))?$/;
const BASIS_POINT_DECIMALS = 4;
const BASIS_POINTS_PER_UNIT = 10000;


export function loadRulesDocument(text: string): RulesDocument {
  const doc = parseDocument(text, { keepSourceTokens: true });
  const syntaxError = doc.errors[0];
  if (syntaxError !== undefined) {
    throw new RulesFileError("yaml_syntax", "", syntaxError.message);
  }
  const root = doc.contents;
  if (!isMap(root)) {
    throw new RulesFileError("not_a_map", "", "rules file must be a YAML map");
  }

  let financialYear: string | undefined;
  let groupsNode: Node | null | undefined;
  for (const pair of root.items) {
    const key = keyOf(pair, "");
    if (key === "financial_year") {
      financialYear = scalarString(pair.value, key);
    } else if (key === "groups") {
      groupsNode = pair.value as Node | null;
    } else {
      throw new RulesFileError(
        "value_outside_group",
        key,
        "every value must live inside a group carrying source and retrieved",
      );
    }
  }

  if (financialYear === undefined) {
    throw new RulesFileError("missing_financial_year", "financial_year", "financial_year is required");
  }
  if (!isFinancialYear(financialYear)) {
    throw new RulesFileError(
      "invalid_financial_year",
      "financial_year",
      `expected YYYY-YY naming consecutive years, got ${JSON.stringify(financialYear)}`,
    );
  }
  if (groupsNode === undefined) {
    throw new RulesFileError("missing_groups", "groups", "groups is required (use {} for none)");
  }
  if (!isMap(groupsNode)) {
    throw new RulesFileError("groups_not_map", "groups", "groups must be a map of named groups");
  }

  const groups: { [name: string]: RulesGroup } = {};
  for (const pair of groupsNode.items) {
    const name = keyOf(pair, "groups");
    groups[name] = loadGroup(pair.value as Node | null, `groups.${name}`);
  }
  return { financial_year: financialYear, groups };
}

function loadGroup(node: Node | null, path: string): RulesGroup {
  if (!isMap(node)) {
    throw new RulesFileError("group_not_map", path, "a group must be a map");
  }
  const entries: { [key: string]: RulesValue } = {};
  for (const pair of node.items) {
    const key = keyOf(pair, path);
    entries[key] = loadValue(pair.value as Node | null, `${path}.${key}`, key);
  }

  const source = entries["source"];
  if (source === undefined) {
    throw new RulesFileError("group_missing_source", path, "group must carry a source URL");
  }
  if (typeof source !== "string" || !source.startsWith("https://")) {
    throw new RulesFileError("group_source_not_url", `${path}.source`, "source must be an https URL");
  }
  const retrieved = entries["retrieved"];
  if (retrieved === undefined) {
    throw new RulesFileError("group_missing_retrieved", path, "group must carry a retrieved date");
  }
  if (typeof retrieved !== "string" || !DATE_PATTERN.test(retrieved)) {
    throw new RulesFileError("group_retrieved_not_date", `${path}.retrieved`, "retrieved must be YYYY-MM-DD");
  }
  for (const key of ["effective_from", "effective_to"]) {
    const value = entries[key];
    if (value !== undefined && (typeof value !== "string" || !DATE_PATTERN.test(value))) {
      throw new RulesFileError("group_effective_not_date", `${path}.${key}`, `${key} must be YYYY-MM-DD`);
    }
  }
  return { ...entries, source, retrieved };
}

function loadValue(node: Node | null, path: string, key: string): RulesValue {
  if (isMap(node)) {
    const out: { [key: string]: RulesValue } = {};
    for (const pair of node.items) {
      const childKey = keyOf(pair, path);
      out[childKey] = loadValue(pair.value as Node | null, `${path}.${childKey}`, childKey);
    }
    return out;
  }
  if (isSeq(node)) {
    return node.items.map((item, index) =>
      loadValue(item as Node | null, `${path}[${index}]`, key),
    );
  }
  if (!isScalar(node)) {
    throw new RulesFileError("unsupported_value", path, "unsupported YAML node");
  }
  if (isRateKey(key)) {
    return rateToBasisPoints(sourceTextOf(node, path), path);
  }
  const value: unknown = node.value;
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    const written = sourceTextOf(node, path);
    if (!PLAIN_INTEGER.test(written)) {
      throw new RulesFileError(
        "non_integer_value",
        path,
        `numbers other than rates must be plain integers, got ${written}`,
      );
    }
    return value;
  }
  throw new RulesFileError("unsupported_value", path, "only integers, rates, strings and booleans are allowed");
}

function isRateKey(key: string): boolean {
  return key === "rate" || key.endsWith("_rate");
}

/** `0.05` → 500, read from the digits as written; never through a double. */
function rateToBasisPoints(written: string, path: string): number {
  const match = PLAIN_DECIMAL.exec(written);
  if (match === null) {
    throw new RulesFileError(
      "rate_format",
      path,
      `a rate must be a plain decimal fraction such as 0.05, got ${written}`,
    );
  }
  const whole = match[1] ?? "0";
  const fraction = (match[2] ?? "").replace(/0+$/, "");
  if (fraction.length > BASIS_POINT_DECIMALS) {
    throw new RulesFileError(
      "rate_precision",
      path,
      `${written} has more precision than basis points can hold (at most ${BASIS_POINT_DECIMALS} decimal places)`,
    );
  }
  const scaled = parseInt(fraction.padEnd(BASIS_POINT_DECIMALS, "0"), 10);
  return parseInt(whole, 10) * BASIS_POINTS_PER_UNIT + scaled;
}

function sourceTextOf(node: Node, path: string): string {
  const token = node.srcToken;
  if (token === undefined || !("source" in token) || typeof token.source !== "string") {
    throw new RulesFileError("unsupported_value", path, "could not read the value as written");
  }
  return token.source;
}

function keyOf(pair: Pair, parentPath: string): string {
  const key: unknown = isScalar(pair.key) ? pair.key.value : pair.key;
  if (typeof key !== "string") {
    throw new RulesFileError("unsupported_value", parentPath, "keys must be strings");
  }
  return key;
}

function scalarString(node: unknown, path: string): string {
  if (isScalar(node) && typeof node.value === "string") return node.value;
  throw new RulesFileError("invalid_financial_year", path, "must be a string such as 2026-27");
}
