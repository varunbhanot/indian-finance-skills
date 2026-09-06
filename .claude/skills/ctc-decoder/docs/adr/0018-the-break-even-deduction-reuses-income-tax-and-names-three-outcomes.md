# The break-even deduction reuses `incomeTaxFor` at a reduced salary, and names three outcomes

Ticket #17 asks for the total Chapter VI-A and HRA deduction at which the old
regime's tax on an offer equals the new regime's. Building it settled two
things a later session would otherwise decide differently.

**No second arithmetic path.** Chapter VI-A and HRA deductions reduce total
income the same way the standard deduction already does: they come off the
salary before the slabs are walked. `incomeTaxFor(salaryPaise, …)` already
computes `totalIncome = salaryPaise − standardDeduction`, capped so total
income never goes negative (`atMost(standardDeductionAmount, salaryPaise)`,
already in `income-tax.ts` for a different reason — the standard deduction
itself must never exceed the salary it is deducted from). Calling it with
`salaryPaise − deduction` in place of the salary therefore computes exactly
"total income after this much Chapter VI-A/HRA deduction", with no change to
`income-tax.ts` at all: the existing cap carries a deduction large enough to
exhaust the salary to a total income of zero rather than a negative one, the
same way it already carries an oversized standard deduction. `break-even.ts`
is the whole of the new arithmetic, and it is a search over calls to the
existing function, not a parallel computation of total income, slabs, rebate
or cess.

**Three outcomes, not a number that is sometimes zero.** The old regime's tax
is non-increasing in the deduction, so a binary search for the smallest
deduction at which it no longer exceeds the new regime's always terminates —
the whole salary deducted away drives it to zero, which cannot exceed a
non-negative new-regime tax. But "smallest deduction found" and "the two
regimes' tax are equal there" are different facts, and conflating them would
misreport two real cases:

- the search lands at zero deduction — the old regime's tax was already at or
  below the new regime's without any Chapter VI-A or HRA deduction at all, so
  there is no positive threshold to report;
- the search lands above zero, but the two regimes' tax are not equal there —
  the old regime's tax skipped straight past the new regime's figure rather
  than passing through it. The old regime's rebate is a cliff, not a taper
  (Income-tax Act, 2025, section 156(1): one rupee either side of total income
  ₹5,00,000 loses the whole rebate rather than a sliver of it), and that cliff
  can make its tax drop by more in one rupee of deduction than the new
  regime's figure sits inside — see `fixtures/break-even-old-never-wins`.

So `breakEvenDeductionFor` reports one of three outcomes rather than a `Money`
that is sometimes a coincidental zero: `"deduction"` with the amount, only
when the two regimes' tax verifiably agree there; `"old-regime-wins-at-zero"`
for the first case; `"old-regime-never-wins"` for the second. The acceptance
criterion — "at the reported break-even, both regimes' computed tax are equal
to the rupee" — is a property of the `"deduction"` outcome alone, checked
before it is returned rather than assumed from the search having terminated.

**Exercising the skip needs an invented new regime.** Real inputs, and the
new tax alongside it, do not produce the third outcome: this file's own new
regime has a rebate cliff of its own (total income ₹12,00,000), and above it
its tax starts well clear of the old regime's cliff-gap and only grows —
there is no salary at which the new regime's real tax lands inside the old
regime's real gap. `fixtures/break-even-old-never-wins` pins its own rules
directory (ADR 0009) with the real old regime, unchanged, and an invented new
regime engineered to land a tax figure inside that gap; its README records
why the Income Tax Department's engine cannot check that fixture (it
implements the real statute, not this fixture's invented one) and what stands
in for it instead — an exhaustive brute-force scan of the old regime's tax
over every whole-rupee deduction.

## Consequences

`break-even.ts` needs nothing from `income-tax.ts` beyond what `take-home.ts`
already calls, and a change to either regime's slabs, rebate or standard
deduction is read by the break-even search automatically, with no key of its
own to keep in step. The cost is the third fixture: showing the "never wins"
outcome at all costs a rules directory that is not statutory fact, and a
reader of that fixture has to be told, in its own README, why it exists and
why the Department's engine is not the check on it.
