/**
 * Rejections the insurance-irr core reports to the caller as JSON with a
 * machine-readable code. The report shape and the error class are shared with
 * every skill's core (`../errors.ts`); only this code list, and the narrowing
 * of that class to it, belong to this skill (issue #64).
 *
 * Eleven of these are the structural impossibilities issue #65 names; the
 * other two (`invalid_input`, `invalid_financial_year`) are the same general
 * shape checks the CTC decoder's own error list carries, for a value that is
 * simply the wrong type or shape rather than one of the eleven named
 * impossibilities.
 */
import { CoreError, type ErrorReport } from "../errors.ts";

export type InsuranceErrorCode =
  | "invalid_input"
  | "invalid_financial_year"
  | "unknown_financial_year"
  | "fractional_rupees"
  | "negative_amount"
  | "above_cap"
  | "rate_out_of_range"
  | "premium_paying_term_exceeds_policy_term"
  | "premiums_paid_exceeds_premium_paying_term"
  | "survival_benefit_outside_policy_term"
  | "scenarios_without_guaranteed_first"
  | "duplicate_scenario_name"
  | "in_force_without_issued_on";

export class InsuranceError extends CoreError<InsuranceErrorCode> {
  constructor(report: ErrorReport<InsuranceErrorCode>) {
    super(report);
    this.name = "InsuranceError";
  }
}
