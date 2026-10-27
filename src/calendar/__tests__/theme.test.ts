import { describe, expect, it } from '@jest/globals';

import { darkTheme, lightTheme, resolveTheme } from '../theme';

describe('resolveTheme', () => {
  it('returns the named themes regardless of the system scheme', () => {
    expect(resolveTheme('light', 'dark')).toBe(lightTheme);
    expect(resolveTheme('dark', 'light')).toBe(darkTheme);
  });

  it("follows the system scheme for 'auto'", () => {
    expect(resolveTheme('auto', 'dark')).toBe(darkTheme);
    expect(resolveTheme('auto', 'light')).toBe(lightTheme);
    expect(resolveTheme('auto', null)).toBe(lightTheme);
  });

  it("merges a partial theme over the 'auto' theme", () => {
    expect(resolveTheme({ primary: '#7C3AED' }, 'dark')).toEqual({
      ...darkTheme,
      primary: '#7C3AED',
    });
    expect(resolveTheme({ radius: 0 }, 'light')).toEqual({
      ...lightTheme,
      radius: 0,
    });
  });
});
