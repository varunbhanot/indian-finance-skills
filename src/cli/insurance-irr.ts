/**
 * CLI seam for insurance-irr (issue #65): `npm run insurance-irr -- '<json>'`
 * from the repository root, or — where a skill has only its own directory,
 * with no repository root beside it — `node <clone>/src/cli/insurance-irr.ts
 * '<json>'` against a clone in a cache directory (ADR 0020 [ctc-decoder]).
 * Node 22.18+ runs this file directly either way; what differs is only the
 * path in front of it, never the file itself.
 *
 * Prints one JSON document to stdout on success. On rejection prints a JSON
 * error to stderr and exits non-zero. No arithmetic lives here.
 */
import { intake } from "../core/insurance-irr/policy.ts";
import { InsuranceError, type InsuranceErrorCode } from "../core/insurance-irr/errors.ts";
import type { ErrorReport } from "../core/errors.ts";

/** Rejections that arise before the core sees a policy, plus the catch-all. */
type CliErrorCode = "usage" | "invalid_json" | "internal_error";

const EXIT_REJECTED = 1;
const EXIT_INTERNAL = 2;

function fail(report: ErrorReport<InsuranceErrorCode | CliErrorCode>, exitCode: number): never {
  process.stderr.write(`${JSON.stringify({ error: report }, null, 2)}\n`);
  process.exit(exitCode);
}

const argument = process.argv[2];
if (argument === undefined || process.argv.length > 3) {
  fail(
    {
      code: "usage",
      message:
        "expected exactly one argument: the policy as a JSON document, e.g. npm run insurance-irr -- '{\"financial_year\":\"2026-27\",\"linked\":false,\"annual_premium\":100000,\"premium_paying_term\":10,\"policy_term\":20,\"sum_assured\":2000000,\"scenarios\":[{\"name\":\"guaranteed\",\"maturity_benefit\":2000000}],\"inflation_bp\":500}' from the repository root, or node <clone>/src/cli/insurance-irr.ts '{...}' against a cached clone from anywhere else",
    },
    EXIT_REJECTED,
  );
}

let raw: unknown;
try {
  raw = JSON.parse(argument);
} catch (error) {
  fail(
    { code: "invalid_json", message: `argument is not valid JSON: ${(error as Error).message}` },
    EXIT_REJECTED,
  );
}

try {
  process.stdout.write(`${JSON.stringify(intake(raw), null, 2)}\n`);
} catch (error) {
  if (error instanceof InsuranceError) fail(error.report, EXIT_REJECTED);
  fail(
    { code: "internal_error", message: `unexpected failure: ${(error as Error).message}` },
    EXIT_INTERNAL,
  );
}
