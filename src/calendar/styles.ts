import { StyleSheet } from 'react-native';

import type { HilalTheme } from './theme';
import type { HilalStyles } from './types';

/** Fills the parent; left/right are both 0, so RTL mirroring can't move it. */
const fill = {
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
} as const;

export type CalendarStyles = ReturnType<typeof createStyles>;

/** The text styles, which take the theme's fonts and font scale. */
const TEXT_STYLES = [
  'toggleText',
  'title',
  'subtitle',
  'weekday',
  'dayText',
  'secondaryText',
  'pickerText',
] as const;

/** Text in columns of a fixed width: shrinks with the font scale only. */
const FIXED_WIDTH_TEXT = new Set<string>(['weekday', 'pickerText']);

type TextStyleObject = {
  fontSize?: number;
  lineHeight?: number;
  fontWeight?: string;
  fontFamily?: string;
};

export function createStyles(theme: HilalTheme) {
  return StyleSheet.create(applyFonts(baseStyles(theme), theme));
}

/**
 * Applies `fontFamily`, `fontFamilyBold` and `fontScale`. Only adds keys
 * when the theme sets them, so a theme without fonts gives exactly the
 * base styles.
 */
function applyFonts<T extends Record<string, object>>(
  styles: T,
  theme: HilalTheme
): T {
  const scale = theme.fontScale ?? 1;
  if (!(Number.isFinite(scale) && scale > 0)) {
    throw new RangeError(
      `HilalCalendar: theme.fontScale must be a positive number, got ${scale}`
    );
  }
  const { fontFamily, fontFamilyBold } = theme;
  if (scale === 1 && !fontFamily && !fontFamilyBold) {
    return styles;
  }
  const out: Record<string, object> = { ...styles };
  for (const key of TEXT_STYLES) {
    const style = { ...(styles[key] as TextStyleObject) };
    // Weekday names (أربعاء خميس) only just fit seven columns on small
    // phones, and long month names (Dhu al-Qi'dah) three, so these never
    // grow.
    const factor = FIXED_WIDTH_TEXT.has(key) ? Math.min(scale, 1) : scale;
    if (factor !== 1) {
      if (style.fontSize) style.fontSize = round(style.fontSize * factor);
      if (style.lineHeight) style.lineHeight = round(style.lineHeight * factor);
    }
    const bold = style.fontWeight === '600' || style.fontWeight === '700';
    if (bold && fontFamilyBold) {
      // A bold font file plus a bold weight would be bolded twice.
      style.fontFamily = fontFamilyBold;
      style.fontWeight = 'normal';
    } else if (fontFamily) {
      style.fontFamily = fontFamily;
    }
    out[key] = style;
  }
  if (scale > 1) {
    // Larger text needs larger day cells.
    const day = styles.day as { height: number; maxWidth: number };
    out.day = {
      ...day,
      height: round(day.height * scale),
      maxWidth: round(day.maxWidth * scale),
    };
  }
  return out as T;
}

const round = (n: number) => Math.round(n * 10) / 10;

/** The calendar style each `styles` slot is merged into. */
const SLOTS = {
  container: 'container',
  toggle: 'toggle',
  toggleOption: 'toggleOption',
  toggleText: 'toggleText',
  header: 'header',
  title: 'title',
  subtitle: 'subtitle',
  arrow: 'arrow',
  weekdayText: 'weekday',
  day: 'day',
  dayText: 'dayText',
  secondaryDayText: 'secondaryText',
  pickerItem: 'pickerItem',
  pickerText: 'pickerText',
} as const;

/**
 * The slots for day states. The picker shares these calendar styles, so
 * they are merged into a copy used only by the day cells.
 */
const DAY_SLOTS = {
  selectedDay: 'selected',
  selectedDayText: 'selectedText',
  today: 'today',
  disabledDayText: 'disabledText',
} as const;

/**
 * Merges the `styles` prop over the calendar styles: `styles` for the
 * calendar and the picker, `dayStyles` for the day cells. Slots that are
 * not set leave the calendar styles as they are.
 */
