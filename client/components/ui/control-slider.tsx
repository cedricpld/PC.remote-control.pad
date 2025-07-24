import * as React from "react";
import { Slider } from "@/components/ui/slider"; // Assurez-vous que ce chemin est correct
import { Label } from "@/components/ui/label"; // Assurez-vous que ce chemin est correct
import { cn } from "@/lib/utils"; // Assurez-vous que ce chemin est correct
import { ControlBlockConfig } from "@/types/stream-deck"; // Importe le type mis à jour

interface ControlSliderProps {
  config: ControlBlockConfig; // La configuration du bloc de type slider
  onValueChange?: (value: number) => void; // Callback pour quand la valeur change
  className?: string;
}

export const ControlSlider = React.forwardRef<HTMLDivElement, ControlSliderProps>(
  ({ config, onValueChange, className, ...props }, ref) => {
    // Utilise la valeur initiale du sliderConfig ou un défaut
    const [sliderValue, setSliderValue] = React.useState(config.sliderConfig?.initialValue || config.sliderConfig?.min || 0);

    // Met à jour la valeur interne si la config change de l'extérieur
    React.useEffect(() => {
      if (config.sliderConfig?.initialValue !== undefined) {
        setSliderValue(config.sliderConfig.initialValue);
      }
    }, [config.sliderConfig?.initialValue]);

    // La fonction qui sera appelée quand l'utilisateur lâche le slider
    const handleSliderChange = (value: number[]) => {
      setSliderValue(value[0]);
      if (onValueChange) {
        onValueChange(value[0]);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center p-2 rounded-lg sm:rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm",
          className
        )}
        style={{ backgroundColor: config.color ? `${config.color}20` : undefined,
                 borderColor: config.color ? `${config.color}40` : undefined }}
        {...props}
      >
        <Label className="text-sm font-medium text-center mb-2 leading-tight">
          {config.label}
        </Label>
        <Slider
          defaultValue={[sliderValue]}
          min={config.sliderConfig?.min || 0}
          max={config.sliderConfig?.max || 100}
          step={1} // Vous pouvez configurer le step si besoin
          onValueChange={setSliderValue} // Met à jour l'état visuel du slider
          onValueCommit={handleSliderChange} // Déclenche l'action quand le slider est relâché
          className="w-full px-2"
        />
        <span className="mt-2 text-xs text-muted-foreground">
          {sliderValue}{config.sliderConfig?.unit}
        </span>
      </div>
    );
  }
);

ControlSlider.displayName = "ControlSlider";