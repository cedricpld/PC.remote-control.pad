import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ControlBlockConfig } from "@/types/stream-deck";
import * as Icons from "lucide-react";

interface ActionButtonProps {
  config: ControlBlockConfig;
  onEdit?: () => void;
  onExecute?: () => void;
  className?: string;
  isEditing?: boolean;
  [key: string]: any; 
}

export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ config, onEdit, onExecute, className, isEditing = false, ...props }, ref) => {
    const IconComponent = config.icon ? (Icons as any)[config.icon] : null;

    return (
      <Button
        ref={ref}
        variant="outline"
        className={cn(
          "relative h-24 w-24 flex-col gap-1 rounded-xl border-2 p-2",
          "bg-card/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:scale-105 active:scale-95",
          isEditing && "ring-2 ring-primary/50 cursor-move hover:ring-primary",
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
        <span
          className="text-xs font-medium text-center leading-tight px-1 truncate"
          style={{ color: config.color ? config.color : "hsl(var(--foreground))" }}
        >
          {config.label}
        </span>
      </Button>
    );
  }
);

ActionButton.displayName = "ActionButton";