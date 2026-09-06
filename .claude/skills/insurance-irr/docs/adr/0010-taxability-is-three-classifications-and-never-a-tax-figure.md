# Taxability is three classifications, and never a tax figure

The PRD asks for a flag "whether aggregate annual premium exceeds ₹5,00,000".
The provision — Income-tax Act, 2025, Schedule II, Table Sl. 2 — has three
independent conditions, one of which needs a figure the tool cannot see: the
aggregate premium across all the person's policies (₹5,00,000 non-linked,
₹2,50,000 linked, by policy issue date), the premium-to-sum-assured ratio
(10%, 15% for certain policies) in every year, and the unconditional exemption
of death proceeds.

We decided the core emits each condition as its own classification —
`premium-exceeds-10pc-of-sum-assured`, `aggregate-exceeds-threshold`,
`aggregate-unknown`, and `death-benefit-exempt-regardless` (emitted always, so
the flag is never read as "your family gets taxed") — with the threshold, the
ratio and the date bands sourced from the rules file. The user may type
`other_premiums_aggregate`; when present the aggregate check uses it and says
so, when absent the output carries `aggregate-unknown` beside the threshold.

The core never computes the tax. The taxable amount on a non-linked maturity
is income at slab rate, on a linked one it is capital gains, and both need the
user's whole return; netting a guessed tax into a comparison column would
flatter or punish the policy on a figure the tool did not see, and a slab
computation already belongs to the CTC decoder's core.

## Considered options

- **This policy's premium only, no typed aggregate.** Would silently pass a
  person holding three ₹2,00,000 policies.
- **Compute the tax at a typed slab rate and net it.** Rejected, as above.
