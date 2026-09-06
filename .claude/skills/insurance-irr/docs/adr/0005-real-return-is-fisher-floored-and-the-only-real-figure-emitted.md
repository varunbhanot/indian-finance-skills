# Real return is Fisher, floored, and the only real figure emitted

The PRD wants a "purchasing-power-adjusted return". Two formulas are in common
use and differ by tens of basis points at Indian inflation levels: the Fisher
relation `(1 + nominal) ÷ (1 + inflation) − 1`, and the napkin subtraction
`nominal − inflation`. We decided the core emits Fisher only, computed as
`((10000 + nominal_bp) × 10000) ÷ (10000 + inflation_bp) − 10000` through
`divideWithRemainder` with the remainder discarded, so it is floored like the
IRR (ADR 0004). The subtraction figure is never emitted: two "real return"
figures in one output is a question the skill would have to settle in prose,
which is where errors creep in. The output names the formula in a `method`
field so a user asking "why isn't it just 5 − 6" is pointed at it.

The inflation figure is not a statutory rate, so under ADR 0002 it is a typed
benchmark: the user states it, the output labels it as theirs, and the tool has
no default.
