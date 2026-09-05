# reject-components-above-cap

Two components, each inside the ₹100 crore cap, that together exceed it.

The cap exists so that every product of paise and basis points stays a safe
integer without BigInt (ADR 0002, ADR 0012). Rates are applied to *sums* — a
slab charge is computed on total income, the provident fund on a wage summed
from several components — so capping the parts alone does not deliver that
guarantee. Without this check the arithmetic silently leaves safe-integer range
and the division helper throws, which the CLI reports as `internal_error` with
exit 2: a crash, not an answer.
