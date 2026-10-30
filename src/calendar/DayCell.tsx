import { memo } from 'react';
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { MAX_CELL_FONT_SCALE, type CalendarStyles } from './styles';

export type DayCellProps = {
  epochDay: number;
  label: string;
  secondaryLabel: string | null;
  accessibilityLabel: string;
  selected: boolean;
  today: boolean;
  disabled: boolean;
  styles: CalendarStyles;
  dayStyle: StyleProp<ViewStyle>;
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
  today,
  disabled,
  styles,
  dayStyle,
  onSelect,
}: DayCellProps) {
  return (
    <View style={styles.slot}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected, disabled }}
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
          maxFontSizeMultiplier={MAX_CELL_FONT_SCALE}
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
            maxFontSizeMultiplier={MAX_CELL_FONT_SCALE}
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

export const DayCell = memo(DayCellView);
