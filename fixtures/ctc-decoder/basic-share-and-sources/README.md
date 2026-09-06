# basic-share-and-sources

A package built the way Indian offer letters usually are: basic held down and the
gap filled with a special allowance. Basic is **₹6,00,000** against fixed pay of
**₹22,70,460**, so `basic.share_of_fixed_pay` is **26.42%** — the share, in
integer basis points and as the percentage the core formats, and no judgement
about it anywhere in the output. Whether that share is low, and what a reader
does about it, is not the decoder's to say (ADR 0007).

## What the fixture pins

**The share is computed only from classified components.** The offer's "Site
allowance" is classified inline, so it carries no catalogue entry and cannot be
basic pay whatever it is called; it is in fixed pay, in the denominator, and out
of the numerator. `basic.components` names the one line that is basic pay.

**Three facts about what basic drives**, each a rule and its citation, none of
them a suggestion:

- `employer-pf` — the base the contribution is computed on (`groups.epf.wage_components`),
  the employer's rate (`groups.epf.employer_rate`) and the statutory wage ceiling
  (`groups.epf.wage_ceiling`). No contribution is computed here; the employee's
  own share is computed in `take_home`, and only when the caller types which wage
  the employer uses.
- `gratuity` — the base (`groups.gratuity.wage_components`), the fifteen-days-in-
  twenty-six accrual (`groups.gratuity.accrual`) and the five years of continuous
  service that qualify for it (`groups.gratuity.qualifying_service`). The accrual
  is carried as the statute's two whole numbers, not as a rate: the Act writes
  "fifteen days' wages" and "dividing … by twenty-six", and never their quotient.
- `hra-exemption` — the exemption exists and its extent is prescribed elsewhere
  (`groups.hra.exemption`). **The Act does not state the bound.** Schedule III
  Table Sl. No. 11 condition (b) leaves the extent "as may be prescribed", and
  the rules prescribing it could not be retrieved, so the citation's `note` says
  so and no limb of the exemption is stated. Section 202(2)(a)(i) excludes that
  entry from the new regime by name, which is why `take_home` lists HRA exemption
  among what it does not compute under either regime.

**`sources` is the consolidated list.** Five documents, deduplicated by URL, in
the order the output first cites each: the Code on Wages, the EPF & MP Act, the
Ministry's own reply that states the contribution rate and the wage ceiling, the
Payment of Gratuity Act, and the Income-tax Act. Every `document` cited above it
appears in it, and nothing else does — checked for every fixture, not just this
one, in `test/output-invariants.test.ts`.

The offer types no `pf_wage_base`, so there is no `take_home` block and the
Finance Act is not among the sources: the list is what *this* output rests on,
never a bibliography of the rules file.
