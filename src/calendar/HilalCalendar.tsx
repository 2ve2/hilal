import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  I18nManager,
  Pressable,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { checkAdjustment, hijriOfEpochDay } from '../core/convert';
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
  getMonthNames,
  getWeekdayNames,
  type CalendarType,
  type Digits,
  type Locale,
} from '../core/locale';
import { Appear, useReduceMotion } from './Appear';
import { Chevron } from './Chevron';
import { DayCell } from './DayCell';
import {
  addMonths,
  buildMonthGrid,
  clampDay,
  dateInCalendar,
  monthContaining,
  monthOverlaps,
  monthsOfYear,
  monthStart,
  monthTitle,
  pageOverlaps,
  secondaryTitle,
  selectableRange,
  yearOverlaps,
  yearPageStart,
  yearsOnPage,
  YEARS_PER_PAGE,
  yearsSecondaryTitle,
  type CalendarMonth,
  type DayRange,
} from './month';
import { PickerGrid, type PickerGridItem } from './PickerGrid';
import { createStyles, withSlots } from './styles';
import { resolveTheme } from './theme';
import type { HilalCalendarProps, HilalLabels, SelectedDate } from './types';

const LABELS: Record<Locale, Required<HilalLabels> & { separator: string }> = {
  ar: {
    hijri: 'هجري',
    gregorian: 'ميلادي',
    previousMonth: 'الشهر السابق',
    nextMonth: 'الشهر التالي',
    previousYear: 'السنة السابقة',
    nextYear: 'السنة التالية',
    previousYears: 'السنوات السابقة',
    nextYears: 'السنوات التالية',
    chooseMonth: 'اختر الشهر والسنة',
    chooseYear: 'اختر السنة',
    separator: '، ',
  },
  en: {
    hijri: 'Hijri',
    gregorian: 'Gregorian',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    previousYear: 'Previous year',
    nextYear: 'Next year',
    previousYears: 'Previous years',
    nextYears: 'Next years',
    chooseMonth: 'Choose month and year',
    chooseYear: 'Choose year',
    separator: ', ',
  },
};

/** What the grid shows: the days of a month, or the month or year picker. */
type View_ = 'days' | 'months' | 'years';

function epochDayOf(date: Date | undefined) {
  return date instanceof Date && !Number.isNaN(date.getTime())
    ? epochDayOfLocalDate(date)
    : undefined;
}

