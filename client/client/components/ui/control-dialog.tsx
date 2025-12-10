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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ControlBlockConfig, YeelightConfig, AudioConfig } from "@/types/stream-deck";
import * as Icons from "lucide-react";
import { Trash2 } from "lucide-react";

// Listes d'options
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
  { value: "Cpu", label: "CPU", icon: Icons.Cpu },
  { value: "MemoryStick", label: "RAM", icon: Icons.MemoryStick },
  { value: "Power", label: "Power", icon: Icons.Power },
];

const colorOptions = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#ef4444", label: "Red" },
  { value: "#22c55e", label: "Green" },
  { value: "#f97316", label: "Orange" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#eab308", label: "Yellow" },
  { value: "#ec4899", label: "Pink" },
  { value: "#6b7280", label: "Gray" },
  { value: "#fcfcfc", label: "White" },
];

const DEFAULT_FORM_DATA: Partial<ControlBlockConfig> = {
  label: "",
  icon: "Monitor",
  color: "#3b82f6",
  actionType: "command",
  target: "client",
  command: "",
  shortcut: "",
  yeelightConfig: { ip: "", action: "toggle", controlType: "button", color: "#ffffff" },
  sliderConfig: { apiEndpoint: "", min: 0, max: 100, initialValue: 50, unit: "" },
  statusDisplayConfig: { apiEndpoint: "", dataType: "cpu", updateIntervalMs: 2000, labelUnit: "" },
  audioConfig: { action: "stopAll" },
  wolConfig: { mac: "", method: "network" }
};

interface ControlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: ControlBlockConfig;
  onSave: (config: ControlBlockConfig) => void;
  onDelete?: () => void;
}

