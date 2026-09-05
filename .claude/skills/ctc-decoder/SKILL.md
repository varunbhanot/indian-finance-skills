---
name: ctc-decoder
description: Decode an offer letter's CTC into guaranteed recurring cash and what the rest actually is. Use when the user has an offer letter, a CTC or salary breakdown, or asks what part of a package is guaranteed, cash, or recurring. Takes a document they hand over, pasted lines, or typed figures.
---

Decode a CTC into what is guaranteed, cash and recurring, and what the rest
actually is. The core does every sum and every classification; this skill
gathers the input, confirms it, runs the CLI twice — once for the decode, and
again once the user has settled the one question take-home needs — and narrates
the JSON. Every rupee figure you say is a `display` string copied from the
tool's input or output, never a number you formed (ADR 0003). You state what is
true and link its source; what to negotiate, accept or reject is the user's, and
you leave it with them (ADR 0007).

## 1. Intake

Take the offer by whichever route the user gives it:

- **Pasted or typed lines** — use them as given.
- **A document** (PDF, spreadsheet, image) — read it. Take only the pay lines
  and the conditions attached to pay. The name, address, employee ID and
  everything else identifying on the page stay on the page: unused, and never
  repeated back (ADR 0011). Scanned images and tables split across lines
  misread easily; step 3 is what catches that.
- **Neither** — ask for the financial year, then for each line of the letter
  as written: name, amount, annual or monthly. Offer the catalogue types as the
  menu.

The financial year is the one the start date falls in, 1 April to 31 March
(CONTEXT.md). Ask when the letter does not settle it.

**Never ask for a password, a PAN, an employee number, a bank or card number, or
any other identifier**, at any step and for any reason: nothing in the CLI's
input takes one, so there is nothing they could be for. If a document carries
them, they stay on the page — unused, and never repeated back to the user, not
even to confirm you read the right letter (ADR 0011). Name a line by what the
letter calls it, never by who it belongs to.

The catalogue types are the keys under `groups.components.entries` in
`rules/fy<YYYY-YY>.yaml`; read them from the file. A line no type fits is
classified inline with `certainty`, `form` and `recurring` — three questions to
the user, whose answers are theirs.

An equity line needs more than an amount, and the extra questions are the
whole of what makes it valuable or not. Ask, for each grant:

