/**
 * Rejections raised anywhere in the deterministic core, reported to a CLI
 * seam as JSON with a machine-readable code (ADR 0003 [ctc-decoder]).
 *
 * The shape is generic over its code list on purpose: each skill's own core
 * narrows it to the codes that skill can throw (see e.g. `ctc-decoder/errors.ts`),
 * so a code new to one skill can never leak into another's type checking.
 * Only the shape and the class are shared here; a skill's code list, and any
 * error it constructs from it, stay that skill's own.
 */
export interface ErrorReport<Code extends string = string> {
  code: Code;
  message: string;
  path?: string;
  details?: { [key: string]: string | number };
}

export class CoreError<Code extends string = string> extends Error {
  readonly report: ErrorReport<Code>;

  constructor(report: ErrorReport<Code>) {
    super(report.message);
    this.name = "CoreError";
    this.report = report;
  }
}
