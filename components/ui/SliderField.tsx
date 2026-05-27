import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, Spacing } from '@/constants/theme';
import Typography from './Typography';

type SliderFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (value: number) => void;
};

const SLIDER_WIDTH = Dimensions.get('window').width - Spacing.base * 4;
const THUMB_SIZE = 24;

export default function SliderField({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: SliderFieldProps) {
  const translateX = useSharedValue(((value - min) / (max - min)) * (SLIDER_WIDTH - THUMB_SIZE));
  const startX = useSharedValue(0);

  useEffect(() => {
    translateX.value = ((value - min) / (max - min)) * (SLIDER_WIDTH - THUMB_SIZE);
  }, [value, min, max]);

  const updateValue = (x: number) => {
    const percentage = x / (SLIDER_WIDTH - THUMB_SIZE);
    const rawValue = min + percentage * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));
    onChange(clampedValue);
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const nextX = startX.value + event.translationX;
      translateX.value = Math.max(0, Math.min(SLIDER_WIDTH - THUMB_SIZE, nextX));
      runOnJS(updateValue)(translateX.value);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: translateX.value + THUMB_SIZE / 2,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="body" weight="semiBold" color="navy">{label}</Typography>
        <Typography variant="body" weight="bold" color="emerald">{displayValue}</Typography>
      </View>

      <View style={styles.sliderTrack}>
        <Animated.View style={[styles.progress, progressStyle]} />
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.thumb, thumbStyle]} />
        </GestureDetector>
      </View>

      <View style={styles.footer}>
        <Typography variant="xs" color="slate">{min >= 1000 ? `₹${Math.round(min / 1000)}K` : min}</Typography>
        <Typography variant="xs" color="slate">{max >= 1000 ? `₹${Math.round(max / 1000)}K` : max}</Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    justifyContent: 'center',
    position: 'relative',
  },
  progress: {
    height: 6,
    backgroundColor: Colors.emerald,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.emerald,
    position: 'absolute',
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
