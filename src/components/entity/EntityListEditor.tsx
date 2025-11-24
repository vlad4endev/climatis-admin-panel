import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

export interface EntityListEditorField {
  key: string;
  label: string;
  type: "text" | "number";
  placeholder?: string;
  width?: string;
  step?: string;
  min?: string;
}

export interface EntityListEditorConfig<T> {
  fields: EntityListEditorField[];
  createEmpty: () => T;
  getValue: (item: T, key: string) => string | number;
  setValue: (item: T, key: string, value: string | number) => T;
  getId: (item: T) => string;
  calculateTotal?: (items: T[]) => number;
  totalLabel?: string;
  emptyMessage?: string;
}

interface EntityListEditorProps<T> {
  items: T[];
  onChange: (items: T[]) => void;
  config: EntityListEditorConfig<T>;
}

export function EntityListEditor<T>({
  items,
  onChange,
  config,
}: EntityListEditorProps<T>) {
  const addItem = () => {
    onChange([...items, config.createEmpty()]);
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => config.getId(item) !== id));
  };

  const updateItem = (id: string, key: string, value: string | number) => {
    onChange(
      items.map((item) =>
        config.getId(item) === id ? config.setValue(item, key, value) : item
      )
    );
  };

  const gridCols = `grid-cols-[${config.fields.map(f => f.width || "1fr").join("_")}_80px]`;
  
  const totalAmount = config.calculateTotal ? config.calculateTotal(items) : null;

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className={`grid ${gridCols} gap-3 text-sm font-medium text-muted-foreground`}>
          {config.fields.map((field) => (
            <div key={field.key}>{field.label}</div>
          ))}
          <div></div>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={config.getId(item)}
            className={`grid ${gridCols} gap-3 items-center`}
          >
            {config.fields.map((field) => (
              <Input
                key={field.key}
                type={field.type}
                min={field.min}
                step={field.step}
                value={config.getValue(item, field.key) || ""}
                onChange={(e) => {
                  const value = field.type === "number" 
                    ? parseFloat(e.target.value) || 0
                    : e.target.value;
                  updateItem(config.getId(item), field.key, value);
                }}
                placeholder={field.placeholder}
              />
            ))}
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(config.getId(item))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={addItem}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8">
          <Button type="button" onClick={addItem} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            {config.emptyMessage || "Добавить первый элемент"}
          </Button>
        </div>
      )}

      {totalAmount !== null && items.length > 0 && (
        <div className="flex justify-end items-center gap-2 pt-4 border-t">
          <span className="text-sm font-semibold">
            {config.totalLabel || "Итого:"}
          </span>
          <span className="text-lg font-bold">
            {Math.round(totalAmount).toLocaleString('ru-RU')} ₽
          </span>
        </div>
      )}
    </div>
  );
}
