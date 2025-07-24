// NOUVEAU: Ajout de yeelightIp à ActionButtonConfig
export interface ActionButtonConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
  command: string;
  shortcut: string;
  yeelightIp?: string; // Ajout de ce champ optionnel
}

export interface StreamDeckPage {
  id: string;
  name: string;
  icon: string;
  color: string;
  buttons: ActionButtonConfig[];
}