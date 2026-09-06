# rounding-boundary

Both statutory rounding steps, each moving the figure, and nothing else rounded.

- **Total income** is ₹19,25,007 — not a multiple of ₹10 — and rounds **up** to
  ₹19,25,010, because its last figure is 7.
- **Tax payable** is ₹1,92,402.08 — not a whole rupee — and rounds **down** to
  ₹1,92,400, because the paise are dropped and the last figure is then 2.

Everything else keeps its paise, which is what proves no third rounding
happened: employee provident fund is ₹1,20,000.36, the cess is ₹7,400.08, and
take-home is ₹16,87,606.64 a year.

Both rounding steps come from one section of the Income-tax Act, 2025 and both
use a ₹10 unit; the rules file carries them as two entries because they are
applied at two different points.

Spec #11 adds the old regime alongside the new. Both rounding steps happen on
its side too, on their own figures, since its ₹50,000 standard deduction
(against the new regime's ₹75,000) gives a different total income before
rounding: ₹19,50,007, not a multiple of ₹10, rounding up on the same rule to
₹19,50,010. Tax payable rounds down from ₹4,13,403.12 to ₹4,13,400 — a second,
independent exercise of both statutory rounding steps.

## External cross-check

**Deliberately not cross-checked against the Income Tax Department's
calculator, and this fixture says so rather than asserting a match.** That
engine truncates intermediate figures with `parseInt` and does not apply the
section 516 rounding at all (see `docs/research/fy2026-27-new-regime-take-home.md`
§8.4), so on exactly the inputs this fixture is built to exercise it and the
statute disagree by a few rupees. Cross-checking here would be checking the
decoder against a tool that does not implement the rule under test.

What it is checked against instead:

- the verbatim text of the rounding section, quoted in §5 of that research file,
  worked through by hand for both steps above;
- an independent floating-point recomputation of every figure in
  `expected.json`, which agrees to the paise.
