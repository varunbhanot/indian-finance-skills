# In-force rows exclude sunk premiums, and price continuing at the surrender value

For a policy with `n` premiums paid, the PRD's Keep / Surrender / Paid-Up
paths are three rows inside each comparison column (ADR 0006), all measured as
terminal wealth at t = PT:

- **Keep** — the remaining `PPT − n` premiums go out; the remaining survival
  benefits and the maturity benefit come in, survival benefits rolled forward
  at the column's benchmark.
- **Surrender** — the typed surrender value is invested today at the benchmark,
  and each remaining premium is invested at the benchmark instead of paid.
  Nothing comes from the policy.
- **Paid-up** — the typed paid-up maturity benefit comes in at PT (and any typed
  reduced survival benefits at their years); the remaining premiums are
  invested as in Surrender.

We decided two things the PRD leaves unsaid:

1. **The `n` premiums already paid appear in no row.** They are gone whichever
   path is taken, and including them would shift all three rows by the same
   amount. The output states them as context — `premiums_paid: { count, total }`
   — and no row's arithmetic touches them. The **in-force IRR** is the rate at
   which the surrender value (as the outflow at t = now, since it is what
   continuing forgoes), the remaining premiums (further outflows) and the
   remaining benefits (inflows) reconcile. It is the one figure the persona
   cannot get from a brochure, and the sunk-cost exclusion is what makes it
   honest.
2. **Cover is stated, never priced by the tool.** Surrender ends the life
   cover, paid-up reduces it, keep retains it. Each row carries its sum assured
   (the policy's for Keep, the typed paid-up sum for Paid-up, ₹0 for Surrender).
   A term premium is netted against the Surrender and Paid-up rows only when
   the user types one, in which case buy-term-and-invest applies exactly as
   pre-purchase (ADR 0002, ADR 0006).
