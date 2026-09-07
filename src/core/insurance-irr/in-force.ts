/**
 * The surrender and paid-up figures for an in-force policy, each with its
 * basis (issue #69, ADR 0008 [insurance-irr], ADR 0017 [insurance-irr]):
 * `insurer-quoted` when the user typed a figure; `regulatory-floor` when no
 * quote was typed and the core computed one in its place from
 * `surrender-value-floors.ts`, carrying the sentence naming the special
 * surrender value as the thing it cannot compute; `insurer-defined` when the
 * regulation leaves the policy year to the insurer's own smooth progression
 * and the core has nothing to emit — `null`, never interpolated.
 *
 * A typed quote below its computed floor is `below-regulatory-floor`
 * (`kind: statute`) — for the surrender value against the GSV floor, or for
 * a typed paid-up sum assured against its pro-rata floor; a bad quote is
 * visible rather than taken on trust, whichever figure it is.
 *
 * Present only once a policy is in force (`premiums_paid >= 1`); a
 * pre-purchase policy carries neither reading (ADR 0007 [insurance-irr]).
 */
import { applyRate, money, rate, type Money, type Rate } from "../money.ts";
import { divideWithRemainder } from "../arithmetic.ts";
import type { RulesFile } from "../rules/files.ts";
import type { Classification } from "./classifications.ts";
import {
  paidUpSumAssuredFloorCitationFor,
  surrenderValueFloorFor,
  type FloorReading,
  type PremiumMode,
  type SurrenderFloorCitation,
} from "./surrender-value-floors.ts";

const SPECIAL_SURRENDER_VALUE_NOT_COMPUTED =
  "the guaranteed surrender value floor; the insurer's special surrender value, which may sit above it, is not computed";

export type SurrenderPaidUpBasis = "insurer-quoted" | "regulatory-floor" | "insurer-defined";

export interface SurrenderReading {
  /** The figure this basis stands behind: the typed quote, the computed floor, or `null` when neither exists. */
  value: Money | null;
  basis: SurrenderPaidUpBasis;
  /** The computed regulatory floor; `null` when the policy year is `insurer-defined` (never interpolated). */
  floor: Money | null;
  floor_percentage: Rate | null;
  /** Present exactly when `floor` is not `null`. */
  citation?: SurrenderFloorCitation;
  /** Present only for `basis: "regulatory-floor"` (ADR 0008 [insurance-irr]). */
  assumption?: string;
}

interface SurvivalBenefitAmount {
  year: number;
  amount: Money;
}

export interface PaidUpReading {
  sum_assured: Money;
  /** Paid-up carries no `insurer-defined` basis: the pro-rata floor is always computable from the input alone. */
  basis: "insurer-quoted" | "regulatory-floor";
  /** Present only for `basis: "insurer-quoted"`: the typed benefits, which the floor says nothing about. */
  maturity_benefit?: Money;
  survival_benefits?: SurvivalBenefitAmount[];
  floor: Money;
  citation: SurrenderFloorCitation;
}

export interface InForcePaidUpInput {
  maturity_benefit: Money;
  survival_benefits: SurvivalBenefitAmount[];
  sum_assured: Money;
}

export interface InForceInput {
  premiums_paid: number;
  premium_paying_term: number;
  policy_term: number;
  /** Pre-GST: the sum insured under the contract, not the GST-inclusive cash outflow (ADR 0017 [insurance-irr]). */
  annual_premium: Money;
  sum_assured: Money;
  /** The `guaranteed` scenario's own survival benefits — the only ones the contract actually guarantees (ADR 0009). */
  guaranteed_survival_benefits: SurvivalBenefitAmount[];
  surrender_value?: Money;
  paid_up?: InForcePaidUpInput;
}

export interface InForceReadings {
  surrender: SurrenderReading;
  paid_up: PaidUpReading;
  classifications: Classification[];
}

