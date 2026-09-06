# A rules value may cite its own provision, one level below the group

ADR 0001 fixed provenance at the group: `source` and `retrieved` on the group
that holds the value. ADR 0010 already narrowed that once, for one group, because
a catalogue entry's classification does not all come from the components group's
own source. #9 needed the same narrowing in several more groups at once —
`income_tax.new_regime.slabs`, `income_tax.new_regime.rebate`,
`income_tax.cess`, `epf.employee_rate`, `epf.wage_ceiling`, `statutory_rounding.*`
— each a different provision of a different Act, sitting inside one financial
year's file. `rules-reader.ts`'s `RulesNode.citation()` generalizes ADR 0010's
pattern from that one group to any rules node: `section`, `source`, `retrieved`,
and an optional `note`, read off whatever node is asked for it and carried into
the output beside the figure it describes.

This is recorded now because #9's diff added the general-purpose reader without
an ADR of its own, and the next session reading five groups each carrying a
second, nested provenance under the group-level one should not have to
reconstruct why from the code alone.

## Consequences

The group's own `source`/`retrieved` still exists and still means what ADR 0001
says: where the group's vocabulary or shared scope comes from. A node's own
citation narrows that, exactly as ADR 0010 already established for one group; it
does not replace it, and a group whose every value truly shares one source needs
no per-node citations at all.
