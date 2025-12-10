import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PcServerConfig } from "@/types/stream-deck";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RotateCcw, Server, Power, KeyRound } from "lucide-react";
import { ChangePasswordDialog } from "./change-password-dialog";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestartServer: () => Promise<void>;
  onStopServer: () => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  pcServerConfig?: PcServerConfig;
  onUpdatePcServerConfig?: (config: PcServerConfig) => Promise<void>;
}

export function SettingsDialog({
  open,
  onOpenChange,
  onRestartServer,
  onStopServer,
  onChangePassword,
  pcServerConfig,
  onUpdatePcServerConfig,
}: SettingsDialogProps) {
  const [isRestarting, setIsRestarting] = React.useState(false);
  const [isStopping, setIsStopping] = React.useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);
  const [serverIp, setServerIp] = React.useState(pcServerConfig?.ip || "");
  const [serverPort, setServerPort] = React.useState(pcServerConfig?.port?.toString() || "8765");

  React.useEffect(() => {
    if (open) {
       setServerIp(pcServerConfig?.ip || "");
       setServerPort(pcServerConfig?.port?.toString() || "8765");
    }
  }, [open, pcServerConfig]);

  const handleSaveServerConfig = async () => {
      if (onUpdatePcServerConfig) {
        await onUpdatePcServerConfig({
            ip: serverIp,
            port: parseInt(serverPort) || 8765
        });
        alert("Configuration sauvegardée.");
      }
  };

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

  const handleStopServerClick = async () => {
    setIsStopping(true);
    try {
      await onStopServer();
    } catch (error) {
      console.error("Échec de l'arrêt du serveur :", error);
      alert("Échec de l'arrêt du serveur.");
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <>
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
              <h4 className="text-sm font-medium">Connexion PC Serveur</h4>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="serverIp" className="text-right">IP</Label>
                <Input id="serverIp" value={serverIp} onChange={e => setServerIp(e.target.value)} className="col-span-3" placeholder="192.168.1.XX" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="serverPort" className="text-right">Port</Label>
                <Input id="serverPort" value={serverPort} onChange={e => setServerPort(e.target.value)} className="col-span-3" placeholder="8765" />
              </div>
              <Button onClick={handleSaveServerConfig} size="sm" className="w-full">Sauvegarder la connexion</Button>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Gestion du Client (Raspberry)</h4>
              <div className="space-y-2">
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
              <h4 className="text-sm font-medium">Sécurité</h4>
              <div className="space-y-2">
                <Button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <KeyRound className="h-4 w-4" />
                  Changer le mot de passe
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Informations sur l'application</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>CONTROL PAD Client Web v1.2.3</p>
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
      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
        onChangePassword={onChangePassword}
      />
    </>
  );
}
