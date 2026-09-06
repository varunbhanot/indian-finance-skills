# Sourced law and authored judgement live in separate files

`rules/fy<YYYY-YY>.yaml` holds **sourced statutory fact** — every group carries a
source URL, enforced by CI (ADR 0001). `heuristics.yaml` holds **authored
judgement**: thresholds like "variable pay above this share of CTC is worth
flagging", each carrying a `rationale` string rather than a URL, and not scoped
to a financial year because "that is a lot of variable pay" is not a tax-year
concept.

They are separate files because mixing them would quietly destroy the guarantee
that makes the rules file trustworthy. A `source: "we reckon"` sitting beside a
Finance Act citation means a reader can no longer tell which numbers are law and
which are the author's opinion — and that distinction is most of this project's
credibility. Split, a contributor who disagrees with a threshold opens a PR
against the opinions file and argues about judgement, with nobody wondering
whether they edited a tax rate.
