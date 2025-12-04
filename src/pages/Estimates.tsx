import { useState } from "react";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { Estimate, ESTIMATE_STATUSES, ESTIMATE_TYPES } from "@/types/estimate";
import { EstimateForm } from "@/components/estimates/EstimateForm";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Mock data
const mockRequests = [
  { id: "1", name: "Заявка #001 - Ремонт котла", createdAt: "2024-01-15" },
  { id: "2", name: "Заявка #002 - ТО системы", createdAt: "2024-01-20" },
  { id: "3", name: "Заявка #003 - Замена насоса", createdAt: "2024-01-25" },
];

const mockMaterials = [
  { id: "1", name: "Теплообменник", price: 25000 },
  { id: "2", name: "Насос циркуляционный", price: 8500 },
  { id: "3", name: "Расширительный бак", price: 3200 },
  { id: "4", name: "Термостат", price: 1500 },
  { id: "5", name: "Манометр", price: 450 },
  { id: "6", name: "Прокладка фланцевая", price: 120 },
];

const mockEmployees = [
  { id: "1", fullName: "Иванов Иван Иванович" },
  { id: "2", fullName: "Петров Петр Петрович" },
  { id: "3", fullName: "Сидоров Сидор Сидорович" },
];

const mockEstimates: Estimate[] = [
  {
    id: "1",
    name: "Расчёт по ремонту котла",
    requestId: "1",
    requestName: "Заявка #001 - Ремонт котла",
    estimateNumber: "РС-2024-001",
    estimateDate: "2024-01-16",
    status: "готов",
    type: "сложный ремонт",
    createdById: "1",
    createdByName: "Иванов Иван Иванович",
    engineerComment: "Требуется замена теплообменника",
  },
  {
    id: "2",
    name: "Смета на ТО",
    requestId: "2",
    requestName: "Заявка #002 - ТО системы",
    estimateNumber: "РС-2024-002",
    estimateDate: "2024-01-21",
    status: "согласован",
    type: "по договору ТО",
    createdById: "2",
    createdByName: "Петров Петр Петрович",
    engineerComment: "Плановое обслуживание",
  },
  {
    id: "3",
    name: "Расчёт замены насоса",
    requestId: "3",
    requestName: "Заявка #003 - Замена насоса",
    estimateNumber: "РС-2024-003",
    estimateDate: "2024-01-26",
    status: "черновик",
    type: "простой ремонт",
    createdById: "3",
    createdByName: "Сидоров Сидор Сидорович",
  },
];

export default function Estimates() {
  const [estimates, setEstimates] = useState<Estimate[]>(mockEstimates);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<Estimate | undefined>();
  const { toast } = useToast();

  const getStatusBadgeVariant = (status: string): "draft" | "ready" | "approved" | "default" => {
    switch (status) {
      case "черновик":
        return "draft";
      case "готов":
        return "ready";
      case "согласован":
        return "approved";
      default:
        return "default";
    }
  };

  const config: EntityListConfig<Estimate> = {
    getItemId: (item) => item.id,
    fields: [
      {
        key: "name",
        label: "Расчёт (смета)",
        type: "text",
        searchable: true,
        render: (value) => <span className="font-medium">{value}</span>,
      },
      {
        key: "estimateNumber",
        label: "Номер расчёта",
        type: "text",
        searchable: true,
      },
      {
        key: "estimateDate",
        label: "Дата расчёта",
        type: "date",
        sortable: true,
      },
      {
        key: "status",
        label: "Статус",
        type: "select",
        options: ESTIMATE_STATUSES,
        filterable: true,
        render: (value) => (
          <Badge variant={getStatusBadgeVariant(value)}>
            {ESTIMATE_STATUSES.find((s) => s.value === value)?.label || value}
          </Badge>
        ),
      },
      {
        key: "type",
        label: "Тип расчёта",
        type: "select",
        options: ESTIMATE_TYPES,
        filterable: true,
      },
      {
        key: "createdByName",
        label: "Расчёт составил",
        type: "text",
        searchable: true,
      },
      {
        key: "requestName",
        label: "Заявка",
        type: "text",
        searchable: true,
      },
      {
        key: "engineerComment",
        label: "Комментарий инженера",
        type: "text",
        searchable: true,
      },
    ],
    onUpdate: (id, field, value) => {
      setEstimates((prev) =>
        prev.map((estimate) =>
          estimate.id === id ? { ...estimate, [field]: value } : estimate
        )
      );
      toast({
        title: "Расчёт обновлён",
        description: "Изменения сохранены",
      });
    },
    onDelete: (id) => {
      setEstimates((prev) => prev.filter((estimate) => estimate.id !== id));
      toast({
        title: "Расчёт удалён",
        description: "Расчёт успешно удалён",
      });
    },
    onEdit: (estimate) => {
      setEditingEstimate(estimate);
      setIsFormOpen(true);
    },
  };

  const handleSubmit = (data: Partial<Estimate>) => {
    if (editingEstimate) {
      setEstimates((prev) =>
        prev.map((estimate) =>
          estimate.id === editingEstimate.id
            ? { ...estimate, ...data }
            : estimate
        )
      );
      toast({
        title: "Расчёт обновлён",
        description: "Изменения успешно сохранены",
      });
    } else {
      const newEstimate: Estimate = {
        id: Date.now().toString(),
        name: data.name || "",
        requestId: data.requestId,
        requestName: data.requestName,
        estimateNumber: data.estimateNumber || "",
        estimateDate: data.estimateDate || new Date().toISOString().split('T')[0],
        status: data.status || "черновик",
        type: data.type || "простой ремонт",
        createdById: data.createdById || "",
        createdByName: data.createdByName || "",
        engineerComment: data.engineerComment,
      };
      setEstimates((prev) => [newEstimate, ...prev]);
      toast({
        title: "Расчёт создан",
        description: "Новый расчёт успешно создан",
      });
    }
    setIsFormOpen(false);
    setEditingEstimate(undefined);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Расчеты</h1>
        <Button
          onClick={() => {
            setEditingEstimate(undefined);
            setIsFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Создать расчёт
        </Button>
      </div>

      <EntityList
        items={estimates}
        config={config}
        defaultViewMode="table"
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEstimate ? "Редактировать расчёт" : "Создать расчёт"}
            </DialogTitle>
          </DialogHeader>
          <EstimateForm
            estimate={editingEstimate}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingEstimate(undefined);
            }}
            requests={mockRequests}
            employees={mockEmployees}
            availableMaterials={mockMaterials}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
