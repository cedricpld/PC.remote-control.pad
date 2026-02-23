import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';
import type { LucideIcon } from 'lucide-react-native';

interface GlassButtonProps {
  onPress: () => void;
  title?: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  onPress,
  title,
  icon: Icon,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  size = 'md'
}) => {
  const { theme, colors } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return 'rgba(100, 116, 139, 0.2)';
    switch (variant) {
      case 'primary': return colors.accent;
      case 'danger': return colors.danger;
      case 'secondary': return 'rgba(255, 255, 255, 0.1)';
      default: return colors.accent;
    }
  };

  const getHeight = () => {
    switch(size) {
      case 'sm': return 36;
      case 'lg': return 56;
      default: return 48;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          height: getHeight(),
          borderColor: colors.border,
        },
        style
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {Icon && <Icon size={20} color={variant === 'secondary' ? colors.text : '#fff'} style={{ marginRight: title ? 8 : 0 }} />}
          {title && (
            <Text style={[
              styles.text,
              { color: variant === 'secondary' ? colors.text : '#fff', fontSize: size === 'sm' ? 14 : 16 },
              textStyle
            ]}>
              {title}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  text: {
    fontWeight: '600',
  }
});
