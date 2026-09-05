# Context

The domain language of this project. Glossary only — no implementation
details, no decisions (those live in `docs/adr/`).

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

**Wage base** — the components a statutory rule computes on, as that rule
defines them, not as an offer letter groups them. Each rule has its own: the
provident fund's is basic wages, dearness allowance and retaining allowance
(EPF & MP Act §2(b), §6); gratuity's is wages including dearness allowance but
excluding house rent allowance and any other allowance (Payment of Gratuity Act
§2(s)). Basic sits inside every one of them, which is why it drives all three.

**Retirals** — employer contributions counted in CTC but not received as cash
now: employer PF, gratuity provision, employer NPS. The decoder derives the
retirals total from the classification rather than that list — everything
counted in CTC that is not cash now — so a deferred or locked-away component
outside the three joins it.

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
