import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  I18nManager,
  Pressable,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { hijriOfEpochDay } from '../core/convert';
import {
  civilFromDays,
  epochDayOfLocalDate,
  localDateOfEpochDay,
  weekdayOfEpochDay,
} from '../core/days';
import { formatGregorian, formatHijri } from '../core/format';
import {
  defaultDigits,
  formatNumber,
  getWeekdayNames,
  type CalendarType,
  type Digits,
  type Locale,
} from '../core/locale';
import { Chevron } from './Chevron';
import { DayCell } from './DayCell';
import {
  addMonths,
  buildMonthGrid,
  clampDay,
  monthContaining,
  monthOverlaps,
  monthStart,
  monthTitle,
  secondaryTitle,
  selectableRange,
  type CalendarMonth,
  type DayRange,
} from './month';
import { createStyles } from './styles';
import { resolveTheme } from './theme';
import type { HilalCalendarProps, SelectedDate } from './types';

const LABELS: Record<
  Locale,
  {
    hijri: string;
    gregorian: string;
    previous: string;
    next: string;
    separator: string;
  }
> = {
  ar: {
    hijri: 'هجري',
    gregorian: 'ميلادي',
    previous: 'الشهر السابق',
    next: 'الشهر التالي',
    separator: '، ',
  },
  en: {
    hijri: 'Hijri',
    gregorian: 'Gregorian',
    previous: 'Previous month',
    next: 'Next month',
    separator: ', ',
  },
};

function epochDayOf(date: Date | undefined) {
  return date instanceof Date && !Number.isNaN(date.getTime())
    ? epochDayOfLocalDate(date)
    : undefined;
}

function selectedDateOf(
  epochDay: number,
  locale: Locale,
  digits: Digits
): SelectedDate {
  const hijri = hijriOfEpochDay(epochDay);
  return {
    gregorian: localDateOfEpochDay(epochDay),
    hijri,
    formatted: {
      gregorian: formatGregorian(civilFromDays(epochDay), { locale, digits }),
      hijri: formatHijri(hijri, { locale, digits }),
    },
  };
}

/** A function with a stable identity that always calls the latest `fn`. */
function useStableCallback<Args extends unknown[]>(
  fn: (...args: Args) => void
) {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: Args) => ref.current(...args), []);
}

/** The month to show: `preferred` if it can be shown, else a sensible one. */
function visibleMonth(
  preferred: CalendarMonth,
  calendar: CalendarType,
  range: DayRange,
  fallbackDay: number
) {
  return preferred.calendar === calendar && monthOverlaps(preferred, range)
    ? preferred
    : monthContaining(clampDay(fallbackDay, range), calendar);
}

/**
 * A month-grid date picker for the Umm al-Qura Hijri and the Gregorian
 * calendar.
 */
