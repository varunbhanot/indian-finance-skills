# Integer division is long division over the digits, so the lint needs no carve-out

ADR 0002 banned `/`, `Math` and floats from the core, and left open how the
first ticket to apply a rate would divide. That ticket (take-home under the new
regime) needs `amount × bp ÷ 10000` for every rate, `÷ 12` for every monthly
figure, and division again inside both statutory rounding rules. CLAUDE.md
anticipated a sanctioned helper with a carve-out in `scripts/lint-no-floats.ts`.

We chose schoolbook **long division over the decimal string of the dividend**
(`src/core/arithmetic.ts`), which uses only `+`, `-`, `*` and comparison — the
same digit-handling idiom `formatIndianRupees` already uses. It is exact for
every safe integer, and it needs **no carve-out at all**: the lint stays a flat
"no `/`, no `Math`, no floats anywhere in `src/core`", with nothing exempted and
so nothing to keep honest. `divideWithRemainder` returns the remainder rather
than swallowing it, because whether a remainder is discarded or rounded is a
decision each caller must make out loud.

The inner loop is bounded at nine subtractions per digit of the dividend, so
division is a few dozen operations on the largest figure the input cap admits
(₹100 crore, spec #4) — cost that never shows up beside a process spawn per CLI
call.

## Considered options

**`Math.floor(a / b)` with a lint exemption for one helper file**: the obvious
route, and the one CLAUDE.md expected. Rejected because an exemption is a hole
that widens: the next contributor with an awkward division adds a line to the
allowlist, and the guarantee ADR 0002 exists to make becomes a guarantee about
most of the core. `a / b` is also exactly right only while `a` is a safe
integer, which is a precondition no lint can check.

**`BigInt`**: correct and simple, but CLAUDE.md ruled it out — the ₹100 crore
input cap keeps every product inside `Number.MAX_SAFE_INTEGER`, and mixing
`bigint` and `number` through the money types would cost more clarity than the
division does.

**Repeated subtraction on the whole dividend**: exact and trivially correct,
but `10¹⁵ ÷ 10⁴` is 10¹¹ iterations. Long division is the same idea with the
digits doing the work.
