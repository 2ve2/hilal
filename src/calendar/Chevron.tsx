import { StyleSheet, View } from 'react-native';

type ChevronProps = {
  direction: 'left' | 'right';
  color: string;
};

const SIZE = 14;
const LENGTH = 10;
const THICKNESS = 2.5;
// Vertical offset of each stroke's center so their ends meet at the tip.
const OFFSET = LENGTH / (2 * Math.SQRT2);

/**
 * A chevron drawn with two rotated strokes. Not a text glyph: '‹' and '›'
 * are mirrored by the Unicode bidi algorithm in right-to-left text, so they
 * would point the wrong way in RTL apps. No left/right styles either, since
 * React Native swaps those in RTL layouts.
 */
export function Chevron({ direction, color }: ChevronProps) {
  const upper = direction === 'left' ? '-45deg' : '45deg';
  const lower = direction === 'left' ? '45deg' : '-45deg';
  return (
    <View testID={`hilal-chevron-${direction}`} style={styles.box}>
      <View
        style={[
          styles.stroke,
          { backgroundColor: color, top: SIZE / 2 - OFFSET - THICKNESS / 2 },
          { transform: [{ rotate: upper }] },
        ]}
      />
      <View
        style={[
          styles.stroke,
          { backgroundColor: color, top: SIZE / 2 + OFFSET - THICKNESS / 2 },
          { transform: [{ rotate: lower }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    height: SIZE,
    width: SIZE,
  },
  stroke: {
    borderRadius: THICKNESS / 2,
    height: THICKNESS,
    position: 'absolute',
    width: LENGTH,
  },
});
