import { describe, expect, it } from '@jest/globals';

import { toGregorian, toHijri } from '../convert';

describe('test time zone', () => {
  it('runs in UTC+14 (see jest.global-setup.js)', () => {
    expect(new Date(2024, 0, 1).getTimezoneOffset()).toBe(-14 * 60);
  });

  it('keeps the local day even though UTC is still on the previous one', () => {
    const date = new Date(2024, 6, 7); // 2024-07-06T10:00Z
    expect(date.getUTCDate()).toBe(6);
    expect(toHijri(date)).toEqual({ year: 1446, month: 1, day: 1 });
    expect(toGregorian({ year: 1446, month: 1, day: 1 }).getDate()).toBe(7);
  });
});
