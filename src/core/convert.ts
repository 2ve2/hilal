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

const FIRST_DAY = MONTH_STARTS[0]!;
const END_DAY = MONTH_STARTS[MONTH_STARTS.length - 1]!; // exclusive

function monthIndex(year: number, month: number) {
  return (year - UMALQURA_MIN_YEAR) * 12 + (month - 1);
}

function formatIso({ year, month, day }: HijriDate) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

function supportedRangeText() {
  const { min, max } = getSupportedRange();
  return (
    `${formatIso(min)} to ${formatIso(max)} AH ` +
    `(${formatIso(civilFromDays(FIRST_DAY))} to ` +
    `${formatIso(civilFromDays(END_DAY - 1))})`
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
 * Converts the local calendar day of `date` to a Hijri date. The time of
 * day and the time zone offset are ignored: 23:59 and 00:00 on the same
 * local day give the same result.
 *
 * @throws {RangeError} if `date` is invalid or outside the supported range.
 */
export function toHijri(date: Date): HijriDate {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new RangeError('toHijri: expected a valid Date');
  }
  const epochDay = epochDayOfLocalDate(date);
  if (epochDay < FIRST_DAY || epochDay >= END_DAY) {
    throw new RangeError(
      `toHijri: ${formatIso(civilFromDays(epochDay))} is outside the ` +
        `supported range ${supportedRangeText()}`
    );
  }

  // Last month that starts on or before `epochDay`.
  let low = 0;
  let high = MONTH_STARTS.length - 2;
  while (low < high) {
    const mid = (low + high + 1) >> 1; // eslint-disable-line no-bitwise
    if (MONTH_STARTS[mid]! <= epochDay) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return {
    year: UMALQURA_MIN_YEAR + Math.floor(low / 12),
    month: (low % 12) + 1,
    day: epochDay - MONTH_STARTS[low]! + 1,
  };
}

/**
 * Converts a Hijri date to a `Date` at local midnight of the matching
 * Gregorian day.
 *
 * @throws {RangeError} if `hijri` is not a valid date in the supported
 * range.
 */
export function toGregorian(hijri: HijriDate): Date {
  if (!isValidHijri(hijri)) {
    const text =
      typeof hijri === 'object' && hijri !== null
        ? `${hijri.year}-${hijri.month}-${hijri.day}`
        : String(hijri);
    throw new RangeError(
      `toGregorian: ${text} is not a valid Hijri date in the supported ` +
        `range ${supportedRangeText()}`
    );
  }
  const epochDay =
    MONTH_STARTS[monthIndex(hijri.year, hijri.month)]! + hijri.day - 1;
  return localDateOfEpochDay(epochDay);
}
