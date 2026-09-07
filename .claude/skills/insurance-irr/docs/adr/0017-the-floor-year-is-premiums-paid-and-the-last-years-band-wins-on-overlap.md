# The floor year is `premiums_paid`, and the last-years band wins on overlap

ADR 0008 decided a regulatory floor stands in for a missing surrender or
paid-up figure. Issue #69 builds it, and building it settles four things ADR
0008 left open: which policy year the floor is read for, how a single-premium
policy is told from a regular-premium one, what happens where the
regulation's own bands overlap, and what the guaranteed surrender value
percentage is a percentage *of*.

**The policy year is `premiums_paid`.** ADR 0016 already settled that this
skill's input carries no wall clock: the core never reads today's date, only
`financial_year` and `issued_on`. `premiums_paid` — capped at
`premium_paying_term` by validation — is the only counter of elapsed policy
time the input carries, so it is also the policy year Schedule I, clause
4(A)(a) reads a surrender against: a holder who has paid five premiums is
read as surrendering in policy year 5. For a regular-premium policy with
`premium_paying_term` equal to `policy_term` this is exactly what the clause
means. For a limited-pay policy (`premium_paying_term < policy_term`) it
under-reaches: a holder can surrender years after premiums stop, and this
skill has no field recording that a policy year has passed since. That gap is
accepted rather than closed by adding a field this ticket does not need: the
years the current input cannot express fall out of the schedule's bands
exactly as a genuine smooth-progression year would, and are read as
`insurer-defined`, which is the honest answer to "the tool does not know."

**Single premium is `premium_paying_term === 1`.** The input carries no
separate premium-mode field, and none is added: a policy that pays once has
a premium paying term of one, which is already how `input.ts` tells a
single-premium policy from a regular one everywhere else (the survival
benefit and cap checks). The same limitation as above follows: `premiums_paid`
for a single-premium policy is 0 or 1 by validation, so today's schema can
only ever place a single-premium surrender in policy year 1 — which the
regulation's own 1–3 year band and 90%-in-the-last-two-years band both cover
for a short enough term, and nothing later, again read as `insurer-defined`
rather than guessed.

**A "last two policy years" band beats a fixed-year band on overlap.**
`policy_term` fixes where the last-two-years band sits; when the term is
short enough that it overlaps a fixed range (a one-year single-premium
policy: year 1 is both "years 1–3" and "the last two years"), the regulation
carves the tail out from the general schedule by name, so the tail wins.

**The percentage is of total premiums paid, less survival benefits already
paid.** Clause 4(A)(a) reads a percentage "of the total premiums paid... less
survival benefits, if any, already paid" (per the retrieved text recorded in
`docs/research/insurance-irr-statutory-sources.md` §4) — a money-back
plan's floor is smaller than its raw premium total by whatever it has already
paid out. "Total premiums paid" is `annual_premium × premiums_paid`, before
GST (ADR 0012's cash outflow is what the holder pays the insurer and the
government between them; the regulation's premium is the sum insured under
the contract). "Survival benefits already paid" is the `guaranteed`
scenario's own survival benefits — the only ones the contract actually
guarantees (ADR 0009) — for every year at or before the policy year. The
floor is never read below nil.

## Considered options

- **Refuse a limited-pay or single-premium policy past what `premiums_paid`
  can place in the schedule.** Every other refusal in this skill is a
  structural impossibility (ADR 0016); a holder who has genuinely stopped
  paying and wants a floor is not one.
- **Add an elapsed-policy-years field distinct from `premiums_paid`.**
  Solves the gap properly but is a schema change no fixture in this ticket
  needs; left to whichever later ticket first needs to place a surrender
  after premiums stop.

## Consequences

A regular-premium policy paying every year of its term reads the schedule
exactly as clause 4(A)(a) states it. A limited-pay or single-premium policy
reads it faithfully up to what `premiums_paid` can express, and
`insurer-defined` beyond that — never a guess.
