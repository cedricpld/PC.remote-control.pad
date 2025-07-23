import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";

export interface ActionButtonConfig {
  id: string;
  label: string;
  icon?: LucideIcon;
  color?: string;
  command?: string;
  shortcut?: string;
}

interface ActionButtonProps {
  config: ActionButtonConfig;
  onEdit?: () => void;
  onExecute?: () => void;
  className?: string;
  isEditing?: boolean;
}

export const ActionButton = React.forwardRef<
  HTMLButtonElement,
  ActionButtonProps
>(({ config, onEdit, onExecute, className, isEditing = false, ...props }, ref) => {
  const IconComponent = config.icon;

  return (
    <Button
      ref={ref}
      variant="outline"
      className={cn(
        "relative h-24 w-24 flex-col gap-2 rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:bg-card/80 hover:scale-105 active:scale-95",
        isEditing && "ring-2 ring-primary/50",
        className
      )}
      style={{
        backgroundColor: config.color ? `${config.color}20` : undefined,
        borderColor: config.color ? `${config.color}40` : undefined,
      }}
      onClick={isEditing ? onEdit : onExecute}
      {...props}
    >
      {IconComponent && (
        <IconComponent 
          className="h-6 w-6" 
          style={{ color: config.color || "currentColor" }}
        />
      )}
      <span className="text-xs font-medium text-center leading-tight">
        {config.label}
      </span>
      {config.shortcut && (
        <span className="absolute top-1 right-1 text-[10px] opacity-60 bg-background/80 px-1 rounded">
          {config.shortcut}
        </span>
      )}
    </Button>
  );
});

ActionButton.displayName = "ActionButton";
