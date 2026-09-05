# pf-base-ambiguous

Basic at exactly the ceiling, where the question has no answer — and the output
says so rather than picking one (issue #31).

Basic is ₹1,80,000 a year, which is the ₹15,000 monthly ceiling over twelve
months. The ceiling caps the base rather than replacing it, so capping a base
already at the ceiling changes nothing: both wage bases give ₹1,80,000, both
give ₹21,600 at 12%, and both `matches`.

So `implies` carries **both** entries, and `bases_coincide` is `true`. Those two
fields say different things and the fixture exists to hold both:

- `implies: ["full_basic", "statutory_ceiling"]` — the letter's figure is
  consistent with either.
- `bases_coincide: true` — and it always would have been, whatever the letter
  said, because the two bases are the same wage on this package.

Without the second field a reader could take the first for a decoder that failed
to choose. It did not fail; there is nothing here to choose between, and every
figure the reading rests on is in `bases` for them to see it.

The same is true at any basic **below** the ceiling, not only at it. The fixture
sits exactly on the boundary because that is the case `bases_coincide` could get
wrong: written as "strictly below the ceiling" it would report two bases that
give one wage as though they gave two.

## External cross-check

None, and none available; see `pf-base-implies-ceiling`'s README.
