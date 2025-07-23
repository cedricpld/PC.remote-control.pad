export interface StreamDeckPage {
  id: string;
  name: string;
  buttons: ActionButtonConfig[];
  color?: string;
  icon?: string;
}

export interface ActionButtonConfig {
  id: string;
  label: string;
  icon?: any;
  color?: string;
  command?: string;
  shortcut?: string;
}
