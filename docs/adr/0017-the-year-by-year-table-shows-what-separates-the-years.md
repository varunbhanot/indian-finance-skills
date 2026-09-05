# The year-by-year table shows what separates the years, and states no year it was not told about

An offer letter quotes one annual figure. Ticket #10 asks for the years behind
it, on both bases. Writing them out settled four things a later session would
otherwise decide differently.

**The table is four columns, and the rest of the package stays in `totals`.**
Guaranteed recurring cash, variable pay at its target, the one-time items in the
year they land, and each grant's vest. Retirals, benefits in kind and a grant
with no schedule to spread are outside it, and `total` is therefore the total of
those four columns and never the headline CTC. The reason is what the table is
for: it exists to show what separates one year from another, and a component
that arrives on identical terms in every year separates nothing. Writing them
into every row would restate the package in a shape that invites the reader to
mistake `total` for CTC, which is the number this whole tool exists to take
apart. Each of them is already a total of its own, named there.

The same principle draws the one line the two readings of "one-time" fall on
either side of. `totals.one_time_components` is every non-recurring component,
equity grants included, because as a *total* a grant is a one-time award. The
table's `one_time` column excludes equity, because a grant's value arrives over
the years its schedule names; counting it in year one as well would count it
twice. `landsWholeInYearOne` is that narrower predicate, and it lives beside the
totals' predicates so the difference between the two is visible in one file.

**Four years is a floor and not a window, and it lives in the core.** The table
spans `max(4, the longest schedule typed)`. Four because that is the horizon an
offer is habitually averaged over (CONTEXT.md, "Back-loaded"), so it is the
shortest table that can show what that average hides. A schedule reaching
further lengthens the table rather than being folded into the fourth year or
dropped past it: either would be the decoder rewriting a schedule the letter
states, which is what ADR 0016 refuses when it requires a schedule to account
for the whole grant.

The number itself has to answer to CLAUDE.md — *"Every rate, slab, limit,
threshold and formula lives in `rules/`"* — and to ADR 0006, which sends
authored judgement to `heuristics.yaml` with a `rationale`. It is kept in the
core anyway, and the case is narrow: this is not a figure about money. Every
value in `rules/` is a quantity the law fixes and the output carries into a
rupee figure; `MINIMUM_YEARS` fixes how many rows a table has, is scoped to no
financial year, and would not change a single rupee in any column if it moved.
What it does change is `over_years` and therefore the averages, so the claim is
not that it is inert — it is that it is a property of the report's shape rather
than of the tax year, and `rules/fy<YYYY-YY>.yaml` is keyed by exactly the thing
it does not vary with.

That argument is not airtight, and the honest alternative is on the record: a
`rules/heuristics.yaml` carrying `minimum_years: 4` with the CONTEXT.md sentence
as its `rationale` would satisfy ADR 0006 to the letter. It is not built here
because no `heuristics.yaml` and no loader for one yet exist, and ticket #10
states "Rules keys read: None new." A ticket that creates `heuristics.yaml` for
any other reason should move this constant into it and delete this paragraph.

**Two averages, and the one-time components inside the first are named.** A
one-time item is never averaged into a recurring figure (CONTEXT.md), and the
honest way to keep that rule is not to hide the item but to say where it is:
`with_one_time` is a fact about the table exactly as it stands and names the
components that arrive once, and `without_one_time` is the same average with
them out. Neither is presented as the truer one; that reading is the user's
(ADR 0007), as is the distance between year one and either average, which the
decoder does not compute.

**A cliff is carried as the months the letter states, and the sentence about it
is the skill's.** The ticket asks that a cliff "produce the statement that
nothing vests before it". The core produces the *fact* — `cliff_months`, beside
the rows it does not change — and the skill says the sentence, because
CLAUDE.md's two-layer rule puts prose in the skill layer and allows exactly one
authored sentence in the core, the equity `assumption` of ADR 0016. A cliff
statement is not that sentence: it does not describe which branch of the core
ran, it describes what a condition in the letter means for a reader who leaves
early, which is the skill's whole job.

The output does carry other sentences — `perquisite.statement` is one — and they
are not a counter-example but the rule restated. Every one of them is *read from
the rules file* and travels with the citation that sources it, so what the core
does with them is fetch and pass through, never author. The two ways a sentence
may reach the output are therefore: sourced from `rules/`, or the one authored
`assumption` ADR 0016 permits. A cliff sentence is neither — no statute states
it, so there is nothing to cite — which is what puts it in the skill. The months are repeated onto the grant's
rows in `year_by_year` rather than left on the grant's own block alone, because
the table is where a reader asks why year one is small and the answer has to be
beside the rows.

**"Recurring-only" means the one-time items taken out, and nothing else taken
out.** Ticket #10 asks for "the recurring-only average" beside the average that
includes one-time items. Equity vests are not recurring in the classification's
sense — every grant is `recurring: false` — but they do arrive in each year the
schedule names, so taking them out would leave a figure describing no year of
the table. The second average is therefore the first with the one-time
components removed and nothing else, and it is named `without_one_time` rather
than `recurring_only` so the output does not claim more than it does. The clause
the ticket is enforcing is CONTEXT.md's — a one-time component is "never
averaged into a recurring figure" — and removing exactly those components is
what enforces it.

**A grant with no vesting schedule is read by its recurring flag, not left out.**
A share purchase plan carries no schedule, and ADR 0016 refuses to invent one for
it. The first cut of this table therefore gave it no years at all — which put ₹0
in `equity_as_claimed` for every row and so asserted that the letter had claimed
nothing, the precise thing ADR 0016 says a nil valuation must never become. So a
grant reaches its years by one of three readings, named in `spread`: its typed
schedule; or, having none and being recurring, the same claim in every year; or,
having none and not being recurring, the whole of it in year one. The last two
are the recurring flag doing the ordinary job it does for every non-equity
component, and no `share` is emitted for them, because a share is a fact about a
schedule and there is none. Refusing to invent a schedule is not licence to
delete a claim.

## Consequences

`EquityReading` carries the schedule, so `Vesting` and `VestingYear` are
declared in `classification.ts` beside it rather than in `equity.ts`: the
valuation echoes the schedule back and the year-by-year reading spreads a grant
over it, and one shape for it is what keeps the two from disagreeing about what
a year is.

Each year's vest is that year's share of the whole grant, truncated
independently like every other rate the core applies, so the years of a grant
can total a few paise less than the grant. That is why the table reports each
year rather than inviting the reader to add them back up, and it is the same
reason `perMonth` gives for never multiplying a month into a year.

`year_by_year` is always present. It needs nothing the caller did not already
type, unlike `basic` (which needs the rules file to say what basic pay is) and
`take_home` (which needs a PF wage base), so there is no input under which it
could honestly be absent.
