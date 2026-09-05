# pf-base-implies-full-basic

The same letter as `pf-base-implies-ceiling` with one figure changed, so the
pair is the comparison: the employer contributes ₹2,16,000 instead of ₹21,600.

Basic is ₹18,00,000 either way, and 12% of the whole of it is ₹2,16,000, so
`implies` is `["full_basic"]`. Same package, same rate, same ceiling — a
different amount on one line of the letter, and the reading flips.

`bases_coincide` is `false` here too, for the same reason: basic is above the
ceiling, so a figure computed from one base could not be mistaken for the other.

## How the expected values were derived

**Hand-derived**: 12% of ₹18,00,000 is ₹2,16,000, and 12% of the ceiling
(₹15,000 × 12 = ₹1,80,000) is ₹21,600. Computed before the decoder was run.

There is no external cross-check, and none available; see `pf-base-implies-ceiling`'s README for why the two
figures this rests on are not cross-checkable.
