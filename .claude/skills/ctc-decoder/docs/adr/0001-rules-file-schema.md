# Rules files are structured groups with group-level provenance

Every tax rate, slab, limit and threshold lives in `rules/fy<YYYY-YY>.yaml`
rather than in code, because Indian tax rules change every February and the
rules file is what makes this repo maintainable by contributors who are not
the author. Values are organised as **structured groups** (a slab table is an
ordered array, not a set of flattened `slab_2.rate` keys), and each group
carries one `source` URL plus the date it was retrieved. A schema test in CI
fails if any leaf value sits outside a group carrying a source, so the
"nothing unsourced" guarantee is enforced rather than merely intended.

Groups may carry optional `effective_from` / `effective_to` dates, defaulting
to the whole financial year when absent. This is not speculative: on
23 July 2024 India changed LTCG rates and indexation mid-year, so a single FY
held two capital-gains regimes depending on transfer date.

## Considered options

**A source URL on every individual value**, as originally planned. Rejected:
a slab table is `{from, to, rate}` per band, so per-value provenance means
eighteen entries and eighteen copies of the same Budget URL to describe one
table — noise that reads as rigor. Group-level sourcing keeps the audit
guarantee while keeping the file editable by someone updating one slab.
