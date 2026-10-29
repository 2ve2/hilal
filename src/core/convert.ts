import {
  civilFromDays,
  epochDayOfLocalDate,
  localDateOfEpochDay,
} from './days';
import type { HijriDate } from './types';
import {
  UMALQURA_MAX_YEAR,
  UMALQURA_MIN_YEAR,
  UMALQURA_MONTH_LENGTH_MASKS,
  UMALQURA_START_EPOCH_DAY,
} from './umalqura-data';

/**
 * Epoch day of the first day of every month in the table, plus one extra
 * entry for the day after the last month. Index `(year - MIN) * 12 +
 * (month - 1)`.
 */
const MONTH_STARTS: readonly number[] = (() => {
  const starts = [UMALQURA_START_EPOCH_DAY];
  let epochDay = UMALQURA_START_EPOCH_DAY;
  for (const mask of UMALQURA_MONTH_LENGTH_MASKS) {
    for (let month = 0; month < 12; month++) {
      // eslint-disable-next-line no-bitwise -- the table is a bit mask
      epochDay += (mask >> month) & 1 ? 30 : 29;
      starts.push(epochDay);
    }
  }
  return starts;
})();

/**
 * First and last epoch day of the Umm al-Qura table (both inclusive). With
 * a Hijri adjustment of `n` days, the supported Gregorian days move by
 * `-n`: see `supportedEpochDays`.
 */
export const FIRST_DAY = MONTH_STARTS[0]!;
export const LAST_DAY = MONTH_STARTS[MONTH_STARTS.length - 1]! - 1;

/** The largest Hijri adjustment accepted, in days, in either direction. */
export const MAX_HIJRI_ADJUSTMENT = 2;

export type HijriConversionOptions = {
  /**
   * Days to shift the Hijri calendar by, from -2 to 2. `1` makes every
   * Hijri date one day later than Umm al-Qura (Umm al-Qura's 29 Sha'ban
   * becomes 30 Sha'ban), for places where the month started a day
   * earlier. Default 0.
   */
  adjustment?: number;
};

/**
 * Checks a Hijri adjustment and returns it.
 *
 * @throws {RangeError} unless it is an integer from -2 to 2.
 */
export function checkAdjustment(adjustment: number, caller: string) {
  if (
    !Number.isInteger(adjustment) ||
    Math.abs(adjustment) > MAX_HIJRI_ADJUSTMENT
  ) {
    throw new RangeError(
      `${caller}: the Hijri adjustment must be an integer from ` +
        `-${MAX_HIJRI_ADJUSTMENT} to ${MAX_HIJRI_ADJUSTMENT}, got ${adjustment}`
    );
  }
  return adjustment;
}

/** First and last epoch day that have a Hijri date, for an adjustment. */
export function supportedEpochDays(adjustment = 0) {
  return { min: FIRST_DAY - adjustment, max: LAST_DAY - adjustment };
}

function monthIndex(year: number, month: number) {
  return (year - UMALQURA_MIN_YEAR) * 12 + (month - 1);
}

function formatIso({ year, month, day }: HijriDate) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

function supportedRangeText(adjustment: number) {
  const { min, max } = getSupportedRange();
  const days = supportedEpochDays(adjustment);
  return (
    `${formatIso(min)} to ${formatIso(max)} AH ` +
    `(${formatIso(civilFromDays(days.min))} to ` +
    `${formatIso(civilFromDays(days.max))})`
  );
}

/** First and last Hijri dates the table covers. */
export function getSupportedRange(): { min: HijriDate; max: HijriDate } {
  return {
    min: { year: UMALQURA_MIN_YEAR, month: 1, day: 1 },
    max: {
      year: UMALQURA_MAX_YEAR,
      month: 12,
      day: getHijriMonthLength(UMALQURA_MAX_YEAR, 12),
    },
  };
}

/**
 * Number of days in a Hijri month.
 *
 * @throws {RangeError} if the year is outside the supported range or the
 * month is not an integer from 1 to 12.
 */