export function withSlots(
  styles: CalendarStyles,
  slots: HilalStyles | undefined
): { styles: CalendarStyles; dayStyles: CalendarStyles } {
  if (!slots) {
    return { styles, dayStyles: styles };
  }
  const merge = (
    target: CalendarStyles,
    map: Record<string, keyof CalendarStyles>
  ) => {
    const out: Record<string, unknown> = { ...target };
    for (const [slot, key] of Object.entries(map)) {
      const style = slots[slot as keyof HilalStyles];
      if (style) {
        out[key] = StyleSheet.flatten([target[key], style]);
      }
    }
    return out as CalendarStyles;
  };
  const merged = merge(styles, SLOTS);
  return { styles: merged, dayStyles: merge(merged, DAY_SLOTS) };
}

function baseStyles(theme: HilalTheme) {
  return {
    container: {
      backgroundColor: theme.background,
      borderRadius: 20,
      padding: 12,
    },
    toggle: {
      alignSelf: 'center',
      borderColor: theme.border,
      borderRadius: 999,
      borderWidth: 1,
      marginBottom: 12,
      padding: 3,
    },
    toggleOption: {
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    toggleOptionActive: {
      backgroundColor: theme.primary,
    },
    toggleText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    toggleTextActive: {
      color: theme.onPrimary,
    },
    header: {
      alignItems: 'center',
      marginBottom: 8,
    },
    titles: {
      alignItems: 'center',
      flex: 1,
    },
    title: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '700',
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    arrow: {
      alignItems: 'center',
      borderRadius: 999,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    arrowPressed: {
      backgroundColor: theme.border,
    },
    weekdays: {
      marginBottom: 4,
    },
    weekday: {
      color: theme.textSecondary,
      flex: 1,
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },
    week: {},
    slot: {
      alignItems: 'center',
      flex: 1,
      // Keeps a gap between neighbouring days when the grid is narrower
      // than 7 full-size cells, so today's ring never touches the
      // selected day.
      paddingHorizontal: 3,
      paddingVertical: 2,
    },
    day: {
      alignItems: 'center',
      borderColor: 'transparent',
      borderRadius: theme.radius,
      borderWidth: 1.5,
      height: 48,
      justifyContent: 'center',
      maxWidth: 48,
      width: '100%',
    },
    today: {
      borderColor: theme.today,
    },
    selected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    pressed: {
      backgroundColor: theme.border,
    },
    dayText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryText: {
      color: theme.textSecondary,
      fontSize: 10,
      marginTop: 1,
    },
    selectedText: {
      color: theme.onPrimary,
    },
    selectedSecondaryText: {
      color: theme.onPrimary,
      opacity: 0.8,
    },
    disabledText: {
      color: theme.disabled,
    },
    // Month and year picker.
    titleButton: {
      alignItems: 'center',
      borderRadius: 10,
      overflow: 'hidden',
      paddingHorizontal: 10,
      paddingVertical: 2,
    },
    // The title inside the button: centered and shrinkable when a long
    // name wraps on a narrow phone.
    titleInButton: {
      flexShrink: 1,
      textAlign: 'center',
    },
    // The title of the year picker, which is not a button.
    titleStatic: {
      paddingVertical: 2,
    },
    titleButtonPressed: {
      backgroundColor: theme.border,
    },
    // Tints are layers with opacity, so any theme color format works.
    titleTint: {
      ...fill,
      backgroundColor: theme.primary,
      opacity: 0.1,
    },
    picker: {
      marginTop: 4,
    },
    pickerSlot: {
      flex: 1,
      padding: 3,
    },
    pickerItem: {
      alignItems: 'center',
      borderColor: 'transparent',
      borderRadius: theme.radius,
      borderWidth: 1.5,
      justifyContent: 'center',
      minHeight: 52,
      overflow: 'hidden',
      paddingHorizontal: 4,
      paddingVertical: 6,
    },
    // Grows into the free height of its parent.
    grow: {
      flexGrow: 1,
    },
    pickerItemTint: {
      ...fill,
      backgroundColor: theme.text,
      opacity: 0.05,
    },
    pickerText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 18,
      textAlign: 'center',
    },
  } as const;
}
