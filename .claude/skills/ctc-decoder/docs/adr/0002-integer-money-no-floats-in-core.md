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

Rounding happens only at the two statutory boundaries, total income and tax
payable, and those two rules live in `rules/` with their own sources like any
other rule.

> **Correction, recorded when #9 sourced them.** This ADR originally named them
> §288A (total income, ₹10) and §288B (tax payable, ₹1). Those are Income-tax
> Act, 1961 sections, and that Act is repealed from 1 April 2026. Under the
> Income-tax Act, 2025 a single section, §516, rounds **both** figures, and
> **both to ₹10** — the ₹1 unit did not survive. The decision this ADR records
> is unaffected: the units were always to come from `rules/`, which is why
> nothing in the core had to change. See `CONTEXT.md` and
> `docs/research/fy2026-27-new-regime-take-home.md` §5.

## Considered options

**Floating-point rupees**: simplest, quietly wrong at the edges. **A decimal
library (decimal.js, big.js)**: correct, but adds a dependency and still needs
a rounding policy; integers need neither.
