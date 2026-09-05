# pf-base-implies-ceiling

The employer's contribution as an offer letter states it — an amount, never the
policy behind it — read back into the policy (issue #31).

Basic is ₹18,00,000 a year, well above the ₹15,000-a-month statutory ceiling, so
the two wage bases give two different figures:

| wage base | wage the rate is applied to | contribution at 12% |
|---|---|---|
| `full_basic` | ₹18,00,000 | ₹2,16,000 |
| `statutory_ceiling` | ₹1,80,000 | ₹21,600 |

The letter says ₹21,600, so `implies` is `["statutory_ceiling"]` and nothing
else. `bases_coincide` is `false`: the two bases are distinguishable here, which
is what makes the single answer meaningful.

Note what the fixture does **not** do. `pf_wage_base` is not typed, so there is
no `take_home` block: the reading is available before the question is answered,
which is the whole point of it — the skill can confirm what the letter implies
instead of quizzing the user on their employer's policy. The core never chooses
the base on the user's behalf.

## External cross-check

Not cross-checked against any calculator, and there is nothing here to check
against one: the arithmetic is the 12% employer rate on ₹1,80,000, and both of
those figures come from the Ministry of Labour and Employment's statement to the
Lok Sabha rather than from the instruments that fix them. See
`pf-statutory-ceiling`'s README and `docs/research/fy2026-27-new-regime-take-home.md`
§9. The `note` on each rules key travels into `expected.json` beside the figure.
