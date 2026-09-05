# pf-base-ceiling-from-basic-and-dearness

A letter in the shape Indian BPM and legacy annexures still print (issue #42):
a basic below the provident fund wage ceiling, a fixed dearness allowance
beside it, a residual "basket of allowances", and the employer's contribution
stated as a monthly amount. Every figure is typed monthly, as the letter states
it.

The point is the wage base. Section 6 of the EPF & MP Act computes the
contribution on "basic wages, dearness allowance and retaining allowance", so
`groups.epf.wage_components` names `dearness_allowance` beside `basic`, and the
output's `employer_pf.wage_components` carries both lines. On basic alone the
employer's figure lands on neither base; on basic and dearness allowance
together it lands on both, because ₹13,900 + ₹1,100 is exactly the ₹15,000
ceiling and a base at the ceiling gives the same wage under `full_basic` and
`statutory_ceiling`. So `bases_coincide` is true and `implies` names both — a
reading of the letter, and not a choice between them, which is the user's to
confirm.

The gratuity line is here so that `basic.drives` shows the gratuity wage base
carrying the same two lines: section 2(s) of the Payment of Gratuity Act
"includes dearness allowance" by name. No gratuity figure is computed. The
letter's bonus line is left out: it is not part of either base and the fixture
asserts nothing about it.

## External cross-check

Employer rate 12% on the ₹15,000 ceiling: ₹1,800 a month, ₹21,600 a year, the
figure the letter states. On basic alone, 12% of ₹13,900 is ₹1,668, which is
the false "matches neither" the issue reported. Guaranteed recurring cash is
(₹13,900 + ₹1,100 + ₹7,443) × 12 = ₹2,69,316; retirals are (₹1,800 + ₹722) × 12
= ₹30,264; the two sum to the ₹2,99,580 headline.
