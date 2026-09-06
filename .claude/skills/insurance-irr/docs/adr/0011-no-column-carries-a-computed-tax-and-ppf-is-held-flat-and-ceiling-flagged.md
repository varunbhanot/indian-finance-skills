# No column carries a computed tax, and PPF is held flat and ceiling-flagged

The PRD nets long-term capital gains tax from the equity column and compounds
PPF "tax-free". ADR 0010 rules that the policy column carries no computed tax;
netting tax on a benchmark column would then compare a gross policy figure
with a net alternative. We decided no column carries a computed tax, and every
column states its tax treatment in words: the policy column points at the
ADR 0010 classifications, the PPF column says "exempt" with its source, and a
typed benchmark carries the user's own assertion `net_of_tax: true | false`,
repeated beside the column. The tool neither nets nor grosses up a rate the
user asserted (ADR 0002).

The PPF column's mechanics:

- **The rate is held flat.** PPF is notified quarterly; the projection
  compounds at the rate the rules file marks as current, labelled
  `held-flat-from: <quarter>`. There is no forward curve.
- **The deposit ceiling is flagged, not enforced.** PPF takes at most
  ₹1,50,000 a year (Public Provident Fund Scheme, 2019, para 4). A column
  investing more is still computed as if it could, and carries
  `exceeds-ppf-ceiling` with the excess per year, so the reader sees the column
  is partly notional. Enforcing the ceiling would silently shrink the column
  and hide why.

## Considered options

- **Net LTCG on a typed equity column** as a one-shot sale at the policy term
  under Income-tax Act, 2025 §198. Assumes the whole exemption is free that
  year and no other gains — a guess dressed as a rule — and makes the equity
  column the only one carrying a tax figure.
- **Typed benchmarks are net-of-tax by definition.** A user pasting an index
  factsheet's CAGR would not know it is gross.
