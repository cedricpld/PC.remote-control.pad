import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ControlBlockConfig } from '../../types';
import { GlassView } from '../ui/GlassView';
import { GlassSlider } from '../ui/GlassSlider';
import { useTheme } from '../../context/ThemeContext';
import { getIcon } from '../../utils/iconMapper';
import api from '../../utils/api';

interface SliderControlProps {
  config: ControlBlockConfig;
}

export const SliderControl: React.FC<SliderControlProps> = ({ config }) => {
  const { colors } = useTheme();
  const Icon = getIcon(config.icon || 'Volume2');
  const [value, setValue] = useState(config.sliderConfig?.initialValue || 0);

  // Debounce logic could be inside GlassSlider or here
  // For simplicity, we assume GlassSlider handles throttling or we just fire API

  const handleValueChange = async (val: number) => {
    setValue(val);
    // Determine endpoint based on config or default logic
    const endpoint = config.sliderConfig?.apiEndpoint || '/api/set-master-volume';

    try {
        await api.post(endpoint, { value: Math.round(val) });
    } catch (e) {
        console.error("Slider fail", e);
    }
  };

  return (
    <GlassView style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.header}>
            <Icon size={20} color={colors.text} />
            <Text style={[styles.label, { color: colors.text }]}>{config.label}</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>{Math.round(value)}{config.sliderConfig?.unit}</Text>
        </View>
        <GlassSlider
            min={config.sliderConfig?.min || 0}
            max={config.sliderConfig?.max || 100}
            initialValue={value}
            onValueChange={handleValueChange}
            style={{ marginTop: 10 }}
        />
    </GlassView>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 4,
    padding: 12,
    // Provide a fixed height if needed, or let it grow
    height: 100,
    justifyContent: 'center'
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 5
  },
  label: {
      flex: 1,
      marginLeft: 10,
      fontWeight: '600'
  },
  value: {
      fontSize: 12
  }
});
