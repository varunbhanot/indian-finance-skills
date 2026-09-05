# A share purchase plan is the employee's own money

₹5,00,000 of ESPP at a 15% discount, held at ₹0 with `method` `employee-funded`:
the employee buys the shares out of pay the package already counts, so the plan
moves money rather than adding it. The discount is carried and named rather than
valued.

The one grant with no `vesting`, and the only instrument allowed none: there is
nothing to vest, and a required field would only have got `years: [10000]` typed
in to satisfy it (ADR 0016).

The claimed value stays in `headline_ctc` and `equity_as_claimed`, because that
is what the letter counted. What the plan is worth to the employee is ₹0 in
every valuation, and it reaches no cash total at all.

## Year by year

The plan carries no vesting schedule, so `spread` is `recurring` and no `share`
is emitted — there is none to state. Its ₹5,00,000 claim appears in
`equity_as_claimed` in every year all the same, against ₹0 in `equity_as_valued`.

That pairing is the fixture's second point. Refusing to invent a schedule
(ADR 0016) must not become deleting the claim: a row reading ₹0 claimed would
assert the letter counted nothing, which is false. The letter counted it, the
employee funds it, and both facts are on the page.
