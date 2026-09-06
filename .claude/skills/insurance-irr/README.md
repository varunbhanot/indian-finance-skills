# Insurance IRR

Reduces a life insurance policy — endowment, money-back, guaranteed-income,
whole life, unit-linked or participating — to the rate it actually returns,
what that rate is worth after inflation, and what the same premiums do in a
comparison column; and, for a policy already in force, lays Keep, Surrender
and Paid-up side by side as three rows of terminal wealth.

## What it will do

- **Nominal IRR** of the premiums, survival benefits and maturity benefit, in
  basis points, floored — the rate the policy provably clears (ADR 0003,
  ADR 0004).
- **Real return** by the Fisher relation against an inflation figure you
  state, never one the tool chose (ADR 0005, ADR 0013).
- **Comparison columns**: the policy beside buy-term-and-invest-the-difference
  at PPF (from the rules file) and at any rate you type, every column a
  self-consistent world and the gap between columns never a figure the tool
  emits (ADR 0002, ADR 0006, ADR 0011).
- **In force**: Keep, Surrender and Paid-up as three rows per column, the
  premiums already paid stated and never counted, and the in-force IRR that
  prices continuing at the surrender value it forgoes (ADR 0007). A missing
  insurer figure is stood in for by the regulatory floor, labelled, never
  interpolated (ADR 0008).
- **Scenarios**: a `guaranteed` scenario always first, then the regulator's
  illustration scenarios, each from the insurer's own benefit illustration
  (ADR 0009).
- **Classifications**, each a comparison of two figures both in the output or
  a statutory condition with its citation — whether the real return is
  negative, whether the IRR sits below PPF, which column is largest, the three
  conditions of maturity taxability, the GST position (ADR 0010, ADR 0012,
  ADR 0015).

## Status

**Designed, not built.** The sixteen decisions under [`docs/adr/`](docs/adr/)
are the whole design, the glossary terms are in the root `CONTEXT.md` under
*Insurance*, and the primary sources for every rule it will read are in
[`docs/research/insurance-irr-statutory-sources.md`](../../../docs/research/insurance-irr-statutory-sources.md).
Spec #63 describes the build — the input, every rules group and its source,
the classifications, and the fixture suite that is its contract. Until it is
built the skill's `SKILL.md` says so and computes nothing.

## What it deliberately won't do

It never says whether to buy, keep, surrender or convert a policy: it states
what is true about the figures, names the assumptions each rests on, links the
primary source and stops (ADR 0001). It never forecasts a market return or
defaults an inflation figure — every benchmark is a rule with a source or a
figure you typed, and the output says which (ADR 0002). It never grows a fund
to derive a maturity value, never computes a tax on any column, and never
names an insurer or a product (ADR 0009, ADR 0010, ADR 0014). And it never
asks for a policy number, a name or a date of birth beyond the issue date the
taxability bands need.
