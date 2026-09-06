# Salary components are classified on two axes, catalogued in rules/

Every component of an offer is classified on two independent axes rather than
sorted into buckets: **certainty** (guaranteed / conditional-on-performance /
conditional-on-tenure / conditional-on-liquidity) and **form** (cash-now /
deferred-cash / locked-savings / equity / benefit-in-kind), plus a `recurring`
flag and, for equity, an `instrument` (rsu / option / espp). **Guaranteed cash
is derived** — `guaranteed ∧ cash-now ∧ recurring` — not hand-maintained, so it
stays correct when a new component type appears.

Buckets were tried first and broke immediately: gratuity is deferred *and*
conditional on five years' service, an option is conditional on both vesting and
price exceeding strike, a joining bonus is guaranteed but one-time, and an
insurance premium is not cash to the employee in any form. No single bucket
expresses any of those; two axes express all of them.

The **catalogue of component types lives in `rules/`, not in code**, so adding
employer NPS, a car lease or a meal card in a later year is a reviewable
one-file data change rather than a code change — the same reasoning as ADR 0001,
one step further out.
