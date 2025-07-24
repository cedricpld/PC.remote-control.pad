import * as React from 'react';
import { ControlBlockConfig } from '@/types/stream-deck'; // Importe le type mis à jour
import { ActionButton } from './action-button'; // Import du composant ActionButton
import { ControlSlider } from './control-slider'; // Import du composant ControlSlider
import { StatusDisplay } from './status-display'; // Import du composant StatusDisplay
import * as Icons from "lucide-react"; // Import pour les icônes (pour le fallback par exemple)


interface ControlRendererProps {
  config: ControlBlockConfig;
  // Callback pour l'exécution d'actions de type bouton (command, shortcut, yeelight)
  onExecute?: (config: ControlBlockConfig) => void;
  // Callback pour le changement de valeur d'un slider
  onSliderValueChange?: (config: ControlBlockConfig, value: number) => void;
  // Handlers pour le drag & drop (passés aux enfants)
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
}

export const ControlRenderer: React.FC<ControlRendererProps> = ({ 
  config, 
  onExecute, 
  onSliderValueChange,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) => {
  // Styles de grille pour la taille du bloc.
  // Ces classes Tailwind CSS permettent au bloc de prendre plusieurs "cellules" de grille.
  const gridClasses = `col-span-${config.width || 1} row-span-${config.height || 1}`;

  // Les props spécifiques pour le drag & drop à passer aux enfants
  const dragDropProps = { onDragStart, onDragEnd, onDragOver, onDrop };


  switch (config.actionType) {
    case 'command':
    case 'shortcut':
    case 'yeelight':
      // Pour les boutons d'action (command, shortcut, yeelight), nous utilisons ActionButton
      return (
        <ActionButton
          config={config}
          onExecute={() => onExecute && onExecute(config)}
          className={`w-full h-full ${gridClasses}`} // Appliquer les classes de grille
          {...dragDropProps} // Passer les handlers de drag-drop
        />
      );
    case 'slider':
      // Pour les sliders, nous utilisons le composant ControlSlider
      return (
        <ControlSlider
          config={config}
          onValueChange={(value) => onSliderValueChange && onSliderValueChange(config, value)}
          className={`w-full h-full ${gridClasses}`} // Appliquer les classes de grille
          {...dragDropProps} // Passer les handlers de drag-drop
        />
      );
    case 'statusDisplay':
      // Pour les afficheurs de statut, nous utilisons StatusDisplay
      return (
        <StatusDisplay
          config={config}
          className={`w-full h-full ${gridClasses}`} // Appliquer les classes de grille
          {...dragDropProps} // Passer les handlers de drag-drop
        />
      );
    default:
      // Fallback pour les types non reconnus ou pour le débogage
      return (
        <div 
          className={`flex items-center justify-center p-2 rounded-lg border border-red-500 text-red-500 w-full h-full ${gridClasses}`}
          {...dragDropProps} // Passer les handlers de drag-drop
        >
          <Icons.AlertCircle className="h-4 w-4 mr-2" />
          <span>Type inconnu: {config.actionType}</span>
        </div>
      );
  }
};

ControlRenderer.displayName = "ControlRenderer";