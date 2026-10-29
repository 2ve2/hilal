/**
 * The calendar's model: which days a month shows, how they are laid out
 * in weeks, how the header reads, and how far navigation may go. Pure
 * functions on epoch days, no React.
 */
import {
  epochDayOfHijri,
  FIRST_DAY,
  getHijriMonthLength,
  hijriOfEpochDay,
  LAST_DAY,
  supportedEpochDays,
} from '../core/convert';
import { civilFromDays, daysFromCivil, weekdayOfEpochDay } from '../core/days';
import {
  formatNumber,
  getMonthNames,
  type CalendarType,
  type Digits,
  type Locale,
} from '../core/locale';

/** A month of either calendar. `month` is 1-12. */
export type CalendarMonth = {
  calendar: CalendarType;
  year: number;
  month: number;
};

export type DayCell = {
  epochDay: number;
  /** Day of the month in the primary calendar. */
  day: number;
  /**
   * Day of the month in the other calendar, or null when the day is
   * outside the supported Hijri range (possible in the first and last
   * Gregorian months).
   */
  secondaryDay: number | null;
};

/** A month as weeks of 7 slots; null slots pad the first and last week. */
export type MonthGrid = Array<Array<DayCell | null>>;

/** Inclusive range of epoch days. */
export type DayRange = { min: number; max: number };

/** The days the calendar can ever show: the supported Hijri range. */
export const SUPPORTED_DAYS: DayRange = { min: FIRST_DAY, max: LAST_DAY };

/*
 * `adjustment` below is the Hijri adjustment in days (see
 * HijriConversionOptions). It moves which Gregorian days carry which
 * Hijri date, and so the supported days; Gregorian dates never change.
 */

export function otherCalendar(calendar: CalendarType): CalendarType {
  return calendar === 'hijri' ? 'gregorian' : 'hijri';
}

/** Epoch day of the first day of a month. */
export function monthStart(
  { calendar, year, month }: CalendarMonth,
  adjustment = 0
) {
  return calendar === 'hijri'
    ? epochDayOfHijri({ year, month, day: 1 }, 'monthStart', adjustment)
    : daysFromCivil(year, month, 1);
}

/** Number of days in a month. */
export function monthLength(m: CalendarMonth) {
  if (m.calendar === 'hijri') {
    return getHijriMonthLength(m.year, m.month);
  }
  const next = addMonths(m, 1);
  return daysFromCivil(next.year, next.month, 1) - monthStart(m);
}

/** Year, month and day of an epoch day in either calendar. */
export function dateInCalendar(
  epochDay: number,
  calendar: CalendarType,
  adjustment = 0
) {
  return calendar === 'hijri'
    ? hijriOfEpochDay(epochDay, 'dateInCalendar', adjustment)
    : civilFromDays(epochDay);
}

/**
 * The month of `calendar` that contains `epochDay`. Days outside the
 * supported range are clamped to it first.
 */
export function monthContaining(
  epochDay: number,
  calendar: CalendarType,
  adjustment = 0
): CalendarMonth {
  const { year, month } = dateInCalendar(
    clampDay(epochDay, supportedEpochDays(adjustment)),
    calendar,
    adjustment
  );
  return { calendar, year, month };
}

export function addMonths(m: CalendarMonth, delta: number): CalendarMonth {
  const index = m.year * 12 + (m.month - 1) + delta;
  return {
    calendar: m.calendar,
    year: Math.floor(index / 12),
    month: (index % 12) + 1,
  };
}

export function clampDay(epochDay: number, range: DayRange) {
  return Math.min(Math.max(epochDay, range.min), range.max);
}

/**
 * The days that may be selected: `minDay`/`maxDay` (when given)
 * intersected with the supported range.
 */
export function selectableRange(
  minDay: number | undefined,
  maxDay: number | undefined,
  adjustment = 0
): DayRange {
  const supported = supportedEpochDays(adjustment);
  return {
    min: Math.max(minDay ?? supported.min, supported.min),
    max: Math.min(maxDay ?? supported.max, supported.max),
  };
}

/** Whether any day of month `m` falls inside `range`. */
export function monthOverlaps(
  m: CalendarMonth,
  range: DayRange,
  adjustment = 0
) {
  if (m.calendar === 'hijri') {
    // Hijri months outside the table have no start day at all.
    const { min, max } = monthRangeOfSupportedHijri();
    const index = m.year * 12 + m.month;
    if (index < min || index > max) {
      return false;
    }
  }
  const start = monthStart(m, adjustment);
  const end = start + monthLength(m) - 1;
  return start <= range.max && end >= range.min;
}

function monthRangeOfSupportedHijri() {
  const first = hijriOfEpochDay(FIRST_DAY);
  const last = hijriOfEpochDay(LAST_DAY);
  return {
    min: first.year * 12 + first.month,
    max: last.year * 12 + last.month,
  };
}

/**
 * Lays out month `m` in weeks starting on `firstDayOfWeek` (0 = Sunday,
 * 1 = Monday, 6 = Saturday).
 */
export function buildMonthGrid(
  m: CalendarMonth,
  firstDayOfWeek: number,
  adjustment = 0
): MonthGrid {
  const start = monthStart(m, adjustment);
  const supported = supportedEpochDays(adjustment);
  const length = monthLength(m);
  const secondary = otherCalendar(m.calendar);
  const leading = (weekdayOfEpochDay(start) - firstDayOfWeek + 7) % 7;

  const slots: Array<DayCell | null> = Array(leading).fill(null);
  for (let day = 1; day <= length; day++) {
    const epochDay = start + day - 1;
    const inRange = epochDay >= supported.min && epochDay <= supported.max;
    slots.push({
      epochDay,
      day,
      secondaryDay: inRange
        ? dateInCalendar(epochDay, secondary, adjustment).day
        : null,
    });
  }
  while (slots.length % 7 !== 0) {
    slots.push(null);
  }

  const weeks: MonthGrid = [];
  for (let i = 0; i < slots.length; i += 7) {
    weeks.push(slots.slice(i, i + 7));
  }
  return weeks;
}