export function inForceReadingsFor(rules: RulesFile, input: InForceInput): InForceReadings {
  const premiumMode: PremiumMode = input.premium_paying_term === 1 ? "single" : "regular";
  const floor = surrenderValueFloorFor(rules, premiumMode, input.premiums_paid, input.policy_term);
  const floorAmount = floor === undefined ? undefined : surrenderFloorAmount(input, floor.rate_bp);

  const surrender = surrenderReadingFor(input.surrender_value, floorAmount, floor);
  const paidUp = paidUpReadingFor(rules, input);

  const classifications: Classification[] = [
    ...belowFloorClassification("surrender_value", surrender.value, surrender.floor, surrender.citation),
    ...(paidUp.basis === "insurer-quoted"
      ? belowFloorClassification("paid_up_sum_assured", paidUp.sum_assured, paidUp.floor, paidUp.citation)
      : []),
  ];

  return { surrender, paid_up: paidUp, classifications };
}

/**
 * `below-regulatory-floor` (`kind: statute`) when a typed figure sits under
 * its own computed floor — the surrender value against the GSV floor, or a
 * typed paid-up sum assured against its pro-rata floor. `measuredName`
 * names the typed figure in `measured`, so the two occasions this fires are
 * told apart by which key is present rather than by a second code.
 */
function belowFloorClassification(
  measuredName: "surrender_value" | "paid_up_sum_assured",
  value: Money | null,
  floor: Money | null,
  citation: SurrenderFloorCitation | undefined,
): Classification[] {
  if (value === null || floor === null || citation === undefined || value.paise >= floor.paise) return [];
  return [{ code: "below-regulatory-floor", kind: "statute", measured: { [measuredName]: value, floor }, citation }];
}

/**
 * The GSV floor's percentage applied to total premiums paid, less survival
 * benefits already paid — never below nil (ADR 0017 [insurance-irr]).
 */
function surrenderFloorAmount(input: InForceInput, rateBp: number): Money {
  const totalPremiumsPaidPaise = input.annual_premium.paise * input.premiums_paid;
  const survivalBenefitsPaidPaise = input.guaranteed_survival_benefits
    .filter((benefit) => benefit.year <= input.premiums_paid)
    .reduce((sum, benefit) => sum + benefit.amount.paise, 0);
  const basePaise =
    totalPremiumsPaidPaise > survivalBenefitsPaidPaise ? totalPremiumsPaidPaise - survivalBenefitsPaidPaise : 0;
  return money(applyRate(basePaise, rateBp));
}

function surrenderReadingFor(
  quoted: Money | undefined,
  floorAmount: Money | undefined,
  floor: FloorReading | undefined,
): SurrenderReading {
  const floorField = floorAmount ?? null;
  const floorPercentage = floor === undefined ? null : rate(floor.rate_bp);
  const citationField = floor === undefined ? {} : { citation: floor.citation };

  if (quoted !== undefined) {
    return { value: quoted, basis: "insurer-quoted", floor: floorField, floor_percentage: floorPercentage, ...citationField };
  }
  if (floorAmount !== undefined) {
    return {
      value: floorAmount,
      basis: "regulatory-floor",
      floor: floorField,
      floor_percentage: floorPercentage,
      ...citationField,
      assumption: SPECIAL_SURRENDER_VALUE_NOT_COMPUTED,
    };
  }
  return { value: null, basis: "insurer-defined", floor: null, floor_percentage: null };
}

function paidUpReadingFor(rules: RulesFile, input: InForceInput): PaidUpReading {
  const citation = paidUpSumAssuredFloorCitationFor(rules);
  const floor = money(
    divideWithRemainder(input.sum_assured.paise * input.premiums_paid, input.premium_paying_term).quotient,
  );

  if (input.paid_up !== undefined) {
    return {
      sum_assured: input.paid_up.sum_assured,
      basis: "insurer-quoted",
      maturity_benefit: input.paid_up.maturity_benefit,
      survival_benefits: input.paid_up.survival_benefits,
      floor,
      citation,
    };
  }
  return { sum_assured: floor, basis: "regulatory-floor", floor, citation };
}
