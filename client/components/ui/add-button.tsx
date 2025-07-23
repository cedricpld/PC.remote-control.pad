import * as React from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "./button";

interface AddButtonProps {
  onClick?: () => void;
  className?: string;
}

export const AddButton = React.forwardRef<
  HTMLButtonElement,
  AddButtonProps
>(({ onClick, className, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="outline"
      className={cn(
        "h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 flex-col gap-1 sm:gap-2 rounded-lg sm:rounded-xl border-2 border-dashed border-border/30 bg-transparent transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:scale-105 active:scale-95",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <Plus className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-muted-foreground" />
      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground text-center">
        Add Action
      </span>
    </Button>
  );
});

AddButton.displayName = "AddButton";
