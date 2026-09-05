# FY 2026-27 (tax year 2026-27) new-regime take-home: primary-source research

Researched 2026-09-05. Every figure below is quoted from a document actually
fetched on that date; nothing here is recalled. Where a value could not be
sourced from a primary document it is marked **ABSENT — could not be sourced**.

## 0. Which law governs FY 2026-27, and what it is called

FY 2026-27 is **tax year 2026-27** under the Income-tax Act, 2025. There is no
"assessment year" in the 2025 Act.

- **Income-tax Act, 2025 (No. 30 of 2025)**, s.1(3):
  > "Save as otherwise provided in this Act, it shall come into force on the 1st April, 2026."
- Same Act, s.3(1), marginal note *"Definition of 'tax year'"*:
  > "For the purposes of this Act, 'tax year' means the twelve months period of the financial year commencing on the 1st April."
- Same Act, s.536(1), marginal note *"Repeal and savings"*:
  > "The Income-tax Act, 1961 is hereby repealed."
- Source (gazette, as enacted, assent 21 August 2025):
  https://egazette.gov.in/WriteReadData/2025/265620.pdf — retrieved 2026-09-05.

Rates for tax year 2026-27 are imposed by the **Finance Act, 2026 (No. 4 of
2026)**, assent 30 March 2026 (so: **settled law, not a Bill**):

- Finance Act 2026, s.3(1), side-note *"Income-tax under Act 30 of 2025"*:
  > "Subject to the provisions of sub-sections (2), (3), (4) and (5), for the tax year commencing on the 1st day of April, 2026, income-tax shall be charged under the provisions of the Income-tax Act, 2025 (herein referred to as the said Act) at the rates specified in Part I-B of the First Schedule and such tax shall be increased by a surcharge, for the purposes of the Union, calculated in each case in the manner provided therein."
- Source: https://egazette.gov.in/WriteReadData/2026/271439.pdf — retrieved
  2026-09-05. (Gazette CG-DL-E-31032026-271439; "An Act to give effect to the
  financial proposals of the Central Government for the financial year 2026-27.")

**Important structural point.** Part I-B of the Finance Act 2026 First Schedule
is the **old**-regime table (Nil up to ₹2,50,000, etc.). The **new**-regime rate
table does not live in the Finance Act at all — it lives in **section 202 of the
Income-tax Act, 2025** itself. The Finance Act only refers to it, e.g. s.3(2)(a)
Table Sl. No. 4:
> "Assessee whose income is chargeable to tax under section 202 of the said Act. — ₹ 400000."

Finance Act 2026, s.56, is the only amendment it makes to s.202:
> "In section 202 of the Income-tax Act, in sub-section (2), in clause (a), sub-clause (iii) shall be omitted."

That touches only the list of deductions disallowed in the new regime, **not the
rate table**. I checked every amending section of Finance Act 2026 Part B
(sections 35–129); it amends no part of s.19, s.155, s.156 or s.516.

---

## 1. New regime income tax slabs for FY 2026-27 / AY 2027-28

**Provision:** Income-tax Act, 2025, **section 202**, marginal note
*"New tax regime for individuals, Hindu undivided family and others."*
Sub-section (1) opening words and Table.

**Verbatim:**
> "202. (1) Irrespective of anything contained in this Act other than Chapter XVII-B but subject to Parts A, B, E and this Part of this Chapter, the income-tax payable by a person, being— (a) an individual; or (b) a Hindu undivided family; or (c) an association of persons (other than a co-operative society); or (d) a body of individuals, whether incorporated or not; or (e) an artificial juridical person referred to in section 2(77)(g), in respect of the total income for a tax year, shall, unless the person exercises the option in the manner provided under sub-section (4), be computed at the rate of tax given in the following Table:—"

| Sl. No. | Total income | Rate of tax |
|---|---|---|
| 1. | Upto ₹400000 | Nil |
| 2. | From ₹400001 to ₹800000 | 5% |
| 3. | From ₹800001 to ₹1200000 | 10% |
| 4. | From ₹1200001 to ₹1600000 | 15% |
| 5. | From ₹1600001 to ₹2000000 | 20% |
| 6. | From ₹2000001 to ₹2400000 | 25% |
| 7. | Above ₹2400000 | 30% |

**Ordered bands, upper bound in whole rupees, rate as decimal fraction:**

| # | Upper bound (₹) | Rate |
|---|---|---|
| 1 | 400000 | 0.00 |
| 2 | 800000 | 0.05 |
| 3 | 1200000 | 0.10 |
| 4 | 1600000 | 0.15 |
| 5 | 2000000 | 0.20 |
| 6 | 2400000 | 0.25 |
| 7 | unbounded | 0.30 |

- **URL:** https://egazette.gov.in/WriteReadData/2025/265620.pdf (Income-tax Act,
  2025, as enacted) — retrieved 2026-09-05.
