# surcharge-new-regime

A package well inside the **first** surcharge band on both bases, so the
breakdown gains a `surcharge` block naming the band it fell in, and the cess is
charged on the income-tax **and** the surcharge rather than on the income-tax
alone. Marginal relief is computed and does not bite: the ceiling sits far above
what is payable, which is what `marginal_relief.applied: false` records.

Named for the new regime, which is what it was built to exercise (issue #12);
the decoder reports the old regime alongside it on the same input, and
`surcharge-old-regime` is the identical package under its own name with the old
regime's own cross-check recorded there instead of repeated here.

The package is built so that **recurring cash on the zero basis is exactly
₹60,00,000** and on the target basis exactly ₹66,00,000, so both figures go into
the Department's engine as round numbers.

## External cross-check

Checked against the **Income Tax Department's own calculation engine**
(`https://static.incometax.gov.in/iec/foservices/assets/js/tax-calc/itdcalc.js`),
retrieved and executed unmodified on **2026-09-05**; MD5
`4315734cbad59b03dccd77bc921a8618`, 198,608 bytes — byte-identical to the copy
`docs/research/fy2026-27-new-regime-take-home.md` §8 used. See §11 of that
document for how the engine was driven for surcharge, and for the caveat that it
was called directly rather than through the web form, this environment having no
browser.

**New regime, gross salary ₹60,00,000 (zero basis):**

| | Department's engine | this fixture |
|---|---|---|
| total income | ₹59,25,000 | ₹59,25,000 |
| tax at the slabs | ₹13,57,500 | ₹13,57,500 |
| surcharge at 10% | ₹1,35,750 | ₹1,35,750 |
| cess at 4% | ₹59,730 | ₹59,730 |
| **tax payable** | **₹15,52,980** | **₹15,52,980** |

**New regime, gross salary ₹66,00,000 (target basis):**

| | Department's engine | this fixture |
|---|---|---|
| total income | ₹65,25,000 | ₹65,25,000 |
| tax at the slabs | ₹15,37,500 | ₹15,37,500 |
| surcharge at 10% | ₹1,53,750 | ₹1,53,750 |
| cess at 4% | ₹67,650 | ₹67,650 |
| **tax payable** | **₹17,58,900** | **₹17,58,900** |

Both the engine's basic calculator and its advanced calculator were run and
agreed to the rupee, which is worth recording: the basic calculator implements
no marginal relief at all (see `marginal-relief`), so the two agreeing here is
itself evidence that no relief is due on these figures.

**What is not cross-checked, and is therefore asserted on other grounds:**

- **Employee provident fund** rests on two figures the research could not source
  to the instruments that fix them — see `pf-statutory-ceiling`'s README and
  `docs/research/…` §9. The `note` on each of those rules keys travels into
  `expected.json` beside the figure.
- The Department's engine truncates intermediates with `parseInt` and does not
  apply the section 516 ₹10 rounding, so it is not a valid check on a salary
  whose tax is not already a multiple of ₹10 — see `rounding-boundary`. Every
  figure in this fixture lands on a whole ten rupees before that rounding.
