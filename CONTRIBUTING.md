# Contributing

## Workflow

- `main` is the protected, always-releasable branch. Don't commit to it directly.
- Create a branch per change (`git checkout -b <your-branch>`).
- Open a pull request into `main` and let CI pass before merging.
- Keep PRs focused on a single skill or a single change; avoid mixing unrelated edits.

## The engineering skills this project is built with

CLAUDE.md, the tickets and `docs/agents/` all speak in terms of skills like
`/tdd`, `/triage`, `/code-review`, `/handoff`, `/to-tickets` and `/wayfinder`.
Those come from [mattpocock/skills](https://github.com/mattpocock/skills) and
they are **not in this repository**. They are tooling for working on the code,
so vendoring them into `.claude/skills/` would hand all 26 of them to every
person who clones this repository for the CTC decoder — a menu of 27 skills,
one of which is about their offer letter.
`test/skills-are-this-projects-own.test.ts` fails the build if a copy comes
back.

Load them once, for yourself, in whichever place you work:

- **Your own terminal**: `claude plugin marketplace add mattpocock/skills`,
  then `claude plugin install mattpocock-skills@mattpocock --scope user`.
- **Claude Code on the web**: enable the plugin for your claude.ai account and
  every cloud session downloads it automatically (Claude Code loads it as a
  *synced plugin*). If it isn't offered there, put the two commands above in
  your [cloud environment's](https://code.claude.com/docs/en/cloud-environments)
  **Setup script** field instead, which runs before Claude Code launches and is
  kept in the environment's cache.

Either way the skills arrive namespaced, as `/mattpocock-skills:tdd`. The bare
`/tdd` still works while nothing else in the session claims the name, which is
the form the docs here use. Nothing about the finance skills or the core
depends on having them installed: `npm test`, `npm run lint` and
`npm run typecheck` are the contract, and they need none of this.

`docs/agents/` stays committed, because it configures those skills *for this
project* — which tracker they file to, which labels they use, where the domain
docs live — and that is this repository's decision to record, not Matt's code.

## Running the core

**Node 22.18 or later**, then `npm install`. There is no build step, and that is
why the version is a hard requirement rather than a preference: the scripts run
the TypeScript sources directly, which Node does without a flag only from 22.18
on. On anything older every script here fails with

```
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts"
```

which names neither Node nor a version. `npm test`, `npm run lint` and `npm run
typecheck` check first and print the version they found against the one they
need (issue #37). CI runs Node 22.

In a Claude Code session on the web the install runs for you, from
`.claude/hooks/session-start.sh`.

```
npm run ctc-decoder -- '{"financial_year":"2026-27","components":[{"name":"Basic","type":"basic","amount":600000,"period":"annual"}]}'
npm run lint        # no floating-point arithmetic in src/core
npm run typecheck
npm test            # fixtures, rules schema check, output invariants, duplicate goldens, loader tests, traceability eval
```

The decoder prints one JSON document to stdout, or a JSON error
(`{ "error": { "code", "message", "path" } }`) to stderr with a non-zero exit.
Input is strict: unknown keys are rejected, so a ticket adding a field extends
the validator in `src/core/ctc-decoder/input.ts`.

`pf_wage_base` is typed by the caller, and the decoder separately reads what the
letter's own employer provident fund line implies. Where the two disagree — a
contribution of 12% of the whole basic decoded with `statutory_ceiling` typed,
or the reverse — the output carries a `pf-wage-base-disagreement` flag naming
both. The typed base still drives every deduction: the flag states the
disagreement and does not resolve it (issue #43, ADR 0007).

Every component either names a `type` the rules file's catalogue knows, or
classifies itself inline with all three of `certainty`, `form` and `recurring`.
All three, because the two axes alone do not separate a joining bonus from basic
pay — they share both and differ only in `recurring`.

## Adding a fixture

Create `fixtures/<name>/` with `input.json` and either `expected.json` (the
exact stdout) or `expected-error.json` (the exact stderr). The suite discovers
the directory and runs it through `npm run ctc-decoder`. A fixture for another
skill's CLI (e.g. `insurance-irr`) adds a plain-text `entrypoint` file naming
that npm script instead — every fixture predating that file belongs to the CTC
decoder, which is why it is the default. Fixture directories are one flat
namespace, so a name must be unique across every skill's fixtures; when a
rejection shares its natural name with another skill's (e.g. `reject-above-cap`
already belongs to the decoder), prefix it with the skill's own name instead of
overwriting the other skill's fixture. Expected values must come from an
independent source (a worked example, an official calculator, a hand-checked
literal), never from running the CLI and pasting its output.

Two fixtures may share an input and a golden — `take-home-new-regime` and
`take-home-old-regime` are one package under two names, since the decoder
reports both regimes from one decode and each name carries the cross-check for
its own regime. What they may not do is share them silently: a fixture
byte-identical to another must name it in its README and say what the pair is
for, and `npm test` fails until it does (issue #38).

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

## Recording a transcript

`fixtures/transcripts/` holds recorded conversations with a skill — what it
actually said, around the tool calls it actually made — which the traceability
eval (ADR 0003, issue #15) replays on every `npm test`, with no model and no
network. Producing a transcript is the opposite: it needs a model, and is run
by a contributor, not CI.

1. Write a plain-text file holding the first message a user would send — the
   pasted annexure and the question — against one of the offers under
   `fixtures/`.
2. Record the conversation:
   ```
   ANTHROPIC_API_KEY=... ANTHROPIC_MODEL=... \
     npm run record-transcript -- <letter-file> fixtures/transcripts/<name>/transcript.json
   ```
   This holds a real conversation between that model and the `ctc-decoder`
   skill, letting the model call the real CLI (your repository's own `rules/`
   and `heuristics.yaml`, nothing stubbed) through a tool that stands in for
   the shell command `SKILL.md` tells it to run. Reply at each prompt as the
   user would; blank input or Ctrl-D ends the session and writes
   `transcript.json` in the shape `fixtures/transcripts/README.md` documents.
   `ANTHROPIC_MODEL` is not defaulted, so the choice of model doesn't go stale
   in this file — pick the current one yourself.
3. Add a `step` to each `assistant` and `tool` event by hand if you want the
   transcript to name the `SKILL.md` section it came from — optional, and read
   by nobody but a future reader of the file.
4. Validate it before committing: `npm run check-transcript --
   fixtures/transcripts/<name>/transcript.json`. This runs the same
   traceability eval `npm test` does — every rupee figure and every URL an
   `assistant` turn states must appear verbatim in a `tool` turn's `input` or
   `output` somewhere in the transcript, and no `assistant` turn may read as
   advice (ADR 0007) — so a transcript that would fail in CI fails here first,
   with the same value named.
5. Add the fixture name to `test/traceability.test.ts`'s `EXPECTED_FAILURE`
   only if this is a deliberately broken transcript proving the eval catches
   something; a real recording needs no entry there and is expected to pass.

## Adding a new skill

1. Create `.claude/skills/<skill-name>/` (kebab-case) as a real directory
   holding a `SKILL.md` and a `README.md`. A top-level directory will not be
   loaded by Claude Code, and a symlink, a `vendor/` tree or a bundled
   `.claude-plugin/` manifest each fails
   `test/skills-are-this-projects-own.test.ts`: that directory is for finance
   skills written here, and third-party tooling loads from its own plugin.
2. Add a `SKILL.md` with frontmatter (`name`, `description`) and clear instructions.
3. Keep helper scripts in `scripts/` and reference-only material in `references/`.
   A skill needs neither: `ctc-decoder` is one `SKILL.md` and nothing else.
4. Have the skill reach the core through its CLI entrypoint and narrate the JSON
   it returns (ADR 0003). No arithmetic, no rate recalled from memory, and every
   rupee figure said is a `display` string copied from that tool's input or
   output.
5. Make that entrypoint reachable from outside the clone (ADR 0020). The
   `skills` CLI copies the skill's directory into another project and nothing
   beside it, so `npm run <name>` has no repository root to run from there —
   and an npm-installed copy of the entrypoint cannot run its `.ts` source at
   all, because Node refuses to strip types from a file under `node_modules`
   with no override, which rules out reaching it through `npx` or a `bin`.
   Have `SKILL.md` give both forms of the command and say which applies
   where: `npm run <name> -- '<json>'` from the repository root, and, against
   a clone kept in a cache directory,
   `node <clone>/src/cli/<name>.ts '<json>'` from anywhere else.
   `test/skills-reach-the-core-from-outside.test.ts` fails a `SKILL.md` that
   gives only the first form, or whose second form names a file that does not
   exist under `src/cli/`.
6. Open a PR describing what the skill does and when it should trigger.
