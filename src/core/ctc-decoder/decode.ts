/**
 * The CTC decoder's deterministic core. This walking skeleton normalises the
 * offer: whole rupees become paise, monthly amounts are annualised, and the
 * financial year is resolved to its rules file. No classification yet.
 */
import { annualise, money, rupeesToPaise, type Money, type Period } from "../money.ts";
import { readRulesFile, rulesFilePathFor } from "../rules/files.ts";
import { RulesFileError } from "../rules/loader.ts";
import { DecoderError } from "./errors.ts";
import { validateOfferInput } from "./input.ts";

export interface DecodedComponent {
  name: string;
  typed: { amount: Money; period: Period };
  annual: Money;
}

export interface DecodedOffer {
  financial_year: string;
  rules_file: string;
  components: DecodedComponent[];
}

export function decode(raw: unknown): DecodedOffer {
  const input = validateOfferInput(raw);
  const rulesFile = rulesFilePathFor(input.financial_year);
  loadRulesOrReport(rulesFile);

  return {
    financial_year: input.financial_year,
    rules_file: rulesFile,
    components: input.components.map((component) => {
      const typedPaise = rupeesToPaise(component.amount);
      return {
        name: component.name,
        typed: { amount: money(typedPaise), period: component.period },
        annual: money(annualise(typedPaise, component.period)),
      };
    }),
  };
}

function loadRulesOrReport(rulesFile: string): void {
  try {
    readRulesFile(rulesFile);
  } catch (error) {
    if (error instanceof RulesFileError) {
      throw new DecoderError({
        code: "rules_file_invalid",
        message: `${rulesFile} failed the rules schema: ${error.message}`,
        path: "financial_year",
        details: { rules_file: rulesFile, rules_error: error.code },
      });
    }
    throw error;
  }
}
