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
  icon?: string; // Store icon as string name instead of component
  color?: string;
  command?: string;
  shortcut?: string;
}
