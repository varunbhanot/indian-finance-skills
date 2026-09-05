# A cited document is titled once, and the output names every one it cites

ADR 0007 promised the output would carry `sources: [{ title, url }]`, because
citation is what this tool offers in place of advice. A URL alone does not
satisfy that: "here is the rule, at
`https://egazette.gov.in/WriteReadData/2025/265620.pdf`" is not a citation a
reader can weigh. So every `source` in a rules file is paired with a **title**
naming the paper it points at, and `Citation` carries `document: { title, url }`
rather than a bare `source` string.

A title is a document, never a provision. `section` already names the provision,
and the two were being conflated — `groups.statutory_rounding.title` read "The
Income-tax Act, 2025 (No. 30 of 2025), section 516", which is a section of a
document, not the document. Splitting them is what lets one URL have one name.

**Where the title is written.** On the group, once, as ADR 0001 intends: the
group's `source` and its `title` describe the same paper. A value that narrows
the source to a different paper — ADR 0013's pattern, and what
`groups.epf.employee_rate` does when it cites a Ministry statement rather than
the Act — titles that paper itself. A value citing an untitled document is
refused by `RulesNode.citation()`, and `test/rules-schema.test.ts` fails the
whole file in CI, so the guarantee holds before anyone asks for the figure.
The same test fails a file that gives one URL two titles, because the output
deduplicates by URL and would otherwise silently keep whichever came first.

**How the list is built.** `sources.ts` walks the finished output for
`{ title, url }` objects and deduplicates by URL, rather than each part of the
core registering its own citations as it goes. A hand-kept list drifts: the next
reading of the offer adds a citation and nobody remembers the registry, and the
failure is silent — a figure whose source is missing from the list the skill
reads its links from. Walking the output cannot drift, because the output is the
thing being claimed about.

## Consequences

`Citation.source` is gone; `citation.document.url` replaces it, and a catalogue
entry's statutory basis is `{ kind: "statute", document }` for the same reason.
Both were regenerated across every fixture in one change, and no figure moved.

The link checker ADR 0007 deferred gets easier: `sources` is a single, complete,
deduplicated list of every URL the tool will ever put in front of a user.
