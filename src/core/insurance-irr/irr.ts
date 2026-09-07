/**
 * The nominal IRR of one scenario's cash flows (issue #66, ADR 0003, ADR
 * 0004): the cash outflow at the start of each paying year, survival
 * benefits at the end of the policy year they are scheduled for, the
 * maturity benefit at the end of the policy term. The outflow is the
 * premium plus GST (issue #67, ADR 0012 [insurance-irr]), computed by the
 * caller and passed in already summed — this module reconciles whatever
 * figure it is given, never the bare premium by name.
 *
 * The balance is rolled forward one policy year at a time —
 * `balance × (10000 + bp) ÷ 10000`, through `divideSignedWithRemainder`
 * because the balance is negative from the first year, the cash outflow
 * leaving before any benefit arrives — and the IRR is found by bisecting on
 * the integer basis-point rate for the sign change of the terminal balance.
 *
 * The terminal balance is non-increasing as the rate rises: growing a
 * negative outflow at a higher rate only makes it more negative, so a policy
 * that clears at some rate no longer clears at a higher one. The emitted
 * rate is therefore the *largest* bp at which the terminal balance is still
 * non-negative — the rate the policy provably clears, never one it might —
 * found the same way `break-even.ts` finds its own threshold: a binary
 * search over a shifted non-negative index, so every step divides through
 * `divideWithRemainder` rather than needing a signed one.
 *
 * The search range is fixed at −9999..10000 bp (ADR 0004): −9999 is the
 * floor at which `10000 + bp` stays positive, and 10000 (100%) is where the
 * search gives up rather than run forever. A terminal balance still
 * non-negative at 10000 bp means the reconciling rate is somewhere beyond
 * what the core represents, so no bp is emitted at all — `above-search-range`
 * — rather than a number that understates it.
 */
import { divideWithRemainder, divideSignedWithRemainder } from "../arithmetic.ts";
import { BASIS_POINTS_PER_UNIT, type Money } from "../money.ts";

/** The floor at which `10000 + bp` stays positive (ADR 0004). */
const MIN_BP = -9999;
/** 100%: the ceiling the search gives up at (ADR 0004). */
const MAX_BP = 10000;
const SEARCH_RANGE = MAX_BP - MIN_BP;

/**
 * The largest balance magnitude, in paise, `grow` will multiply by a growth
 * factor before dividing back down. Chosen so that even the steepest growth
 * factor the search ever tries — `10000 + MAX_BP`, i.e. doubling every year
 * at 100% — keeps the product a safe integer: `450,000,000,000 × 20,000 =
 * 9,000,000,000,000,000`, under `Number.MAX_SAFE_INTEGER`.
 *
 * A balance this large is already many multiples of the ₹100 crore input cap
 * (`RUPEE_INPUT_CAP` in paise is `10,000,000,000,000`), so it can only be
 * reached by compounding at a candidate rate far from where a real policy's
 * flows ever cross zero — the sign at that point is already unambiguous, and
 * every later year would only push it further from zero. Clamping the
 * magnitude there changes no bisection outcome: `largestNonNegativeBp` only
 * ever reads the *sign* of a terminal balance, and clamping preserves sign
 * exactly, only discarding precision nobody is asking for.
 */
const MAX_SAFE_BALANCE_PAISE = 450_000_000_000;

export interface IrrSolution {
  /** The floored rate in basis points, or `null` when the search never finds a sign change within range. */
  rate_bp: number | null;
  /** True when even the 10000 bp ceiling still leaves the terminal balance non-negative. */
  above_search_range: boolean;
  /** True when the flow sequence itself changes sign more than once, so more than one rate may reconcile it. */
  multiple_sign_changes: boolean;
}

/**
 * One policy year's flow, landing at the end of that year (or, for the cash
 * outflow, leaving at the start of it — see `netFlows`). `annual_cash_outflow_paise`
 * is the premium plus GST (issue #67, ADR 0012 [insurance-irr]), not the
 * bare premium: the solver reconciles what actually leaves the bank each
 * paying year, whatever that figure is built from.
 */