- **Amendment check:** https://egazette.gov.in/WriteReadData/2026/271439.pdf
  (Finance Act, 2026) — s.56 amends only s.202(2)(a)(iii); the Table is untouched.
- **Status:** settled/notified. The Act has Presidential assent (21 Aug 2025) and
  is in force from 1 Apr 2026; the Finance Act 2026 charging section has assent
  (30 Mar 2026).
- **Ambiguity to note:** s.202(1) states the table as *band → rate*, without
  restating cumulative amounts ("₹20000 plus 10% of…") the way the Finance Act's
  old-regime paragraphs do. It is a marginal (slab) table — the Income Tax
  Department's own calculation engine applies it marginally (see §8 below,
  `TaxIndNew`). But the Act's own wording does not spell the marginal arithmetic
  out, so a reader must infer it from the phrase "the rate of tax given in the
  following Table" against bands. Flagging this because it is the one place in
  this list where the statute is terser than the arithmetic it implies.

**Surcharge (not asked, but it bounds the slab table).** Finance Act 2026 s.3(4)
Table Sl. No. 1 excludes persons chargeable under s.202 from the Paragraph F
surcharge and gives them their own rates: 10% above ₹50,00,000, 15% above
₹1,00,00,000, 25% above ₹2,00,00,000, 37% above ₹5,00,00,000. So for total
income at or below ₹50,00,000 the surcharge is nil.

---

## 2. New regime standard deduction from salary

**Provision:** Income-tax Act, 2025, **section 19(1)**, marginal note
*"Deductions from salaries"*, Table Sl. No. 2.

**Verbatim (opening words and the Sl. No. 2 row):**
> "19. (1) The income chargeable under the head 'Salaries' shall be computed after making the deductions in respect of sums of the nature mentioned in column B of the following Table, not exceeding the amount as mentioned in column C thereof:—"

> Sl. No. 2 — Nature of sum: "Standard deduction." — Amount of deduction: "(a) ₹ 75000 or the salary, whichever is less, where income-tax is computed under section 202(1); (b) ₹ 50000 or the salary, whichever is less, in any other case."

- **Value:** **₹75,000** (new regime), capped at the salary if salary is lower.
- **URL:** https://egazette.gov.in/WriteReadData/2025/265620.pdf — retrieved 2026-09-05.
- **Section reference:** Income-tax Act, 2025, s.19(1) Table Sl. No. 2(a).
- **Status:** settled/notified. Finance Act 2026 does not amend s.19.
- **Cross-check that the new regime does not disallow it:** s.202(2)(a) lists what
  must be excluded when computing total income under the new regime. Of the
  salary deductions it names only "section 19(1) (Table: Sl. No. 1)" — which is
  the **professional tax / tax on employment** row, not the standard deduction
  row. The standard deduction therefore survives in the new regime.

---

## 3. New regime rebate (successor to §87A)

**Provision:** Income-tax Act, 2025, **Chapter IX ("REBATES AND RELIEFS"),
Part A**, **section 156**, marginal note *"Rebate of income-tax in case of certain
individuals."* (Section 155, marginal note *"Rebate to be allowed in computing
income-tax"*, is the enabling section.)

**Verbatim:**
> "156. (1) An assesse, being an individual resident in India, shall be entitled to a deduction of 100% of income-tax payable or ₹ 12500, whichever is less, from the income-tax (computed before allowing the deduction under this section) chargeable on the total income for any tax year if such total income does not exceed ₹ 500000."
>
> "(2) Where the total income of a resident individual assessee for any tax year is chargeable to tax under section 202(1), then from income-tax (computed before allowing the deduction under this section) following deductions shall be allowed, if— (a) the income does not exceed twelve lakh rupees, 100% of the income-tax payable or ₹ 60000, whichever is less; (b) the total income exceeds twelve lakh rupees and the income-tax payable on such total income exceeds the amount by which the total income is in excess of twelve lakh rupees, an amount equal to the amount by which the income-tax payable on such total income is in excess of the amount by which the total income exceeds twelve lakh rupees."
>
> "(3) The deduction under sub-section (2), shall not exceed income-tax payable as per the rates provided in section 202(1)."

- **Threshold (total income at which the full rebate is available):** **₹12,00,000**
  ("twelve lakh rupees").