export function HilalCalendar({
  value,
  defaultValue,
  onChange,
  calendar: calendarProp = 'hijri',
  onCalendarChange,
  showCalendarToggle = true,
  showSecondaryDate = true,
  locale = 'ar',
  digits: digitsProp,
  direction = 'auto',
  firstDayOfWeek = 0,
  minDate,
  maxDate,
  isDateDisabled,
  theme: themeProp = 'auto',
  style,
  dayStyle,
}: HilalCalendarProps) {
  const digits = digitsProp ?? defaultDigits(locale);
  const labels = LABELS[locale];
  // React Native Web leaves I18nManager.isRTL undefined, not false.
  const appRTL = I18nManager.isRTL === true;
  const rtl =
    direction === 'rtl' ||
    (direction === 'auto' && (appRTL || locale === 'ar'));
  // React Native already mirrors 'row' when the whole app is RTL.
  const row = rtl === appRTL ? 'row' : 'row-reverse';

  const colorScheme = useColorScheme();
  const themeKey =
    typeof themeProp === 'string' ? themeProp : JSON.stringify(themeProp);
  const theme = useMemo(
    () => resolveTheme(themeProp, colorScheme),
    // A partial theme is usually an inline object; compare it by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [themeKey, colorScheme]
  );
  const styles = useMemo(() => createStyles(theme), [theme]);
  // Same for an inline dayStyle: a new object every render would re-render
  // every day cell.
  const dayStyleKey = JSON.stringify(dayStyle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableDayStyle = useMemo(() => dayStyle, [dayStyleKey]);

  const minDay = epochDayOf(minDate);
  const maxDay = epochDayOf(maxDate);
  const range = useMemo(
    () => selectableRange(minDay, maxDay),
    [minDay, maxDay]
  );
  const today = epochDayOfLocalDate(new Date());

  // Selection: controlled through `value`, otherwise internal state.
  const [internalDay, setInternalDay] = useState(() =>
    epochDayOf(defaultValue)
  );
  const selectedDay = value !== undefined ? epochDayOf(value) : internalDay;

  // Calendar: internal state that follows the prop when the prop changes.
  const [calendar, setCalendar] = useState(calendarProp);
  const [lastCalendarProp, setLastCalendarProp] = useState(calendarProp);
  const [month, setMonth] = useState(() =>
    monthContaining(clampDay(selectedDay ?? today, range), calendarProp)
  );
  const [lastSelectedDay, setLastSelectedDay] = useState(selectedDay);

  const switchTo = (next: CalendarType, current: CalendarMonth) => {
    setCalendar(next);
    // Keep the selected day in view, or else the month being looked at.
    const anchor = selectedDay ?? clampDay(monthStart(current), range);
    setMonth(monthContaining(clampDay(anchor, range), next));
  };

  const shown = visibleMonth(month, calendar, range, selectedDay ?? today);

  // Adjust state while rendering when props change (React's recommended
  // alternative to effects for derived state).
  if (calendarProp !== lastCalendarProp) {
    setLastCalendarProp(calendarProp);
    switchTo(calendarProp, shown);
  }
  if (selectedDay !== lastSelectedDay) {
    setLastSelectedDay(selectedDay);
    if (
      selectedDay !== undefined &&
      selectedDay >= range.min &&
      selectedDay <= range.max
    ) {
      const containing = monthContaining(selectedDay, calendar);
      if (containing.year !== shown.year || containing.month !== shown.month) {
        setMonth(containing);
      }
    }
  }

  const grid = useMemo(
    () => buildMonthGrid(shown, firstDayOfWeek),
    // `shown` is a new object on every render; its fields identify it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shown.calendar, shown.year, shown.month, firstDayOfWeek]
  );

  // Everything about a day except `selected` and `today`, so that changing
  // the selection doesn't recompute labels or call isDateDisabled.
  const cells = useMemo(
    () =>
      grid.map((week) =>
        week.map((cell) => {
          if (cell === null) {
            return null;
          }
          const { epochDay, day, secondaryDay } = cell;
          const inSupportedRange = secondaryDay !== null;
          const disabled =
            !inSupportedRange ||
            epochDay < range.min ||
            epochDay > range.max ||
            (isDateDisabled?.(selectedDateOf(epochDay, locale, digits)) ??
              false);
          const weekday = getWeekdayNames(locale)[weekdayOfEpochDay(epochDay)];
          const gregorianText = formatGregorian(civilFromDays(epochDay), {
            locale,
            digits,
          });
          const spoken = inSupportedRange
            ? [
                formatHijri(hijriOfEpochDay(epochDay), { locale, digits }),
                gregorianText,
              ]
            : [gregorianText];
          if (shown.calendar === 'gregorian') {
            spoken.reverse();
          }
          return {
            epochDay,
            label: formatNumber(day, digits),
            secondaryLabel:
              showSecondaryDate && secondaryDay !== null
                ? formatNumber(secondaryDay, digits)
                : null,
            accessibilityLabel: [weekday, ...spoken].join(labels.separator),
            disabled,
          };
        })
      ),
    [
      grid,
      shown.calendar,
      range,
      isDateDisabled,
      locale,
      digits,
      showSecondaryDate,
      labels,
    ]
  );

  const onSelect = useStableCallback((epochDay: number) => {
    if (value === undefined) {
      setInternalDay(epochDay);
    }
    onChange?.(selectedDateOf(epochDay, locale, digits));
  });

  const toggleCalendar = (next: CalendarType) => {
    if (next === calendar) {
      return;
    }
    switchTo(next, shown);
    onCalendarChange?.(next);
  };

  const previous = addMonths(shown, -1);
  const next = addMonths(shown, 1);
  const canGoBack = monthOverlaps(previous, range);
  const canGoForward = monthOverlaps(next, range);

  const weekdayNames = getWeekdayNames(locale, 'short');
  const weekdays = Array.from(
    { length: 7 },
    (_, i) => weekdayNames[(firstDayOfWeek + i) % 7]!
  );

  const renderArrow = (kind: 'previous' | 'next') => {
    const enabled = kind === 'previous' ? canGoBack : canGoForward;
    // Arrows point the way the months move: outward in reading order.
    const pointsLeft = (kind === 'previous') !== rtl;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={labels[kind]}
        accessibilityState={{ disabled: !enabled }}
        disabled={!enabled}
        hitSlop={8}
        onPress={() => setMonth(kind === 'previous' ? previous : next)}
        style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed]}
      >
        <Chevron
          direction={pointsLeft ? 'left' : 'right'}
          color={enabled ? theme.text : theme.disabled}
        />
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {showCalendarToggle && (
        <View style={[styles.toggle, { flexDirection: row }]}>
          {(['hijri', 'gregorian'] as const).map((option) => {
            const active = option === calendar;
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => toggleCalendar(option)}
                style={[
                  styles.toggleOption,
                  active && styles.toggleOptionActive,
                ]}
              >
                <Text
                  style={[styles.toggleText, active && styles.toggleTextActive]}
                >
                  {labels[option]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View
        testID="hilal-header"
        style={[styles.header, { flexDirection: row }]}
      >
        {renderArrow('previous')}
        <View style={styles.titles}>
          <Text accessibilityRole="header" style={styles.title}>
            {monthTitle(shown, locale, digits)}
          </Text>
          <Text style={styles.subtitle}>
            {secondaryTitle(shown, locale, digits)}
          </Text>
        </View>
        {renderArrow('next')}
      </View>

      <View style={[styles.weekdays, { flexDirection: row }]}>
        {weekdays.map((name) => (
          <Text key={name} style={styles.weekday}>
            {name}
          </Text>
        ))}
      </View>

      {cells.map((week, w) => (
        <View key={w} style={[styles.week, { flexDirection: row }]}>
          {week.map((cell, d) =>
            cell === null ? (
              <View key={`empty-${d}`} style={styles.slot} />
            ) : (
              <DayCell
                key={cell.epochDay}
                {...cell}
                selected={cell.epochDay === selectedDay}
                today={cell.epochDay === today}
                styles={styles}
                dayStyle={stableDayStyle}
                onSelect={onSelect}
              />
            )
          )}
        </View>
      ))}
    </View>
  );
}
