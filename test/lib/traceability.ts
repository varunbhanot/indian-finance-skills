/**
 * The traceability eval (ADR 0003, issue #15): every rupee figure and every
 * URL an `assistant` turn states must appear, verbatim, in a `tool` event's
 * input or output somewhere in the same transcript. `fixtures/transcripts/`
 * holds the recorded material this runs over; its own README says what the
 * invariant means in practice and why a figure can come from a *later* tool
 * call (the confirmation table in step 3 is checked against the run that
 * follows it, not one that came before).
 *
 * Extraction, not the decoder, does the classifying here: a rupee figure is
 * either `₹`-prefixed (`₹12,00,000`, `₹0`) or a bare Indian-grouped number
 * with no `₹` (the confirmation table's `Amount` column). Both forms are
 * matched as text and checked as text — nothing here recomputes a figure to
 * see if it is "close enough". The two forms are extracted in two passes so
 * neither swallows part of the other: the `₹`-prefixed matches are found and
 * masked out of the text first, and the bare pass runs on what is left, so a
 * bare match can never start mid-way through a `₹`-prefixed one.
 *
 * ADR 0007's other half — nothing in an `assistant` turn reads as advice — is
 * checked here too, against the same word list `output-invariants.test.ts`
 * holds the decoder's own output to (`fixtures/transcripts/README.md`).
 */
import { ADVISORY } from "./advisory-language.ts";

export interface ToolEvent {
  kind: "tool";
  step?: string;
  input: unknown;
  output: unknown;
}

export interface AssistantEvent {
  kind: "assistant";
  step?: string;
  text: string;
}

export interface UserEvent {
  kind: "user";
  text: string;
}

export type TranscriptEvent = ToolEvent | AssistantEvent | UserEvent;

export interface Transcript {
  letter?: string;
  skill?: string;
  recorded?: string;
  events: TranscriptEvent[];
}

export interface Failure {
  /** The `step` of the assistant turn the offending text came from, if named. */
  step: string | undefined;
  kind: "figure" | "url" | "advisory";
  /** The offending text, verbatim, so the failure names it. */
  value: string;
}

/** `₹` followed by a run of digits, optionally grouped: `₹0`, `₹800`, `₹12,00,000`. */
const RUPEE_PREFIXED = /₹\d{1,3}(?:,\d{2,3})*/g;

/** A bare Indian-grouped number with no `₹`: `12,00,000`, `57,720`, `24,000`. */
const BARE_GROUPED = /\b\d{1,2}(?:,\d{2})*,\d{3}\b/g;

const URL_PATTERN = /https?:\/\/[^\s")\]]+/g;

/** Trailing punctuation a URL picks up from ending a sentence, not part of it. */
const TRAILING_PUNCTUATION = /[.,;:!?)\]'"]+$/;

/** Replaces each `[start, end)` range in `text` with spaces, keeping its length. */
function mask(text: string, ranges: [number, number][]): string {
  const chars = [...text];
  for (const [start, end] of ranges) {
    for (let i = start; i < end; i++) chars[i] = " ";
  }
  return chars.join("");
}

/** Every rupee figure in `text`, `₹`-prefixed and bare, in the order first met. */
export function extractRupeeFigures(text: string): string[] {
  const prefixedMatches = [...text.matchAll(RUPEE_PREFIXED)];
  const prefixed = prefixedMatches.map((match) => match[0]);
  const ranges: [number, number][] = prefixedMatches.map((match) => [
    match.index,
    match.index + match[0].length,
  ]);
  const bare = [...mask(text, ranges).matchAll(BARE_GROUPED)].map((match) => match[0]);
  return [...prefixed, ...bare];
}

/** Every URL in `text`, trimmed of trailing sentence punctuation. */
export function extractUrls(text: string): string[] {
  return [...text.matchAll(URL_PATTERN)].map((match) => match[0].replace(TRAILING_PUNCTUATION, ""));
}

/** Every `tool` event's input and output, concatenated as the CLI printed it. */
function toolHaystack(transcript: Transcript): string {
  return transcript.events
    .filter((event): event is ToolEvent => event.kind === "tool")
    .map((event) => `${JSON.stringify(event.input)}${JSON.stringify(event.output)}`)
    .join("\n");
}

/** Whether a bare grouped figure's digits appear, ungrouped, as a whole number in `haystack`. */
function bareFigureIsTraceable(figure: string, haystack: string): boolean {
  const digits = figure.replaceAll(",", "");
  return new RegExp(`\\b${digits}\\b`).test(haystack);
}

/**
 * Checks every `assistant` turn in `transcript` against its `tool` events and
 * the advisory word list. Returns one `Failure` per offending figure, URL or
 * phrase — empty when the transcript holds up.
 */
export function checkTranscript(transcript: Transcript): Failure[] {
  const haystack = toolHaystack(transcript);
  const failures: Failure[] = [];

  for (const event of transcript.events) {
    if (event.kind !== "assistant") continue;

    for (const figure of extractRupeeFigures(event.text)) {
      const traceable = figure.startsWith("₹")
        ? haystack.includes(figure)
        : bareFigureIsTraceable(figure, haystack);
      if (!traceable) failures.push({ step: event.step, kind: "figure", value: figure });
    }

    for (const url of extractUrls(event.text)) {
      if (!haystack.includes(url)) failures.push({ step: event.step, kind: "url", value: url });
    }

    for (const advisory of ADVISORY) {
      const match = event.text.match(advisory);
      if (match !== null) failures.push({ step: event.step, kind: "advisory", value: match[0] });
    }
  }

  return failures;
}

/** One line per failure, naming the offending value, for an assertion message. */
export function describeFailures(failures: Failure[]): string {
  return failures
    .map((failure) => {
      const where = failure.step === undefined ? "" : ` (${failure.step})`;
      if (failure.kind === "advisory") return `reads as advice${where}: ${failure.value}`;
      const what = failure.kind === "figure" ? "figure" : "URL";
      return `${what} not traceable to a tool event${where}: ${failure.value}`;
    })
    .join("\n");
}
