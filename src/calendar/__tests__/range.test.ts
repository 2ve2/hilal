import { describe, expect, it } from '@jest/globals';

import { nextRange, rangeLength, rangePosition } from '../range';

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
