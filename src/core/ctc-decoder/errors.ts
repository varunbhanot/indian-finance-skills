/**
 * Rejections the decoder reports to the caller as JSON with a machine-readable
 * code. The report shape and the error class are shared with every skill's
 * core (`../errors.ts`); only this code list, and the narrowing of that class
 * to it, belong to the decoder.
 */
import { CoreError, type ErrorReport } from "../errors.ts";

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

export class DecoderError extends CoreError<DecoderErrorCode> {
  constructor(report: ErrorReport<DecoderErrorCode>) {
    super(report);
    // Nothing observable changes (issue #64): CoreError's own constructor
    // names itself "CoreError", so a decoder rejection reclaims its own name
    // the way it had one before the lift.
    this.name = "DecoderError";
  }
}
