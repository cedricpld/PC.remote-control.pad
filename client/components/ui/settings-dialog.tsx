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
import { RotateCcw, Server, Power } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestartServer: () => Promise<void>; // Fonction pour redémarrer le serveur
  onStopServer: () => Promise<void>; // Nouvelle fonction pour arrêter le serveur
}

export function SettingsDialog({
  open,
  onOpenChange,
  onRestartServer,
  onStopServer,
}: SettingsDialogProps) {
  const [isRestarting, setIsRestarting] = React.useState(false);
  const [isStopping, setIsStopping] = React.useState(false);

  // Fonction appelée lorsque l'utilisateur clique sur le bouton "Restart Server"
  const handleRestartServerClick = async () => {
    setIsRestarting(true);
    try {
      await onRestartServer();
    } catch (error) {
      console.error("Échec du déclenchement du redémarrage du serveur :", error);
      alert("Échec du déclenchement du redémarrage du serveur.");
    } finally {
      setIsRestarting(false);
    }
  };

  // Fonction appelée lorsque l'utilisateur clique sur le bouton "Stop Server"
  const handleStopServerClick = async () => {
    setIsStopping(true);
    try {
      await onStopServer();
    } catch (error) {
      console.error("Échec de l'arrêt du serveur :", error);
      alert("Échec de l'arrêt du serveur.", error);
    } finally {
      setIsStopping(false);
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
                Redémarrez ou arrêtez le serveur de contrôle à distance si vous rencontrez des problèmes de connexion.
              </p>
              <Button
                onClick={handleRestartServerClick}
                disabled={isRestarting}
                className="w-full gap-2"
                variant="outline"
              >
                <RotateCcw
                  className={`h-4 w-4 ${isRestarting ? "animate-spin" : ""}`}
                />
                {isRestarting ? "Redémarrage..." : "Redémarrer le Serveur"}
              </Button>
              <Button
                onClick={handleStopServerClick}
                disabled={isStopping}
                className="w-full gap-2"
                variant="outline"
              >
                <Power
                  className={`h-4 w-4 ${isStopping ? "animate-pulse" : ""}`}
                />
                {isStopping ? "Arrêt en cours..." : "Arrêter le Serveur"}
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Informations sur l'application</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>CONTROL PAD Client Web v1.2.2</p>
              <p>by Cédric PALADJIAN</p>
              <p>TypeScript - Node.js - VITE</p>
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
