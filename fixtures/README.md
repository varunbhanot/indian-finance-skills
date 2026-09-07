# Fixtures

One directory per skill, and under it one directory per fixture:
`fixtures/<skill>/<name>/`, each holding `input.json` and either
`expected.json` (the exact stdout, exit 0) or `expected-error.json` (the exact
stderr, exit non-zero). `test/fixtures.test.ts` discovers them and runs every
one through `npm run <skill>`, the same entrypoint that skill uses — the skill
directory *is* the npm script, so a fixture never says which CLI it belongs
to, and `ctc-decoder/` and `insurance-irr/` may each have a `reject-above-cap`.
Nothing is tested below that seam. CONTRIBUTING.md says how to add one, and
the rule that matters most: an expected value comes from an independent source
— a worked example, an official calculator, a hand-checked literal — and never
from running the CLI and pasting what it said.

Each fixture's own README says what it exercises and how its figures were
derived. This file is the index over them: what the suite covers as a whole, and
what it deliberately does not.

`transcripts/` is the one directory here that is not a skill's fixtures. It
holds recorded skill conversations for the traceability eval (ADR 0003, issue
#15) and has its own README.

## ctc-decoder

### Take-home coverage

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

### What no fixture covers, and why

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
- **A one-time payment scheduled into a later year.** A retention bonus paid in
  tranches — part at twelve months, part at twenty-four — cannot be modelled:
  every one-time component lands in year one (`year-by-year.ts`, spread
  `lands-in-year-one`) and there is no input field for the year a payment
  arrives in. Typed as two lines, both tranches would be counted in year one.
  `two-clawbacks-one-letter` covers what *is* supported — two clawback-bound
  lines on different periods, each raising its own flag — and its README records
  what closing this would take.
- **Retaining allowance**, which section 6 counts into the provident fund wage
  base beside basic and dearness allowance. No catalogue entry yet; the `note`
  on `groups.epf.wage_components` says so, and a ticket adding the entry must
  add it to that base too.
- **The second and third surcharge bands, and the 37% top band.** No fixture
  reaches above ₹1 crore of total income. `surcharge-old-regime`'s README
  records a known divergence between the rules file and the Department's engine
  above ₹5 crore, and says plainly that nothing here is asserted on the strength
  of either reading.

## insurance-irr

### The CLI seam and its rejections (issue #65)

Issue #65 validates structure only — no IRR, no comparison column, no
classification exists yet — so every fixture here is either the one acceptance
echo or one of the eleven structural rejections ADR 0016 [insurance-irr]
names, each exercised on its own otherwise-valid policy so the fixture proves
one thing. Four of the eleven share a name with a decoder rejection
(`reject-above-cap`, `reject-fractional-rupees`, `reject-negative-amount`,
`reject-unknown-fy`); the per-skill layout is what lets both exist.

| What it exercises | Fixture |
|---|---|
| A well-formed policy accepted and echoed back — figures as `Money`, rates as `Rate`, a benchmark's typed source folded into `sources` | `accepts-a-policy` |
| Premium paying term longer than the policy term | `reject-ppt-exceeds-pt` |
| More premiums paid than the paying term has | `reject-premiums-paid-exceeds-ppt` |
| A survival benefit scheduled outside the policy term | `reject-survival-benefit-outside-term` |
| A scenario list without `guaranteed` first | `reject-scenarios-without-guaranteed-first` |
| A duplicate scenario name | `reject-duplicate-scenario` |
| A fractional rupee | `reject-fractional-rupees` |
| A negative amount | `reject-negative-amount` |
| A figure above the ₹100 crore cap | `reject-above-cap` |
| A rate outside −9999..10000 basis points | `reject-rate-out-of-range` |
| An unknown financial year | `reject-unknown-fy` |
| An in-force policy (`premiums_paid ≥ 1`) with no `issued_on` | `reject-in-force-without-issued-on` |

What this ticket deliberately does not refuse — a term premium at or above the
policy premium, a surrender value above premiums paid, a paid-up benefit above
the maturity benefit — has no rejection fixture, because there is no rejection
to assert; a later ticket classifies these instead (ADR 0016 [insurance-irr]).

### The solver: nominal IRR, real return, the inflation target (issue #66)

Every scenario's cash flows are now reduced to a nominal IRR (ADR 0003, ADR
0004) and, when one is found, a real return against the typed inflation
figure by the Fisher relation (ADR 0005). `classifications` and its
`comparison` kind (ADR 0015) are new here too, and `accepts-a-policy`'s golden
grew both fields on its two scenarios rather than gaining a sibling fixture,
since it was already the one policy proving a well-formed input is accepted
and echoed back.

