# The IRR is found by bisection in basis points, and floored

The core may not use `/`, `**` or `Math` (CLAUDE.md, the CTC decoder's ADR 0002
and ADR 0012), so there is no Newton's method and no `(1+r)^-n`. We decided the
IRR is found by rolling a balance forward one policy year at a time —
`balance × (10000 + bp) ÷ 10000` through `divideWithRemainder`, then that year's
flow — and bisecting on the integer basis-point rate for the sign change of the
terminal balance at t = PT. The contract that follows:

1. **Resolution is 1 bp.** Every rate in the repository is integer basis
   points; the PRD's tolerance is 0.05%.
2. **The figure is floored**: the emitted IRR is the largest bp at which the
   rolled-forward terminal balance is still ≥ 0 — the rate the policy provably
   clears, never one it might. This is the "refuse to flatter" bias, chosen over
   nearest-bp even though nearest would match a spreadsheet's display more
   often.
3. **Negative rates are emitted, not refused.** A policy whose benefits total
   less than its premiums has a negative IRR; the search starts at −9999 bp,
   the floor at which `10000 + bp` stays positive.
4. **The search stops at 10000 bp (100%).** A run that clears it emits `null`
   and the classification `above-search-range`, never a number.
5. **No unique root is claimed.** Flows that change sign more than once (a
   money-back paying out while premiums are still due) can have several rates
   that reconcile them. The core reports the root the bisection finds *and* the
   classification `multiple-sign-changes`, so the skill can say the figure is
   one of possibly several. It never picks the "right" one.

## Considered options

- **Tenth-of-a-bp resolution via internal scaling.** Rejected: the display
  (two decimals of a percent) would not change, and it would make this the only
  rate in the repository not stored as bp.
- **Nearest-bp rounding.** Rejected for the floor, as above; the trade-off is
  an occasional 1 bp disagreement with a spreadsheet.