function selectedDateOf(
  epochDay: number,
  locale: Locale,
  digits: Digits,
  adjustment: number
): SelectedDate {
  const hijri = hijriOfEpochDay(epochDay, 'HilalCalendar', adjustment);
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
  fallbackDay: number,
  adjustment: number
) {
  return preferred.calendar === calendar &&
    monthOverlaps(preferred, range, adjustment)
    ? preferred
    : monthContaining(clampDay(fallbackDay, range), calendar, adjustment);
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
  hijriAdjustment = 0,
  showMonthYearPicker = true,
  weekdayFormat = 'short',
  theme: themeProp = 'auto',
  styles: stylesProp,
  labels: labelsProp,
  style,
  dayStyle,
}: HilalCalendarProps) {
  const adjustment = checkAdjustment(hijriAdjustment, 'HilalCalendar');
  const digits = digitsProp ?? defaultDigits(locale);
  // Compared by value, so an inline object doesn't recompute every day.
  const labelsKey = JSON.stringify(labelsProp);
  const labels = useMemo(
    () => {
      const merged = { ...LABELS[locale] };
      for (const [key, text] of Object.entries(labelsProp ?? {})) {
        // A label left undefined keeps the default.
        if (text !== undefined) {
          merged[key as keyof HilalLabels] = text;
        }
      }
      return merged;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, labelsKey]
  );
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
  // An inline `styles` prop is compared by value too.
  const stylesKey = JSON.stringify(stylesProp);
  const { styles, dayStyles } = useMemo(
    () => withSlots(createStyles(theme), stylesProp),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, stylesKey]
  );
  // Same for an inline dayStyle: a new object every render would re-render
  // every day cell.
  const dayStyleKey = JSON.stringify(dayStyle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableDayStyle = useMemo(() => dayStyle, [dayStyleKey]);

  const minDay = epochDayOf(minDate);
  const maxDay = epochDayOf(maxDate);
  const range = useMemo(
    () => selectableRange(minDay, maxDay, adjustment),
    [minDay, maxDay, adjustment]
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
    monthContaining(
      clampDay(selectedDay ?? today, range),
      calendarProp,
      adjustment
    )
  );
  const [lastSelectedDay, setLastSelectedDay] = useState(selectedDay);

  // The month and year picker: which grid is shown, the year whose months
  // are listed, and the first year of the page of years.
  const [view, setView] = useState<View_>('days');
  const [pickerYear, setPickerYear] = useState(0);
  const [pageStart, setPageStart] = useState(0);
  const mode: View_ = showMonthYearPicker ? view : 'days';
  // The grids fade in when switching views, but not when the calendar
  // first appears: the days only animate once the picker has been open.
  const reduceMotion = useReduceMotion();
  const [pickerOpened, setPickerOpened] = useState(false);
  if (mode !== 'days' && !pickerOpened) {
    setPickerOpened(true);
  }
  // The height of the days, which the picker takes too so that the
  // calendar doesn't jump in size when switching.
  const [daysHeight, setDaysHeight] = useState<number>();

  const switchTo = (next: CalendarType, current: CalendarMonth) => {
    setCalendar(next);
    setView('days');
    // Keep the selected day in view, or else the month being looked at.
    const anchor =
      selectedDay ?? clampDay(monthStart(current, adjustment), range);
    setMonth(monthContaining(clampDay(anchor, range), next, adjustment));
  };

  const shown = visibleMonth(
    month,
    calendar,
    range,
    selectedDay ?? today,
    adjustment
  );

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
      const containing = monthContaining(selectedDay, calendar, adjustment);
      if (containing.year !== shown.year || containing.month !== shown.month) {
        setMonth(containing);
      }
    }
  }

  const grid = useMemo(
    () => buildMonthGrid(shown, firstDayOfWeek, adjustment),
    // `shown` is a new object on every render; its fields identify it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [shown.calendar, shown.year, shown.month, firstDayOfWeek, adjustment]
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
            (isDateDisabled?.(
              selectedDateOf(epochDay, locale, digits, adjustment)
            ) ??
              false);
          const weekday = getWeekdayNames(locale)[weekdayOfEpochDay(epochDay)];
          const gregorianText = formatGregorian(civilFromDays(epochDay), {
            locale,
            digits,
          });
          const spoken = inSupportedRange
            ? [
                formatHijri(
                  hijriOfEpochDay(epochDay, 'HilalCalendar', adjustment),
                  { locale, digits }
                ),
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
      adjustment,
    ]
  );

  const onSelect = useStableCallback((epochDay: number) => {
    if (value === undefined) {
      setInternalDay(epochDay);
    }
    onChange?.(selectedDateOf(epochDay, locale, digits, adjustment));
  });

  const toggleCalendar = (next: CalendarType) => {
    if (next === calendar) {
      return;
    }
    switchTo(next, shown);
    onCalendarChange?.(next);
  };

  // Today's month and year in the shown calendar, for the picker's ring.
  const todayInCalendar = safeDateInCalendar(today, calendar, adjustment);

  // What the arrows do depends on the grid: months, years, or pages.
  let arrows: Record<
    'previous' | 'next',
    { enabled: boolean; label: string; onPress: () => void }
  >;
  if (mode === 'months') {
    arrows = {
      previous: {
        enabled: yearOverlaps(calendar, pickerYear - 1, range, adjustment),
        label: labels.previousYear,
        onPress: () => setPickerYear(pickerYear - 1),
      },
      next: {
        enabled: yearOverlaps(calendar, pickerYear + 1, range, adjustment),
        label: labels.nextYear,
        onPress: () => setPickerYear(pickerYear + 1),
      },
    };
  } else if (mode === 'years') {
    const before = pageStart - YEARS_PER_PAGE;
    const after = pageStart + YEARS_PER_PAGE;
    arrows = {
      previous: {
        enabled: pageOverlaps(calendar, before, range, adjustment),
        label: labels.previousYears,
        onPress: () => setPageStart(before),
      },
      next: {
        enabled: pageOverlaps(calendar, after, range, adjustment),
        label: labels.nextYears,
        onPress: () => setPageStart(after),
      },
    };
  } else {
    const previous = addMonths(shown, -1);
    const next = addMonths(shown, 1);
    arrows = {
      previous: {
        enabled: monthOverlaps(previous, range, adjustment),
        label: labels.previousMonth,
        onPress: () => setMonth(previous),
      },
      next: {
        enabled: monthOverlaps(next, range, adjustment),
        label: labels.nextMonth,
        onPress: () => setMonth(next),
      },
    };
  }

  const weekdayNames = getWeekdayNames(locale, weekdayFormat);
  const weekdays = Array.from(
    { length: 7 },
    (_, i) => weekdayNames[(firstDayOfWeek + i) % 7]!
  );

  const renderArrow = (kind: 'previous' | 'next') => {
    const { enabled, label, onPress } = arrows[kind];
    // Arrows point the way the months move: outward in reading order.
    const pointsLeft = (kind === 'previous') !== rtl;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !enabled }}
        disabled={!enabled}
        hitSlop={8}
        onPress={onPress}
        style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed]}
      >
        <Chevron
          direction={pointsLeft ? 'left' : 'right'}
          color={enabled ? (theme.arrow ?? theme.text) : theme.disabled}
        />
      </Pressable>
    );
  };

  const year = (y: number) => formatNumber(y, digits);

  // The header title, and what pressing it opens.
  let title: string;
  let subtitle: string;
  let titleAction: { label: string; onPress: () => void } | undefined;
  if (mode === 'months') {
    title = year(pickerYear);
    subtitle = yearsSecondaryTitle(
      calendar,
      pickerYear,
      pickerYear,
      digits,
      adjustment
    );
    titleAction = {
      label: labels.chooseYear,
      onPress: () => {
        setPageStart(yearPageStart(pickerYear));
        setView('years');
      },
    };
  } else if (mode === 'years') {
    const last = pageStart + YEARS_PER_PAGE - 1;
    title = `${year(pageStart)} – ${year(last)}`;
    subtitle = yearsSecondaryTitle(
      calendar,
      pageStart,
      last,
      digits,
      adjustment
    );
  } else {
    title = monthTitle(shown, locale, digits);
    subtitle = secondaryTitle(shown, locale, digits, adjustment);
    if (showMonthYearPicker) {
      titleAction = {
        label: labels.chooseMonth,
        onPress: () => {
          setPickerYear(shown.year);
          setView('months');
        },
      };
    }
  }

  const titleText = (
    <Text
      accessibilityRole="header"
      style={titleAction ? [styles.title, styles.titleInButton] : styles.title}
    >
      {title}
    </Text>
  );

  let pickerItems: PickerGridItem[] | undefined;
  if (mode === 'months') {
    const names = getMonthNames(calendar, locale);
    pickerItems = monthsOfYear(calendar, pickerYear, range, adjustment).map(
      ({ value: m, disabled }) => ({
        key: m,
        label: names[m - 1]!,
        accessibilityLabel: `${names[m - 1]} ${year(pickerYear)}`,
        selected: pickerYear === shown.year && m === shown.month,
        current:
          todayInCalendar?.year === pickerYear && todayInCalendar.month === m,
        disabled,
      })
    );
  } else if (mode === 'years') {
    pickerItems = yearsOnPage(calendar, pageStart, range, adjustment).map(
      ({ value: y, disabled }) => ({
        key: y,
        label: year(y),
        accessibilityLabel: year(y),
        selected: y === pickerYear,
        current: todayInCalendar?.year === y,
        disabled,
      })
    );
  }

  const pick = (key: number) => {
    if (mode === 'months') {
      setMonth({ calendar, year: pickerYear, month: key });
      setView('days');
    } else {
      setPickerYear(key);
      setView('months');
    }
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
          {titleAction ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${titleAction.label}${labels.separator}${title}`}
              hitSlop={6}
              onPress={titleAction.onPress}
              style={({ pressed }) => [
                styles.titleButton,
                { flexDirection: row },
                pressed && styles.titleButtonPressed,
              ]}
            >
              <View style={styles.titleTint} />
              {titleText}
              {/* Decorative: the button's label already says what it does. */}
              <Text
                accessibilityElementsHidden
                importantForAccessibility="no"
                style={styles.caret}
              >
                ▾
              </Text>
            </Pressable>
          ) : mode === 'years' ? (
            // As tall as the title button of the other views, so the
            // header doesn't jump when the years open.
            <View style={styles.titleStatic}>{titleText}</View>
          ) : (
            titleText
          )}
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {renderArrow('next')}
      </View>

      {pickerItems ? (
        <Appear
          key={mode}
          animate={!reduceMotion}
          style={daysHeight !== undefined && { minHeight: daysHeight }}
        >
          <PickerGrid
            items={pickerItems}
            styles={styles}
            row={row}
            fill={daysHeight !== undefined}
            onSelect={pick}
          />
        </Appear>
      ) : (
        <Appear
          key="days"
          animate={pickerOpened && !reduceMotion}
          onLayout={(event) => setDaysHeight(event.nativeEvent.layout.height)}
        >
          <View style={[styles.weekdays, { flexDirection: row }]}>
            {/* Keyed by position: narrow names repeat (S, T). */}
            {weekdays.map((name, i) => (
              <Text key={i} style={styles.weekday}>
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
                    styles={dayStyles}
                    dayStyle={stableDayStyle}
                    onSelect={onSelect}
                  />
                )
              )}
            </View>
          ))}
        </Appear>
      )}
    </View>
  );
}

/** A day's date in a calendar, or undefined outside the supported range. */
function safeDateInCalendar(
  epochDay: number,
  calendar: CalendarType,
  adjustment: number
) {
  try {
    return dateInCalendar(epochDay, calendar, adjustment);
  } catch {
    return undefined;
  }
}
