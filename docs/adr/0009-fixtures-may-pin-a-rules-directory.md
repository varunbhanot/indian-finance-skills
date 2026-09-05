# A fixture may pin its own rules directory

Two behaviours the decoder must have can only be shown against a rules file this
repository does not ship: reporting a rule as **absent** rather than defaulting
it, and classifying a component type that exists **only** in the rules file, with
no code change. Both are checked at the CLI seam, so a fixture directory may hold
a `rules/` subdirectory, and the fixture runner points the decoder at it through
the `CTC_DECODER_RULES_DIR` environment variable — a repository-relative
directory name, defaulting to `rules`.

This is the only back door in the decoder, and it is deliberately outside the
JSON contract: the input document cannot name a rules directory, so a skill or a
user cannot reach it, and the seam stays "JSON in, JSON out" (ADR 0003).

## Considered options

**A second CLI flag** for the rules directory puts the affordance in the contract
the skill uses, where it would eventually be passed by something that is not a
test.

**A rules file for a fictional financial year** checked into `rules/` (say
`fy1999-00.yaml` with no catalogue) keeps everything in one directory, but it
puts a document that is not sourced statutory fact into the directory whose whole
promise is that everything in it is (ADR 0001), and CI's schema check would
police it as though it were.
