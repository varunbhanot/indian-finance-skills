# break-even-old-never-wins

Spec #17's third named outcome: no deduction level makes the old regime's
tax equal the new regime's, because the old regime's tax passes straight over
the new regime's figure without ever landing on it. `take_home.break_even`
reports the explicit `"old-regime-never-wins"` outcome on both bases rather
than a number.

## Why this needs its own rules file

The gap the old regime's tax jumps over exists only at its rebate cliff
(Income-tax Act, 2025, section 156(1), total income ₹5,00,000): one rupee
below it the whole tax is rebated to nil, and one rupee above it the rebate
is lost outright, with no marginal relief between the two — see
`break-even-rebate-boundary`'s README for the same cliff landed on exactly
rather than jumped over. The size of that gap is fixed by the old regime's
own slabs (5% of the ₹2,50,000–₹5,00,000 band, plus cess — ₹13,000 under the
real rules/fy2026-27.yaml figures, confirmed there), and it never moves,
because the old regime's threshold and rate there are what they are. The new
regime's own tax, on the same salary the old regime's is computed from, can
never land inside that gap under the **real** rules file: its own rebate
(section 156(2)–(3), total income ₹12,00,000) is the same kind of cliff, and
above it the new regime's tax starts at several times the old regime's
₹13,000 gap and only grows from there — so a value the old regime's tax
skips is never one the new regime actually produces, for any salary, under
the real slabs. Showing the "never wins" outcome at all therefore needs an
invented new regime, which is what `rules/fy2026-27.yaml` in this fixture's
own directory is for (ADR 0009): its old regime is the real one, copied
unchanged, and its new regime is invented — small, flat slabs designed to
land a specific tax figure inside the old regime's real gap. Neither
`break-even-mid-income` nor `break-even-rebate-boundary` needs this, and uses
the repository's own rules file instead.

## The fixture

A single ₹10,00,000 basic, `pf_wage_base: full_basic`. Under this fixture's
own rules:

| | new regime (invented) | old regime (real) |
|---|---|---|
| standard deduction | ₹0 | ₹50,000 |
| total income | ₹10,00,000 | ₹9,50,000 |
| tax at the slabs | ₹5,000 (5% of the ₹9,00,000–₹10,00,000 band; nil below it) | ₹1,02,500 |
| rebate | ₹0 (threshold set to ₹0, so it never fires) | ₹0 (total income above ₹5,00,000) |
| cess at 4% | ₹200 | ₹4,100 |
| **tax payable** | **₹5,200** | **₹1,06,600** |

## The gap the search finds

Scanning the old regime's tax as the deduction grows, holding everything else
fixed:

| deduction | old total income (rounded) | old tax payable |
|---|---|---|
| ₹4,49,976 | ₹5,00,020 | ₹13,000 |
| ₹4,49,996 | ₹5,00,000 | ₹0 |

Between those two deductions — twenty rupees apart — the old regime's tax
jumps straight from ₹13,000 to ₹0, because the rebate cliff at total income
₹5,00,000 falls between them. The new regime's tax, ₹5,200, sits inside that
jump: no deduction produces it, since the old regime's tax is ₹13,000 or more
right up to the cliff and exactly ₹0 from it onward. `smallestAtOrBelow` in
`src/core/ctc-decoder/break-even.ts` finds ₹4,49,996 as the smallest
deduction at which the old regime's tax no longer exceeds the new regime's,
and `breakEvenDeductionFor` then checks the two for exact equality there —
₹0 against ₹5,200 — and reports the explicit outcome because they disagree,
exactly as the acceptance criterion asks.

## Independent recomputation

Brute-forced in one-rupee steps of the deduction, from ₹0 to ₹10,00,000,
calling this repository's own `incomeTaxFor` directly (not the search under
test) and recording every value the old regime's tax takes: it runs
₹1,06,600 down to ₹13,000 in steps that are never more than ₹1,000 apart,
carries no value between ₹0 and ₹13,000 at all, and never equals ₹5,200 at
any of the 10,00,000 deductions tried. This is not a statutory figure to
check against the Income Tax Department's engine — this fixture's new regime
is invented, not the Act's — so the independent check here is exhaustive
search rather than an external source, and it is what confirms the "never
wins" outcome is correct rather than a search that gave up early.
