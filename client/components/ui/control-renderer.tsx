import * as React from 'react';
import { ControlBlockConfig } from '@/types/stream-deck';
import { ActionButton } from './action-button';
import { ControlSlider } from './control-slider';
import { StatusDisplay } from './status-display';
import * as Icons from "lucide-react";

interface ControlRendererProps {
  config: ControlBlockConfig;
  onExecute?: (config: ControlBlockConfig) => void;
  onSliderValueChange?: (config: ControlBlockConfig, value: number) => void;
  isEditing?: boolean;
  onEdit?: () => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
}

export const ControlRenderer: React.FC<ControlRendererProps> = ({
  config,
  onExecute,
  onSliderValueChange,
  isEditing,
  onEdit,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) => {
  const gridClasses = `col-span-${config.width} row-span-${config.height}`;

  const interactiveProps = {
    draggable: isEditing,
    onDragStart: (e: React.DragEvent) => onDragStart && onDragStart(e, config.id),
    onDragEnd,
    onDragOver,
    onDrop: (e: React.DragEvent) => onDrop && onDrop(e, config.id),
  };


  // Déterminez le type de rendu en fonction du type de contrôle
  if (config.actionType === 'yeelight' && config.yeelightConfig?.controlType?.includes('slider')) {
    return (
      <ControlSlider
        config={config}
        onValueChange={(value) => onSliderValueChange && onSliderValueChange(config, value)}
        isEditing={isEditing}
        onClick={isEditing ? onEdit : undefined}
        className={`w-full h-full ${gridClasses}`}
        {...interactiveProps}
      />
    );
  }

  switch (config.actionType) {
    case 'command':
    case 'shortcut':
    case 'yeelight':
    case 'audio':
      return (
        <ActionButton
          config={config}
          onExecute={() => onExecute && onExecute(config)}
          isEditing={isEditing}
          onEdit={onEdit}
          className={`w-full h-full ${gridClasses}`}
          {...interactiveProps}
        />
      );
    case 'slider':
      return (
        <ControlSlider
          config={config}
          onValueChange={(value) => onSliderValueChange && onSliderValueChange(config, value)}
          isEditing={isEditing}
          onClick={isEditing ? onEdit : undefined}
          className={`w-full h-full ${gridClasses}`}
          {...interactiveProps}
        />
      );
    case 'statusDisplay':
      return (
        <StatusDisplay
          config={config}
          isEditing={isEditing}
          onClick={isEditing ? onEdit : undefined}
          className={`w-full h-full ${gridClasses}`}
          {...interactiveProps}
        />
      );
    default:
      return (
        <div
          className={`flex items-center justify-center p-2 rounded-lg border border-red-500 text-red-500 w-full h-full ${gridClasses}`}
          {...interactiveProps}
        >
          <Icons.AlertCircle className="h-4 w-4 mr-2" />
          <span>Type inconnu: {config.actionType}</span>
        </div>
      );
  }
};

ControlRenderer.displayName = "ControlRenderer";
