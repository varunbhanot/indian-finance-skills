/**
 * What an equity grant is worth, and — every time — how that was arrived at
 * (ADR 0005).
 *
 * Five methods, and four of them are ways of refusing to guess. Listed shares
 * are held at their grant-date fair market value, flat; a listed option at the
 * amount that value exceeds its strike, which is usually nothing; an unlisted
 * grant at nil, because its worth turns on a liquidity event that may never
 * happen; a share purchase plan at nil, because the employee funds it. No
 * method models growth in a share price, and no input field anywhere accepts a
 * growth rate: forecasting a share price is the same category of error as
 * recalling a tax rate from memory.
 *
 * Every valuation carries its `assumption` in words, because a figure held flat
 * and a figure held at nil are both wrong if read as predictions, and the reader
 * has no way to tell which they are looking at otherwise. The assumptions live
 * here rather than in a rules file: they describe what this code did, so a copy
 * of them anywhere else would drift from the branch that chose them. What is
 * *statutory* about a grant — that its value is a perquisite taxed as salary —
 * is not here at all; it is read from `groups.perquisite.equity`, keyed by
 * instrument, and carried through untouched.
 *
 * Nothing here values a *vesting year*. The schedule is echoed as typed; what a
 * year of it is worth is `year-by-year.ts`'s, which spreads the grant across the
 * years the letter names rather than reproducing the flat annual number the
 * decoder exists to take apart.
 */
import { divideWithRemainder } from "../arithmetic.ts";
import { money, rate, rupeesToPaise, RUPEE_INPUT_CAP, type Money, type Rate } from "../money.ts";
import type { RulesFile } from "../rules/files.ts";
import type { EquityReading, Instrument, Vesting } from "./classification.ts";
import { DecoderError } from "./errors.ts";
import type { EquityGrantInput, VestingInput } from "./input.ts";
import { rulesGroup, type Citation } from "./rules-reader.ts";

/** How a grant was valued. Each one is a branch below, and each states its own assumption. */
export type ValuationMethod =
  | "grant-date-fair-market-value"
  | "claimed-as-grant-date-value"
  | "intrinsic-value"
  | "unvaluable"
  | "employee-funded";

/** That the value is taxed as salary, in the rules file's words and on its authority. */
export interface Perquisite {
  statement: string;
  citation: Citation;
}

export interface EquityGrant {
  /** Whether the shares have a market price at all, as the caller typed it. */
  listed: boolean;
  method: ValuationMethod;
  /** What the decoder holds the grant at. Nil under three of the five methods. */
  valued: Money;
  /** What the letter claimed it was worth, carried whatever the valuation says (ADR 0005). */
  claimed: Money;
  units?: number;
  /** Grant-date fair market value per unit, where the letter states one. */
  grant_date_fair_market_value?: Money;
  strike?: Money;
  /** The discount a share purchase plan offers, stated rather than valued. */
  discount?: Rate;
  /** What was assumed to reach `valued`, for the skill to say out loud. */
  assumption: string;
  /** Absent only for an instrument with nothing to vest; see `measure`. */
  vesting?: Vesting;
  perquisite: Perquisite;
}

const CAP_PAISE = rupeesToPaise(RUPEE_INPUT_CAP);
const PERQUISITE_GROUP = "perquisite";

const ASSUMPTIONS: { [method in ValuationMethod]: string } = {
  "grant-date-fair-market-value":
    "Grant-date fair market value held flat: the units multiplied by the fair market value per unit typed from the letter. No growth in the share price is modelled, so this is what the shares are worth on the grant date and not what they may be worth on any vesting date.",
  "claimed-as-grant-date-value":
    "The value the letter claims, taken as the grant-date value and held flat, because no unit count and price per unit were typed beside it. No growth in the share price is modelled, and the figure rests on the letter rather than on a market quote.",
  "intrinsic-value":
    "Intrinsic value at grant, held flat: the units multiplied by the amount the fair market value per unit exceeds the strike, and nil where it does not exceed it. No growth in the share price is modelled, so an option struck at or above the grant-date price is held at nil here.",
  unvaluable:
    "Held at nil, and named rather than dropped: shares in an unlisted company have no market price, and what this grant is worth turns on a liquidity event that may never happen. The value the letter claims is carried beside it, unchanged, and so is any price per share it states — which is a company's own valuation of itself and not a price anyone has paid.",
  "employee-funded":
    "Held at nil in every valuation: the employee buys the shares with their own money, so the plan moves pay rather than adding to it. The discount is the part that is not the employee's own money, and it is stated rather than valued.",
};

