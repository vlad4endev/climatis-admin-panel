import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { EntityViewDialog } from "@/components/entity/EntityViewDialog";
import { SparePart } from "@/types/sparePart";
import { SparePartForm } from "@/components/spareParts/SparePartForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { useSpareParts, useCreateSparePart, useUpdateSparePart, useDeleteSparePart } from "@/hooks/useSpareParts";
import { useWarehouseCategories } from "@/hooks/useWarehouseCategories";
import { Skeleton } from "@/components/ui/skeleton";

export default function SpareParts() {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  
  const { data: spareParts = [], isLoading } = useSpareParts();
  const { data: categories = [] } = useWarehouseCategories();
  const createMutation = useCreateSparePart();
  const updateMutation = useUpdateSparePart();
  const deleteMutation = useDeleteSparePart();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | undefined>();
  const [viewingPart, setViewingPart] = useState<SparePart | null>(null);

  // Get unique categories from spare parts for filtering
  const uniqueCategories = [...new Set(spareParts.map(p => p.category).filter(Boolean))];
  const categoryOptions = uniqueCategories.map(c => ({ value: c, label: c }));

  const config: EntityListConfig<SparePart> = {
    fields: [
      { key: "name", label: "Наименование", type: "text", searchable: true, editable: true },
      { key: "internalArticle", label: "Внутр. артикул", type: "text", searchable: true, editable: true },
      { 
        key: "category", 
        label: "Категория", 
        type: "select", 
        options: categoryOptions,
        filterable: true,
        searchable: true,
      },
      { key: "unit", label: "Ед. изм.", type: "text" },
      { 
        key: "currentStock", 
        label: "Остаток", 
        type: "text",
        sortable: true,
        render: (value, item) => {
          const stock = Number(value);
          const minStock = Number(item.minStock);
          const isLow = stock <= minStock;
          return (
            <span className={isLow ? "text-destructive font-semibold" : ""}>
              {stock}
            </span>
          );
        }
      },
      { key: "minStock", label: "Мин. остаток", type: "text", editable: true },
      { 
        key: "purchasePrice", 
        label: "Закупка", 
        type: "text",
        sortable: true,
        render: (value) => `${Math.round(Number(value)).toLocaleString('ru-RU')} ₽`
      },
      { 
        key: "retailPrice", 
        label: "Розница", 
        type: "text",
        sortable: true,
        render: (value) => `${Math.round(Number(value)).toLocaleString('ru-RU')} ₽`
      },
    ],
    getItemId: (item) => item.id,
    onRowClick: (item) => setViewingPart(item),
    onUpdate: (id, field, value) => {
      const part = spareParts.find(p => p.id === id);
      if (part) {
        const category = categories.find(c => c.name === part.category);
        updateMutation.mutate({ 
          ...part, 
          [field]: value,
          categoryId: category?.id,
        });
      }
    },
    onDelete: (id) => deleteMutation.mutate(id),
    onEdit: (item) => {
      setEditingPart(item);
      setIsFormOpen(true);
    },
  };

  const handleSubmit = (data: Partial<SparePart> & { categoryId?: string }) => {
    if (editingPart) {
      updateMutation.mutate({ 
        id: editingPart.id,
        ...data,
      } as any, {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingPart(undefined);
        }
      });
    } else {
      createMutation.mutate(data as any, {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingPart(undefined);
        }
      });
    }
  };

  // Filter by category from URL if present
  const filteredParts = categoryFromUrl 
    ? spareParts.filter(p => p.category === categoryFromUrl)
    : spareParts;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Запчасти и материалы" buttonLabel="Добавить материал" onButtonClick={() => {}} />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Запчасти и материалы"
        buttonLabel="Добавить материал"
        onButtonClick={() => {
          setEditingPart(undefined);
          setIsFormOpen(true);
        }}
      />

      <EntityList
        items={filteredParts}
        config={config}
        emptyMessage="Материалы не найдены"
        defaultViewMode="table"
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPart ? "Редактировать материал" : "Добавить материал"}
            </DialogTitle>
          </DialogHeader>
          <SparePartForm
            sparePart={editingPart}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingPart(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      <EntityViewDialog
        item={viewingPart}
        open={!!viewingPart}
        onOpenChange={(open) => !open && setViewingPart(null)}
        config={config}
        title={viewingPart?.name}
      />
    </div>
  );
}
