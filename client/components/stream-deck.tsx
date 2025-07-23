import * as React from "react";
import { ActionButton, ActionButtonConfig } from "@/components/ui/action-button";
import { AddButton } from "@/components/ui/add-button";
import { ActionButtonDialog } from "@/components/ui/action-button-dialog";
import { Button } from "@/components/ui/button";
import { Settings, Edit3, Eye, Mic, Camera, Gamepad2, Volume2, Monitor, Headphones } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface StreamDeckProps {
  className?: string;
}

export function StreamDeck({ className }: StreamDeckProps) {
  const [buttons, setButtons] = React.useState<ActionButtonConfig[]>([]);
  const [isEditing, setIsEditing] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingButton, setEditingButton] = React.useState<ActionButtonConfig | undefined>();

  // Load buttons from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("streamdeck-buttons");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setButtons(parsed);
      } catch (error) {
        console.error("Failed to load buttons:", error);
      }
    } else {
      // Add demo buttons for first-time users
      const demoButtons: ActionButtonConfig[] = [
        {
          id: "demo-1",
          label: "Mute Mic",
          icon: Icons.Mic,
          color: "#ef4444",
          command: "toggle-microphone",
          shortcut: "F4",
        },
        {
          id: "demo-2",
          label: "Start Stream",
          icon: Icons.Camera,
          color: "#8b5cf6",
          command: "obs-start-stream",
          shortcut: "F5",
        },
        {
          id: "demo-3",
          label: "Gaming Mode",
          icon: Icons.Gamepad2,
          color: "#22c55e",
          command: "enable-gaming-mode",
          shortcut: "F6",
        },
        {
          id: "demo-4",
          label: "Volume Up",
          icon: Icons.Volume2,
          color: "#3b82f6",
          command: "volume-up",
        },
        {
          id: "demo-5",
          label: "Open OBS",
          icon: Icons.Monitor,
          color: "#f97316",
          command: "start obs64.exe",
        },
        {
          id: "demo-6",
          label: "Discord",
          icon: Icons.Headphones,
          color: "#8b5cf6",
          command: "start discord.exe",
        },
      ];
      setButtons(demoButtons);
    }
  }, []);

  // Save buttons to localStorage when they change
  React.useEffect(() => {
    localStorage.setItem("streamdeck-buttons", JSON.stringify(buttons));
  }, [buttons]);

  const handleAddButton = () => {
    setEditingButton(undefined);
    setDialogOpen(true);
  };

  const handleEditButton = (config: ActionButtonConfig) => {
    setEditingButton(config);
    setDialogOpen(true);
  };

  const handleSaveButton = (config: ActionButtonConfig) => {
    if (editingButton) {
      // Update existing button
      setButtons(prev => prev.map(btn => btn.id === config.id ? config : btn));
    } else {
      // Add new button
      setButtons(prev => [...prev, config]);
    }
  };

  const handleDeleteButton = () => {
    if (editingButton) {
      setButtons(prev => prev.filter(btn => btn.id !== editingButton.id));
    }
  };

  const handleExecuteAction = (config: ActionButtonConfig) => {
    if (config.command) {
      // In a real app, this would send the command to your PC via WebSocket, API, etc.
      console.log("Executing command:", config.command);
      // For demo purposes, show a notification
      alert(`Executing: ${config.command}`);
    }
  };

  // Calculate grid dimensions based on button count and screen size
  const [screenSize, setScreenSize] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  React.useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize('mobile');
      else if (width < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const getGridDimensions = () => {
    const buttonCount = buttons.length + (isEditing ? 1 : 0);

    switch (screenSize) {
      case 'mobile':
        return { cols: Math.min(3, Math.max(2, Math.ceil(Math.sqrt(buttonCount)))), maxCols: 3 };
      case 'tablet':
        return { cols: Math.min(4, Math.max(3, Math.ceil(Math.sqrt(buttonCount * 0.8)))), maxCols: 4 };
      default:
        return { cols: Math.min(6, Math.max(4, Math.ceil(Math.sqrt(buttonCount * 0.7)))), maxCols: 6 };
    }
  };

  const { cols, maxCols } = getGridDimensions();
  const totalSlots = Math.max(cols * 3, buttons.length + (isEditing ? 1 : 0)); // Minimum 3 rows

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-border/50 gap-4 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Stream Deck</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Remote control your PC with customizable action buttons
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2 text-xs sm:text-sm"
          >
            {isEditing ? (
              <>
                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">View Mode</span>
                <span className="sm:hidden">View</span>
              </>
            ) : (
              <>
                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Edit Mode</span>
                <span className="sm:hidden">Edit</span>
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </div>

      {/* Button Grid */}
      <div className="flex-1 p-3 sm:p-6 overflow-auto">
        <div
          className="grid gap-2 sm:gap-4 justify-center"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            maxWidth: screenSize === 'mobile'
              ? `${cols * 80}px`  // Smaller buttons on mobile
              : screenSize === 'tablet'
              ? `${cols * 96}px`  // Medium buttons on tablet
              : `${cols * 112}px`, // Full size on desktop
            margin: "0 auto",
          }}
        >
          {buttons.map((config) => (
            <ActionButton
              key={config.id}
              config={config}
              isEditing={isEditing}
              onEdit={() => handleEditButton(config)}
              onExecute={() => handleExecuteAction(config)}
            />
          ))}
          
          {isEditing && (
            <AddButton onClick={handleAddButton} />
          )}
          
          {/* Fill remaining grid slots for visual consistency */}
          {Array.from({ length: Math.max(0, totalSlots - buttons.length - (isEditing ? 1 : 0)) }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 w-24" />
          ))}
        </div>

        {/* Empty state */}
        {buttons.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-lg font-medium">No actions configured</p>
              <p className="text-sm">Add your first action button to get started</p>
            </div>
            <Button onClick={handleAddButton} className="mt-4">
              Add First Action
            </Button>
          </div>
        )}
      </div>

      {/* Action Dialog */}
      <ActionButtonDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={editingButton}
        onSave={handleSaveButton}
        onDelete={editingButton ? handleDeleteButton : undefined}
      />
    </div>
  );
}
