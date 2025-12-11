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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StreamDeckPage } from "@/types/stream-deck";
import * as Icons from "lucide-react";
import { Trash2 } from "lucide-react";

interface PageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page?: StreamDeckPage;
  onSave: (page: StreamDeckPage) => void;
  onDelete?: () => void;
}

const iconOptions = [
  { value: "Home", label: "Home", icon: Icons.Home },
  { value: "Gamepad2", label: "Gaming", icon: Icons.Gamepad2 },
  { value: "Monitor", label: "Streaming", icon: Icons.Monitor },
  { value: "Settings", label: "Settings", icon: Icons.Settings },
  { value: "Mic", label: "Audio", icon: Icons.Mic },
  { value: "Camera", label: "Video", icon: Icons.Camera },
  { value: "Lightbulb", label: "Lighting", icon: Icons.Lightbulb },
  { value: "Wifi", label: "Network", icon: Icons.Wifi },
  { value: "Terminal", label: "System", icon: Icons.Terminal },
  { value: "Folder", label: "Files", icon: Icons.Folder },
  { value: "Music", label: "Media", icon: Icons.Music },
  { value: "Zap", label: "Quick Actions", icon: Icons.Zap },
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

export function PageDialog({
  open,
  onOpenChange,
  page,
  onSave,
  onDelete,
}: PageDialogProps) {
  const [formData, setFormData] = React.useState<Partial<StreamDeckPage>>({
    name: "",
    color: "#3b82f6",
    icon: "Home",
  });

  React.useEffect(() => {
    if (page) {
      setFormData(page);
    } else {
      setFormData({
        name: "",
        color: "#3b82f6",
        icon: "Home",
      });
    }
  }, [page]);

  React.useEffect(() => {
    if (!open) {
      // Force cleanup of pointer-events lock
      setTimeout(() => { document.body.style.pointerEvents = ""; }, 100);
    }
  }, [open]);

  const handleSave = () => {
    if (!formData.name) return;

    const newPage: StreamDeckPage = {
      id: page?.id || generateSimpleUniqueId(), // Utilise la fonction de secours
      name: formData.name!,
      color: formData.color,
      icon: formData.icon,
      blocks: page?.blocks || [],
    };

    onSave(newPage);
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
          <DialogTitle>{page ? "Edit Page" : "Create New Page"}</DialogTitle>
          <DialogDescription>
            Configure your page with a name, icon, and color theme.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="col-span-3"
              placeholder="Page name"
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
        </div>
        <DialogFooter className="flex justify-between">
          {page && onDelete && (
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
            <Button onClick={handleSave} disabled={!formData.name}>
              {page ? "Update" : "Create"}
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