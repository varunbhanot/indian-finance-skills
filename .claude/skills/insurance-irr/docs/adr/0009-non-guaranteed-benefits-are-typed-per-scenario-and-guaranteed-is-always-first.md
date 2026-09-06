# Non-guaranteed benefits are typed per scenario, and `guaranteed` is always first

The PRD asks for ULIPs to be evaluated "across the 4% and 8% IRDAI scenarios".
The Master Circular on Life Insurance Products (June 2024) prescribes benefit
illustrations at those gross rates for linked plans and for non-linked plans
whose benefits are not all guaranteed in absolute amount, so participating
endowments are covered too. The illustration is a document the insurer must
give the user before sale, and it states a maturity figure per scenario.

We decided the core never grows a fund. The input carries a `scenarios` list —
each a name and its typed maturity and survival benefits, read from the
illustration under the CTC decoder's document protocol (its ADR 0011: the user
confirms every figure beside its source line). The core runs the whole
evaluation once per scenario and emits them side by side. The scenario names
the regulator prescribes live in the rules file, sourced to the circular, so
the output can say which scenarios are the regulator's and flag one that is
not (`scenario-not-regulatory`).

One scenario is always present and always first: **`guaranteed`**, holding
only the benefits the policy guarantees in absolute amount — for a
participating plan the sum assured plus any guaranteed additions, for a ULIP
whatever the contract guarantees. Its IRR is the floor the policy provably
clears, and it is the figure a sales illustration never headlines.

## Considered options

- **Guaranteed-benefit policies only; refuse the rest.** Throws away the
  products the persona is actually being pitched.
- **Model the fund** — compound premiums at the scenario's gross rate and
  deduct typed charges. Reproduces the insurer's arithmetic only if every
  charge is typed correctly, and is share-price growth modelling by another
  name.
