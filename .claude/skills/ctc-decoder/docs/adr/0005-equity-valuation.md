# Illiquid equity is valued at zero, and vesting schedules are typed input

Equity in a listed company is valued at **grant-date fair market value held
flat**, and the decoder states that assumption every time. It never models share
price growth: that is forecasting, and it is the same category of error as
recalling a tax rate.

Equity that cannot be valued — unlisted-startup options, whose worth depends on
a strike price, a vesting schedule and a liquidity event that may never
happen — is held at **₹0** in every comparison, and **always named in the
output** alongside the value the offer letter claimed for it. A tool built to
expose inflated CTC cannot invent a number for the most inflated line on the
page; but silently dropping it would be its own kind of dishonesty, so it is
reported as unvaluable rather than omitted.

Grants are modelled as a **vesting schedule** (basis points per year, plus an
optional cliff), never as an annualised scalar. Back-loaded shapes such as
5/15/40/40 are common, and dividing a grant by four reproduces the misleading
number the decoder exists to take apart. The schedule is **typed input from the
offer letter**, never a lookup: the skill may suggest common shapes as an input
aid, but the repository must not encode claims about how a named employer vests,
which would be an unsourced assertion about a third party that rots the moment
they change policy.
