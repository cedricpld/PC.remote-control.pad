import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ControlBlockConfig } from "@/types/stream-deck";
import * as Icons from "lucide-react";
import { fetchWithAuth } from '@/utils/api'; // Assurez-vous que le chemin est correct

interface StatusDisplayProps {
  config: ControlBlockConfig;
  className?: string;
  isEditing?: boolean;
  [key: string]: any;
}

export const StatusDisplay = React.forwardRef<HTMLDivElement, StatusDisplayProps>(
  ({ config, className, isEditing, ...props }, ref) => {
    const [currentValue, setCurrentValue] = React.useState<number | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const fetchData = React.useCallback(async () => {
      if (!config.statusDisplayConfig?.apiEndpoint) {
        setError("API non configurée.");
        return;
      }
      try {
        const response = await fetchWithAuth(config.statusDisplayConfig.apiEndpoint);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const data = await response.json();
        setCurrentValue(data.value);
        setError(null);
      } catch (err: any) {
        setError("Erreur");
      }
    }, [config.statusDisplayConfig?.apiEndpoint]);

    React.useEffect(() => {
      fetchData();
      const interval = setInterval(fetchData, config.statusDisplayConfig?.updateIntervalMs || 5000);
      return () => clearInterval(interval);
    }, [fetchData, config.statusDisplayConfig?.updateIntervalMs]);

    const IconComponent = config.icon ? (Icons as any)[config.icon] : null;

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center p-2 rounded-lg sm:rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm text-center space-y-1 h-full transition-all",
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
          <Label className="text-xs font-medium leading-tight truncate">{config.label}</Label>
        </div>
        {error ? (
          <span className="text-destructive text-xs">{error}</span>
        ) : currentValue !== null ? (
          <>
            <span className="text-base font-bold text-foreground">
              {currentValue.toFixed(config.statusDisplayConfig?.dataType === 'cpu' ? 1 : 0)}
              {config.statusDisplayConfig?.labelUnit}
            </span>
            {(config.statusDisplayConfig?.dataType === 'cpu' || config.statusDisplayConfig?.dataType === 'ram') && (
              <Progress value={currentValue} className="w-full h-1.5" />
            )}
          </>
        ) : (
          <span className="text-muted-foreground text-xs">...</span>
        )}
      </div>
    );
  }
);

StatusDisplay.displayName = "StatusDisplay";
