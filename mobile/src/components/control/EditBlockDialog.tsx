import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ControlBlockConfig, YeelightConfig, SliderConfig, StatusDisplayConfig, WolConfig } from '../../types';
import { GlassDialog } from '../ui/GlassDialog';
import { GlassInput } from '../ui/GlassInput';
import { GlassButton } from '../ui/GlassButton';
import { useTheme } from '../../context/ThemeContext';
import { Check, X } from 'lucide-react-native';

interface EditBlockDialogProps {
  visible: boolean;
  block: ControlBlockConfig | null;
  onClose: () => void;
  onSave: (block: ControlBlockConfig) => void;
}

export const EditBlockDialog: React.FC<EditBlockDialogProps> = ({ visible, block, onClose, onSave }) => {
  const { colors } = useTheme();
  const [formData, setFormData] = useState<ControlBlockConfig | null>(null);

  useEffect(() => {
    if (block) {
      setFormData({ ...block });
    } else {
        // Default new block template
        setFormData({
            id: Math.random().toString(36).substring(7),
            label: 'New Button',
            actionType: 'command',
            width: 1,
            height: 1,
            target: 'server'
        });
    }
  }, [block, visible]);

  if (!visible || !formData) return null;

  const handleChange = (key: keyof ControlBlockConfig, value: any) => {
    setFormData(prev => prev ? ({ ...prev, [key]: value }) : null);
  };

  const handleNestedChange = (parentKey: 'yeelightConfig' | 'sliderConfig' | 'statusDisplayConfig' | 'wolConfig', key: string, value: any) => {
      setFormData(prev => {
          if (!prev) return null;
          const parent = prev[parentKey] || {};
          return {
              ...prev,
              [parentKey]: { ...parent, [key]: value }
          };
      });
  };

  const renderTypeSelector = () => (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
          {(['command', 'shortcut', 'yeelight', 'slider', 'statusDisplay', 'wol', 'audio'] as const).map(type => (
              <TouchableOpacity
                  key={type}
                  onPress={() => handleChange('actionType', type)}
                  style={[
                      styles.typeBtn,
                      {
                          backgroundColor: formData.actionType === type ? colors.accent : 'rgba(255,255,255,0.1)',
                          borderColor: colors.border
                      }
                  ]}
              >
                  <Text style={{ color: colors.text, fontSize: 12 }}>{type}</Text>
              </TouchableOpacity>
          ))}
      </ScrollView>
  );

  return (
    <GlassDialog visible={visible} onClose={onClose} title={block ? "Edit Block" : "New Block"}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 20 }}>

          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Type</Text>
          {renderTypeSelector()}

          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>General</Text>
          <GlassInput
              label="Label"
              value={formData.label}
              onChangeText={val => handleChange('label', val)}
          />
          <GlassInput
              label="Icon Name (Lucide)"
              value={formData.icon || ''}
              onChangeText={val => handleChange('icon', val)}
              placeholder="e.g. Activity, Monitor, Sun"
          />
          <GlassInput
              label="Color (Hex)"
              value={formData.color || ''}
              onChangeText={val => handleChange('color', val)}
              placeholder="#3b82f6"
          />

          <View style={styles.row}>
              <Text style={{ color: colors.text, marginRight: 10 }}>Target:</Text>
              {(['server', 'client'] as const).map(t => (
                  <TouchableOpacity
                      key={t}
                      onPress={() => handleChange('target', t)}
                      style={[
                          styles.chip,
                          { backgroundColor: formData.target === t ? colors.accent : 'transparent', borderColor: colors.border }
                      ]}
                  >
                      <Text style={{ color: colors.text }}>{t}</Text>
                  </TouchableOpacity>
              ))}
          </View>

          {/* Conditional Fields */}
          {formData.actionType === 'command' && (
              <>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Command</Text>
                  <GlassInput
                      label="Command to Execute"
                      value={formData.command || ''}
                      onChangeText={val => handleChange('command', val)}
                      placeholder="calc.exe or bash script"
                  />
              </>
          )}

          {formData.actionType === 'shortcut' && (
              <>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Shortcut</Text>
                  <GlassInput
                      label="Shortcut Key"
                      value={formData.shortcut || ''}
                      onChangeText={val => handleChange('shortcut', val)}
                      placeholder="ctrl+alt+delete"
                  />
              </>
          )}

          {formData.actionType === 'yeelight' && (
              <>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Yeelight Config</Text>
                  <GlassInput
                      label="IP Address"
                      value={formData.yeelightConfig?.ip || ''}
                      onChangeText={val => handleNestedChange('yeelightConfig', 'ip', val)}
                      placeholder="192.168.1.x"
                  />
                  {/* Action toggle/on/off */}
                  <View style={styles.row}>
                      {(['toggle', 'on', 'off'] as const).map(a => (
                          <TouchableOpacity
                              key={a}
                              onPress={() => handleNestedChange('yeelightConfig', 'action', a)}
                              style={[
                                  styles.chip,
                                  { backgroundColor: formData.yeelightConfig?.action === a ? colors.accent : 'transparent', borderColor: colors.border }
                              ]}
                          >
                              <Text style={{ color: colors.text }}>{a}</Text>
                          </TouchableOpacity>
                      ))}
                  </View>
              </>
          )}

          {formData.actionType === 'slider' && (
               <>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Slider Config</Text>
                  <GlassInput
                      label="API Endpoint"
                      value={formData.sliderConfig?.apiEndpoint || ''}
                      onChangeText={val => handleNestedChange('sliderConfig', 'apiEndpoint', val)}
                      placeholder="/api/set-master-volume"
                  />
                  <View style={styles.row}>
                      <GlassInput
                          label="Min"
                          value={String(formData.sliderConfig?.min ?? 0)}
                          onChangeText={val => handleNestedChange('sliderConfig', 'min', parseFloat(val))}
                          keyboardType="numeric"
                          style={{ flex: 1, marginRight: 8 }}
                      />
                      <GlassInput
                          label="Max"
                          value={String(formData.sliderConfig?.max ?? 100)}
                          onChangeText={val => handleNestedChange('sliderConfig', 'max', parseFloat(val))}
                          keyboardType="numeric"
                          style={{ flex: 1 }}
                      />
                  </View>
                  <GlassInput
                      label="Unit"
                      value={formData.sliderConfig?.unit || ''}
                      onChangeText={val => handleNestedChange('sliderConfig', 'unit', val)}
                      placeholder="%"
                  />
               </>
          )}

          {formData.actionType === 'statusDisplay' && (
              <>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Status Display Config</Text>
                  <GlassInput
                      label="API Endpoint"
                      value={formData.statusDisplayConfig?.apiEndpoint || ''}
                      onChangeText={val => handleNestedChange('statusDisplayConfig', 'apiEndpoint', val)}
                      placeholder="/api/get-cpu-usage"
                  />
                  <GlassInput
                      label="Update Interval (ms)"
                      value={String(formData.statusDisplayConfig?.updateIntervalMs || 2000)}
                      onChangeText={val => handleNestedChange('statusDisplayConfig', 'updateIntervalMs', parseInt(val))}
                      keyboardType="numeric"
                  />
                  <GlassInput
                      label="Unit"
                      value={formData.statusDisplayConfig?.labelUnit || ''}
                      onChangeText={val => handleNestedChange('statusDisplayConfig', 'labelUnit', val)}
                      placeholder="%"
                  />
              </>
          )}

          {formData.actionType === 'wol' && (
              <>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Wake On LAN</Text>
                  <GlassInput
                      label="MAC Address"
                      value={formData.wolConfig?.mac || ''}
                      onChangeText={val => handleNestedChange('wolConfig', 'mac', val)}
                      placeholder="00:11:22:33:44:55"
                  />
              </>
          )}

          <View style={styles.footer}>
              <GlassButton title="Cancel" onPress={onClose} variant="secondary" style={{ flex: 1, marginRight: 8 }} icon={X} />
              <GlassButton title="Save" onPress={() => onSave(formData)} style={{ flex: 1 }} icon={Check} />
          </View>

      </ScrollView>
    </GlassDialog>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
      maxHeight: 500, // Limit height
  },
  sectionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
      textTransform: 'uppercase'
  },
  typeSelector: {
      flexDirection: 'row',
      marginBottom: 8
  },
  typeBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      marginRight: 8
  },
  row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      flexWrap: 'wrap'
  },
  chip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      marginRight: 8,
      marginTop: 4
  },
  footer: {
      flexDirection: 'row',
      marginTop: 24,
      paddingBottom: 20
  }
});
