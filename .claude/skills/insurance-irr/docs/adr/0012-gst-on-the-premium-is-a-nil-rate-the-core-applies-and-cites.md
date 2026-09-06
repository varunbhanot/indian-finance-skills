# GST on the premium is a nil rate the core applies and cites

The PRD models GST on premiums at 4.5% in year one and 2.25% thereafter, with
a "premium inclusive vs exclusive" input. Notification No. 16/2025-Central Tax
(Rate) nil-rated life insurance where the insured is an individual (or
individual and family) from 22 September 2025 — term, linked and non-linked
alike — so for FY 2026-27 the PRD's rates describe the repealed position. The
persona will still be told "plus GST" by an adviser working from an old script.

We decided the rules file carries `gst.individual_life_insurance` with a nil
rate, the notification as source and its effective date; the typed premium is
always the pre-GST premium a quote states; the core computes the cash outflow
as `premium × (1 + rate)` and emits `gst_on_premium: { rate, source,
cash_outflow }`. At nil the arithmetic is a no-op, but the output *cites* that
it is nil, which is what answers the adviser, and a fixture with a pinned
`rules/` directory carrying a non-nil rate shows the outflow moving, so a
repeal is data. The inclusive/exclusive input is dropped: at a nil rate it
distinguishes nothing, and reinstating it is a one-field ticket.

Group policies, which stay at 18%, are out of scope: the persona is an
individual, and the group's description says so.

## Considered options

- **Drop GST from v1 entirely.** The output could not then say the premium is
  GST-free, or point at why.
- **Keep the historical two-tier rates with an `effective_to`** so a policy
  bought before September 2025 is evaluated on its actual outflows. Those
  premiums are sunk (ADR 0007) and never enter a figure, so the rates would be
  data nothing reads.
