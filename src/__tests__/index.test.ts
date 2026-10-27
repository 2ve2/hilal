import { describe, expect, it } from '@jest/globals';

import * as hilal from '../index';

describe('package entry', () => {
  it('exports the core API', () => {
    expect(Object.keys(hilal).sort()).toEqual([
      'formatHijri',
      'getHijriMonthLength',
      'getMonthNames',
      'getSupportedRange',
      'getWeekdayNames',
      'isValidHijri',
      'toArabicDigits',
      'toGregorian',
      'toHijri',
    ]);
  });
});
