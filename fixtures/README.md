# Fixtures

One directory per fixture, each holding `input.json` and either `expected.json`
(the exact stdout, exit 0) or `expected-error.json` (the exact stderr, exit
non-zero). `test/fixtures.test.ts` discovers them and runs every one through
`npm run ctc-decoder`, the same entrypoint the skill uses. Nothing is tested
below that seam. CONTRIBUTING.md says how to add one, and the rule that matters
most: an expected value comes from an independent source — a worked example, an
official calculator, a hand-checked literal — and never from running the decoder
and pasting what it said.

Each fixture's own README says what it exercises and how its figures were
derived. This file is the index over them: what the suite covers as a whole, and
what it deliberately does not.

`transcripts/` is the one directory here that is not a fixture. It holds
recorded skill conversations for the traceability eval (ADR 0003, issue #15) and
has its own README.

## Take-home coverage

Take-home is the reading with the most moving parts — two regimes, two bases,
the provident fund wage base, the slabs, the rebate, surcharge, marginal relief,
the cess and two statutory roundings — so this is the scenario set it is held
to (issue #39). Every row names the fixture that asserts it.

| Scenario | Fixture |
|---|---|
| Mid-range package, new regime named | `take-home-new-regime` |
| The same package, old regime named | `take-home-old-regime` |
| Rebate wiping out the slab tax, new regime | `take-home-new-regime-rebate` |
| Rebate at the old regime's own threshold | `take-home-old-regime-rebate` |
| Nil tax under both regimes, before any rebate | `take-home-below-the-first-slab` |
| Provident fund on the whole of basic | `take-home-new-regime` |
| Provident fund capped at the statutory ceiling | `pf-statutory-ceiling` |
| A ceiling typed that does not bite | `take-home-below-the-first-slab` |
| A wage base of basic **and** dearness allowance | `take-home-below-the-first-slab` |
| Typed wage base contradicted by the letter | `pf-statutory-ceiling`, `pf-base-typed-full-implies-ceiling` |
| Professional tax typed | `professional-tax-typed` |
| Professional tax absent, so named in `excludes` | `take-home-new-regime` |
| Surcharge in the first band, both regimes | `surcharge-new-regime`, `surcharge-old-regime` |
| Just below the surcharge threshold | `below-surcharge-threshold` |
| Marginal relief biting | `marginal-relief` |
| The statutory ₹10 rounding at its boundary | `rounding-boundary` |
| Break-even deduction found | `break-even-mid-income`, `break-even-rebate-boundary` |
| Break-even: the old regime never catches up | `break-even-old-never-wins` |
| Break-even: the old regime already wins at zero | `take-home-old-regime-rebate`, `take-home-below-the-first-slab` |

Fixtures without a `take_home` block are not gaps in it. They exercise
classification, equity valuation, the year-by-year table, the flags and the
rejections, none of which needs a typed `pf_wage_base`; adding one would assert
the same take-home arithmetic again under a different name rather than cover
anything new.

## What no fixture covers, and why

These are limits of the decoder rather than holes in the suite. The skill's
[README](../.claude/skills/ctc-decoder/README.md) lists them for a reader; this
is where they are recorded against the tests (issue #40).

- **A flexible benefit plan as a single line.** Annexures that print one "FBP",
  "flexi pay" or "choice pay" basket, with the sub-heads left for the employee
  to claim, have no catalogue entry. Deferred rather than guessed at: what the
  unclaimed remainder becomes is a product decision (it is usually paid out as a
  taxable special allowance, but not always, and not on every letter), and
  ADR 0004 puts a classification in the rules file rather than in code. Until an
  entry exists, such a basket is typed as its components or classified inline.
- **An annexure with no basic at all.** The same letters, read the same way: the
  decoder does not synthesise a basic it was not given, so `basic` and every
  reading that depends on it are simply absent.
- **Messy source documents** — mixed ₹/Rs/INR glyphs, p.a. against p.m., an OCR
  of a scan. This is the skill's path rather than the core's: nothing about it
  can be asserted at the CLI seam, since the core takes typed JSON only
  (ADR 0011). It belongs in `transcripts/`, where the eval reads what the model
  actually said.
- **Employer PF described as "over and above" the headline CTC.** The decoder
  reads the amount, not the sentence around it. A letter wording it that way
  decodes correctly component by component; what the wording does to the
  headline is the skill's to raise with the user.
- **Professional tax by state, and its calendar.** Typed as one annual figure.
  Maharashtra's ₹300 February and Tamil Nadu's half-yearly cycle are not
  modelled, and no state table ships.
- **Employees' state insurance.** Not in the rules file at all, so a low-wage
  letter where ESI bites is missing a deduction. `take-home-below-the-first-slab`
  is such a letter, and asserts the figures the decoder does compute.
- **Retaining allowance**, which section 6 counts into the provident fund wage
  base beside basic and dearness allowance. No catalogue entry yet; the `note`
  on `groups.epf.wage_components` says so, and a ticket adding the entry must
  add it to that base too.
- **The second and third surcharge bands, and the 37% top band.** No fixture
  reaches above ₹1 crore of total income. `surcharge-old-regime`'s README
  records a known divergence between the rules file and the Department's engine
  above ₹5 crore, and says plainly that nothing here is asserted on the strength
  of either reading.
