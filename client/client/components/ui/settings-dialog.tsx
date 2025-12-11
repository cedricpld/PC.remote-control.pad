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
import { RotateCcw, Power, KeyRound, Settings } from "lucide-react";
import { ChangePasswordDialog } from "./change-password-dialog";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestartClient: () => Promise<void>;
  onStopClient: () => Promise<void>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export function SettingsDialog({
  open,
  onOpenChange,
  onRestartClient,
  onStopClient,
  onChangePassword,
}: SettingsDialogProps) {
  const [isRestarting, setIsRestarting] = React.useState(false);
  const [isStopping, setIsStopping] = React.useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = React.useState(false);

  const handleRestartClientClick = async () => {
    setIsRestarting(true);
    try {
      await onRestartClient();
    } catch (error) {
      console.error("Failed to restart client:", error);
      alert("Failed to restart client.");
    } finally {
      setIsRestarting(false);
    }
  };

  const handleStopClientClick = async () => {
    setIsStopping(true);
    try {
      await onStopClient();
    } catch (error) {
      console.error("Failed to stop client:", error);
      alert("Failed to stop client.");
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
              <Settings className="h-5 w-5" />
              Settings
            </DialogTitle>
            <DialogDescription>
              Configure the Control Pad Client.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Client Management</h4>
              <div className="space-y-2">
                <Button
                  onClick={handleRestartClientClick}
                  disabled={isRestarting}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <RotateCcw
                    className={`h-4 w-4 ${isRestarting ? "animate-spin" : ""}`}
                  />
                  {isRestarting ? "Restarting..." : "Restart Client"}
                </Button>
                <Button
                  onClick={handleStopClientClick}
                  disabled={isStopping}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Power
                    className={`h-4 w-4 ${isStopping ? "animate-pulse" : ""}`}
                  />
                  {isStopping ? "Stopping..." : "Stop Client"}
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Security</h4>
              <div className="space-y-2">
                <Button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <KeyRound className="h-4 w-4" />
                  Change Password
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-medium">About</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>HOME CONTROL PAD Client Web v1.3.0</p>
                <p>by Cédric PALADJIAN</p>
                <p>TypeScript - Node.js - VITE</p>
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
      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
        onChangePassword={onChangePassword}
      />
    </>
  );
}
