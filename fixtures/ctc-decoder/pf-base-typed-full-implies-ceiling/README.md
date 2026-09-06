# pf-base-typed-full-implies-ceiling

The inverse of `pf-statutory-ceiling`, and the second half of what issue #43
asked for: there the caller types `statutory_ceiling` and the letter's own
employer contribution implies `full_basic`; here they type `full_basic` and the
letter implies the ceiling. Both raise `pf-wage-base-disagreement`, which is the
point of the pair — the flag is about the two answers differing, not about one
of them in particular.

Deliberately the **same package as `take-home-new-regime`**, changing only the
employer provident fund line, so the comparison is the fixture:

| | employer PF on the letter | `implies` | typed `pf_wage_base` | flag |
|---|---|---|---|---|
| `take-home-new-regime` | ₹1,44,000 | `full_basic` | `full_basic` | none |
| this fixture | ₹21,600 | `statutory_ceiling` | `full_basic` | `pf-wage-base-disagreement` |

`take_home` is byte-identical to `take-home-new-regime`'s, and that is a claim
worth making rather than an accident: the employer's contribution is a retiral,
so it is not recurring cash-now and never enters the take-home computation. The
flag says the typed base is contradicted by the letter; it does not change what
the typed base is applied to. The user holds the letter, and one line read back
out of it does not overrule them (ADR 0007).

## How the expected values were derived

Hand-derived from `take-home-new-regime`'s own golden, changing only what the
₹1,22,400 drop in the employer contribution provably changes. Every figure was
computed before the decoder was run:

| | `take-home-new-regime` | this fixture | |
|---|---|---|---|
| employer PF | ₹1,44,000 | **₹21,600** | 12% of the ₹15,000 monthly ceiling over twelve months |
| `headline_ctc` | ₹31,01,720 | **₹29,79,320** | 12,00,000 + 6,00,000 + 6,00,000 + 21,600 + 57,720 + 3,00,000 + 2,00,000 |
| `fixed_pay` | ₹28,01,720 | **₹26,79,320** | the headline less the ₹3,00,000 of variable pay |
| `retirals` | ₹2,01,720 | **₹79,320** | ₹21,600 employer PF + ₹57,720 gratuity |
| `basic.share_of_fixed_pay` | 42.83% | **44.78%** | ⌊12,00,000 × 10000 ÷ 26,79,320⌋ = 4478 basis points |

Everything else is unchanged, and each for a stated reason:

- **`take_home`** — the employer's contribution is not cash now, so it is
  outside the steady-state recurring cash every take-home figure is built from.
  Its income-tax half is cross-checked against the Income Tax Department's own
  engine in `take-home-new-regime`'s README, and that check carries over
  unaltered because the computation is the same one on the same figures.
- **`year_by_year`** — its columns are recurring cash, variable pay, one-time
  components and equity. A retiral is none of those.
- **`sources`** — the same documents are cited, by the same values.

The share of fixed pay stays inside the authored 40–50% band, so no
`basic-share` flag fires on either side of the pair; variable pay rises from
9.67% to 10.07% of the headline, still under the 20% threshold. The one flag
that appears is the one this fixture is for.

## External cross-check

The income-tax half is `take-home-new-regime`'s, cross-checked there against the
Department's engine. The provident fund half is not cross-checkable against any
calculator, for the reason `pf-statutory-ceiling`'s README records: the 12% rate
and the ₹15,000 ceiling rest on the Ministry of Labour and Employment's own
statement rather than on the instruments that fix them (ADR 0019). The `note` on
each of those rules keys travels into `expected.json` beside the figure.
