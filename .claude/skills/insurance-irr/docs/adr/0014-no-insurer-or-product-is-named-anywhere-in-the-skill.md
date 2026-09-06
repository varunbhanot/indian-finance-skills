# No insurer or product is named anywhere in the skill

The PRD's activation criteria name brand products as triggers ("LIC Jeevan
Labh/Umang, HDFC Life Sanchay, ICICI Pru Gift"). CLAUDE.md's rule that the
repository never encodes a claim about a named employer has an exact analogue
here, and we decided to apply it: no insurer and no product is named anywhere
in the skill's description, its `SKILL.md`, the rules file or the core — not
as a trigger, not as an example. The skill activates on the kind of policy
(endowment, money-back, linked, guaranteed-income, whole life) and the
question ("what does this policy actually return", "should I keep paying", "is
the surrender value worth taking"), and a user who names a product is asked
for its figures like any other.

A brand in the description is harmless today and a claim tomorrow: the moment
the skill "knows" a product's premium paying term, it will fill it in, which is
the vesting-schedule lookup table the CTC decoder refused to build.

The intake protocol is the CTC decoder's (its ADR 0011), carried over rather
than redesigned: a document is read for figures only; policy number, name,
date of birth, nominee and agent code stay on the page and are never repeated
back, not even to confirm the right document was read; every figure is
confirmed beside its source line before the CLI runs; the skill never asks for
anything that is not a field in the JSON. One addition: the skill asks for the
**benefit illustration**, by that name, before a brochure, because the
illustration is the document with the per-scenario figures (ADR 0009) and a
brochure is what an adviser hands over instead.

## Considered options

- **Brands as triggers only**, nothing else encoded. Rejected: the line
  between a trigger and a fact does not hold once the name is in the file.
- **A catalogue of known products' terms** to pre-fill. Rejected outright, as
  above.
