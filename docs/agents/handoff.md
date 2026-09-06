# Handoff: insurance-irr, design complete

Written 2026-09-06 at the end of a `/grill-with-docs` session over the
"Insurance Real IRR & Surrender Evaluator" PRD. The skill is **designed and
not built**. Nothing under `src/` changed.

## What exists

- `.claude/skills/insurance-irr/docs/adr/0001` … `0016` — the whole design,
  one decision each, numbered from 0001 independently of the CTC decoder's
  ADRs. `docs/agents/domain.md` and `CLAUDE.md` now say ADRs are per skill.
- `CONTEXT.md` § Insurance — nineteen glossary terms (policy year, PPT, PT,
  survival benefit, maturity benefit, benchmark, nominal IRR, real return,
  comparison column, BTID, in-force policy, surrender value, paid-up,
  in-force IRR, GSV, basis, scenario, benefit illustration, maturity
  taxability, classification).
- `docs/research/insurance-irr-statutory-sources.md` — the primary sources
  for every rules group the tickets add, with PRIMARY / LEAD marked. LEAD items
  (egazette, CBIC, DEA, India Code blocked the sandbox) must be verified
  against the primary before pinning.
- `.claude/skills/insurance-irr/SKILL.md` and `README.md` — placeholders that
  say the skill is unbuilt and compute nothing; they exist so
  `test/skills-are-this-projects-own.test.ts` passes. Ticket 9/9 replaces them.
- Root `README.md` has the skill's row, status "Designed, not built".

## The spec

Issue **#63**, `ready-for-agent`, written by `/to-spec` from this session:
problem, solution, 44 user stories, the implementation decisions (input
shape, every rules group and its source, the classification codes, the
rejections), the testing decisions (one seam — the CLI — and the full fixture
list), and what is out of scope.

Issues #53–#61 were nine tickets cut prematurely in this session before the
spec existed; they are closed as not planned and should not be reopened.

## The tickets

Eleven, cut from #63 by `/to-tickets`, each naming its rules keys and
fixtures per CLAUDE.md § Tickets:

| # | Ticket | Blocked by |
|---|---|---|
| #64 | Lift the shared core seams beside the arithmetic | — |
| #65 | The CLI seam, the input, and every rejection | #64 |
| #66 | The solver — nominal IRR, real return, inflation target | #65, #64 |
| #67 | GST on the premium | #66 |
| #68 | Maturity taxability as three separate conditions | #66 |
| #69 | Surrender and paid-up figures, each with its basis | #66 |
| #70 | Comparison columns and PPF | #67 |
| #71 | Scenarios side by side | #70 |
| #72 | Keep, Surrender and Paid-up as three rows | #71, #69 |
| #73 | Largest terminal figure, sources list, output invariants | #72, #68 |
| #74 | The skill layer, the README row, the recorded transcript | #73 |

The graph branches after #66 into three strands — #67→#70→#71, #68, and
#69 — converging at #72 and #73.

Four departures from the spec's own nine-step build order, all agreed in
session:

- **#64 is new**, a prefactor the spec does not name. `sourcesIn` is
  skill-agnostic but lives under `ctc-decoder/`; the error report is already
  generic but its class is not shared; and `divideWithRemainder` throws on a
  negative dividend, which the solver hits in year one because premiums leave
  before benefits arrive. `perMonth` already shows the sign-split pattern.
- **A 37th fixture**, `accepts-a-policy`, in #65: the spec's list gives that
  ticket only rejections, so nothing would prove a good policy is accepted.
- **The classification shape lands in #66, not #73.** The solver emits the
  first classifications, so it must define the array; #73 is correspondingly
  smaller than the spec's step 8 reads.
- **In-force split in two** (#69, #72). The spec has it as one step; six
  fixtures, a rules group, three row types and a new IRR variant is more than
  one context window.

Then one ticket per context window; `/clear` between; restart the working
branch from `origin/main` first (CLAUDE.md § Every session starts from
`main`).

## The decisions in one breath

Figures and a classification, never a verdict (0001). A benchmark is a rule
with a source or a figure the user typed — the skill may search to propose,
never to decide (0002, 0013). Annual flows on the policy-year clock (0003);
IRR by bisection in bp, floored, negative allowed, `null` past 100% (0004);
real return is Fisher only (0005). Comparison columns are self-consistent
worlds and the gap is never emitted (0006). In-force rows exclude sunk
premiums and price continuing at the surrender value (0007); a regulatory
floor stands in for a missing insurer figure, labelled, never interpolated
(0008). Non-guaranteed benefits are typed per scenario, `guaranteed` first
(0009). Taxability is three classifications, never a tax figure (0010); no
column carries a computed tax, PPF held flat and ceiling-flagged (0011). GST
is a nil rate the core applies and cites (0012). No insurer or product is
named anywhere (0014). Classifications are comparisons or statute; no
heuristic exists (0015). Two clocks — evaluation FY and issue date — and
refuse only what cannot be computed (0016).

## What the PRD asked for that the design refuses

A verdict banner, a Keep/Surrender/Paid-Up recommendation, actionable next
steps (0001); a default equity CAGR and a default inflation rate (0002, 0013);
GST at 4.5% / 2.25% (repealed 22 Sep 2025 — 0012); a term premium at 10% of
the policy premium (0002); netting LTCG on the equity column (0011); brand
names as triggers (0014); Python (CLAUDE.md). Each refusal is in the ADR named.

## Open, and deliberately so

- Monthly / quarterly premium mode: ADR 0003 leaves it to a later ticket.
- A `heuristic` classification ("IRR more than N bp below PPF"): ADR 0015
  leaves it additive.
- Q3 FY 2026-27 PPF rate: the DEA memorandum is due ~30 Sep 2026; the rules
  group's `current` marker is what a ticket then moves.
