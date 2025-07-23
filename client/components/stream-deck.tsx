import * as React from "react";
import { ActionButton } from "@/components/ui/action-button";
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
} from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { StreamDeckPage, ActionButtonConfig } from "@/types/stream-deck";

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
    ActionButtonConfig | undefined
  >();
  const [editingPage, setEditingPage] = React.useState<
    StreamDeckPage | undefined
  >();
  const [draggedButton, setDraggedButton] = React.useState<string | null>(null);
  const [draggedPage, setDraggedPage] = React.useState<string | null>(null);

  const currentPage = pages.find((page) => page.id === currentPageId);
  const buttons = currentPage?.buttons || [];

  // NOUVEAU: Charger les pages depuis le serveur au montage du composant
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
          setCurrentPageId(data[0].id);
        } else {
          createDefaultPages(); // Crée des pages par défaut si le serveur renvoie vide
        }
      } catch (error) {
        console.error("Échec du chargement de la configuration depuis le serveur :", error);
        createDefaultPages(); // Utilise les pages par défaut en cas d'erreur
      }
    };
    loadConfig();
  }, []);

  // NOUVEAU: Sauvegarder les pages sur le serveur quand elles changent
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
    } catch (error) {
      console.error("Échec de la sauvegarde de la configuration sur le serveur :", error);
    }
  }, []);

  // Définit des pages par défaut si aucune n'est trouvée (utilisé au premier lancement ou si le fichier config.json est vide)
  const createDefaultPages = React.useCallback(() => {
    const defaultPages: StreamDeckPage[] = [
      {
        id: "main",
        name: "Principal",
        color: "#3b82f6",
        icon: "Home",
        buttons: [
          {
            id: "demo-1",
            label: "Couper Micro",
            icon: "Mic",
            color: "#ef4444",
            command: "nircmd.exe mutesysvolume 2", // Exemple: nécessite NirCmd installé
            shortcut: "",
          },
          {
            id: "demo-2",
            label: "Lancer OBS",
            icon: "Camera",
            color: "#8b5cf6",
            command: "start obs64.exe", // Exemple: lance OBS
            shortcut: "",
          },
          {
            id: "demo-3",
            label: "Mode Jeu (F6)",
            icon: "Gamepad2",
            color: "#22c55e",
            command: "",
            shortcut: "F6", // Exemple: envoie la touche F6 (nécessite robotjs sur le serveur)
          },
        ],
      },
      {
        id: "media",
        name: "Média",
        color: "#f97316",
        icon: "Monitor",
        buttons: [
          {
            id: "demo-4",
            label: "Volume +",
            icon: "Volume2",
            color: "#3b82f6",
            command: "nircmd.exe changesysvolume 1000", // Exemple: nécessite NirCmd
            shortcut: "",
          },
          {
            id: "demo-5",
            label: "VLC",
            icon: "Monitor",
            color: "#f97316",
            command: "start vlc.exe", // Exemple: lance VLC
            shortcut: "",
          },
          {
            id: "demo-6",
            label: "Discord",
            icon: "Headphones",
            color: "#8b5cf6",
            command: "start discord.exe", // Exemple: lance Discord
            shortcut: "",
          },
        ],
      },
    ];
    setPages(defaultPages);
    setCurrentPageId(defaultPages[0].id);
    saveConfigToServer(defaultPages); // Sauvegarde les pages par défaut sur le serveur
  }, [saveConfigToServer]);


  // NOUVEAU: Appelle saveConfigToServer chaque fois que 'pages' change
  React.useEffect(() => {
    if (pages.length > 0) {
      saveConfigToServer(pages);
    }
  }, [pages, saveConfigToServer]);


  const handleAddButton = () => {
    setEditingButton(undefined);
    setDialogOpen(true);
  };

  const handleEditButton = (config: ActionButtonConfig) => {
    setEditingButton(config);
    setDialogOpen(true);
  };

  const handleSaveButton = (config: ActionButtonConfig) => {
    setPages((prev) => {
      const newPages = prev.map((page) => {
        if (page.id === currentPageId) {
          if (editingButton) {
            return {
              ...page,
              buttons: page.buttons.map((btn) =>
                btn.id === config.id ? config : btn,
              ),
            };
          } else {
            return {
              ...page,
              buttons: [...page.buttons, config],
            };
          }
        }
        return page;
      });
      return newPages;
    });
    setDialogOpen(false); // NOUVEAU: Ferme le dialogue après la sauvegarde
  };

  const handleDeleteButton = () => {
    if (editingButton) {
      setPages((prev) => {
        const newPages = prev.map((page) => {
          if (page.id === currentPageId) {
            return {
              ...page,
              buttons: page.buttons.filter(
                (btn) => btn.id !== editingButton.id,
              ),
            };
          }
          return page;
        });
        return newPages;
      });
      setDialogOpen(false); // NOUVEAU: Ferme le dialogue après la suppression
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
        // Met à jour une page existante
        return prev.map((page) => (page.id === pageData.id ? pageData : page));
      } else {
        // Ajoute une nouvelle page
        const newPages = [...prev, pageData];
        setCurrentPageId(pageData.id);
        return newPages;
      }
    });
    setPageDialogOpen(false); // NOUVEAU: Ferme le dialogue après la sauvegarde
  };

  const handleDeletePage = () => {
    if (editingPage && pages.length > 1) {
      setPages((prev) => {
        const newPages = prev.filter((page) => page.id !== editingPage.id);
        if (currentPageId === editingPage.id) {
          setCurrentPageId(newPages[0].id);
        }
        return newPages;
      });
      setPageDialogOpen(false); // NOUVEAU: Ferme le dialogue après la suppression
    }
  };

  // Gestionnaires de glisser-déposer pour les boutons
  const handleButtonDragStart = (e: React.DragEvent, buttonId: string) => {
    setDraggedButton(buttonId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleButtonDragEnd = () => {
    setDraggedButton(null);
  };

  const handleButtonDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleButtonDrop = (e: React.DragEvent, targetButtonId: string) => {
    e.preventDefault();
    if (!draggedButton || draggedButton === targetButtonId) return;

    setPages((prev) => {
      const newPages = prev.map((page) => {
        if (page.id === currentPageId) {
          const buttons = [...page.buttons];
          const draggedIndex = buttons.findIndex(
            (btn) => btn.id === draggedButton,
          );
          const targetIndex = buttons.findIndex(
            (btn) => btn.id === targetButtonId,
          );

          if (draggedIndex !== -1 && targetIndex !== -1) {
            const [draggedItem] = buttons.splice(draggedIndex, 1);
            buttons.splice(targetIndex, 0, draggedItem);
          }
          return { ...page, buttons };
        }
        return page;
      });
      return newPages;
    });
    setDraggedButton(null);
  };

  // Gestionnaire de réorganisation des pages
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

  // Fonction pour exécuter l'action via l'API du serveur
  const handleExecuteAction = async (config: ActionButtonConfig) => {
    if (!config.command && !config.shortcut) {
      alert("Aucune commande ou raccourci configuré pour ce bouton.");
      return;
    }

    try {
      const response = await fetch("/api/execute-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command: config.command,
          shortcut: config.shortcut,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Erreur serveur :", data.error);
        alert(`Erreur lors de l'exécution de l'action : ${data.error}. Stderr: ${data.stderr || 'N/A'}`);
      } else {
        console.log("Action exécutée :", data.message);
        alert(`Exécuté : ${config.label} - ${data.message}`);
      }
    } catch (error: any) {
      console.error("Erreur réseau ou client :", error);
      alert(`Impossible de se connecter au serveur ou erreur client : ${error.message}`);
    }
  };

  // Fonction pour redémarrer le serveur via un appel API
  const handleRestartServer = async () => {
    try {
      const response = await fetch("/api/restart-server", {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
      } else {
        alert(`Échec du redémarrage du serveur : ${data.error}`);
      }
    } catch (error: any) {
      console.error("Erreur lors du redémarrage du serveur :", error);
      alert(`Impossible de se connecter au serveur pour le redémarrage : ${error.message}`);
    }
  };


  // Calcule les dimensions de la grille en fonction du nombre de boutons et de la taille de l'écran
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

  const getGridDimensions = () => {
    const buttonCount = buttons.length + (isEditing ? 1 : 0);

    switch (screenSize) {
      case "mobile":
        return {
          cols: Math.min(3, Math.max(2, Math.ceil(Math.sqrt(buttonCount)))),
          maxCols: 3,
        };
      case "tablet":
        return {
          cols: Math.min(
            4,
            Math.max(3, Math.ceil(Math.sqrt(buttonCount * 0.8))),
          ),
          maxCols: 4,
        };
      default:
        return {
          cols: Math.min(
            6,
            Math.max(4, Math.ceil(Math.sqrt(buttonCount * 0.7))),
          ),
          maxCols: 6,
        };
    }
  };

  const { cols, maxCols } = getGridDimensions();
  const totalSlots = Math.max(cols * 3, buttons.length + (isEditing ? 1 : 0)); // Minimum 3 rangées

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-border/50 gap-4 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">CONTROL PAD</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Contrôlez votre PC à distance avec des boutons d'action personnalisables
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

      {/* Navigation entre les pages */}
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

      {/* Grille des boutons */}
      <div className="flex-1 p-3 sm:p-6 overflow-auto">
        {isEditing && (
          <div className="text-center text-sm text-muted-foreground mb-4 p-2 bg-primary/10 rounded-lg border border-primary/20">
            🎛️ Mode Édition Actif - Faites glisser pour réorganiser les boutons et les pages, cliquez sur les boutons pour les modifier.
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
          {buttons.map((config) => (
            <ActionButton
              key={config.id}
              config={config}
              isEditing={isEditing}
              onEdit={() => handleEditButton(config)}
              onExecute={() => handleExecuteAction(config)}
              onDragStart={(e) => handleButtonDragStart(e, config.id)}
              onDragEnd={handleButtonDragEnd}
              onDragOver={handleButtonDragOver}
              onDrop={(e) => handleButtonDrop(e, config.id)}
            />
          ))}

          {isEditing && <AddButton onClick={handleAddButton} />}

          {/* Remplir les emplacements de grille restants pour une cohérence visuelle */}
          {Array.from({
            length: Math.max(
              0,
              totalSlots - buttons.length - (isEditing ? 1 : 0),
            ),
          }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 w-24" />
          ))}
        </div>

        {/* État vide */}
        {buttons.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-lg font-medium">Aucune action configurée</p>
              <p className="text-sm">
                Ajoutez votre premier bouton d'action pour commencer
              </p>
            </div>
            <Button onClick={handleAddButton} className="mt-4">
              Ajouter une première action
            </Button>
          </div>
        )}
      </div>

      {/* Dialogue d'action */}
      <ActionButtonDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={editingButton}
        onSave={handleSaveButton}
        onDelete={editingButton ? handleDeleteButton : undefined}
      />

      {/* Dialogue de page */}
      <PageDialog
        open={pageDialogOpen}
        onOpenChange={setPageDialogOpen}
        page={editingPage}
        onSave={handleSavePage}
        onDelete={editingPage ? handleDeletePage : undefined}
      />

      {/* Dialogue des paramètres */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} onRestartServer={handleRestartServer} />
    </div>
  );
}