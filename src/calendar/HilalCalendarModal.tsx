import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { checkAdjustment } from '../core/convert';
import { defaultDigits } from '../core/locale';
import { useReduceMotion } from './Appear';
import { readingDirection } from './direction';
import {
  epochDayOf,
  HilalCalendar,
  rangeOfDates,
  selectedDateOf,
} from './HilalCalendar';
import { useLabels } from './labels';
import { rangeLength } from './range';
import { resolveTheme } from './theme';
import type {
  HilalCalendarModalProps,
  SelectedDate,
  SelectedRange,
} from './types';

const DURATION = 240;
/** How far below its place the sheet starts when it opens. */
const SLIDE_FROM = 48;
/** Widest the sheet gets, on tablets and the web. */
const MAX_WIDTH = 520;

/**
 * The calendar in a sheet that slides up from the bottom of the screen,
 * with Cancel and Done buttons. The picked day (or range) is only
 * reported when Done is pressed; Cancel, the backdrop and Android's back
 * button close it without a change.
 */
export function HilalCalendarModal({
  visible,
  onClose,
  onConfirm,
  onConfirmRange,
  value,
  rangeValue,
  title,
  bottomInset = 0,
  sheetStyle,
  ...calendarProps
}: HilalCalendarModalProps) {
  const {
    locale = 'ar',
    digits: digitsProp,
    direction = 'auto',
    theme: themeProp = 'auto',
    labels: labelsProp,
    selectionMode = 'single',
    hijriAdjustment = 0,
    maxFontSizeMultiplier,
  } = calendarProps;
  const rangeMode = selectionMode === 'range';
  const digits = digitsProp ?? defaultDigits(locale);
  const adjustment = checkAdjustment(hijriAdjustment, 'HilalCalendarModal');
  const labels = useLabels(locale, labelsProp);
  const { row } = readingDirection(direction, locale);
  const colorScheme = useColorScheme();
  const themeKey =
    typeof themeProp === 'string' ? themeProp : JSON.stringify(themeProp);
  const theme = useMemo(
    () => resolveTheme(themeProp, colorScheme),
    // A partial theme is usually an inline object; compare it by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [themeKey, colorScheme]
  );
  const reduceMotion = useReduceMotion();

  // What the props say is picked, as the calendar reports it.
  const initialPick = (): SelectedDate | SelectedRange | undefined => {
    if (rangeMode) {
      const range = rangeOfDates(rangeValue ?? undefined);
      if (range === undefined) {
        return undefined;
      }
      const dateOf = (day: number) =>
        selectedDateOf(day, locale, digits, adjustment);
      return {
        start: dateOf(range.start),
        end: range.end === undefined ? null : dateOf(range.end),
        days: rangeLength(range),
      };
    }
    const day = epochDayOf(value);
    return day === undefined
      ? undefined
      : selectedDateOf(day, locale, digits, adjustment);
  };

  // The pick inside the sheet, reported only on Done. Each opening starts
  // from the props again, with a fresh calendar.
  const [pick, setPick] = useState(initialPick);
  const [opening, setOpening] = useState(0);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setOpening(opening + 1);
      setPick(initialPick());
    }
  }

  const ready = rangeMode
    ? pick !== undefined && (pick as SelectedRange).end !== null
    : pick !== undefined;

  const confirm = () => {
    if (!ready) {
      return;
    }
    if (rangeMode) {
      const range = pick as SelectedRange;
      onConfirmRange?.({
        start: range.start,
        end: range.end!,
        days: range.days!,
      });
    } else {
      onConfirm?.(pick as SelectedDate);
    }
    onClose();
  };

  // How far the phone's text size may grow the bar's texts.
  const maxTextScale = maxFontSizeMultiplier ?? 2;
  const buttonFont = {
    fontFamily: theme.fontFamilyBold ?? theme.fontFamily,
    fontSize: 16 * (theme.fontScale ?? 1),
    fontWeight: theme.fontFamilyBold ? ('normal' as const) : ('600' as const),
  };

  return (
    <Modal
      testID="hilal-modal"
      visible={visible}
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable
          testID="hilal-modal-backdrop"
          accessibilityRole="button"
          accessibilityLabel={labels.close}
          onPress={onClose}
          style={styles.backdrop}
        />
        <SlideUp key={opening} animate={!reduceMotion}>
          <View
            testID="hilal-modal-sheet"
            accessibilityViewIsModal
            style={[
              styles.sheet,
              {
                backgroundColor: theme.background,
                paddingBottom: 12 + bottomInset,
              },
              sheetStyle,
            ]}
          >
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
            <View
              testID="hilal-modal-bar"
              style={[styles.bar, { flexDirection: row }]}
            >
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                hitSlop={8}
                style={styles.button}
              >
                <Text
                  maxFontSizeMultiplier={maxTextScale}
                  style={[buttonFont, { color: theme.textSecondary }]}
                >
                  {labels.cancel}
                </Text>
              </Pressable>
              {title ? (
                <Text
                  accessibilityRole="header"
                  numberOfLines={1}
                  maxFontSizeMultiplier={maxTextScale}
                  style={[styles.title, buttonFont, { color: theme.text }]}
                >
                  {title}
                </Text>
              ) : (
                // Keeps Cancel and Done at the two ends.
                <View style={styles.title} />
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !ready }}
                disabled={!ready}
                onPress={confirm}
                hitSlop={8}
                style={styles.button}
              >
                <Text
                  maxFontSizeMultiplier={maxTextScale}
                  style={[
                    buttonFont,
                    { color: ready ? theme.primary : theme.disabled },
                  ]}
                >
                  {labels.done}
                </Text>
              </Pressable>
            </View>
            {/* Scrolls only when the screen is too short, for example a
                small phone with large text. */}
            <ScrollView bounces={false} style={styles.scroll}>
              <HilalCalendar
                key={opening}
                {...calendarProps}
                defaultValue={value}
                defaultRangeValue={rangeValue ?? undefined}
                onChange={setPick}
                onRangeChange={setPick}
              />
            </ScrollView>
          </View>
        </SlideUp>
      </View>
    </Modal>
  );
}

/** Slides its content up into place when it mounts. */
function SlideUp({
  animate,
  children,
}: {
  animate: boolean;
  children: ReactNode;
}) {
  const [animated] = useState(animate);
  const [progress] = useState(() => new Animated.Value(animated ? 0 : 1));
  useEffect(() => {
    if (!animated) {
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: DURATION,
      easing: Easing.out(Easing.cubic),
      // React Native Web has no native animation driver.
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
    // Plays once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [SLIDE_FROM, 0],
  });
  return (
    <Animated.View
      style={[
        styles.slide,
        animated && { opacity: progress, transform: [{ translateY }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  slide: {
    alignSelf: 'center',
    maxHeight: '100%',
    maxWidth: MAX_WIDTH,
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexShrink: 1,
    paddingTop: 8,
  },
  scroll: {
    flexGrow: 0,
  },
  handle: {
    alignSelf: 'center',
    borderRadius: 2,
    height: 4,
    marginBottom: 4,
    width: 36,
  },
  bar: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  button: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
});