function generateSimpleUniqueId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function ControlDialog({ open, onOpenChange, config, onSave, onDelete }: ControlDialogProps) {
  const [formData, setFormData] = React.useState<Partial<ControlBlockConfig>>(DEFAULT_FORM_DATA);

  React.useEffect(() => {
    if (open) {
      if (config) {
        setFormData({ ...DEFAULT_FORM_DATA, ...config });
      } else {
        setFormData(DEFAULT_FORM_DATA);
      }
    }
  }, [config, open]);

  React.useEffect(() => {
    if (formData.actionType === 'yeelight' && formData.yeelightConfig?.controlType) {
      let newSliderConfig = { ...DEFAULT_FORM_DATA.sliderConfig! };
      switch (formData.yeelightConfig.controlType) {
        case 'brightness_slider':
          newSliderConfig = { ...newSliderConfig, min: 1, max: 100, initialValue: 50, unit: '%' };
          break;
        case 'color_temperature_slider':
          newSliderConfig = { ...newSliderConfig, min: 1700, max: 6500, initialValue: 4000, unit: 'K' };
          break;
        case 'hue_slider':
          newSliderConfig = { ...newSliderConfig, min: 0, max: 359, initialValue: 180, unit: '°' };
          break;
      }
      setFormData(prev => ({ ...prev, sliderConfig: newSliderConfig }));
    }
  }, [formData.actionType, formData.yeelightConfig?.controlType]);

  const handleSave = () => {
    if (!formData.label) return;
    let width = 1, height = 1;
    switch (formData.actionType) {
      case 'slider':
        width = 3;
        height = 1;
        break;
      case 'statusDisplay':
        width = 3;
        height = 1;
        break;
      default:
        width = formData.yeelightConfig?.controlType === 'slider' ? 3 : 1;
        height = 1;
        break;
    }
    const newConfig: ControlBlockConfig = {
      id: config?.id || generateSimpleUniqueId(),
      label: formData.label!,
      icon: formData.icon,
      color: formData.color,
      width: width,
      height: height,
      actionType: formData.actionType!,
      target: formData.target,
      command: formData.actionType === 'command' ? formData.command : undefined,
      shortcut: formData.actionType === 'shortcut' ? formData.shortcut : undefined,
      yeelightConfig: formData.actionType === 'yeelight' ? formData.yeelightConfig : undefined,
      sliderConfig: (formData.actionType === 'slider' || (formData.actionType === 'yeelight' && formData.yeelightConfig?.controlType?.includes('slider'))) ? formData.sliderConfig : undefined,
      statusDisplayConfig: formData.actionType === 'statusDisplay' ? formData.statusDisplayConfig : undefined,
      audioConfig: formData.actionType === 'audio' ? formData.audioConfig : undefined,
      wolConfig: formData.actionType === 'wol' ? formData.wolConfig : undefined,
    };
    onSave(newConfig);
    onOpenChange(false);
  };

  const selectedIcon = iconOptions.find(opt => opt.value === formData.icon);
  const actionTypeLabel = {
    command: "Commande",
    shortcut: "Raccourci",
    yeelight: "Yeelight",
    slider: "Slider",
    statusDisplay: "Afficheur Statut",
    audio: "Audio",
    wol: "Wake On LAN"
  }[formData.actionType || "command"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{config ? "Modifier le bloc" : "Ajouter un bloc"}</DialogTitle>
          <DialogDescription>Configurez les détails de votre bloc d'action.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="label" className="text-right">Libellé</Label>
            <Input id="label" value={formData.label || ""} onChange={e => setFormData({ ...formData, label: e.target.value })} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="icon" className="text-right">Icône</Label>
            <Select value={formData.icon} onValueChange={value => setFormData({ ...formData, icon: value })}>
              <SelectTrigger className="col-span-3">
                {selectedIcon && <div className="flex items-center gap-2"><selectedIcon.icon className="h-4 w-4" />{selectedIcon.label}</div>}
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map(o => <SelectItem key={o.value} value={o.value}><div className="flex items-center gap-2"><o.icon className="h-4 w-4" />{o.label}</div></SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">Couleur</Label>
            <Select value={formData.color} onValueChange={value => setFormData({ ...formData, color: value })}>
              <SelectTrigger className="col-span-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border" style={{ backgroundColor: formData.color }} />
                  {colorOptions.find(c => c.value === formData.color)?.label}
                </div>
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map(o => <SelectItem key={o.value} value={o.value}><div className="flex items-center gap-2"><div className="h-4 w-4 rounded border" style={{ backgroundColor: o.value }} />{o.label}</div></SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="actionType" className="text-right">Type</Label>
            <Select value={formData.actionType} onValueChange={(value: ControlBlockConfig['actionType']) => setFormData({ ...formData, actionType: value })}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Choisir un type">{actionTypeLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="command">Commande</SelectItem>
                <SelectItem value="shortcut">Raccourci</SelectItem>
                <SelectItem value="yeelight">Yeelight</SelectItem>
                <SelectItem value="slider">Slider</SelectItem>
                <SelectItem value="statusDisplay">Afficheur Statut</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="wol">Wake On LAN</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.actionType === 'command' || formData.actionType === 'audio') && (
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="target" className="text-right">Exécuter sur</Label>
                <div className="col-span-3 flex items-center gap-2">
                   <span className={formData.target === 'client' ? "font-bold text-primary" : "text-muted-foreground"}>Raspberry (Client)</span>
                   <Switch
                       checked={formData.target === 'server'}
                       onCheckedChange={(checked) => setFormData({ ...formData, target: checked ? 'server' : 'client' })}
                   />
                   <span className={formData.target === 'server' ? "font-bold text-primary" : "text-muted-foreground"}>PC (Serveur)</span>
                </div>
             </div>
          )}

          {formData.actionType === 'command' && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="command" className="text-right mt-2">Commande</Label>
              <Textarea id="command" value={formData.command || ""} onChange={e => setFormData({ ...formData, command: e.target.value })} className="col-span-3" rows={3} />
            </div>
          )}

          {formData.actionType === 'wol' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="wolMac" className="text-right">Adresse MAC</Label>
                <Input id="wolMac" value={formData.wolConfig?.mac || ""} onChange={e => setFormData({ ...formData, wolConfig: { ...formData.wolConfig!, mac: e.target.value }})} className="col-span-3" placeholder="AA:BB:CC:DD:EE:FF" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="wolMethod" className="text-right">Méthode</Label>
                <Select value={formData.wolConfig?.method || "network"} onValueChange={(value: any) => setFormData({ ...formData, wolConfig: { ...formData.wolConfig!, method: value }})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Choisir une méthode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="network">Réseau (WiFi/Broadcast)</SelectItem>
                    <SelectItem value="etherwake">Ethernet (Etherwake)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {formData.actionType === 'shortcut' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shortcut" className="text-right">Raccourci</Label>
              <Input id="shortcut" value={formData.shortcut || ""} onChange={e => setFormData({ ...formData, shortcut: e.target.value })} className="col-span-3" />
            </div>
          )}

          {formData.actionType === 'yeelight' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="yeelightIp" className="text-right">IP Ampoule</Label>
                <Input id="yeelightIp" value={formData.yeelightConfig?.ip || ""} onChange={e => setFormData({ ...formData, yeelightConfig: { ...formData.yeelightConfig!, ip: e.target.value }})} className="col-span-3" />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="yeelightMainType" className="text-right">Type</Label>
                <Select value={formData.yeelightConfig?.controlType?.includes('slider') ? 'slider' : 'button'} onValueChange={(value) => {
                  const newControlType = (value === 'slider' ? 'brightness_slider' : 'button') as YeelightConfig['controlType'];
                  setFormData({ ...formData, yeelightConfig: { ...formData.yeelightConfig!, controlType: newControlType }});
                }}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Choisir un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="button">Bouton</SelectItem>
                    <SelectItem value="slider">Slider</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.yeelightConfig?.controlType?.includes('slider') ? (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="yeelightSliderType" className="text-right">Action Slider</Label>
                  <Select value={formData.yeelightConfig?.controlType} onValueChange={(value) => setFormData({ ...formData, yeelightConfig: { ...formData.yeelightConfig!, controlType: value as YeelightConfig['controlType'] }})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Choisir un type de slider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brightness_slider">Luminosité</SelectItem>
                      <SelectItem value="color_temperature_slider">Température</SelectItem>
                      <SelectItem value="hue_slider">Teinte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="yeelightButtonType" className="text-right">Action Bouton</Label>
                  <Select value={formData.yeelightConfig?.controlType} onValueChange={(value) => setFormData({ ...formData, yeelightConfig: { ...formData.yeelightConfig!, controlType: value as YeelightConfig['controlType'] }})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Choisir une action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="button">Toggle/On/Off</SelectItem>
                      <SelectItem value="color_picker">Définir une couleur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.yeelightConfig?.controlType === 'button' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="yeelightAction" className="text-right">Action</Label>
                  <Select value={formData.yeelightConfig?.action} onValueChange={(value) => setFormData({ ...formData, yeelightConfig: { ...formData.yeelightConfig!, action: value as YeelightConfig['action'] }})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Choisir une action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="toggle">Toggle</SelectItem>
                      <SelectItem value="on">On</SelectItem>
                      <SelectItem value="off">Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.yeelightConfig?.controlType === 'color_picker' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="yeelightColor" className="text-right">Couleur</Label>
                  <Input id="yeelightColor" type="color" value={formData.yeelightConfig?.color || "#ffffff"} onChange={e => setFormData({ ...formData, yeelightConfig: { ...formData.yeelightConfig!, color: e.target.value }})} className="col-span-3" />
                </div>
              )}
            </>
          )}

          {formData.actionType === 'audio' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="audioAction" className="text-right">Action</Label>
              <Select value={formData.audioConfig?.action} onValueChange={(value) => setFormData({ ...formData, audioConfig: { ...formData.audioConfig!, action: value as AudioConfig['action'] }})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Choisir une action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stopAll">Stop All Sounds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.actionType === 'slider' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sliderApi" className="text-right">Endpoint API</Label>
                <Input id="sliderApi" value={formData.sliderConfig?.apiEndpoint || ""} onChange={e => setFormData({ ...formData, sliderConfig: { ...formData.sliderConfig!, apiEndpoint: e.target.value }})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sliderMin" className="text-right">Min</Label>
                <Input id="sliderMin" type="number" value={formData.sliderConfig?.min || 0} onChange={e => setFormData({ ...formData, sliderConfig: { ...formData.sliderConfig!, min: parseInt(e.target.value) || 0 }})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sliderMax" className="text-right">Max</Label>
                <Input id="sliderMax" type="number" value={formData.sliderConfig?.max || 100} onChange={e => setFormData({ ...formData, sliderConfig: { ...formData.sliderConfig!, max: parseInt(e.target.value) || 100 }})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sliderUnit" className="text-right">Unité</Label>
                <Input id="sliderUnit" value={formData.sliderConfig?.unit || ""} onChange={e => setFormData({ ...formData, sliderConfig: { ...formData.sliderConfig!, unit: e.target.value }})} className="col-span-3" />
              </div>
            </>
          )}

          {formData.actionType === 'statusDisplay' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="statusApi" className="text-right">Endpoint API</Label>
                <Input id="statusApi" value={formData.statusDisplayConfig?.apiEndpoint || ""} onChange={e => setFormData({ ...formData, statusDisplayConfig: { ...formData.statusDisplayConfig!, apiEndpoint: e.target.value }})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="statusUnit" className="text-right">Unité</Label>
                <Input id="statusUnit" value={formData.statusDisplayConfig?.labelUnit || ""} onChange={e => setFormData({ ...formData, statusDisplayConfig: { ...formData.statusDisplayConfig!, labelUnit: e.target.value }})} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="statusInterval" className="text-right">Intervalle (ms)</Label>
                <Input id="statusInterval" type="number" value={formData.statusDisplayConfig?.updateIntervalMs || 2000} onChange={e => setFormData({ ...formData, statusDisplayConfig: { ...formData.statusDisplayConfig!, updateIntervalMs: parseInt(e.target.value) || 2000 }})} className="col-span-3" />
              </div>
            </>
          )}
        </div>
        <DialogFooter className="flex justify-between w-full pt-4">
          <div>
            {onDelete && config && <Button variant="destructive" size="sm" onClick={onDelete} className="mr-auto"><Trash2 className="h-4 w-4 mr-2" />Supprimer</Button>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={!formData.label}>Sauvegarder</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
