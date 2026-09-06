# pf-base-not-in-the-rules

The same letter as `pf-base-implies-ceiling`, read against a rules file that
does not carry `groups.epf.employer_components` — and the decode succeeds, with
no `employer_pf` block and no rejection.

`employer_components` is how a rules file opts into the employer-contribution
reading at all, the same way `groups.basic_pay` opts into the basic reading.
Without it the decoder does not know which catalogue entry the employer's
contribution is, and it never names one in code (ADR 0004) — so the honest
answer is that this file does not do this reading, not that it is broken. The
`basic` block is still here, because that reading is opted into separately and
is unaffected.

That distinction is the point, and it is the same one `basic.ts` draws: "this
file does not do this reading" and "this file does it, and is incomplete" are
answers to two different questions. This fixture holds the first. Remove
`employer_rate` or `wage_ceiling` *below* the opt-in and you get the second — a
`rule_absent` naming the key — which `basic-drives-rule-absent` already covers.

The pinned `rules/fy2026-27.yaml` here is the repository's own file with that
one node deleted and nothing else changed (ADR 0009). It is test data, and its
head says so.

## External cross-check

None needed: nothing is computed here that is not already asserted by
`pf-base-implies-ceiling` on the same letter. What this fixture asserts is the
**absence** of a block and an exit status of 0.
