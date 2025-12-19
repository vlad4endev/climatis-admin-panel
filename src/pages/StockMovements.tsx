import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { EntityViewDialog } from "@/components/entity/EntityViewDialog";
import { StockMovement } from "@/types/stockMovement";
import { StockMovementForm } from "@/components/stockMovements/StockMovementForm";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/layout/PageHeader";

export default function StockMovements() {
  const { toast } = useToast();
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([
    {
      id: "1",
      operationDate: "2024-01-15",
      operationType: "приход",
      materials: [
        { materialId: "1", materialName: "Подшипник 6205", quantity: 100 }
      ],
      relatedRequestId: "1",
      relatedRequestName: "Заявка #001",
      comment: "Закупка со склада поставщика",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      operationDate: "2024-01-16",
      operationType: "расход",
      materials: [
        { materialId: "1", materialName: "Подшипник 6205", quantity: 20 }
      ],
      relatedRequestId: "2",
      relatedRequestName: "Заявка #002",
      comment: "Использовано на ремонт насоса",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const spareParts = [
    { id: "1", name: "Подшипник 6205" },
    { id: "2", name: "Кабель ВВГ 3х2.5" },
  ];

  const requests = [
    { id: "1", name: "Заявка #001", createdAt: "2024-01-15T10:00:00Z" },
    { id: "2", name: "Заявка #002", createdAt: "2024-01-16T14:30:00Z" },
  ];

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<StockMovement | undefined>();
  const [viewingMovement, setViewingMovement] = useState<StockMovement | null>(null);

  const config: EntityListConfig<StockMovement> = {
    fields: [
      { 
        key: "operationDate", 
        label: "Дата операции", 
        type: "date", 
        sortable: true,
        editable: true,
        render: (value) => new Date(value).toLocaleDateString('ru-RU')
      },
      { 
        key: "materials", 
        label: "Материалы", 
        type: "text", 
        searchable: true,
        render: (value: any, item: StockMovement) => {
          const materials = value as Array<{ materialName: string; quantity: number }>;
          return materials.map((m, i) => (
            <div key={i} className="text-sm">
              {m.materialName}
            </div>
          ));
        }
      },
      { 
        key: "materials", 
        label: "Количество", 
        type: "text", 
        sortable: true,
        render: (value: any, item: StockMovement) => {
          const materials = value as Array<{ materialName: string; quantity: number }>;
          const isIncoming = item.operationType === "приход" || item.operationType === "возврат";
          const color = isIncoming ? "text-green-600" : "text-blue-600";
          return materials.map((m, i) => (
            <div key={i} className={`font-semibold ${color}`}>
              {isIncoming ? "+" : "−"}{m.quantity}
            </div>
          ));
        }
      },
      { key: "relatedRequestName", label: "Связанная заявка", type: "text", searchable: true },
      { key: "comment", label: "Комментарий", type: "textarea", editable: true },
    ],
    getItemId: (item) => item.id,
    onRowClick: (item) => setViewingMovement(item),
    onUpdate: (id, field, value) => {
      setStockMovements(prev =>
        prev.map(sm =>
          sm.id === id ? { ...sm, [field]: value, updatedAt: new Date().toISOString() } : sm
        )
      );
      toast({
        title: "Успешно",
        description: "Операция обновлена",
      });
    },
    onDelete: (id) => {
      setStockMovements(prev => prev.filter(sm => sm.id !== id));
      toast({
        title: "Успешно",
        description: "Операция удалена",
      });
    },
    onEdit: (item) => {
      setEditingMovement(item);
      setIsFormOpen(true);
    },
  };

  const handleSubmit = (data: Partial<StockMovement>) => {
    if (editingMovement) {
      setStockMovements(prev =>
        prev.map(sm =>
          sm.id === editingMovement.id
            ? { 
                ...sm, 
                ...data,
                relatedRequestName: data.relatedRequestId ? requests.find(r => r.id === data.relatedRequestId)?.name : undefined,
                updatedAt: new Date().toISOString() 
              }
            : sm
        )
      );
      toast({
        title: "Успешно",
        description: "Операция обновлена",
      });
    } else {
      const newMovement: StockMovement = {
        id: Date.now().toString(),
        relatedRequestName: data.relatedRequestId ? requests.find(r => r.id === data.relatedRequestId)?.name : undefined,
        ...data as StockMovement,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setStockMovements(prev => [...prev, newMovement]);
      toast({
        title: "Успешно",
        description: "Операция создана",
      });
    }
    setIsFormOpen(false);
    setEditingMovement(undefined);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Расход/Приход"
        buttonLabel="Добавить операцию"
        onButtonClick={() => setIsFormOpen(true)}
      />

      <EntityList
        items={stockMovements}
        config={config}
        emptyMessage="Нет операций"
        defaultViewMode="table"
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMovement ? "Редактировать операцию" : "Добавить операцию"}
            </DialogTitle>
          </DialogHeader>
          <StockMovementForm
            stockMovement={editingMovement}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingMovement(undefined);
            }}
            spareParts={spareParts}
            requests={requests}
          />
        </DialogContent>
      </Dialog>

      <EntityViewDialog
        item={viewingMovement}
        open={!!viewingMovement}
        onOpenChange={(open) => !open && setViewingMovement(null)}
        config={config}
        title="Операция"
      />
    </div>
  );
}
