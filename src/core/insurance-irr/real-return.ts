/**
 * The real return of a nominal IRR against a typed inflation figure, by the
 * Fisher relation and nothing else (ADR 0005): `((10000 + nominal_bp) ×
 * 10000) ÷ (10000 + inflation_bp) − 10000`, through `divideWithRemainder`
 * with the remainder discarded — floored, the same bias `irr.ts`'s own
 * search takes. The napkin subtraction `nominal − inflation` is never
 * computed: two "real return" figures in one output is a question the skill
 * would have to settle in prose, which is where errors creep in.
 *
 * Both `10000 + nominal_bp` and `10000 + inflation_bp` are positive for
 * every rate the core accepts (ADR 0016 [ctc-decoder]'s −9999 floor keeps
 * `10000 + bp ≥ 1`), so the numerator is always a non-negative safe integer
 * and no signed division is needed here, unlike the roll-forward in
 * `irr.ts`.
 */
import { divideWithRemainder } from "../arithmetic.ts";
import { BASIS_POINTS_PER_UNIT } from "../money.ts";

/** Named in the output beside the figure, so "why isn't it just nominal − inflation" is pointed at this. */
export const REAL_RETURN_METHOD =
  "Fisher relation: (1 + nominal) ÷ (1 + inflation) − 1, floored to the basis point";

export function realReturnBp(nominalBp: number, inflationBp: number): number {
  const numerator = (BASIS_POINTS_PER_UNIT + nominalBp) * BASIS_POINTS_PER_UNIT;
  const divisor = BASIS_POINTS_PER_UNIT + inflationBp;
  return divideWithRemainder(numerator, divisor).quotient - BASIS_POINTS_PER_UNIT;
}
