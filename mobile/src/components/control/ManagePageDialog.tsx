import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { StreamDeckPage } from '../../types';
import { GlassDialog } from '../ui/GlassDialog';
import { GlassInput } from '../ui/GlassInput';
import { GlassButton } from '../ui/GlassButton';
import { useTheme } from '../../context/ThemeContext';
import { Trash2, Check, X } from 'lucide-react-native';

interface ManagePageDialogProps {
  visible: boolean;
  page: StreamDeckPage | null; // null for new page
  onClose: () => void;
  onSave: (name: string) => void;
  onDelete?: () => void;
}

export const ManagePageDialog: React.FC<ManagePageDialogProps> = ({
  visible,
  page,
  onClose,
  onSave,
  onDelete
}) => {
  const { colors } = useTheme();
  const [name, setName] = useState('');

  useEffect(() => {
    if (page) {
      setName(page.name);
    } else {
      setName('');
    }
  }, [page, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Page name cannot be empty");
      return;
    }
    onSave(name);
  };

  const handleDelete = () => {
      Alert.alert(
          "Delete Page",
          "Are you sure you want to delete this page and all its buttons?",
          [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: onDelete }
          ]
      );
  };

  if (!visible) return null;

  return (
    <GlassDialog visible={visible} onClose={onClose} title={page ? "Edit Page" : "New Page"}>
      <GlassInput
          label="Page Name"
          value={name}
          onChangeText={setName}
          placeholder="My Page"
      />

      <View style={styles.footer}>
          {page && onDelete && (
              <GlassButton
                  onPress={handleDelete}
                  variant="danger"
                  icon={Trash2}
                  style={{ marginRight: 8, width: 50 }}
              />
          )}
          <GlassButton title="Cancel" onPress={onClose} variant="secondary" style={{ flex: 1, marginRight: 8 }} icon={X} />
          <GlassButton title="Save" onPress={handleSave} style={{ flex: 1 }} icon={Check} />
      </View>
    </GlassDialog>
  );
};

const styles = StyleSheet.create({
  footer: {
      flexDirection: 'row',
      marginTop: 24
  }
});
