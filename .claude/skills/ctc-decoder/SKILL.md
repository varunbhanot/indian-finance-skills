---
name: ctc-decoder
description: Decode an offer letter's CTC into guaranteed recurring cash and what the rest actually is. Use when the user has an offer letter, a CTC or salary breakdown, or asks what part of a package is guaranteed, cash, or recurring. Takes a document they hand over, pasted lines, or typed figures.
---

Decode a CTC into what is guaranteed, cash and recurring, and what the rest
actually is. The core does every sum and every classification; this skill
gathers the input, confirms it, runs the CLI, and narrates the JSON. Every
rupee figure you say is a `display` string copied from the tool's input or
output, never a number you formed (ADR 0003). You state what is true and link
its source; what to negotiate, accept or reject is the user's, and you leave it
with them (ADR 0007).

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

The catalogue types are the keys under `groups.components.entries` in
`rules/fy<YYYY-YY>.yaml`; read them from the file. A line no type fits is
classified inline with `certainty`, `form` and `recurring` — three questions to
the user, whose answers are theirs.

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
      "certainty": "guaranteed", "form": "cash-now", "recurring": true }
  ]
}
```

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
conditions. Ask the user to correct anything.

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

## 5. Narrate

Lead with `totals.guaranteed_recurring_cash` beside `totals.headline_ctc`,
each by its `display` string and the `components` it names. Say the two side
by side; their difference is not a figure the tool emitted.

Then every component that does not count toward guaranteed recurring cash,
with the reason read off its own `certainty`, `form` and `recurring` — the
reason is on the component, and it is the only one you give.

Then the remaining totals — `variable_pay_at_target`, `retirals`,
`one_time_components`, `benefits_in_kind` — each by `display` with its
constituent names, and `clawback_months` on any component that carries it.

Then `basic`, when the output carries it: `share_of_fixed_pay.display` beside
`totals.fixed_pay.display` and `basic.annual.display`. Name the lines on both
sides of it — `basic.components` above the line, `totals.fixed_pay.components`
below — because a line the user classified inline is in the denominator and can
never be in the numerator, and only the two lists show that. Say the share; do
not say whether it is low, high or worth changing (ADR 0007).

Then `basic.drives`, one fact each, from the fields and never from memory:

- `employer-pf` — the contribution is computed on `wage_base.components` at
  `rate.display`, and `ceiling.monthly.display` is the statutory monthly wage
  ceiling. Say whether the ceiling applies to this employee only if the output
  says so, which it does not here: `take_home.deductions.employee_pf` is the
  only place the decoder applies it, and only for the employee's own share.
- `gratuity` — it accrues on `wage_base.components`, at `accrual.days_of_wages`
  days of wages per completed year with the monthly wage divided by
  `accrual.days_in_month`, and is payable after `qualifying_service.years` years
  of continuous service. No gratuity figure exists; do not compute one.
- `hra-exemption` — read the citation's `note` before saying anything. The Act
  settles that the exemption exists and leaves its extent to be prescribed; the
  rules file does not carry the limbs, so say the exemption is bounded and that
  the decoder cannot compute the bound.

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

End on the facts and the links. This skill does not yet gather the one thing
take-home needs (`pf_wage_base`), so the output carries no `take_home` block;
equity value and the year-by-year view are not in the output at all. When asked
for any of them, say which of the two it is.
