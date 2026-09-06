/**
 * The consolidated list of documents a finished output cites (ADR 0007,
 * ADR 0015 [ctc-decoder]).
 *
 * Citation is what these tools offer in place of advice, so the list has to
 * be complete: every source named anywhere in the output, and nothing that
 * is not. It is therefore collected by walking the finished output rather
 * than assembled by each part of the core as it goes — a citation added to a
 * new reading of the input reaches the list without anyone remembering to
 * register it, which is the failure mode a hand-kept list has.
 *
 * A document is one `{ title, url }` object — the shape a citation's own
 * `document` carries, and the shape a catalogue entry's statutory basis
 * carries — so the walk looks for that shape and nothing else, wherever in
 * the output it turns up. Deduplication is by URL, in the order the output
 * first cites each one.
 */

/** A document an output cites: the title its rules file gives it, and its URL. */
export interface Source {
  title: string;
  url: string;
}

export function sourcesIn(output: unknown): Source[] {
  const byUrl = new Map<string, Source>();
  collect(output, byUrl);
  return [...byUrl.values()];
}

function collect(value: unknown, byUrl: Map<string, Source>): void {
  if (Array.isArray(value)) {
    for (const item of value) collect(item, byUrl);
    return;
  }
  if (typeof value !== "object" || value === null) return;

  const source = asSource(value);
  if (source !== undefined && !byUrl.has(source.url)) byUrl.set(source.url, source);
  for (const child of Object.values(value)) collect(child, byUrl);
}

function asSource(value: object): Source | undefined {
  const { title, url } = value as { title?: unknown; url?: unknown };
  return typeof title === "string" && typeof url === "string" ? { title, url } : undefined;
}
