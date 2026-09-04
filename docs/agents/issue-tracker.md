# Issue tracker: GitHub (via MCP, not the `gh` CLI)

Issues and specs for this repo live as GitHub issues on
`varunbhanot/indian-finance-skills`.

**The `gh` CLI is not available in this environment** — Claude Code web sessions
have no `gh` binary, and GitHub access runs through the GitHub MCP server
instead. The upstream template for this file assumes `gh` throughout; every
operation below is the MCP equivalent. If you find yourself typing `gh`, stop and
use the tool named here.

## Conventions

| Operation | Tool |
| --- | --- |
| Create an issue | `mcp__github__issue_write` (method `create`) |
| Read an issue and its comments | `mcp__github__issue_read` |
| List issues | `mcp__github__list_issues`, or `mcp__github__search_issues` for filtered queries |
| Comment on an issue | `mcp__github__add_issue_comment` |
| Apply / remove labels | `mcp__github__issue_write` (method `update`) |
| Close an issue | `mcp__github__issue_write` (method `update`, with `state_reason`) |
| Create a sub-issue | `mcp__github__sub_issue_write` |
| Read a PR / its diff / its reviews | `mcp__github__pull_request_read` |
| Open a PR | `mcp__github__create_pull_request` |

Tool schemas are deferred: load them with `ToolSearch` (e.g.
`select:mcp__github__issue_write`) before calling them.

Owner and repo are always explicit arguments — there is no "infer from the
current clone" behaviour to rely on, unlike `gh`.

## Blocking edges

GitHub's **native issue dependencies** have no verified MCP equivalent, so this
repo uses the upstream template's documented fallback: a `Blocked by: #<n>, #<n>`
line at the top of the child issue's body. **A ticket is unblocked when every
issue listed there is closed.** This is a downgrade from the UI-visible
dependency graph — it is a convention, so it only works if every ticket-writing
skill maintains that line.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs
as feature requests; `/triage` reads this flag.)_

## When a skill says "publish to the issue tracker"

Create a GitHub issue with `mcp__github__issue_write`.

## When a skill says "fetch the relevant ticket"

Read it with `mcp__github__issue_read`, including comments.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue labelled `wayfinder:map`
holding the Notes / Decisions-so-far / Fog body; **child tickets** are sub-issues
created with `mcp__github__sub_issue_write`, labelled `wayfinder:<type>`
(`research` / `prototype` / `grilling` / `task`), each carrying `Part of #<map>`
at the top of its body. Blocking uses the `Blocked by:` fallback above. The
frontier is the map's open children with no open blocker and no assignee, first
in map order winning.
