/**
 * Discovering fixtures, shared by every check that walks them.
 *
 * Fixtures live at `fixtures/<skill>/<name>/`: the first segment is the skill
 * whose CLI the fixture runs through, and is also the npm script that runs it
 * (`npm run <skill> -- '<json>'`), so the layout is the only place a fixture
 * says which entrypoint it belongs to. Two skills may each have a
 * `reject-above-cap` without either overwriting the other.
 *
 * `fixtures/transcripts/` is the one top-level directory that is not a skill.
 * It holds recorded skill conversations for the traceability eval (ADR 0003
 * [ctc-decoder], issue #15), replayed by `traceability.test.ts` rather than
 * run as fixtures; `fixtures/transcripts/README.md` says what they hold.
 */
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";

export const repositoryRoot = resolve(import.meta.dirname, "..", "..");
export const fixturesRoot = join(repositoryRoot, "fixtures");

/** The one directory under `fixtures/` that is not a skill's fixtures; see above. */
const TRANSCRIPTS_DIRECTORY = "transcripts";

export interface FixtureEntry {
  /** The skill, and therefore the npm script, the fixture runs through. */
  skill: string;
  name: string;
  /** `<skill>/<name>`, for a test title or a message. */
  label: string;
  /** Absolute path of the fixture directory. */
  directory: string;
  /** Repository-relative path of the fixture directory, e.g. `fixtures/ctc-decoder/no-flags`. */
  relative: string;
}

/** Every fixture of every skill, sorted by skill then name. */
export function listFixtures(): FixtureEntry[] {
  return readdirSync(fixturesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== TRANSCRIPTS_DIRECTORY)
    .map((entry) => entry.name)
    .sort()
    .flatMap((skill) =>
      readdirSync(join(fixturesRoot, skill), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
        .map((name) => ({
          skill,
          name,
          label: `${skill}/${name}`,
          directory: join(fixturesRoot, skill, name),
          relative: `fixtures/${skill}/${name}`,
        })),
    );
}
