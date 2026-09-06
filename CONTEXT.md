# Context

The domain language of this project. Glossary only — no implementation
details, no decisions (those live in each skill's own `docs/adr/`, under
`.claude/skills/<name>/`).

## Tax year

**Financial Year (FY)** — the year income is earned, 1 April to 31 March.
Written `2026-27`. All rule values are scoped to an FY.

**Assessment Year (AY)** — the year that FY's income is assessed and filed,
always FY + 1. FY 2026-27 is assessed in AY 2027-28. Rule files are named by
FY, never by AY, because the user typing numbers in is thinking about the
year they earned them.

## Income tax

**Regime** — one of the two systems a taxpayer may choose for computing
income tax: the **old regime** (lower base exemptions, wide deductions such
as 80C and HRA) or the **new regime** (higher exemptions, almost no
deductions). Not a synonym for "tax rate" or "slab": a regime is the whole
system, and each regime has its own slabs, its own standard deduction, and
its own set of permitted deductions.

**Slab** — one band in a regime's progressive rate table: an upper bound and
the rate applying to income within that band. Slabs are ordered; the final
slab has no upper bound.

**Surcharge** — an additional charge on the income-tax itself, not on income, at
a rate fixed by the total income. It applies only above a threshold well beyond
the top slab, and it is banded like a slab table but applies differently: the
band's rate is charged on the *whole* income-tax, not on the income inside the
band. A regime's surcharge bands are its own — the new regime's stop lower than
the old regime's.

**Marginal relief** — the statutory ceiling that stops crossing a surcharge
threshold costing more than it earns: income-tax plus surcharge may not exceed
what they came to *at* the threshold plus every rupee of income above it. It is
not a deduction and not a rebate — it is a cap, and what it takes off is the
surcharge. It does not cap the cess charged on the two, so a rupee above a
threshold still costs the cess on its own tax. Distinct from the **rebate's** own
marginal relief, which is a different provision about a different threshold.

**Statutory rounding** — the two points where the Income-tax Act requires a
figure to be rounded: **total income**, before the slabs are walked, and **tax
payable**, after the cess. Nothing else is rounded; intermediate figures are
carried at full precision, which is why a take-home figure can end in paise
while the tax inside it does not.

For FY 2026-27 both are **§516** of the Income-tax Act, 2025, and both round to
the nearest **₹10** — paise dropped first, then the last figure decides: five or
more rounds up, less than five rounds down. One section, two points of
application.

The historical aliases are **§288A** (total income, ₹10) and **§288B** (tax
payable, ₹1) of the Income-tax Act, 1961, which §536(1) of the 2025 Act
repealed. They are worth knowing because every Indian tax reference written
before 2026 uses them, and because **§288B's ₹1 unit did not survive**: under
the 2025 Act tax payable rounds to ₹10, not to ₹1. A rule or ticket that assumes
a ₹1 rounding of tax is describing the repealed Act.

## Pay

**CTC (Cost to Company)** — the headline annual figure on an offer letter: the
total the employer books as the cost of employing you. Includes components you
never receive as cash, and components you may never receive at all. It is a
number to be decoded, not a number to be compared.

**Guaranteed recurring cash** — the annual cash actually received if every
performance-linked component pays zero, no tenure condition is met, and no
equity is sold. Derived, not listed: the components that are simultaneously
guaranteed, cash now, and recurring. This is the honest figure for comparing
two offers.

**Fixed pay** — the components not contingent on performance. Not a synonym for
guaranteed recurring cash: fixed pay may still include one-time items.

**Variable pay** — performance-linked, typically quoted at 100% of target. The
target is not the payout.

**Basic** — the base component. Drives employer PF, gratuity and HRA exemption,
so its share of the package changes outcomes well beyond its own value.

**Dearness allowance** — a cost-of-living component paid with basic, fixed by
some letters ("FDA") and indexed to a price index by others. The second head of
wages after basic pay (Code on Wages §2(y)(ii)), and never a synonym for it: it
sits inside the provident fund and gratuity wage bases beside basic, and outside
basic pay. A letter whose basic is below the PF ceiling but whose basic plus
dearness allowance reaches it is at the ceiling.

**Wage base** — the components a statutory rule computes on, as that rule
defines them, not as an offer letter groups them. Each rule has its own: the
provident fund's is basic wages, dearness allowance and retaining allowance
(EPF & MP Act §2(b), §6); gratuity's is wages including dearness allowance but
excluding house rent allowance and any other allowance (Payment of Gratuity Act
§2(s)). Basic sits inside every one of them, which is why it drives all three.

**PF wage base** — which wage an employer actually computes the provident fund
contribution on: the whole of its wage base — basic, and dearness allowance
where the letter has one — or that wage capped at the statutory monthly
ceiling. Both are ordinary, the difference is thousands of rupees a month, and
an offer letter never states the choice — it states the employer's contribution
*amount*, from which the choice can be read back. The decoder reads it and says
what the letter implies; the user still says what is true, and the two are
allowed to disagree. A contribution matching neither base is reported as
matching neither, never refused.

**Retirals** — employer contributions counted in CTC but not received as cash
now: employer PF, gratuity provision, employer NPS. The decoder derives the
retirals total from the classification rather than that list — everything
counted in CTC that is not cash now — so a deferred or locked-away component
outside the three joins it.

**Year one against the average** — the package written out over each year it
covers, set beside the multi-year figure the letter averages it into. Year one
is the first row of that table; the average is over the same rows. A back-loaded
grant or a joining bonus opens a gap between the two, and the gap is the reading
— it is never itself a figure the decoder emits.

