# CTC decoder

Decodes an offer letter's CTC into guaranteed recurring cash and what the
rest actually is.

## What it does

It takes an offer letter — handed over as a document, pasted, or typed —
confirms every figure with you beside its source line, and decodes it into
guaranteed recurring cash against headline CTC. Every component is
classified along three axes — whether it is guaranteed, what form it takes
(cash now, deferred cash, locked savings, equity, or a benefit in kind), and
whether it recurs — and every total is traced to the lines it was built from,
with the statutory rate or threshold behind each figure cited to its primary
source.

## Status

First cut. Take-home, equity valuation and the year-by-year view are in
progress under spec #4.

## What this deliberately won't do

It never tells you what to negotiate, accept or reject. It states what is true
about the numbers and links the primary source — EPFO, the Payment of Gratuity
Act, the Income Tax Department — and stops there (ADR 0007). It never does
arithmetic in conversation: every rupee figure comes from the deterministic
core, and an eval checks that (ADR 0003). It never values illiquid equity at
anything other than ₹0, and always says so (ADR 0005). And it never asks for a
password, a PAN or an account number.

## How it runs

The skill calls the core through its CLI entrypoint and narrates the JSON it
returns:

```
npm run ctc-decoder -- '<json>'
```

Rules it reads live in `rules/fy<YYYY-YY>.yaml`; the judgement thresholds
behind its flags live in `heuristics.yaml`. Behavioural fixtures for it are
under `fixtures/`.
