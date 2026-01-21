import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { CardAction } from "./types";

interface CardActionsMenuProps<T> {
  item: T;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  getItemId: (item: T) => string;
  cardActions?: CardAction<T>[];
}

export function CardActionsMenu<T>({
  item,
  onEdit,
  onDelete,
  getItemId,
  cardActions = [],
}: CardActionsMenuProps<T>) {
  // Build actions list
  const actions: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: (e: React.MouseEvent) => void;
    disabled?: boolean;
    variant?: 'default' | 'destructive';
  }> = [];

  // Add edit action
  if (onEdit) {
    actions.push({
      icon: Pencil,
      label: "Редактировать",
      onClick: (e) => {
        e.stopPropagation();
        onEdit(item);
      },
    });
  }

  // Add custom card actions
  cardActions.forEach((action) => {
    const isDisabled = typeof action.disabled === 'function' 
      ? action.disabled(item) 
      : action.disabled;
    
    actions.push({
      icon: action.icon,
      label: action.label,
      onClick: (e) => {
        e.stopPropagation();
        action.onClick(item, e);
      },
      disabled: isDisabled,
    });
  });

  // Add delete action
  if (onDelete) {
    actions.push({
      icon: Trash2,
      label: "Удалить",
      onClick: (e) => {
        e.stopPropagation();
        onDelete(getItemId(item));
      },
      variant: 'destructive',
    });
  }

  if (actions.length === 0) return null;

  // If 3 or fewer actions, show as icon buttons
  if (actions.length <= 3) {
    return (
      <div className="flex items-center gap-1">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${action.variant === 'destructive' ? 'hover:bg-destructive hover:text-destructive-foreground' : ''}`}
              onClick={action.onClick}
              disabled={action.disabled}
              title={action.label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>
    );
  }

  // More than 3 actions - show dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover z-50">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={action.variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''}
            >
              <Icon className="h-4 w-4 mr-2" />
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
