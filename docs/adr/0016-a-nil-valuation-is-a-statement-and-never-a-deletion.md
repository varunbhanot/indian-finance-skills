# A nil valuation is a statement, so it carries its assumption and never deletes the claim

ADR 0005 settled that illiquid equity is held at ₹0 and always named. Applying
it turned out to need three smaller decisions, each of which a later reader
would otherwise reverse by accident.

**The assumption text lives in the core, not in a rules file.** Every valuation
carries a sentence saying what was assumed to reach the figure, because "₹0" and
"₹36,00,000 held flat" are both read as forecasts unless something says they are
not. That sentence describes what the code did — which branch ran, and why it
declined to guess — so it sits beside the branch that chose it, in
`src/core/ctc-decoder/equity.ts`. A rules file holds sourced statutory fact
(ADR 0001) and `heuristics.yaml` holds authored judgement (ADR 0006); a
description of the core's own behaviour is neither, and putting it in either
would let it drift from the branch it describes with nothing to catch that.
What *is* statutory about a grant — that its value is salary — is not in the
core at all: `groups.perquisite.equity` carries it, keyed by instrument.

**A nil valuation never touches the claimed figure.** A grant the decoder holds
at nil is still in `headline_ctc` and still in `equity_as_claimed` at what the
letter counted it as, because those are readings of the letter and not of the
shares. Only `equity_as_valued` moves. The alternative — dropping a nil-valued
grant out of the claimed totals — would hide the gap the decoder exists to
show, and would make "as claimed" mean something other than what was claimed.
So the two totals are reported side by side and their distance is never
computed: reading it is the user's, and stating it would be the decoder
weighing an offer (ADR 0007).

**The vesting schedule is required of anything that vests, and refused unless it
accounts for the whole grant.** A grant with no schedule is the annualised scalar
ADR 0005 rules out, and a schedule summing to anything but 10000 basis points
describes a grant the letter has not fully described. The decoder refuses both
rather than filling in the difference, because filling it in is exactly how a
back-loaded 5/15/40/40 becomes the flat four-year average this reading exists to
take apart. A share purchase plan is the one instrument that reaches no such
question: it has nothing to vest, and requiring a schedule of it would only get
`years: [10000]` typed in to satisfy the field — invented input wearing the
clothes of something read off a letter, which is the failure the rule exists to
prevent.

Ticket #8 names five methods, and the two that are not in ADR 0005 narrow it
rather than extend it. `claimed-as-grant-date-value` values a listed grant from
the letter's own claim, which is the number the decoder distrusts — so the method
name says whose number it is, and the assumption says the figure rests on the
letter rather than on a market quote. `employee-funded` holds a share purchase
plan at nil, and "nil in every total" means nil in every total of *value*: the
claim stays in `headline_ctc` and `equity_as_claimed`, because the letter did
count it and hiding that would be the decoder editing the offer.

Two consequences of the same principle bind the input. A grant the decoder holds
at nil is still described: units, a strike, and a price per share from the last
funding round are all carried into the output where the letter states them, and
the assumption says why none of them was multiplied out — the branch that exists
for unlisted letters cannot be the one that rejects them. And the equity form
requires an instrument while every other form refuses one, because the
instrument is what picks the method; a grant without one could not be valued at
all, and a salary line with one carries an answer to a question nobody asked of
it.

## Consequences

Adding a valuation method means adding its assumption in the same commit; the
`ValuationMethod` union and the `ASSUMPTIONS` map are keyed alike so the
compiler asks for it. A financial year whose rules file carries no
`groups.perquisite.equity` cannot value any grant at all: it reports
`rule_absent` naming the key, rather than valuing the grant and omitting the tax
treatment.
