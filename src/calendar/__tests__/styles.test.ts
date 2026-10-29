import { describe, expect, it } from '@jest/globals';

import { createStyles, withSlots } from '../styles';
import { lightTheme } from '../theme';

const base = createStyles(lightTheme);

describe('createStyles fonts', () => {
  it('leaves the styles unchanged without fonts or a font scale', () => {
    expect(createStyles({ ...lightTheme, fontScale: 1 })).toEqual(base);
    expect(base.title).not.toHaveProperty('fontFamily');
  });

  it('uses fontFamily for all text, keeping the bold weights', () => {
    const styles = createStyles({ ...lightTheme, fontFamily: 'Cairo' });
    for (const key of [
      'toggleText',
      'title',
      'subtitle',
      'weekday',
      'dayText',
      'secondaryText',
      'pickerText',
    ] as const) {
      expect(styles[key]).toEqual({ ...base[key], fontFamily: 'Cairo' });
    }
    expect(styles.day).toEqual(base.day);
  });

  it('uses fontFamilyBold for bold text without a bold weight', () => {
    const styles = createStyles({
      ...lightTheme,
      fontFamily: 'Cairo-Regular',
      fontFamilyBold: 'Cairo-Bold',
    });
    expect(styles.title).toMatchObject({
      fontFamily: 'Cairo-Bold',
      fontWeight: 'normal',
    });
    expect(styles.dayText).toMatchObject({
      fontFamily: 'Cairo-Bold',
      fontWeight: 'normal',
    });
    expect(styles.subtitle).toEqual({
      ...base.subtitle,
      fontFamily: 'Cairo-Regular',
    });
  });

  it('scales font sizes and line heights, and grows the day cells', () => {
    const styles = createStyles({ ...lightTheme, fontScale: 1.25 });
    expect(styles.title.fontSize).toBe(22.5);
    expect(styles.dayText.fontSize).toBe(20);
    expect(styles.secondaryText.fontSize).toBe(12.5);
    expect(styles.day).toMatchObject({ height: 60, maxWidth: 60 });
    // Weekday and picker names keep their size, so they fit their columns.
    expect(styles.weekday).toEqual(base.weekday);
    expect(styles.pickerText).toEqual(base.pickerText);
    expect(styles.pickerItem).toEqual(base.pickerItem);
    expect(styles.title).not.toHaveProperty('fontFamily');
  });

  it('shrinks text but never the cells', () => {
    const styles = createStyles({ ...lightTheme, fontScale: 0.8 });
    expect(styles.dayText.fontSize).toBe(12.8);
    expect(styles.weekday.fontSize).toBe(9.6);
    expect(styles.pickerText).toMatchObject({
      fontSize: 11.2,
      lineHeight: 14.4,
    });
    expect(styles.day).toEqual(base.day);
    expect(styles.pickerItem).toEqual(base.pickerItem);
  });

  it('rejects a font scale that is not a positive number', () => {
    for (const fontScale of [0, -1, NaN, Infinity]) {
      expect(() => createStyles({ ...lightTheme, fontScale })).toThrow(
        RangeError
      );
    }
  });
});

describe('withSlots', () => {
  it('returns the calendar styles themselves without slots', () => {
    expect(withSlots(base, undefined)).toEqual({
      styles: base,
      dayStyles: base,
    });
    expect(withSlots(base, undefined).styles).toBe(base);
  });

  it('merges day-state slots only into the day styles', () => {
    const { styles, dayStyles } = withSlots(base, {
      title: { color: 'red' },
      selectedDay: { borderRadius: 2 },
    });
    expect(styles.title).toEqual({ ...base.title, color: 'red' });
    expect(dayStyles.title).toEqual(styles.title);
    expect(styles.selected).toBe(base.selected);
    expect(dayStyles.selected).toEqual({ ...base.selected, borderRadius: 2 });
    expect(styles.day).toBe(base.day);
  });
});
