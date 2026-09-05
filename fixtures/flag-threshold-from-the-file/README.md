# flag-threshold-from-the-file

**The proof that a threshold is data and not code.**

`input.json` is byte-identical to `fixtures/no-flags`, which raises nothing at
all. This fixture pins its own `heuristics.yaml`, identical to the repository's
but for one number — the basic-pay band's floor moved from 40% to 60% — and the
same decoder, unchanged, raises `basic-share` against it.

`₹10,00,000 ÷ ₹20,00,000 = 50%`: above a 40% floor, below a 60% one.

That is ticket #13's "changing a threshold changes flag behaviour with no code
change", shown at the CLI seam rather than asserted. The fixture runner pins the
file through `CTC_DECODER_HEURISTICS_FILE`, the same test affordance ADR 0009
established for rules directories, and for the same reason: a document this
repository does not ship, reachable without a second CLI seam.
