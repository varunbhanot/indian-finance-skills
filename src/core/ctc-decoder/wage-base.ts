/**
 * A statutory wage base as this offer meets it (CONTEXT.md: *wage base*).
 *
 * Three rules name a base — basic pay itself, the provident fund's, and
 * gratuity's — and each names its own by catalogue entry in the rules file, so
 * no component type is named here (ADR 0004). Two readings of the offer measure
 * one: the basic reading, for the share and the facts basic drives, and
 * take-home, for the employee's own provident fund contribution. Both ask the
 * same question of a rules node — which of this offer's lines fall inside, and
 * what they add up to — and this is the one place it is answered.
 *
 * Only a component the catalogue classified can be inside a base: a line the
 * user classified inline carries no catalogue entry, so it is outside every
 * base whatever they called it. That rule lives here and nowhere else.
 */
import type { ClassifiedComponent } from "./classification.ts";
import type { Citation, RulesNode } from "./rules-reader.ts";

/**
 * Which wage the employer computes a provident fund contribution on: the whole
 * of the base, or the base capped at the statutory monthly ceiling.
 *
 * It lives here rather than beside either reading that needs it, because both
 * do — take-home applies the employee's rate to the wage the user says their
 * employer uses, and the employer-contribution reading measures a typed figure
 * against both — and neither owns the choice.
 */
export const PF_WAGE_BASES = ["full_basic", "statutory_ceiling"] as const;
export type PfWageBase = (typeof PF_WAGE_BASES)[number];

/** A base as the output carries it: what the rules count in, and which lines of this offer fell inside. */
export interface WageBase {
  /** The catalogue entries the rules file counts into the base. */
  entries: string[];
  /** The components of this offer that fall inside it, by the name the user typed. */
  components: string[];
  citation: Citation;
}

/** A base with the figures the core needs and the output does not carry. */
export interface MeasuredWageBase {
  base: WageBase;
  included: ClassifiedComponent[];
  /** What the included components add up to, before any ceiling a rule applies. */
  annual_paise: number;
}

/** The base a rules node names, measured against this offer. */
export function wageBaseFor(
  components: readonly ClassifiedComponent[],
  node: RulesNode,
): MeasuredWageBase {
  const entries = node.strings("entries");
  const counted = new Set(entries);
  const included = components.filter(
    (one) => one.catalogue_entry !== undefined && counted.has(one.catalogue_entry),
  );
  return {
    base: { entries, components: included.map((one) => one.name), citation: node.citation() },
    included,
    annual_paise: included.reduce((running, one) => running + one.annual_paise, 0),
  };
}
