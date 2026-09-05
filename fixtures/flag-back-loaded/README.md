# flag-back-loaded

A 5/15/40/40 grant. Year one takes 5% where an even four-year schedule would
give it 25%, and the authored threshold fires below three-fifths of that even
share — `25% × 0.60 = 15%` — so 5% is well under it.

The comparison is against the schedule's **own** even share (`10000 ÷ 4` basis
points), not against a fixed quarter, so a three-year grant would be judged
against a third.

`equity-perquisite` is also raised and is not noise: any grant at all raises it,
because the Act taxes a vest as salary whatever its shape. Basic is 80% of fixed
pay and the grant is listed and valued, so neither `basic-share` nor
`unvaluable-share` fires. The grant carries no cliff, which is what keeps `cliff`
out of this one — `fixtures/flag-cliff` covers that.
