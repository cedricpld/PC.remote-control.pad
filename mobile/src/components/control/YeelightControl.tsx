import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { ControlBlockConfig } from '../../types';
import { GlassView } from '../ui/GlassView';
import { getIcon } from '../../utils/iconMapper';
import api from '../../utils/api';
import { useTheme } from '../../context/ThemeContext';
import { GlassDialog } from '../ui/GlassDialog';
import { GlassSlider } from '../ui/GlassSlider'; // We will create this
import { GlassButton } from '../ui/GlassButton';

interface YeelightControlProps {
  config: ControlBlockConfig;
}

export const YeelightControl: React.FC<YeelightControlProps> = ({ config }) => {
  const { colors } = useTheme();
  const Icon = getIcon(config.icon || 'Lightbulb');
  const [showDetails, setShowDetails] = useState(false);

  const handleToggle = async () => {
    try {
      await api.post('/api/yeelight-toggle', {
        action: 'toggle',
        yeelightIp: config.yeelightConfig?.ip
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLongPress = () => {
    setShowDetails(true);
  };

  const handleBrightness = async (val: number) => {
      try {
          await api.post('/api/yeelight-brightness', {
              yeelightIp: config.yeelightConfig?.ip,
              brightness: Math.round(val)
          });
      } catch(e) { console.error(e); }
  };

  const handleColorTemp = async (val: number) => {
      // 1700 to 6500
       try {
          await api.post('/api/yeelight-color-temp', {
              yeelightIp: config.yeelightConfig?.ip,
              colorTemp: Math.round(val)
          });
      } catch(e) { console.error(e); }
  };

  return (
    <>
      <TouchableOpacity
        onPress={handleToggle}
        onLongPress={handleLongPress}
        style={styles.touchable}
      >
        <GlassView style={[styles.container, { backgroundColor: config.color || colors.accent }]}>
          <Icon size={32} color="#fff" />
          <Text style={styles.label}>{config.label}</Text>
        </GlassView>
      </TouchableOpacity>

      <GlassDialog visible={showDetails} onClose={() => setShowDetails(false)} title="Yeelight Control">
         <View style={styles.dialogContent}>
             <Text style={[styles.sectionTitle, { color: colors.text }]}>Brightness</Text>
             <GlassSlider
                min={1}
                max={100}
                initialValue={50}
                onValueChange={handleBrightness}
             />

             <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>Color Temp</Text>
             <GlassSlider
                min={1700}
                max={6500}
                initialValue={4000}
                onValueChange={handleColorTemp}
             />

             <View style={{ marginTop: 20 }}>
                <GlassButton title="Toggle Power" onPress={handleToggle} />
             </View>
         </View>
      </GlassDialog>
    </>
  );
};

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
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
    textAlign: 'center',
    fontWeight: '600'
  },
  dialogContent: {
      padding: 10
  },
  sectionTitle: {
      marginBottom: 10,
      fontWeight: 'bold'
  }
});
