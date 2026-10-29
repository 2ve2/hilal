import { useEffect, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const DURATION = 220;
/** Scale the content starts from, just under its full size. */
const FROM_SCALE = 0.96;

type AppearProps = {
  /**
   * Fade and zoom in on mount. False renders a plain View. Read once, on
   * mount, so the content never remounts when it changes.
   */
  animate: boolean;
  style?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
  children: ReactNode;
};

/**
 * Fades its content in with a slight zoom when it mounts, so switching
 * between the days and the month or year picker is not an abrupt jump.
 * Give it a new `key` to play it again.
 */
export function Appear({ animate, style, onLayout, children }: AppearProps) {
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

  if (!animated) {
    return (
      <View style={style} onLayout={onLayout}>
        {children}
      </View>
    );
  }
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [FROM_SCALE, 1],
  });
  return (
    <Animated.View
      style={[style, { opacity: progress, transform: [{ scale }] }]}
      onLayout={onLayout}
    >
      {children}
    </Animated.View>
  );
}

/** Whether the user asked the system to reduce motion. */
export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (enabled) => mounted && setReduceMotion(enabled),
      () => {}
    );
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduceMotion;
}
