export interface StreamDeckPage {
  id: string;
  name: string;
  // Renommé 'buttons' en 'blocks' pour être plus générique, car nous aurons différents types de blocs
  blocks: ControlBlockConfig[];
  color?: string;
  icon?: string;
}

// Configuration générique pour tous les types de blocs (boutons, sliders, afficheurs de statut)
export interface ControlBlockConfig {
  id: string;
  label: string;
  icon?: string; // Icône du bloc
  color?: string; // Couleur principale du bloc

  // Propriétés de taille pour le layout en grille (en unités de grille, par ex. col-span, row-span)
  // Ces valeurs détermineront la taille que le bloc occupera dans la grille.
  // Par exemple, width: 2, height: 1 pourrait signifier qu'il prend 2 colonnes et 1 ligne.
  width?: number; // Largeur du bloc en unités de grille (par défaut 1)
  height?: number; // Hauteur du bloc en unités de grille (par défaut 1)

  // Type de l'action ou du comportement du bloc
  actionType: 'command' | 'shortcut' | 'yeelight' | 'slider' | 'statusDisplay';

  // Propriétés spécifiques au type d'action (rendues optionnelles car non toutes utilisées par chaque type)
  command?: string; // Utilisé si actionType est 'command' (pour commandes système ou URL)
  shortcut?: string; // Utilisé si actionType est 'shortcut' (pour raccourcis clavier)

  // Configuration spécifique à Yeelight (utilisée si actionType est 'yeelight')
  yeelightConfig?: {
    ip: string;
    action: 'toggle' | 'on' | 'off'; // Action spécifique pour l'ampoule
  };

  // NOUVEAU: Configuration spécifique aux sliders (utilisée si actionType est 'slider')
  sliderConfig?: {
    apiEndpoint: string; // Point d'API que le slider doit appeler (ex: '/api/set-volume')
    min: number;         // Valeur minimale du slider
    max: number;         // Valeur maximale du slider
    initialValue: number;// Valeur initiale du slider
    unit?: string;       // Unité à afficher (ex: '%' pour le volume, '°C' pour la température)
  };

  // NOUVEAU: Configuration spécifique aux afficheurs de statut (utilisée si actionType est 'statusDisplay')
  statusDisplayConfig?: {
    apiEndpoint: string; // Point d'API d'où récupérer les données (ex: '/api/get-cpu-usage')
    dataType: 'cpu' | 'ram' | 'disk' | 'network' | 'custom'; // Type de donnée à afficher
    updateIntervalMs?: number; // Fréquence de mise à jour des données en millisecondes (ex: 1000 pour 1s)
    labelUnit?: string; // Unité à afficher avec la valeur (ex: '%' pour CPU, 'GB' pour RAM)
  };
}