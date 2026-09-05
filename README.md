# Indian Finance Skills

Skills for Indian personal finance.

## Structure

Each skill lives under `.claude/skills/<skill-name>/` — the directory Claude
Code auto-loads project skills from; a top-level directory would not load — and
follows the standard Claude Skill layout:

```
.claude/skills/skill-name/
  SKILL.md      # required — name, description, and instructions
  scripts/      # optional — helper scripts the skill can invoke
  references/   # optional — reference material loaded on demand
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add a new skill.

## General-purpose engineering skills

`.claude/skills/` holds general-purpose engineering skills vendored in from
[mattpocock/skills](https://github.com/mattpocock/skills) (MIT-licensed).
Claude Code auto-loads that directory, so they're available in every
session in this repo, including on the web. See `.claude/skills/README.md`
for provenance and how to update them. These are separate from the
Indian-finance skills this repo exists to build, which live alongside them.

`.claude/settings.json` also declares `mattpocock-skills` as a plugin
(`extraKnownMarketplaces` + `enabledPlugins`). On the web that declaration
alone doesn't currently load the skills — the vendored copies above are
what actually make them available there — but it's kept in case a future
Claude Code surface (CLI/desktop, via `/plugin install`) picks it up and
tracks upstream automatically.

## Status

This repository does not yet contain any Indian-finance skills of its own.
