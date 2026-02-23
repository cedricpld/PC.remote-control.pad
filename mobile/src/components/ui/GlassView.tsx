import React from 'react';
import { View, StyleProp, ViewStyle, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';

interface GlassViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export const GlassView: React.FC<GlassViewProps> = ({
  children,
  style,
  intensity = 20,
  tint
}) => {
  const { theme, colors } = useTheme();

  // Default tint based on theme if not specified
  const effectiveTint = tint || (theme === 'dark' ? 'dark' : 'light');

  // On Android, BlurView might be resource intensive or behave differently.
  // We can use a semi-transparent view as fallback if needed, but Expo Blur works well on modern Android.

  return (
    <View style={[styles.container, { borderColor: colors.border }, style]}>
      <BlurView
        intensity={intensity}
        tint={effectiveTint}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.content, { backgroundColor: colors.surface }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  content: {
    flex: 1,
    // The background color here provides the "tint" over the blur if needed
    // But since BlurView handles tint, we might want this to be very transparent
  }
});
