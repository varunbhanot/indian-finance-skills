# Rules files have one top-level shape, and a rate is named by its key

A `rules/fy<YYYY-YY>.yaml` carries exactly two top-level keys: `financial_year`,
which must match the filename, and `groups`, a map of named groups. Every value
lives inside a group, and a group carries `source` (an https URL) and
`retrieved` (YYYY-MM-DD), with optional `effective_from` / `effective_to`
(ADR 0001). The loader refuses anything else at the top level, so the CI schema
check is "the file loads" rather than a separate walk.

A value whose key is `rate` or ends in `_rate` is a decimal fraction in the file
and integer basis points once loaded (ADR 0002). The loader reads the digits as
written in the YAML source, never through a double, so `0.05` becomes 500
exactly and a fraction with more than four decimal places is refused rather
than truncated. Every other number in a rules file must be a plain integer as
written; a rupee limit stays in whole rupees in the file and passes through the
loader unchanged, and the module that reads it converts it to paise.

## Considered options

**A YAML tag (`!rate 0.05`)** marks rates explicitly but is one more thing a
contributor updating a slab must know, and the parser's default schema would
still hand us a double. **A per-key schema listing every rate** is exact but
duplicates the rules file's structure in code, which ADR 0004 moved out of code
on purpose. A key-name convention is visible in the file itself and needs no
maintenance when a group is added.
