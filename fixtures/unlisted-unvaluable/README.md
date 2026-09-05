# Unlisted equity: nil, named, and never dropped

A startup ESOP grant the letter values at ₹80,00,000, with everything such a
letter usually states: 10,000 units, a ₹40 strike, and a ₹800 price per share
from the last funding round. There is no market to read any of it against, so
the grant is held at ₹0 with `method` `unvaluable`.

Nothing is thrown away to get there. The units, the strike and the price are all
in the output; the claimed value is in `equity_as_claimed` and counted in
`unvaluable_equity`; and the assumption says what a price a company puts on
itself is and is not. Both halves of ADR 0005 are here — the decoder does not
invent a number for the most inflated line on the page, and refusing to value a
letter is not the same as refusing to read it.
