/** Colors and shape of the calendar. */
export type HilalTheme = {
  /** Calendar background. */
  background: string;
  /** Day numbers, month title, arrows. */
  text: string;
  /** Secondary-calendar dates and weekday names. */
  textSecondary: string;
  /** Selected day and active calendar toggle. */
  primary: string;
  /** Text on `primary`. */
  onPrimary: string;
  /** Ring around today's date. */
  today: string;
  /** Days that can't be selected, and disabled arrows. */
  disabled: string;
  /** Toggle outline. */
  border: string;
  /** Corner radius of a day cell. */
  radius: number;
};

export type ThemeProp = 'light' | 'dark' | 'auto' | Partial<HilalTheme>;

export const lightTheme: HilalTheme = {
  background: '#FFFFFF',
  text: '#1B1F24',
  textSecondary: '#6B7280',
  primary: '#0F766E',
  onPrimary: '#FFFFFF',
  today: '#0F766E',
  disabled: '#C5CAD1',
  border: '#E3E6EA',
  radius: 12,
};

export const darkTheme: HilalTheme = {
  background: '#14171B',
  text: '#F2F4F7',
  textSecondary: '#9AA3AF',
  primary: '#2DD4BF',
  onPrimary: '#042F2C',
  today: '#2DD4BF',
  disabled: '#4A525C',
  border: '#2A3038',
  radius: 12,
};

/**
 * The theme to render with. 'auto' follows the system color scheme. A
 * partial theme is merged over the 'auto' theme, so a custom `primary`
 * color works in both light and dark mode.
 */
export function resolveTheme(
  theme: ThemeProp,
  colorScheme: string | null | undefined
): HilalTheme {
  const system = colorScheme === 'dark' ? darkTheme : lightTheme;
  if (theme === 'light') {
    return lightTheme;
  }
  if (theme === 'dark') {
    return darkTheme;
  }
  if (theme === 'auto') {
    return system;
  }
  return { ...system, ...theme };
}
