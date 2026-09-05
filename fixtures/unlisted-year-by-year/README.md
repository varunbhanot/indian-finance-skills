# An unvaluable grant is nil in every year, and its claimed vest is never dropped

The company is unlisted, so the grant is held at nil (ADR 0005) and every year's
`equity_as_valued` is ₹0 — including the year the last funding round's ₹1,200 a
share would have made the largest. `total` therefore stays at the ₹15,00,000 of
basic pay in all four years.

`equity_as_claimed` moves anyway: ₹6,00,000, ₹12,00,000, ₹18,00,000, ₹24,00,000
down the 10/20/30/40 schedule the letter states. That is the letter's own figure
for what vests each year, carried whole, and `grants[0].unvaluable` says why it
is not in the total beside it. Nil is a statement, never a deletion (ADR 0016).
