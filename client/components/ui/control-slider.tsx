import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ControlBlockConfig } from "@/types/stream-deck";
import * as Icons from "lucide-react";
import { fetchWithAuth } from '@/utils/api';

interface ControlSliderProps {
  config: ControlBlockConfig;
  onValueChange?: (value: number) => void;
  className?: string;
  isEditing?: boolean;
  [key: string]: any;
}

export const ControlSlider = React.forwardRef<HTMLDivElement, ControlSliderProps>(
  ({ config, onValueChange, className, isEditing, ...props }, ref) => {
    const [sliderValue, setSliderValue] = React.useState(config.sliderConfig?.initialValue || 0);

    React.useEffect(() => {
      setSliderValue(config.sliderConfig?.initialValue || 0);
    }, [config.sliderConfig?.initialValue]);

    const handleSliderChange = async (value: number[]) => {
      const newValue = value[0];
      setSliderValue(newValue);
      if (onValueChange) {
        onValueChange(newValue);
      }

      // Vérifiez si le bloc est de type Yeelight et utilisez l'endpoint approprié
      if (config.actionType === 'yeelight' && config.yeelightConfig?.controlType === 'slider') {
        try {
          const response = await fetchWithAuth('/api/yeelight-brightness', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              brightness: newValue,
              yeelightIp: config.yeelightConfig?.ip
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Erreur lors de la mise à jour de la luminosité:', errorData.error || 'Erreur serveur');
          } else {
            console.log('Luminosité mise à jour avec succès');
          }
        } catch (error) {
          console.error('Erreur réseau lors de la mise à jour de la luminosité:', error);
        }
      } else if (config.sliderConfig?.apiEndpoint) {
        try {
          const response = await fetchWithAuth(config.sliderConfig.apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: newValue }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Erreur lors de la mise à jour du slider:', errorData.error || 'Erreur serveur');
          } else {
            console.log('Volume mis à jour avec succès');
          }
        } catch (error) {
          console.error('Erreur réseau lors de la mise à jour du slider:', error);
        }
      }
    };

    const IconComponent = config.icon ? (Icons as any)[config.icon] : null;
    const min = config.sliderConfig?.min || 0;
    const max = config.sliderConfig?.max || 100;
    const displayValueAsPercent = max === 65535;
    const displayValue = displayValueAsPercent
      ? Math.round((sliderValue / max) * 100)
      : sliderValue;
    const displayUnit = displayValueAsPercent ? '%' : config.sliderConfig?.unit || '';

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center p-2 rounded-lg sm:rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm space-y-1 h-full transition-all",
          isEditing && "ring-2 ring-primary/50 cursor-move hover:ring-primary",
          className
        )}
        style={{
          backgroundColor: config.color ? `${config.color}20` : undefined,
          borderColor: config.color ? `${config.color}40` : undefined
        }}
        {...props}
      >
        <div className="flex items-center justify-center gap-2 w-full">
          {IconComponent && <IconComponent className="h-4 w-4 shrink-0" style={{ color: config.color || "currentColor" }} />}
          <Label className="text-xs font-medium text-center leading-tight truncate">{config.label}</Label>
        </div>
        <Slider
          defaultValue={[sliderValue]}
          min={min}
          max={max}
          step={1}
          onValueChange={(value) => setSliderValue(value[0])}
          onValueCommit={handleSliderChange}
          className="w-full px-2"
        />
        <span className="text-xs text-muted-foreground pt-1">
          {displayValue}{displayUnit}
        </span>
      </div>
    );
  }
);

ControlSlider.displayName = "ControlSlider";
