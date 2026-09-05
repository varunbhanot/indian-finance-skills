# take-home-old-regime

The identical package to `take-home-new-regime` — same components, same
amounts, same `pf_wage_base` — under its own name, so the old regime's figures
have a fixture of their own to be cross-checked and read from rather than
being read off the new regime's fixture by inference. Both regimes appear
side by side in `expected.json`, in `take_home.regimes`, as facts of the same
input (ADR 0007): neither is preferred, and the ordering carries no meaning.

The old regime's own standard deduction (₹50,000, against the new regime's
₹75,000) gives a different total income, so the two regimes' tax figures on
the same gross salary are genuinely independent computations, not one derived
from the other:

| | new regime | old regime |
|---|---|---|
| standard deduction | ₹75,000 | ₹50,000 |
| **zero basis** (gross ₹24,00,000) | | |
| total income | ₹23,25,000 | ₹23,50,000 |
| tax at the slabs | ₹2,81,250 | ₹5,17,500 |
| rebate | ₹0 | ₹0 |
| cess at 4% | ₹11,250 | ₹20,700 |
| **tax payable** | **₹2,92,500** | **₹5,38,200** |
| take-home (annual) | ₹19,63,500 | ₹17,17,800 |
| **target basis** (gross ₹27,00,000) | | |
| total income | ₹26,25,000 | ₹26,50,000 |
| tax at the slabs | ₹3,67,500 | ₹6,07,500 |
| rebate | ₹0 | ₹0 |
| cess at 4% | ₹14,700 | ₹24,300 |
| **tax payable** | **₹3,82,200** | **₹6,31,800** |
| take-home (annual) | ₹21,73,800 | ₹19,24,200 |

Employee provident fund is identical in both (₹1,44,000 a year, on the full
basic), since it does not depend on regime.

The old regime's `assumes` names "The old regime" and "Below 60 years of
age" — its slabs come from a table banded by age (see
`docs/research/fy2026-27-new-regime-take-home.md` §7.1), and only the
below-60 band is encoded. Its `excludes` carries the same five named
exclusions as the new regime, plus one more: a line stating the figure is a
**floor**, since HRA exemption and Chapter VI-A deductions are real
deductions available under the old regime that this estimate does not
compute, rather than ones the regime forbids outright as under the new
regime — computing them would only lower the tax further, never raise it.

## External cross-check

Checked against the **Income Tax Department's own calculation engine**
(`https://static.incometax.gov.in/iec/foservices/assets/js/tax-calc/itdcalc.js`),
retrieved and executed unmodified on **2026-09-05**, called directly for the
old regime (`taxRegime: 'old'`) with its own ₹50,000 standard deduction. See
`docs/research/fy2026-27-new-regime-take-home.md` §8.5 for how it was driven,
including a bug found and worked around: the engine's `calcType: "basic"`
path silently reuses the *new* regime's already-netted total income for its
`TaxOld` output rather than netting the old regime's own deduction, so §8.5
calls the old-regime functions directly instead of through that shortcut.

| gross salary ₹24,00,000 (zero basis) | Department's engine | this fixture |
|---|---|---|
| total income | ₹23,50,000 | ₹23,50,000 |
| tax at the slabs | ₹5,17,500 | ₹5,17,500 |
| rebate | ₹0 | ₹0 |
| cess at 4% | ₹20,700 | ₹20,700 |
| **tax payable** | **₹5,38,200** | **₹5,38,200** |

| gross salary ₹27,00,000 (target basis) | Department's engine | this fixture |
|---|---|---|
| total income | ₹26,50,000 | ₹26,50,000 |
| tax at the slabs | ₹6,07,500 | ₹6,07,500 |
| rebate | ₹0 | ₹0 |
| cess at 4% | ₹24,300 | ₹24,300 |
| **tax payable** | **₹6,31,800** | **₹6,31,800** |

**Not cross-checked:** the new regime (covered by `take-home-new-regime`'s own
cross-check, being the identical package) and the provident fund figures (see
`pf-statutory-ceiling`'s README).
