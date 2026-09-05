/** Rejections the decoder reports to the caller as JSON with a machine-readable code. */
export type DecoderErrorCode =
  | "invalid_input"
  | "fractional_rupees"
  | "negative_amount"
  | "above_cap"
  | "invalid_financial_year"
  | "unknown_financial_year"
  | "unknown_component_type"
  | "clawback_on_recurring_component"
  | "rule_absent"
  | "vesting_schedule_not_whole"
  | "rules_file_invalid";

export interface ErrorReport<Code extends string = DecoderErrorCode> {
  code: Code;
  message: string;
  path?: string;
  details?: { [key: string]: string | number };
}

export class DecoderError extends Error {
  readonly report: ErrorReport;

  constructor(report: ErrorReport) {
    super(report.message);
    this.name = "DecoderError";
    this.report = report;
  }
}
