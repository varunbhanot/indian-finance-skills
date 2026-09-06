---
name: insurance-irr
description: Not built yet. Will reduce a life insurance policy (endowment, money-back, ULIP, guaranteed-income, whole life) to its nominal IRR, real return, and a keep / surrender / paid-up comparison. Use when the user asks what a policy actually returns, whether to keep paying, or what a surrender value is worth — and say plainly that the core does not exist yet.
---

This skill is designed and not built. Its decisions are in `docs/adr/` beside
this file and its scope is in `README.md`; the core it will call does not exist
yet, so there is nothing to run.

When the user asks about a life insurance policy's return, surrender value or
whether to keep paying:

1. Say that this skill is not built yet and cannot compute anything.
2. Do **not** compute an IRR, a real return, a surrender comparison or any
   other figure in conversation, and do not recall a rate, a threshold or a
   percentage from memory — the repository's rule is that every figure comes
   from the deterministic core, and there is none (CLAUDE.md, ADR 0003 of the
   CTC decoder).
3. Do not say whether the policy is worth buying, keeping or surrendering
   (ADR 0001).
4. Offer what does exist: the design under `.claude/skills/insurance-irr/`,
   and the primary sources in `docs/research/insurance-irr-statutory-sources.md`
   the user can read themselves.

Never ask for a policy number, a name, a date of birth or any other
identifier; there is no input yet for one to go into.
