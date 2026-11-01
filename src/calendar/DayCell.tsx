import { memo } from 'react';
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { RangePosition } from './range';
import type { CalendarStyles } from './styles';

export type DayCellProps = {
  epochDay: number;
  label: string;
  secondaryLabel: string | null;
  accessibilityLabel: string;
  selected: boolean;
  /** Where the day sits in a picked range, or null outside one. */
  rangePosition: RangePosition | null;
  /** The side of the cell where the next day is: 'start' or 'end'. */
  nextSide: 'start' | 'end';
  today: boolean;
  disabled: boolean;
  styles: CalendarStyles;
  dayStyle: StyleProp<ViewStyle>;
  /** maxFontSizeMultiplier of the texts. */
  maxFontScale: number;
  onSelect: (epochDay: number) => void;
};

/**
 * One day of the grid. Memoized: every prop is either a primitive or kept
 * stable by the calendar, so pressing a day only re-renders the old and
 * the new selected day.
 */
export function DayCellView({
  epochDay,
  label,
  secondaryLabel,
  accessibilityLabel,
  selected,
  rangePosition,
  nextSide,
  today,
  disabled,
  styles,
  dayStyle,
  maxFontScale,
  onSelect,
}: DayCellProps) {
  return (
    <View style={styles.slot}>
      {rangePosition !== null && rangePosition !== 'single' && (
        // Joins the days of a range; half a band at its ends.
        <View
          testID="hilal-range-band"
          style={[
            styles.rangeBand,
            rangePosition === 'middle'
              ? fullBand
              : halfBand[
                  rangePosition === 'start' ? nextSide : otherSide(nextSide)
                ],
          ]}
        />
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{
          selected: selected || rangePosition === 'middle',
          disabled,
        }}
        disabled={disabled}
        onPress={() => onSelect(epochDay)}
        style={({ pressed }) => [
          styles.day,
          today && styles.today,
          selected && styles.selected,
          pressed && !selected && styles.pressed,
          dayStyle,
        ]}
      >
        <Text
          maxFontSizeMultiplier={maxFontScale}
          style={[
            styles.dayText,
            disabled && styles.disabledText,
            today && styles.todayText,
            selected && styles.selectedText,
          ]}
        >
          {label}
        </Text>
        {secondaryLabel !== null && (
          <Text
            maxFontSizeMultiplier={maxFontScale}
            style={[
              styles.secondaryText,
              disabled && styles.disabledText,
              selected && styles.selectedSecondaryText,
            ]}
          >
            {secondaryLabel}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const fullBand = { start: 0, end: 0 } as const;
/** Half a band, on the start or the end side of the cell. */
const halfBand = {
  start: { start: 0, width: '50%' },
  end: { end: 0, width: '50%' },
} as const;

const otherSide = (side: 'start' | 'end') =>
  side === 'start' ? 'end' : 'start';

export const DayCell = memo(DayCellView);
