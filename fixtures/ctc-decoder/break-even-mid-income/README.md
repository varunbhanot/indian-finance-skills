# break-even-mid-income

Spec #17's ordinary case: a package where the smallest additional Chapter
VI-A/HRA deduction that brings the old regime's tax down to the new regime's
sits well clear of both the old regime's rebate cliff (total income
₹5,00,000) and any surcharge threshold, so the break-even search crosses
nothing but ordinary, continuous slab bands.

Recurring cash is ₹18,00,000 on both bases (no variable pay, so the zero and
target bases coincide): Basic ₹9,00,000, House rent allowance ₹4,50,000,
Special allowance ₹4,50,000, Employer PF ₹1,08,000 (12% of basic, on the
`full_basic` wage base).

## The two regimes at zero additional deduction

| | new regime | old regime |
|---|---|---|
| standard deduction | ₹75,000 | ₹50,000 |
| total income | ₹17,25,000 | ₹17,50,000 |
| tax at the slabs | ₹1,45,000 | ₹3,37,500 |
| rebate | ₹0 | ₹0 |
| cess at 4% | ₹5,800 | ₹13,500 |
| **tax payable** | **₹1,50,800** | **₹3,51,000** |

Without any Chapter VI-A or HRA deduction, the old regime's tax is
₹2,00,200 more than the new regime's — the gap `break_even` reports the size
of, in deduction terms rather than tax terms.

## The break-even

`take_home.break_even` reports **₹6,41,656** on both bases: the total
Chapter VI-A/HRA deduction at which the old regime's tax stops exceeding the
new regime's. At that deduction, the old regime's total income is
₹17,50,000 − ₹6,41,656 = ₹11,08,344, rounded under section 516 to
₹11,08,340:

| old regime at the break-even | ₹ |
|---|---|
| total income (rounded) | 11,08,340 |
| tax at the slabs (0–2,50,000 @ 0%, 2,50,000–5,00,000 @ 5% = 12,500, 5,00,000–10,00,000 @ 20% = 1,00,000, above 10,00,000 @ 30% on 1,08,340 = 32,502) | 1,45,002 |
| rebate | 0 (total income above ₹5,00,000) |
| cess at 4% on 1,45,002 | 5,800 (paise discarded: 5,800.08 → 5,800) |
| tax payable, before section 516's ₹10 rounding | 1,50,802 |
| **tax payable** | **1,50,800** |

Which is exactly the new regime's ₹1,50,800 above — both regimes' computed
tax agree to the rupee at this deduction, as the ticket's acceptance
criterion requires.

## External cross-check

Checked against the **Income Tax Department's own calculation engine**
(`https://static.incometax.gov.in/iec/foservices/assets/js/tax-calc/itdcalc.js`),
retrieved 2026-09-05; MD5 `4315734cbad59b03dccd77bc921a8618`, 198,608 bytes —
identical to the copy `docs/research/fy2026-27-new-regime-take-home.md` §8.5
already used. Its slab, rebate, surcharge and cess functions (`TaxIndOld`,
`TaxIndNew`, `RebateCalculation`, `SurChargeCalculation`) were called
directly, on the total income figures above, rather than through the
`calcType: "basic"` wrapper — §8.5 already found that wrapper reuses the new
regime's own deduction for its `TaxOld` output.

| new regime, total income ₹17,25,000 | engine | this fixture |
|---|---|---|
| tax at the slabs | ₹1,45,000 | ₹1,45,000 |
| rebate | ₹0 | ₹0 |
| cess at 4% | ₹5,800 | ₹5,800 |
| **tax payable** | **₹1,50,800** | **₹1,50,800** |

| old regime, total income ₹11,08,340 (the break-even) | engine | this fixture |
|---|---|---|
| tax at the slabs | ₹1,45,002 | ₹1,45,002 |
| rebate | ₹0 | ₹0 |
| cess at 4% | ₹5,800 | ₹5,800 |
| **tax payable, before rounding** | **₹1,50,802** | **₹1,50,802** |

Exact to the rupee on both. The engine has no equivalent of section 516's
₹10 rounding (`docs/research/fy2026-27-new-regime-take-home.md` §8.4) — it
truncates the cess to a whole rupee and stops there — so its own raw total
(₹1,50,802) is the figure to compare against this fixture's *pre-rounding*
`tax_payable.before`, not its rounded `tax_payable.after`; rounding
₹1,50,802 to the nearest ten by hand gives ₹1,50,800, which is what
`tax_payable.after` reports and what the new regime's own (already whole)
figure agrees with.

**Not cross-checked:** the employee provident fund figures (see
`pf-statutory-ceiling`'s README) and the break-even search itself, which is
this repository's own arithmetic rather than a statutory figure — its
correctness is that the tax figures above agree to the rupee at the exact
deduction it reports, not a separate external source.
