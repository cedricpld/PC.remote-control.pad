export interface StreamDeckPage {
  id: string;
  name: string;
  color: string;
  icon: string;
  blocks: ControlBlockConfig[];
}

export type ActionButtonConfig = ControlBlockConfig;

export interface ControlBlockConfig {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  width: number;
  height: number;
  actionType: 'command' | 'shortcut' | 'yeelight' | 'slider' | 'statusDisplay' | 'audio' | 'wol';
  target?: 'server' | 'client';
  command?: string;
  shortcut?: string;
  yeelightConfig?: YeelightConfig;
  sliderConfig?: SliderConfig;
  statusDisplayConfig?: StatusDisplayConfig;
  audioConfig?: AudioConfig;
  wolConfig?: WolConfig;
}

export interface YeelightConfig {
  ip: string;
  action?: 'toggle' | 'on' | 'off';
  controlType: 'button' | 'brightness_slider' | 'color_temperature_slider' | 'color_picker' | 'hue_slider';
  color?: string;
}

export interface SliderConfig {
  apiEndpoint: string;
  min: number;
  max: number;
  initialValue: number;
  unit: string;
}

export interface StatusDisplayConfig {
  apiEndpoint: string;
  dataType: 'cpu' | 'ram';
  updateIntervalMs: number;
  labelUnit: string;
}

export interface AudioConfig {
  action: 'stopAll';
}

export interface WolConfig {
  mac: string;
  method: 'etherwake' | 'network';
  broadcastIp?: string;
}

export interface PcServerConfig {
  ip: string;
  port: number;
}

export interface AppConfig {
  pages: StreamDeckPage[];
  pcServer?: PcServerConfig;
  auth?: { hashedPassword?: string };
}
