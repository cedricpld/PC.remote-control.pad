import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams, ShadowDecorator } from 'react-native-draggable-flatlist';
import { ControlBlockConfig } from '../../types';
import { ControlBlock } from '../control/ControlBlock';
import { useTheme } from '../../context/ThemeContext';
import { GlassView } from '../ui/GlassView';
import { getIcon } from '../../utils/iconMapper';
import { Trash2, Edit2 } from 'lucide-react-native';

interface SortableControlListProps {
  data: ControlBlockConfig[];
  onDragEnd: (data: ControlBlockConfig[]) => void;
  isEditing: boolean;
  onEditItem?: (item: ControlBlockConfig) => void;
  onDeleteItem?: (id: string) => void;
}

export const SortableControlList: React.FC<SortableControlListProps> = ({
  data,
  onDragEnd,
  isEditing,
  onEditItem,
  onDeleteItem
}) => {
  const { colors } = useTheme();

  const renderItem = ({ item, drag, isActive }: RenderItemParams<ControlBlockConfig>) => {
    return (
      <ScaleDecorator>
        <View style={styles.itemWrapper}>
             <View style={{ flex: 1, opacity: isActive ? 0.5 : 1 }}>
                {isEditing ? (
                    <GlassView style={[styles.editContainer, { backgroundColor: colors.surface }]}>
                         <View style={styles.editControls}>
                             <TouchableOpacity onPress={drag} onLongPress={drag} style={styles.dragHandle}>
                                 <Text style={{ fontSize: 24, color: colors.textSecondary }}>☰</Text>
                             </TouchableOpacity>

                             <View style={styles.preview}>
                                 <Text style={{ color: colors.text, fontWeight: 'bold' }}>{item.label}</Text>
                                 <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{item.actionType}</Text>
                             </View>

                             <View style={styles.actions}>
                                 <TouchableOpacity onPress={() => onEditItem && onEditItem(item)} style={styles.iconBtn}>
                                     <Edit2 size={20} color={colors.text} />
                                 </TouchableOpacity>
                                 <TouchableOpacity onPress={() => onDeleteItem && onDeleteItem(item.id)} style={[styles.iconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                                     <Trash2 size={20} color={colors.danger} />
                                 </TouchableOpacity>
                             </View>
                         </View>
                    </GlassView>
                ) : (
                    <ControlBlock config={item} />
                )}
             </View>
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <DraggableFlatList
      data={data}
      onDragEnd={({ data }) => onDragEnd(data)}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      containerStyle={styles.list}
      contentContainerStyle={{ paddingBottom: 100 }}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
    width: '100%',
  },
  itemWrapper: {
      paddingHorizontal: 16,
      paddingVertical: 8,
  },
  editContainer: {
      padding: 12,
      borderRadius: 12,
  },
  editControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
  },
  dragHandle: {
      padding: 8,
  },
  preview: {
      flex: 1,
      marginLeft: 12
  },
  actions: {
      flexDirection: 'row',
  },
  iconBtn: {
      padding: 8,
      borderRadius: 8,
      marginLeft: 8,
      backgroundColor: 'rgba(255,255,255,0.1)'
  }
});
