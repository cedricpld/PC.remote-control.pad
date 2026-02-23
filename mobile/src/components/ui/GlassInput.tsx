import React from 'react';
import { TextInput, StyleSheet, View, Text, TextInputProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';
import type { LucideIcon } from 'lucide-react-native';

interface GlassInputProps extends TextInputProps {
  label?: string;
  icon?: LucideIcon;
  error?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  icon: Icon,
  error,
  style,
  ...props
}) => {
  const { theme, colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}

      <View style={[
        styles.container,
        {
          borderColor: error ? colors.danger : colors.border,
          backgroundColor: colors.surface
        }
      ]}>
        {Icon && (
          <View style={styles.iconContainer}>
            <Icon size={20} color={colors.textSecondary} />
          </View>
        )}
        <TextInput
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text }, style]}
          {...props}
        />
      </View>

      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  iconContainer: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
  }
});
