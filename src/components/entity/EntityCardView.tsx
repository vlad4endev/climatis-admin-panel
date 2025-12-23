import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import { EntityListConfig } from "./types";

interface EntityCardViewProps<T> {
  items: T[];
  config: EntityListConfig<T>;
}

export function EntityCardView<T>({ items, config }: EntityCardViewProps<T>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(item => {
        const id = config.getItemId(item);
        const titleField = config.fields[0]; // Первое поле как заголовок
        const titleValue = titleField.getValue 
          ? titleField.getValue(item) 
          : (item as any)[titleField.key];

        return (
          <Card key={id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-start justify-between gap-2">
                <span className="flex-1 min-w-0 break-words">
                  {titleField.render ? titleField.render(titleValue, item) : String(titleValue)}
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {config.onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => config.onEdit!(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {config.onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => config.onDelete!(id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {config.fields.slice(1).map(field => {
                const value = field.getValue ? field.getValue(item) : (item as any)[field.key];
                if (!value) return null;

                return (
                  <div key={field.key} className="text-sm break-words">
                    <span className="text-muted-foreground font-medium">{field.label}: </span>
                    <span className="text-foreground">
                      {field.render ? field.render(value, item) : String(value)}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
