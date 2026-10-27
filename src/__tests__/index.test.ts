import { describe, expect, it } from '@jest/globals';

import * as hilal from '../index';

describe('package entry', () => {
  it('exports the core API and the calendar', () => {
    expect(Object.keys(hilal).sort()).toEqual([
      'HilalCalendar',
      'darkTheme',
      'formatHijri',
      'getHijriMonthLength',
      'getMonthNames',
      'getSupportedRange',
      'getWeekdayNames',
      'isValidHijri',
      'lightTheme',
      'toArabicDigits',
      'toGregorian',
      'toHijri',
    ]);
  });
});
