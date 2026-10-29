import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { CalendarType, Digits, Locale } from '../core/locale';
import type { HijriDate } from '../core/types';
import type { ThemeProp } from './theme';

/** A day picked in the calendar, in both calendars. */
export type SelectedDate = {
  /** Local midnight of the day. */
  gregorian: Date;
  hijri: HijriDate;
  /** Both dates as text in the calendar's locale and digits. */
  formatted: { gregorian: string; hijri: string };
};

type ViewSlot = StyleProp<ViewStyle>;
type TextSlot = StyleProp<TextStyle>;

/**
 * Styles for parts of the calendar, merged over the theme's styles. Each
 * is optional.
 */
export type HilalStyles = {
  /** The outer container (the same as the `style` prop). */
  container?: ViewSlot;
  /** The Hijri / Gregorian toggle. */
  toggle?: ViewSlot;
  /** Each option of the toggle. */
  toggleOption?: ViewSlot;
  toggleText?: TextSlot;
  /** The row of arrows and titles. */
  header?: ViewSlot;
  /** The month title. */
  title?: TextSlot;
  /** The other calendar's months under the title. */
  subtitle?: TextSlot;
  /** Each arrow button. */
  arrow?: ViewSlot;
  /** Each weekday name. */
  weekdayText?: TextSlot;
  /** Each day cell (the pressable circle). */
  day?: ViewSlot;
  /** The day number. */
  dayText?: TextSlot;
  /** The other calendar's day under the day number. */
  secondaryDayText?: TextSlot;
  /** The selected day cell. */
  selectedDay?: ViewSlot;
  /** The selected day's number. */
  selectedDayText?: TextSlot;
  /** Today's day cell. */
  today?: ViewSlot;
  /** Both texts of a disabled day. */
  disabledDayText?: TextSlot;
  /** Each month or year in the month and year picker. */
  pickerItem?: ViewSlot;
  pickerText?: TextSlot;
};

export type HilalCalendarProps = {
  /** Selected day (controlled). Only the local calendar day is used. */
  value?: Date;
  /** Initially selected day (uncontrolled). */
  defaultValue?: Date;
  /** Called when the user picks a day. */
  onChange?: (date: SelectedDate) => void;

  /** Calendar of the month grid. Default 'hijri'. */
  calendar?: CalendarType;
  /** Called when the user switches calendars with the toggle. */
  onCalendarChange?: (calendar: CalendarType) => void;
  /** Show the Hijri / Gregorian toggle. Default true. */
  showCalendarToggle?: boolean;
  /** Show the other calendar's day under each day. Default true. */
  showSecondaryDate?: boolean;

  /** Language of names and labels. Default 'ar'. */
  locale?: Locale;
  /** Default 'arabic' when locale is 'ar', otherwise 'latin'. */
  digits?: Digits;
  /**
   * Layout direction. 'auto' (default) is right-to-left when the app runs
   * right-to-left (`I18nManager.isRTL`) or the locale is 'ar'.
   */
  direction?: 'rtl' | 'ltr' | 'auto';
  /** 0 = Sunday (default), 1 = Monday, 6 = Saturday. */
  firstDayOfWeek?: 0 | 1 | 6;
  /**
   * Weekday names above the days: 'short' (default, أحد / Sun) or
   * 'narrow' (ح / S). Full names don't fit seven columns on a phone.
   */
  weekdayFormat?: 'short' | 'narrow';

  /** Earliest selectable day. */
  minDate?: Date;
  /** Latest selectable day. */
  maxDate?: Date;
  /** Return true to disable a day. */
  isDateDisabled?: (date: SelectedDate) => boolean;

  /**
   * Shift the Hijri calendar by whole days, from -2 to 2, for places where
   * the month started before or after Umm al-Qura. `1` makes every Hijri
   * date one day later. Gregorian dates never change. Default 0.
   */
  hijriAdjustment?: number;
  /**
   * Pressing the month title opens a grid of months, and from there a
   * grid of years, to jump far without paging month by month. Default
   * true.
   */
  showMonthYearPicker?: boolean;

  /**
   * 'light', 'dark', 'auto' (default, follows the system color scheme),
   * or a partial theme merged over the 'auto' theme.
   */
  theme?: ThemeProp;
  /** Styles for parts of the calendar, see `HilalStyles`. */
  styles?: HilalStyles;
  /** Style of the outer container. */
  style?: StyleProp<ViewStyle>;
  /**
   * Style of every day cell (the pressable circle). Unlike `styles.day`,
   * it also wins over the selected and today styles.
   */
  dayStyle?: StyleProp<ViewStyle>;
};
