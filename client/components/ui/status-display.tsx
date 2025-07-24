import * as React from "react";
import { cn } from "@/lib/utils"; // Assurez-vous que ce chemin est correct
import { Label } from "@/components/ui/label"; // Assurez-vous que ce chemin est correct
import { Progress } from "@/components/ui/progress"; // Assurez-vous que ce chemin est correct
import { ControlBlockConfig } from "@/types/stream-deck"; // Importe le type mis à jour

interface StatusDisplayProps {
  config: ControlBlockConfig; // La configuration du bloc de type statusDisplay
  className?: string;
}

export const StatusDisplay = React.forwardRef<HTMLDivElement, StatusDisplayProps>(
  ({ config, className, ...props }, ref) => {
    const [currentValue, setCurrentValue] = React.useState<number | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const fetchData = React.useCallback(async () => {
      if (!config.statusDisplayConfig?.apiEndpoint) {
        setError("Endpoint API non configuré.");
        setCurrentValue(null);
        return;
      }
      try {
        const response = await fetch(config.statusDisplayConfig.apiEndpoint);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Le format de la réponse API dépendra de votre backend.
        // Pour l'exemple, supposons que l'API renvoie { value: number }
        setCurrentValue(data.value);
        setError(null);
      } catch (err: any) {
        console.error(`StatusDisplay: Échec de la récupération des données pour ${config.label}:`, err);
        setError(`Erreur: ${err.message}`);
        setCurrentValue(null);
      }
    }, [config.statusDisplayConfig?.apiEndpoint, config.label]);

    // Effectue le fetch initial et configure l'intervalle de mise à jour
    React.useEffect(() => {
      fetchData(); // Premier fetch au montage

      const interval = setInterval(fetchData, config.statusDisplayConfig?.updateIntervalMs || 5000); // Mise à jour régulière
      return () => clearInterval(interval); // Nettoie l'intervalle au démontage
    }, [fetchData, config.statusDisplayConfig?.updateIntervalMs]);

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center p-2 rounded-lg sm:rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm text-center",
          className
        )}
        style={{ backgroundColor: config.color ? `${config.color}20` : undefined,
                 borderColor: config.color ? `${config.color}40` : undefined }}
        {...props}
      >
        <Label className="text-sm font-medium leading-tight mb-2">
          {config.label}
        </Label>
        {error ? (
          <span className="text-destructive text-xs">{error}</span>
        ) : (
          currentValue !== null && (
            <>
              <span className="text-lg font-bold text-foreground">
                {currentValue.toFixed(config.statusDisplayConfig?.dataType === 'cpu' ? 1 : 0)}
                {config.statusDisplayConfig?.labelUnit}
              </span>
              {config.statusDisplayConfig?.dataType === 'cpu' || config.statusDisplayConfig?.dataType === 'ram' ? (
                <Progress value={currentValue} className="w-full mt-2 h-2" />
              ) : null}
            </>
          )
        )}
        {currentValue === null && !error && (
            <span className="text-muted-foreground text-xs">Chargement...</span>
        )}
      </div>
    );
  }
);

StatusDisplay.displayName = "StatusDisplay";