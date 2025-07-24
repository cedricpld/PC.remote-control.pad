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
import { ControlBlockConfig } from "@/types/stream-deck"; // NOUVEAU: Import du type générique ControlBlockConfig
import * as Icons from "lucide-react";
import { Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Utilisé pour le sélecteur de couleur


interface ActionButtonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: ControlBlockConfig; // NOUVEAU: Utilise ControlBlockConfig
  onSave: (config: ControlBlockConfig) => void; // NOUVEAU: Utilise ControlBlockConfig
  onDelete?: () => void;
}

// Sélection curée des options d'icônes
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

// Liste complète des couleurs
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

// Fonction d'aide pour générer un ID unique simple
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
  // NOUVEAU: Initialisation de formData pour inclure width, height, et les configs spécifiques
  const [formData, setFormData] = React.useState<Partial<ControlBlockConfig>>({
    label: "",
    icon: "Monitor",
    color: "#3b82f6",
    width: 1, // NOUVEAU: Largeur par défaut
    height: 1, // NOUVEAU: Hauteur par défaut
    actionType: "command",
    command: "",
    shortcut: "",
    yeelightConfig: { ip: "", action: "toggle" },
    sliderConfig: { apiEndpoint: "", min: 0, max: 100, initialValue: 50, unit: "" }, // NOUVEAU: Config slider par défaut
    statusDisplayConfig: { apiEndpoint: "", dataType: "cpu", updateIntervalMs: 2000, labelUnit: "" }, // NOUVEAU: Config status par défaut
  });

  React.useEffect(() => {
    if (config) {
      // Si un bloc existe, pré-remplir le formulaire avec sa configuration
      setFormData({
        ...config,
        // Assurer que les configs spécifiques sont toujours des objets pour éviter les erreurs
        yeelightConfig: config.yeelightConfig || { ip: "", action: "toggle" },
        sliderConfig: config.sliderConfig || { apiEndpoint: "", min: 0, max: 100, initialValue: 50, unit: "" },
        statusDisplayConfig: config.statusDisplayConfig || { apiEndpoint: "", dataType: "cpu", updateIntervalMs: 2000, labelUnit: "" },
      });
    } else {
      // Pour un nouveau bloc, réinitialiser à des valeurs par défaut
      setFormData({
        label: "",
        icon: "Monitor",
        color: "#3b82f6",
        width: 1,
        height: 1,
        actionType: "command",
        command: "",
        shortcut: "",
        yeelightConfig: { ip: "", action: "toggle" },
        sliderConfig: { apiEndpoint: "", min: 0, max: 100, initialValue: 50, unit: "" },
        statusDisplayConfig: { apiEndpoint: "", dataType: "cpu", updateIntervalMs: 2000, labelUnit: "" },
      });
    }
  }, [config]);

  const handleSave = () => {
    if (!formData.label) return; // Le libellé est obligatoire

    const newConfig: ControlBlockConfig = {
      id: config?.id || generateSimpleUniqueId(),
      label: formData.label!,
      icon: formData.icon,
      color: formData.color,
      width: formData.width,
      height: formData.height,
      actionType: formData.actionType!,

      command: formData.actionType === 'command' ? formData.command : undefined,
      shortcut: formData.actionType === 'shortcut' ? formData.shortcut : undefined,
      yeelightConfig: formData.actionType === 'yeelight' ? formData.yeelightConfig : undefined,
      sliderConfig: formData.actionType === 'slider' ? formData.sliderConfig : undefined, // NOUVEAU: Enregistre sliderConfig
      statusDisplayConfig: formData.actionType === 'statusDisplay' ? formData.statusDisplayConfig : undefined, // NOUVEAU: Enregistre statusDisplayConfig
    };

    onSave(newConfig); // Appelle la fonction de sauvegarde passée par les props
    onOpenChange(false); // Ferme le dialogue
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(); // Appelle la fonction de suppression passée par les props
      onOpenChange(false); // Ferme le dialogue
    }
  };

  // Trouver l'icône sélectionnée pour l'affichage dans le Select
  const selectedIcon = iconOptions.find((opt) => opt.value === formData.icon);
  // Options pour l'action Yeelight
  const yeelightActionOptions = [
    { value: "toggle", label: "Toggle (On/Off)" },
    { value: "on", label: "Turn On" },
    { value: "off", label: "Turn Off" },
  ];
  // Options pour le type de données de l'afficheur de statut
  const statusDataTypeOptions = [
    { value: "cpu", label: "Utilisation CPU" },
    { value: "ram", label: "Utilisation RAM" },
    { value: "disk", label: "Espace Disque" },
    { value: "network", label: "Activité Réseau" },
    { value: "custom", label: "Personnalisé" },
  ];

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

          {/* NOUVEAU: Champs Largeur et Hauteur */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="width" className="text-right">
              Largeur (unités)
            </Label>
            <Input
              id="width"
              type="number"
              value={formData.width}
              onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) || 1 })}
              className="col-span-3"
              placeholder="Ex: 1, 2, 3"
              min="1"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="height" className="text-right">
              Hauteur (unités)
            </Label>
            <Input
              id="height"
              type="number"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 1 })}
              className="col-span-3"
              placeholder="Ex: 1, 2"
              min="1"
            />
          </div>

          {/* Sélecteur de type d'action */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="actionType" className="text-right">
              Type d'Action
            </Label>
            <Select
              value={formData.actionType}
              onValueChange={(value: ControlBlockConfig['actionType']) =>
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
                <SelectItem value="slider">Slider (Volume, Lumière...)</SelectItem> {/* NOUVEAU */}
                <SelectItem value="statusDisplay">Afficheur de Statut (CPU, RAM...)</SelectItem> {/* NOUVEAU */}
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
                placeholder="Ex: start chrome.exe google.com"
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
                  onValueChange={(value: ControlBlockConfig['yeelightConfig']['action']) =>
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

          {/* NOUVEAU: Champs pour les sliders */}
          {formData.actionType === 'slider' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sliderApi" className="text-right">
                  Endpoint API
                </Label>
                <Input
                  id="sliderApi"
                  value={formData.sliderConfig?.apiEndpoint}
                  onChange={(e) => setFormData({ ...formData, sliderConfig: { ...formData.sliderConfig!, apiEndpoint: e.target.value } })}
                  className="col-span-3"
                  placeholder="Ex: /api/set-volume"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sliderMin" className="text-right">
                  Min. Value
                </Label>
                <Input
                  id="sliderMin"
                  type="number"
                  value={formData.sliderConfig?.min}
                  onChange={(e) => setFormData({ ...formData, sliderConfig: { ...formData.sliderConfig!, min: parseInt(e.target.value) } })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sliderMax" className="text-right">
                  Max. Value
                </Label>
                <Input
                  id="sliderMax"
                  type="number"
                  value={formData.sliderConfig?.max}
                  onChange={(e) => setFormData({ ...formData, sliderConfig: { ...formData.sliderConfig!, max: parseInt(e.target.value) } })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sliderInitial" className="text-right">
                  Initial Value
                </Label>
                <Input
                  id="sliderInitial"
                  type="number"
                  value={formData.sliderConfig?.initialValue}
                  onChange={(e) => setFormData({ ...formData, sliderConfig: { ...formData.sliderConfig!, initialValue: parseInt(e.target.value) } })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sliderUnit" className="text-right">
                  Unité
                </Label>
                <Input
                  id="sliderUnit"
                  value={formData.sliderConfig?.unit}
                  onChange={(e) => setFormData({ ...formData, sliderConfig: { ...formData.sliderConfig!, unit: e.target.value } })}
                  className="col-span-3"
                  placeholder="Ex: %"
                />
              </div>
            </>
          )}

          {/* NOUVEAU: Champs pour les afficheurs de statut */}
          {formData.actionType === 'statusDisplay' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="statusApi" className="text-right">
                  Endpoint API
                </Label>
                <Input
                  id="statusApi"
                  value={formData.statusDisplayConfig?.apiEndpoint}
                  onChange={(e) => setFormData({ ...formData, statusDisplayConfig: { ...formData.statusDisplayConfig!, apiEndpoint: e.target.value } })}
                  className="col-span-3"
                  placeholder="Ex: /api/get-cpu"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="statusDataType" className="text-right">
                  Type de Donnée
                </Label>
                <Select
                  value={formData.statusDisplayConfig?.dataType}
                  onValueChange={(value: ControlBlockConfig['statusDisplayConfig']['dataType']) =>
                    setFormData({ ...formData, statusDisplayConfig: { ...formData.statusDisplayConfig!, dataType: value } })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Sélectionner le type de donnée" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusDataTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="statusInterval" className="text-right">
                  Intervalle (ms)
                </Label>
                <Input
                  id="statusInterval"
                  type="number"
                  value={formData.statusDisplayConfig?.updateIntervalMs}
                  onChange={(e) => setFormData({ ...formData, statusDisplayConfig: { ...formData.statusDisplayConfig!, updateIntervalMs: parseInt(e.target.value) } })}
                  className="col-span-3"
                  placeholder="Ex: 2000 (2 secondes)"
                  min="500"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="statusUnit" className="text-right">
                  Unité
                </Label>
                <Input
                  id="statusUnit"
                  value={formData.statusDisplayConfig?.labelUnit}
                  onChange={(e) => setFormData({ ...formData, statusDisplayConfig: { ...formData.statusDisplayConfig!, labelUnit: e.target.value } })}
                  className="col-span-3"
                  placeholder="Ex: % ou GB"
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-0">
          {onDelete && (
            <Button
              variant="destructive"
              onClick={onDelete}
              className="w-full sm:w-auto"
            >
              Supprimer
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!formData.label}>
              {config ? "Update" : "Create"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}