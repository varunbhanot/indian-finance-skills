/**
 * Validates a transcript a contributor is about to add under
 * `fixtures/transcripts/`, before it is committed: the same traceability eval
 * `npm test` runs, so a transcript that would fail in CI fails here first,
 * with the same failure named. `scripts/record-transcript.ts` is what
 * produces the file this checks; see its header for the recording workflow
 * (issue #15).
 *
 * Usage: `npm run check-transcript -- fixtures/transcripts/<name>/transcript.json`
 */
import { readFileSync } from "node:fs";
import { checkTranscript, describeFailures, type Transcript } from "../test/lib/traceability.ts";

const path = process.argv[2];
if (path === undefined || process.argv.length > 3) {
  process.stderr.write(
    "usage: npm run check-transcript -- fixtures/transcripts/<name>/transcript.json\n",
  );
  process.exit(1);
}

let raw: unknown;
try {
  raw = JSON.parse(readFileSync(path, "utf8"));
} catch (error) {
  process.stderr.write(`${path} is not valid JSON: ${(error as Error).message}\n`);
  process.exit(1);
}

const shapeProblems = shapeProblemsIn(raw);
if (shapeProblems.length > 0) {
  process.stderr.write(`${path} does not match the transcript shape:\n${shapeProblems.join("\n")}\n`);
  process.exit(1);
}

const transcript = raw as Transcript;
const failures = checkTranscript(transcript);
if (failures.length > 0) {
  process.stderr.write(`${path} would fail the traceability eval:\n${describeFailures(failures)}\n`);
  process.exit(1);
}

process.stdout.write(`${path} is traceable to its tool events and reads as analysis, not advice.\n`);

/** What `checkTranscript` assumes about its argument, checked before it runs. */
function shapeProblemsIn(value: unknown): string[] {
  if (typeof value !== "object" || value === null) return ["the document is not an object"];
  const { events } = value as { events?: unknown };
  if (!Array.isArray(events)) return ["\"events\" is missing or is not an array"];

  const problems: string[] = [];
  events.forEach((event, index) => {
    if (typeof event !== "object" || event === null) {
      problems.push(`events[${index}] is not an object`);
      return;
    }
    const { kind, text, input, output } = event as Record<string, unknown>;
    if (kind === "user" || kind === "assistant") {
      if (typeof text !== "string") problems.push(`events[${index}] (${kind}) is missing "text"`);
      return;
    }
    if (kind === "tool") {
      if (input === undefined) problems.push(`events[${index}] (tool) is missing "input"`);
      if (output === undefined) problems.push(`events[${index}] (tool) is missing "output"`);
      return;
    }
    problems.push(`events[${index}] has an unrecognised "kind": ${JSON.stringify(kind)}`);
  });
  return problems;
}
