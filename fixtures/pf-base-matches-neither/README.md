# pf-base-matches-neither

An employer contribution that lands on neither base — reported as such, and the
decode succeeds (issue #31).

Basic is ₹18,00,000, so the two bases imply ₹2,16,000 and ₹21,600. The letter
says ₹1,20,000, which is neither. `implies` is `[]`, both `matches` are `false`,
and every figure that was compared is still in `bases` for the reader.

**This is a reading, not a validation.** The decode returns 0 and carries the
whole offer: an employer contribution that does not sit on either base is a fact
about the letter, not a reason to refuse it. Real reasons for it are ordinary —
a letter that rounds, an employer contributing above the statutory minimum, or
an annexure stating only the provident fund half of a contribution section
6A(2)(a) splits with the pension scheme, which is what `employer_rate`'s own
`note` records.

`pf_wage_base` is untyped here, as in the other three: the user still says what
is true, and this fixture is the case where the letter cannot help them.

## External cross-check

None, and none available; see `pf-base-implies-ceiling`'s README.
