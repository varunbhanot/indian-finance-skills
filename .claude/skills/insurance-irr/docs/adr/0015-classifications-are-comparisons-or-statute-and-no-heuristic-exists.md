# Classifications are comparisons or statute, and no heuristic exists

ADR 0001 replaces the PRD's verdict banner with classifications — stated
facts about the figures. The CTC decoder's flags come in three kinds:
`heuristic` (an authored threshold in `heuristics.yaml` with a rationale),
`statute` (a rule from the rules file) and `letter` (the user's own document).
We decided this skill's classifications are of two kinds only, and that it
carries no entry in `heuristics.yaml`:

- **`comparison`** — two figures both present in the output, and which side
  the first landed on. `real-return-negative` (nominal IRR against typed
  inflation, per scenario), `irr-below-rules-benchmark` (nominal IRR against
  the PPF rate, per scenario), and `largest-terminal-figure` (which column
  pre-purchase, or which row in-force, is largest — emitted once per benchmark
  column, naming the assumptions that column rests on: the typed benchmark,
  `net_of_tax`, `held-flat-from`). A comparison carries no citation and no
  rationale, because both figures are right there. The solver's own
  `multiple-sign-changes` and `above-search-range` (ADR 0004) sit beside them.
- **`statute`** — a condition from the rules file with its citation:
  `below-regulatory-floor` (ADR 0008), `exceeds-ppf-ceiling` (ADR 0011),
  `scenario-not-regulatory` (ADR 0009), and the four taxability codes
  (ADR 0010).

Every classification carries the figures it compares by their `display`
strings, as the decoder's flags carry `measured`.

The PRD's "Poor Investment Vehicle" would need an authored threshold — "an IRR
below X% is poor" — and that is the one thing in this design that would let a
future reader tune the tool's opinion of a product. The table gives the reader
the IRR beside PPF and inflation instead, and the two comparison codes say
which side it landed on. `largest-terminal-figure` is the nearest thing to
the PRD's recommendation, and it is a fact about a table.

## Consequences

A `heuristic` classification later — say, "an IRR more than N bp below PPF" as
a named shape — is an additive change to `heuristics.yaml` with its own
rationale, and nothing here blocks it. `kind: comparison` is new to the
repository: the decoder has no flag that compares two of its own outputs.
