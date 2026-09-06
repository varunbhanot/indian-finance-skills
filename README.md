# Indian Finance Skills

Claude Code skills for Indian personal finance, aimed at salaried people.

Each skill takes the numbers you have — an offer letter, a payslip, a figure
you typed — and tells you what is true about them, with every rate and
threshold traced to its primary source. No skill ever tells you what to do.

## Skills

| Skill | What it does | Status |
|---|---|---|
| [CTC decoder](.claude/skills/ctc-decoder/README.md) | Decodes an offer letter's CTC into guaranteed recurring cash, values equity, lays the package out year by year, and estimates take-home under both tax regimes. | Shipped for FY 2026-27. Spec #4's stories are all built; the [known gaps](.claude/skills/ctc-decoder/README.md#what-it-does-not-do-yet) are specific and listed. |
| [Insurance IRR](.claude/skills/insurance-irr/README.md) | Reduces a life insurance policy to its nominal IRR and real return, sets it beside what the same premiums do elsewhere, and lays Keep, Surrender and Paid-up side by side for a policy in force. | Designed, not built. Sixteen [ADRs](.claude/skills/insurance-irr/docs/adr/) fix the design and spec #63 describes the build. |

More skills will be added here as they are built.

## Using a skill

Two routes, and both need git and Node 22.18 or later.

**Add a skill to a project you already have** with the
[`skills` CLI](https://skills.sh), from inside that project:

```
npx skills add varunbhanot/indian-finance-skills
```

It lists the skills in the table above and copies the ones you pick into the
project's skills directory, for Claude Code or whichever coding agent you name
with `-a`. The arithmetic does not come with the copy: the first time a skill
runs its core, it clones this repository into a cache directory and runs the
core from there, and later runs just pull and reuse that clone (ADR 0020).
Nothing is installed into your project beyond the skill's own directory.

**Or clone the repository** and start Claude Code inside it. The skills load
themselves from `.claude/skills/`, which is where Claude Code reads a project's
skills from, so there is nothing to install or enable beyond the dependency the
arithmetic needs:

```
git clone https://github.com/varunbhanot/indian-finance-skills
cd indian-finance-skills
npm install    # Node 22.18 or later
claude
```

Then say what you have. Each skill carries the conditions it triggers on, so a
sentence like *"I've got an offer letter, what's actually guaranteed here?"*
reaches the CTC decoder on its own. Naming it works too — `/ctc-decoder`.

From there the skill asks for what it needs. You can hand it the offer letter
as a document, paste the breakdown, or type figures one at a time; every figure
it reads is confirmed with you beside the line it came from before any of it is
used. It never asks for a password, a PAN or an account number, and it does not
repeat an identifying detail from a document you hand it.

The arithmetic runs locally, in a CLI the skill calls and whose output it
narrates — see [Running the core directly](#running-the-core-directly) to call
that yourself. What reaches Anthropic is your conversation with Claude, the
same as any other Claude Code session.

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

Everything in that directory is a finance skill, and the skills you get on
cloning are the ones in the table above. The general-purpose engineering skills
this project is *built with* — TDD, triage, code review — are the maintainer's
tooling rather than the product, so they are not vendored in here and load
separately, per person. They never crowd the menu for someone who came for
their offer letter, and [CONTRIBUTING.md](CONTRIBUTING.md) says how a
maintainer loads them.

The deterministic core behind the skills lives in `src/core/`, the CLI
entrypoints in `src/cli/`, statutory rules in `rules/`, and behavioural
fixtures in `fixtures/`. Design decisions are recorded in 
`.claude/skills/ctc-decoder/docs/adr/`.

## Running the core directly

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
