/**
 * The turns of phrase that carry a recommendation (ADR 0007). Shared between
 * `output-invariants.test.ts`, which holds the decoder's own output to this
 * list, and `traceability.test.ts`, which holds a recorded transcript's
 * `assistant` turns to the same list (`fixtures/transcripts/README.md`).
 *
 * Deliberately about wording rather than intent, because that is what a test
 * can hold: a sentence telling the reader what to do has to reach for one of
 * these, and none of them can appear in a statement of what a rule says.
 * `considerations` is a word two of the rules file's statutory quotes use, so
 * the boundary on `consider` matters.
 */
export const ADVISORY = [
  /\byou should\b/i,
  /\brecommend/i,
  /\bsuggest/i,
  /\badvis(e|es|ed|able|ory|ice)\b/i,
  /\bconsider\b/i,
  /\bnegotiat/i,
  /\bask for\b/i,
  /\bpush for\b/i,
  /\bbetter off\b/i,
  /\bopt for\b/i,
  /\bought to\b/i,
  /\bmake sure\b/i,
  /\bideally\b/i,
  /\btoo (low|high|little|much)\b/i,
];
