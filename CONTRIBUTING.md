# Contributing

## Workflow

- `main` is the protected, always-releasable branch. Don't commit to it directly.
- Create a branch per change (`git checkout -b <your-branch>`).
- Open a pull request into `main` and let CI pass before merging.
- Keep PRs focused on a single skill or a single change; avoid mixing unrelated edits.

## Running the core

Node 22.18 or later, then `npm install`. There is no build step. In a Claude
Code session on the web that install runs for you, from
`.claude/hooks/session-start.sh`.

```
npm run ctc-decoder -- '{"financial_year":"2026-27","components":[{"name":"Basic","type":"basic","amount":600000,"period":"annual"}]}'
npm run lint        # no floating-point arithmetic in src/core
npm run typecheck
npm test            # fixtures, rules schema check, output invariants, loader tests
```

The decoder prints one JSON document to stdout, or a JSON error
(`{ "error": { "code", "message", "path" } }`) to stderr with a non-zero exit.
Input is strict: unknown keys are rejected, so a ticket adding a field extends
the validator in `src/core/ctc-decoder/input.ts`.

Every component either names a `type` the rules file's catalogue knows, or
classifies itself inline with all three of `certainty`, `form` and `recurring`.
All three, because the two axes alone do not separate a joining bonus from basic
pay — they share both and differ only in `recurring`.

## Adding a fixture

Create `fixtures/<name>/` with `input.json` and either `expected.json` (the
exact stdout) or `expected-error.json` (the exact stderr). The suite discovers
the directory and runs it through `npm run ctc-decoder`. Expected values must
come from an independent source (a worked example, an official calculator, a
hand-checked literal), never from running the decoder and pasting its output.

A fixture that needs a rules file this repository does not ship — one missing a
group, or one carrying a catalogue entry that does not exist yet — may add a
`fixtures/<name>/rules/fy<YYYY-YY>.yaml`, and the runner points the decoder at
it (ADR 0009). Such a file is test data, not statutory fact; say so in a comment
at its head.

## Adding or changing a heuristic

`heuristics.yaml` at the repository root holds the authored thresholds behind
the decoder's flags — when variable pay is a large share, when basic is low, and
so on. It is the rules file's opposite number (ADR 0006): every threshold gives
a `rationale` saying why the number is where it is, and **none may carry a
`source`**, because a URL here would be a statutory claim standing in a file of
opinions. `npm test` refuses both mistakes.

It is not scoped to a financial year — "that is a lot of variable pay" is not a
tax-year concept — which is why it sits beside `rules/` rather than inside it.

Disagreeing with a threshold is a pull request against this one file, and an
argument about judgement, with nobody wondering whether a tax rate was edited.
Changing one changes what the decoder flags with no code change at all;
`fixtures/flag-threshold-from-the-file` is that claim, shown rather than
asserted.

A flag states a fact and never a recommendation (ADR 0007), and the wording is
checked: `test/output-invariants.test.ts` fails any string in any fixture's
output that reads as advice, rationales included.

## Adding a component type

Add an entry under the `components` group in `rules/fy<YYYY-YY>.yaml` giving its
`certainty`, `form` and `recurring`, plus `instrument` for an equity type. That
is the whole change: the decoder classifies whatever entries it finds, and every
total is a predicate over those three fields (ADR 0004). Every entry states its own
basis: `source`, the statute that settles the classification, plus a `title`
naming that statute (ADR 0015), or `rationale`, your reason for it — one or the
other, never both and never neither, and never the group's source standing in
(ADR 0010). If you find yourself editing
`src/core` to make a new type land in the right total, the total is wrong, not
the catalogue.

## Adding a rules group

Edit `rules/fy<YYYY-YY>.yaml`. Every group carries `source`, `retrieved` and a
`title` naming the paper `source` points at; rates are decimal fractions under a
key named `rate` or ending `_rate`; every other number is a whole integer.
`npm test` refuses anything else.

A value inside the group may cite its own provision — `section`, `source` and
`retrieved`, plus an optional `note` (ADR 0013). Where that `source` is a
*different* paper from the group's, the value titles it too, because the output
lists every document it cites by name and an untitled one could not reach the
reader (ADR 0015). A title names a document, never a provision: `section` is
where "…, section 516" belongs. One URL, one title — `npm test` fails a file
that gives the same document two.

## Adding a new skill

1. Create `.claude/skills/<skill-name>/` (kebab-case). A top-level directory
   will not be loaded by Claude Code.
2. Add a `SKILL.md` with frontmatter (`name`, `description`) and clear instructions.
3. Keep helper scripts in `scripts/` and reference-only material in `references/`.
4. Open a PR describing what the skill does and when it should trigger.
