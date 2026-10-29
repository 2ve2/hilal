import { StyleSheet } from 'react-native';

import type { HilalTheme } from './theme';

/** Fills the parent; left/right are both 0, so RTL mirroring can't move it. */
const fill = {
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
} as const;

export type CalendarStyles = ReturnType<typeof createStyles>;

export function createStyles(theme: HilalTheme) {
  return StyleSheet.create({
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
    // name wraps on a narrow phone, so the ▾ stays next to it.
    titleInButton: {
      flexShrink: 1,
      textAlign: 'center',
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
    caret: {
      color: theme.primary,
      fontSize: 13,
      // Both sides: the title row may be reversed for right-to-left.
      marginHorizontal: 4,
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
  });
}
