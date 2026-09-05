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
