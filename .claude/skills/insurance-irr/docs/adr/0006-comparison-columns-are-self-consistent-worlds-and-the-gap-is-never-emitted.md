# Comparison columns are self-consistent worlds, and the gap is never emitted

The PRD wants a side-by-side terminal-wealth table (policy against
buy-term-and-invest-the-difference at each benchmark) and "the absolute
terminal wealth difference". We decided:

1. **The alternative column** invests `premium − typed term premium` at the
   start of each of the PPT premium years at the column's benchmark, and rolls
   the balance forward to t = PT. The term premium is typed with the sum
   assured it buys; the core records both and does not check the cover against
   the policy's, so the reader can see whether it is like-for-like.
2. **The policy column rolls survival benefits forward at the same column's
   benchmark.** A money-back plan pays out along the way, and a terminal figure
   has to say what became of those payouts. Reinvesting them at the rate the
   alternative earns means neither side gets a free reinvestment assumption;
   the policy column's figure therefore differs per benchmark, and the output
   says so in words beside it.
3. **The difference between columns is never emitted.** The CTC decoder's rule
   applies (its ADR 0016): the distance between two figures is the reader's to
   see. "You'd have ₹X more" is the sales pitch in reverse and would become the
   headline. The columns sit side by side and the core emits only the
   classification of which is largest (ADR 0001).

## Considered options

- **Sum survival benefits nominally.** Understates the policy — a
  reinvestment assumption of 0% dressed as none.
- **Rate to rate only** (the policy's IRR beside each benchmark rate, no rupee
  terminal figures pre-purchase). Purest, but the persona is being sold "₹30L
  at maturity" and needs that figure beside what the same rupees do elsewhere,
  in rupees. Rate to rate is still emitted; it is not the *only* comparison.
