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
}

export function SettingsDialog({
  open,
  onOpenChange,
}: SettingsDialogProps) {
  const [isRestarting, setIsRestarting] = React.useState(false);

  const handleRestartServer = async () => {
    setIsRestarting(true);
    try {
      // In a real application, this would call an API endpoint to restart the server
      // For demo purposes, we'll simulate a restart
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert("Server restart simulated (this would restart your PC remote service)");
    } catch (error) {
      console.error("Failed to restart server:", error);
      alert("Failed to restart server");
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
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure your Stream Deck application settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Server Management</h4>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Restart the remote control server if you're experiencing connection issues.
              </p>
              <Button
                onClick={handleRestartServer}
                disabled={isRestarting}
                className="w-full gap-2"
                variant="outline"
              >
                <RotateCcw className={`h-4 w-4 ${isRestarting ? 'animate-spin' : ''}`} />
                {isRestarting ? "Restarting..." : "Restart Server"}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Application Info</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Stream Deck Web Client v1.0.0</p>
              <p>Built with React + TypeScript</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
