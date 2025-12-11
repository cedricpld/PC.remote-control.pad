import * as React from "react";
import { Settings, Edit3, Eye, Cpu, MemoryStick, Volume2, Lightbulb, Mic, Camera, Gamepad2, Monitor, Headphones, Server, Power, Maximize, Minimize } from "lucide-react";
import { cn } from "@/lib/utils";
import { StreamDeckPage, ControlBlockConfig, PcServerConfig } from "@/types/stream-deck";
import { Button } from "@/components/ui/button";
import { PageTabs } from "@/components/ui/page-tabs";
import { PageDialog } from "@/components/ui/page-dialog";
import { SettingsDialog } from "@/components/ui/settings-dialog";
import { AddButton } from "@/components/ui/add-button";
import { ControlRenderer } from "@/components/ui/control-renderer";
import { ControlDialog } from "@/components/ui/control-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ServerConfigDialog } from "@/components/ui/server-config-dialog";

interface StreamDeckProps {
  className?: string;
}

const fetchWithAuth = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = sessionStorage.getItem('control-pad-auth-token');
  const headers = new Headers(init?.headers);
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  return fetch(input, {
    ...init,
    headers,
  });
};

export function StreamDeck({ className }: StreamDeckProps) {
  const [pages, setPages] = React.useState<StreamDeckPage[]>([]);
  const [currentPageId, setCurrentPageId] = React.useState<string>("");
  const [isEditing, setIsEditing] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [pageDialogOpen, setPageDialogOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [serverConfigOpen, setServerConfigOpen] = React.useState(false);
  const [editingControl, setEditingControl] = React.useState<ControlBlockConfig | undefined>();
  const [editingPage, setEditingPage] = React.useState<StreamDeckPage | undefined>();
  const [draggedControl, setDraggedControl] = React.useState<string | null>(null);
  const [serverStatus, setServerStatus] = React.useState<'online' | 'offline'>('offline');
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [pcServerConfig, setPcServerConfig] = React.useState<PcServerConfig>({ ip: "localhost", port: 8765 });

  // Safety guard for UI blocking bug
  React.useEffect(() => {
    const interval = setInterval(() => {
        if (document.body.style.pointerEvents === 'none') {
            document.body.style.pointerEvents = '';
        }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const res = await fetchWithAuth('/api/server-status');
        if (res.ok) {
           const data = await res.json();
           setServerStatus(data.status);
        } else {
           setServerStatus('offline');
        }
      } catch {
        setServerStatus('offline');
      }
    };
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const clickSound = React.useMemo(() => {
    try {
      const audio = new Audio('/button.wav');
      audio.volume = 0.2;
      return audio;
    } catch (e) {
      console.warn("Impossible de créer l'objet Audio :", e);
      return null;
    }
  }, []);

  const currentPage = pages.find((page) => page.id === currentPageId);
  const blocks = currentPage?.blocks || [];

  const saveConfigToServer = React.useCallback(async (currentPages: StreamDeckPage[]) => {
    try {
      const response = await fetchWithAuth("/api/config");
      const currentConfig = await response.json();

      const updatedConfig = {
        ...currentConfig,
        pages: currentPages
      };

      const saveResponse = await fetchWithAuth("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedConfig),
      });

      if (!saveResponse.ok) throw new Error(`HTTP error! status: ${saveResponse.status}`);
      console.log("Config saved to server.");
    } catch (error: any) {
      console.error("Save failed:", error);
    }
  }, []);


  const createDefaultPages = React.useCallback(() => {
    const defaultPages: StreamDeckPage[] = [
      {
        id: "main", name: "Principal", color: "#3b82f6", icon: "Home",
        blocks: [
          { id: "cmd-mic", label: "Couper Micro", icon: "Mic", color: "#ef4444", width: 1, height: 1, actionType: "command", command: "nircmd.exe mutesysvolume 2" },
          { id: "slider-volume", label: "Volume PC", icon: "Volume2", color: "#3b82f6", width: 3, height: 1, actionType: "slider", sliderConfig: { apiEndpoint: "/api/set-master-volume", min: 0, max: 65535, initialValue: 32767, unit: "%" } },
          { id: "status-cpu", label: "CPU", icon: "Cpu", color: "#ef4444", width: 2, height: 1, actionType: "statusDisplay", statusDisplayConfig: { apiEndpoint: "/api/get-cpu-usage", dataType: "cpu", updateIntervalMs: 2000, labelUnit: "%" } },
          { id: "status-ram", label: "RAM", icon: "MemoryStick", color: "#22c55e", width: 2, height: 1, actionType: "statusDisplay", statusDisplayConfig: { apiEndpoint: "/api/get-ram-usage", dataType: "ram", updateIntervalMs: 3000, labelUnit: "%" } },
        ],
      },
    ];
    setPages(defaultPages);
    if (defaultPages.length > 0) setCurrentPageId(defaultPages[0].id);
    saveConfigToServer(defaultPages);
  }, [saveConfigToServer]);

  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetchWithAuth("/api/config");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Configuration reçue du serveur:", data); // Ajoutez ce log pour vérifier les données reçues

        if (data && data.pcServer) {
            setPcServerConfig(data.pcServer);
        }

        if (data && data.pages && data.pages.length > 0) {
          const migratedData = data.pages.map((page: any) => {
            const newBlocks = (page.blocks || page.buttons || []).map((block: any) => {
              if (!block.actionType) {
                if (block.shortcut) {
                  return { ...block, actionType: 'shortcut' };
                }
                return { ...block, actionType: 'command' };
              }
              return block;
            });
            return { ...page, blocks: newBlocks, buttons: undefined };
          });
          setPages(migratedData);
          setCurrentPageId(migratedData[0].id);
        } else {
          createDefaultPages();
        }
      } catch (error) {
        console.error("Échec du chargement de la config, création par défaut:", error);
        createDefaultPages();
      }
    };
    loadConfig();
  }, [createDefaultPages]);


  // **CORRECTION APPLIQUÉE ICI**
  // Ce `useEffect` est maintenant plus simple et plus fiable pour la sauvegarde.
  // Ref pour suivre si c'est le premier chargement, afin d'éviter une sauvegarde inutile
  const isInitialMount = React.useRef(true);

  React.useEffect(() => {
    // On ne sauvegarde pas au tout premier rendu (qui est souvent un état vide)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Pour toute modification ultérieure du tableau `pages`, on sauvegarde.
    // Cela inclut l'ajout, la suppression, la modification de pages ou de blocs.
    saveConfigToServer(pages);
  }, [pages, saveConfigToServer]);

  const handleAddControl = () => {
    setEditingControl(undefined);
    setDialogOpen(true);
  };

  const handleEditControl = (config: ControlBlockConfig) => {
    setEditingControl(config);
    setDialogOpen(true);
  };

  const handleSaveControl = (config: ControlBlockConfig) => {
    if (config.actionType === 'slider' || config.actionType === 'statusDisplay' ||
        (config.actionType === 'yeelight' && config.yeelightConfig?.controlType?.includes('slider'))) {
      config.width = 3;
      config.height = 1;
    } else {
      config.width = 1;
      config.height = 1;
    }

    setPages((prev) =>
      prev.map((page) => {
        if (page.id === currentPageId) {
          const blocks = page.blocks || [];
          if (editingControl) {
            return { ...page, blocks: blocks.map((ctrl) => ctrl.id === config.id ? config : ctrl) };
          } else {
            return { ...page, blocks: [...blocks, config] };
          }
        }
        return page;
      })
    );
    // setDialogOpen(false); // Handled by Dialog onSave
  };

  const handleDeleteControl = () => {
    if (!editingControl) return;
    setPages(prev => prev.map(page => {
      if (page.id === currentPageId) {
        return { ...page, blocks: (page.blocks || []).filter(b => b.id !== editingControl.id) };
      }
      return page;
    }));
    // setDialogOpen(false); // Handled by Dialog onDelete
  };

  const handleAddPage = () => {
    setEditingPage(undefined);
    setPageDialogOpen(true);
  };

  const handleEditPage = (page: StreamDeckPage) => {
    setEditingPage(page);
    setPageDialogOpen(true);
  };

  const handleSavePage = (pageData: StreamDeckPage) => {
    setPages((prev) => {
      if (editingPage) {
        return prev.map((page) => (page.id === pageData.id ? { ...page, ...pageData } : page));
      } else {
        const newPages = [...prev, pageData];
        setCurrentPageId(pageData.id);
        return newPages;
      }
    });
    // setPageDialogOpen(false); // Handled by Dialog onSave
  };

  const handleDeletePage = (pageId: string) => {
    if (pages.length > 1) {
      setPages((prev) => {
        const newPages = prev.filter((page) => page.id !== pageId);
        if (currentPageId === pageId) {
          setCurrentPageId(newPages[0].id);
        }
        return newPages;
      });
    }
  };

  const handleControlDragStart = (e: React.DragEvent, controlId: string) => {
    setDraggedControl(controlId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleControlDragEnd = () => {
    setDraggedControl(null);
  };

  const handleControlDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleControlDrop = (e: React.DragEvent, targetControlId: string) => {
    e.preventDefault();
    if (!draggedControl || draggedControl === targetControlId) return;
    setPages((prev) =>
      prev.map((page) => {
        if (page.id === currentPageId) {
          const controls = [...page.blocks];
          const draggedIndex = controls.findIndex((ctrl) => ctrl.id === draggedControl);
          const targetIndex = controls.findIndex((ctrl) => ctrl.id === targetControlId);
          if (draggedIndex > -1 && targetIndex > -1) {
            const [draggedItem] = controls.splice(draggedIndex, 1);
            controls.splice(targetIndex, 0, draggedItem);
          }
          return { ...page, blocks: controls };
        }
        return page;
      })
    );
    setDraggedControl(null);
  };

  const handlePageReorder = (sourceId: string, targetId: string) => {
    setPages((prev) => {
      const newPages = [...prev];
      const sourceIndex = newPages.findIndex((p) => p.id === sourceId);
      const targetIndex = newPages.findIndex((p) => p.id === targetId);
      if (sourceIndex > -1 && targetIndex > -1) {
        const [removed] = newPages.splice(sourceIndex, 1);
        newPages.splice(targetIndex, 0, removed);
      }
      return newPages;
    });
  };

  const handleExecuteAction = async (config: ControlBlockConfig) => {
    if (clickSound) clickSound.play();
    let apiUrl = '';
    let body: any = {};
    switch (config.actionType) {
      case 'command':
        if (!config.command) return alert("Command not configured.");
        apiUrl = "/api/execute-action";
        body = { command: config.command };
        break;
      case 'shortcut':
        if (!config.shortcut) return alert("Shortcut not configured.");
        apiUrl = "/api/execute-action";
        body = { shortcut: config.shortcut };
        break;
      case 'yeelight':
        if (!config.yeelightConfig?.ip) return alert("Yeelight IP not configured.");
        switch (config.yeelightConfig.controlType) {
          case 'button':
            apiUrl = "/api/yeelight-toggle";
            body = { action: config.yeelightConfig.action, yeelightIp: config.yeelightConfig.ip };
            break;
          case 'color_picker':
            apiUrl = "/api/yeelight-color";
            body = { color: config.yeelightConfig.color, yeelightIp: config.yeelightConfig.ip };
            break;
        }
        break;
      case 'audio':
        if (config.audioConfig?.action === 'stopAll') {
          apiUrl = "/api/execute-action";
          body = { command: "STOP_ALL_AUDIO" };
        }
        break;
      case 'wol':
        apiUrl = "/api/execute-action";
        body = { command: "WOL", wolConfig: config.wolConfig };
        break;
      default:
        return;
    }
    if (!apiUrl) return;

    // Add target to body
    if (config.target) {
        body.target = config.target;
    }

    try {
      const response = await fetchWithAuth(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur serveur');
    } catch (error: any) {
      console.error("Execution error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleSliderValueChange = React.useCallback(async (config: ControlBlockConfig, value: number) => {
    let apiUrl = '';
    let body: any = {};

    if (config.actionType === 'slider') {
      if (!config.sliderConfig?.apiEndpoint) return console.error("Endpoint API du slider non configuré.");
      apiUrl = config.sliderConfig.apiEndpoint;
      body = { value };
    } else if (config.actionType === 'yeelight') {
      if (!config.yeelightConfig?.ip) return;
      switch (config.yeelightConfig.controlType) {
        case 'brightness_slider':
          apiUrl = '/api/yeelight-brightness';
          body = { brightness: value, yeelightIp: config.yeelightConfig.ip };
          break;
        case 'color_temperature_slider':
          apiUrl = '/api/yeelight-color-temp';
          body = { colorTemp: value, yeelightIp: config.yeelightConfig.ip };
          break;
        case 'hue_slider':
          apiUrl = '/api/yeelight-hue';
          body = { hue: value, yeelightIp: config.yeelightConfig.ip };
          break;
      }
    }

    if (!apiUrl) return;

    if (config.target) {
        body.target = config.target;
    }

    try {
      const response = await fetchWithAuth(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erreur serveur');
    } catch (error: any) {
      console.error(`Slider network error (${config.label}):`, error);
      alert(`Slider error (${config.label}) : ${error.message}`);
    }
  }, []);

  const handleRestartClient = async () => {
    if (clickSound) clickSound.play();
    try {
      const response = await fetch("/api/restart-server", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Server error');
      alert("Client is restarting...");
    } catch (error: any) {
      console.error("Restart error:", error);
      alert(`Restart failed : ${error.message}`);
    }
  };

  const handleStopClient = async () => {
    if (clickSound) clickSound.play();
    try {
      const response = await fetch("/api/stop-server", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Server error');
      alert("Client is stopping...");
    } catch (error: any) {
      console.error("Stop error:", error);
      alert(`Stop failed : ${error.message}`);
    }
  };

  const handleRestartPcServer = async () => {
      try {
          if (!confirm("Are you sure you want to restart the PC Server?")) return;
          const res = await fetchWithAuth("/api/restart-pc-server", { method: "POST" });
          if (!res.ok) throw new Error("Error");
          alert("Restart command sent to PC.");
      } catch (e: any) { alert("Error: " + e.message); }
  };

  const handleStopPcServer = async () => {
      try {
          if (!confirm("Are you sure you want to stop the PC Server?")) return;
          const res = await fetchWithAuth("/api/stop-pc-server", { method: "POST" });
          if (!res.ok) throw new Error("Error");
          alert("Stop command sent to PC.");
      } catch (e: any) { alert("Error: " + e.message); }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await fetchWithAuth('/api/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur du serveur :", errorData.error);
        throw new Error(errorData.error || 'Échec de la mise à jour du mot de passe');
      }

      const data = await response.json();
      console.log("Réponse du serveur :", data.message);
      return data;
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe :", error);
      throw error;
    }
  };

  const handleUpdateServerConfig = async (newConfig: PcServerConfig) => {
    try {
      const response = await fetchWithAuth("/api/config");
      const currentConfig = await response.json();
      const updatedConfig = { ...currentConfig, pcServer: newConfig };
      const saveRes = await fetchWithAuth("/api/config", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(updatedConfig)
      });
      if (!saveRes.ok) throw new Error("Save failed");
      setPcServerConfig(newConfig);
    } catch (e) {
      console.error(e);
      alert("Error saving PC Server config");
    }
  };



  const [screenSize, setScreenSize] = React.useState<"mobile" | "tablet" | "desktop">("desktop");
  React.useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize("mobile");
      else if (width < 1024) setScreenSize("tablet");
      else setScreenSize("desktop");
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const cols = { mobile: 3, tablet: 4, desktop: 6 }[screenSize];

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-border/50 gap-4 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">HOME CONTROL PAD</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Server Status Indicator */}
          <Popover>
            <PopoverTrigger asChild>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary/50 rounded-md border border-border/50 cursor-pointer hover:bg-secondary/80 transition-colors" title="Server Status">
                   <div className={cn("h-2.5 w-2.5 rounded-full", serverStatus === 'online' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500")} />
                   <span className="text-xs font-medium hidden sm:inline">{serverStatus === 'online' ? "Server Online" : "Server Offline"}</span>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-56">
                 <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">PC Server</h4>
                        <p className="text-sm text-muted-foreground">{serverStatus === 'online' ? 'Connected' : 'Disconnected'}</p>
                    </div>
                    <div className="grid gap-2">
                        <Button variant="outline" size="sm" onClick={handleRestartPcServer}>Restart</Button>
                        <Button variant="outline" size="sm" onClick={handleStopPcServer}>Stop</Button>
                        <Button variant="default" size="sm" onClick={() => setServerConfigOpen(true)}>Configuration</Button>
                    </div>
                 </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8 ml-1" title="Fullscreen">
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>

          <Button variant={isEditing ? "default" : "outline"} size="sm" onClick={() => setIsEditing(!isEditing)} className="gap-2 text-xs sm:text-sm">
            {isEditing ? <><Eye className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">View Mode</span><span className="sm:hidden">View</span></> : <><Edit3 className="h-3 w-3 sm:h-4 sm:w-4" /> <span className="hidden sm:inline">Edit Mode</span><span className="sm:hidden">Edit</span></>}
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </div>
      <PageTabs
        pages={pages}
        currentPageId={currentPageId}
        onPageChange={setCurrentPageId}
        onAddPage={handleAddPage}
        onEditPage={handleEditPage}
        onDeletePage={handleDeletePage}
        onReorderPages={handlePageReorder}
        isEditing={isEditing}
      />
      <div className="flex-1 p-3 sm:p-6 overflow-auto">
        {isEditing && (
          <div className="text-center text-sm text-muted-foreground mb-4 p-2 bg-primary/10 rounded-lg border border-primary/20">
            🎛️ Edit Mode Active - Drag to reorder, click to edit.
          </div>
        )}
        <div
          className="grid gap-2 sm:gap-4 justify-center"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            maxWidth: screenSize === "mobile" ? `${cols * 90}px` : screenSize === "tablet" ? `${cols * 106}px` : `${cols * 122}px`,
            margin: "0 auto",
          }}
        >
          {blocks.map((config) => (
            <ControlRenderer
              key={config.id}
              config={config}
              onExecute={handleExecuteAction}
              onSliderValueChange={handleSliderValueChange}
              isEditing={isEditing}
              isDisabled={!isEditing && config.target === 'server' && serverStatus === 'offline'}
              onEdit={() => handleEditControl(config)}
              onDragStart={handleControlDragStart}
              onDragEnd={handleControlDragEnd}
              onDragOver={handleControlDragOver}
              onDrop={handleControlDrop}
            />
          ))}
          {isEditing && <AddButton onClick={handleAddControl} />}
        </div>
        {blocks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-lg font-medium">No actions configured</p>
              <p className="text-sm">Switch to Edit Mode to add a block</p>
            </div>
          </div>
        )}
      </div>
      <ControlDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={editingControl}
        onSave={handleSaveControl}
        onDelete={editingControl ? handleDeleteControl : undefined}
      />
      <PageDialog
        open={pageDialogOpen}
        onOpenChange={setPageDialogOpen}
        page={editingPage}
        onSave={handleSavePage}
        onDelete={editingPage ? () => handleDeletePage(editingPage.id) : undefined}
      />
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onRestartClient={handleRestartClient}
        onStopClient={handleStopClient}
        onChangePassword={handleChangePassword}
      />
      <ServerConfigDialog
        open={serverConfigOpen}
        onOpenChange={setServerConfigOpen}
        pcServerConfig={pcServerConfig}
        onUpdatePcServerConfig={handleUpdateServerConfig}
        onRestartPcServer={handleRestartPcServer}
        onStopPcServer={handleStopPcServer}
      />
    </div>
  );
}
