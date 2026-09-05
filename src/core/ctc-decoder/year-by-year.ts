/**
 * The package year by year, on both bases: what arrives in each of the years the
 * offer covers, against the average the letter quotes.
 *
 * An offer letter states one annual figure. Where a grant vests 5/15/40/40, or a
 * joining bonus lands once, that figure is an average of years that are nothing
 * like each other, and the gap between year one and the average is invisible
 * until the years are written out. Writing them out is all this reading does: it
 * moves no value between years, and it invents no schedule. A cliff is carried
 * as the months the letter states and changes no cell — what a cliff means for a
 * reader who leaves early is the skill's to say, and the schedule beside it is
 * unchanged either way.
 *
 * The table spans `max(4, the longest schedule typed)` years, because four is
 * the horizon an offer is habitually averaged over (CONTEXT.md, "Back-loaded"),
 * and a schedule longer than that is not truncated to fit it.
 *
 * Four columns, and they are the four things that move or are claimed to:
 * guaranteed recurring cash, variable pay at its target, the one-time items in
 * the year they land, and each grant's vest. The rest of the package is
 * deliberately outside the table and is in `totals` instead — retirals, benefits
 * in kind, and a grant with no schedule to spread all arrive on the same terms
 * in every year, so writing them into every row would restate the package rather
 * than show what separates its years. `total` is therefore the total of this
 * table's own columns and never the headline CTC.
 *
 * Equity enters on both readings at once, as it does everywhere else (ADR 0016):
 * `equity_as_valued` is what the decoder holds the vest at and is what `total`
 * counts, and `equity_as_claimed` is the letter's own figure for the same vest,
 * carried beside it. A grant the decoder refuses to value is nil in every year
 * of the first column and never absent from the second.
 */
import { divideWithRemainder } from "../arithmetic.ts";
import { applyRate, money, rate, type Money, type Rate } from "../money.ts";
import type { ClassifiedComponent, EquityReading } from "./classification.ts";
import {
  BASES,
  countsTowardGuaranteedRecurringCash,
  landsWholeInYearOne,
  type Basis,
} from "./totals.ts";

/**
 * The horizon an offer letter is habitually averaged over, and so the shortest
 * table that can show what that average hides. A schedule reaching further than
 * this lengthens the table; none shortens it.
 */
const MINIMUM_YEARS = 4;

/** The year the offer starts in, which is the year every one-time component lands in. */
const FIRST_YEAR = 1;

/** One year of one grant: the share the letter's schedule gives it, on both readings. */
export interface GrantVestYear {
  year: number;
  share: Rate;
  as_valued: Money;
  as_claimed: Money;
}

export interface GrantVesting {
  /** The component name as the user typed it, which is how the rows name it back. */
  name: string;
  /** True where every `as_valued` below is nil because the grant cannot be valued (ADR 0005). */
  unvaluable: boolean;
  /**
   * The months before which nothing vests, repeated here from the grant's own
   * block: the table is where a reader asks why year one is small, and the
   * answer has to be beside the rows rather than a scroll away. It moves no
   * value between the years below it.
   */
  cliff_months?: number;
  /**
   * One row per year of the table. Empty for a grant with nothing that vests: a
   * share purchase plan carries no schedule, and dividing it across the years
   * would be the invented schedule ADR 0016 refuses.
   */
  years: GrantVestYear[];
}

export interface YearRow {
  year: number;
  guaranteed_recurring_cash: Money;
  /** Nil on the zero basis, and the quoted target on the target basis. */
  variable_pay_at_target: Money;
  /** The one-time components, whole, in the year they land; nil in every later year. */
  one_time: Money;
  /** What the decoder holds this year's vests at, summed over the grants. */
  equity_as_valued: Money;
  /** What the letter claims those same vests are worth (ADR 0016). */
  equity_as_claimed: Money;
  /** The four columns above on the valued reading; not the headline CTC. */
  total: Money;
}

export interface YearAverage {
  over_years: number;
  /**
   * The average of the table exactly as it stands. It is a fact about the table
   * and not a recurring figure: the components named below arrive once and are
   * inside it (CONTEXT.md, "One-time component").
   */
  with_one_time: Money;
  /** The same average with those components out of it. */
  without_one_time: Money;
  /** The one-time components inside `with_one_time`, so the figure names what it holds. */
  one_time_components: string[];
}

export interface YearByYearOnBasis {
  basis: Basis;
  years: YearRow[];
  /** `years[0].total`, repeated so it stands beside the average rather than above it. */
  year_one: Money;
  average: YearAverage;
}

export interface YearByYear {
  /** `max(4, the longest schedule typed)`; every basis below spans exactly this. */
  years_covered: number;
  /** Both bases, as two readings of one table; the order carries no preference (ADR 0007). */
  bases: YearByYearOnBasis[];
  /** One entry per equity grant, valued or not, in the order the components were typed. */
  grants: GrantVesting[];
}

export function yearByYearFor(components: readonly ClassifiedComponent[]): YearByYear {
  const grantComponents = components.filter((component) => component.equity !== undefined);
  const yearsCovered = yearsCoveredBy(grantComponents);

  // Everything but the variable column is the same on both bases, so each of
  // these is derived once and both bases are built from them.
  const table = {
    years_covered: yearsCovered,
    guaranteed_paise: sum(components, countsTowardGuaranteedRecurringCash),
    one_time: oneTimeIn(components),
    grants: grantComponents.map((component) => vestingOf(component, yearsCovered)),
  };

  return {
    years_covered: yearsCovered,
    bases: BASES.map(({ basis, counts }) =>
      onBasis(basis, sum(components, counts) - table.guaranteed_paise, table),
    ),
    grants: table.grants,
  };
}

