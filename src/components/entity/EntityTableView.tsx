import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, Pencil, Trash2, Check, X } from "lucide-react";
import { EntityListConfig } from "./types";

interface EntityTableViewProps<T> {
  items: T[];
  config: EntityListConfig<T>;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
}

export function EntityTableView<T>({ items, config, sortField, sortDirection, onSort }: EntityTableViewProps<T>) {
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');

  const handleStartEdit = (id: string, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setEditValue(currentValue);
  };

  const handleSaveEdit = () => {
    if (editingCell && config.onUpdate) {
      config.onUpdate(editingCell.id, editingCell.field, editValue);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const renderCell = (item: T, field: any) => {
    const id = config.getItemId(item);
    const value = field.getValue ? field.getValue(item) : (item as any)[field.key];
    const isEditing = editingCell?.id === id && editingCell?.field === field.key;

    if (isEditing && field.editable !== false) {
      if (field.type === 'select' && field.options) {
        return (
          <div className="flex items-center gap-2">
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveEdit}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      } else if (field.type === 'textarea') {
        return (
          <div className="flex items-start gap-2">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="min-h-[60px]"
              autoFocus
            />
            <div className="flex flex-col gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveEdit}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-2">
            <Input
              type={field.type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-8"
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveEdit}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    }

    return (
      <div
        className={field.editable !== false ? "cursor-pointer hover:bg-muted/50 p-1 rounded" : ""}
        onClick={() => field.editable !== false && handleStartEdit(id, field.key, value)}
      >
        {field.render ? field.render(value, item) : String(value || '')}
      </div>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
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
              <TableRow key={id}>
                {config.fields.map(field => (
                  <TableCell key={field.key} className={field.cellClassName?.(item)}>
                    {renderCell(item, field)}
                  </TableCell>
                ))}
                <TableCell>
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
  );
}
