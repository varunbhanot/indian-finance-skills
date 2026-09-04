# Contributing

## Workflow

- `main` is the protected, always-releasable branch. Don't commit to it directly.
- Create a branch per change (`git checkout -b <your-branch>`).
- Open a pull request into `main` and let CI (once configured) pass before merging.
- Keep PRs focused on a single skill or a single change; avoid mixing unrelated edits.

## Adding a new skill

1. Create a new top-level directory named after the skill (kebab-case).
2. Add a `SKILL.md` with frontmatter (`name`, `description`) and clear instructions.
3. Keep helper scripts in `scripts/` and reference-only material in `references/`.
4. Open a PR describing what the skill does and when it should trigger.
