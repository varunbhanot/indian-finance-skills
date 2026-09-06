# The tool analyses and cites; it never recommends an action

Skills state what is true about the numbers and link to the primary source, and
never tell the user what to do. The decoder says "basic is 30% of your fixed pay,
typical is 40-50%, and basic drives employer PF, gratuity accrual and HRA
exemption — here is the EPFO page on how PF is computed". It does not say "ask
for a higher basic".

Three reasons. The trade-offs are genuinely personal: a higher basic is worse for
someone optimising near-term cash and better for someone optimising forced
savings, and the tool knows which only if it guesses. It is honest about what the
tool has, which is an offer letter, not a life. And it is the boundary that keeps
skills 2-5 buildable — if skill 1 establishes "we tell you what to do", then the
policy IRR skill must tell someone to surrender an insurance policy and the
prepay skill must tell them to prepay, decisions with tax, liquidity and
emotional dimensions the tool cannot see. The boundary is set at the easy case so
the hard ones inherit it.

**Citation is the substitute for advice, and it makes the `source` URLs
user-facing.** Every flag and every lever in the output carries the source of the
rule that produced it, so the narration ends in real links to EPFO, the Income
Tax Department or the Finance Act rather than in an opinion. The URLs in
`rules/` (ADR 0001) therefore serve twice: provenance for maintainers, citations
for users.

## Consequences

Output gains `sources: [{ title, url }]` on flags and levers, and the
traceability eval (ADR 0003) extends to them: a claim about a rule must carry the
source of the rule it came from.

Link rot becomes a maintenance concern, since government deep links move. Groups
already carry a `retrieved` date; a link checker in CI is the obvious follow-up
and is deliberately not built yet.

The README's "what this deliberately won't do" section leads with this decision,
because a future contributor will otherwise propose recommendations as a feature.