- **Is the company listed?** The one question the valuation turns on.
- **The vesting schedule**, as the letter states it: the share arriving in each
  year, and any cliff. Take it in whatever words the letter uses ("25% a year
  after a one-year cliff", "5/15/40/40") and write it as basis points per year
  summing to 10000. Ask; never assume, and never fill it in from what you know
  about the employer — this repository carries no employer's vesting shape
  (ADR 0005). A share purchase plan has no schedule, and inventing one for it to
  fill the field is the exact thing this rule forbids.
- **Units, the grant-date fair market value per unit, and the strike** for an
  option, wherever the letter states them — including for an unlisted company,
  whose letters usually state all three. They are carried into the output either
  way; whether they are multiplied out is the decoder's to decide.
- **The discount**, for a share purchase plan, in basis points.

A listed option is the one grant that cannot be valued without all three: what
the letter quotes is the value of the shares, not of the option over them. If
the letter does not give the strike, ask for it; the decoder will refuse the
grant rather than guess, and say so.

Do not ask what the shares might be worth later, and do not accept an answer
framed that way. No growth rate exists anywhere in the input.

## 2. Draft the input

The CLI takes one JSON document. Amounts are whole rupees; `period` is
`annual` or `monthly`; a line names a `type` or carries the three inline fields.

```json
{
  "financial_year": "2026-27",
  "components": [
    { "name": "Basic", "type": "basic", "amount": 1800000, "period": "annual" },
    { "name": "Special allowance", "type": "special_allowance", "amount": 60000, "period": "monthly" },
    { "name": "Joining bonus", "type": "joining_bonus", "amount": 300000, "period": "annual", "clawback_months": 12 },
    { "name": "Site allowance", "amount": 120000, "period": "annual",
      "certainty": "guaranteed", "form": "cash-now", "recurring": true },
    { "name": "RSU grant", "type": "rsu", "amount": 4000000, "period": "annual",
      "equity": {
        "listed": true,
        "units": 800,
        "grant_date_fair_market_value": 4500,
        "vesting": { "cliff_months": 12, "years": [2500, 2500, 2500, 2500] }
      } }
  ]
}
```

An equity line's `amount` is what the **letter claims** the grant is worth; the
`equity` block is what the decoder values it from. The block is required on
every equity line and refused on every other. Type every figure the letter
states: a figure the valuation does not multiply out is still reported, beside
the assumption that says why. Only two things are refused, and both are category
errors rather than unused numbers — a `strike` on a restricted stock unit, which
is a promise of shares and not a right to buy them, and a
`discount_basis_points` on anything but a share purchase plan.

For every line keep its **source**: the pasted text, the user's words, or the
letter's own sentence. A one-time line whose fine print names a recovery
period carries it as `clawback_months`.

Gather the **conditions in the letter** as a separate list: every clause that
attaches a condition to pay — recovery, cliff, "subject to", performance or
tenure conditions — quoted verbatim. Those with a field go into the JSON; all
of them are shown in step 3 and narrated in step 5.

## 3. Confirm

Show the draft as a table — name as on the letter, amount, period, type or
inline axes, clawback — with the source beside each row, then the quoted
conditions. Ask the user to correct anything. Show each equity grant's block
below its row: listed or not, units, prices, discount, and the schedule year by
year with its cliff, each beside the sentence of the letter it came from.

The step is complete when the user has said the draft is right. Until then the
CLI has not run, however simple the user says the letter is: the confirmation
is the typing (ADR 0011).

## 4. Run

From the repository root:

```
npm run ctc-decoder -- '<json>'
```

Success prints the decoded offer on stdout. A rejection prints
`{ "error": { "code", "message", "path" } }` on stderr: relay `message`, fix
the draft with the user, run again. `rule_absent` means the rules file does not
carry that rule yet — say exactly that.

This first run carries no `take_home` block. Step 5 is what adds one.

## 5. The provident fund wage base

Take-home needs one thing the letter does not state in words: which wage the
employer computes provident fund on — the whole of the provident fund wage base
(basic, and dearness allowance where the letter has one), or that wage capped at
the statutory monthly ceiling. There is no default, and the two answers move the
monthly figure by thousands.

It is a bad question to put cold, and usually you do not have to. **An Indian
annexure states the employer's contribution as an amount, and the policy is in
that amount.** The decoder reads it: when the offer carries an employer
contribution line, the output carries `employer_pf`, and the answer is
`employer_pf.implies`. You do no arithmetic here — you read the field and put a
confirmation instead of a quiz.

- **One entry** — say which base the letter's own figure lands on, with the
  figures the decoder compared, and ask the user to confirm it. Both figures are
  in the output: `employer_pf.stated_contribution.annual.display` is what their
  letter says, and the matching entry in `employer_pf.bases` carries the
  `wage.annual.display` its `implied_contribution` was computed on, at
  `employer_pf.rate.display`. Shaped like: "your letter's employer PF of *[their figure]* is
  *[the rate]* of the statutory ceiling of *[the ceiling]* a month — is that the
  basis?", with every bracket filled from the output and none of them from
  memory.
- **Both entries** — `bases_coincide` is true: the wage base is at or below the
  ceiling, so both bases give the same wage and no figure computed from them could tell
  them apart. Say that, say the figure is the same either way, and ask the plain
  question anyway, because the answer still travels into the input.
- **No entries** — the letter's figure lands on neither. Say so, give all three
  figures — theirs, and what each base would imply — and ask the plain question.
  This is not a problem with their offer, and do not present it as one: letters
  round, employers contribute above the minimum, and an annexure may state only
  the part of the contribution that reaches the provident fund rather than the
  whole employer share, which is what the rate's own citation `note` records.
- **No `employer_pf` block at all** — either the letter has no employer
  contribution line, or the rules file does not say which catalogue entry that
  would be. Nothing to read either way: ask the plain question, and do not
  report the absence as a problem with their letter.

The plain question, when you need it: does the employer compute provident fund
on the whole of the wage base — basic, with dearness allowance where the letter
has one — or on the statutory monthly ceiling? Name the ceiling by
`employer_pf.ceiling.monthly.display` where the output carries it; where there is
no `employer_pf` block, ask without a figure rather than supplying one from
memory — you do not have the ceiling for that year unless the tool gave it to
you.

`employer_pf.implies` is a reading of the letter and never an answer on the
user's behalf. If they say the other base, that is the base: type what they
said, not what the letter implied, and do not argue with them about their own
employer.

Ask at the same time for the **annual professional tax** their state levies, if
they know it — a figure from their own payslip or state, not one you supply. It
is optional: without it the estimate names professional tax among the things it
excludes, which is the honest report of not having been told.

Then add both to the same JSON and run again:

```json
{
  "financial_year": "2026-27",
  "pf_wage_base": "statutory_ceiling",
  "professional_tax": 2500,
  "components": [ "…exactly as they were in the first run…" ]
}
```

`pf_wage_base` is `full_basic` or `statutory_ceiling`; `professional_tax` is
whole rupees a year, and is refused without `pf_wage_base` beside it. The second
run's output is the one you narrate.

## 6. Narrate

Lead with `totals.guaranteed_recurring_cash` beside `totals.headline_ctc`,
each by its `display` string and the `components` it names. Say the two side
by side; their difference is not a figure the tool emitted.

Then every component that does not count toward guaranteed recurring cash,
with the reason read off its own `certainty`, `form` and `recurring` — the
reason is on the component, and it is the only one you give.

Then the remaining totals — `variable_pay_at_target`, `retirals`,
`one_time_components`, `benefits_in_kind` — each by `display` with its
constituent names, and `clawback_months` on any component that carries it.

Then the equity, when any component carries an `equity` block. Say
`totals.equity_as_claimed.display` and `totals.equity_as_valued.display` side by
side, and `totals.unvaluable_equity.display` with the grants it names. The
distance between the first two is the point of the reading, and like every other
difference it is not a figure the tool emitted: put the two figures next to each
other and let them stand. `unvaluable_equity` is on the **claimed** basis, not
the valued one — it is how much of what the letter counted rests on a figure
nobody can check — so say which basis it is on when you say it.

Then each grant, from its own `equity` block and nothing else:

- `valued.display` beside `claimed.display`, and `method`.
- `assumption`, said and not paraphrased. It is what stops a figure held flat
  or held at nil from being read as a forecast, and it is the reason the number
  is what it is.
- `vesting`, where the grant has one — each year by its `share.display`, in
  order, and `cliff_months` where present. Say the schedule; a grant divided
  across it is not a figure the tool emitted, and the flat annual average is the
  number this reading exists to take apart. A share purchase plan carries no
  `vesting` and needs none said of it.
- `units`, `grant_date_fair_market_value.display`, `strike.display` and
  `discount.display` where the block carries them.
- `perquisite.statement`, with its `citation` — the value is taxed as salary,
  and the `note` on that citation says what the Act leaves to be prescribed.
  Say it; no perquisite figure exists, and none can be computed.

A grant whose `method` is `unvaluable` or `employee-funded` is held at nil and
must still be named, with its claimed value beside it and the reason from its
`assumption` (ADR 0005). Never let a nil valuation become silence.

Then `year_by_year`, which is the same package written out over
`years_covered` years instead of averaged into one. Take one basis at a time and
say which it is: `variable-pay-at-zero` counts no variable pay, and
`variable-pay-at-target` counts it at the quoted target.

- Say `year_one.display` and `average.with_one_time.display` next to each other
  and stop. That pair is the whole reading, and like every other pair the
  distance between them is not a figure the tool emitted.
- Then the rows, each by its `year` and `total.display`, and the columns it is
  made of — `guaranteed_recurring_cash`, `variable_pay_at_target`, `one_time`,
  `equity_as_valued` — each by its own `display`.
- `total` is the total of those four columns and is **not** the headline CTC.
  Say so. Retirals, benefits in kind and a grant with no schedule are outside
  this table on purpose; they are in `totals`, and they arrive on the same terms
  in every year, which is why the table that shows what separates the years
  leaves them out.
- `equity_as_claimed` sits beside `equity_as_valued` in every row, on the two
  bases `totals` already uses. Say both.
- Then the averages. `average.with_one_time` is a fact about the table and is
  never a recurring figure: it holds the components in
  `average.one_time_components`, which arrive once. Name them when you say it,
  and say `average.without_one_time.display` beside it as the same average with
  those components out. A one-time item is never averaged into a recurring
  figure without being named (CONTEXT.md).

Then `year_by_year.grants`, one per equity line, each by `name` and each year's
`as_valued.display` and `as_claimed.display`. A grant with `unvaluable: true` is
₹0 in every `as_valued` and keeps every `as_claimed`: say both columns, and give
the reason from the component's own `equity.assumption` — the table's rows carry
the figures, and the sentence that explains them lives on the grant above.

`spread` says how the grant reached its years, and it decides what you say:

- `vesting-schedule` — each year carries a `share.display`; say the schedule.
- `recurring` — the letter has no schedule for this line and offers it again
  every year, so the same claimed figure repeats down the column and no `share`
  exists to say. A share purchase plan is the case.
- `lands-in-year-one` — no schedule and not recurring, so the whole of it sits
  in year one.

Never say a share the block does not carry: a grant with no schedule has none,
and supplying one is the invented schedule ADR 0005 forbids.

`cliff_months`, where a grant carries it, is the months before which nothing
vests at all. Say that: an employee leaving inside those months takes none of
the first vest, whatever the row for year one says. Then say the thing the rows
already show — the cliff moved no value between the years, and the schedule is
the one the letter states. The core carries the months; the sentence is yours.

Then `basic`, when the output carries it: `share_of_fixed_pay.display` beside
`totals.fixed_pay.display` and `basic.annual.display`. Name the lines on both
sides of it — `basic.components` above the line, `totals.fixed_pay.components`
below — because a line the user classified inline is in the denominator and can
never be in the numerator, and only the two lists show that. Say the share; do
not say whether it is low, high or worth changing (ADR 0007).

Then `basic.drives`, one fact each, from the fields and never from memory:

- `employer-pf` — the contribution is computed on `wage_base.components` at
  `rate.display`, and `ceiling.monthly.display` is the statutory monthly wage
  ceiling. This block states the rule and applies nothing. Whether the ceiling
  is what *this* employer uses is what `employer_pf` reads off the letter and
  the user confirms, and `take_home.deductions.employee_pf` is the only place
  the decoder applies it — for the employee's own share, never the employer's.
- `gratuity` — it accrues on `wage_base.components`, at `accrual.days_of_wages`
  days of wages per completed year with the monthly wage divided by
  `accrual.days_in_month`, and is payable after `qualifying_service.years` years
  of continuous service. No gratuity figure exists; do not compute one.
- `hra-exemption` — read the citation's `note` before saying anything. The Act
  settles that the exemption exists and leaves its extent to be prescribed; the
  rules file does not carry the limbs, so say the exemption is bounded and that
  the decoder cannot compute the bound.

Then `employer_pf`, where the output carries it and where step 5 did not
already settle it in the user's hearing: the letter's own
`stated_contribution.annual.display`, each entry of `bases` by its `basis`,
`wage.annual.display` and `implied_contribution.annual.display`, and which of
them `implies` names. Say `bases_coincide` where it is true — the two bases are one
wage on this package, and a single answer would read as a choice the figures
cannot support. Say what the user typed as `take_home`'s
`deductions.employee_pf.basis` beside it, and where the two differ, say that
plainly and leave it: the reading is of the letter, the answer is theirs.

Then `take_home`, when the output carries it — the whole point of the second
run, and the figure the user came for.

`take_home.regimes` carries both regimes as two facts of one input. Say both, in
the order they appear, and **never say which is better, which to pick, or which
comes out ahead** — the pair is the answer, not a shortlist (ADR 0007).

For each regime, in this order:

- `assumes`, every name of it, before any figure. These are the conditions the
  figures are only right under — the regime itself, the age band where the
  output names one, residency, and steady state, which is what puts a joining
  bonus, a retiral, a benefit in kind and every equity grant outside these
  numbers. A reader who fails one of them is reading the wrong figure.
- Then each entry of `bases`, saying which basis it is: `variable-pay-at-zero`
  counts no variable pay, `variable-pay-at-target` counts it at the quoted
  target. For each:
  - `recurring_cash.annual.display` and `.monthly.display`, with the
    `components` it is summed from.
  - `deductions.employee_pf`: `contribution.monthly.display` and
    `.annual.display`, the `wage` the `rate.display` was applied to and the
    `wage_components` that wage is summed from. Where `ceiling` is present, say
    `ceiling.monthly.display` and whether `ceiling.applied` — chosen and biting
    is a different fact from chosen and not.
  - `deductions.professional_tax`, where present, by both periods; where absent
    it is in `excludes` instead, and belongs there in your telling too.
  - `deductions.income_tax`: `salary`, `standard_deduction.amount`,
    `total_income.after`, `slabs.total`, `rebate.amount` with whether it
    `applied`, `surcharge.amount` where a `surcharge` block is present, and
    `cess.amount` at `cess.rate.display`, ending on `tax_payable.after.display`.
    Where `surcharge.marginal_relief.applied` is true, say the relief `amount`
    and the `threshold` it measures from. Where `total_income` or `tax_payable`
    differ `before` and `after`, that is the statutory rounding to
    `unit_rupees`: say it as rounding and cite it.
  - `deductions.total`, then `take_home.monthly.display` and
    `take_home.annual.display`. The monthly is the figure the user asked for;
    say it last, and say it is an estimate of a steady-state month.
- `excludes`, every name of it, after the figures. Each is a real deduction or a
  real tax this estimate does not compute, so the take-home above is not the
  last word: HRA exemption and Chapter VI-A deductions would lower the old
  regime's tax, employer NPS the tax under either, and perquisite tax on vesting
  equity raises what is actually withheld in a year equity vests. Where the
  list carries the `Floor:` line, say it: it is what those first two exclusions
  make the old-regime figure, and it is the reason the two regimes' figures are
  not the whole comparison.

Say every figure once per basis and never carry one across regimes: the two
regimes share their gross, their employee provident fund and their professional
tax, and differ only in income tax — that is a fact worth saying, and it is not
licence to quote one regime's take-home under the other's name.

`take_home.break_even`, one entry per basis, is spec #17's single figure: the
Chapter VI-A and HRA deduction at which the old regime's tax on this offer
stops exceeding the new regime's. Say it as one more fact of the input, in the
same voice as the regimes above and never as a recommendation or a verdict —
"if your Chapter VI-A and HRA deductions add up to more than this, the old
regime's computed tax is the lower of the two on this offer" is the shape, not
"the old regime is better above this" or "you should claim more deductions."
Its `kind` names which of three facts this is, and each is said differently:

- `deduction` — say `amount.display`, beside the basis it is on. This is the
  crossing point, not a threshold the user must reach: it says what the two
  regimes' tax do, not what the user should do about it.
- `old-regime-wins-at-zero` — say that the old regime's tax is already at or
  below the new regime's without any Chapter VI-A or HRA deduction at all, so
  there is no positive figure to give. Do not invent one.
- `old-regime-never-wins` — say that no deduction total makes the two
  regimes' tax equal on this offer: the old regime's tax drops from above the
  new regime's straight to below it without ever landing on it exactly (its
  rebate is a cliff, not a taper). Do not round to the nearest figure and
  report that instead.

