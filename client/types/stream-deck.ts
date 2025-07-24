export interface StreamDeckPage {
  id: string;
  name: string;
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

  // La hauteur a été retirée
  width?: number; // en unités de grille (ex: 1, 2, 3)

  actionType: 'command' | 'shortcut' | 'yeelight' | 'slider' | 'statusDisplay';

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