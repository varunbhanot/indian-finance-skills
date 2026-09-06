# two-clawbacks-one-letter

Two clawback-bound lines in one letter, on different periods (issue #40). The
existing clawback fixtures — `one-time-clawback` and `flag-clawback` — each
carry exactly one, so nothing until now showed that a second raises its own
flag rather than being folded into the first, or that the periods stay attached
to their own lines.

The same package as `one-time-clawback` with a **retention bonus of ₹5,00,000**
added, clawing back for 24 months against the joining bonus's 12. Two flags
result, one per line, each naming its own amount and its own period. That is
the whole claim: a clawback flag is `kind: letter` and belongs to a component,
so two of them are two facts about two lines and not one fact about the letter.

The two lines also differ on the certainty axis, which is the reason for
choosing a retention bonus as the second rather than another joining bonus. A
joining bonus is `guaranteed` — promised for turning up. A retention bonus is
`conditional-on-tenure` — paid only if the employee is still there on the date
the letter names. Both are `cash-now` and neither recurs, so both land outside
guaranteed recurring cash and both sit in year one, by different routes.

## How the expected values were derived

Hand-derived from `one-time-clawback`'s golden, changing only what the added
₹5,00,000 line provably changes. Computed before the decoder was run:

| | `one-time-clawback` | this fixture | |
|---|---|---|---|
| `headline_ctc` | ₹15,00,000 | **₹20,00,000** | 12,00,000 + 3,00,000 + 5,00,000 |
| `fixed_pay` | ₹15,00,000 | **₹20,00,000** | the letter quotes no variable pay, so it is the headline |
| `one_time_components` | ₹3,00,000 | **₹8,00,000** | joining ₹3,00,000 + retention ₹5,00,000 |
| `guaranteed_recurring_cash` | ₹12,00,000 | ₹12,00,000 | basic alone; neither bonus recurs |
| `basic.share_of_fixed_pay` | 80% | **60%** | 12,00,000 ÷ 20,00,000 |
| year one | ₹15,00,000 | **₹20,00,000** | 12,00,000 recurring + 8,00,000 landing |
| four-year average with one-time | ₹12,75,000 | **₹14,00,000** | (20,00,000 + 12,00,000 × 3) ÷ 4 |
| `one-time-share` | 20% | **40%** | 8,00,000 ÷ 20,00,000, against the authored 15% |

Basic's share falls to 60% and stays well above the authored 40% floor, so no
`basic-share` flag fires; there are no retirals or benefits in kind, so nothing
non-cash fires either. The three flags are the one-time share and the two
clawbacks, in that order.

## What this fixture cannot say

A retention bonus paid in **tranches** — ₹2,00,000 at twelve months, ₹3,00,000
at twenty-four — is a shape real letters print, and the decoder cannot model it.
Every one-time component lands in year one (`year-by-year.ts`, spread
`lands-in-year-one`); there is no field for the year a payment arrives in. Typed
as two lines, both tranches would be counted in year one, overstating it and
understating year two.

So this fixture types one retention bonus and not two, and the limit is recorded
rather than asserted around. Closing it means an input field for the year a
one-time component lands in, and a year-by-year table that reads it — a ticket,
not a fixture.

## External cross-check

None available, and none needed: every figure above is a sum or a share of
figures typed on the letter, and the two classifications come from the rules
file's own catalogue entries (`joining_bonus`, `retention_bonus`), each carrying
its own rationale. No statutory rate enters this fixture at all.
