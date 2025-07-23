import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RotateCcw, Server } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestartServer: () => void; // Ajout de la prop pour la fonction de redémarrage
}

export function SettingsDialog({ open, onOpenChange, onRestartServer }: SettingsDialogProps) {
  const [isRestarting, setIsRestarting] = React.useState(false);

  // Fonction appelée lorsque l'utilisateur clique sur le bouton "Restart Server"
  const handleRestartServerClick = async () => {
    setIsRestarting(true);
    try {
      await onRestartServer(); // Appelle la fonction passée par la prop
      // L'alerte de succès ou d'échec sera gérée par la fonction dans stream-deck.tsx
    } catch (error) {
      console.error("Échec du déclenchement du redémarrage du serveur :", error);
      alert("Échec du déclenchement du redémarrage du serveur.");
    } finally {
      setIsRestarting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Paramètres
          </DialogTitle>
          <DialogDescription>
            Configurez les paramètres de votre CONTROL PAD.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Gestion du Serveur</h4>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Redémarrez le serveur de contrôle à distance si vous rencontrez des problèmes de connexion.
              </p>
              <Button
                onClick={handleRestartServerClick} // Utilise la nouvelle fonction
                disabled={isRestarting}
                className="w-full gap-2"
                variant="outline"
              >
                <RotateCcw
                  className={`h-4 w-4 ${isRestarting ? "animate-spin" : ""}`}
                />
                {isRestarting ? "Redémarrage..." : "Redémarrer le Serveur"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Informations sur l'application</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>CONTROL PAD Client Web v1.1.0</p>
              <p>by Cédric PALADJIAN</p>
              <p>Nodes.js + Builder.io</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}