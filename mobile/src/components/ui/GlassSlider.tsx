import React from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS, useDerivedValue } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

interface GlassSliderProps {
  min: number;
  max: number;
  initialValue: number;
  onValueChange: (value: number) => void;
  style?: any;
}

export const GlassSlider: React.FC<GlassSliderProps> = ({
  min,
  max,
  initialValue,
  onValueChange,
  style
}) => {
  const { colors } = useTheme();
  const width = useSharedValue(0);
  const progress = useSharedValue((initialValue - min) / (max - min));

  const handleLayout = (e: LayoutChangeEvent) => {
      width.value = e.nativeEvent.layout.width;
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
        if (width.value === 0) return;
        // We need the position relative to the start of the gesture or absolute?
        // e.x is relative to the view usually.
        // RNGH 2 e.x is the coordinate of the finger inside the view.
        // But if we touch and drag, we want absolute position?
        // Actually e.x is local.

        let newProgress = e.x / width.value;
        newProgress = Math.min(Math.max(newProgress, 0), 1);
        progress.value = newProgress;

        const actualVal = min + (newProgress * (max - min));
        runOnJS(onValueChange)(actualVal);
    })
    .onStart((e) => {
         // Should also update on tap/start
         if (width.value === 0) return;
         let newProgress = e.x / width.value;
         newProgress = Math.min(Math.max(newProgress, 0), 1);
         progress.value = newProgress;
    });

  const animatedStyle = useAnimatedStyle(() => ({
      width: `${progress.value * 100}%`
  }));

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
        <GestureDetector gesture={pan}>
            <View style={[styles.track, { backgroundColor: colors.border }]}>
                <Animated.View style={[styles.fill, animatedStyle, { backgroundColor: colors.accent }]} />
            </View>
        </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40, // Increased touch area
    justifyContent: 'center',
  },
  track: {
      height: 8,
      borderRadius: 4,
      width: '100%',
      overflow: 'hidden',
      justifyContent: 'center'
  },
  fill: {
      height: '100%',
      borderRadius: 4,
  }
});
