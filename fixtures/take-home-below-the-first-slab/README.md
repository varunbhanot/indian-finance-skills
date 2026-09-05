# take-home-below-the-first-slab

The same letter as `pf-base-ceiling-from-basic-and-dearness` — an Indian BPM
annexure with a basic below the provident fund ceiling, a fixed dearness
allowance beside it and a residual basket — with `pf_wage_base` typed, so it
carries take-home as well as the wage-base reading (issue #39).

Every other take-home fixture sits above the exemption and pays tax. This one
does not, and that is what it is for. Three things only it asserts:

1. **Employee provident fund on a wage base that includes dearness allowance.**
   The base is basic plus dearness (₹13,900 + ₹1,100 = ₹15,000 a month), which
   is what section 6 computes on. That wage base shipped with issue #42 and no
   take-home fixture exercised it: `employee_pf.wage_components` here names both
   lines, and the contribution is 12% of both.
2. **Income tax nil under both regimes**, before any rebate rather than after
   one. The slab walk runs and every band charges ₹0, which is a different path
   from `take-home-new-regime-rebate`, where the slabs charge ₹57,500 and the
   rebate takes it back off.
3. **A ceiling chosen that does not bite.** `statutory_ceiling` is typed and the
   base is *exactly* at the ceiling, so `ceiling.applied` is `false`: chosen and
   not binding is a different fact from chosen and binding (`pf-statutory-ceiling`
   is the other one). It also means the two bases give the same wage, so
   `employer_pf.implies` names both and the `pf-wage-base-disagreement` flag of
   issue #43 correctly stays silent — a typed base cannot contradict a letter
   whose figure fits either.

## How the expected values were derived

Hand-derived from the statute and the rules file, before the decoder was run.

**Recurring cash** — only the cash-now recurring lines: (₹13,900 + ₹1,100 +
₹7,443) × 12 = **₹2,69,316** a year, ₹22,443 a month. The employer's ₹1,800 and
the ₹722 gratuity provision are retirals and are outside it.

**Employee provident fund** — the wage base is basic plus dearness allowance,
₹1,66,800 + ₹13,200 = **₹1,80,000** a year. The ceiling is ₹15,000 a month, so
₹1,80,000 a year: the base is at it, not above it, so nothing is capped. 12% of
₹1,80,000 = **₹21,600** a year, ₹1,800 a month.

**Income tax** — nil both ways, and it takes the standard deduction and the
statutory rounding to see why:

| | new regime | old regime |
|---|---|---|
| salary | ₹2,69,316 | ₹2,69,316 |
| standard deduction | ₹75,000 | ₹50,000 |
| total income before rounding | ₹1,94,316 | ₹2,19,316 |
| to the nearest ₹10 | **₹1,94,320** | **₹2,19,320** |
| first band charging nothing | up to ₹4,00,000 | up to ₹2,50,000 |
| tax at the slabs | ₹0 | ₹0 |
| rebate | applied, ₹0 | applied, ₹0 |
| cess | ₹0 | ₹0 |
| **tax payable** | **₹0** | **₹0** |

The rebate is `applied: true` with an amount of ₹0 in both, which is worth
saying out loud: the rule is that total income is inside the threshold
(₹12,00,000 new, ₹5,00,000 old), and both are, comfortably. There is simply no
tax for it to take off. That is not the same as the rebate not applying.

**Take-home** — ₹2,69,316 − ₹21,600 = **₹2,47,716** a year, ₹20,643 a month, the
same on both bases because the letter quotes no variable pay.

**Break-even** — `old-regime-wins-at-zero` on both bases. The break-even
deduction is the smallest one at which the old regime's tax stops exceeding the
new regime's; here both are already ₹0 with no deduction at all, so the answer
is zero and the output names that outcome rather than printing ₹0 as though a
deduction had been found.

## External cross-check

The provident fund figures rest on the 12% rate and the ₹15,000 ceiling, which
are sourced to the Ministry of Labour and Employment's own statement rather than
to the instruments that fix them (ADR 0019); `pf-statutory-ceiling`'s README
records why, and the `note` on each rules key travels into `expected.json`
beside the figure.

The tax half was not run through the Income Tax Department's engine, and does
not need it: the whole claim is that a total income of ₹1,94,320 and ₹2,19,320
fall inside bands the rules file states charge nothing, which the slab tables in
`rules/fy2026-27.yaml` settle on their own words. The standard deductions and
the ₹10 rounding unit are read from the same file and shown in the table above.
