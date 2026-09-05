/**
 * Reading typed values out of a loaded rules file, by the dotted key a ticket
 * names (`income_tax.new_regime.rebate.maximum`).
 *
 * Two rejections come from here and nowhere else, so the decoder answers "the
 * rules do not say" and "the rules say something I cannot read" in one voice:
 * a key the file does not carry is `rule_absent`, and a key carrying the wrong
 * kind of value is `rules_file_invalid`. Neither is ever defaulted — a figure
 * the rules file has not been given is a figure the decoder does not have
 * (CLAUDE.md).
 *
 * Every node can also produce its own `Citation`, because a rules key states the
 * provision it came from beside its value (ADR 0010): the group's `source` is
 * where the group's vocabulary comes from, not authority for each figure in it.
 */
import type { RulesFile } from "../rules/files.ts";
import type { RulesValue } from "../rules/loader.ts";
import { DecoderError } from "./errors.ts";

/** Where a figure came from, carried into the output beside the figure itself. */
export interface Citation {
  /** The provision in force for this financial year, as the rules file states it. */
  section: string;
  source: string;
  retrieved: string;
  /** The dotted key in the rules file, e.g. `groups.income_tax.cess`. */
  rules_key: string;
}

const RULES_KEY_ROOT = "groups";

export class RulesReader {
  readonly file: RulesFile;

  constructor(file: RulesFile) {
    this.file = file;
  }

  /** The group named `name`, or an absent-rule rejection quoting its key. */
  group(name: string): RulesNode {
    const group = this.file.document.groups[name];
    const key = `${RULES_KEY_ROOT}.${name}`;
    if (group === undefined) throw absent(this.file, key);
    return new RulesNode(this.file, key, group as unknown as RulesValue);
  }
}

export class RulesNode {
  readonly file: RulesFile;
  /** The dotted rules key this node sits at, for the output and for rejections. */
  readonly key: string;
  readonly value: RulesValue;

  constructor(file: RulesFile, key: string, value: RulesValue) {
    this.file = file;
    this.key = key;
    this.value = value;
  }

  /** The child map or value at `name`; absent is a rejection, not a default. */
  child(name: string): RulesNode {
    const map = this.map();
    const value = map[name];
    const key = `${this.key}.${name}`;
    if (value === undefined) throw absent(this.file, key);
    return new RulesNode(this.file, key, value);
  }

  /** The child at `name`, or undefined when the rules file does not carry it. */
  optionalChild(name: string): RulesNode | undefined {
    const value = this.map()[name];
    return value === undefined ? undefined : new RulesNode(this.file, `${this.key}.${name}`, value);
  }

  /** A whole number of rupees, a count, or any other plain integer the loader passed through. */
  integer(name: string): number {
    return this.child(name).asInteger();
  }

  asInteger(): number {
    if (typeof this.value !== "number" || !Number.isInteger(this.value)) {
      throw invalid(this.file, this.key, "expected a whole number");
    }
    return this.value;
  }

  /**
   * Integer basis points. The loader converted the decimal fraction in the file
   * (ADR 0008), so this only checks the key was written as a rate at all: a
   * plain integer here would mean someone wrote `12` where `0.12` was meant.
   */
  rate(name: string): number {
    const node = this.child(name);
    if (!isRateKey(name)) {
      throw invalid(
        this.file,
        node.key,
        "a rate must be written under a key named rate or ending in _rate, so the loader reads it as basis points",
      );
    }
    return node.asInteger();
  }

  text(name: string): string {
    const node = this.child(name);
    if (typeof node.value !== "string" || node.value.trim() === "") {
      throw invalid(this.file, node.key, "expected a non-empty string");
    }
    return node.value;
  }

  /** The items of a sequence, each as a node carrying its own indexed key. */
  items(name: string): RulesNode[] {
    const node = this.child(name);
    if (!Array.isArray(node.value)) {
      throw invalid(this.file, node.key, "expected a list");
    }
    return node.value.map((item, index) => new RulesNode(this.file, `${node.key}[${index}]`, item));
  }

  /** Every item read as a non-empty string, for a list of names. */
  strings(name: string): string[] {
    return this.items(name).map((item) => {
      if (typeof item.value !== "string" || item.value.trim() === "") {
        throw invalid(this.file, item.key, "expected a non-empty string");
      }
      return item.value;
    });
  }

  /** This node's own provenance: the in-force provision, its URL, and when it was read. */
  citation(): Citation {
    const source = this.text("source");
    if (!source.startsWith("https://")) {
      throw invalid(this.file, `${this.key}.source`, "source must be an https URL");
    }
    return {
      section: this.text("section"),
      source,
      retrieved: this.text("retrieved"),
      rules_key: this.key,
    };
  }

  private map(): { [key: string]: RulesValue } {
    if (typeof this.value !== "object" || this.value === null || Array.isArray(this.value)) {
      throw invalid(this.file, this.key, "expected a map of named values");
    }
    return this.value;
  }
}

function isRateKey(key: string): boolean {
  return key === "rate" || key.endsWith("_rate");
}

function absent(file: RulesFile, rulesKey: string): DecoderError {
  return new DecoderError({
    code: "rule_absent",
    message: `${file.path} carries no ${rulesKey}: the rule is absent, so the figure it would settle cannot be computed`,
    details: { rules_file: file.path, rules_key: rulesKey },
  });
}

function invalid(file: RulesFile, rulesKey: string, message: string): DecoderError {
  return new DecoderError({
    code: "rules_file_invalid",
    message: `${file.path}:${rulesKey} ${message}`,
    details: { rules_file: file.path, rules_key: rulesKey },
  });
}
