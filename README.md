# Indian Finance Skills

Claude Code skills for Indian personal finance, aimed at salaried people.

Each skill takes the numbers you have — an offer letter, a payslip, a figure
you typed — and tells you what is true about them, with every rate and
threshold traced to its primary source. No skill ever tells you what to do.

## Skills

| Skill | What it does | Status |
|---|---|---|
| [CTC decoder](.claude/skills/ctc-decoder/README.md) | Decodes an offer letter's CTC into guaranteed recurring cash, values equity, lays the package out year by year, and estimates take-home under both tax regimes. | Shipped for FY 2026-27. Spec #4's stories are all built; the [known gaps](.claude/skills/ctc-decoder/README.md#what-it-does-not-do-yet) are specific and listed. |

More skills will be added here as they are built.

## How every skill is built

Each skill has two layers, and the boundary between them is strict
(see [CLAUDE.md](CLAUDE.md)):

1. **A deterministic core** — plain TypeScript plus `rules/*.yaml`. All
   arithmetic, all classification, all rule lookup. Unit tested, no
   floating point, every rate sourced to a statutory document.
2. **A skill layer** — the `SKILL.md` file. Conversation only: eliciting
   figures, interpreting the core's output, flagging traps.

The model never computes and never recalls a rate from memory. Every rupee
figure in a skill's response comes from the core's output, and an eval
enforces that (ADR 0003). Every rate, slab and limit lives in `rules/` with
a source URL, CI-enforced (ADR 0001).

## What no skill will do

- **Recommend.** A skill states what is true about the numbers, links the
  primary source — EPFO, the Payment of Gratuity Act, the Income Tax
  Department — and stops (ADR 0007). It never says what to negotiate,
  accept or reject.
- **Guess a value.** Illiquid equity is ₹0 and is always named as such
  (ADR 0005). Share-price growth is never modelled.
- **Ask for credentials.** No passwords, no PAN, no account or card numbers.
  A skill never repeats an identifying detail from a document you hand it.

## Structure

Each skill lives under `.claude/skills/<skill-name>/` — the directory Claude
Code auto-loads project skills from; a top-level directory would not load —
and follows the standard Claude Skill layout:

```
.claude/skills/skill-name/
  SKILL.md      # required — name, description, and instructions
  README.md     # what the skill does, its status, and what it won't do
  scripts/      # optional — helper scripts the skill can invoke
  references/   # optional — reference material loaded on demand
```

The deterministic core behind the skills lives in `src/core/`, the CLI
entrypoints in `src/cli/`, statutory rules in `rules/`, and behavioural
fixtures in `fixtures/`. Design decisions are recorded in `docs/adr/`.

## Running it

**Node 22.18 or later is required**, and it is not a preference. There is no
build step: every script hands Node a `.ts` file and relies on it stripping the
types itself, which Node does without a flag only from 22.18 on. Below that
version `npm test` and `npm run lint` both die with
`ERR_UNKNOWN_FILE_EXTENSION`, which names no version and reads like a bug here.
`npm test`, `npm run lint` and `npm run typecheck` check the version first and
say so plainly instead. CI runs Node 22.

```
npm install
npm test
npm run ctc-decoder -- '{"financial_year":"2026-27","components":[{"name":"Basic","type":"basic","amount":600000,"period":"annual"}]}'
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add a new skill.
