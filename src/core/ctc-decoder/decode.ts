/**
 * The CTC decoder's deterministic core. This walking skeleton normalises the
 * offer: whole rupees become paise, monthly amounts are annualised, and the
 * financial year is resolved to its rules file. No classification yet.
 */
import { annualise, money, rupeesToPaise, type Money, type Period } from "../money.ts";
import { resolveRulesFile, rulesFilePathFor, type RulesFile } from "../rules/files.ts";
import { RulesFileError } from "../rules/loader.ts";
import { DecoderError } from "./errors.ts";
import { validateOfferInput } from "./input.ts";

export interface DecodedComponent {
  name: string;
  /** The amount and period exactly as the user entered them, for the narration to quote. */
  as_typed: { amount: Money; period: Period };
  annual: Money;
}

export interface DecodedOffer {
  financial_year: string;
  rules_file: string;
  components: DecodedComponent[];
}

export function decode(raw: unknown): DecodedOffer {
  const input = validateOfferInput(raw);
  const rules = rulesFor(input.financial_year);

  return {
    financial_year: input.financial_year,
    rules_file: rules.path,
    components: input.components.map((component) => {
      const typedPaise = rupeesToPaise(component.amount);
      return {
        name: component.name,
        as_typed: { amount: money(typedPaise), period: component.period },
        annual: money(annualise(typedPaise, component.period)),
      };
    }),
  };
}

/** The rules file for the typed financial year; a missing or malformed file is a rejection. */
function rulesFor(financialYear: string): RulesFile {
  const expectedFile = rulesFilePathFor(financialYear);
  let rules: RulesFile | undefined;
  try {
    rules = resolveRulesFile(financialYear);
  } catch (error) {
    if (!(error instanceof RulesFileError)) throw error;
    throw new DecoderError({
      code: "rules_file_invalid",
      message: `${expectedFile} failed the rules schema: ${error.message}`,
      path: "financial_year",
      details: { rules_file: expectedFile, rules_error: error.code },
    });
  }
  if (rules === undefined) {
    throw new DecoderError({
      code: "unknown_financial_year",
      message: `No rules file for financial year ${financialYear}: expected ${expectedFile}`,
      path: "financial_year",
      details: { financial_year: financialYear, expected_file: expectedFile },
    });
  }
  return rules;
}
