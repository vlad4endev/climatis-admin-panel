import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { EntityViewDialog } from "@/components/entity/EntityViewDialog";
import { StockMovement } from "@/types/stockMovement";
import { StockMovementForm } from "@/components/stockMovements/StockMovementForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { useStockMovements, useCreateStockMovement, useUpdateStockMovement, useDeleteStockMovement } from "@/hooks/useStockMovements";
import { useSpareParts } from "@/hooks/useSpareParts";
import { useRequests } from "@/hooks/useRequests";
import { Skeleton } from "@/components/ui/skeleton";

export default function StockMovements() {
  const { data: stockMovements = [], isLoading } = useStockMovements();
  const { data: sparePartsData = [] } = useSpareParts();
  const { data: requestsData = [] } = useRequests();
  
  const createMutation = useCreateStockMovement();
  const updateMutation = useUpdateStockMovement();
  const deleteMutation = useDeleteStockMovement();

  const spareParts = sparePartsData.map(p => ({ id: p.id, name: p.name }));
  const requests = requestsData.map(r => ({ 
    id: r.id, 
    name: r.requestNumber,
    createdAt: r.createdAt.toString()
  }));

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
        render: (value) => new Date(value).toLocaleDateString('ru-RU')
      },
      { 
        key: "operationType",
        label: "Тип",
        type: "text",
        filterable: true,
        render: (value) => {
          const colors: Record<string, string> = {
            "приход": "text-green-600",
            "расход": "text-blue-600",
            "возврат": "text-orange-600",
          };
          return <span className={`font-medium ${colors[value] || ""}`}>{value}</span>;
        }
      },
      { 
        key: "materials", 
        label: "Материалы", 
        type: "text", 
        searchable: true,
        render: (value: any) => {
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
      { key: "comment", label: "Комментарий", type: "textarea" },
    ],
    getItemId: (item) => item.id,
    onRowClick: (item) => setViewingMovement(item),
    onDelete: (id) => deleteMutation.mutate(id),
    onEdit: (item) => {
      setEditingMovement(item);
      setIsFormOpen(true);
    },
  };

  const handleSubmit = (data: Partial<StockMovement>) => {
    if (editingMovement) {
      updateMutation.mutate({ id: editingMovement.id, ...data }, {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingMovement(undefined);
        }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingMovement(undefined);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Расход/Приход" buttonLabel="Добавить операцию" onButtonClick={() => {}} />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

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
