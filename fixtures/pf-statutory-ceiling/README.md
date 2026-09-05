# pf-statutory-ceiling

Employee provident fund on the statutory ceiling. Deliberately the **same
package as `take-home-new-regime`**, changing only `pf_wage_base`, so the pair
of fixtures is the comparison:

| | wage the rate is applied to | employee PF |
|---|---|---|
| `take-home-new-regime` (`full_basic`) | ₹12,00,000 | ₹1,44,000 |
| this fixture (`statutory_ceiling`) | ₹1,80,000 | ₹21,600 |

₹1,80,000 is the ceiling of ₹15,000 a month over twelve months, and
`ceiling.applied` is `true` because the basic exceeds it. The income tax and the
gross are identical in both, since neither depends on the provident fund choice
under the new regime — which is itself the point: the two fixtures differ by
₹1,22,400 of take-home a year (₹19,63,500 against ₹20,85,900 on the zero basis)
on an otherwise identical letter.

Spec #11 adds the old regime alongside the new, same as every other take-home
fixture; it changes neither provident fund figure above, since employee PF
does not depend on regime.

## External cross-check

**Only partly cross-checkable, and this fixture asserts only what is.**

- The **income tax** half is the same as `take-home-new-regime` (new regime)
  and `take-home-old-regime` (old regime) and is covered by the cross-checks
  recorded there.
- The **provident fund** half is **not cross-checked against any calculator**.
  The two figures it rests on — the 12% employee rate and the ₹15,000 monthly
  ceiling — could not be sourced to the instruments that fix them: see
  `docs/research/fy2026-27-new-regime-take-home.md` §9, items 1–3. They come
  from the Ministry of Labour and Employment's own statement to the Lok Sabha,
  which is what the `note` on each of those rules keys records, and that note
  travels into this fixture's `expected.json` alongside the figure.

  On the bare words of section 6 the employee's share is **ten** per cent; 12%
  applies to establishments the Central Government has notified, and that
  notification could not be retrieved. If it turns out not to cover an
  employer, this fixture's PF figure is wrong for them.
