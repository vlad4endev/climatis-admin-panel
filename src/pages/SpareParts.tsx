import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { SparePart } from "@/types/sparePart";
import { SparePartForm } from "@/components/spareParts/SparePartForm";
import { useToast } from "@/hooks/use-toast";

export default function SpareParts() {
  const { toast } = useToast();
  const [spareParts, setSpareParts] = useState<SparePart[]>([
    {
      id: "1",
      name: "Подшипник 6205",
      internalArticle: "BRG-6205",
      unit: "шт",
      currentStock: 50,
      minStock: 10,
      purchasePrice: 250,
      notes: "Основной подшипник для насосов",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Кабель ВВГ 3х2.5",
      internalArticle: "CBL-VVG-325",
      unit: "м",
      currentStock: 200,
      minStock: 50,
      purchasePrice: 85,
      notes: "Электрический кабель для прокладки",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSparePart, setEditingSparePart] = useState<SparePart | undefined>();

  const config: EntityListConfig<SparePart> = {
    fields: [
      { key: "name", label: "Наименование", type: "text", sortable: true, searchable: true, editable: true, width: "w-[400px]" },
      { key: "internalArticle", label: "Внутренний артикул", type: "text", sortable: true, searchable: true, editable: true },
      { 
        key: "currentStock", 
        label: "Остаток", 
        type: "text", 
        sortable: true,
        editable: true,
        render: (value, item) => {
          const isLow = item.currentStock <= item.minStock;
          return (
            <span className={isLow ? "text-destructive font-semibold" : ""}>
              {value} {item.unit}
            </span>
          );
        }
      },
      { 
        key: "minStock", 
        label: "Мин. остаток", 
        type: "text", 
        sortable: true,
        editable: true,
        render: (value, item) => `${value} ${item.unit}`
      },
      { 
        key: "purchasePrice", 
        label: "Закупка", 
        type: "text", 
        sortable: true,
        editable: true,
        render: (value) => `${value} ₽`
      },
      { key: "notes", label: "Примечания", type: "textarea", editable: true },
    ],
    getItemId: (item) => item.id,
    onUpdate: (id, field, value) => {
      setSpareParts(prev =>
        prev.map(sp =>
          sp.id === id ? { ...sp, [field]: value, updatedAt: new Date().toISOString() } : sp
        )
      );
      toast({
        title: "Успешно",
        description: "Комплектующее обновлено",
      });
    },
    onDelete: (id) => {
      setSpareParts(prev => prev.filter(sp => sp.id !== id));
      toast({
        title: "Успешно",
        description: "Комплектующее удалено",
      });
    },
    onEdit: (item) => {
      setEditingSparePart(item);
      setIsFormOpen(true);
    },
  };

  const handleSubmit = (data: Partial<SparePart>) => {
    if (editingSparePart) {
      setSpareParts(prev =>
        prev.map(sp =>
          sp.id === editingSparePart.id
            ? { ...sp, ...data, updatedAt: new Date().toISOString() }
            : sp
        )
      );
      toast({
        title: "Успешно",
        description: "Комплектующее обновлено",
      });
    } else {
      const newSparePart: SparePart = {
        id: Date.now().toString(),
        ...data as SparePart,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSpareParts(prev => [...prev, newSparePart]);
      toast({
        title: "Успешно",
        description: "Комплектующее создано",
      });
    }
    setIsFormOpen(false);
    setEditingSparePart(undefined);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Комплектующие</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить комплектующее
        </Button>
      </div>

      <EntityList
        items={spareParts}
        config={config}
        emptyMessage="Нет комплектующих"
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSparePart ? "Редактировать комплектующее" : "Добавить комплектующее"}
            </DialogTitle>
          </DialogHeader>
          <SparePartForm
            sparePart={editingSparePart}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingSparePart(undefined);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