/** What a table shares between its two bases; only the variable column is outside it. */
interface SharedTable {
  years_covered: number;
  guaranteed_paise: number;
  one_time: { paise: number; names: string[] };
  grants: GrantVesting[];
}

/**
 * The table's span: four years, or the longest schedule typed where that reaches
 * further. Compared rather than maximised by a library, because the core has no
 * `Math` (ADR 0002).
 */
function yearsCoveredBy(grants: readonly ClassifiedComponent[]): number {
  let longest = MINIMUM_YEARS;
  for (const grant of grants) {
    const years = grant.equity?.vesting?.years.length ?? 0;
    if (years > longest) longest = years;
  }
  return longest;
}

/** The one-time components and their total, named because the average has to name them. */
function oneTimeIn(components: readonly ClassifiedComponent[]): {
  paise: number;
  names: string[];
} {
  const landing = components.filter((component) => landsWholeInYearOne(component.classification));
  return {
    paise: landing.reduce((running, one) => running + one.annual_paise, 0),
    names: landing.map((component) => component.name),
  };
}

/**
 * One grant's vests, year by year. A year the schedule does not reach gets a nil
 * share rather than being left out, so every grant's rows line up with the
 * table's and with each other.
 *
 * Each year's figure is that year's share of the whole grant, so the shares
 * truncate independently and their total can fall a few paise short of the grant
 * itself. That is the truncation `applyRate` makes everywhere else, and it is
 * why the table reports each year rather than inviting the reader to add the
 * years back up into a grant.
 */
function vestingOf(component: ClassifiedComponent, yearsCovered: number): GrantVesting {
  const equity = component.equity as EquityReading;
  const schedule = equity.vesting;
  const years: GrantVestYear[] = [];
  if (schedule !== undefined) {
    for (let year = 1; year <= yearsCovered; year += 1) {
      const basisPoints = schedule.years[year - 1]?.share.bp ?? 0;
      years.push({
        year,
        share: rate(basisPoints),
        as_valued: money(applyRate(equity.valued_paise, basisPoints)),
        as_claimed: money(applyRate(component.annual_paise, basisPoints)),
      });
    }
  }
  return {
    name: component.name,
    unvaluable: equity.unvaluable,
    ...(schedule?.cliff_months === undefined ? {} : { cliff_months: schedule.cliff_months }),
    years,
  };
}

/** The table on one basis: the shared columns, plus this basis's variable pay. */
function onBasis(basis: Basis, variablePaise: number, table: SharedTable): YearByYearOnBasis {
  function rowFor(year: number): YearRow {
    const vested = vestedIn(table.grants, year);
    // The one-time components land whole in the year they arrive, and the table
    // starts at the year the offer starts; nothing carries them into a later one.
    const oneTimePaise = year === FIRST_YEAR ? table.one_time.paise : 0;
    return {
      year,
      guaranteed_recurring_cash: money(table.guaranteed_paise),
      variable_pay_at_target: money(variablePaise),
      one_time: money(oneTimePaise),
      equity_as_valued: money(vested.valued),
      equity_as_claimed: money(vested.claimed),
      total: money(table.guaranteed_paise + variablePaise + oneTimePaise + vested.valued),
    };
  }

  // Year one is built first and kept, rather than read back out of the rows:
  // year one against the average is the comparison the whole table exists to
  // make, and it cannot be made down a column.
  const yearOne = rowFor(FIRST_YEAR);
  const years = [yearOne];
  for (let year = FIRST_YEAR + 1; year <= table.years_covered; year += 1) {
    years.push(rowFor(year));
  }

  const total = years.reduce((running, row) => running + row.total.paise, 0);
  return {
    basis,
    years,
    year_one: yearOne.total,
    average: {
      over_years: years.length,
      with_one_time: money(averageOver(total, years.length)),
      without_one_time: money(averageOver(total - table.one_time.paise, years.length)),
      one_time_components: table.one_time.names,
    },
  };
}

/** What vests in one year of the table, on both readings, summed over the grants. */
function vestedIn(
  grants: readonly GrantVesting[],
  year: number,
): { valued: number; claimed: number } {
  let valued = 0;
  let claimed = 0;
  for (const grant of grants) {
    const vest = grant.years[year - 1];
    if (vest === undefined) continue;
    valued += vest.as_valued.paise;
    claimed += vest.as_claimed.paise;
  }
  return { valued, claimed };
}

/**
 * The mean of the table's years, truncated towards zero like every other figure
 * the core divides for (ADR 0012). The discarded remainder is under a rupee
 * across the whole table, and it is why an average is reported rather than left
 * to be worked out from the rows.
 */
function averageOver(totalPaise: number, years: number): number {
  return divideWithRemainder(totalPaise, years).quotient;
}

function sum(
  components: readonly ClassifiedComponent[],
  counts: (classification: ClassifiedComponent["classification"]) => boolean,
): number {
  return components.reduce(
    (running, component) =>
      counts(component.classification) ? running + component.annual_paise : running,
    0,
  );
}
