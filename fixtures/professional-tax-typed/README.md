# professional-tax-typed

Professional tax typed as ₹2,500 a year. It appears in the deduction breakdown
on both bases, and — because it was typed — it does **not** appear in
`excludes`. Every other take-home fixture in this directory leaves it untyped
and carries the exclusion instead, which is the other half of this test.

₹2,500 is a figure the user types from their own payslip. It is not looked up:
professional tax is levied by the states, each with its own slabs, and the
rules file carries no state tables. The new regime disallows the deduction for
it in any case, so it reduces take-home without reducing taxable salary — which
is why it sits in the breakdown below the income tax rather than above it.

The monthly take-home here ends in paise (₹1,54,166.66 on the zero basis)
because a year does not divide by twelve evenly. That is truncation of the
monthly figure, not a rounding of the annual one.

## External cross-check

- The **income tax** figures are the same as `take-home-new-regime`'s and are
  covered by the cross-check recorded there.
- The **professional tax** figure is **not cross-checkable and is not asserted
  to be anyone's correct liability**: it is a typed input echoed back at the
  period it was typed for. No external source is claimed for it.
