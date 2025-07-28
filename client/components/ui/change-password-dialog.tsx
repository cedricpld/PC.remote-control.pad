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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export function ChangePasswordDialog({ open, onOpenChange, onChangePassword }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [isChanging, setIsChanging] = React.useState(false);

  const handleChangePassword = async () => {
    setIsChanging(true);
    try {
      await onChangePassword(currentPassword, newPassword);
      onOpenChange(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      console.error("Échec du changement de mot de passe :", error);
      alert("Échec du changement de mot de passe.");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Changer le mot de passe</DialogTitle>
          <DialogDescription>
            Entrez votre mot de passe actuel et le nouveau mot de passe.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="current-password" className="text-right">
              Mot de passe actuel
            </Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-password" className="text-right">
              Nouveau mot de passe
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleChangePassword} disabled={isChanging}>
            {isChanging ? "Changement en cours..." : "Changer le mot de passe"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
