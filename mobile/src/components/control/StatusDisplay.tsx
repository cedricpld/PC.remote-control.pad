import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ControlBlockConfig } from '../../types';
import { GlassView } from '../ui/GlassView';
import { useTheme } from '../../context/ThemeContext';
import { getIcon } from '../../utils/iconMapper';
import api from '../../utils/api';

interface StatusDisplayProps {
  config: ControlBlockConfig;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ config }) => {
  const { colors } = useTheme();
  const Icon = getIcon(config.icon || 'Activity');
  const [value, setValue] = useState<string | number>('--');

  useEffect(() => {
    const fetchStatus = async () => {
        if (!config.statusDisplayConfig?.apiEndpoint) return;
        try {
            const res = await api.get(config.statusDisplayConfig.apiEndpoint);
            if (res.data && res.data.value !== undefined) {
                setValue(res.data.value);
            }
        } catch (e) {
            // silent fail
        }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, config.statusDisplayConfig?.updateIntervalMs || 2000);
    return () => clearInterval(interval);
  }, [config.statusDisplayConfig?.apiEndpoint]);

  // If unit is %, show a bar?
  const isPercent = config.statusDisplayConfig?.labelUnit === '%';
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));

  return (
    <GlassView style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.row}>
            <Icon size={24} color={colors.accent} />
            <View style={styles.textContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{config.label}</Text>
                <Text style={[styles.value, { color: colors.text }]}>
                    {typeof value === 'number' ? value.toFixed(1) : value}
                    {config.statusDisplayConfig?.labelUnit}
                </Text>
            </View>
        </View>

        {isPercent && !isNaN(numValue) && (
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                <View
                    style={[
                        styles.progressBarFill,
                        {
                            backgroundColor: numValue > 80 ? colors.danger : colors.accent,
                            width: `${Math.min(100, Math.max(0, numValue))}%`
                        }
                    ]}
                />
            </View>
        )}
    </GlassView>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 4,
    padding: 12,
    justifyContent: 'center',
    minHeight: 80
  },
  row: {
      flexDirection: 'row',
      alignItems: 'center'
  },
  textContainer: {
      marginLeft: 12,
      flex: 1
  },
  label: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5
  },
  value: {
      fontSize: 18,
      fontWeight: 'bold'
  },
  progressBarBg: {
      height: 4,
      borderRadius: 2,
      marginTop: 8,
      width: '100%',
      overflow: 'hidden'
  },
  progressBarFill: {
      height: '100%'
  }
});
