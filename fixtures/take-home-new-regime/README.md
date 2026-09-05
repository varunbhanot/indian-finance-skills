# take-home-new-regime

A mid-range package above the rebate threshold, reported on both bases. Employee
provident fund on the full basic; no professional tax typed, so it appears in
`excludes` rather than in the breakdown.

## External cross-check

Checked against the **Income Tax Department's own calculation engine**
(`https://static.incometax.gov.in/iec/foservices/assets/js/tax-calc/itdcalc.js`,
the script the Department's calculator loads at runtime), retrieved and executed
unmodified on **2026-09-05**. See `docs/research/fy2026-27-new-regime-take-home.md`
§8 for how it was driven and the caveat that it was called directly rather than
through the web form.

The engine was run on the two salaries in §8.2 and §8.3 of that file rather than
on this fixture's own gross, so the decoder was run on the same two salaries to
compare like with like:

| gross salary | Department's engine | this decoder |
|---|---|---|
| ₹24,00,000 | total income ₹23,25,000, slab tax ₹2,81,250, cess ₹11,250, **tax ₹2,92,500** | **₹2,92,500** |
| ₹12,50,000 | total income ₹11,75,000, slab tax ₹57,500, rebate ₹57,500, **tax ₹0** | **₹0** |

Both agree exactly. This fixture's own figures (gross ₹22,50,000 and
₹25,50,000) were **not** run through the Department's engine; they are checked
by hand against the section 202(1) table, and by an independent floating-point
recomputation of every figure in this directory.

The Department's engine truncates intermediate figures with `parseInt` and does
**not** apply the section 516 ₹10 rounding, so it is not a valid check on a
salary whose tax is not already a multiple of ₹10 — see `rounding-boundary`,
which is deliberately not cross-checked against it.