Every `break_even` entry carries `assumes`, the same as each regime's own —
say it once, before the figure, the same way.

Then `flags`, one at a time. Each carries `code`, the figures in `measured` by
their `display`, and the `names` it is about; say all three. What it stands on
is `kind`, and the three kinds are not interchangeable:

- `heuristic` — an authored threshold, not law. Say so, say
  `threshold.rationale` in the author's own words, and name
  `threshold.heuristics_key` so the user can go and disagree with it. A flag of
  this kind is a judgement this repository wrote down, and the reader is
  entitled to reject it.
- `statute` — say `statement` as the rules file words it, with its `citation`:
  `section`, the `document`'s `title`, its `url`, and the `note` where there is
  one.
- `letter` — it stands on their own offer letter and nothing else. Say `months`
  and what it is a period of, and give no citation, because there is none to
  give.

A flag is a fact with its figures attached. Do not rank flags, do not total
them, do not call a package good or bad because of them, and do not turn one
into something to raise with the employer (ADR 0007). No flags at all is a
finding too: say that nothing crossed a threshold, not that the offer is fine.

Then the conditions in the letter, quoted, each beside the component it
attaches to.

Cite as you go. `classified_by.basis` is a statute (`document` — give its
`title` and link its `url`) or the author's judgement (`rationale` — say it is
judgement and give it). An inline classification has neither: it is the user's
own. Every other figure carries a `citation`: its `section` is the provision,
its `document` the paper, and its `note`, when present, is a caveat to be said
and not paraphrased away.

End with `sources`: every document the output cites, once each, by `title` and
`url`. That list is the whole of the answer to "why should I believe this" —
give it, and do not add a link that is not in it.

Figures are `display` strings, verbatim, and only those: `paise` stays in the
JSON, and a percentage, share or difference exists only once the tool has
emitted it.

End on the facts and the links. If the user asks what they should do with any
of it — negotiate, accept, decline, pick a regime — say plainly that this is not
what the skill does, and offer to go back over any figure and where it came
from instead (ADR 0007).
