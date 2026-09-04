# Indian Finance Skills

Skills for Indian personal finance.

## Structure

Each skill lives in its own top-level directory and follows the standard
Claude Skill layout:

```
skill-name/
  SKILL.md      # required — name, description, and instructions
  scripts/      # optional — helper scripts the skill can invoke
  references/   # optional — reference material loaded on demand
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add a new skill.

## Vendored skills

`.claude/skills/` holds general-purpose engineering skills vendored in from
[mattpocock/skills](https://github.com/mattpocock/skills) (MIT-licensed).
Claude Code auto-loads that directory, so they're available in every
session in this repo. See `.claude/skills/README.md` for provenance and how
to update them. These are separate from the top-level, Indian-finance
skills this repo exists to build.

## Status

This repository does not yet contain any Indian-finance skills of its own.
