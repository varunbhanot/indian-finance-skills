/**
 * The classifications this skill emits (issue #66, ADR 0001, ADR 0015): a
 * stated fact about figures already in the output, never a recommendation.
 * `comparison` is the only kind this ticket produces — two figures both
 * present in the output, and which side the first landed on, or the
 * solver's own limits — so every one here carries no citation and no
 * rationale, because both figures it rests on are right there beside it.
 * A `statute` kind, with its own citation, is a later ticket's addition to
 * this same array, not a change to this one.
 */
import { rate, type Money, type Rate } from "../money.ts";
import type { IrrSolution } from "./irr.ts";

export type ClassificationKind = "comparison";

export interface Classification {
  code: "above-search-range" | "multiple-sign-changes" | "real-return-negative";
  kind: ClassificationKind;
  /** The scenario this is about, by the name the policy gave it. */
  scenario: string;
  /** The figures this rests on, by name; every one of them appears above it in the output. */
  measured: { [name: string]: Money | Rate };
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
