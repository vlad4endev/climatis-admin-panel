import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityListConfig } from "./types";
import { CardActionsMenu } from "./CardActionsMenu";

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
          <Card 
            key={id} 
            className="relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => config.onRowClick?.(item)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-start justify-between gap-2">
                <span className="flex-1 min-w-0 break-words">
                  {titleField.render ? titleField.render(titleValue, item) : String(titleValue)}
                </span>
                <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <CardActionsMenu
                    item={item}
                    onEdit={config.onEdit}
                    onDelete={config.onDelete}
                    getItemId={config.getItemId}
                    cardActions={config.cardActions}
                  />
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
              {config.cardFooter && config.cardFooter(item)}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
