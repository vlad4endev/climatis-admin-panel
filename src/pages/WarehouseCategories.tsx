import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface WarehouseCategory {
  id: string;
  name: string;
  itemCount: number;
  totalStock: number;
  lowStockItems: number;
}

const initialCategories: WarehouseCategory[] = [
  {
    id: "1",
    name: "Кондиционирование",
    itemCount: 41,
    totalStock: 2847.5,
    lowStockItems: 8,
  },
  {
    id: "2",
    name: "Кабельная продукция",
    itemCount: 19,
    totalStock: 2603,
    lowStockItems: 3,
  },
  {
    id: "3",
    name: "Вентиляция",
    itemCount: 59,
    totalStock: 1956,
    lowStockItems: 12,
  },
];

export default function WarehouseCategories() {
  const [categories, setCategories] = useState<WarehouseCategory[]>(initialCategories);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<WarehouseCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<WarehouseCategory | null>(null);
  const [formName, setFormName] = useState("");

  const handleAdd = () => {
    setEditingCategory(null);
    setFormName("");
    setIsFormOpen(true);
  };

  const handleEdit = (category: WarehouseCategory) => {
    setEditingCategory(category);
    setFormName(category.name);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (category: WarehouseCategory) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formName.trim()) {
      toast.error("Введите название раздела");
      return;
    }

    if (editingCategory) {
      setCategories(prev =>
        prev.map(cat =>
          cat.id === editingCategory.id ? { ...cat, name: formName.trim() } : cat
        )
      );
      toast.success("Раздел обновлён");
    } else {
      const newCategory: WarehouseCategory = {
        id: Date.now().toString(),
        name: formName.trim(),
        itemCount: 0,
        totalStock: 0,
        lowStockItems: 0,
      };
      setCategories(prev => [...prev, newCategory]);
      toast.success("Раздел добавлен");
    }

    setIsFormOpen(false);
    setFormName("");
    setEditingCategory(null);
  };

  const handleDelete = () => {
    if (deletingCategory) {
      setCategories(prev => prev.filter(cat => cat.id !== deletingCategory.id));
      toast.success("Раздел удалён");
    }
    setIsDeleteDialogOpen(false);
    setDeletingCategory(null);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Разделы в складе</h1>
          <p className="text-muted-foreground mt-2">
            Управление категориями номенклатуры
          </p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить раздел
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-lg transition-shadow group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{category.name}</CardTitle>
                    <CardDescription>Раздел склада</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(category)}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(category)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Наименований:</span>
                  <span className="font-semibold text-lg">{category.itemCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Общий остаток:</span>
                  <span className="font-semibold text-lg">{category.totalStock.toLocaleString('ru-RU')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Нужно пополнить:</span>
                  <span className={`font-semibold text-lg ${category.lowStockItems > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {category.lowStockItems}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Статистика склада</CardTitle>
            <CardDescription>Общая информация по всем разделам</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Всего категорий</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Всего наименований</p>
                <p className="text-2xl font-bold">
                  {categories.reduce((sum, cat) => sum + cat.itemCount, 0)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Требуют внимания</p>
                <p className="text-2xl font-bold text-destructive">
                  {categories.reduce((sum, cat) => sum + cat.lowStockItems, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Редактировать раздел" : "Новый раздел"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Измените название раздела номенклатуры"
                : "Добавьте новый раздел для группировки номенклатуры"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="categoryName">Название раздела</Label>
            <Input
              id="categoryName"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Например: Электрика"
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit}>
              {editingCategory ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить раздел?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить раздел "{deletingCategory?.name}"?
              Это действие нельзя отменить.
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
