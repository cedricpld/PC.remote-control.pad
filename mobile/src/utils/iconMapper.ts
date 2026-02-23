import {
  Monitor,
  Cpu,
  Activity,
  Volume2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Power,
  Command,
  Keyboard,
  Sun,
  Moon,
  Lightbulb,
  Battery,
  Wifi,
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Settings,
  Home,
  MoreHorizontal
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

const iconMap: Record<string, LucideIcon> = {
  'Monitor': Monitor,
  'Cpu': Cpu,
  'Activity': Activity,
  'Volume2': Volume2,
  'Mic': Mic,
  'MicOff': MicOff,
  'Video': Video,
  'VideoOff': VideoOff,
  'Power': Power,
  'Command': Command,
  'Keyboard': Keyboard,
  'Sun': Sun,
  'Moon': Moon,
  'Lightbulb': Lightbulb,
  'Battery': Battery,
  'Wifi': Wifi,
  'Music': Music,
  'Play': Play,
  'Pause': Pause,
  'SkipForward': SkipForward,
  'SkipBack': SkipBack,
  'Settings': Settings,
  'Home': Home,
  'MoreHorizontal': MoreHorizontal,
  // Add more mappings as needed based on what the user uses
  // Fallback
  'default': Activity
};

export const getIcon = (name: string): LucideIcon => {
  // Normalize: The user might use lowercase or different casing
  // The server config usually has specific names.
  // We try exact match, then capitalized, then default.
  if (iconMap[name]) return iconMap[name];

  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
  if (iconMap[capitalized]) return iconMap[capitalized];

  return iconMap['default'];
};
