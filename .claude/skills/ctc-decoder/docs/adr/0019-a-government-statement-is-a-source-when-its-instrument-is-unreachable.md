# A Government statement of a figure is a source when the instrument fixing it cannot be reached

Three values in the `epf` group — the employee's contribution rate, the
employer's, and the monthly wage ceiling — are sourced to the Ministry of Labour
and Employment's reply to Lok Sabha Unstarred Question No. 586 of 24 July 2023,
and not to the instruments that fix them. Section 6 of the EPF & MP Act, 1952
says the contribution is *ten* per cent; its first proviso substitutes 12 per
cent for establishments the Central Government has notified, and that
notification could not be retrieved. Section 6 carries no wage ceiling at all —
₹15,000 lives in the EPF Scheme, 1952, raised there by a 2014 notification that
could not be retrieved either. #24 was opened to close that gap and is closed
without closing it: two runs, months apart, established that `epfindia.gov.in`
and `epfo.gov.in` refuse this environment outright and that `egazette.gov.in` no
longer accepts a connection at all.

The 12 per cent is accepted on the Ministry's statement, deliberately, rather
than the group being reported as absent. A Ministry answering Parliament about
the scheme its own department administers is a primary Government document
stating what is applied — it is not a secondary copy of an instrument, and it is
not commentary. What this decoder answers is what will be deducted from a
salary, and the applied rate is the operative fact for that question; the
notification would establish the authority for the rate rather than the rate.
Reporting the group as absent would remove take-home from the decoder's output
entirely and would buy no honesty the citation does not already give, because
each of the three values carries a `note` (ADR 0013) that travels through the
citation into the JSON, so a reader is told in the output itself that the figure
rests on a statement and what the section literally says instead.

## Consequences

This is narrow, and it is not a licence to source from whatever is reachable.
All four conditions must hold together: the instrument is genuinely unreachable
rather than merely inconvenient; the statement comes from the department that
administers the instrument; the value's `note` records the divergence between
the instrument's literal text and the applied figure; and that note reaches the
output. Press coverage, aggregators, law-firm summaries and mirror sites remain
barred as a basis whether or not an instrument is reachable — nothing here
touches that.

The three `note` blocks stay in `rules/fy2026-27.yaml` permanently rather than
being provisional, and they say so, so a later session reading them does not
reopen a question that has been settled. Re-sourcing from the notifications
remains an improvement anyone with a browser may make; it is no longer
outstanding work.
