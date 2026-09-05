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

**Four years is a floor and not a window.** The table spans
`max(4, the longest schedule typed)`. Four because that is the horizon an offer
is habitually averaged over (CONTEXT.md, "Back-loaded"), so it is the shortest
table that can show what that average hides. A schedule reaching further
lengthens the table rather than being folded into the fourth year or dropped
past it: either would be the decoder rewriting a schedule the letter states,
which is what ADR 0016 refuses when it requires a schedule to account for the
whole grant.

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
early, which is the skill's whole job. The months are repeated onto the grant's
rows in `year_by_year` rather than left on the grant's own block alone, because
the table is where a reader asks why year one is small and the answer has to be
beside the rows.

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
