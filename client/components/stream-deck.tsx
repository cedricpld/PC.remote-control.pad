import * as React from "react";
// Supprimez l'importation de ActionButton car ControlRenderer va la gérer
// import { ActionButton } from "@/components/ui/action-button";
import { AddButton } from "@/components/ui/add-button";
import { ActionButtonDialog } from "@/components/ui/action-button-dialog";
import { PageTabs } from "@/components/ui/page-tabs";
import { PageDialog } from "@/components/ui/page-dialog";
import { SettingsDialog } from "@/components/ui/settings-dialog";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Edit3,
  Eye,
  Mic,
  Camera,
  Gamepad2,
  Volume2,
  Monitor,
  Headphones,
  Lightbulb, // Garder Lightbulb pour les icônes par défaut
  Cpu, // NOUVEAU: Import pour l'icône CPU
  MemoryStick // NOUVEAU: Import pour l'icône MemoryStick (RAM)
} from "lucide-react"; // Assurez-vous que toutes les icônes utilisées dans createDefaultPages sont importées
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { StreamDeckPage, ControlBlockConfig } from "@/types/stream-deck"; // NOUVEAU: Import de ControlBlockConfig
import { ControlRenderer } from "@/client/components/ui/control-renderer"; // NOUVEAU: Import du ControlRenderer


interface StreamDeckProps {
  className?: string;
}

