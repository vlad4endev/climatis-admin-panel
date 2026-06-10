import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Search, Tag } from "lucide-react";
import {
  useWorkPriceList,
  useCreateWorkPriceItem,
  useUpdateWorkPriceItem,
  useDeleteWorkPriceItem,
} from "@/hooks/useWorkPriceList";
import { WorkPriceItem } from "@/types/workPriceItem";

export default function WorkPriceList() {
  const { data: items = [], isLoading } = useWorkPriceList();
  const create = useCreateWorkPriceItem();
  const update = useUpdateWorkPriceItem();
  const remove = useDeleteWorkPriceItem();

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<WorkPriceItem | null>(null);
  const [deleting, setDeleting] = useState<WorkPriceItem | null>(null);
  const [form, setForm] = useState({ name: "", unit: "шт", price: 0, category: "", isActive: true });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || (i.category || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const handleAdd = () => {
    setEditing(null);
    setForm({ name: "", unit: "шт", price: 0, category: "", isActive: true });
    setIsFormOpen(true);
  };

  const handleEdit = (item: WorkPriceItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      unit: item.unit,
      price: item.price,
      category: item.category || "",
      isActive: item.isActive,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      unit: form.unit.trim() || "шт",
      price: Number(form.price) || 0,
      category: form.category.trim() || undefined,
      isActive: form.isActive,
    };
    if (editing) await update.mutateAsync({ id: editing.id, ...payload });
    else await create.mutateAsync(payload);
    setIsFormOpen(false);
  };

  const handleDelete = async () => {
    if (deleting) await remove.mutateAsync(deleting.id);
    setDeleting(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Прайс работ</h1>
          <p className="text-muted-foreground mt-1">Готовые позиции для подгрузки в расчёт</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить позицию
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию или категории"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Позиции прайса ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {items.length === 0 ? "Прайс пуст. Добавьте первую позицию." : "Ничего не найдено."}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/30 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{item.name}</span>
                      {item.category && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                          <Tag className="h-3 w-3" />
                          {item.category}
                        </span>
                      )}
                      {!item.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">неактивно</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">Ед. изм.: {item.unit}</div>
                  </div>
                  <div className="text-right tabular-nums font-semibold whitespace-nowrap">
                    {Math.round(item.price).toLocaleString("ru-RU")} ₽
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)} title="Редактировать">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleting(item)}
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать позицию" : "Новая позиция прайса"}</DialogTitle>
            <DialogDescription>Заполните данные позиции</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">Наименование *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Например: Диагностика"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="unit">Ед. изм.</Label>
                <Input id="unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="шт" />
              </div>
              <div>
                <Label htmlFor="price">Цена, ₽</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price || ""}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Категория</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Например: Кондиционирование"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label className="cursor-pointer">Активна</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Отмена</Button>
            <Button onClick={handleSubmit}>{editing ? "Сохранить" : "Добавить"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить позицию?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleting?.name}» будет перемещена в корзину.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
