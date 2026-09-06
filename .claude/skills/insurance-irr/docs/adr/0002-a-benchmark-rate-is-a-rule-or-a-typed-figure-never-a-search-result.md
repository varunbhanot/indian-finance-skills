# A benchmark rate is a rule or a typed figure, never a search result

The PRD compounds the premiums a policy would free up at a "growth benchmark"
(an index CAGR of 11–12%) and a "conservative benchmark" (PPF), and the
maintainer's instinct was to let the skill web-search these because
"benchmarks keep changing". CLAUDE.md forbids the core from modelling
share-price growth and from recalling a rate, and its fixtures are
deterministic JSON in, JSON out. We decided:

- A **statutory** rate — PPF, GST, a tax threshold — comes from `rules/` with
  its primary source, scoped by financial year and by `effective_from` /
  `effective_to` where it moves within the year. It is never searched for at
  run time: a notification in the rules file is a better source than whichever
  page ranks that day, and a ticket updates it when it changes.
- Any **other** benchmark — an index return, a debt fund, a deposit rate, the
  term-cover premium in a buy-term-and-invest comparison — exists only as a
  figure the user types. The core compounds at it and the output carries it as
  `{ value, source, assumption: "user-confirmed" }`. There is no default and no
  heuristic: a "rationale" for 11% is still a forecast.
- The **skill layer may search** to *propose* such a figure and its source, but
  the figure enters the core only after the user confirms it beside the URL —
  the same protocol the CTC decoder uses for an offer letter (its ADR 0011),
  with a web page in place of the letter. A searched figure is a draft of the
  input; a rules figure is a fact; only the user turns a draft into a fact.

The PRD's non-functional requirement that the skill "must not require internet
connectivity" is narrowed to the core: the core runs offline and needs nothing
but its JSON; the skill may reach the web to draft that JSON.

## Considered options

- **Sourced rates only, no equity benchmark.** Safest, but the persona is
  being told "the market does 12%" and wants to see what that claim implies for
  their own policy; arithmetic on a premise the user states is not a forecast.
- **A heuristic default CAGR with a rationale.** Rejected: it puts a market
  forecast in a repository that has refused to make one everywhere else.
- **The skill searches and uses what it finds.** Rejected: two runs on the same
  policy would disagree, and the traceability eval rests on the user having
  seen every input figure.

## Consequences

The PRD's "10% of premium buys term cover" placeholder is never used: the user
types their actual term quote, or there is no buy-term-and-invest column. A
comparison column is always labelled with where its rate came from.
