import * as React from 'react';
import { ControlBlockConfig } from '@/types/stream-deck';
import { ActionButton } from './action-button';
import { ControlSlider } from './control-slider';
import { StatusDisplay } from './status-display';
import * as Icons from "lucide-react";
import { cn } from '@/lib/utils';

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
  config, onExecute, onSliderValueChange, isEditing, onEdit,
  onDragStart, onDragEnd, onDragOver, onDrop,
}) => {
  const interactiveProps = {
    draggable: isEditing,
    onClick: isEditing ? onEdit : undefined,
    onDragStart: (e: React.DragEvent) => onDragStart && onDragStart(e, config.id),
    onDragEnd, onDragOver,
    onDrop: (e: React.DragEvent) => onDrop && onDrop(e, config.id),
    // **CORRECTION : On applique le style ici**
    style: {
      gridColumn: `span ${config.width || 1}`,
    }
  };

  const sharedProps = {
    config, isEditing, onEdit,
    ...interactiveProps
  }

  switch (config.actionType) {
    case 'command':
    case 'shortcut':
    case 'yeelight':
      return <ActionButton {...sharedProps} onExecute={() => onExecute && onExecute(config)} />;
    case 'slider':
      return <ControlSlider {...sharedProps} onValueChange={(value) => onSliderValueChange && onSliderValueChange(config, value)} />;
    case 'statusDisplay':
      return <StatusDisplay {...sharedProps} />;
    default:
      return (
        <div {...interactiveProps} className={cn("flex items-center justify-center p-2 rounded-lg border border-red-500 text-red-500")}>
          <Icons.AlertCircle className="h-4 w-4 mr-2" />
          <span>Type inconnu</span>
        </div>
      );
  }
};

ControlRenderer.displayName = "ControlRenderer";