export function getHijriMonthLength(year: number, month: number): 29 | 30 {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    year < UMALQURA_MIN_YEAR ||
    year > UMALQURA_MAX_YEAR ||
    month < 1 ||
    month > 12
  ) {
    throw new RangeError(
      `getHijriMonthLength: ${year}-${month} is not a month in the ` +
        `supported range (${UMALQURA_MIN_YEAR}-${UMALQURA_MAX_YEAR} AH)`
    );
  }
  const index = monthIndex(year, month);
  return MONTH_STARTS[index + 1]! - MONTH_STARTS[index]! === 30 ? 30 : 29;
}

/** Whether `hijri` is a real day within the supported range. */
export function isValidHijri(hijri: HijriDate): boolean {
  if (typeof hijri !== 'object' || hijri === null) {
    return false;
  }
  const { year, month, day } = hijri;
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < UMALQURA_MIN_YEAR ||
    year > UMALQURA_MAX_YEAR ||
    month < 1 ||
    month > 12 ||
    day < 1
  ) {
    return false;
  }
  return day <= getHijriMonthLength(year, month);
}

/**
 * Hijri date of an epoch day, shifted by `adjustment` days. Internal: the
 * public entry point is `toHijri`.
 *
 * @throws {RangeError} if the day is outside the supported range.
 */
export function hijriOfEpochDay(
  epochDay: number,
  caller = 'toHijri',
  adjustment = 0
): HijriDate {
  const tableDay = epochDay + adjustment;
  if (
    !Number.isInteger(epochDay) ||
    tableDay < FIRST_DAY ||
    tableDay > LAST_DAY
  ) {
    throw new RangeError(
      `${caller}: ${formatIso(civilFromDays(epochDay))} is outside the ` +
        `supported range ${supportedRangeText(adjustment)}`
    );
  }

  // Last month that starts on or before `epochDay`.
  let low = 0;
  let high = MONTH_STARTS.length - 2;
  while (low < high) {
    const mid = (low + high + 1) >> 1; // eslint-disable-line no-bitwise
    if (MONTH_STARTS[mid]! <= tableDay) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return {
    year: UMALQURA_MIN_YEAR + Math.floor(low / 12),
    month: (low % 12) + 1,
    day: tableDay - MONTH_STARTS[low]! + 1,
  };
}

/**
 * Epoch day of a Hijri date, shifted by `adjustment` days. Internal: the
 * public entry point is `toGregorian`.
 *
 * @throws {RangeError} if `hijri` is not a valid date in the supported
 * range.
 */
export function epochDayOfHijri(
  hijri: HijriDate,
  caller = 'toGregorian',
  adjustment = 0
) {
  if (!isValidHijri(hijri)) {
    const text =
      typeof hijri === 'object' && hijri !== null
        ? `${hijri.year}-${hijri.month}-${hijri.day}`
        : String(hijri);
    throw new RangeError(
      `${caller}: ${text} is not a valid Hijri date in the supported ` +
        `range ${supportedRangeText(adjustment)}`
    );
  }
  return (
    MONTH_STARTS[monthIndex(hijri.year, hijri.month)]! +
    hijri.day -
    1 -
    adjustment
  );
}

/**
 * Converts the local calendar day of `date` to a Hijri date. The time of
 * day and the time zone offset are ignored: 23:59 and 00:00 on the same
 * local day give the same result.
 *
 * @throws {RangeError} if `date` is invalid or outside the supported
 * range, or the adjustment is not an integer from -2 to 2.
 */
export function toHijri(
  date: Date,
  options: HijriConversionOptions = {}
): HijriDate {
  const adjustment = checkAdjustment(options.adjustment ?? 0, 'toHijri');
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new RangeError('toHijri: expected a valid Date');
  }
  return hijriOfEpochDay(epochDayOfLocalDate(date), 'toHijri', adjustment);
}

/**
 * Converts a Hijri date to a `Date` at local midnight of the matching
 * Gregorian day.
 *
 * @throws {RangeError} if `hijri` is not a valid date in the supported
 * range, or the adjustment is not an integer from -2 to 2.
 */
export function toGregorian(
  hijri: HijriDate,
  options: HijriConversionOptions = {}
): Date {
  const adjustment = checkAdjustment(options.adjustment ?? 0, 'toGregorian');
  return localDateOfEpochDay(epochDayOfHijri(hijri, 'toGregorian', adjustment));
}
