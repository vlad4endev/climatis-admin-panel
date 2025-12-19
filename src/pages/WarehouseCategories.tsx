import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Package, Plus, Pencil, Trash2, Eye, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWarehouseCategories, useCreateWarehouseCategory, useUpdateWarehouseCategory, useDeleteWarehouseCategory } from "@/hooks/useWarehouseCategories";
import { WarehouseCategory } from "@/types/warehouseCategory";

export default function WarehouseCategories() {
  const navigate = useNavigate();
  const { data: categories = [], isLoading } = useWarehouseCategories();
  const createCategory = useCreateWarehouseCategory();
  const updateCategory = useUpdateWarehouseCategory();
  const deleteCategory = useDeleteWarehouseCategory();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<WarehouseCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<WarehouseCategory | null>(null);
  const [formName, setFormName] = useState("");

  const handleView = (category: WarehouseCategory) => {
    navigate(`/spare-parts?category=${encodeURIComponent(category.name)}`);
  };

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

  const handleSubmit = async () => {
    if (!formName.trim()) return;

    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, name: formName.trim() });
    } else {
      await createCategory.mutateAsync({ name: formName.trim() });
    }

    setIsFormOpen(false);
    setFormName("");
    setEditingCategory(null);
  };

  const handleDelete = async () => {
    if (deletingCategory) {
      await deleteCategory.mutateAsync(deletingCategory.id);
    }
    setIsDeleteDialogOpen(false);
    setDeletingCategory(null);
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Разделы в складе</h1>
          <p className="text-muted-foreground mt-2">Управление категориями номенклатуры</p>
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
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xl truncate" title={category.name}>{category.name}</CardTitle>
                  <CardDescription>Раздел склада</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Наименований:</span>
                  <span className="font-semibold text-lg">{category.itemCount}</span>
                </div>
              </div>
              <div className="flex justify-center gap-2 pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => handleView(category)} title="Просмотреть" className="h-8 w-8">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(category)} title="Редактировать" className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(category)} title="Удалить" className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Всего категорий</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Всего наименований</p>
                <p className="text-2xl font-bold">{categories.reduce((sum, cat) => sum + cat.itemCount, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Редактировать раздел" : "Новый раздел"}</DialogTitle>
            <DialogDescription>{editingCategory ? "Измените название раздела" : "Добавьте новый раздел"}</DialogDescription>
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
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Отмена</Button>
            <Button onClick={handleSubmit}>{editingCategory ? "Сохранить" : "Добавить"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить раздел?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить раздел "{deletingCategory?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
