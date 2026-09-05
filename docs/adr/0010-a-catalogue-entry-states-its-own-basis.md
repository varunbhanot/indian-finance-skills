# A catalogue entry states its own basis: a statute, or a rationale

Every entry in the `components` catalogue carries either its own `source` — the
statute that settles its classification — or a `rationale`, the author's reason
for classifying it as it does. Never both, and never neither: an entry with no
basis is refused when the rules file is read, and the output repeats whichever
one the entry carries, so a reader can always tell law from judgement (ADR 0006).

The group still carries one `source` and `retrieved` as ADR 0001 requires, and
for this group that source is what names these components as parts of a pay
packet at all. It cannot justify where any of them sits on the two axes, and an
entry inheriting it would be exactly the failure the sourcing rule exists to
prevent: authored judgement wearing a statutory URL, and a CI check that passes
without the guarantee holding.

## Considered options

**The authored entries move to `heuristics.yaml`** (ADR 0006's home for
judgement), which would split one catalogue across two files and contradict
ADR 0004's reason for putting it in `rules/`: that adding a component type is a
change to one place.

**Every entry inherits the group source**, which is what ADR 0001 chose for slab
tables and is right there — eighteen copies of a Budget URL describe one table,
and the group source genuinely sources every value in it. It is wrong here
because this group's entries do not all come from its source: three are statutory
and ten are not.

## Consequences

This does not reopen ADR 0001. Group-level provenance remains the rule; an entry
that adds a `source` is narrowing it to a different statute, not scattering the
same URL, and `rationale` is not provenance at all — it is the admission that
there is none.