export function StreamDeck({ className }: StreamDeckProps) {
  const [pages, setPages] = React.useState<StreamDeckPage[]>([]);
  const [currentPageId, setCurrentPageId] = React.useState<string>("");
  const [isEditing, setIsEditing] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [pageDialogOpen, setPageDialogOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [editingButton, setEditingButton] = React.useState<
    ControlBlockConfig | undefined
  >(); // NOUVEAU: Utilise ControlBlockConfig
  const [editingPage, setEditingPage] = React.useState<
    StreamDeckPage | undefined
  >();
  const [draggedButton, setDraggedButton] = React.useState<string | null>(null);
  const [draggedPage, setDraggedPage] = React.useState<string | null>(null);

  const clickSound = React.useMemo(() => {
    try {
      const audio = new Audio('/click.mp3');
      audio.volume = 0.2;
      return audio;
    } catch (e) {
      console.warn("Impossible de créer l'objet Audio :", e);
      return null;
    }
  }, []);


  const currentPage = pages.find((page) => page.id === currentPageId);
  const blocks = currentPage?.blocks || []; // NOUVEAU: 'blocks' au lieu de 'buttons'

  // Charge les pages depuis le serveur au montage du composant
  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch("/api/config");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: StreamDeckPage[] = await response.json();
        if (data.length > 0) {
          setPages(data);
          setCurrentPageId(data[0].id); // Utilisez data[0].id car 'parsed' n'est plus pertinent ici
        } else {
          createDefaultPages();
        }
      } catch (error) {
        console.error("Échec du chargement de la configuration depuis le serveur :", error);
        createDefaultPages();
      }
    };
    loadConfig();
  }, [createDefaultPages]); // Ajout de createDefaultPages aux dépendances pour éviter un avertissement


  // Sauvegarde les pages sur le serveur quand elles changent
  const saveConfigToServer = React.useCallback(async (currentPages: StreamDeckPage[]) => {
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentPages),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log("Configuration sauvegardée sur le serveur.");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (error: any) {
      console.error("Échec de la sauvegarde de la configuration sur le serveur :", error);
    }
  }, []);

  // Définit des pages par défaut si aucune n'est trouvée
  const createDefaultPages = React.useCallback(() => {
    const defaultPages: StreamDeckPage[] = [
      {
        id: "main",
        name: "Principal",
        color: "#3b82f6",
        icon: "Home",
        blocks: [ // NOUVEAU: 'blocks' au lieu de 'buttons'
          {
            id: "cmd-mic",
            label: "Couper Micro",
            icon: "Mic",
            color: "#ef4444",
            width: 1, height: 1, // Taille par défaut
            actionType: "command",
            command: "nircmd.exe mutesysvolume 2",
          },
          {
            id: "cmd-obs",
            label: "Lancer OBS",
            icon: "Camera",
            color: "#8b5cf6",
            width: 1, height: 1,
            actionType: "command",
            command: "start obs64.exe",
          },
          {
            id: "sh-game",
            label: "Mode Jeu",
            icon: "Gamepad2",
            color: "#22c55e",
            width: 1, height: 1,
            actionType: "shortcut",
            shortcut: "F6",
          },
          // NOUVEAU BOUTON : Contrôle Ampoule Yeelight avec IP configurable
          {
            id: "yl-toggle",
            label: "Ampoule Salon",
            icon: "Lightbulb",
            color: "#FFD700",
            width: 1, height: 1,
            actionType: "yeelight",
            yeelightConfig: {
              ip: "192.168.1.XXX", // REMPLACEZ CETTE IP PAR CELLE DE VOTRE AMPOULE !
              action: "toggle",
            },
          },
          // NOUVEAU BLOC : Slider de volume
          {
            id: "slider-volume",
            label: "Volume PC",
            icon: "Volume2",
            color: "#3b82f6",
            width: 2, height: 1, // Prend 2 colonnes, 1 ligne
            actionType: "slider",
            sliderConfig: {
              apiEndpoint: "/api/set-master-volume", // NOUVEAU API à créer
              min: 0,
              max: 65535, // Volume max pour NirCmd (valeur brute)
              initialValue: 32767, // ~50%
              unit: "", // L'unité sera gérée par le composant
            },
          },
          // NOUVEAU BLOC : Afficheur CPU
          {
            id: "status-cpu",
            label: "CPU Usage",
            icon: "Cpu",
            color: "#ef4444",
            width: 1, height: 1,
            actionType: "statusDisplay",
            statusDisplayConfig: {
              apiEndpoint: "/api/get-cpu-usage", // NOUVEAU API à créer
              dataType: "cpu",
              updateIntervalMs: 2000, // Mise à jour toutes les 2s
              labelUnit: "%",
            },
          },
        ],
      },
      {
        id: "media",
        name: "Média",
        color: "#f97316",
        icon: "Monitor",
        blocks: [ // NOUVEAU: 'blocks' au lieu de 'buttons'
          {
            id: "cmd-vol+",
            label: "Volume +",
            icon: "Volume2",
            color: "#3b82f6",
            width: 1, height: 1,
            actionType: "command",
            command: "nircmd.exe changesysvolume 1000",
          },
          {
            id: "cmd-vlc",
            label: "VLC",
            icon: "Monitor",
            color: "#f97316",
            width: 1, height: 1,
            actionType: "command",
            command: "start vlc.exe",
          },
          {
            id: "cmd-discord",
            label: "Discord",
            icon: "Headphones",
            color: "#8b5cf6",
            width: 1, height: 1,
            actionType: "command",
            command: "start discord.exe",
          },
          // NOUVEAU BLOC: Afficheur RAM
          {
            id: "status-ram",
            label: "RAM Usage",
            icon: "MemoryStick",
            color: "#22c55e",
            width: 1, height: 1,
            actionType: "statusDisplay",
            statusDisplayConfig: {
              apiEndpoint: "/api/get-ram-usage", // NOUVEAU API à créer
              dataType: "ram",
              updateIntervalMs: 3000,
              labelUnit: "GB",
            },
          },
        ],
      },
    ];
    setPages(defaultPages);
    setCurrentPageId(defaultPages[0].id);
    saveConfigToServer(defaultPages);
  }, [saveConfigToServer]);


  React.useEffect(() => {
    if (pages.length > 0) {
      saveConfigToServer(pages);
    }
  }, [pages, saveConfigToServer]);


  const handleAddButton = () => { // Renommer `Button` en `Block` est plus précis maintenant
    setEditingButton(undefined);
    setDialogOpen(true);
  };

  const handleEditButton = (config: ControlBlockConfig) => { // NOUVEAU: Utilise ControlBlockConfig
    setEditingButton(config);
    setDialogOpen(true);
  };

  const handleSaveButton = (config: ControlBlockConfig) => { // NOUVEAU: Utilise ControlBlockConfig
    setPages((prev) => {
      const newPages = prev.map((page) => {
        if (page.id === currentPageId) {
          if (editingButton) {
            return {
              ...page,
              blocks: page.blocks.map((btn) => // NOUVEAU: 'blocks' au lieu de 'buttons'
                btn.id === config.id ? config : btn,
              ),
            };
          } else {
            return {
              ...page,
              blocks: [...page.blocks, config], // NOUVEAU: 'blocks'
            };
          }
        }
        return page;
      });
      return newPages;
    });
    setDialogOpen(false);
  };

  const handleDeleteButton = () => { // Renommer `Button` en `Block` est plus précis
    if (editingButton) {
      setPages((prev) => {
        const newPages = prev.map((page) => {
          if (page.id === currentPageId) {
            return {
              ...page,
              blocks: page.blocks.filter( // NOUVEAU: 'blocks' au lieu de 'buttons'
                (btn) => btn.id !== editingButton.id,
              ),
            };
          }
          return page;
        });
        return newPages;
      });
      setDialogOpen(false);
    }
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
        return prev.map((page) => (page.id === pageData.id ? pageData : page));
      } else {
        const newPages = [...prev, pageData];
        setCurrentPageId(pageData.id);
        return newPages;
      }
    });
    setPageDialogOpen(false);
  };

  const handleDeletePage = () => {
    if (editingPage && pages.length > 1) {
      setPages((prev) => {
        const newPages = prev.filter((page) => page.id !== editingPage.id);
        if (currentPageId === editingPage.id) {
                  // eslint-disable-next-line @typescript-eslint/no-shadow
          setCurrentPageId(newPages[0].id);
        }
        return newPages;
      });
      setPageDialogOpen(false);
    }
  };

  // NOUVEAU: Gestionnaires de glisser-déposer pour les blocs
  const handleBlockDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedButton(blockId); // Réutilise l'état draggedButton
    e.dataTransfer.effectAllowed = "move";
  };

  const handleBlockDragEnd = () => {
    setDraggedButton(null);
  };

  const handleBlockDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleBlockDrop = (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    if (!draggedButton || draggedButton === targetBlockId) return;

    setPages((prev) => {
      const newPages = prev.map((page) => {
        if (page.id === currentPageId) {
          const blocks = [...page.blocks]; // NOUVEAU: 'blocks'
          const draggedIndex = blocks.findIndex(
            (block) => block.id === draggedButton,
          );
          const targetIndex = blocks.findIndex(
            (block) => block.id === targetBlockId,
          );

          if (draggedIndex !== -1 && targetIndex !== -1) {
            const [draggedItem] = blocks.splice(draggedIndex, 1);
            blocks.splice(targetIndex, 0, draggedItem);
          }
          return { ...page, blocks };
        }
        return page;
      });
      return newPages;
    });
    setDraggedButton(null);
  };

  const handlePageReorder = (sourceId: string, targetId: string) => {
    setPages((prev) => {
      const pages = [...prev];
      const sourceIndex = pages.findIndex((page) => page.id === sourceId);
      const targetIndex = pages.findIndex((page) => page.id === targetId);

      if (sourceIndex !== -1 && targetIndex !== -1) {
        const [draggedPage] = pages.splice(sourceIndex, 1);
        pages.splice(targetIndex, 0, draggedPage);
      }
      return pages;
    });
  };

  // MODIFICATION ICI: Gérer les différents types d'action
  const handleExecuteAction = async (config: ControlBlockConfig) => { // NOUVEAU: Utilise ControlBlockConfig
    if (clickSound) clickSound.play(); // Joue le son au début de l'action

    let apiUrl = '';
    let body: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

    switch (config.actionType) {
      case 'command':
        if (!config.command) {
          alert("Commande système non configurée.");
          return;
        }
        apiUrl = "/api/execute-action";
        body = { command: config.command };
        break;
      case 'shortcut':
        if (!config.shortcut) {
          alert("Raccourci clavier non configuré.");
          return;
        }
        apiUrl = "/api/execute-action";
        body = { shortcut: config.shortcut };
        break;
      case 'yeelight':
        if (!config.yeelightConfig?.ip || !config.yeelightConfig?.action) {
          alert("Configuration Ampoule Yeelight incomplète (IP ou action manquante).");
          return;
        }
        apiUrl = "/api/yeelight-toggle"; // Point d'API pour Yeelight
        body = { ip: config.yeelightConfig.ip, action: config.yeelightConfig.action };
        break;
      case 'slider': // NOUVEAU: Les sliders ne déclenchent pas cette fonction au clic
        console.log(`Le bloc slider a été cliqué. L'action est gérée par le composant Slider.`);
        return;
      case 'statusDisplay': // NOUVEAU: Les afficheurs de statut ne sont pas "exécutables"
        console.log(`Le bloc afficheur de statut a été cliqué. Pas d'action directe au clic.`);
        return;
      default:
        alert("Type d'action non reconnu.");
        return;
    }

    // Effectuer la requête API pour les types d'action qui en ont besoin
    if (apiUrl) {
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Erreur serveur :", data.error);
          alert(`Erreur d'exécution (${config.actionType}) : ${data.error}. ${data.details || ''} ${data.stderr || ''}`);
        } else {
          console.log("Action exécutée :", data.message);
        }
      } catch (error: any) {
        console.error("Erreur réseau ou client :", error);
        alert(`Impossible de se connecter au serveur ou erreur client : ${error.message}`);
      }
    }
  };

  // NOUVEAU: Gérer spécifiquement le changement de valeur d'un slider
  const handleSliderValueChange = React.useCallback(async (config: ControlBlockConfig, value: number) => {
    if (clickSound) clickSound.play(); // Joue le son

    if (!config.sliderConfig?.apiEndpoint) {
      console.error(`Slider sans endpoint API configuré: ${config.label}`);
      alert(`Erreur : Endpoint API du slider non configuré pour ${config.label}.`);
      return;
    }

    try {
      const response = await fetch(config.sliderConfig.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: value }), // Envoie la valeur du slider
      });
      const data = await response.json();
      if (!response.ok) {
        console.error(`Erreur serveur slider (${config.label}):`, data.error);
        alert(`Erreur slider (${config.label}) : ${data.error}`);
      } else {
        console.log(`Slider ${config.label} mis à jour : ${value}`);
      }
    } catch (error: any) {
      console.error(`Erreur réseau slider (${config.label}):`, error);
      alert(`Erreur réseau slider (${config.label}) : ${error.message}`);
    }
  }, [clickSound]);


  const handleRestartServer = async () => {
    if (clickSound) clickSound.play(); // Joue le son au début

    try {
      const response = await fetch("/api/restart-server", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("Échec du redémarrage du serveur :", data.error);
        alert(`Échec du redémarrage du serveur : ${data.error}`);
      } else {
        console.log("Redémarrage serveur :", data.message);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (error: any) {
      console.error("Erreur lors du redémarrage du serveur :", error);
      alert(`Impossible de se connecter au serveur pour le redémarrage : ${error.message}`);
    }
  };


  const [screenSize, setScreenSize] = React.useState<
    "mobile" | "tablet" | "desktop"
  >("desktop");

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

  // MODIFIÉ: Ajustement des dimensions de la grille pour le layout en grille CSS
  const getGridDimensions = () => {
    const maxColsPerScreen = {
      mobile: 3,
      tablet: 4,
      desktop: 6
    };
    const currentMaxCols = maxColsPerScreen[screenSize];
    return {
      cols: currentMaxCols,
      maxCols: currentMaxCols,
    };
  };

  const { cols, maxCols } = getGridDimensions();
  // totalSlots n'est plus pertinent avec le layout CSS Grid span


  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-border/50 gap-4 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">CONTROL PAD</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Contrôlez votre PC à distance avec des blocs d'action personnalisables
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
                <span className="hidden sm:inline">Mode Affichage</span>
                <span className="sm:hidden">Voir</span>
              </>
            ) : (
              <>
                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Mode Édition</span>
                <span className="sm:hidden">Éditer</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs sm:text-sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Paramètres</span>
          </Button>
        </div>
      </div>

      {/* Page Navigation */}
      <PageTabs
        pages={pages}
        currentPageId={currentPageId}
        onPageChange={setCurrentPageId}
        onAddPage={handleAddPage}
        onEditPage={handleEditPage}
        onDeletePage={(pageId) => {
          if (pages.length > 1) {
            setPages((prev) => {
              const newPages = prev.filter((page) => page.id !== pageId);
              if (currentPageId === pageId) {
                setCurrentPageId(newPages[0].id);
              }
              return newPages;
            });
          }
        }}
        onReorderPages={handlePageReorder}
        isEditing={isEditing}
      />

      {/* Grille des blocs */}
      <div className="flex-1 p-3 sm:p-6 overflow-auto">
        {isEditing && (
          <div className="text-center text-sm text-muted-foreground mb-4 p-2 bg-primary/10 rounded-lg border border-primary/20">
            🎛️ Mode Édition Actif - Faites glisser pour réorganiser les blocs, cliquez sur les blocs pour les modifier.
          </div>
        )}
        <div
          className="grid gap-2 sm:gap-4 justify-center"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            maxWidth:
              screenSize === "mobile"
                ? `${cols * 80}px`
                : screenSize === "tablet"
                  ? `${cols * 96}px`
                  : `${cols * 112}px`,
            margin: "0 auto",
          }}
        >
          {blocks.map((config) => ( // NOUVEAU: map sur 'blocks'
            <ControlRenderer
              key={config.id}
              config={config}
              onExecute={() => handleExecuteAction(config)} // Pour les boutons (command/shortcut/yeelight)
              onSliderValueChange={handleSliderValueChange} // Pour les sliders
              // NOUVEAU: Passage des props isEditing pour le mode édition
              isEditing={isEditing} // Passe le mode d'édition au ControlRenderer
              onEdit={() => handleEditButton(config)} // Pour l'édition au clic du bloc
              // Handlers de drag-drop passés au ControlRenderer
              onDragStart={(e) => handleBlockDragStart(e, config.id)}
              onDragEnd={handleBlockDragEnd}
              onDragOver={handleBlockDragOver}
              onDrop={(e) => handleBlockDrop(e, config.id)}
            />
          ))}

          {isEditing && <AddButton onClick={handleAddButton} />}

        </div>

        {/* Empty state */}
        {blocks.length === 0 && ( // NOUVEAU: 'blocks.length'
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-lg font-medium">Aucun bloc configuré</p>
              <p className="text-sm">
                Ajoutez votre premier bloc d'action ou d'affichage pour commencer
              </p>
            </div>
            <Button onClick={handleAddButton} className="mt-4">
              Ajouter un premier bloc
            </Button>
          </div>
        )}
      </div>

      {/* Action Dialog (maintenant pour ControlBlockConfig) */}
      <ActionButtonDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={editingButton}
        onSave={handleSaveButton}
        onDelete={editingButton ? handleDeleteButton : undefined}
      />

      {/* Page Dialog */}
      <PageDialog
        open={pageDialogOpen}
        onOpenChange={setPageDialogOpen}
        page={editingPage}
        onSave={handleSavePage}
        onDelete={editingPage ? handleDeletePage : undefined}
      />

      {/* Settings Dialog */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} onRestartServer={handleRestartServer} />
    </div>
  );
}