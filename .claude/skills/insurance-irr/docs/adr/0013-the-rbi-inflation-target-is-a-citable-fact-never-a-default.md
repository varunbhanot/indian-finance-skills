# The RBI inflation target is a citable fact, never a default

Inflation is a typed benchmark with no default (ADR 0005), and the skill may
propose a figure with its source (ADR 0002). A primary source exists: the
Government's notification under §45ZA of the Reserve Bank of India Act fixing
the CPI inflation target at 4%, band 2–6%, for 1 April 2026 to 31 March 2031,
published on RBI's own site. It is a target — not a measurement, not a
forecast — but it is a statutory fact with a URL, which is what `rules/`
holds.

We decided the rules file carries an `inflation_target` group (rate, band,
period, source) that the core does **not** read as a default: `inflation_bp`
stays mandatory input. When the skill proposes the target it cites the
checked-in source rather than a search, and when the user confirms it the
output carries `inflation: { bp, source: <the rules citation>, assumption:
"user-confirmed; a statutory target, not a forecast" }`. A user who types
another figure gets `source: user-typed`. The assumption sentence is authored
in the core beside the branch it describes, the CTC decoder's ADR 0016
pattern.

## Considered options

- **The target as the default** when `inflation_bp` is absent. Makes the tool
  choose a benchmark (ADR 0002), and a target used as an expectation is a claim
  RBI itself does not make.
- **Nothing in rules; the skill searches each time.** The same fact re-found
  every conversation by a search whose result the repository cannot check.
