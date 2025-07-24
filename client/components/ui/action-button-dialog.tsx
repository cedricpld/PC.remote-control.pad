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
import { Textarea } from "@/components/ui/textarea";
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
import { ScrollArea } from "@/components/ui/scroll-area"; // Garder l'importation si ScrollArea est utilisé ailleurs.
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


interface ActionButtonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: ActionButtonConfig;
  onSave: (config: ActionButtonConfig) => void;
  onDelete?: () => void;
}

// Sélection curée des options d'icônes (inchangée)
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
  { value: "Info", label: "Info", icon: Icons.Info },
  { value: "HelpCircle", label: "Help", icon: Icons.HelpCircle },
  { value: "AlertTriangle", label: "Warning", icon: Icons.AlertTriangle },
  { value: "Settings2", label: "Settings 2", icon: Icons.Settings2 },
  { value: "Bell", label: "Bell", icon: Icons.Bell },
  { value: "Smartphone", label: "Smartphone", icon: Icons.Smartphone },
  { value: "MonitorSpeaker", label: "Speaker", icon: Icons.MonitorSpeaker },
];

// Liste des couleurs (inchangée)
const colorOptions = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#ef4444", label: "Red" },
  { value: "#22c55e", label: "Green" },
  { value: "#f97316", label: "Orange" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#eab308", label: "Yellow" },
  { value: "#ec4899", label: "Pink" },
  { value: "#6b7280", label: "Gray" },
  { value: "#FFD700", label: "Gold" },
  { value: "#E0BBE4", label: "Light Purple" },
  { value: "#957DAD", label: "Medium Purple" },
  { value: "#D291BC", label: "Pinkish Purple" },
  { value: "#FFC72C", label: "Amber" },
  { value: "#FF6F61", label: "Coral" },
  { value: "#6B5B95", label: "Dark Purple" },
  { value: "#88B04B", label: "Olive Green" },
  { value: "#F7CAC9", label: "Light Pink" },
  { value: "#C83349", label: "Dark Red" },
  { value: "#5B5EA6", label: "Blue-Gray" },
  { value: "#343148", label: "Dark Slate" },
  { value: "#B0A8B9", label: "Lavender Gray" },
  { value: "#FF8C94", label: "Salmon" },
];

// Fonction d'aide pour générer un ID unique simple (inchangée)
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
    actionType: "command",
    command: "",
    shortcut: "",
    yeelightConfig: { ip: "", action: "toggle" },
  });

  React.useEffect(() => {
    if (config) {
      setFormData({
        ...config,
        yeelightConfig: config.yeelightConfig || { ip: "", action: "toggle" }
      });
    } else {
      setFormData({
        label: "",
        icon: "Monitor",
        color: "#3b82f6",
        actionType: "command",
        command: "",
        shortcut: "",
        yeelightConfig: { ip: "", action: "toggle" },
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
      actionType: formData.actionType!,

      command: formData.actionType === 'command' ? formData.command : undefined,
      shortcut: formData.actionType === 'shortcut' ? formData.shortcut : undefined,
      yeelightConfig: formData.actionType === 'yeelight' ? formData.yeelightConfig : undefined,
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
  const yeelightActionOptions = [
    { value: "toggle", label: "Toggle (On/Off)" },
    { value: "on", label: "Turn On" },
    { value: "off", label: "Turn Off" },
  ];
  const selectedYeelightAction = yeelightActionOptions.find(opt => opt.value === formData.yeelightConfig?.action);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{config ? "Modifier l'action" : "Ajouter une nouvelle action"}</DialogTitle>
          <DialogDescription>
            Configurez les détails de votre bouton d'action.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Champ Libellé */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="label" className="text-right">
              Libellé
            </Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              className="col-span-3"
              placeholder="Nom de l'action"
            />
          </div>

          {/* Champ Icône */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="icon" className="text-right">
              Icône
            </Label>
            <Select
              value={formData.icon}
              onValueChange={(value) =>
                setFormData({ ...formData, icon: value })
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner une icône">
                  {selectedIcon && (
                    <div className="flex items-center gap-2">
                      <selectedIcon.icon className="h-4 w-4" />
                      {selectedIcon.label}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {/* SUPPRIMÉ: <ScrollArea className="h-[200px]"> */}
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                {/* SUPPRIMÉ: </ScrollArea> */}
              </SelectContent>
            </Select>
          </div>

          {/* Champ Couleur */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Couleur
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

          {/* Sélecteur de type d'action */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="actionType" className="text-right">
              Type d'Action
            </Label>
            <Select
              value={formData.actionType}
              onValueChange={(value: ActionButtonConfig['actionType']) =>
                setFormData({ ...formData, actionType: value })
              }
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Sélectionner le type d'action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="command">Commande Système</SelectItem>
                <SelectItem value="shortcut">Raccourci Clavier</SelectItem>
                <SelectItem value="yeelight">Ampoule Yeelight</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Champs conditionnels selon le type d'action */}
          {formData.actionType === 'command' && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="command" className="text-right mt-2">
                Commande
              </Label>
              <Textarea
                id="command"
                value={formData.command}
                onChange={(e) =>
                  setFormData({ ...formData, command: e.target.value })
                }
                className="col-span-3"
                placeholder="Entrez la commande système ou l'URL à exécuter..."
                rows={3}
              />
            </div>
          )}

          {formData.actionType === 'shortcut' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shortcut" className="text-right">
                Raccourci
              </Label>
              <Input
                id="shortcut"
                value={formData.shortcut}
                onChange={(e) =>
                  setFormData({ ...formData, shortcut: e.target.value })
                }
                className="col-span-3"
                placeholder="Ex: Ctrl+Shift+A ou Alt+F4"
              />
            </div>
          )}

          {formData.actionType === 'yeelight' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="yeelightIp" className="text-right">
                  IP Ampoule
                </Label>
                <Input
                  id="yeelightIp"
                  value={formData.yeelightConfig?.ip}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      yeelightConfig: { ...formData.yeelightConfig!, ip: e.target.value },
                    })
                  }
                  className="col-span-3"
                  placeholder="Ex: 192.168.1.100"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="yeelightAction" className="text-right">
                  Action
                </Label>
                <Select
                  value={formData.yeelightConfig?.action}
                  onValueChange={(value: ActionButtonConfig['yeelightConfig']['action']) =>
                    setFormData({
                      ...formData,
                      yeelightConfig: { ...formData.yeelightConfig!, action: value },
                    })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner une action" />
                  </SelectTrigger>
                  <SelectContent>
                    {yeelightActionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        <DialogFooter className="flex justify-between">
          {config && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
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