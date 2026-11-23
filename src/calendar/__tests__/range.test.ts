import { describe, expect, it } from '@jest/globals';

import {
  checkRangeLimits,
  nextRange,
  outsideRangeLimits,
  rangeLength,
  rangePosition,
} from '../range';

describe('nextRange', () => {
  it('picks the start, then the end', () => {
    const start = nextRange(undefined, 10);
    expect(start).toEqual({ start: 10 });
    expect(nextRange(start, 14)).toEqual({ start: 10, end: 14 });
  });

  it('makes a one-day range when the start is pressed again', () => {
    expect(nextRange({ start: 10 }, 10)).toEqual({ start: 10, end: 10 });
  });

  it('starts over before the start and after a complete range', () => {
    expect(nextRange({ start: 10 }, 7)).toEqual({ start: 7 });
    expect(nextRange({ start: 10, end: 14 }, 12)).toEqual({ start: 12 });
  });

  it('starts over instead of crossing a blocked day', () => {
    const blocked = (day: number) => day === 12;
    expect(nextRange({ start: 10 }, 14, blocked)).toEqual({ start: 14 });
    // The blocked day itself can't be an end; only the days between count.
    expect(nextRange({ start: 10 }, 11, blocked)).toEqual({
      start: 10,
      end: 11,
    });
  });
});

describe('rangePosition', () => {
  it('places days in a complete range', () => {
    const range = { start: 10, end: 13 };
    expect([9, 10, 11, 12, 13, 14].map((d) => rangePosition(range, d))).toEqual(
      [null, 'start', 'middle', 'middle', 'end', null]
    );
  });

  it('draws a lone start or a one-day range as a single day', () => {
    expect(rangePosition({ start: 10 }, 10)).toBe('single');
    expect(rangePosition({ start: 10 }, 11)).toBeNull();
    expect(rangePosition({ start: 10, end: 10 }, 10)).toBe('single');
    expect(rangePosition(undefined, 10)).toBeNull();
  });
});

describe('rangeLength', () => {
  it('counts both ends, or null without an end', () => {
    expect(rangeLength({ start: 10, end: 13 })).toBe(4);
    expect(rangeLength({ start: 10, end: 10 })).toBe(1);
    expect(rangeLength({ start: 10 })).toBeNull();
  });
});

describe('range limits', () => {
  const limits = { min: 3, max: 5 };

  it('ends a range only within the limits', () => {
    // 10 to 11 is 2 days, 10 to 12 is 3, 10 to 14 is 5, 10 to 15 is 6.
    expect(nextRange({ start: 10 }, 11, undefined, limits)).toEqual({
      start: 11,
    });
    expect(nextRange({ start: 10 }, 12, undefined, limits)).toEqual({
      start: 10,
      end: 12,
    });
    expect(nextRange({ start: 10 }, 14, undefined, limits)).toEqual({
      start: 10,
      end: 14,
    });
    expect(nextRange({ start: 10 }, 15, undefined, limits)).toEqual({
      start: 15,
    });
    // Pressing the start again can't make a one-day range under a minimum.
    expect(nextRange({ start: 10 }, 10, undefined, limits)).toEqual({
      start: 10,
    });
  });

  it('marks the days after the start that are too close or too far', () => {
    const outside = [9, 10, 11, 12, 13, 14, 15].filter((d) =>
      outsideRangeLimits({ start: 10 }, d, limits)
    );
    expect(outside).toEqual([11, 15]);
    // Without a start, or once the range is complete, every day can be
    // pressed.
    expect(outsideRangeLimits(undefined, 11, limits)).toBe(false);
    expect(outsideRangeLimits({ start: 10, end: 12 }, 20, limits)).toBe(false);
  });

  it('checks the limits', () => {
    expect(checkRangeLimits(undefined, undefined)).toEqual({
      min: 1,
      max: Infinity,
    });
    expect(checkRangeLimits(2, 14)).toEqual({ min: 2, max: 14 });
    expect(checkRangeLimits(3, 3)).toEqual({ min: 3, max: 3 });
    for (const [min, max] of [
      [0, 5],
      [2.5, 5],
      [Number.NaN, 5],
      [1, 0],
      [1, 4.5],
    ] as const) {
      expect(() => checkRangeLimits(min, max)).toThrow(
        /must be a whole number/
      );
    }
    expect(() => checkRangeLimits(5, 3)).toThrow(
      'minRangeDays (5) is larger than maxRangeDays (3)'
    );
  });
});
