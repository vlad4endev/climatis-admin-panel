import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { useEstimates, usePaginatedEstimates, useCreateEstimate, useUpdateEstimate, useDeleteEstimate, useCopyEstimate } from "@/hooks/useEstimates";
import { useRequests } from "@/hooks/useRequests";
import { useEmployees } from "@/hooks/useEmployees";
import { useSpareParts } from "@/hooks/useSpareParts";
import { useServiceObjects } from "@/hooks/useServiceObjects";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { logButtonClick } from "@/lib/monitoringLogger";
import { useMinimizedForms } from "@/hooks/useMinimizedForms";

// Пока в поиске меньше символов, страница работает с текущей страницей выдачи;
// начиная с этого порога подгружается полный список, иначе поиск находил бы
// совпадения только внутри загруженных 50 записей.
const SEARCH_ALL_MIN_CHARS = 2;

export default function Estimates() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { minimize, restore, registerRestoreHandler, unregisterRestoreHandler } = useMinimizedForms();
  const isMinimizingRef = React.useRef(false);
  
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: estimatesResult, isLoading } = usePaginatedEstimates(currentPage);
  const estimates = estimatesResult?.items || [];
  const totalCount = estimatesResult?.totalCount || 0;

  // При поиске нужен полный список, а не только текущая страница
  const isSearching = searchQuery.trim().length >= SEARCH_ALL_MIN_CHARS;
  const { data: allEstimates = [] } = useEstimates({ enabled: isSearching });
  const listItems = isSearching && allEstimates.length > 0 ? allEstimates : estimates;

  const { data: requestsData = [] } = useRequests();
  const { data: employeesData = [] } = useEmployees();
  const { data: sparePartsData = [] } = useSpareParts();
  const { data: serviceObjectsData = [] } = useServiceObjects();
  
  const createMutation = useCreateEstimate();
  const updateMutation = useUpdateEstimate();
  const deleteMutation = useDeleteEstimate();
  const copyMutation = useCopyEstimate();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEstimate, setEditingEstimate] = useState<Estimate | undefined>();
  const [viewingEstimate, setViewingEstimate] = useState<Estimate | undefined>();
  const [printingEstimate, setPrintingEstimate] = useState<Estimate | undefined>();
  const [restoredFormData, setRestoredFormData] = useState<any>(null);
  const minimizeFormDataRef = React.useRef<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Restore form from global context or open estimate by ID from navigation state
  useEffect(() => {
    const state = location.state as { 
      restoreForm?: { type: string; entityId?: string };
      openEstimateId?: string;
    } | null;
    
    if (state?.restoreForm?.type === "estimate") {
      const entityId = state.restoreForm.entityId;
      if (entityId) {
        const est = estimates.find(e => e.id === entityId);
        if (est) setEditingEstimate(est);
      }
      setIsFormOpen(true);
      window.history.replaceState({}, document.title);
    } else if (state?.openEstimateId) {
      const est = estimates.find(e => e.id === state.openEstimateId);
      if (est) {
        setEditingEstimate(est);
        setIsFormOpen(true);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, estimates]);

  const requests = requestsData.map(r => {
    const serviceObject = serviceObjectsData.find(obj => obj.id === r.objectId);
    return {
      id: r.id,
      name: r.requestNumber,
      createdAt: r.createdAt.toString(),
      clientName: r.clientName || "",
      serviceObjectName: serviceObject?.objectName || r.objectName || "",
      serviceObjectAddress: serviceObject?.address || "",
    };
  });

  const employees = employeesData.map(e => ({
    id: e.id,
    fullName: e.fullName,
    position: e.position || "",
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

  const handleMinimize = (formData?: any) => {
    const title = editingEstimate
      ? `Редактирование: ${editingEstimate.name || editingEstimate.estimateNumber}`
      : 'Новый расчёт';
    minimize({
      id: `estimate-${editingEstimate?.id || 'new'}`,
      type: "estimate",
      title,
      entityId: editingEstimate?.id,
      route: "/estimates",
      formData: formData || null,
    });
    isMinimizingRef.current = true;
    setIsFormOpen(false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setIsFormOpen(false);
      if (isMinimizingRef.current) {
        isMinimizingRef.current = false;
      } else {
        setEditingEstimate(undefined);
        setRestoredFormData(null);
      }
    }
  };

  const handleRestore = useCallback((formId: string) => {
    const form = restore(formId);
    if (form && form.type === "estimate") {
      if (form.entityId) {
        const est = estimates.find(e => e.id === form.entityId);
        if (est) setEditingEstimate(est);
      } else if (form.formData) {
        setRestoredFormData(form.formData);
      }
      setIsFormOpen(true);
    }
  }, [restore, estimates]);

  useEffect(() => {
    registerRestoreHandler("estimate", handleRestore);
    return () => unregisterRestoreHandler("estimate");
  }, [handleRestore, registerRestoreHandler, unregisterRestoreHandler]);

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
      onClick: (item) => { logButtonClick("estimates", "Копировать расчёт"); copyMutation.mutate(item); },
      disabled: copyMutation.isPending,
    },
    {
      icon: Printer,
      label: "Печать",
      onClick: (item) => {
        logButtonClick("estimates", "Печать расчёта");
        setPrintingEstimate(item);
        setTimeout(() => handlePrint(), 100);
      },
    },
    {
      icon: ClipboardCheck,
      label: "Создать задание",
      onClick: (item) => { logButtonClick("estimates", "Создать задание из расчёта"); handleCreateAssignment(item); },
      disabled: (item) => item.status === "черновик",
    },
  ];

  const config: EntityListConfig<Estimate> = {
    getItemId: (item) => item.id,
    fields: [
      { key: "clientName", label: "Контрагент", type: "text", searchable: true, render: (value) => <span className="block max-w-[160px] truncate" title={value}>{value}</span> },
      { key: "objectName", label: "Объект", type: "text", searchable: true, render: (value) => <span className="block max-w-[160px] truncate" title={value}>{value}</span> },
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
      { key: "requestName", label: "Заявка", type: "text", searchable: true },
    ],
    onRowClick: (estimate) => setViewingEstimate(estimate),
    onDelete: (id) => { logButtonClick("estimates", "Удалить расчёт"); deleteMutation.mutate(id); },
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

  const handleSubmit = async (data: Partial<Estimate>) => {
    try {
      if (editingEstimate) {
        await updateMutation.mutateAsync({ id: editingEstimate.id, ...data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsFormOpen(false);
      setEditingEstimate(undefined);
    } catch (error) {
      // Error is handled by mutation's onError
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

      <EntityList
        items={listItems}
        config={config}
        defaultViewMode="table"
        onSearchChange={setSearchQuery}
        pagination={isSearching ? undefined : {
          page: currentPage,
          totalCount,
          pageSize: 50,
          onPageChange: setCurrentPage,
        }}
      />

      <Dialog open={isFormOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onMinimize={() => handleMinimize(minimizeFormDataRef.current)}>
          <DialogHeader>
            <DialogTitle>
              {editingEstimate ? "Редактировать расчёт" : "Создать расчёт"}
            </DialogTitle>
          </DialogHeader>
          <EstimateForm
            estimate={editingEstimate || (restoredFormData ? { ...restoredFormData, id: undefined } as any : undefined)}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingEstimate(undefined);
              setRestoredFormData(null);
            }}
            onGoToRequest={(requestId) => {
              setIsFormOpen(false);
              setEditingEstimate(undefined);
              navigate("/requests", { state: { openRequestId: requestId } });
            }}
            onMinimize={(formData) => { minimizeFormDataRef.current = formData; }}
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
