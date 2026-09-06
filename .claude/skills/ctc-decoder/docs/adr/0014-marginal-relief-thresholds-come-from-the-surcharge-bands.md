# Marginal relief measures from the surcharge bands, not from a second table

CLAUDE.md says every threshold lives in `rules/`. The Finance Act, 2026 states
the marginal-relief thresholds twice over: section 3(5)'s Table for the new
regime, and First Schedule Part I-B Paragraph F's Table 2 for the old one, each
a column of amounts the relief is measured from. `rules/fy2026-27.yaml` encodes
**neither**. `income_tax.marginal_relief.<regime>` carries the rule statement,
the source and the section reference, and no numbers at all; the core reads the
threshold off the `above` figure of the surcharge band the total income fell in.

This is a deliberate narrowing of "every threshold lives in `rules/`", and it
rests on a fact that was checked rather than assumed: **for FY 2026-27 the two
relief tables' column C amounts are exactly the surcharge bands' own lower
bounds, row for row, in both regimes** — new regime 50/100/200 lakh against bands
above 50/100/200 lakh, old regime 50/100/200/500 lakh against bands above
50/100/200/500 lakh, nothing missing from either side and nothing extra. That
check is recorded in `docs/research/fy2026-27-new-regime-take-home.md` §11.3 and
in a comment on the rules key itself.

The reason to prefer the derivation is that the two are not independent facts
that happen to agree. A relief threshold *is* a surcharge threshold: the relief
exists to smooth the step the band creates, so a column C amount with no band
beginning at it would relieve nothing, and a band with no column C amount would
be a cliff the Act forgot. Encoding them twice would let the file express a state
the statute cannot mean, and put the core in the position of deciding which copy
wins.

## Consequences

The honest cost: the guarantee for these thresholds is now "an author checked the
two tables against each other on the retrieval date", not "the file states it",
and a year in which they diverge would pass silently. That year needs its own
`thresholds` under `income_tax.marginal_relief.<regime>` and a core that reads
them, which is a small change and is named in the rules file's own comment so
that whoever re-sources the Finance Act meets it.

Nothing else in `rules/` may follow this pattern without its own ADR. It is
available here because one number is *definitionally* the other, and not merely
because two numbers were equal when someone looked.

## Considered options

**Encode column C and D per regime under `income_tax.marginal_relief`.** The
literal reading of CLAUDE.md, and what the file would say if the Act's two tables
were independent. Rejected for the reason above, and for a second one: selecting
the relief row then means matching the total income against a *second* interval
table, so the code carries two band walks that must agree, and a mismatch between
them is a silent wrong answer rather than a loud one.

**Encode them and assert they match the bands at load time.** Keeps the file
authoritative and catches divergence loudly. Rejected as the wrong place for the
check: the rules loader validates shape and provenance (ADR 0001), and giving it
a rule about what two particular income-tax keys must mean puts domain knowledge
in the schema. A future year that genuinely diverges would also have to defeat
its own loader to be expressible.
