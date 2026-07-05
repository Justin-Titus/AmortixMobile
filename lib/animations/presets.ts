/**
 * Reanimated 2 animation presets for AmortixMobile.
 *
 * All hooks return `animatedStyle` objects ready for use with <Animated.View>.
 * These are pure hooks — no components, no side effects.
 *
 * Usage:
 *   const style = useScalePress();
 *   <Animated.View style={style}><TouchableOpacity .../></Animated.View>
 */

import { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, runOnJS } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

// ─── Spring configs ──────────────────────────────────────────────
const SPRING_SNAPPY = { damping: 22, stiffness: 400 } as const;
const SPRING_BOUNCY = { damping: 14, stiffness: 360 } as const;

// ─────────────────────────────────────────────────────────────────
// useScalePress
// Returns a scale-down animatedStyle + a Gesture.Tap that drives it.
// Use with GestureDetector from react-native-gesture-handler.
// ─────────────────────────────────────────────────────────────────
export function useScalePress(onPress?: () => void) {
  const scale = useSharedValue(1);

  const gesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.96, SPRING_SNAPPY);
    })
    .onFinalize((_, success) => {
      scale.value = withSpring(1, SPRING_SNAPPY);
      if (success && onPress) {
        runOnJS(onPress)();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, gesture };
}

// ─────────────────────────────────────────────────────────────────
// useFadeSlideIn
// Fades + slides in from the bottom when `visible` becomes true.
// ─────────────────────────────────────────────────────────────────
export function useFadeSlideIn(visible: boolean, delay = 0, offsetY = 20) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(offsetY);

  if (visible) {
    opacity.value = withTiming(1, { duration: 350 });
    translateY.value = withSpring(0, { ...SPRING_SNAPPY, velocity: 0 });
  } else {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(offsetY, { duration: 200 });
  }

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
}

// ─────────────────────────────────────────────────────────────────
// useCountUp
// Animates a numeric shared value from 0 → target.
// Read `.value` with useAnimatedProps or useDerivedValue.
// ─────────────────────────────────────────────────────────────────
export function useCountUp(target: number, duration = 600) {
  const animatedValue = useSharedValue(0);

  // Re-animate whenever target changes
  animatedValue.value = withTiming(target, { duration });

  return animatedValue;
}

// ─────────────────────────────────────────────────────────────────
// useSuccessFlash
// Returns a background color that flashes green on trigger.
// ─────────────────────────────────────────────────────────────────
export function useSuccessFlash() {
  const flash = useSharedValue(0);

  const trigger = () => {
    flash.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 600 })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(16, 185, 129, ${flash.value * 0.1})`,
  }));

  return { animatedStyle, trigger };
}

// ─────────────────────────────────────────────────────────────────
// useShakeError
// Horizontal shake for form error states.
// ─────────────────────────────────────────────────────────────────
export function useShakeError() {
  const x = useSharedValue(0);

  const shake = () => {
    x.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withSpring(0, SPRING_BOUNCY)
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return { animatedStyle, shake };
}

// ─────────────────────────────────────────────────────────────────
// useEntranceStagger
// For staggered list item entrances. Pass the item index.
// ─────────────────────────────────────────────────────────────────
export function useEntranceStagger(index: number, baseDelay = 50) {
  return useFadeSlideIn(true, index * baseDelay, 16);
}
