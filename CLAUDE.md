# CLAUDE.md

Claude Code skills for Indian personal finance, aimed at salaried people.

## The two-layer rule

1. **Deterministic core** — plain TypeScript plus `rules/*.yaml`. All arithmetic,
   all classification, all rule lookup. Unit tested.
2. **Skill layer** — `SKILL.md` files. Conversation only: eliciting numbers,
   interpreting results, flagging traps.

Never put arithmetic in the skill layer. Never put prose in the core. The core
classifies ("this offer is back-loaded"); the skill decides what to say and what
to lead with.

## The model never computes, and never recalls a rate

Every rate, slab, limit, threshold and formula lives in `rules/`. If you find
yourself recalling a tax rate from memory, stop: look it up in the rules file, or
say the rules file doesn't have it yet.

Skills call the core through its CLI entrypoint and narrate the JSON it returns.
Every rupee figure in a skill's response must appear in that tool's input or
output — this is enforced by an eval, not by good intentions (ADR 0003). The tool
emits display strings; never reformat a number yourself.

## Hard constraints

- **Typed input only.** No PDF or statement parsing, no passwords, no card or
  account numbers. This is settled; do not reopen it.
- **Analysis and citation, never a recommendation to act** (ADR 0007). State what
  is true, link the primary source, and stop. Do not tell the user what to do.
- **Never value the unvaluable.** Illiquid equity is ₹0 and is always named
  (ADR 0005). Never model share-price growth.
- **Never encode claims about a named employer.** Vesting schedules are typed
  input, not a lookup table.

## Money

Integer paise, rates as integer basis points after load. No floating-point
arithmetic in the core, percentages included. Rounding only at §288A and §288B
(ADR 0002).

## Rules versus heuristics

`rules/fy<YYYY-YY>.yaml` is sourced statutory fact — every group carries a source
URL, CI-enforced (ADR 0001). `heuristics.yaml` is authored judgement, carrying a
`rationale` instead of a URL (ADR 0006). Never put an opinion in the rules file.

## Tickets

Every ticket names the `rules/` key(s) it reads and the fixture(s) it must make
pass. This deliberately overrides `to-tickets`' default of avoiding file
references: rules keys and fixtures are stable contracts, not implementation
paths that rot.

## Handoff

`/handoff` writes to `docs/agents/handoff.md` in this repo, overwriting it. Its
default (the OS temp directory) does not survive Claude Code web session
isolation, where only committed files carry over.

## Agent skills

### Issue tracker

GitHub Issues on `varunbhanot/indian-finance-skills`, accessed via the GitHub MCP
tools — **not** the `gh` CLI, which is unavailable here. See
`docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, unchanged. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See
`docs/agents/domain.md`.
