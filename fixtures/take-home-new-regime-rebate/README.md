# take-home-new-regime-rebate

The rebate visible on one basis and not the other, from one package: with
variable pay at zero the total income (₹10,65,000) is inside the rebate, so the
slab tax of ₹46,500 is wiped out entirely and both the tax and the cess on it
are ₹0. With variable pay at target the total income (₹13,65,000) is above the
threshold and the rebate is ₹0.

The target basis is deliberately well clear of the threshold. Between
₹12,00,000 and about ₹12,70,590 of total income the rules file's rebate carries
a marginal relief the decoder does not yet compute (it is `excludes`d by name),
so a fixture landing in that band would assert a figure the decoder knows to be
too high.

## External cross-check

**Cross-checked.** The rebate case here is the same shape as §8.3 of
`docs/research/fy2026-27-new-regime-take-home.md`: the Income Tax Department's
engine, run on gross ₹12,50,000 on **2026-09-05**, returned total income
₹11,75,000, slab tax ₹57,500, rebate ₹57,500, **tax ₹0** — and the decoder
returns ₹0 for the same input. The engine's own rebate function was also read
directly and carries `rebate = 60000; if (rebate > tax) rebate = tax;` for
`taxbleIncome <= 1200000`, which is the rule this fixture exercises.

This fixture's own gross figures were not put through the engine; they are
checked by hand against the section 202(1) table and by independent
recomputation.