- **Maximum rebate amount:** **₹60,000**.
- **Marginal relief:** **yes**, and it is expressed in s.156(2)(b) — not as a
  formula with a named variable, but as prose: where total income exceeds
  ₹12,00,000, the rebate equals *income-tax payable minus (total income −
  ₹12,00,000)*, and only where that quantity is positive (i.e. "the income-tax
  payable on such total income exceeds the amount by which the total income is in
  excess of twelve lakh rupees"). s.156(3) caps the whole thing at the tax
  computed at s.202(1) rates.
- **Availability:** resident individual only ("an individual resident in India" in
  (1); "a resident individual assessee" in (2)).
- **URL:** https://egazette.gov.in/WriteReadData/2025/265620.pdf — retrieved 2026-09-05.
- **Status:** settled/notified. Finance Act 2026 does not amend s.155 or s.156.
- **Ambiguity to note:** s.156(2)(a) says "**the income** does not exceed twelve
  lakh rupees" where (b) says "**the total income** exceeds twelve lakh rupees".
  The chapeau of (2) is framed on "the total income … chargeable to tax under
  section 202(1)", so "the income" in (a) reads as total income; but the drafting
  is inconsistent and this is worth a note wherever the threshold is encoded.
  ("assesse" in (1) is likewise the gazette's own spelling.)

---

## 4. Health and education cess

**Provision:** **Finance Act, 2026, section 3(15)** (the sub-section that applies
to the s.3(1) charge for tax year 2026-27; s.3(16) is the parallel provision for
TDS/TCS/advance-tax charges in s.3(6)–(14)).

**Verbatim:**
> "(15) The amount of income-tax as specified in sub-sections (1) to (5) and as increased by the applicable surcharge, for the purposes of the Union, calculated in the manner provided therein, shall be further increased by an additional surcharge, for the purposes of the Union, to be called the 'Health and Education Cess on income-tax', calculated at the rate of 4% of such income-tax and surcharge so as to fulfil the commitment of the Government to provide and finance quality health services and universalised quality basic education and secondary and higher education."

- **Rate as decimal fraction:** **0.04**
- **Charged on:** income-tax **as increased by the applicable surcharge** — i.e.
  on (income-tax + surcharge). Not on income; not on income-tax alone.
- **URL:** https://egazette.gov.in/WriteReadData/2026/271439.pdf — retrieved 2026-09-05.
- **Section reference:** Finance Act, 2026 (No. 4 of 2026), s.3(15). (Note: the
  cess is imposed by the annual Finance Act, not by the Income-tax Act, 2025, so
  it must be re-sourced from each year's Finance Act.)
- **Status:** settled/notified.

---

## 5. Statutory rounding (the successor to §288A and §288B)

**Finding: the Income-tax Act, 2025 has ONE section, not two.** Sections 288A and
288B of the 1961 Act are merged into a single provision, and **both** total income
and tax payable/refundable are rounded to the nearest **₹10**. There is no ₹1
rounding provision anywhere in the 2025 Act. (I searched the full text of the Act
for "round", "rounding", "multiple of" and "nearest rupee": the only rounding
provisions are s.516 and a tonnage-rounding rule in the tonnage-tax chapter.)

**Provision:** Income-tax Act, 2025, **section 516**, marginal note
*"Rounding off of amount of total income, or amount payable or refundable."*

**Verbatim:**
> "516. The amount of total income computed or any amount payable or refundable under this Act, shall be rounded off to the nearest multiple of ₹10 ignoring any part of a rupee consisting of paise and thereafter if such amount is not a multiple of ten, then— (a) such amount shall be increased to the next higher amount which is a multiple of ten, if the last figure in that amount is five or more; or (b) such amount shall be reduced to the next lower amount which is a multiple of ten, if the last figure is less than five, and the amount so rounded off shall be deemed to be the total income of the assessee or the amount payable or refundable, as the case may be, under this Act."

**Rule, restated precisely as worded:**
1. **Paise are dropped first** — "ignoring any part of a rupee consisting of
   paise". So the input to step 2 is a whole number of rupees.
2. If the whole-rupee amount is already a multiple of ten, it stands.
3. Otherwise look at **the last digit**: **5 or more → round up** to the next
   multiple of ten; **less than 5 → round down** to the previous multiple of ten.
   The tie (last digit exactly 5) rounds **up**.
4. The rounded amount is *deemed to be* the total income / the amount payable or
   refundable.

Note the wording is "the **last figure** in that amount", i.e. the units digit —
not "if the amount is ₹5 or more". And note that no part of ten rupees is
"ignored first"; only paise are ignored first.

- **Rounding unit:** ₹10 for **both** total income and amount payable or
  refundable.
- **URL:** https://egazette.gov.in/WriteReadData/2025/265620.pdf — retrieved 2026-09-05.
- **Section reference:** Income-tax Act, 2025, s.516.
- **Status:** settled/notified. Finance Act 2026 does not amend s.516; it
  cross-refers to it (First Schedule Part IV-B, Rule 10: "the provisions of the
  said Act relating to procedure for assessment (including the provisions of
  section 516 relating to rounding off of income) shall, with the necessary
  modifications, apply…").
- **Consequence worth flagging for the core:** any rule in this repository that
  assumes tax payable rounds to ₹1 is wrong for FY 2026-27. It rounds to ₹10.

---

## 6. EPF employee contribution rate and statutory monthly wage ceiling

### 6.1 Which statute is in force for FY 2026-27 — this is not obvious

The four Labour Codes were brought into force on 21 November 2025, and the **Code
on Social Security, 2020 (36 of 2020)** would, on full commencement, repeal the
EPF & MP Act, 1952. **It has not.** The commencement notification brought only
*part* of the Code into force, and it deliberately left out both the PF
contribution provision and the repeal of the 1952 Act.

**Notification S.O. 5319(E), Ministry of Labour and Employment, 21 November 2025**,
verbatim:
> "S.O. 5319(E).—In exercise of the powers conferred by sub-section (3) of section 1 of the Code on Social Security, 2020 (36 of 2020), the Central Government hereby appoints the 21st day of November, 2025 as the date on which the following provisions of the said Code, shall come into force, namely: - … 2. sub-sections (1) and (2) of section 15; 3. clause (c) of sub-section (1) of section 16; 4. sections 17 to 141; … 7. Items 1 and 2 and items 4 to 9 of sub-section (1) of section 164; 8. clause (a) and clause (c) of sub-section (2) and sub-section (3) of section 164."
- URL: https://egazette.gov.in/WriteReadData/2025/267882.pdf — retrieved 2026-09-05.

Reading that against the Code:

- **Section 16(1)(a)** of the Code — the provident-fund contribution rate
  ("the contributions paid by the employer to the fund shall be ten per cent. of
  the wages … and the employee's contribution shall be equal to the contribution
  payable by the employer") — is **NOT in force**. Only s.16(1)(c), the
  deposit-linked insurance fund, was commenced.
- **Section 164(1) item 3** is:
  > "3. The Employees' Provident Funds and Miscellaneous Provisions Act, 1952 (19 of 1952);"
  The notification commenced items 1 and 2 and items 4 to 9 — **item 3 was
  omitted**. The EPF & MP Act, 1952 is therefore **not repealed**.
- Section 164(2)(b) (the one-year sunset for the EPF Scheme, 1952 and the other
  schemes) was also **not** commenced; only 164(2)(a) and (c) were.
- Code on Social Security, 2020 text URL:
  https://www.indiacode.nic.in/bitstream/123456789/16823/1/aA2020-36.pdf —
  retrieved 2026-09-05.

**Conclusion for FY 2026-27: EPF contributions continue to be governed by the
Employees' Provident Funds and Miscellaneous Provisions Act, 1952 and the schemes
framed under it.** The Ministry of Labour & Employment's own *Annual Report
2025-26* (published after the Codes commenced) still states:
> "administers the Employees' Provident Fund and Miscellaneous Provisions Act, 1952 and the Schemes framed there under"
- URL: https://www.labour.gov.in/static/uploads/2026/06/4b7ec0e8206aa4860576d6f75b432e97.pdf
  — retrieved 2026-09-05.

(The Ministry's *Compliance Handbook for Employers Under the Four Labour Codes*,
https://www.labour.gov.in/static/uploads/2026/02/83978455025732b99b0165def80ab171.pdf,
retrieved 2026-09-05, describes the Code's s.16 10% rule — but that handbook
carries its own disclaimer that "In the event of any discrepancy between the
contents of this Handbook and the provisions of the new Labour Codes, the latter
shall prevail", and the Code provision it describes is one of the provisions not
yet commenced. Do not use it as the operative rule.)

### 6.2 The contribution provision itself

**Provision:** EPF & MP Act, 1952 (Act No. 19 of 1952), **section 6**, heading
*"Contributions and matters which may be provided for in Schemes."*

**Verbatim:**
> "6. Contributions and matters which may be provided for in Schemes. – The contribution which shall be paid by the employer to the Fund shall be ten percent. Of the basic wages, dearness allowance and retaining allowance, if any, for the time being payable to each of the employees whether employed by him directly or by or through a contractor, and the employee‟s contribution shall be equal to the contribution payable by the employer in respect of him and may, if any employee so desires, be an amount exceeding ten percent of his basic wages, dearness allowance and retaining allowance if any, subject to the condition that the employer shall not be under an obligation to pay any contribution over and above his contribution payable under this section:
>
> Provided that in its application to any establishment or class of establishments which the Central Government, after making such inquiry as it deems fit, may, by notification in the Official Gazette specify, this section shall be subject to the modification that for the words 'ten percent', at both the places where they occur, the words '12 percent' shall be substituted:
>
> Provided further that where the amount of any contribution payable under this Act involves a fraction of a rupee, the Scheme may provide for rounding off of such fraction to the nearest rupee, half of a rupee, or quarter of a rupee."

- URL: https://www.labour.gov.in/static/uploads/2025/06/03cab9b7485af64f747d8c658cb56a7e.pdf
  — retrieved 2026-09-05. (This is the URL already cited in `rules/fy2026-27.yaml`.)

**So, on the face of the Act: the employee's own share is 10%, equal to the
employer's, and becomes 12% only for establishments notified under the first
proviso.** Section 6 contains **no wage ceiling at all**.

### 6.3 The 12% rate and the ₹15,000 ceiling as actually applied

The Ministry of Labour & Employment's own statement (answer to Lok Sabha
Unstarred Question No. 586, 24 July 2023, PIB release ID 1942083, PDF hosted on
labour.gov.in):
> "Under the EPF, Scheme, 1952, an employee of any covered establishment drawing monthly wages up to Rs. 15,000 is statutorily required to join the fund and to contribute 12% of wages, which includes basic wages, dearness allowance and retaining allowance, if any. The employer is also required to contribute 12% of the wages."
>
> "The wage ceiling for coverage under the EPF Scheme, 1952 is revised from time to time. Presently, it is Rs.15000/- per month since 01.09.2014."
- URL: https://www.labour.gov.in/static/uploads/2025/06/93561f36d5094b0cfe52570b4e8d2dc1.pdf
  — retrieved 2026-09-05.

- **Employee contribution rate (employee's own share) as a decimal fraction:**
  **0.12**
- **Statutory monthly wage ceiling:** **₹15,000**, effective **1 September 2014**
  — i.e. revised *before* FY 2026-27, not inside it.
- **Was it revised effective a date inside or before FY 2026-27?** The last
  revision is 01.09.2014. I found **no notification revising it since**. The EPFO
  Central Board of Trustees has repeatedly discussed raising it, but discussion is
  not a notification. I could not find, and therefore do not assert, any revision.
- **Status: partly provisional in its sourcing.** See §9 for exactly what I could
  not source.

### 6.4 Confidence and caveats on the EPF numbers

- The **legal architecture** (which Act applies, s.6's structure, s.2(b)'s
  definition) is sourced from the statutes themselves and from the gazette
  commencement notification. High confidence.
- The **numbers 12% and ₹15,000** are sourced from a Ministry of Labour statement
  to Parliament, not from the EPF Scheme, 1952 text or the s.6 proviso
  notification. Medium-high confidence, but see §9 — these two should be
  re-sourced from the Scheme text before they go into `rules/`.

---

## 7. EPF "basic wages" — section 2(b), and what the contribution is computed on

**Provision:** EPF & MP Act, 1952, **section 2(b)**.

**Verbatim, complete:**
> "(b) 'basic wages' means all emoluments which are earned by an employee while on duty or on leave or on holidays with wages in either case in accordance with the terms of the contract of employment and which are paid or payable in cash to him, but does not include-
>
> (i) the cash value of any food concession;
>
> (ii) any dearness allowance that is to say, all cash payments by whatever name called paid to an employee on account of a rise in the cost of living, house-rent allowance, overtime allowance, bonus, commission or any other similar allowance payable to the employee in respect of his employment or of work done in such employment;
>
> (iii) any presents made by the employer;"

- **URL:** https://www.labour.gov.in/static/uploads/2025/06/03cab9b7485af64f747d8c658cb56a7e.pdf
  — retrieved 2026-09-05.
- **Section reference:** EPF & MP Act, 1952 (Act No. 19 of 1952), s.2(b).
- **Status:** settled statutory text (the Act as in force; not repealed — see §6.1).

**Is house rent allowance excluded? Yes — expressly.** HRA is named inside
clause (ii): "any dearness allowance that is to say, all cash payments by whatever
name called paid to an employee on account of a rise in the cost of living,
**house-rent allowance**, overtime allowance, bonus, commission or any other
similar allowance…". So **HRA is not part of "basic wages"**.

Also excluded by name in clause (ii): overtime allowance, bonus, commission, and
the catch-all "any other similar allowance payable to the employee in respect of
his employment or of work done in such employment". Excluded by clauses (i) and
(iii): the cash value of any food concession, and presents from the employer.

**Does section 6 compute the contribution on "basic wages, dearness allowance and
retaining allowance"? Yes.** From the s.6 text quoted in full at §6.2:
> "The contribution which shall be paid by the employer to the Fund shall be ten percent. Of the basic wages, dearness allowance and retaining allowance, if any, for the time being payable to each of the employees…"

and for the employee's own share:
> "…and may, if any employee so desires, be an amount exceeding ten percent of his basic wages, dearness allowance and retaining allowance if any…"

**So the contribution base is: basic wages + dearness allowance + retaining
allowance.** The exclusion of dearness allowance from *"basic wages"* in s.2(b)(ii)
is undone by s.6 adding DA back explicitly. Two further definitions in s.6 matter:

> "Explanation I – For the purposes of this section dearness allowance shall be deemed to include also the cash value of any food concession allowed to the employee."
>
> "Explanation II. – For the purposes of this section, 'retaining allowance' means allowance payable for the time being to an employee of any factory or other establishment during any period in which the establishment is not working, for retaining his services."

**Net effect on a salaried pay structure:** HRA, overtime, bonus and commission
are outside the base; basic and DA (plus retaining allowance, and the cash value
of food concession which rides on DA) are inside it. **What section 2(b) does not
settle is the treatment of a "special allowance"** — it is neither named in the
exclusion list nor named in the inclusion, and turns on whether it is "any other
similar allowance" under s.2(b)(ii). That question has been litigated; I have not
sourced any case law here and make no claim about it. Treat it as open.

---

## 8. The Income Tax Department's own calculator — does it support AY 2027-28?

**Yes, as "Tax Year 2026-27" under the Income-tax Act, 2025.**

- **Landing page:** https://www.incometax.gov.in/iec/foportal/income-tax-calculator
  — retrieved 2026-09-05.
- **The calculator itself (single-page app):**
  https://eportal.incometax.gov.in/iec/foservices/#/TaxCalc/calculator
  (and `#/TaxCalc/calender`) — this is the target the landing page links to.
- **User manual:**
  https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/income-tax-calculator-um
  — retrieved 2026-09-05, which states verbatim:
  > "The Income Tax Act, 2025 will be auto selected by default, and the Tax Year will be available only as 2026–27."
  > "If you want to calculate Tax as per Income Tax Act,1961, select the applicable act Income Tax Act, 1961 and select the Assessment year."

The application's own year list confirms it: the Income-tax Act 2025 option
offers exactly one entry, `[{yr:2026, yrstr:"2026-27"}]`, and the app renders the
label as "Tax Year" rather than "Assessment Year" for this selection. Tax year
2026-27 = FY 2026-27 = AY 2027-28 under the old nomenclature.

### 8.1 How I cross-checked, and the honest caveat

**I could not drive the web UI** — it is a JavaScript single-page application and
this environment has no browser. What I did instead: the app loads the
Department's calculation engine as a plain script, and I fetched and executed
**that engine**, unmodified, in Node:

- **Engine URL:** https://static.incometax.gov.in/iec/foservices/assets/js/tax-calc/itdcalc.js
  — retrieved 2026-09-05 (198,608 bytes, served by static.incometax.gov.in, loaded
  by the calculator page at runtime).

So the outputs below are the Department's own arithmetic, but obtained by calling
its engine directly rather than by typing into the form. Treat them as a strong
cross-check, not as a screenshot of the UI.

The engine's new-regime slab function (`TaxIndNew`) for these years reads:
```
if (parseInt(assYr) >= 2026) {
    if (tinc < 400000) { tax = 0; }
    else if (tinc <= 800000)  { tax = (tinc - 400000) * 0.05; }
    else if (tinc <= 1200000) { tax = (tinc - 800000) * 0.10 + 20000; }
    else if (tinc < 1600000)  { tax = (tinc - 1200000) * 0.15 + 60000; }
    else if (tinc < 2000000)  { tax = (tinc - 1600000) * 0.20 + 120000; }
    else if (tinc < 2400000)  { tax = (tinc - 2000000) * 0.25 + 200000; }
    else if (tinc < 5000000)  { tax = (tinc - 2400000) * 0.30 + 300000; }
    ...
```
and its rebate function contains:
```
if (taxbleIncome <= 1200000 && residentialStatus != "NR" && categoryStatus == "IND"
    && taxRegime == 'new' && taxAssYr >= '2027') { rebate = 60000; if (rebate > tax) rebate = tax; }
```
and its standard deduction: `incomeStdDec = 75000` where net salary exceeds
₹75,000 in the new regime. All three match the statute quoted above.

### 8.2 Case 1 — individual under 60, new regime, gross salary ₹24,00,000

**Inputs given to the engine:** `calcType: "basic"`, `assYr: "2027-28"` (also run
as `"2026-27"`, identical result), `cStatus: "IND"` (individual), `age: "NM"`
(under 60), `rstatus: "R"` (resident), gross salary ₹24,00,000, standard deduction
₹75,000, no other income, no other deduction, so new-regime total income
₹23,25,000.

**Returned:**

| item | ₹ |
|---|---|
| Gross salary | 24,00,000 |
| Standard deduction (s.19(1) Tbl. 2(a)) | 75,000 |
| Total income | 23,25,000 |
| Tax at s.202(1) slabs | 2,81,250 |
| Rebate (s.156(2)) | 0 |
| Surcharge | 0 |
| Health & education cess @ 4% | 11,250 |
| **Total tax (`TaxNew`)** | **2,92,500** |

(The engine also returned `TaxOld = 5,30,400` for the old regime with zero
deductions, which is not what was asked but is what it emits alongside.)

Independent hand-check against the statute: 4,00,000×0.05 = 20,000;
4,00,000×0.10 = 40,000; 4,00,000×0.15 = 60,000; 4,00,000×0.20 = 80,000;
3,25,000×0.25 = 81,250 → 2,81,250; cess 4% = 11,250; total 2,92,500. **Agrees.**

### 8.3 Case 2 — same, gross salary ₹12,50,000

**Inputs:** identical except gross salary ₹12,50,000.

| item | ₹ |
|---|---|
| Gross salary | 12,50,000 |
| Standard deduction | 75,000 |
| Total income | 11,75,000 |
| Tax at s.202(1) slabs | 57,500 |
| Rebate (s.156(2)(a)) | 57,500 |
| Surcharge | 0 |
| Health & education cess @ 4% | 0 |
| **Total tax (`TaxNew`)** | **0** |

Hand-check: 4,00,000×0.05 = 20,000; 3,75,000×0.10 = 37,500 → 57,500. Total income
₹11,75,000 ≤ ₹12,00,000, so rebate = min(₹60,000, ₹57,500) = ₹57,500 → tax nil,
and cess is 4% of nil. **Agrees.**

### 8.4 One divergence worth recording

The Department's engine uses `parseInt(...)` (truncation) on intermediate tax and
cess figures and does **not** apply the s.516 ₹10 rounding in this path. Our core
must apply s.516 as the Act words it; expect off-by-a-few-rupees differences
against the Department's calculator on inputs that are not round numbers. That is
a real difference between the statute and the Department's tool, not an error in
either quotation.

---

## 9. What I could NOT source

1. **EPF Scheme, 1952 — paragraph 2(f) ("excluded employee") and paragraph 26A(2)
   proviso, the paragraphs that actually carry the ₹15,000 wage ceiling.**
   **ABSENT — could not be sourced.** The consolidated Scheme text is published
   only on epfindia.gov.in / epfo.gov.in
   (`https://www.epfo.gov.in/site_docs/PDFs/Downloads_PDFs/EPFScheme.pdf`), and
   both hosts returned CloudFront `403 Request blocked` / `503` to every request
   from this environment. `cgit.labour.gov.in` reset the connection;
   `indiacode.nic.in`'s subordinate-legislation endpoints returned 404 / reset.
   What is missing specifically: the verbatim paragraph text and the ceiling
   figure *in the Scheme itself*. I have the figure only from a Ministry statement
   to Parliament (§6.3).
2. **The gazette notification that raised the ceiling to ₹15,000 with effect from
   1 September 2014 (reported as G.S.R. 609(E), 22 August 2014).**
   **ABSENT — could not be sourced.** egazette.gov.in's 2014 archive is behind an
   ASP.NET postback search I could not drive; the only copies I found were on
   secondary sites, which the brief forbids as a basis. What is missing: the
   notification number, its exact amending words, and its stated effective date
   from the gazette itself. The effective date 01.09.2014 is currently supported
   only by the Ministry statement in §6.3.
3. **The notification under the first proviso to section 6 of the EPF & MP Act,
   1952 that substitutes "12 percent" for "ten percent".**
   **ABSENT — could not be sourced.** This matters: on the bare text of s.6 the
   employee's share is **10%**, and 12% applies only to establishments the Central
   Government has notified. I could not fetch that notification (EPFO is the
   publisher and is blocked). The 12% figure in §6.3 rests on the Ministry's
   statement, not on the notification. **Do not encode 0.12 in `rules/` citing
   section 6 — section 6 says ten percent.**
4. **incometaxindia.gov.in is entirely unreachable from this environment** (Akamai
   "Access Denied" on every path, including the department's consolidated
   "Income-tax Act, 2025 as amended by Finance Act, 2026" PDF and its
   old-vs-new-regime calculator). Everything in §§1–5 was therefore taken from the
   **gazette** texts on egazette.gov.in instead, which is the better source
   anyway. Nothing in §§1–5 is missing as a result; noting it so the next session
   does not waste time on that host.
5. **The consolidated "as amended" text of the Income-tax Act, 2025.** I worked
   from the Act **as enacted** (gazette, Aug 2025) plus the **Finance Act, 2026**
   (gazette, Mar 2026), and checked every FA 2026 amending section against the
   provisions quoted here. That is equivalent, but it is a reconstruction: if a
   later amendment (an ordinance, or a second Finance Act) exists, I would not
   have seen it. I found no evidence of one.

## 10. Stability summary

| # | Item | Value | Status |
|---|---|---|---|
| 1 | New regime slabs | 0/5/10/15/20/25/30% at 4/8/12/16/20/24 lakh | Settled — ITA 2025 s.202(1), charged by FA 2026 s.3(1) |
| 2 | Standard deduction | ₹75,000 | Settled — ITA 2025 s.19(1) Tbl. Sl. No. 2(a) |
| 3 | Rebate | ₹60,000 up to total income ₹12,00,000, with marginal relief | Settled — ITA 2025 s.156(2), (3) |
| 4 | Health & education cess | 0.04 on (income-tax + surcharge) | Settled — FA 2026 s.3(15); re-source each year |
| 5 | Rounding | ₹10, both total income and tax payable/refundable, one section | Settled — ITA 2025 s.516 |
| 6 | EPF employee share | 0.10 on the face of s.6; 0.12 as applied | **Provisional** — the 12% notification not sourced |
| 6 | EPF wage ceiling | ₹15,000/month, since 01.09.2014 | **Provisional** — Scheme text and 2014 notification not sourced |
| 7 | EPF "basic wages" | s.2(b), HRA expressly excluded; base is basic + DA + retaining allowance | Settled — EPF & MP Act 1952 ss.2(b), 6 |

## Sources fetched (all retrieved 2026-09-05)

- Income-tax Act, 2025 (No. 30 of 2025), gazette as enacted —
  https://egazette.gov.in/WriteReadData/2025/265620.pdf
- Finance Act, 2026 (No. 4 of 2026), gazette as enacted —
  https://egazette.gov.in/WriteReadData/2026/271439.pdf
- Code on Social Security, 2020 (36 of 2020) —
  https://www.indiacode.nic.in/bitstream/123456789/16823/1/aA2020-36.pdf
- S.O. 5319(E) dated 21 Nov 2025, Ministry of Labour and Employment (commencement
  of parts of the Code on Social Security, 2020) —
  https://egazette.gov.in/WriteReadData/2025/267882.pdf
- EPF & MP Act, 1952 (Act No. 19 of 1952), Ministry of Labour and Employment —
  https://www.labour.gov.in/static/uploads/2025/06/03cab9b7485af64f747d8c658cb56a7e.pdf
- Ministry of Labour & Employment, "Employees' Provident Fund Scheme" (PIB, reply
  to Lok Sabha Unstarred Question No. 586, 24 Jul 2023) —
  https://www.labour.gov.in/static/uploads/2025/06/93561f36d5094b0cfe52570b4e8d2dc1.pdf
- Ministry of Labour & Employment, Annual Report 2025-26 —
  https://www.labour.gov.in/static/uploads/2026/06/4b7ec0e8206aa4860576d6f75b432e97.pdf
- Ministry of Labour & Employment, Compliance Handbook for Employers Under the
  Four Labour Codes (Feb 2026) —
  https://www.labour.gov.in/static/uploads/2026/02/83978455025732b99b0165def80ab171.pdf
- Ministry of Labour & Employment, Additional FAQs on Labour Codes (16.03.2026) —
  https://www.labour.gov.in/static/uploads/2026/03/a4ccf4c6d97c4f1f36a6d83f8c64213d.pdf
- Income Tax Department, Income and Tax Calculator (landing page) —
  https://www.incometax.gov.in/iec/foportal/income-tax-calculator
- Income Tax Department, Income Tax Calculator user manual —
  https://www.incometax.gov.in/iec/foportal/help/all-topics/e-filing-services/income-tax-calculator-um
- Income Tax Department, calculator engine script —
  https://static.incometax.gov.in/iec/foservices/assets/js/tax-calc/itdcalc.js
