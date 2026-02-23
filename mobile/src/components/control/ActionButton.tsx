import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { ControlBlockConfig } from '../../types';
import { GlassView } from '../ui/GlassView';
import { useTheme } from '../../context/ThemeContext';
import { getIcon } from '../../utils/iconMapper';
import api from '../../utils/api';
import { ActivityIndicator } from 'react-native';

interface ActionButtonProps {
  config: ControlBlockConfig;
  onPress?: () => void; // Allow override
}

export const ActionButton: React.FC<ActionButtonProps> = ({ config, onPress }) => {
  const { colors } = useTheme();
  const Icon = getIcon(config.icon || 'Activity');
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (onPress) {
      onPress();
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/execute-action', {
        command: config.command,
        shortcut: config.shortcut,
        wolConfig: config.wolConfig,
        target: config.target,
        // For audio, we might need to construct the payload differently if it's not just a command
        // But the server handles 'command' type for most things.
        // If config.actionType is 'audio', we might need to send specific audio payload.
        // The server `index.ts` handles generic commands.
      });
    } catch (error) {
      console.error("Action failed", error);
      // Optional: Show toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} disabled={loading} style={styles.touchable}>
      <GlassView style={[styles.container, { backgroundColor: config.color || colors.surface }]}>
        {loading ? (
           <ActivityIndicator color="#fff" />
        ) : (
           <>
             <Icon size={32} color="#fff" />
             <Text style={styles.label} numberOfLines={2}>{config.label}</Text>
           </>
        )}
      </GlassView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
    margin: 4,
    aspectRatio: 1, // Make it square-ish
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  label: {
    color: '#fff',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  }
});