Every expected IRR and real return below was hand-checked to the basis point
by an independent script performing the same roll-forward in exact
arbitrary-precision (`BigInt`) arithmetic — never by running the CLI and
pasting what it said — and cross-checked against the CLI's own output only
afterwards, to confirm the two agree.

| What it exercises | Fixture |
|---|---|
| A plain multi-year endowment: level premiums, one maturity payout, a single sign change, no classification fires | `endowment-flat` |
| A money-back pattern paying out every fourth year: `multiple-sign-changes` (more than one sign change in the flow sequence) alongside `real-return-negative` | `money-back-every-fourth-year` |
| Benefits nominally less than premiums paid in: a negative IRR, reported rather than refused | `negative-irr` |
| A one-year policy whose reconciling rate is beyond 100%: `rate_bp: null`, `above-search-range`, no real return | `above-search-range` |
| A round 6% nominal IRR against 10% typed inflation: the Fisher relation's `method` field, and `real-return-negative` | `real-return-fisher` |
| A typed inflation figure that exactly equals `groups.inflation_target`'s rate: the rules citation and its `assumption` sentence, folded into `sources` | `inflation-target-proposed` |
| `rules/fy2026-27.yaml` carrying no `inflation_target` group at all | `reject-inflation-target-absent` |
| `inflation_target` present but missing the `title` its citation needs | `reject-inflation-target-invalid` |

The last two pin their own `rules/` (ADR 0009 [ctc-decoder]) rather than the
repository's, the same way the CTC decoder's own `rule-absent` and
`reject-invalid-catalogue-entry` do — this is the first ticket to read a
rules group besides `financial_year` itself, so nothing before it could
exercise `rule_absent` or `rules_file_invalid` from this skill's own reader
(`inflation-target.ts`).

The roll-forward's own intermediate balance can, at a search candidate far
from where a real policy's flows ever cross zero (a term of ten years or more
bisected all the way up towards the 10000 bp ceiling), grow past what a safe
integer product can hold before `irr.ts` divides it back down. None of the six
fixtures above happens to reach that magnitude, so none of them is what proves
the clamp that keeps it a safe integer regardless — `accepts-a-policy`'s own
twenty-year term already does, now that its golden carries an IRR for both of
its scenarios.

### GST on the premium (issue #67)

Every scenario's cash outflow is now the typed premium plus GST (ADR 0012),
not the bare premium: `gst_on_premium` carries the rate `groups.gst.individual_life_insurance`
holds today, its citation, and the resulting `cash_outflow`, which is what
every IRR above reconciles from here on. At today's nil rate the arithmetic
is a no-op, so all seven fixtures above gained `gst_on_premium` on their
goldens (rate 0%, `cash_outflow` equal to `annual_premium`) and a
`Notification No. 16/2025-Central Tax (Rate)` entry in `sources`, with no
change to any IRR or real return they already asserted.

| What it exercises | Fixture |
|---|---|
| The nil rate cited on a fresh one-year policy: `gst_on_premium.rate` at 0%, `cash_outflow` equal to the premium, the notification folded into `sources` | `gst-nil-cited` |
| A pinned `rules/` carrying a synthetic non-nil rate: the cash outflow *and* the IRR both move from what the same premium and maturity benefit would give at nil, with no code change | `gst-rate-moved` |

Both fixtures' figures were derived independently before the CLI was run
once to confirm them, never the other way round. Each is a single premium
year, which makes the arithmetic exact by hand: `gst-nil-cited`'s ₹2,20,000
maturity on a ₹2,00,000 outflow is `200000 × 1.10 = 220000`, an exact 10%,
and its real return follows the Fisher relation already hand-checked
elsewhere in this file. `gst-rate-moved`'s pinned 12% rate turns a
₹1,00,000 premium into a ₹1,12,000 cash outflow, and its ₹1,17,600 maturity
is exactly `112000 × 1.05`, an exact 5% — a different rate from what the
same premium and maturity would reconcile to at the shipped nil rate, which
is the point: the rules file moved the outflow, and the outflow moved the
IRR, with nothing in `src/core` touched.

`gst-rate-moved` pins its own `rules/` (ADR 0009 [ctc-decoder]) the same way
`reject-inflation-target-absent` and `reject-inflation-target-invalid` do,
carrying `inflation_target` unchanged from the shipped file (`gst.ts` is
read after `inflation-target.ts`, so a policy year still has to resolve)
and a `gst.individual_life_insurance` of 12% that is test-only and cites
nothing real — the shipped `rules/fy2026-27.yaml` carries the actual, nil
rate and its notification, and no fixture anywhere in this suite carries
the historical 4.5% or 2.25% rates the PRD described, since group policies
and pre-repeal premiums are both out of scope (ADR 0012).
