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
import { Textarea } from "@/components/ui/textarea"; // <-- AJOUTEZ CETTE LIGNE
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionButtonConfig } from "@/types/stream-deck";
import * as Icons from "lucide-react";
import { Trash2 } from "lucide-react";

interface ActionButtonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: ActionButtonConfig;
  onSave: (config: ActionButtonConfig) => void;
  onDelete?: () => void;
}

const iconOptions = [
  { value: "Monitor", label: "Monitor", icon: Icons.Monitor },
  { value: "Gamepad2", label: "Gaming", icon: Icons.Gamepad2 },
  { value: "Volume2", label: "Volume", icon: Icons.Volume2 },
  { value: "Mic", label: "Microphone", icon: Icons.Mic },
  { value: "Camera", label: "Camera", icon: Icons.Camera },
  { value: "Lightbulb", label: "Light", icon: Icons.Lightbulb },
  { value: "Wifi", label: "WiFi", icon: Icons.Wifi },
  { value: "Settings", label: "Settings", icon: Icons.Settings },
  { value: "Play", label: "Play", icon: Icons.Play },
  { value: "Pause", label: "Pause", icon: Icons.Pause },
  { value: "Square", label: "Stop", icon: Icons.Square },
  { value: "SkipForward", label: "Next", icon: Icons.SkipForward },
  { value: "SkipBack", label: "Previous", icon: Icons.SkipBack },
  { value: "Home", label: "Home", icon: Icons.Home },
  { value: "Folder", label: "Folder", icon: Icons.Folder },
  { value: "Terminal", label: "Terminal", icon: Icons.Terminal },
  { value: "Laptop", label: "Laptop", icon: Icons.Laptop },
  { value: "Cloud", label: "Cloud", icon: Icons.Cloud },
  { value: "Download", label: "Download", icon: Icons.Download },
  { value: "Upload", label: "Upload", icon: Icons.Upload },
  { value: "Code", label: "Code", icon: Icons.Code },
  { value: "GitBranch", label: "Git Branch", icon: Icons.GitBranch },
  { value: "Zap", label: "Zap", icon: Icons.Zap },
  { value: "Coffee", label: "Coffee", icon: Icons.Coffee },
  { value: "Calendar", label: "Calendar", icon: Icons.Calendar },
  { value: "Mail", label: "Mail", icon: Icons.Mail },
  { value: "Briefcase", label: "Briefcase", icon: Icons.Briefcase },
  { value: "Heart", label: "Heart", icon: Icons.Heart },
  { value: "Star", label: "Star", icon: Icons.Star },
  { value: "MessageSquare", label: "Message", icon: Icons.MessageSquare },
  { value: "User", label: "User", icon: Icons.User },
  { value: "Key", label: "Key", icon: Icons.Key },
  { value: "Power", label: "Power", icon: Icons.Power },
];

const colorOptions = [
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#6b7280", label: "Gray" },
];

// Fonction d'aide pour générer un ID unique simple
// C'est une solution de secours si crypto.randomUUID n'est pas disponible
function generateSimpleUniqueId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function ActionButtonDialog({
  open,
  onOpenChange,
  config,
  onSave,
  onDelete,
}: ActionButtonDialogProps) {
  const [formData, setFormData] = React.useState<Partial<ActionButtonConfig>>({
    label: "",
    icon: "Monitor",
    color: "#3b82f6",
    command: "",
    shortcut: "",
  });

  React.useEffect(() => {
    if (config) {
      setFormData(config);
    } else {
      setFormData({
        label: "",
        icon: "Monitor",
        color: "#3b82f6",
        command: "",
        shortcut: "",
      });
    }
  }, [config]);

  const handleSave = () => {
    if (!formData.label) return;

    const newConfig: ActionButtonConfig = {
      id: config?.id || generateSimpleUniqueId(),
      label: formData.label!,
      icon: formData.icon,
      color: formData.color,
      command: formData.command,
      shortcut: formData.shortcut,
    };

    onSave(newConfig);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onOpenChange(false);
    }
  };

  const selectedIcon = iconOptions.find((opt) => opt.value === formData.icon);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{config ? "Edit Action" : "Add New Action"}</DialogTitle>
          <DialogDescription>
            Configure your action button with a label, icon, and command.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="label" className="text-right">
              Label
            </Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              className="col-span-3"
              placeholder="Action name"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="icon" className="text-right">
              Icon
            </Label>
            <Select
              value={formData.icon}
              onValueChange={(value) =>
                setFormData({ ...formData, icon: value })
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select an icon">
                  {selectedIcon && (
                    <div className="flex items-center gap-2">
                      <selectedIcon.icon className="h-4 w-4" />
                      {selectedIcon.label}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Color
            </Label>
            <Select
              value={formData.color}
              onValueChange={(value) =>
                setFormData({ ...formData, color: value })
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded border"
                      style={{ backgroundColor: formData.color }}
                    />
                    {
                      colorOptions.find((opt) => opt.value === formData.color)
                        ?.label
                    }
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded border"
                        style={{ backgroundColor: option.value }}
                      />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="shortcut" className="text-right">
              Shortcut
            </Label>
            <Input
              id="shortcut"
              value={formData.shortcut}
              onChange={(e) =>
                setFormData({ ...formData, shortcut: e.target.value })
              }
              className="col-span-3"
              placeholder="Ctrl+Shift+A"
            />
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="command" className="text-right mt-2">
              Command
            </Label>
            <Textarea
              id="command"
              value={formData.command}
              onChange={(e) =>
                setFormData({ ...formData, command: e.target.value })
              }
              className="col-span-3"
              placeholder="Enter command or URL to execute..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          {config && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={!formData.label}>
              {config ? "Update" : "Create"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}