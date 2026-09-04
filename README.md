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

## General-purpose engineering skills

This repo enables [mattpocock/skills](https://github.com/mattpocock/skills)
(MIT-licensed) as a Claude Code plugin via `.claude/settings.json`
(`extraKnownMarketplaces` + `enabledPlugins`), so its engineering/productivity
skills (TDD, code review, spec/ticket flows, domain modelling, etc.) are
available in every session in this repo, kept current with upstream. These
are separate from the top-level, Indian-finance skills this repo exists to
build.

Earlier revisions of this repo vendored copies of these skills directly into
`.claude/skills/`; that was replaced by the plugin so there's one source of
truth instead of a snapshot to keep in sync by hand.

## Status

This repository does not yet contain any Indian-finance skills of its own.
