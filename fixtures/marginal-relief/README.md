# marginal-relief

A package whose recurring cash on the **zero** basis puts total income just above
the first surcharge threshold under both regimes, so the statute's ceiling on
income-tax plus surcharge bites and most of the surcharge is given back. On the
**target** basis the same package sits far enough above the threshold that the
ceiling does not bite, so one fixture holds both outcomes side by side:
`marginal_relief.applied` is `true` on one basis and `false` on the other, with
the same four terms of the formula shown either way.

Recurring cash on the zero basis is **₹51,25,000**, which is ₹50,000 above the
new regime's threshold once its ₹75,000 standard deduction is taken, and ₹75,000
above the old regime's once its ₹50,000 one is. On the target basis it is
₹56,25,000.

## What the ceiling does

Finance Act, 2026 s.3(5) (new regime) and First Schedule Part I-B Paragraph F
Table 2 (old regime) state the same formula: the total payable as income-tax and
surcharge shall not exceed the income-tax and surcharge **at the threshold**,
plus **every rupee of total income above it**.

| new regime, zero basis | ₹ |
|---|---|
| total income | 50,50,000 |
| tax at the slabs | 10,95,000 |
| surcharge at 10%, before relief | 1,09,500 |
| tax and surcharge at the ₹50,00,000 threshold | 10,80,000 |
| income above the threshold | 50,000 |
| **ceiling** | **11,30,000** |
| relief (12,04,500 − 11,30,000) | 74,500 |
| surcharge after relief | 35,000 |
| cess at 4% on 11,30,000 | 45,200 |
| **tax payable** | **11,75,200** |

| old regime, zero basis | ₹ |
|---|---|
| total income | 50,75,000 |
| tax at the slabs | 13,35,000 |
| surcharge at 10%, before relief | 1,33,500 |
| tax and surcharge at the ₹50,00,000 threshold | 13,12,500 |
| income above the threshold | 75,000 |
| **ceiling** | **13,87,500** |
| relief (14,68,500 − 13,87,500) | 81,000 |
| surcharge after relief | 52,500 |
| cess at 4% on 13,87,500 | 55,500 |
| **tax payable** | **14,43,000** |

## The boundary comparison, and exactly how far it goes

The point of the relief is that crossing a surcharge threshold must not cost more
than it earns. It very nearly holds, and the gap is the cess:

| new regime | at the threshold | this fixture | difference |
|---|---|---|---|
| total income | 50,00,000 | 50,50,000 | +50,000 |
| tax payable **with** relief | 11,23,200 | 11,75,200 | **+52,000** |
| tax payable **without** relief | 11,23,200 | 12,52,680 | +1,29,480 |

| old regime | at the threshold | this fixture | difference |
|---|---|---|---|
| total income | 50,00,000 | 50,75,000 | +75,000 |
| tax payable **with** relief | 13,65,000 | 14,43,000 | **+78,000** |
| tax payable **without** relief | 13,65,000 | 15,27,240 | +1,62,240 |

Without the relief, ₹50,000 more salary costs ₹1,29,480 more tax and take-home
**falls by ₹79,480**. With it, the extra tax is ₹52,000 — the ₹50,000 the ceiling
allows, plus 4% cess on it — so take-home falls by ₹2,000 rather than ₹79,480.
The old regime is the same shape: ₹3,000 rather than ₹87,240.

That ₹2,000 is not a rounding artefact and not an error in this computation. The
ceiling in s.3(5) and in Paragraph F Table 2 is on "income-tax and surcharge"
only; the Health and Education Cess is imposed separately by s.3(15) on that sum,
and nothing caps it. So the statute stops take-home falling off a cliff at the
threshold, but it does not quite stop it falling: a rupee earned above the
threshold still carries the cess on its own rupee of tax. The `note` on
`groups.income_tax.marginal_relief` records this, and it travels into
`expected.json` beside the relief figure.

## External cross-check

Checked against the **Income Tax Department's own calculation engine**
(`https://static.incometax.gov.in/iec/foservices/assets/js/tax-calc/itdcalc.js`),
retrieved and executed unmodified on **2026-09-05**; MD5
`4315734cbad59b03dccd77bc921a8618`, 198,608 bytes.

**The engine's *basic* calculator is not a valid check on this fixture.** Its
`TaxInd` path calls `SurChargeCalculation` and never applies marginal relief at
all; run on these salaries it returns the "without relief" column above. Only the
engine's **advanced** calculator (`ItdCalc.AdvCalc.GetTaxCal`, whose `MNSUTX` and
`TCMNSUTX` implement the ceiling) is comparable, and it was driven with the total
income as salary income and no other head. See `docs/research/…` §11.5 for the
call shape.

| advanced calculator | surcharge | cess | total tax | this fixture |
|---|---|---|---|---|
| new, total income ₹50,50,000 | ₹35,000 | ₹45,200 | ₹11,75,200 | ₹11,75,200 |
| new, total income ₹55,50,000 | ₹1,24,500 | ₹54,780 | ₹14,24,280 | ₹14,24,280 |
| old, total income ₹50,75,000 | ₹52,500 | ₹55,500 | ₹14,43,000 | ₹14,43,000 |
| old, total income ₹55,75,000 | ₹1,48,500 | ₹65,340 | ₹16,98,840 | ₹16,98,840 |

Exact to the rupee on all four, relief and no-relief alike.

**What is not cross-checked:** employee provident fund, as in every other
take-home fixture — see `pf-statutory-ceiling`'s README and `docs/research/…` §9.