export interface PolicyFlows {
  premium_paying_term: number;
  policy_term: number;
  annual_cash_outflow_paise: number;
}

/** The one scenario shape the solver needs: independent of `policy.ts`'s own `DecodedScenario`, so neither imports the other. */
export interface ScenarioFlows {
  maturity_benefit: Money;
  survival_benefits: readonly { year: number; amount: Money }[];
}

export function solveIrr(policy: PolicyFlows, scenario: ScenarioFlows): IrrSolution {
  const flows = netFlows(policy, scenario);
  const aboveSearchRange = terminalBalance(flows, MAX_BP) >= 0;
  return {
    rate_bp: aboveSearchRange ? null : largestNonNegativeBp(flows),
    above_search_range: aboveSearchRange,
    multiple_sign_changes: signChanges(flows) > 1,
  };
}

/**
 * The net flow landing at each policy-year boundary `t = 0..policy_term`:
 * `flows[0]` is the first premium, paid at the start of year 1 (ADR 0003);
 * `flows[t]` for `t = 1..premium_paying_term − 1` is the premium for year
 * `t + 1`, paid at the start of that year, which is the end of year `t`;
 * survival benefits add in at the year they are scheduled for; the maturity
 * benefit adds in at `t = policy_term`.
 */
function netFlows(policy: PolicyFlows, scenario: ScenarioFlows): number[] {
  const flows = new Array<number>(policy.policy_term + 1).fill(0);
  const add = (t: number, delta: number): void => {
    flows[t] = (flows[t] ?? 0) + delta;
  };

  add(0, -policy.annual_cash_outflow_paise);
  for (let t = 1; t < policy.premium_paying_term; t++) {
    add(t, -policy.annual_cash_outflow_paise);
  }
  for (const benefit of scenario.survival_benefits) {
    add(benefit.year, benefit.amount.paise);
  }
  add(policy.policy_term, scenario.maturity_benefit.paise);
  return flows;
}

/** The balance after rolling every year's growth and flow forward from `flows[0]`. */
function terminalBalance(flows: readonly number[], bp: number): number {
  let balance = flows[0] ?? 0;
  for (let t = 1; t < flows.length; t++) {
    balance = grow(balance, bp) + (flows[t] ?? 0);
  }
  return balance;
}

/** One year's growth of a balance that may be negative, at `bp` basis points. */
function grow(balance: number, bp: number): number {
  const clamped = clampMagnitude(balance, MAX_SAFE_BALANCE_PAISE);
  return divideSignedWithRemainder(clamped * (BASIS_POINTS_PER_UNIT + bp), BASIS_POINTS_PER_UNIT).quotient;
}

/** `value`, or `±cap` when its magnitude already exceeds `cap` — the sign is always kept. */
function clampMagnitude(value: number, cap: number): number {
  if (value > cap) return cap;
  if (value < -cap) return -cap;
  return value;
}

/**
 * The largest bp in `MIN_BP..MAX_BP` at which the terminal balance is still
 * non-negative, given the caller has already ruled out `above-search-range`
 * (so the balance at `MAX_BP` is known negative). The search is shifted to
 * `0..SEARCH_RANGE` so every step is a non-negative division, the same shape
 * `break-even.ts`'s own binary search takes, but biased to the *larger* of
 * two candidates each step rather than the smaller, since the balance here
 * is non-increasing rather than non-decreasing.
 */
function largestNonNegativeBp(flows: readonly number[]): number {
  let lo = 0;
  let hi = SEARCH_RANGE;
  while (lo < hi) {
    const half = divideWithRemainder(hi - lo + 1, 2).quotient;
    const mid = lo + half;
    if (terminalBalance(flows, MIN_BP + mid) >= 0) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return MIN_BP + lo;
}

/** How many times the flow sequence changes sign, ignoring zero entries (ADR 0004). */
function signChanges(flows: readonly number[]): number {
  let changes = 0;
  let last: -1 | 1 | undefined;
  for (const flow of flows) {
    if (flow === 0) continue;
    const sign = flow > 0 ? 1 : -1;
    if (last !== undefined && sign !== last) changes += 1;
    last = sign;
  }
  return changes;
}
