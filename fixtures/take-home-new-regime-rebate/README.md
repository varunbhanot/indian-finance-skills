# take-home-new-regime-rebate

The rebate visible on one basis and not the other, out of one package. With
variable pay at zero the total income (₹11,75,000) is inside the rebate, so the
slab tax of ₹57,500 is wiped out entirely and both the tax and the cess on it
are ₹0. With variable pay at target the total income (₹14,75,000) is above the
threshold and the rebate is ₹0.

The zero basis is built to be **exactly ₹12,50,000** of recurring cash, the
second salary the Income Tax Department's engine was run on, so the rebate case
is asserted against the Department's own output rather than by analogy. It also
mixes monthly and annual components, which the input contract allows.

The target basis is deliberately well clear of the threshold. Between
₹12,00,000 and about ₹12,70,590 of total income the rules file's rebate carries
a marginal relief the decoder does not yet compute (issue #12), so a fixture
landing in that band would assert a figure the decoder already knows to be too
high.

## External cross-check

| gross salary ₹12,50,000 | Department's engine | this fixture |
|---|---|---|
| total income | ₹11,75,000 | ₹11,75,000 |
| tax at the slabs | ₹57,500 | ₹57,500 |
| rebate | ₹57,500 | ₹57,500 |
| **tax payable** | **₹0** | **₹0** |

Engine retrieved and run on **2026-09-05**; see
`docs/research/fy2026-27-new-regime-take-home.md` §8.3. Its rebate function was
also read directly and carries `rebate = 60000; if (rebate > tax) rebate = tax;`
for `taxbleIncome <= 1200000`, which is the rule this fixture exercises.

**Not cross-checked:** the variable-pay-at-target basis, and the provident fund
figures (see `pf-statutory-ceiling`'s README). Both are checked by hand against
the statute and by independent recomputation.
