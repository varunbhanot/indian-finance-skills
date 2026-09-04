# Vendored skills: mattpocock/skills

The skills in this directory are copied in (not submoduled) from
[mattpocock/skills](https://github.com/mattpocock/skills), Matt Pocock's
general-purpose engineering skills (TDD, code review, spec/ticket flows,
domain modelling, etc.). Claude Code auto-loads any `.claude/skills/*/SKILL.md`
in this repo, so once this branch is merged they're available in every
session here without any install step.

- **Source**: https://github.com/mattpocock/skills
- **Vendored at**: commit `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76` (2026-08-24)
- **License**: MIT (see `LICENSE-mattpocock-skills` in the repo root) — Copyright (c) 2026 Matt Pocock
- **Scope**: the 25 skills upstream ships in its Claude Code plugin
  (`skills/engineering/*` and `skills/productivity/*` per its
  `.claude-plugin/plugin.json`). Upstream's `deprecated/`, `in-progress/`,
  and `misc/` skills were intentionally left out as not yet stable.

## Updating

These are a snapshot, not a live sync — edit them freely for this project.
To pull in upstream's latest version of a skill, re-clone
`https://github.com/mattpocock/skills`, diff the relevant
`skills/<category>/<name>/` directory against `.claude/skills/<name>/`, and
copy over what you want, updating the commit SHA above.
