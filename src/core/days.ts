/**
 * Calendar-day arithmetic on plain year/month/day numbers.
 *
 * Days are counted from 1970-01-01 in the proleptic Gregorian calendar
 * ("epoch days"). The algorithms are Howard Hinnant's `days_from_civil`
 * and `civil_from_days`, which use integer math only and never touch a
 * time zone.
 */

export type CivilDate = { year: number; month: number; day: number };

/** Epoch day of a Gregorian year/month/day (month is 1-12). */
export function daysFromCivil(year: number, month: number, day: number) {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yearOfEra = y - era * 400;
  const shiftedMonth = (month + 9) % 12; // March = 0
  const dayOfYear = Math.floor((153 * shiftedMonth + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 +
    Math.floor(yearOfEra / 4) -
    Math.floor(yearOfEra / 100) +
    dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

/** Gregorian year/month/day (month is 1-12) of an epoch day. */
export function civilFromDays(epochDay: number): CivilDate {
  const z = epochDay + 719468;
  const era = Math.floor(z / 146097);
  const dayOfEra = z - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) /
      365
  );
  const dayOfYear =
    dayOfEra -
    (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const shiftedMonth = Math.floor((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.floor((153 * shiftedMonth + 2) / 5) + 1;
  const month = shiftedMonth < 10 ? shiftedMonth + 3 : shiftedMonth - 9;
  const year = yearOfEra + era * 400 + (month <= 2 ? 1 : 0);
  return { year, month, day };
}

/** Epoch day of the local calendar day `date` falls on. */
export function epochDayOfLocalDate(date: Date) {
  return daysFromCivil(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** A `Date` at local midnight (start of day) of an epoch day. */
export function localDateOfEpochDay(epochDay: number) {
  const { year, month, day } = civilFromDays(epochDay);
  return new Date(year, month - 1, day);
}
