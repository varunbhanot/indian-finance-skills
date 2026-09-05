# break-even-rebate-boundary

Spec #17's fixture for a break-even that lands exactly on the old regime's
rebate cliff (total income ₹5,00,000, Income-tax Act, 2025, section 156(1)):
below that line the whole tax is rebated away and above it the rebate is lost
outright, with no marginal relief easing the crossing (unlike the new
regime's rebate). The break-even this fixture reports is the deduction that
brings the old regime's total income down to exactly that line, because the
new regime's tax on the same package is already nil.

Recurring cash is ₹6,00,000 on both bases (no variable pay): Basic ₹3,00,000,
House rent allowance ₹1,50,000, Special allowance ₹1,50,000, Employer PF
₹36,000 (12% of basic, on the `full_basic` wage base) — the same shape as
`take-home-old-regime-rebate`'s package, scaled up so the old regime's total
income at zero deduction sits comfortably above ₹5,00,000 rather than
already inside it.

## The two regimes at zero additional deduction

| | new regime | old regime |
|---|---|---|
| standard deduction | ₹75,000 | ₹50,000 |
| total income | ₹5,25,000 | ₹5,50,000 |
| tax at the slabs | ₹6,250 | ₹22,500 |
| rebate | ₹6,250 (total income ≤ ₹12,00,000) | ₹0 (total income above ₹5,00,000) |
| cess at 4% | — | ₹900 |
| **tax payable** | **₹0** | **₹23,400** |

## The break-even

`take_home.break_even` reports **₹49,996** on both bases. At that deduction,
the old regime's total income is ₹5,50,000 − ₹49,996 = ₹5,00,004, rounded
under section 516 to exactly **₹5,00,000** — the rebate threshold itself:

| old regime at the break-even | ₹ |
|---|---|
| total income (rounded) | 5,00,000 |
| tax at the slabs (0–2,50,000 @ 0%, 2,50,000–5,00,000 @ 5%) | 12,500 |
| rebate (total income ≤ ₹5,00,000, in full) | 12,500 |
| **tax payable** | **0** |

Which is exactly the new regime's ₹0 above. A deduction one rupee smaller
(₹49,995) leaves the old regime's total income rounding to ₹5,00,010 — one
rupee past the threshold, where the rebate is lost outright and tax payable
jumps to ₹1,300 — which is the cliff `break-even-old-never-wins` exists to
land a target value inside of; here the break-even sits exactly on the near
side of it instead.

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

| new regime, total income ₹5,25,000 | engine | this fixture |
|---|---|---|
| tax at the slabs | ₹6,250 | ₹6,250 |
| rebate | ₹6,250 | ₹6,250 |
| **tax payable** | **₹0** | **₹0** |

| old regime, total income ₹5,00,000 (the break-even) | engine | this fixture |
|---|---|---|
| tax at the slabs | ₹12,500 | ₹12,500 |
| rebate | ₹12,500 | ₹12,500 |
| **tax payable** | **₹0** | **₹0** |

Exact to the rupee on both — and, being exactly nil either side, this is one
of the cases unaffected by the engine's missing section 516 rounding
(`docs/research/fy2026-27-new-regime-take-home.md` §8.4): there is no cess to
round when the rebate has already cancelled the whole tax. The engine's own
rebate function was read directly too, and carries `taxbleIncome <= 500000 &&
… taxRegime=='old' → rebate = min(12500, tax)` with no marginal-relief
clause — confirming both the threshold and the cliff this fixture straddles.

**Not cross-checked:** the employee provident fund figures (see
`pf-statutory-ceiling`'s README) and the break-even search itself, which is
this repository's own arithmetic rather than a statutory figure — its
correctness is that the tax figures above agree to the rupee at the exact
deduction it reports, not a separate external source.
