/**
 * Integer division for the deterministic core (ADR 0002, ADR 0012).
 *
 * The core may not use `/`, so division is done the way `formatIndianRupees`
 * already handles digits: schoolbook long division over the decimal string of
 * the dividend, using only `+`, `-`, `*` and comparison. The result is exact,
 * order-independent, and needs no carve-out in the no-float lint.
 *
 * The inner loop runs at most nine times per digit, because the running
 * remainder is always below the divisor before the next digit is brought down.
 */

/** The largest divisor this helper accepts, so `remainder * 10 + 9` stays a safe integer. */
const MAX_DIVISOR = 1_000_000_000;

export interface Division {
  /** The whole quotient, with the remainder discarded rather than rounded. */
  quotient: number;
  /** What was discarded, in the dividend's own units. Always `0 <= remainder < divisor`. */
  remainder: number;
}

/**
 * `dividend ÷ divisor` as a whole quotient and its remainder. Both operands are
 * non-negative safe integers; anything else is a programming error in the core
 * rather than a rejection the user could have caused, so it throws.
 */
export function divideWithRemainder(dividend: number, divisor: number): Division {
  if (!Number.isSafeInteger(dividend) || dividend < 0) {
    throw new RangeError(`dividend must be a non-negative safe integer, got ${dividend}`);
  }
  if (!Number.isSafeInteger(divisor) || divisor <= 0 || divisor > MAX_DIVISOR) {
    throw new RangeError(`divisor must be a whole number in 1..${MAX_DIVISOR}, got ${divisor}`);
  }

  const digits = String(dividend);
  let remainder = 0;
  let quotient = 0;
  for (const digit of digits) {
    remainder = remainder * 10 + parseInt(digit, 10);
    let figure = 0;
    while (remainder >= divisor) {
      remainder -= divisor;
      figure += 1;
    }
    quotient = quotient * 10 + figure;
  }
  return { quotient, remainder };
}
