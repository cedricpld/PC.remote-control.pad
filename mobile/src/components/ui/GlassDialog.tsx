import React from 'react';
import { Modal, View, StyleSheet, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';
import { GlassView } from './GlassView';

interface GlassDialogProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const GlassDialog: React.FC<GlassDialogProps> = ({
  visible,
  onClose,
  title,
  children
}) => {
  const { theme, colors } = useTheme();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <TouchableWithoutFeedback>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardView}
                >
                    <GlassView style={[styles.dialog, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        {title && (
                            <View style={styles.header}>
                                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                            </View>
                        )}
                        <View style={styles.content}>
                            {children}
                        </View>
                    </GlassView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    // Ensure GlassView doesn't clip content if not needed
    overflow: 'visible'
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    width: '100%',
  }
});
