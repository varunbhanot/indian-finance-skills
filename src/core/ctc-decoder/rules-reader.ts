/**
 * Reading typed values out of a loaded rules file. `rulesGroup` opens a group;
 * `child` walks into it a step at a time, and every node knows the dotted key
 * it sits at, so a rejection quotes the key a ticket named
 * (`groups.income_tax.new_regime.rebate.maximum`) rather than a position.
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
 *
 * A citation names the *document* the provision sits in, not just its URL, so
 * the output can list every source it cites by name (ADR 0007, ADR 0015). A
 * document is titled once, on the group, and a node citing a different document
 * from its group's titles that one instead; a node citing an untitled document
 * is refused, which is what makes the consolidated list complete rather than
 * best-effort.
 */
import type { RulesFile } from "../rules/files.ts";
import type { RulesValue } from "../rules/loader.ts";
import { DecoderError } from "./errors.ts";

/** A type guard the catalogue reader shares, so "is this a nested map" is asked one way. */
export function isRulesMap(value: RulesValue | undefined): value is { [key: string]: RulesValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A document the output cites: the title the rules file gives it, and its URL. */
export interface Source {
  title: string;
  url: string;
}

/** Where a figure came from, carried into the output beside the figure itself. */
export interface Citation {
  /** The provision in force for this financial year, as the rules file states it. */
  section: string;
  /** The paper that provision sits in. */
  document: Source;
  retrieved: string;
  /** The dotted key in the rules file, e.g. `groups.income_tax.cess`. */
  rules_key: string;
  /**
   * What the rules file wants said alongside the figure: a caveat on how well
   * it is sourced, a limit on when it applies, a provision that qualifies it.
   * Present only when the rules file wrote one, and carried through to the
   * output verbatim so a shaky figure cannot be quoted as a firm one.
   */
  note?: string;
}

const RULES_KEY_ROOT = "groups";

/** The named group of a rules file, or an absent-rule rejection quoting its key. */
export function rulesGroup(file: RulesFile, name: string): RulesNode {
  const group = file.document.groups[name];
  const key = `${RULES_KEY_ROOT}.${name}`;
  if (group === undefined) throw absent(file, key);
  const value = group as unknown as RulesValue;
  return new RulesNode(file, key, value, documentIn(value, undefined));
}

/** Whether the named group exists at all, for a reading the rules file need not carry. */
export function hasRulesGroup(file: RulesFile, name: string): boolean {
  return file.document.groups[name] !== undefined;
}

/**
 * The document a node cites: its own `title` and `source` when it carries both,
 * and otherwise whichever document encloses it. A node that narrows the source
 * without naming the paper inherits nothing, so `citation()` can refuse it.
 *
 * Exported because the CI check that every rules file titles what it cites walks
 * the raw document rather than `RulesNode`s (ADR 0015), and a second copy of
 * this rule there would drift from this one silently.
 */
export function documentIn(value: RulesValue, enclosing: Source | undefined): Source | undefined {
  if (!isRulesMap(value)) return enclosing;
  const title = value["title"];
  const url = value["source"];
  if (typeof title === "string" && typeof url === "string") return { title, url };
  return enclosing;
}

export class RulesNode {
  readonly file: RulesFile;
  /** The dotted rules key this node sits at, for the output and for rejections. */
  readonly key: string;
  readonly value: RulesValue;
  /** The nearest titled document at or above this node, absent when none titles one. */
  private readonly document: Source | undefined;

  constructor(file: RulesFile, key: string, value: RulesValue, document: Source | undefined) {
    this.file = file;
    this.key = key;
    this.value = value;
    this.document = document;
  }

  /** The child map or value at `name`; absent is a rejection, not a default. */
  child(name: string): RulesNode {
    const map = this.map();
    const value = map[name];
    const key = `${this.key}.${name}`;
    if (value === undefined) throw absent(this.file, key);
    return this.descend(key, value);
  }

  /** The child at `name`, or undefined when the rules file does not carry it. */
  optionalChild(name: string): RulesNode | undefined {
    const value = this.map()[name];
    return value === undefined ? undefined : this.descend(`${this.key}.${name}`, value);
  }

  /** A whole number of rupees, a count, or any other plain integer the loader passed through. */
  integer(name: string): number {
    return this.child(name).asInteger();
  }

  asInteger(): number {
    if (typeof this.value !== "number" || !Number.isInteger(this.value)) {
      throw rulesFileInvalid(this.file, this.key, "expected a whole number");
    }
    return this.value;
  }

  /**
   * Integer basis points. The loader converted the decimal fraction in the file
   * (ADR 0008), so this only checks the key was written as a rate at all: a
   * plain integer here would mean someone wrote `12` where `0.12` was meant.
   * Named apart from `money.ts`'s `rate()` (which turns basis points into the
   * `{ bp, display }` the output carries): this one reads the raw integer, that
   * one produces the display pair, and the two are usually called back to back.
   */
  rateBasisPoints(name: string): number {
    const node = this.child(name);
    if (!isRateKey(name)) {
      throw rulesFileInvalid(
        this.file,
        node.key,
        "a rate must be written under a key named rate or ending in _rate, so the loader reads it as basis points",
      );
    }
    return node.asInteger();
  }

  text(name: string): string {
    return this.child(name).asText();
  }

  asText(): string {
    if (typeof this.value !== "string" || this.value.trim() === "") {
      throw rulesFileInvalid(this.file, this.key, "expected a non-empty string");
    }
    return this.value;
  }

  /** The items of a sequence, each as a node carrying its own indexed key. */
  items(name: string): RulesNode[] {
    const node = this.child(name);
    if (!Array.isArray(node.value)) {
      throw rulesFileInvalid(this.file, node.key, "expected a list");
    }
    return node.value.map((item, index) => node.descend(`${node.key}[${index}]`, item));
  }

  /** Every item read as a non-empty string, for a list of names. */
  strings(name: string): string[] {
    return this.items(name).map((item) => item.asText());
  }

  /** This node's own provenance: the in-force provision, the paper it sits in, and when it was read. */
  citation(): Citation {
    const source = this.text("source");
    if (!source.startsWith("https://")) {
      throw rulesFileInvalid(this.file, `${this.key}.source`, "source must be an https URL");
    }
    const document = this.document;
    if (document === undefined || document.url !== source) {
      throw rulesFileInvalid(
        this.file,
        `${this.key}.title`,
        "a value citing a document other than its group's must carry that document's title, so the output can name every source it cites",
      );
    }
    const note = this.optionalChild("note");
    return {
      section: this.text("section"),
      document,
      retrieved: this.text("retrieved"),
      rules_key: this.key,
      ...(note === undefined ? {} : { note: note.asText() }),
    };
  }

  /** A child node, carrying whichever document titles it: its own, or this one's. */
  private descend(key: string, value: RulesValue): RulesNode {
    return new RulesNode(this.file, key, value, documentIn(value, this.document));
  }

  private map(): { [key: string]: RulesValue } {
    if (!isRulesMap(this.value)) {
      throw rulesFileInvalid(this.file, this.key, "expected a map of named values");
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

/** A malformed rules value, wherever in the file it sits. Shared with `catalogue.ts`, so the two readers refuse a bad value in one voice. */
export function rulesFileInvalid(file: RulesFile, rulesKey: string, message: string): DecoderError {
  return new DecoderError({
    code: "rules_file_invalid",
    message: `${file.path}:${rulesKey} ${message}`,
    details: { rules_file: file.path, rules_key: rulesKey },
  });
}
