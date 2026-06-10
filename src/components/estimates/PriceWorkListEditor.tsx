import { useState, useRef, useEffect, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { PriceWork } from "@/types/estimate";

interface PriceWorkListEditorProps {
  items: PriceWork[];
  onChange: (value: SetStateAction<PriceWork[]>) => void;
  availableItems: Array<{ id: string; name: string; price: number; unit: string; category?: string }>;
  readOnly?: boolean;
}

export function PriceWorkListEditor({
  items,
  onChange,
  availableItems,
  readOnly = false,
}: PriceWorkListEditorProps) {
  const [searchValues, setSearchValues] = useState<Record<string, string>>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const createLocalId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  useEffect(() => {
    setSearchValues((prev) => {
      const next: Record<string, string> = { ...prev };
      for (const it of items) if (next[it.id] === undefined) next[it.id] = it.name || "";
      for (const key of Object.keys(next)) if (!items.some((i) => i.id === key)) delete next[key];
      return next;
    });
  }, [items]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (activeDropdown) {
        const el = dropdownRefs.current[activeDropdown];
        if (el && !el.contains(e.target as Node)) setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [activeDropdown]);

  const addItem = () => {
    const id = createLocalId();
    onChange((prev) => [...prev, { id, name: "", unit: "шт", quantity: 1, pricePerUnit: 0 }]);
    setSearchValues((p) => ({ ...p, [id]: "" }));
  };

  const removeItem = (id: string) => {
    onChange((prev) => prev.filter((i) => i.id !== id));
    setSearchValues((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
  };

  const updateItem = (id: string, field: keyof PriceWork, value: string | number | undefined) => {
    onChange((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const selectAvail = (id: string, avail: { id: string; name: string; price: number; unit: string }) => {
    onChange((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, priceItemId: avail.id, name: avail.name, unit: avail.unit || "шт", pricePerUnit: avail.price }
          : i
      )
    );
    setSearchValues((p) => ({ ...p, [id]: avail.name }));
    setActiveDropdown(null);
  };

  const handleSearchChange = (id: string, value: string) => {
    setSearchValues((p) => ({ ...p, [id]: value }));
    onChange((prev) => prev.map((i) => (i.id === id ? { ...i, name: value, priceItemId: undefined } : i)));
    setActiveDropdown(id);
  };

  const getFiltered = (id: string) => {
    const q = (searchValues[id] || "").toLowerCase();
    if (!q) return availableItems;
    return availableItems.filter((a) => a.name.toLowerCase().includes(q));
  };

  const total = items.reduce((s, i) => s + i.quantity * i.pricePerUnit, 0);

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className={`grid gap-3 text-sm font-medium text-muted-foreground ${readOnly ? "grid-cols-[1fr_70px_70px_110px_110px]" : "grid-cols-[1fr_70px_70px_110px_110px_80px]"}`}>
          <div>Операция</div>
          <div>Ед.</div>
          <div>Кол-во</div>
          <div>Цена</div>
          <div>Сумма</div>
          {!readOnly && <div></div>}
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => {
          const line = item.quantity * item.pricePerUnit;
          const filtered = getFiltered(item.id);
          const showDropdown = activeDropdown === item.id && filtered.length > 0 && !readOnly;
          return (
            <div
              key={item.id}
              className={`grid gap-3 items-center ${readOnly ? "grid-cols-[1fr_70px_70px_110px_110px]" : "grid-cols-[1fr_70px_70px_110px_110px_80px]"}`}
            >
              <div className="relative" ref={(el) => (dropdownRefs.current[item.id] = el)}>
                <Input
                  value={searchValues[item.id] ?? item.name}
                  onChange={(e) => handleSearchChange(item.id, e.target.value)}
                  onFocus={() => !readOnly && setActiveDropdown(item.id)}
                  placeholder="Поиск по прайсу или введите название"
                  readOnly={readOnly}
                  className={readOnly ? "bg-muted/50" : ""}
                />
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto z-50">
                    {filtered.map((a) => (
                      <div
                        key={a.id}
                        className="px-3 py-2 hover:bg-accent cursor-pointer text-sm flex justify-between"
                        onClick={() => selectAvail(item.id, a)}
                      >
                        <span>
                          {a.name}
                          {a.category && <span className="text-muted-foreground ml-2 text-xs">({a.category})</span>}
                        </span>
                        <span className="text-muted-foreground ml-2">{Math.round(a.price).toLocaleString("ru-RU")} ₽</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Input
                value={item.unit || ""}
                onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                placeholder="шт"
                readOnly={readOnly}
                className={readOnly ? "bg-muted/50" : ""}
              />
              <Input
                type="number"
                min="0"
                step="1"
                value={item.quantity || ""}
                onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                placeholder="0"
                readOnly={readOnly}
                className={readOnly ? "bg-muted/50" : ""}
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.pricePerUnit || ""}
                onChange={(e) => updateItem(item.id, "pricePerUnit", parseFloat(e.target.value) || 0)}
                placeholder="0"
                readOnly={readOnly}
                className={readOnly ? "bg-muted/50" : ""}
              />
              <div className="text-sm font-medium text-right pr-2 tabular-nums">
                {Math.round(line).toLocaleString("ru-RU")} ₽
              </div>
              {!readOnly && (
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={addItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {items.length === 0 && !readOnly && (
        <div className="text-center py-8">
          <Button type="button" onClick={addItem} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Добавить позицию из прайса
          </Button>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex justify-end items-center gap-2 pt-4 border-t">
          <span className="text-sm font-semibold">Итого по прайс-работам:</span>
          <span className="text-lg font-bold">{Math.round(total).toLocaleString("ru-RU")} ₽</span>
        </div>
      )}
    </div>
  );
}
