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

On top of that decomposition it reports:

- **Equity, valued rather than accepted.** A listed grant is held at its
  grant-date value, flat; a listed option at its intrinsic value; an unlisted
  grant at ₹0, named as unvaluable and shown beside the value the letter
  claimed, which never moves (ADR 0005, ADR 0016).
- **The package year by year**, on both the zero and the at-target reading of
  variable pay, so a joining bonus and a back-loaded vesting schedule show up
  as the year-two drop they are rather than inside an average (ADR 0017).
- **Steady-state take-home under both regimes**, side by side as two facts of
  one input, after employee provident fund, professional tax where you know it,
  and income tax with that year's slabs, rebate, surcharge, marginal relief and
  the two statutory roundings — plus the **break-even deduction**, the point at
  which the old regime's tax stops exceeding the new regime's (ADR 0018).
- **What your letter's own employer PF line implies** about the wage base
  behind it, and a flag when that contradicts the base you typed (issue #43).
- **Flags**, each carrying the figures it rests on and whether it stands on a
  statute, an authored threshold, or your letter alone.

## Status

**Shipped for FY 2026-27.** Spec #4's fourteen tickets are all built, and every
claim above is held by a fixture: 47 offers decode end to end, 15 of them
asserting take-home, alongside 15 rejections. The tax figures are cross-checked
against the Income Tax Department's own calculation engine where the engine can
be driven, and each fixture's README says which of its figures that covers and
which are asserted on other grounds.

## What it does not do yet

Specific, and each one is a real limit rather than a caveat:

- **One financial year.** `rules/fy2026-27.yaml` is the only rules file. Any
  other year is refused by name, never approximated.
- **The old regime's figure is a floor.** HRA exemption and Chapter VI-A
  deductions are real deductions this does not compute, so a taxpayer who has
  them pays less than it says. Nor does it compute the employer NPS deduction,
  perquisite tax when equity vests, or capital gains on sale. All of them are
  named in the output's `excludes` rather than silently dropped.
- **Professional tax is typed, not looked up.** There is no table of state
  rates, and the calendar quirks are not modelled either — Maharashtra's
  ₹300 February and Tamil Nadu's half-yearly cycle both land as an annual
  figure you supply.
- **No employees' state insurance.** A low-wage letter where ESI bites has a
  deduction this does not know about.
- **No flexible benefit plan basket.** An annexure that prints one "FBP" or
  "flexi pay" line, with the sub-heads left to the employee to claim, has no
  catalogue entry; so does an annexure with no basic at all. Type the
  components out, or classify the basket inline.
- **No retaining allowance**, which section 6 of the EPF Act counts into the
  provident fund wage base alongside basic and dearness allowance.
- **Two offers side by side.** The output is built to be laid beside another
  decode, but comparing them is a later skill.

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
