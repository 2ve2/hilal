/**
 * Range selection: which days a range covers and how pressing a day
 * changes it. Pure functions on epoch days, no React.
 */

/** A picked range of days. `end` is undefined while only the start is picked. */
export type DayRangeSelection = { start: number; end?: number };

/** The fewest and most days a range may have, both ends included. */
export type RangeLimits = { min: number; max: number };

export const NO_RANGE_LIMITS: RangeLimits = { min: 1, max: Infinity };

/**
 * Checks minRangeDays and maxRangeDays: whole numbers of at least 1, the
 * minimum no larger than the maximum. Throws a RangeError otherwise.
 */
export function checkRangeLimits(
  min: number | undefined,
  max: number | undefined
): RangeLimits {
  const limits = { min: min ?? 1, max: max ?? Infinity };
  for (const [name, value] of [
    ['minRangeDays', limits.min],
    ['maxRangeDays', limits.max],
  ] as const) {
    if (!(value >= 1 && (Number.isInteger(value) || value === Infinity))) {
      throw new RangeError(
        `HilalCalendar: ${name} must be a whole number of at least 1, got ${value}`
      );
    }
  }
  if (limits.min > limits.max) {
    throw new RangeError(
      `HilalCalendar: minRangeDays (${limits.min}) is larger than maxRangeDays (${limits.max})`
    );
  }
  return limits;
}

/**
 * Whether `day` can't end the range started at `range.start` because the
 * range would be shorter or longer than `limits`. Only days after the
 * start of a range without an end; any other day can be pressed.
 */
export function outsideRangeLimits(
  range: DayRangeSelection | undefined,
  day: number,
  limits: RangeLimits
) {
  if (range === undefined || range.end !== undefined || day <= range.start) {
    return false;
  }
  const length = day - range.start + 1;
  return length < limits.min || length > limits.max;
}

/**
 * The range after pressing `day`. The first press picks the start, the
 * second the end. A press before the start, a press after a complete
 * range, a press across a blocked day, or a press that would make the
 * range shorter or longer than `limits` starts a new range instead.
 */
export function nextRange(
  current: DayRangeSelection | undefined,
  day: number,
  isBlocked?: (day: number) => boolean,
  limits: RangeLimits = NO_RANGE_LIMITS
): DayRangeSelection {
  if (
    current === undefined ||
    current.end !== undefined ||
    day < current.start
  ) {
    return { start: day };
  }
  const length = day - current.start + 1;
  if (length < limits.min || length > limits.max) {
    return { start: day };
  }
  if (isBlocked) {
    for (let between = current.start + 1; between < day; between++) {
      if (isBlocked(between)) {
        return { start: day };
      }
    }
  }
  return { start: current.start, end: day };
}

/** Where a day sits in a range: its ends, inside it, or alone in it. */
export type RangePosition = 'start' | 'middle' | 'end' | 'single';

export function rangePosition(
  range: DayRangeSelection | undefined,
  day: number
): RangePosition | null {
  if (range === undefined) {
    return null;
  }
  const end = range.end ?? range.start;
  if (day === range.start) {
    return end === range.start ? 'single' : 'start';
  }
  if (day === end) {
    return 'end';
  }
  return day > range.start && day < end ? 'middle' : null;
}

/** Days in a complete range, both ends included. */
export function rangeLength(range: DayRangeSelection) {
  return range.end === undefined ? null : range.end - range.start + 1;
}
