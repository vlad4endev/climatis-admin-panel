import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { EntityListConfig } from "./types";

interface EntityViewDialogProps<T> {
  item: T | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: EntityListConfig<T>;
  title?: string;
}

export function EntityViewDialog<T>({ 
  item, 
  open, 
  onOpenChange, 
  config,
  title 
}: EntityViewDialogProps<T>) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title || "Просмотр"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {config.fields.map((field, index) => {
            const value = field.getValue 
              ? field.getValue(item) 
              : (item as any)[field.key];
            
            return (
              <div key={field.key + index}>
                {index > 0 && index % 2 === 0 && <Separator className="my-4" />}
                <div className="text-xs text-muted-foreground mb-1">{field.label}</div>
                <div className="text-sm">
                  {field.render 
                    ? field.render(value, item) 
                    : (value !== undefined && value !== null && value !== '' 
                        ? String(value) 
                        : <span className="text-muted-foreground">—</span>
                      )
                  }
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
