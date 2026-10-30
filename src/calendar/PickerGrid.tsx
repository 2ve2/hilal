import { Pressable, Text, View } from 'react-native';

import type { CalendarStyles } from './styles';

export type PickerGridItem = {
  key: number;
  label: string;
  accessibilityLabel: string;
  selected: boolean;
  /** The current month or year (today's), drawn with a ring. */
  current: boolean;
  disabled: boolean;
};

type PickerGridProps = {
  items: PickerGridItem[];
  styles: CalendarStyles;
  /** 'row' or 'row-reverse', the same as the day grid. */
  row: 'row' | 'row-reverse';
  /** Grow the rows to fill the parent's height. */
  fill: boolean;
  /** maxFontSizeMultiplier of the texts. */
  maxFontScale: number;
  onSelect: (key: number) => void;
};

const COLUMNS = 3;

/**
 * Lets names wrap only at spaces: "Rabi' al-Awwal" breaks into "Rabi'" and
 * "al‑Awwal", never after the hyphen. U+2011 looks like a hyphen.
 */
function noBreakAtHyphens(label: string) {
  return label.replace(/-/g, '\u2011');
}

/**
 * The month or year picker: items in rows of three, each a button. Only
 * rendered while the picker is open.
 */
export function PickerGrid({
  items,
  styles,
  row,
  fill,
  maxFontScale,
  onSelect,
}: PickerGridProps) {
  const rows: PickerGridItem[][] = [];
  for (let i = 0; i < items.length; i += COLUMNS) {
    rows.push(items.slice(i, i + COLUMNS));
  }
  return (
    <View style={[styles.picker, fill && styles.grow]}>
      {rows.map((rowItems, r) => (
        <View key={r} style={[{ flexDirection: row }, fill && styles.grow]}>
          {rowItems.map((item) => (
            <View key={item.key} style={styles.pickerSlot}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.accessibilityLabel}
                accessibilityState={{
                  selected: item.selected,
                  disabled: item.disabled,
                }}
                disabled={item.disabled}
                onPress={() => onSelect(item.key)}
                style={({ pressed }) => [
                  styles.pickerItem,
                  fill && styles.grow,
                  item.current && styles.today,
                  item.selected && styles.selected,
                  pressed && !item.selected && styles.pressed,
                ]}
              >
                {!item.selected && <View style={styles.pickerItemTint} />}
                {/* Long names (جمادى الآخرة, Jumada al-Akhirah) wrap to a
                    second line on narrow phones instead of being cut. */}
                <Text
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  maxFontSizeMultiplier={maxFontScale}
                  style={[
                    styles.pickerText,
                    item.disabled && styles.disabledText,
                    item.selected && styles.selectedText,
                  ]}
                >
                  {noBreakAtHyphens(item.label)}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
