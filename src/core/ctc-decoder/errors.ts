/** Rejections the decoder reports to the caller as JSON with a machine-readable code. */
export type DecoderErrorCode =
  | "usage"
  | "invalid_json"
  | "invalid_input"
  | "fractional_rupees"
  | "negative_amount"
  | "above_cap"
  | "invalid_financial_year"
  | "unknown_financial_year"
  | "rules_file_invalid";

export interface DecoderErrorReport {
  code: DecoderErrorCode;
  message: string;
  path?: string;
  details?: { [key: string]: string | number };
}

export class DecoderError extends Error {
  readonly report: DecoderErrorReport;

  constructor(report: DecoderErrorReport) {
    super(report.message);
    this.name = "DecoderError";
    this.report = report;
  }
}
