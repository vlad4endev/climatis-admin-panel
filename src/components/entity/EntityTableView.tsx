import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { EntityListConfig } from "./types";

interface EntityTableViewProps<T> {
  items: T[];
  config: EntityListConfig<T>;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
}

export function EntityTableView<T>({ items, config, sortField, sortDirection, onSort }: EntityTableViewProps<T>) {
  return (
    <div className="border rounded-md">
      <div className="overflow-x-auto">
        <Table className="w-max min-w-full">
        <TableHeader className="bg-muted/50">
          <TableRow>
            {config.fields.map(field => (
              <TableHead key={field.key}>
                <div className="flex items-center gap-2">
                  <span>{field.label}</span>
                  {field.sortable !== false && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onSort(field.key)}
                    >
                      <ArrowUpDown className={`h-4 w-4 ${sortField === field.key ? 'text-primary' : 'text-muted-foreground'}`} />
                    </Button>
                  )}
                </div>
              </TableHead>
            ))}
            <TableHead className="w-[100px]">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => {
            const id = config.getItemId(item);
            return (
              <TableRow 
                key={id} 
                className={config.onRowClick ? "cursor-pointer" : ""}
                onClick={() => config.onRowClick?.(item)}
              >
                {config.fields.map(field => {
                  const value = field.getValue ? field.getValue(item) : (item as any)[field.key];
                  return (
                    <TableCell key={field.key} className={field.cellClassName?.(item)}>
                      {field.render ? field.render(value, item) : String(value || '')}
                    </TableCell>
                  );
                })}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    {config.customActions && config.customActions(item)}
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
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => config.onDelete!(id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
