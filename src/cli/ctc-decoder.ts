/**
 * CLI seam for the CTC decoder (ADR 0003): `npm run ctc-decoder -- '<json>'`.
 * Prints one JSON document to stdout on success. On rejection prints a JSON
 * error to stderr and exits non-zero. No arithmetic lives here.
 */
import { decode } from "../core/ctc-decoder/decode.ts";
import {
  DecoderError,
  type DecoderErrorCode,
  type ErrorReport,
} from "../core/ctc-decoder/errors.ts";

/** Rejections that arise before the core sees an offer, plus the catch-all. */
type CliErrorCode = "usage" | "invalid_json" | "internal_error";

const EXIT_REJECTED = 1;
const EXIT_INTERNAL = 2;

function fail(report: ErrorReport<DecoderErrorCode | CliErrorCode>, exitCode: number): never {
  process.stderr.write(`${JSON.stringify({ error: report }, null, 2)}\n`);
  process.exit(exitCode);
}

const argument = process.argv[2];
if (argument === undefined || process.argv.length > 3) {
  fail(
    {
      code: "usage",
      message:
        "expected exactly one argument: the offer as a JSON document, e.g. npm run ctc-decoder -- '{\"financial_year\":\"2026-27\",\"components\":[...]}'",
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
  process.stdout.write(`${JSON.stringify(decode(raw), null, 2)}\n`);
} catch (error) {
  if (error instanceof DecoderError) fail(error.report, EXIT_REJECTED);
  fail(
    { code: "internal_error", message: `unexpected failure: ${(error as Error).message}` },
    EXIT_INTERNAL,
  );
}
