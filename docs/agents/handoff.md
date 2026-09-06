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

## The tickets

Nine GitHub issues, `ready-for-agent`, chained with `Blocked by:` lines. Each
names its ADRs, rules keys and fixtures, per CLAUDE.md § Tickets.

| # | Ticket | Blocked by |
|---|---|---|
| #53 | 1/9 CLI entrypoint, input schema, rejections | — |
| #54 | 2/9 IRR by bisection, Fisher real return, `inflation_target` | #53 |
| #55 | 3/9 GST nil rate applied and cited | #53 |
| #56 | 7/9 taxability classifications | #53 |
| #57 | 4/9 comparison columns, PPF from rules, typed benchmarks | #54, #55 |
| #58 | 6/9 illustration scenarios | #54 |
| #59 | 5/9 in-force rows, in-force IRR, regulatory floors | #57 |
| #60 | 8/9 classifications, sources, output invariants | #56, #57, #58, #59 |
| #61 | 9/9 SKILL.md, README status, transcript | #60 |

Start with #53. One ticket per context window; `/clear` between; restart the
working branch from `origin/main` first (CLAUDE.md § Every session starts from
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
