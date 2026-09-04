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

**Statutory rounding** — the two points where the Income Tax Act requires a
figure to be rounded: §288A rounds **total income** to the nearest ₹10, and
§288B rounds **tax payable** to the nearest ₹1. Nothing else is rounded;
intermediate figures are carried at full precision.

<!-- Terms are added here as they are settled, not in advance. -->

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

**Retirals** — employer contributions counted in CTC but not received as cash
now: employer PF, gratuity provision, employer NPS.

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
