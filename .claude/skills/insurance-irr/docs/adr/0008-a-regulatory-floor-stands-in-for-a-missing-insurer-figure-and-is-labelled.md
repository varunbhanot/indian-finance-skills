# A regulatory floor stands in for a missing insurer figure, and is labelled

The PRD asks the skill to approximate an unknown surrender value from
"regulatory minimum GSV rules". The IRDAI (Insurance Products) Regulations,
2024 state a guaranteed surrender value floor as a percentage of premiums paid
by policy year, and a paid-up sum assured floor of
`(premiums paid ÷ premiums payable) × sum assured`. The surrender value
actually payable is the higher of that floor and a special surrender value the
Master Circular on Life Insurance Products (June 2024) defines as a present
value at a discount rate tied to the 10-year G-Sec yield — which the core
cannot compute, since a G-Sec yield is neither statutory nor stable.

We decided the floors are a `rules/` group sourced to the regulation, and:

- When the user has no insurer figure, the core computes the floor and emits
  it with `basis: "regulatory-floor"` and the reason the real figure is likely
  higher (the special surrender value the tool cannot compute).
- When the user has the insurer's figure, it is used with
  `basis: "insurer-quoted"`, and the floor is emitted beside it, so a quote
  below the floor surfaces as the classification `below-regulatory-floor`.
- For the policy years the regulation leaves to a "smooth progression" the
  insurer defines, the core emits `null` with `basis: "insurer-defined"`. It
  never interpolates: inventing a percentage would be the model recalling a
  rate.

This is the CTC decoder's PF-wage-base pattern: the file says what the rule
implies, the user says what is true, and the two are allowed to disagree.

## Considered options

- **Insurer's figure only, or no in-force rows.** Honest but leaves the persona
  with nothing until they have a quote, which is precisely when they came
  asking.
- **Floor always, quote optional.** Would let a below-floor quote go unnoticed.

## Consequences

A fixture with a pinned `rules/` directory shows the percentages are data, not
code. The special surrender value is named in the output as the thing not
computed, never estimated.