/**
 * The grant as the decoder reads it. `claimedPaise` is the annualised amount the
 * component was typed at, which is the letter's own claim for the grant.
 */
export function valueGrant(
  grant: EquityGrantInput,
  instrument: Instrument,
  claimedPaise: number,
  path: string,
  rules: RulesFile,
): EquityGrant {
  const { method, valued } = measure(grant, instrument, claimedPaise, path);
  return {
    // The instrument is not repeated here: it is a classification axis, and the
    // component already carries it.
    listed: grant.listed,
    method,
    valued: money(valued),
    claimed: money(claimedPaise),
    ...(grant.units === undefined ? {} : { units: grant.units }),
    ...(grant.grant_date_fair_market_value === undefined
      ? {}
      : { grant_date_fair_market_value: money(rupeesToPaise(grant.grant_date_fair_market_value)) }),
    ...(grant.strike === undefined ? {} : { strike: money(rupeesToPaise(grant.strike)) }),
    ...(grant.discount_basis_points === undefined
      ? {}
      : { discount: rate(grant.discount_basis_points) }),
    assumption: ASSUMPTIONS[method],
    ...(grant.vesting === undefined ? {} : { vesting: vestingOf(grant.vesting) }),
    perquisite: perquisiteFor(instrument, rules),
  };
}

/** What the other readings need from a valuation; the rest of it is for the reader. */
export function readingOf(grant: EquityGrant): EquityReading {
  return {
    valued_paise: grant.valued.paise,
    unvaluable: grant.method === "unvaluable",
    ...(grant.vesting === undefined ? {} : { vesting: grant.vesting }),
  };
}

/**
 * The cap binds the sum of the valuations as well as each one, for the reason it
 * binds the sum of the typed components: a figure the output carries has to stay
 * a safe integer however many grants were typed. The running total is checked as
 * it is built rather than after, so the sum itself never leaves the safe range.
 */
export function rejectValuationsAboveCap(grants: readonly EquityGrant[]): void {
  let running = 0;
  for (const grant of grants) {
    running += grant.valued.paise;
    if (running > CAP_PAISE) {
      throw new DecoderError({
        code: "above_cap",
        message: `components: the equity grants are valued at more than ${RUPEE_INPUT_CAP} rupees in total, above what the decoder accepts`,
        path: "components",
        details: { cap_rupees: RUPEE_INPUT_CAP },
      });
    }
  }
}

/**
 * Which method applies, and what it yields. The instrument decides first,
 * because a share purchase plan is held at nil whether or not the company is
 * listed; listing decides next, because nothing about an unlisted company's
 * shares can be valued from an offer letter.
 */
function measure(
  grant: EquityGrantInput,
  instrument: Instrument,
  claimedPaise: number,
  path: string,
): { method: ValuationMethod; valued: number } {
  if (instrument === "espp") {
    requireDiscount(grant, path);
    return { method: "employee-funded", valued: 0 };
  }
  rejectDiscount(grant, path, instrument);
  requireVesting(grant, path, instrument);

  // An unlisted grant is refused a valuation, not a description. Letters for one
  // routinely state units, a strike and a price per share from the last funding
  // round, and the branch that exists for exactly those letters cannot be the
  // one that rejects them: the figures are carried into the output, and the
  // assumption says why none of them was multiplied out.
  if (!grant.listed) return { method: "unvaluable", valued: 0 };

  if (instrument === "rsu") {
    rejectStrike(grant, path);
    if (grant.units === undefined && grant.grant_date_fair_market_value === undefined) {
      return { method: "claimed-as-grant-date-value", valued: claimedPaise };
    }
    const units = required(grant.units, `${path}.units`, "grant_date_fair_market_value");
    const fairMarketValue = required(
      grant.grant_date_fair_market_value,
      `${path}.grant_date_fair_market_value`,
      "units",
    );
    return {
      method: "grant-date-fair-market-value",
      valued: product(units, fairMarketValue, path),
    };
  }

  // A listed option, whose worth is the spread and nothing else. The claimed
  // value cannot stand in for it: the letter quotes the whole value of the
  // shares, which is what the employee would have to buy them for.
  const units = requiredForOption(grant.units, `${path}.units`);
  const fairMarketValue = requiredForOption(
    grant.grant_date_fair_market_value,
    `${path}.grant_date_fair_market_value`,
  );
  const strike = requiredForOption(grant.strike, `${path}.strike`);
  const spread = fairMarketValue - strike;
  return {
    method: "intrinsic-value",
    valued: spread <= 0 ? 0 : product(units, spread, path),
  };
}

