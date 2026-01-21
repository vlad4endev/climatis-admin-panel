import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig, CardAction } from "@/components/entity/types";
import { Estimate, ESTIMATE_STATUSES, ESTIMATE_TYPES } from "@/types/estimate";
import { EstimateForm } from "@/components/estimates/EstimateForm";
import { EstimatePrintView } from "@/components/estimates/EstimatePrintView";
import { ClipboardCheck, Printer, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { useEstimates, useCreateEstimate, useUpdateEstimate, useDeleteEstimate, useCopyEstimate } from "@/hooks/useEstimates";
import { useRequests } from "@/hooks/useRequests";
import { useEmployees } from "@/hooks/useEmployees";
import { useSpareParts } from "@/hooks/useSpareParts";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function Estimates() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: estimates = [], isLoading } = useEstimates();
  const { data: requestsData = [] } = useRequests();
  const { data: employeesData = [] } = useEmployees();
  const { data: sparePartsData = [] } = useSpareParts();
  
  const createMutation = useCreateEstimate();
  const updateMutation = useUpdateEstimate();
  const deleteMutation = useDeleteEstimate();
  const copyMutation = useCopyEstimate();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<Estimate | undefined>();
  const [viewingEstimate, setViewingEstimate] = useState<Estimate | undefined>();
  const [printingEstimate, setPrintingEstimate] = useState<Estimate | undefined>();
  const printRef = useRef<HTMLDivElement>(null);

  const requests = requestsData.map(r => ({
    id: r.id,
    name: r.requestNumber,
    createdAt: r.createdAt.toString(),
    clientName: r.clientName || "",
    serviceObjectName: r.objectName || "",
    serviceObjectAddress: "",
  }));

  const employees = employeesData.map(e => ({
    id: e.id,
    fullName: e.fullName,
  }));

  const availableMaterials = sparePartsData.map(p => ({
    id: p.id,
    name: p.name,
    price: p.retailPrice,
  }));

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printingEstimate ? `Расчёт_${printingEstimate.estimateNumber}` : 'Расчёт',
    onAfterPrint: () => setPrintingEstimate(undefined),
  });

  const handleCreateAssignment = (estimate: Estimate) => {
    const assignmentData = {
      requestId: estimate.requestId,
      requestNumber: estimate.requestName?.split(' - ')[0] || "",
      estimateId: estimate.id,
      estimateName: estimate.name,
      workBlocks: estimate.workBlocks || [],
      materials: estimate.materials || [],
      comments: estimate.engineerComment || "",
    };
    sessionStorage.setItem('newAssignmentFromEstimate', JSON.stringify(assignmentData));
    navigate('/assignments?create=true');
    toast({
      title: "Переход к созданию задания",
      description: `На основе расчёта "${estimate.name}"`,
    });
  };

  const getStatusBadgeVariant = (status: string): "draft" | "ready" | "approved" | "default" => {
    switch (status) {
      case "черновик": return "draft";
      case "готов": return "ready";
      case "согласован": return "approved";
      default: return "default";
    }
  };

  const cardActions: CardAction<Estimate>[] = [
    {
      icon: Copy,
      label: "Копировать",
      onClick: (item) => copyMutation.mutate(item),
      disabled: copyMutation.isPending,
    },
    {
      icon: Printer,
      label: "Печать",
      onClick: (item) => {
        setPrintingEstimate(item);
        setTimeout(() => handlePrint(), 100);
      },
    },
    {
      icon: ClipboardCheck,
      label: "Создать задание",
      onClick: (item) => handleCreateAssignment(item),
      disabled: (item) => item.status === "черновик",
    },
  ];

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
      { key: "estimateNumber", label: "Номер расчёта", type: "text", searchable: true },
      { key: "estimateDate", label: "Дата расчёта", type: "date", sortable: true },
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
      { key: "type", label: "Тип расчёта", type: "select", options: ESTIMATE_TYPES, filterable: true },
      { key: "createdByName", label: "Расчёт составил", type: "text", searchable: true },
      { key: "requestName", label: "Заявка", type: "text", searchable: true },
      { key: "engineerComment", label: "Комментарий инженера", type: "text", searchable: true },
    ],
    onRowClick: (estimate) => setViewingEstimate(estimate),
    onDelete: (id) => deleteMutation.mutate(id),
    onEdit: (estimate) => {
      setEditingEstimate(estimate);
      setIsFormOpen(true);
    },
    cardActions,
    customActions: (estimate) => (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            copyMutation.mutate(estimate);
          }}
          title="Копировать расчёт"
          disabled={copyMutation.isPending}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setPrintingEstimate(estimate);
            setTimeout(() => handlePrint(), 100);
          }}
          title="Печать"
        >
          <Printer className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handleCreateAssignment(estimate);
          }}
          title="Создать задание"
          disabled={estimate.status === "черновик"}
        >
          <ClipboardCheck className="h-4 w-4" />
        </Button>
      </>
    ),
  };

  const handleSubmit = (data: Partial<Estimate>) => {
    if (editingEstimate) {
      updateMutation.mutate({ id: editingEstimate.id, ...data }, {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingEstimate(undefined);
        }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingEstimate(undefined);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Расчеты" buttonLabel="Создать расчёт" onButtonClick={() => {}} />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Расчеты"
        buttonLabel="Создать расчёт"
        onButtonClick={() => {
          setEditingEstimate(undefined);
          setIsFormOpen(true);
        }}
      />

      <EntityList items={estimates} config={config} defaultViewMode="table" />

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
            requests={requests}
            employees={employees}
            availableMaterials={availableMaterials}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingEstimate} onOpenChange={(open) => !open && setViewingEstimate(undefined)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Просмотр расчёта</DialogTitle>
          </DialogHeader>
          {viewingEstimate && (
            <EstimateForm
              estimate={viewingEstimate}
              onSubmit={() => {}}
              onCancel={() => setViewingEstimate(undefined)}
              requests={requests}
              employees={employees}
              availableMaterials={availableMaterials}
              readOnly
            />
          )}
        </DialogContent>
      </Dialog>

      <div style={{ display: 'none' }}>
        {printingEstimate && (
          <EstimatePrintView ref={printRef} estimate={printingEstimate} />
        )}
      </div>
    </div>
  );
}
