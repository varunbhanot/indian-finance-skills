# Recorded transcripts

What the `ctc-decoder` skill actually said, around the tool calls it actually
made. These are **not** decoder fixtures — `test/fixtures.test.ts` skips this
directory — and nothing here is run by `npm test`. They are the material the
traceability eval replays in CI (ADR 0003, issue #15): recording one needs a
model and is done on demand, and CI only ever reads what is checked in. No API
key lives in this repository.

One directory per transcript, each holding `transcript.json`:

```json
{
  "letter": "guaranteed-recurring-cash",
  "skill": ".claude/skills/ctc-decoder/SKILL.md",
  "recorded": "2026-09-05",
  "events": [
    { "kind": "user", "text": "…" },
    { "kind": "assistant", "text": "…", "step": "3. Confirm" },
    { "kind": "tool", "step": "4. Run", "input": { }, "output": { } }
  ]
}
```

`events` is the conversation in order. `letter` names the fixture whose
`input.json` the transcript was recorded against, so a reader can find the same
package under `fixtures/` and the decoder's own assertions about it. `step`
names the section of `SKILL.md` the turn is following, so a transcript that
drifts from the skill is visible as drift rather than as a difference of
opinion.

A `tool` event's `input` and `output` are exactly what went into and came out of
`npm run ctc-decoder`. There are **two** of them in each transcript here,
because the skill runs the CLI twice: once to decode, and again once the user
has settled `pf_wage_base` (issue #31). The first call's `input` and `output`
are byte-identical to the named fixture's `input.json` and `expected.json`; the
second adds `pf_wage_base` and nothing else.

## The invariant these exist to hold

**Every rupee figure and every URL in an `assistant` turn appears in a `tool`
event's `input` or `output`** (ADR 0003). Checked by hand here, and mechanically
in #15. What that means in practice:

- A figure quoted from the decoder is a `display` string, copied verbatim.
  `₹18,52,500`, never `₹18.5 lakh` and never `18,52,500`.
- A percentage is a `Rate.display`, copied the same way. A share the decoder did
  not emit does not get computed in the narration.
- A figure quoted back to the user **before** the first run — the confirmation
  table in step 3 — is the user's own letter, and it appears as an `amount` in
  the tool input of the run that follows. That is the same rule seen from the
  other side: the confirmation is the typing (ADR 0011).
- A URL is one of the `sources` the output carries. No link is added that the
  output did not cite.

And the other half of ADR 0007: nothing in an `assistant` turn tells the reader
what to do. The transcripts are checked against the same advisory word list
`test/output-invariants.test.ts` holds the decoder's own output to.

## What is here

- **`happy-path`** — the `guaranteed-recurring-cash` letter, decoded end to end
  and narrated in full, ending on a monthly take-home figure under both regimes.
  Its employer PF line lands on `full_basic`, so step 5 is a confirmation rather
  than a question, and it raises **no flags at all** — which the narration says
  as a finding rather than passing over in silence.
- **`unlisted-equity`** — the `unlisted-unvaluable` letter: an ₹80,00,000 ESOP
  grant in a private company, held at ₹0 and named, with the claimed figure kept
  beside it (ADR 0005, ADR 0016). It has no employer PF line, so step 5 falls
  back to the plain question, and it raises all three kinds of flag — heuristic,
  letter and statute — so the narration has to tell law from judgement from
  "this is only what your letter says".
