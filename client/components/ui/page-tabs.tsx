import * as React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { StreamDeckPage } from "@/types/stream-deck";
import { Plus, MoreHorizontal } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PageTabsProps {
  pages: StreamDeckPage[];
  currentPageId: string;
  onPageChange: (pageId: string) => void;
  onAddPage: () => void;
  onEditPage: (page: StreamDeckPage) => void;
  onDeletePage?: (pageId: string) => void;
  isEditing?: boolean;
  className?: string;
}

export function PageTabs({
  pages,
  currentPageId,
  onPageChange,
  onAddPage,
  onEditPage,
  onDeletePage,
  isEditing = false,
  className,
}: PageTabsProps) {
  const getIcon = (iconName?: string) => {
    if (!iconName) return Icons.Home;
    return (Icons as any)[iconName] || Icons.Home;
  };

  return (
    <div className={cn("border-b border-border/50", className)}>
      <div className="flex items-center gap-2 px-4 sm:px-6">
        <ScrollArea className="flex-1">
          <div className="flex items-center gap-1 py-2">
            {pages.map((page) => {
              const IconComponent = getIcon(page.icon);
              const isActive = page.id === currentPageId;
              
              return (
                <div key={page.id} className="relative group">
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => onPageChange(page.id)}
                    className={cn(
                      "gap-2 min-w-0 max-w-32 h-8",
                      isActive && "bg-secondary",
                      isEditing && "cursor-move ring-1 ring-primary/30"
                    )}
                    style={{
                      borderBottom: isActive ? `2px solid ${page.color || "#3b82f6"}` : "2px solid transparent",
                    }}
                  >
                    <IconComponent 
                      className="h-3 w-3 flex-shrink-0" 
                      style={{ color: page.color || "currentColor" }}
                    />
                    <span className="truncate text-xs">
                      {page.name}
                    </span>
                  </Button>
                  
                  {/* Edit button that appears on hover - only when not in editing mode */}
                  {!isEditing && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border rounded-full"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditPage(page)}>
                          Edit Page
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          disabled={pages.length <= 1}
                          onClick={() => {
                            if (pages.length > 1 && onDeletePage) {
                              onDeletePage(page.id);
                            }
                          }}
                        >
                          Delete Page
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onAddPage}
          className="gap-2 flex-shrink-0 h-8"
        >
          <Plus className="h-3 w-3" />
          <span className="hidden sm:inline">Add Page</span>
        </Button>
      </div>
    </div>
  );
}
