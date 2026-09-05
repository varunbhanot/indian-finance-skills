/** Financial year as written in input and rules files: `2026-27`, 1 April to 31 March (CONTEXT.md). */
export const FINANCIAL_YEAR_PATTERN = /^(\d{4})-(\d{2})$/;

/** True when `fy` is well-formed `YYYY-YY` naming two consecutive years. */
export function isFinancialYear(fy: string): boolean {
  const match = FINANCIAL_YEAR_PATTERN.exec(fy);
  if (match === null) return false;
  const start = parseInt(match[1] ?? "", 10);
  const end = parseInt(match[2] ?? "", 10);
  return (start + 1) % 100 === end;
}
