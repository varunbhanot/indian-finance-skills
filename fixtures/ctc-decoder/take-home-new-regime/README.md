# take-home-new-regime

A mid-range package above the rebate threshold, reported on both bases.
Employee provident fund on the full basic; no professional tax typed, so it
appears in `excludes` rather than in the breakdown.

Named for the new regime, which is what it was built to exercise (issue #9);
spec #11 now reports the old regime alongside it on the same input, same as
every other take-home fixture. `take-home-old-regime` is the identical
package under its own name, with the old regime's own cross-check recorded
there instead of repeated here.

The package is built so that **recurring cash on the zero basis is exactly
₹24,00,000** — the salary the Income Tax Department's own engine was run on —
so this fixture asserts the Department's figures directly rather than by
analogy.

## External cross-check

Checked against the **Income Tax Department's own calculation engine**
(`https://static.incometax.gov.in/iec/foservices/assets/js/tax-calc/itdcalc.js`,
the script the Department's calculator loads at runtime), retrieved and executed
unmodified on **2026-09-05**. See `docs/research/fy2026-27-new-regime-take-home.md`
§8 for how it was driven, and for the caveat that it was called directly rather
than through the web form, this environment having no browser.

| gross salary ₹24,00,000 | Department's engine | this fixture |
|---|---|---|
| total income | ₹23,25,000 | ₹23,25,000 |
| tax at the slabs | ₹2,81,250 | ₹2,81,250 |
| rebate | ₹0 | ₹0 |
| cess at 4% | ₹11,250 | ₹11,250 |
| **tax payable** | **₹2,92,500** | **₹2,92,500** |

**What is not cross-checked, and is therefore asserted on other grounds:**

- The **variable-pay-at-target** basis (gross ₹27,00,000) was not run through
  the engine. It is checked by hand against the section 202(1) table and by an
  independent floating-point recomputation of every figure in `expected.json`.
- **Employee provident fund** rests on two figures the research could not source
  to the instruments that fix them — see `pf-statutory-ceiling`'s README and
  `docs/research/…` §9. The `note` on each of those rules keys travels into
  `expected.json` beside the figure.
- The Department's engine truncates intermediates with `parseInt` and does not
  apply the section 516 ₹10 rounding, so it is not a valid check on a salary
  whose tax is not already a multiple of ₹10 — see `rounding-boundary`.
