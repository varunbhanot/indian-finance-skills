# Cash flows are annual, at policy-year boundaries

The PRD asks for "IRR/XIRR". XIRR needs a date on every flow; every input the
PRD lists is in policy years (premium paying term, policy term, "20% every 4th
year", "3 premiums paid"), and nobody knows the date of their seventh premium.
We decided time in this core is an integer **policy year** `t`: premiums are
paid at the *start* of years 1..PPT (t = 0..PPT−1), survival benefits land at
the *end* of the year they are scheduled for (t = k), and maturity lands at
t = PT. The IRR is the annual effective rate reconciling these, emitted in
basis points like every other rate in the repository. Premium frequency is
annual only: a monthly-paying policy types its annualised premium and the
output says the timing was annualised.

"Money out at the start of the year, money in at the end" is the convention a
benefit illustration uses, and it is the conservative reading of a policy —
which is the right bias for a tool that refuses to flatter a product.

## Considered options

- **Dated flows (true XIRR).** Matches a spreadsheet to the paisa, but demands
  dates nobody has and a day-count in a core that cannot divide by 365.
- **Annual with a monthly / quarterly mode.** Closer to reality for monthly
  payers; multiplies the solver's work by twelve and needs a mode conversion
  nobody can source. It changes the solver's period, not its shape, so it can
  be a later ticket if anyone asks.

## Consequences

A roll-forward of a balance one year at a time needs only multiplication and
`divideWithRemainder`, so the integer core can do it without a carve-out. The
PRD's acceptance criterion (within 0.05% of a reference tool for a
four-parameter input) is an annual-IRR criterion, and is met at basis-point
resolution.
