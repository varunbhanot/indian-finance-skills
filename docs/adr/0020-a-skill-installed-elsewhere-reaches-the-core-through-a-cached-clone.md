# A skill installed outside the repository reaches the core through a cached clone

The `skills` CLI — `npx skills add varunbhanot/indian-finance-skills` — is how
people add a skill to a coding agent they already have. It finds every
`.claude/skills/<name>/SKILL.md` in this repository and copies that directory,
`SKILL.md` and `README.md`, into the project it is run from. Nothing else
travels: no `src/`, no `rules/`, no `package.json`. ADR 0003's seam,
`npm run ctc-decoder -- '<json>'` from the repository root, has no repository
root to run from there, so a skill that installed cleanly failed at its fourth
step.

The fix is not npm. A first attempt declared each `src/cli/` entrypoint as a
`bin` in `package.json` so a skill could reach it with
`npx --package=github:varunbhanot/indian-finance-skills ctc-decoder '<json>'`.
It clones and installs, but every file npm or npx resolves through a `bin` is,
by construction, inside a `node_modules` directory — that is what an npm
install *is* — and Node refuses to strip types from any file under
`node_modules`, with `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` and no flag
to lift it (confirmed against Node 22.22.2: `--experimental-strip-types` finds
nothing to except node_modules from the restriction). A `.ts` entrypoint run
through an npm-installed bin cannot work on this project's own terms — a build
step would fix it, and the project has none.

So the skill reaches the core the way a person does, minus the parts a person
does by hand: clone the repository into a stable cache directory, `npm
install` there once, and run `node <clone>/src/cli/ctc-decoder.ts '<json>'`
directly. Nothing about that file is under `node_modules` — it sits in a plain
git checkout — so Node's stripping applies exactly as it does in a developer's
own clone. `SKILL.md` gives the three commands as one sequence:

```
[ -d ~/.cache/indian-finance-skills/.git ] \
  && git -C ~/.cache/indian-finance-skills pull --ff-only -q \
  || git clone -q --depth 1 https://github.com/varunbhanot/indian-finance-skills ~/.cache/indian-finance-skills
(cd ~/.cache/indian-finance-skills && npm install --no-fund --no-audit -q)
node ~/.cache/indian-finance-skills/src/cli/ctc-decoder.ts '<json>'
```

`rules/` and `heuristics.yaml` are found from the source file's own location
(`REPOSITORY_ROOT` in `src/core/rules/files.ts`), never from the working
directory, so this reads the same statutory files the fixtures test — the
clone's, at whatever commit `git pull` last landed on. The JSON contract is
untouched: only the shell command that reaches it differs, and every
`SKILL.md` gives both forms and says which applies where.

## Considered options

**A `bin` in `package.json`, reached through npx.** Tried first, and ruled
out by the `node_modules` restriction above — not a rough edge to work around,
a restriction with no override.

**Publishing compiled `.js` to npm.** Would sidestep the stripping question
entirely, since compiled output carries no types to strip. It buys that at the
cost of a build step and a second, generated copy of everything under
`src/`, for the sake of one command's ergonomics — this repository has no
build step by design (CLAUDE.md, Tooling), and it would need one solely to
make an npx shortcut work, not to make the decoder work.

**Bundling the core inside the skill directory**, under
`.claude/skills/ctc-decoder/scripts/`, so the `skills` CLI copies it along.
That puts `src/core` and `rules/` under one skill; a second skill would need a
second copy, or a shared parent the CLI does not copy. It also moves the
directory every ADR from 0001 on names as the single home of statutory fact.

**A shorter one-liner clone command**, without the cache directory — cloning
to a fresh temporary directory on every call. Simplest to state, but it
re-clones and re-installs on every single decode, which is slow and needless
network traffic for a command a session runs repeatedly in one conversation;
the cache directory with a `pull` is barely more to write and avoids both.

## Consequences

- `SKILL.md` for a skill with a CLI entrypoint states the cached-clone
  sequence beside the repository-root form and says which applies where: a
  working directory holding this repository's own `package.json` uses `npm
  run <name>`; anywhere else uses the clone. `test/skills-reach-the-core-from-
  outside.test.ts` checks that every `SKILL.md` with an `npm run <name>` line
  also gives a `node <clone-path>/src/cli/<file>` line naming a real file
  under `src/cli/`.
- The machine the skill runs on needs git and Node 22.18 or later, exactly as
  a clone does; below that version the clone fails with
  `ERR_UNKNOWN_FILE_EXTENSION`, which names no version, and `SKILL.md` says to
  report that plainly rather than as a fault in the offer.
- The cache directory holds whichever commit `git pull --ff-only` last landed
  on `main` at. A `pull` that is not fast-forward (a rewritten history on
  `main`, which this repository's branch protection does not otherwise allow)
  is left for the skill to notice and re-clone rather than silently resolved.
- A skill that reads a repository file in conversation rather than through
  the CLI — the catalogue types under `groups.components.entries` — has no
  guaranteed local copy on a machine's very first turn, before the clone
  exists. `SKILL.md` names the file's raw GitHub URL for that case; the CLI
  itself still refuses a type the file does not carry, so a misread costs a
  rerun and nothing else.
