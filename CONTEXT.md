# Context

The domain language of this project. Glossary only — no implementation
details, no decisions (those live in `docs/adr/`).

## Tax year

**Financial Year (FY)** — the year income is earned, 1 April to 31 March.
Written `2026-27`. All rule values are scoped to an FY.

**Assessment Year (AY)** — the year that FY's income is assessed and filed,
always FY + 1. FY 2026-27 is assessed in AY 2027-28. Rule files are named by
FY, never by AY, because the user typing numbers in is thinking about the
year they earned them.

## Income tax

**Regime** — one of the two systems a taxpayer may choose for computing
income tax: the **old regime** (lower base exemptions, wide deductions such
as 80C and HRA) or the **new regime** (higher exemptions, almost no
deductions). Not a synonym for "tax rate" or "slab": a regime is the whole
system, and each regime has its own slabs, its own standard deduction, and
its own set of permitted deductions.

**Slab** — one band in a regime's progressive rate table: an upper bound and
the rate applying to income within that band. Slabs are ordered; the final
slab has no upper bound.

<!-- Terms are added here as they are settled, not in advance. -->
