export interface StreamDeckPage {
  id: string;
  name: string;
  // 'buttons' est renommé en 'blocks' pour être plus générique
  blocks: ControlBlockConfig[];
  color?: string;
  icon?: string;
}

// Configuration générique pour tous les types de blocs
export interface ControlBlockConfig {
  id: string;
  label: string;
  icon?: string;
  color?: string;

  // Propriétés de taille pour la grille
  width?: number; // en unités de grille (ex: 1, 2)
  height?: number; // en unités de grille (ex: 1, 2)

  // Type de l'action ou du comportement du bloc
  actionType: 'command' | 'shortcut' | 'yeelight' | 'slider' | 'statusDisplay';

  // --- Propriétés spécifiques à chaque type ---
  command?: string;
  shortcut?: string;
  
  yeelightConfig?: {
    ip: string;
    action: 'toggle' | 'on' | 'off';
  };

  sliderConfig?: {
    apiEndpoint: string;
    min: number;
    max: number;
    initialValue: number;
    unit?: string;
  };

  statusDisplayConfig?: {
    apiEndpoint: string;
    dataType: 'cpu' | 'ram' | 'disk' | 'network' | 'custom';
    updateIntervalMs?: number;
    labelUnit?: string;
  };
}