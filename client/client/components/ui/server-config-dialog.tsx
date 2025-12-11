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
import { RotateCcw, Power, Server } from "lucide-react";

interface ServerConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pcServerConfig: PcServerConfig;
  onUpdatePcServerConfig: (config: PcServerConfig) => Promise<void>;
  onRestartPcServer: () => Promise<void>;
  onStopPcServer: () => Promise<void>;
}

export function ServerConfigDialog({
  open,
  onOpenChange,
  pcServerConfig,
  onUpdatePcServerConfig,
  onRestartPcServer,
  onStopPcServer,
}: ServerConfigDialogProps) {
  const [serverIp, setServerIp] = React.useState(pcServerConfig?.ip || "");
  const [serverPort, setServerPort] = React.useState(pcServerConfig?.port?.toString() || "8765");

  React.useEffect(() => {
    if (open) {
       setServerIp(pcServerConfig?.ip || "");
       setServerPort(pcServerConfig?.port?.toString() || "8765");
    }
  }, [open, pcServerConfig]);

  const handleSave = async () => {
        await onUpdatePcServerConfig({
            ip: serverIp,
            port: parseInt(serverPort) || 8765
        });
        onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              PC Server Configuration
            </DialogTitle>
            <DialogDescription>
              Configure connection to the Windows PC Server agent.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="serverIp" className="text-right">IP Address</Label>
                  <Input id="serverIp" value={serverIp} onChange={e => setServerIp(e.target.value)} className="col-span-3" placeholder="192.168.1.XX" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="serverPort" className="text-right">Port</Label>
                  <Input id="serverPort" value={serverPort} onChange={e => setServerPort(e.target.value)} className="col-span-3" placeholder="8765" />
                </div>
                <div className="space-y-2 mt-4 pt-4 border-t">
                   <h4 className="text-sm font-medium mb-2">Remote Actions</h4>
                   <Button onClick={onRestartPcServer} className="w-full gap-2" variant="outline">
                      <RotateCcw className="h-4 w-4" /> Restart PC Server
                   </Button>
                   <Button onClick={onStopPcServer} className="w-full gap-2" variant="outline">
                      <Power className="h-4 w-4" /> Stop PC Server
                   </Button>
                </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
