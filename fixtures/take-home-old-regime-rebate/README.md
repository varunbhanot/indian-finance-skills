# take-home-old-regime-rebate

The old regime's rebate, visible on one basis and not the other, out of one
small package — an early-career salary the new regime's rebate threshold
(₹12,00,000 of total income) sits nowhere near, unlike `take-home-new-regime-rebate`'s
package which was built for the new regime's threshold (₹5,00,000).

With variable pay at zero, total income is ₹4,90,000 — inside the old
regime's rebate (total income ≤ ₹5,00,000) — so the slab tax of ₹12,000 is
wiped out entirely and both the tax and the cess on it are ₹0. With variable
pay at target, total income is ₹5,90,000 — above the threshold — and the
rebate is ₹0, leaving ₹31,720 payable.

The old regime's rebate gives **no marginal relief** for total income just
above ₹5,00,000 (unlike the new regime's, which tapers above its own
threshold): crossing the line by any amount loses the whole rebate, which is
what the target basis here demonstrates.

The new regime is reported alongside, as it is for every take-home fixture;
on this small a package its own, much higher rebate threshold (₹12,00,000)
swallows both bases, so tax payable is ₹0 under the new regime on both — the
contrast this fixture exists to show is squarely the old regime's.

| | new regime | old regime |
|---|---|---|
| standard deduction | ₹75,000 | ₹50,000 |
| **zero basis** (gross ₹5,40,000) | | |
| total income | ₹4,65,000 | ₹4,90,000 |
| tax at the slabs | ₹3,250 | ₹12,000 |
| rebate | ₹3,250 | ₹12,000 |
| **tax payable** | **₹0** | **₹0** |
| **target basis** (gross ₹6,40,000) | | |
| total income | ₹5,65,000 | ₹5,90,000 |
| tax at the slabs | ₹8,250 | ₹30,500 |
| rebate | ₹8,250 | ₹0 |
| cess at 4% | — | ₹1,220 |
| **tax payable** | **₹0** | **₹31,720** |

## External cross-check

Checked against the **Income Tax Department's own calculation engine**
(`https://static.incometax.gov.in/iec/foservices/assets/js/tax-calc/itdcalc.js`),
retrieved and executed unmodified on **2026-09-05**, called directly for the
old regime with its own ₹50,000 standard deduction — see
`docs/research/fy2026-27-new-regime-take-home.md` §8.5, including the
diagnosis of a bug in the engine's ordinary `calcType: "basic"` path (it
reuses the new regime's own netted total income for its `TaxOld` output
rather than the old regime's own deduction) worked around by calling the
engine's old-regime functions directly.

| gross salary ₹5,40,000 (zero basis) | Department's engine | this fixture |
|---|---|---|
| total income | ₹4,90,000 | ₹4,90,000 |
| tax at the slabs | ₹12,000 | ₹12,000 |
| rebate | ₹12,000 | ₹12,000 |
| **tax payable** | **₹0** | **₹0** |

| gross salary ₹6,40,000 (target basis) | Department's engine | this fixture |
|---|---|---|
| total income | ₹5,90,000 | ₹5,90,000 |
| tax at the slabs | ₹30,500 | ₹30,500 |
| rebate | ₹0 | ₹0 |
| cess at 4% | ₹1,220 | ₹1,220 |
| **tax payable** | **₹31,720** | **₹31,720** |

The engine's rebate function was also read directly and carries
`taxbleIncome <= 500000 && taxRegime=='old' && … → rebate = min(12500, tax)`,
with no marginal-relief clause — matching section 156(1), and confirming the
threshold this fixture straddles.

**Not cross-checked:** the new regime side of this package (its own rebate
threshold is nowhere near either basis here, so it is not the point of this
fixture) and the provident fund figures (see `pf-statutory-ceiling`'s
README). Both are checked by hand against the statute and by independent
recomputation.
