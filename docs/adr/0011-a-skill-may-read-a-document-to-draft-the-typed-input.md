# A skill may read a document to draft the typed input; the user confirms before it runs

The "typed input only" rule is narrowed. **The core still takes typed JSON and
nothing else.** The skill layer may read a document the user hands it — a PDF,
a spreadsheet, an image of an offer letter — to *draft* that input, and the
draft becomes input only when the user has confirmed it, each figure shown
beside the line of the letter it was read from. Fine print the decoder has no
field for is quoted verbatim in the narration, never dropped and never
interpreted. Passwords, card and account numbers stay forbidden, and the skill
never repeats an identifying detail from a document.

The original rule rested on privacy and traceability, and the cost of the rule
was not weighed. A CTC annexure carries a name and a designation, not PAN or
bank details; those arrive at onboarding on other documents. And the traps the
decoder exists to expose mostly live outside the salary table — "recoverable in
full if you leave within twelve months", "subject to individual and company
performance", "one-year cliff" — so a user who types the table misses exactly
the lines that matter. A typed-only tool quietly depends on the user having
already read the fine print carefully, which is the thing they came for.

Traceability survives because the confirmation *is* the typing. A number the
model reads off a page is neither typed nor computed, and a misread ₹18,00,000
becomes ₹1,80,000 with nothing downstream to catch it — unless the user sees the
figure next to its source line and says yes. With that gate every rupee in the
narration still traces to confirmed input, and the eval in ADR 0003 holds
unchanged.

## Considered options

**Keep the rule; tell the user to paste the fine print too.** Puts the burden of
knowing which prose matters on the person least placed to know it.

**Let the core take a document.** Would make arithmetic depend on extraction,
and the fixture suite could no longer pin the seam to JSON in, JSON out.

## Consequences

The skill has three intake routes — pasted lines, a document, conversational
elicitation — and one confirm gate all three pass through. Scanned image-PDFs
and tables split across lines are the extraction failure modes; the gate is
what makes them survivable, so it is never skipped, not even when the user says
the letter is simple.
