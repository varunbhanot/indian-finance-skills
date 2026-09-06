# Skills call a CLI entrypoint, and "the model never computes" is a test

Each deterministic-core module ships a CLI entrypoint (`npm run <skill> -- '<json>'`)
that prints structured JSON, and the `SKILL.md` narrates that output rather than
doing arithmetic. An MCP server was rejected: it would add configuration to the
"clone and run" contributor story without preventing mental arithmetic any better
than a Bash command does.

The important half is the enforcement. "Never compute" written in a `SKILL.md` is a
norm, and norms are not testable — awkward for a project whose whole claim is
testability. So the invariant is made mechanical instead: **every rupee figure in a
skill's response must appear either in the tool's input or in its output JSON**, and
an eval extracts the numbers from the model's prose and asserts each is traceable.
A violation fails a test rather than going unnoticed.

For the same reason the tool emits display strings alongside machine values
(`{ paise: 10400000, display: "₹1,04,000" }`). Indian digit grouping is itself an
error-prone transform — ₹12,34,567, not ₹1,234,567 — so the model copies a string
rather than reformatting a number.
