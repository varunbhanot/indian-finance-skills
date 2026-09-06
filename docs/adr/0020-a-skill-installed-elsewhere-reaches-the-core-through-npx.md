# A skill installed outside the repository reaches the core through npx from GitHub

The `skills` CLI — `npx skills add varunbhanot/indian-finance-skills` — is how
people add a skill to a coding agent they already have. It finds every
`.claude/skills/<name>/SKILL.md` in this repository and copies that directory,
`SKILL.md` and `README.md`, into the project it is run from. Nothing else
travels: no `src/`, no `rules/`, no `package.json`. ADR 0003's seam,
`npm run ctc-decoder -- '<json>'` from the repository root, has no repository
root to run from there, so a skill that installed cleanly failed at its fourth
step.

So each CLI entrypoint under `src/cli/` is declared as a `bin` in
`package.json` — `ctc-decoder` names `src/cli/ctc-decoder.ts`, which starts
with `#!/usr/bin/env node` — and a skill running outside the repository
reaches it as

```
npx --yes --package=github:varunbhanot/indian-finance-skills ctc-decoder '<json>'
```

npm clones the repository into its cache, installs the one dependency and
links the bin; Node 22.18 or later runs the `.ts` source directly, exactly as
it does in a clone. `rules/` and `heuristics.yaml` are found from the source
file's own location (`REPOSITORY_ROOT` in `src/core/rules/files.ts`), never
from the working directory, so the installed skill reads the same statutory
files the fixtures test. The JSON contract is untouched: only the shell
command that reaches it differs, and every `SKILL.md` gives both forms and
says which applies where. `"private": true` stays in `package.json`; it
refuses `npm publish` and has no bearing on a git install.

## Considered options

**Publishing to npm.** `npx indian-finance-skills` would be shorter, but it
adds a release step and a second copy of the rules that can lag the
repository, and the whole claim of `rules/` is that it is the one place a rate
lives. A git spec resolves to the repository itself. Not ruled out later;
not needed to make the install work.

**Bundling the core inside the skill directory**, under
`.claude/skills/ctc-decoder/scripts/`, so the `skills` CLI copies it along.
That puts `src/core` and `rules/` under one skill; a second skill would need a
second copy, or a shared parent the CLI does not copy. It also moves the
directory every ADR from 0001 on names as the single home of statutory fact.

**Telling the skill to clone the repository** into a cache directory of its
own choosing and `npm install` there. That is what npx already does, with a
cache location, an install and a bin link the skill would otherwise have to
improvise — and improvise differently in each session.

**Leaving it as clone-and-run.** It was the only route and it stays a route.
But a skill that installs and then cannot run its core is worse than one that
does not install, and the `skills` CLI is the shape people expect.

## Consequences

- Every file in `src/cli/` is a `bin` in `package.json` and begins with
  `#!/usr/bin/env node`, and every `SKILL.md` names its bin through the
  `--package=github:varunbhanot/indian-finance-skills` form beside the
  `npm run` form. `test/skills-reach-the-core-from-outside.test.ts` checks all
  of it, so a new skill cannot ship reachable from the clone alone.
- The machine the skill is installed into needs git and Node 22.18 or later,
  exactly as a clone does. Below that version the bin fails with
  `ERR_UNKNOWN_FILE_EXTENSION`, which names no version; `SKILL.md` tells the
  skill to say what that means rather than report it as a fault in the offer.
- npx caches the clone, so a later `main` is not picked up until the cache is
  cleared or the spec is pinned to a commit. The figures are still the
  checked-in rules of whichever commit was cached, each cited by URL as
  always — never stale in a way the output hides.
- A skill that reads a repository file in conversation rather than through
  the CLI — the catalogue types under `groups.components.entries` — has no
  local copy outside the repository. `SKILL.md` names the file's URL on
  GitHub for that case; the CLI itself still refuses a type the file does not
  carry, so a misread costs a rerun and nothing else.
