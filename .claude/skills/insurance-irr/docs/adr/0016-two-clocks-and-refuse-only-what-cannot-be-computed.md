# Two clocks, and refuse only what cannot be computed

This skill's rules span two clocks. GST, the PPF rate and the inflation target
are facts *today*; the taxability date bands (ADR 0010) turn on when the policy
was *issued*, and an in-force policy from 2015 is evaluated in 2026. We
decided the input carries two fields: `financial_year`, the year the
evaluation is done in, picks the rules file exactly as the CTC decoder's does;
`issued_on` (`YYYY-MM-DD`) is the policy's issue date and is read only by the
taxability bands. Pre-purchase it may be absent, and absence means "issued on
or after today", so the current bands apply and the output says so. In force
(`premiums_paid ≥ 1`) it is required: there is no honest default for a date
the policy schedule states.

The CLI refuses only what cannot be computed, each with its own
`expected-error.json` fixture: a premium paying term longer than the policy
term; more premiums paid than the term has; a survival benefit scheduled
outside years 1..PT; a scenario list without `guaranteed` first, or with a
duplicate name; a fractional rupee; a negative amount; any single figure, or
the total of all flows, above the ₹100 crore cap the repository already
enforces; a typed rate outside −9999..10000 basis points; an unknown
financial year; `issued_on` missing on an in-force policy.

Everything else computes and is classified. A term premium at or above the
policy premium gives a ₹0 alternative column with `nothing-left-to-invest`,
not a refusal. A surrender value above total premiums paid is not questioned,
nor a paid-up benefit above the maturity benefit: the insurer's figures are
the insurer's. This is the repository's existing line — a provident fund
contribution matching neither base is reported, never refused — and every
rejection above is a structural impossibility, not a judgement about the
figures.
