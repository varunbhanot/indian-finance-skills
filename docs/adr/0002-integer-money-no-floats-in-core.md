# The deterministic core contains no floating-point arithmetic

All money is held as integer **paise**, and all rates are converted to integer
**basis points** by the rules loader, so every arithmetic operation in the core
is integer arithmetic. Rupee amounts alone would have been safe in JS doubles,
but rates are not: `0.05` and `0.12` are inexact in binary, so `basic × 0.12`
can land on `5999.999999999999` and a computed tax figure would depend on
multiplication order. A project whose entire claim is determinism cannot have
that.

The YAML stays human-readable — a contributor updating a slab writes
`rate: 0.05`, never `500` — and the loader does the conversion, failing loudly
if a rate carries more precision than basis points can represent rather than
silently truncating it.

Rounding happens only at the two statutory boundaries, §288A (total income to
the nearest ₹10) and §288B (tax payable to the nearest ₹1), and those two rules
live in `rules/` with their own sources like any other rule.

## Considered options

**Floating-point rupees**: simplest, quietly wrong at the edges. **A decimal
library (decimal.js, big.js)**: correct, but adds a dependency and still needs
a rounding policy; integers need neither.
