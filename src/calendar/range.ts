/**
 * Range selection: which days a range covers and how pressing a day
 * changes it. Pure functions on epoch days, no React.
 */

/** A picked range of days. `end` is undefined while only the start is picked. */
export type DayRangeSelection = { start: number; end?: number };

/**
 * The range after pressing `day`. The first press picks the start, the
 * second the end. A press before the start, a press after a complete
 * range, or a press across a blocked day starts a new range instead.
 */
export function nextRange(
  current: DayRangeSelection | undefined,
  day: number,
  isBlocked?: (day: number) => boolean
): DayRangeSelection {
  if (
    current === undefined ||
    current.end !== undefined ||
    day < current.start
  ) {
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