**Take-home** — cash reaching the bank account each month, after employee PF,
professional tax and TDS. **In-hand** is the colloquial synonym; take-home is
the canonical term, and both are always stated with an explicit period, since
take-home is habitually quoted monthly and CTC annually.

**One-time component** — received once, not every year: joining bonus,
relocation, retention bonus. Frequently clawback-bound. Never averaged into a
recurring figure.

## Equity

**RSU** — a promise of shares on vest. No strike price; worth something on vest
unless the company is worthless.

**Option (commonly "ESOP" in Indian usage)** — the right to buy at a strike
price after vesting. Worth nothing if the price sits below strike.

**ESPP** — a scheme to buy shares at a discount. The employee is paying, not
receiving.

**Vesting schedule** — the proportion of a grant received in each year, with an
optional **cliff** before which nothing vests. **Back-loaded** vesting weights
later years, so year one is far below the four-year average an offer quotes.

**Perquisite** — the taxable benefit arising on vest (RSU) or exercise (option),
taxed as salary at slab rate. Distinct from the capital gain arising later on
sale.

**Unvaluable** — equity the decoder refuses to value: worth depends on a strike,
a vesting schedule and a liquidity event. Held at ₹0 and always reported as
such, never silently dropped.

**Equity as claimed / equity as valued** — the two readings of the same grants,
reported side by side. As claimed is what the letter counted them at; as valued
is what survives a refusal to forecast a share price. The distance between them
is the reading's whole point, and it is not itself a figure the decoder emits.

**Valuation method** — how a grant reached its figure, named on every grant:
grant-date fair market value (units × price, held flat), the claimed value taken
as the grant-date value, intrinsic value (the amount the price exceeds the
strike, usually nil), unvaluable, or employee-funded. Four of the five are ways
of declining to guess, which is why each carries its assumption in words.

## Insurance

**Policy year** — the unit of time in a life policy: an integer count from the
policy's start, never a calendar date. Premiums fall at the *start* of a policy
year, benefits at its *end*.

**Premium paying term (PPT)** — the number of policy years in which a premium
is due. Never longer than the policy term, and often shorter: a "pay 10, cover
20" plan has a PPT of 10.

**Policy term (PT)** — the number of policy years the policy runs before it
matures. Maturity falls at the end of the last one.

**Survival benefit** — a scheduled payout made while the policy is in force and
the life assured is alive; the "money-back" of a money-back plan. Landed at the
end of its policy year. Never a synonym for maturity benefit.

**Maturity benefit** — the payout at the end of the policy term. The figure a
brochure headlines, and the one an IRR is computed against.

**Benchmark** — a rate the freed-up premiums are compounded at for comparison.
Either a **rules benchmark** (a statutory rate with a primary source, such as
PPF) or a **typed benchmark** (a figure the user asserts and the output labels
as theirs). Never a default the tool chose.
_Avoid_: "growth benchmark", "market return", "expected return".

**Nominal IRR** — the single annual rate at which a policy's premiums, survival
benefits and maturity benefit reconcile, before any allowance for inflation.
The policy's own figure; a benchmark is compared against it, never mixed into
it.

**Real return** — the nominal IRR deflated by a typed inflation figure through
the Fisher relation, `(1 + nominal) ÷ (1 + inflation) − 1`. Never the
subtraction `nominal − inflation`, which is a different and larger number.
_Avoid_: "inflation-adjusted return" as a synonym for the subtraction.

**Comparison column** — one world in which the same premiums are spent: the
policy as written, or term cover plus the difference invested at one benchmark.
Every figure in a column is compounded at that column's benchmark, survival
benefits included, so columns are compared and never mixed. The distance
between two columns is the reader's to see; it is never itself a figure.

**Buy term, invest the difference (BTID)** — the alternative a comparison
column models: a typed term premium buys the cover, and what remains of the
policy's premium is invested. The term premium and the cover it buys are the
user's figures, never the tool's estimate.

**In-force policy** — a policy on which at least one premium has been paid and
which has neither matured nor lapsed. Evaluated forward from today: the
premiums already paid are stated as context and enter no figure.

**Surrender value** — the cash an insurer pays to end an in-force policy. The
price of continuing: in the in-force IRR it is the outflow at today, since
keeping the policy forgoes it. Always the insurer's figure when the user has
one; a regulatory floor otherwise, and labelled as such.

**Paid-up** — an in-force policy on which premiums have stopped and which
continues, with its benefits reduced, to the original policy term. The reduced
benefits are the insurer's figures when the user has them.

**In-force IRR** — the rate at which the surrender value today, the remaining
premiums and the remaining benefits reconcile. The rate continuing earns on
what continuing costs; never the policy's original nominal IRR.
_Avoid_: "IRR if you continue", "IRR from here".

**Guaranteed surrender value (GSV)** — the regulatory floor on a surrender
value: a stated percentage of premiums paid, fixed by policy year. A floor,
never the figure: the insurer's **special surrender value** may sit above it,
and the tool cannot compute that one.

**Basis** — where an in-force figure came from: `insurer-quoted`,
`regulatory-floor`, or `insurer-defined` when the regulation leaves the year
to the insurer and the tool emits nothing. Every surrender and paid-up figure
carries one.

**Scenario** — one set of benefit figures for the same policy: `guaranteed`
(only what the contract guarantees in absolute amount) or an illustration
scenario named by the regulator's gross rate (4%, 8%). The figures are the
insurer's, read from its benefit illustration; the tool reduces each to an
IRR and never derives one scenario from another.

**Benefit illustration** — the document an insurer must give before sale,
showing benefits under each regulatory scenario. The source every
non-guaranteed figure is confirmed against.
_Avoid_: "brochure" (a brochure headlines; an illustration tabulates).
