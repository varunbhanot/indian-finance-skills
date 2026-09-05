# surcharge-old-regime

The identical package to `surcharge-new-regime` — same `input.json`, same
`expected.json`, since the decoder reports both regimes on one input (ADR 0007).
It exists under its own name so the **old** regime's surcharge has a fixture that
names it and a cross-check of its own, rather than a paragraph inside the new
regime's.

What it exercises that its sibling does not: the old regime's surcharge is a
different provision of the same Act. Section 3(1) of the Finance Act charges tax
at the Part I-B rates "increased by a surcharge … in the manner provided
therein", which is Part I-B's own **Paragraph F**; income chargeable under
section 202 never goes down that path, and section 3(4)(a)(ii) says so by name.
The two tables also differ where it matters at the top: Paragraph F still carries
a **37%** band above five crore rupees, and the new regime's table stops at 25%.

## External cross-check

Same engine, same retrieval, same MD5 as `surcharge-new-regime`'s README records.

**Old regime, gross salary ₹60,00,000 (zero basis):**

| | Department's engine | this fixture |
|---|---|---|
| total income | ₹59,50,000 | ₹59,50,000 |
| tax at the slabs | ₹15,97,500 | ₹15,97,500 |
| surcharge at 10% | ₹1,59,750 | ₹1,59,750 |
| cess at 4% | ₹70,290 | ₹70,290 |
| **tax payable** | **₹18,27,540** | **₹18,27,540** |

**Old regime, gross salary ₹66,00,000 (target basis):**

| | Department's engine | this fixture |
|---|---|---|
| total income | ₹65,50,000 | ₹65,50,000 |
| tax at the slabs | ₹17,77,500 | ₹17,77,500 |
| surcharge at 10% | ₹1,77,750 | ₹1,77,750 |
| cess at 4% | ₹78,210 | ₹78,210 |
| **tax payable** | **₹20,33,460** | **₹20,33,460** |

The old regime's total income differs from the new regime's on the same salary
because the standard deduction does: ₹50,000 against ₹75,000.

**One divergence the engine has, which this fixture does not reach.** Above five
crore rupees the engine applies **25%** under the old regime, not the 37% that
Paragraph F Table 1 Sl. No. 1(iv) states — its `SurChargeCalculation` takes the
25% branch for any assessment year from 2024 onward under `taxRegime == 'old'`.
The rules file follows the Paragraph and carries 37%; the `note` on
`groups.income_tax.old_regime.surcharge` records the divergence, and
`docs/research/…` §11.4 quotes the engine's code. No fixture in this repository
reaches that band, so nothing here is asserted on the strength of either reading.
