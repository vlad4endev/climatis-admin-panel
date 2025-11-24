import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { EntityListConfig } from "./types";
import { useState } from "react";

interface EntityKanbanViewProps<T> {
  items: T[];
  config: EntityListConfig<T>;
  groupByField: string;
  columns: { value: string; label: string }[];
}

export function EntityKanbanView<T>({ items, config, groupByField, columns }: EntityKanbanViewProps<T>) {
  const [draggedItem, setDraggedItem] = useState<T | null>(null);

  const getItemsByStatus = (status: string) => {
    return items.filter(item => (item as any)[groupByField] === status);
  };

  const handleDragStart = (item: T) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: string) => {
    if (draggedItem && config.onUpdate) {
      const id = config.getItemId(draggedItem);
      config.onUpdate(id, groupByField, status);
      setDraggedItem(null);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(column => {
        const columnItems = getItemsByStatus(column.value);
        return (
          <div
            key={column.value}
            className="flex-shrink-0 w-80 bg-muted/30 rounded-lg p-4"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.value)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">{column.label}</h3>
              <Badge variant="secondary">{columnItems.length}</Badge>
            </div>
            <div className="space-y-3">
              {columnItems.map(item => {
                const id = config.getItemId(item);
                const titleField = config.fields[0];
                const titleValue = titleField.getValue 
                  ? titleField.getValue(item) 
                  : (item as any)[titleField.key];

                return (
                  <Card
                    key={id}
                    draggable
                    onDragStart={() => handleDragStart(item)}
                    className="cursor-move hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-start justify-between">
                        <span className="flex-1">
                          {titleField.render ? titleField.render(titleValue, item) : String(titleValue)}
                        </span>
                        <div className="flex items-center gap-1 ml-2">
                          {config.onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => config.onEdit!(item)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                          {config.onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => config.onDelete!(id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {config.fields.slice(1, 4).map(field => {
                        const value = field.getValue ? field.getValue(item) : (item as any)[field.key];
                        if (!value) return null;

                        return (
                          <div key={field.key} className="text-xs">
                            <span className="text-muted-foreground">{field.label}: </span>
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
          </div>
        );
      })}
    </div>
  );
}
