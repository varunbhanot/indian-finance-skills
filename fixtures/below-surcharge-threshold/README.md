# below-surcharge-threshold

The negative case, and a boundary one: a package large enough to look like it
should attract a surcharge, which attracts none, because both regimes' total
income lands **at or below** the first threshold rather than above it.

`expected.json` carries **no `surcharge` key at all** under either regime on
either basis, and therefore no marginal relief either. That is the shape the
statute has: the bands are written "where the total income exceeds ₹50,00,000",
so below that there is no surcharge to report rather than a surcharge of zero,
and every figure is the one #9 and #11 already produced.

## Why this salary

Recurring cash on the zero basis is **₹50,50,000**, chosen so that the **old**
regime's total income is exactly ₹50,00,000 — sitting precisely on the threshold,
which the band's own wording excludes. The new regime, whose standard deduction is
₹25,000 larger, lands at ₹49,75,000 and is clear of it by that much.

The one-time joining bonus is what keeps the two bases apart: it is excluded from
both, so this package has no variable pay and the zero and target bases carry the
same recurring cash. Adding any variable pay would push the old regime over the
threshold and turn this into a surcharge fixture.

## External cross-check

Same engine, same retrieval, same MD5 as `surcharge-new-regime`'s README records;
both the basic and the advanced calculator were run and agreed.

| | Department's engine | this fixture |
|---|---|---|
| new, total income ₹49,75,000 — tax at the slabs | ₹10,72,500 | ₹10,72,500 |
| new — surcharge | ₹0 | none reported |
| new — cess at 4% | ₹42,900 | ₹42,900 |
| **new — tax payable** | **₹11,15,400** | **₹11,15,400** |
| old, total income ₹50,00,000 — tax at the slabs | ₹13,12,500 | ₹13,12,500 |
| old — surcharge | ₹0 | none reported |
| old — cess at 4% | ₹52,500 | ₹52,500 |
| **old — tax payable** | **₹13,65,000** | **₹13,65,000** |

The engine returns a surcharge of `0` where this decoder reports no surcharge
line; that is a difference of shape, not of figures, and it is deliberate — a
zero surcharge line would invite the reader to think a surcharge was charged and
came to nothing.

**What is not cross-checked:** employee provident fund, as in every other
take-home fixture — see `pf-statutory-ceiling`'s README and `docs/research/…` §9.

## Independent recomputation

Every figure in `expected.json` — total income, the slab walk, the rebate, the
surcharge, the marginal relief, the cess, both section 516 roundings, and the
take-home assembly on both bases of both regimes — was recomputed from the
statute in ordinary floating-point arithmetic, by a separate implementation
written against the Finance Act text rather than against the core, and agreed
throughout. That is the second independent source behind these figures; the
Department's engine above is the first.