/** "رمضان ١٤٤٦" / "Ramadan 1446" / "March 2025". */
export function monthTitle(m: CalendarMonth, locale: Locale, digits: Digits) {
  const name = getMonthNames(m.calendar, locale)[m.month - 1];
  return `${name} ${formatNumber(m.year, digits)}`;
}

/**
 * The months of the other calendar that month `m` overlaps, for example
 * "مارس – أبريل ٢٠٢٤" for Ramadan 1445, "ديسمبر ٢٠٢٤ – يناير ٢٠٢٥" across
 * a year boundary, or a single month. Only days in the supported range
 * count.
 */
export function secondaryTitle(
  m: CalendarMonth,
  locale: Locale,
  digits: Digits,
  adjustment = 0
) {
  const start = monthStart(m, adjustment);
  const supported = supportedEpochDays(adjustment);
  const first = clampDay(start, supported);
  const last = clampDay(start + monthLength(m) - 1, supported);
  const calendar = otherCalendar(m.calendar);
  const from = dateInCalendar(first, calendar, adjustment);
  const to = dateInCalendar(last, calendar, adjustment);
  const names = getMonthNames(calendar, locale);
  const fromName = names[from.month - 1];
  const toName = names[to.month - 1];
  const year = (y: number) => formatNumber(y, digits);

  if (from.year === to.year && from.month === to.month) {
    return `${fromName} ${year(from.year)}`;
  }
  if (from.year === to.year) {
    return `${fromName} – ${toName} ${year(to.year)}`;
  }
  return `${fromName} ${year(from.year)} – ${toName} ${year(to.year)}`;
}

/*
 * Month and year picker. Opened from the header: a grid of the 12 months
 * of a year, and a grid of years, YEARS_PER_PAGE at a time.
 */

/** Years shown on one page of the year picker. */
export const YEARS_PER_PAGE = 12;

/** A month (1-12) or a year in the picker, and whether it can be picked. */
export type PickerItem = { value: number; disabled: boolean };

/**
 * First and last epoch day of years `fromYear` to `toYear` of a calendar,
 * limited to the supported range, or null when none of it is supported.
 */
function yearsSpan(
  calendar: CalendarType,
  fromYear: number,
  toYear: number,
  adjustment: number
): DayRange | null {
  const supported = supportedEpochDays(adjustment);
  let start: number;
  let end: number;
  if (calendar === 'hijri') {
    const first = Math.max(fromYear, hijriOfEpochDay(FIRST_DAY).year);
    const last = Math.min(toYear, hijriOfEpochDay(LAST_DAY).year);
    if (first > last) {
      return null;
    }
    const lastMonth: CalendarMonth = { calendar, year: last, month: 12 };
    start = monthStart({ calendar, year: first, month: 1 }, adjustment);
    end = monthStart(lastMonth, adjustment) + monthLength(lastMonth) - 1;
  } else {
    start = daysFromCivil(fromYear, 1, 1);
    end = daysFromCivil(toYear + 1, 1, 1) - 1;
  }
  const min = Math.max(start, supported.min);
  const max = Math.min(end, supported.max);
  return min <= max ? { min, max } : null;
}

/** Whether any day of `year` falls inside `range`. */
export function yearOverlaps(
  calendar: CalendarType,
  year: number,
  range: DayRange,
  adjustment = 0
) {
  const span = yearsSpan(calendar, year, year, adjustment);
  return span !== null && span.min <= range.max && span.max >= range.min;
}

/** The 12 months of `year`, disabled when none of their days is in `range`. */
export function monthsOfYear(
  calendar: CalendarType,
  year: number,
  range: DayRange,
  adjustment = 0
): PickerItem[] {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    disabled: !monthOverlaps(
      { calendar, year, month: i + 1 },
      range,
      adjustment
    ),
  }));
}

/** First year of the year-picker page that contains `year`. */
export function yearPageStart(year: number) {
  return Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
}

/** The years of the page starting at `pageStart`. */
export function yearsOnPage(
  calendar: CalendarType,
  pageStart: number,
  range: DayRange,
  adjustment = 0
): PickerItem[] {
  return Array.from({ length: YEARS_PER_PAGE }, (_, i) => ({
    value: pageStart + i,
    disabled: !yearOverlaps(calendar, pageStart + i, range, adjustment),
  }));
}

/** Whether the page starting at `pageStart` has any year that can be picked. */
export function pageOverlaps(
  calendar: CalendarType,
  pageStart: number,
  range: DayRange,
  adjustment = 0
) {
  return yearsOnPage(calendar, pageStart, range, adjustment).some(
    (year) => !year.disabled
  );
}

/**
 * The years of the other calendar that years `fromYear` to `toYear`
 * overlap, for example "٢٠٢٣ – ٢٠٢٤" for 1445 AH, or a single year. Only
 * days in the supported range count.
 */
export function yearsSecondaryTitle(
  calendar: CalendarType,
  fromYear: number,
  toYear: number,
  digits: Digits,
  adjustment = 0
) {
  const span = yearsSpan(calendar, fromYear, toYear, adjustment);
  if (span === null) {
    return '';
  }
  const other = otherCalendar(calendar);
  const from = dateInCalendar(span.min, other, adjustment).year;
  const to = dateInCalendar(span.max, other, adjustment).year;
  return from === to
    ? formatNumber(from, digits)
    : `${formatNumber(from, digits)} – ${formatNumber(to, digits)}`;
}
