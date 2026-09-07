/**
 * The classifications this skill emits (issue #66, #68, #69, ADR 0001, ADR
 * 0015): a stated fact about figures already in the output, never a
 * recommendation. `comparison` carries no citation and no rationale,
 * because both figures it rests on are right there beside it — two
 * figures both present in the output, and which side the first landed on,
 * or the solver's own limits. `statute` carries a citation into the rules
 * file: a condition of the Income-tax Act, 2025's maturity-proceeds
 * exemption (issue #68, ADR 0010 [insurance-irr], `taxability.ts`), the
 * first kind to reach this array, joined in issue #69 by a typed surrender
 * quote under the guaranteed surrender value floor (`in-force.ts`,
 * ADR 0008, ADR 0017 [insurance-irr]).
 */
import type { Money, Rate } from "../money.ts";
import { rate } from "../money.ts";
import type { IrrSolution } from "./irr.ts";
import type { Source } from "../sources.ts";

export type ClassificationKind = "comparison" | "statute";

/** The same shape `GstCitation` and `InflationTargetCitation` carry (ADR 0015 [insurance-irr]). */
export interface StatuteCitation {
  section: string;
  document: Source;
  retrieved: string;
  rules_key: string;
  note?: string;
}

export interface Classification {
  code:
    | "above-search-range"
    | "multiple-sign-changes"
    | "real-return-negative"
    | "premium-exceeds-10pc-of-sum-assured"
    | "aggregate-exceeds-threshold"
    | "aggregate-unknown"
    | "death-benefit-exempt-regardless"
    | "below-regulatory-floor";
  kind: ClassificationKind;
  /**
   * The scenario this is about, by the name the policy gave it; absent
   * when the classification is about the policy as a whole rather than
   * one scenario — every `statute` code so far (ADR 0010
   * [insurance-irr]).
   */
  scenario?: string;
  /** The figures this rests on, by name; every one of them appears above it in the output. */
  measured: { [name: string]: Money | Rate };
  /** Present only for `kind: statute`; absent for `kind: comparison` (ADR 0015 [insurance-irr]). */
  citation?: StatuteCitation;
}

/** 100%, the ceiling `irr.ts`'s search gives up at (ADR 0004). */
const SEARCH_CEILING_BP = 10000;

export function classificationsFor(
  scenarioName: string,
  irr: IrrSolution,
  realReturnBp: number | null,
): Classification[] {
  const classifications: Classification[] = [];

  if (irr.above_search_range) {
    classifications.push({
      code: "above-search-range",
      kind: "comparison",
      scenario: scenarioName,
      measured: { search_ceiling: rate(SEARCH_CEILING_BP) },
    });
  }

  if (irr.rate_bp !== null && irr.multiple_sign_changes) {
    classifications.push({
      code: "multiple-sign-changes",
      kind: "comparison",
      scenario: scenarioName,
      measured: { irr: rate(irr.rate_bp) },
    });
  }

  if (irr.rate_bp !== null && realReturnBp !== null && realReturnBp < 0) {
    classifications.push({
      code: "real-return-negative",
      kind: "comparison",
      scenario: scenarioName,
      measured: { nominal_irr: rate(irr.rate_bp), real_return: rate(realReturnBp) },
    });
  }

  return classifications;
}
