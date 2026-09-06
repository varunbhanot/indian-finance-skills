# Vendored skills: mattpocock/skills

The skills in this directory are copied in (not submoduled) from
[mattpocock/skills](https://github.com/mattpocock/skills), Matt Pocock's
general-purpose engineering skills (TDD, code review, spec/ticket flows,
domain modelling, etc.). They are development tooling for whoever works on
this repository. None of them is a finance skill, and none of them ships to
someone who came here for the finance skills.

- **Source**: https://github.com/mattpocock/skills
- **Vendored at**: commit `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76` (2026-08-24)
- **License**: MIT (see `LICENSE-mattpocock-skills` in the repo root) — Copyright (c) 2026 Matt Pocock
- **Scope**: the 25 skills upstream ships in its Claude Code plugin
  (`skills/engineering/*` and `skills/productivity/*` per its
  `.claude-plugin/plugin.json`), plus `ask-matt`. Upstream's `deprecated/`,
  `in-progress/`, and `misc/` skills were intentionally left out as not yet
  stable.

## Why they live here and not in `.claude/skills/`

They do both, and that is the point. The content is here; `.claude/skills/`
holds a symlink per skill pointing back into this directory. So
`.claude/skills/` reads as one finance skill (`ctc-decoder`, a real directory)
next to a wall of links whose targets all say `vendor/mattpocock-skills/`.
Nobody has to guess which is which.

The symlink is load-bearing, not cosmetic. Claude Code loads project skills
only from a direct child of `.claude/skills/` holding a `SKILL.md`, and it
follows a symlink there and reads `SKILL.md` from the target. Two layouts that
look tidier do not work:

- **A subdirectory** (`.claude/skills/vendor/<name>/`) is a nested skills
  directory. It does not load at session start, only once Claude happens to
  read a file underneath it.
- **A skills-directory plugin** (a `.claude-plugin/plugin.json` here, giving
  `/mattpocock-skills:tdd` names) loads at project scope only after the
  workspace trust dialog is accepted. Claude Code on the web does not accept
  it, so the skills would silently disappear there.

If you check this repository out on Windows, git needs symlink support
(`git config core.symlinks true`, plus Developer Mode or an elevated shell) or
the links arrive as text files holding a path and no skill loads.

## Updating

These are a snapshot, not a live sync — edit them freely for this project.
To pull in upstream's latest version of a skill, re-clone
`https://github.com/mattpocock/skills`, diff the relevant
`skills/<category>/<name>/` directory against
`vendor/mattpocock-skills/<name>/`, and copy over what you want, updating the
commit SHA above. Adding a skill upstream ships since this snapshot means
creating the symlink too:

```
ln -s ../../vendor/mattpocock-skills/<name> .claude/skills/<name>
```
