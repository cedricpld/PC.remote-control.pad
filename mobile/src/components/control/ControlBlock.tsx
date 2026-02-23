import React from 'react';
import { ControlBlockConfig } from '../../types';
import { ActionButton } from './ActionButton';
import { YeelightControl } from './YeelightControl';
import { SliderControl } from './SliderControl';
import { StatusDisplay } from './StatusDisplay';

interface ControlBlockProps {
  config: ControlBlockConfig;
}

export const ControlBlock: React.FC<ControlBlockProps> = ({ config }) => {
  switch (config.actionType) {
    case 'yeelight':
      return <YeelightControl config={config} />;
    case 'slider':
      return <SliderControl config={config} />;
    case 'statusDisplay':
      return <StatusDisplay config={config} />;
    case 'command':
    case 'shortcut':
    case 'wol':
    case 'audio':
    default:
      return <ActionButton config={config} />;
  }
};