/**
 * `units × rupeesPerUnit`, in paise, refused rather than silently unsafe when
 * the two multiply out past the cap. The largest price per unit that keeps the
 * product inside the cap is derived from the units by long division (ADR 0012),
 * so neither operand nor the product ever leaves the safe range.
 */
function product(units: number, rupeesPerUnit: number, path: string): number {
  const largestPerUnit = divideWithRemainder(RUPEE_INPUT_CAP, units).quotient;
  if (rupeesPerUnit > largestPerUnit) {
    throw new DecoderError({
      code: "above_cap",
      message: `${path}: ${units} units at ${rupeesPerUnit} rupees each is above the ${RUPEE_INPUT_CAP} rupees the decoder accepts`,
      path,
      details: { cap_rupees: RUPEE_INPUT_CAP, units, rupees_per_unit: rupeesPerUnit },
    });
  }
  return units * rupeesToPaise(rupeesPerUnit);
}

function vestingOf(vesting: VestingInput): Vesting {
  return {
    years: vesting.years.map((share, index) => ({ year: index + 1, share: rate(share) })),
    ...(vesting.cliff_months === undefined ? {} : { cliff_months: vesting.cliff_months }),
  };
}

/** The statement, and the provision it stands on, for this instrument. */
function perquisiteFor(instrument: Instrument, rules: RulesFile): Perquisite {
  const node = rulesGroup(rules, PERQUISITE_GROUP).child("equity").child(instrument);
  return { statement: node.text("statement"), citation: node.citation() };
}

/**
 * A figure the method will not multiply out is still carried, because the output
 * reports it beside the assumption that says why — which is the opposite of a
 * professional tax figure typed with no wage base, where the number would vanish
 * into a total that never read it. What is refused here is narrower and is a
 * category error rather than an unused figure: a strike on an instrument that
 * has none, and a purchase discount on an instrument nobody purchases.
 */
function rejectStrike(grant: EquityGrantInput, path: string): void {
  if (grant.strike === undefined) return;
  throw invalid(
    `${path}.strike`,
    "a restricted stock unit is a promise of shares rather than a right to buy them, so it has no strike price",
  );
}

function rejectDiscount(grant: EquityGrantInput, path: string, instrument: Instrument): void {
  if (grant.discount_basis_points === undefined) return;
  throw invalid(
    `${path}.discount_basis_points`,
    `a discount off a purchase price belongs to a share purchase plan, and this grant is classified as ${instrument}`,
  );
}

/**
 * A grant that vests must say how. A share purchase plan does not reach this,
 * because it has no vesting to state and typing one in to satisfy a required
 * field would be invented input dressed as something read off the letter.
 */
function requireVesting(grant: EquityGrantInput, path: string, instrument: Instrument): void {
  if (grant.vesting !== undefined) return;
  throw invalid(
    `${path}.vesting`,
    `a grant of ${instrument} arrives over the years its schedule names, so the schedule the letter states is required: a grant reduced to one annual figure is the number the decoder exists to take apart`,
  );
}

function requireDiscount(grant: EquityGrantInput, path: string): void {
  if (grant.discount_basis_points !== undefined) return;
  throw invalid(
    `${path}.discount_basis_points`,
    "a share purchase plan is held at nil and reported by its discount, so the discount the letter states is required",
  );
}

/** One half of a pair the other half was typed without. */
function required(value: number | undefined, path: string, alongside: string): number {
  if (value !== undefined) return value;
  throw invalid(
    path,
    `${alongside} was typed, so this is needed with it: a grant is valued from units and a price per unit together, or from neither`,
  );
}

function requiredForOption(value: number | undefined, path: string): number {
  if (value !== undefined) return value;
  throw invalid(
    path,
    "an option is worth the amount its fair market value exceeds its strike, so units, grant_date_fair_market_value and strike are all required; the value the letter claims is the value of the shares, not of the option over them",
  );
}

function invalid(path: string, message: string): DecoderError {
  return new DecoderError({ code: "invalid_input", message: `${path}: ${message}`, path });
}
