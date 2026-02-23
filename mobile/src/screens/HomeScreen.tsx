import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AppConfig, StreamDeckPage, ControlBlockConfig } from '../types';
import api from '../utils/api';
import { SortableControlList } from '../components/layout/SortableControlList';
import { GlassButton } from '../components/ui/GlassButton';
import { EditBlockDialog } from '../components/control/EditBlockDialog';
import { ManagePageDialog } from '../components/control/ManagePageDialog';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Plus, Edit3, X, Save, MoreHorizontal } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export const HomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit Dialog State
  const [editingBlock, setEditingBlock] = useState<ControlBlockConfig | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Page Dialog State
  const [showPageDialog, setShowPageDialog] = useState(false);
  const [editingPage, setEditingPage] = useState<StreamDeckPage | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/api/config');
      setConfig(res.data);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to load config");
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConfig();
    setRefreshing(false);
  }, []);

  const saveConfig = async (newConfig: AppConfig) => {
      setConfig(newConfig);
      try {
          await api.post('/api/config', newConfig);
      } catch (e) {
          Alert.alert("Error", "Failed to save layout");
      }
  };

  const handleSaveLayout = async (newBlocks: ControlBlockConfig[]) => {
      if (!config) return;
      const newPages = [...config.pages];
      newPages[currentPageIndex] = {
          ...newPages[currentPageIndex],
          blocks: newBlocks
      };
      saveConfig({ ...config, pages: newPages });
  };

  // Block Management
  const handleEditItem = (block: ControlBlockConfig) => {
      setEditingBlock(block);
      setShowEditDialog(true);
  };

  const handleAddBlock = () => {
      setEditingBlock(null);
      setShowEditDialog(true);
  };

  const handleSaveBlock = (block: ControlBlockConfig) => {
      if (!config) return;
      const currentBlocks = config.pages[currentPageIndex].blocks || [];
      const existingIndex = currentBlocks.findIndex(b => b.id === block.id);

      let newBlocks;
      if (existingIndex >= 0) {
          newBlocks = [...currentBlocks];
          newBlocks[existingIndex] = block;
      } else {
          newBlocks = [...currentBlocks, block];
      }

      handleSaveLayout(newBlocks);
      setShowEditDialog(false);
      setEditingBlock(null);
  };

  const handleDeleteItem = (id: string) => {
      if (!config) return;
      const currentBlocks = config.pages[currentPageIndex].blocks || [];
      const newBlocks = currentBlocks.filter(b => b.id !== id);
      handleSaveLayout(newBlocks);
  };

  // Page Management
  const handleAddPage = () => {
      setEditingPage(null);
      setShowPageDialog(true);
  };

  const handleEditPage = (pageToEdit?: StreamDeckPage) => {
      if (!config) return;
      const targetPage = pageToEdit || config.pages[currentPageIndex];
      setEditingPage(targetPage);
      setShowPageDialog(true);
  };

  const handleSavePage = (name: string) => {
      if (!config) return;
      const newPages = [...config.pages];

      if (editingPage) {
          // Rename
          newPages[currentPageIndex] = { ...editingPage, name };
      } else {
          // Create
          const newPage: StreamDeckPage = {
              id: Math.random().toString(36).substring(7),
              name,
              color: '#000000',
              icon: 'Activity',
              blocks: []
          };
          newPages.push(newPage);
          setCurrentPageIndex(newPages.length - 1); // Switch to new page
      }

      saveConfig({ ...config, pages: newPages });
      setShowPageDialog(false);
      setEditingPage(null);
  };

  const handleDeletePage = () => {
      if (!config) return;
      if (config.pages.length <= 1) {
          Alert.alert("Error", "Cannot delete the last page.");
          return;
      }

      const newPages = config.pages.filter((_, i) => i !== currentPageIndex);
      // Adjust index if needed
      const newIndex = Math.max(0, currentPageIndex - 1);
      setCurrentPageIndex(newIndex);
      saveConfig({ ...config, pages: newPages });
      setShowPageDialog(false);
      setEditingPage(null);
  };

  if (!config) {
      return (
          <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: colors.text }}>Loading Config...</Text>
          </View>
      );
  }

  const currentPage = config.pages[currentPageIndex];

  return (
    <View style={styles.container}>
        <LinearGradient
            colors={[colors.background, '#1e293b']}
            style={StyleSheet.absoluteFill}
        />

        {/* Header / Page Selector */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pageSelector}>
                {config.pages.map((page, index) => (
                    <GlassButton
                        key={page.id}
                        title={page.name}
                        variant={index === currentPageIndex ? 'primary' : 'secondary'}
                        size="sm"
                        onPress={() => setCurrentPageIndex(index)}
                        style={{ marginRight: 8 }}
                        onLongPress={() => {
                            if (isEditing) {
                                setCurrentPageIndex(index);
                                handleEditPage(page);
                            }
                        }}
                    />
                ))}
                {isEditing && (
                    <GlassButton
                        icon={Plus}
                        variant="secondary"
                        size="sm"
                        onPress={handleAddPage}
                    />
                )}
            </ScrollView>
            <View style={styles.headerActions}>
                {isEditing && (
                    <GlassButton
                        icon={MoreHorizontal}
                        variant="secondary"
                        size="sm"
                        onPress={handleEditPage}
                        style={{ marginRight: 8 }}
                    />
                )}
                <GlassButton
                    icon={isEditing ? Save : Edit3}
                    variant="secondary"
                    size="sm"
                    onPress={() => setIsEditing(!isEditing)}
                />
                 <GlassButton
                    icon={Settings}
                    variant="secondary"
                    size="sm"
                    onPress={() => navigation.navigate('Settings')}
                    style={{ marginLeft: 8 }}
                />
            </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
            <SortableControlList
                data={currentPage?.blocks || []} // Handle case where page might be undefined during delete transition
                onDragEnd={handleSaveLayout}
                isEditing={isEditing}
                onDeleteItem={handleDeleteItem}
                onEditItem={handleEditItem}
            />
        </View>

        {/* Floating Add Button (Edit Mode Only) */}
        {isEditing && (
            <View style={styles.fabContainer}>
                <GlassButton
                    icon={Plus}
                    title="Add Block"
                    onPress={handleAddBlock}
                    style={styles.fab}
                />
            </View>
        )}

        {/* Dialogs */}
        <EditBlockDialog
            visible={showEditDialog}
            block={editingBlock}
            onClose={() => setShowEditDialog(false)}
            onSave={handleSaveBlock}
        />

        <ManagePageDialog
            visible={showPageDialog}
            page={editingPage}
            onClose={() => setShowPageDialog(false)}
            onSave={handleSavePage}
            onDelete={editingPage ? handleDeletePage : undefined}
        />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 50, // Status bar safe area
      paddingBottom: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      zIndex: 10
  },
  pageSelector: {
      flex: 1,
  },
  headerActions: {
      flexDirection: 'row',
      marginLeft: 8
  },
  content: {
      flex: 1,
  },
  fabContainer: {
      position: 'absolute',
      bottom: 24,
      right: 24,
  },
  fab: {
      borderRadius: 24,
      paddingHorizontal: 24
  }
});
