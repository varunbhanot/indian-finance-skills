# Figures and a classification, never a verdict

The PRD for this skill asks for a verdict banner ("Poor Investment Vehicle",
"Surrender Recommended"), an explicit Keep / Surrender / Paid-Up recommendation
"based on the highest projected terminal wealth", and actionable next steps.
The repository's liability posture is analysis and citation, never a
recommendation to act (the CTC decoder's ADR 0007), and the output-invariants
test already fails any fixture whose output reads as advice. We decided the
insurance-irr skill holds that posture rather than carving out an exemption:
the core computes every path's figures and emits a *classification* — a stated
fact about the figures, the way the CTC decoder states "back-loaded" — and the
skill leads with the classification, names the assumptions it rests on, links
the sources, and stops. A reader who sees two terminal figures side by side
does not need to be told which is larger.

## Considered options

- **Exemption ADR** letting this one skill recommend, on the argument that a
  three-way comparison with a strictly larger number is not advice the way "buy
  this fund" is. Rejected: it would make this the one skill that gives advice,
  and the invariant check would need a carve-out that every later skill would
  cite.
- **Hybrid** — no recommendation, but a list of the mechanics a reader would
  need (how surrender is requested, what paid-up conversion is, cooling-off
  periods). Rejected for v1: it is where recommendations creep back in.

## Consequences

The PRD's "verdict banner" becomes a finding; "Surrender Recommended" and
"actionable next steps" have no output at all. The vocabulary of the
classification is its own decision, taken later in this skill's ADRs.
