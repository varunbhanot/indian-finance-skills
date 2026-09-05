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

## How the expected values were derived

**The `employer_pf` block is hand-derived**, and the table above is the working:
₹1,80,000 is ₹15,000 × 12, and 12% of it is ₹21,600; 12% of ₹18,00,000 is
₹2,16,000. Both figures were computed by hand before the decoder was run, and
the run was checked against them. Every other figure in `expected.json` is the
same package the other take-home fixtures assert and is derived as they are.

There is no external calculator to check the provident fund half against, and
nothing here that one would settle: the 12% rate and the ₹15,000 ceiling come
from the Ministry of Labour and Employment's statement to the Lok Sabha rather
than from the instruments that fix them. See `pf-statutory-ceiling`'s README and
`docs/research/fy2026-27-new-regime-take-home.md` §9. The `note` on each rules
key travels into `expected.json` beside the figure.
