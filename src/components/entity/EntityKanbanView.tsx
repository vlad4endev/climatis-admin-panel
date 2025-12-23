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

  const getColumnColor = (value: string) => {
    const colorMap: Record<string, string> = {
      // English statuses
      new: "border-l-4 border-l-blue-500 bg-blue-50/50",
      needs_calculation: "border-l-4 border-l-purple-500 bg-purple-50/50",
      awaiting_materials: "border-l-4 border-l-orange-500 bg-orange-50/50",
      in_progress: "border-l-4 border-l-cyan-500 bg-cyan-50/50",
      partially_completed: "border-l-4 border-l-yellow-500 bg-yellow-50/50",
      completed: "border-l-4 border-l-green-500 bg-green-50/50",
      closed: "border-l-4 border-l-gray-400 bg-gray-50/50",
      // Russian statuses
      "новая": "border-l-4 border-l-sky-500 bg-sky-50/50",
      "в работе": "border-l-4 border-l-amber-500 bg-amber-50/50",
      "частично выполнена": "border-l-4 border-l-violet-500 bg-violet-50/50",
      "выполнена": "border-l-4 border-l-emerald-500 bg-emerald-50/50",
    };
    return colorMap[value] || "bg-muted/30";
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(column => {
        const columnItems = getItemsByStatus(column.value);
        return (
          <div
            key={column.value}
            className={`flex-shrink-0 w-80 rounded-lg p-4 ${getColumnColor(column.value)}`}
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
