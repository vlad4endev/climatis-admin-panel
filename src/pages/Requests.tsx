import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig, CardAction } from "@/components/entity/types";
import { Request, REQUEST_STATUSES, REQUEST_TYPES } from "@/types/request";
import { RequestForm } from "@/components/requests/RequestForm";
import { RequestViewDialog } from "@/components/requests/RequestViewDialog";
import { Loader2, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { useRequests, usePaginatedRequests, useCreateRequest, useUpdateRequest, useDeleteRequest, useCopyRequest } from "@/hooks/useRequests";
import { useClients } from "@/hooks/useClients";
import { useServiceObjects } from "@/hooks/useServiceObjects";
import { useDocuments } from "@/hooks/useDocuments";
import { useEmployees } from "@/hooks/useEmployees";
import { useTeams } from "@/hooks/useTeams";
import { useCanEdit } from "@/hooks/useUserRoles";
import { logButtonClick } from "@/lib/monitoringLogger";
import { useMinimizedForms } from "@/hooks/useMinimizedForms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Requests() {
  const location = useLocation();
  const navigate = useNavigate();
  const { minimize, restore, registerRestoreHandler, unregisterRestoreHandler } = useMinimizedForms();
  const isMinimizingRef = React.useRef(false);

  const [currentPage, setCurrentPage] = useState(0);
  const { data: requestsResult, isLoading: requestsLoading } = usePaginatedRequests(currentPage);
  const requests = requestsResult?.items || [];
  const totalCount = requestsResult?.totalCount || 0;
  const { data: clients = [] } = useClients();
  const { data: serviceObjects = [] } = useServiceObjects();
  const { data: documents = [] } = useDocuments();
  const { data: employees = [] } = useEmployees();
  const { data: teams = [] } = useTeams();
  const { canEdit } = useCanEdit("requests");
  
  const createRequest = useCreateRequest();
  const updateRequest = useUpdateRequest();
  const deleteRequest = useDeleteRequest();
  const copyRequest = useCopyRequest();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Request | undefined>();
  const [viewingRequest, setViewingRequest] = useState<Request | null>(null);

  // Restore form from global context or open request by ID from navigation state
  useEffect(() => {
    const state = location.state as { 
      restoreForm?: { type: string; entityId?: string };
      openRequestId?: string;
    } | null;
    
    if (state?.restoreForm?.type === "request") {
      const entityId = state.restoreForm.entityId;
      if (entityId) {
        const req = requests.find(r => r.id === entityId);
        if (req) setEditingRequest(req);
      }
      setIsFormOpen(true);
      window.history.replaceState({}, document.title);
    } else if (state?.openRequestId) {
      const req = requests.find(r => r.id === state.openRequestId);
      if (req) {
        setEditingRequest(req);
        setIsFormOpen(true);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, requests]);

  const handleMinimize = () => {
    const title = editingRequest
      ? `Редактирование: ${editingRequest.requestNumber}`
      : 'Новая заявка';
    minimize({
      id: `request-${editingRequest?.id || 'new'}`,
      type: "request",
      title,
      entityId: editingRequest?.id,
      route: "/requests",
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
        setEditingRequest(undefined);
      }
    }
  };

  const handleRestore = useCallback((formId: string) => {
    const form = restore(formId);
    if (form && form.type === "request") {
      if (form.entityId) {
        const req = requests.find(r => r.id === form.entityId);
        if (req) setEditingRequest(req);
      }
      setIsFormOpen(true);
    }
  }, [restore, requests]);

  useEffect(() => {
    registerRestoreHandler("request", handleRestore);
    return () => unregisterRestoreHandler("request");
  }, [handleRestore, registerRestoreHandler, unregisterRestoreHandler]);

  const handleGoToEstimate = useCallback(async (requestId: string) => {
    try {
      // Check if estimate already exists for this request
      const { data: existingEstimates } = await supabase
        .from("estimates")
        .select("id")
        .eq("request_id", requestId)
        .is("deleted_at", null)
        .limit(1);

      if (existingEstimates && existingEstimates.length > 0) {
        // Navigate to estimates page and open existing estimate
        setIsFormOpen(false);
        setEditingRequest(undefined);
        navigate("/estimates", { state: { openEstimateId: existingEstimates[0].id } });
      } else {
        // Create new estimate linked to this request
        const request = requests.find(r => r.id === requestId);
        const { data: newEstimate, error } = await supabase
          .from("estimates")
          .insert({
            estimate_number: "",
            name: request ? `Расчёт по заявке ${request.requestNumber}` : "Новый расчёт",
            request_id: requestId,
            estimate_date: new Date().toISOString().split('T')[0],
            status: "черновик",
            type: "простой ремонт",
            customer_calculation: JSON.stringify({ overheadPercent: 95, transportPercent: 6, warehousePercent: 3, estimatedProfitPercent: 58 }),
          })
          .select("id")
          .single();

        if (error) throw error;

        setIsFormOpen(false);
        setEditingRequest(undefined);
        toast.success("Расчёт создан");
        navigate("/estimates", { state: { openEstimateId: newEstimate.id } });
      }
    } catch (error) {
      console.error("Error navigating to estimate:", error);
      toast.error("Ошибка при переходе к расчёту");
    }
  }, [requests, navigate]);

  const cardActions: CardAction<Request>[] = canEdit ? [
    {
      icon: Copy,
      label: "Копировать",
      onClick: (item) => { logButtonClick("requests", "Копировать заявку"); copyRequest.mutate(item); },
      disabled: copyRequest.isPending,
    },
  ] : [];

  const config: EntityListConfig<Request> = {
    fields: [
      { 
        key: "requestNumber", 
        label: "Номер", 
        type: "text", 
        sortable: true, 
        searchable: true,
        editable: false,
        render: (value) => <span className="font-medium">{value}</span>,
        cellClassName: (item) => item.priority === "urgent" ? "ring-2 ring-inset ring-red-500 rounded" : ""
      },
      { 
        key: "status", 
        label: "Статус", 
        type: "select",
        options: REQUEST_STATUSES,
        sortable: true,
        filterable: true,
        editable: false,
        render: (value) => {
          const status = REQUEST_STATUSES.find(s => s.value === value);
          const variantMap: Record<string, { bg: string; text: string }> = {
            new: { bg: "bg-blue-500", text: "text-white" },
            needs_calculation: { bg: "bg-purple-500", text: "text-white" },
            awaiting_materials: { bg: "bg-orange-500", text: "text-white" },
            in_progress: { bg: "bg-cyan-500", text: "text-white" },
            partially_completed: { bg: "bg-yellow-500", text: "text-white" },
            completed: { bg: "bg-green-500", text: "text-white" },
            closed: { bg: "bg-gray-400", text: "text-white" },
          };
          const variant = variantMap[value as string];
          return (
            <Badge className={`${variant?.bg} ${variant?.text} border-transparent px-2 text-xs`}>
              {status?.label}
            </Badge>
          );
        }
      },
      { 
        key: "type", 
        label: "Тип", 
        type: "select",
        options: REQUEST_TYPES,
        filterable: true,
        editable: false,
        render: (value) => REQUEST_TYPES.find(t => t.value === value)?.label
      },
      { 
        key: "clientObject", 
        label: "Контрагент / Объект", 
        type: "text",
        searchable: true,
        editable: false,
        getValue: (item) => `${item.clientName} / ${item.objectName}`,
        render: (_, item) => (
          <div className="text-sm">
            <div className="font-medium">{item.clientName}</div>
            <div className="text-muted-foreground text-xs">{item.objectName}</div>
          </div>
        )
      },
      { 
        key: "problemDescription", 
        label: "Проблема", 
        type: "textarea",
        searchable: true,
        editable: false,
        render: (value) => (
          <div className="max-w-[200px] truncate" title={value}>{value}</div>
        )
      },
      { 
        key: "createdAt", 
        label: "Созд.", 
        type: "date",
        sortable: true,
        editable: false,
        render: (value) => new Date(value).toLocaleDateString("ru-RU")
      },
      { 
        key: "desiredDate", 
        label: "Срок", 
        type: "date",
        editable: false,
        render: (value) => value ? new Date(value).toLocaleDateString("ru-RU") : "-"
      },
      { 
        key: "assignedTeamName", 
        label: "Бригада", 
        type: "text",
        editable: false
      },
    ],
    getItemId: (item) => item.id,
    onRowClick: (item) => setViewingRequest(item),
    onDelete: canEdit ? (id) => { logButtonClick("requests", "Удалить заявку"); deleteRequest.mutate(id); } : undefined,
    onEdit: canEdit ? (item) => { setEditingRequest(item); setIsFormOpen(true); } : undefined,
    cardActions,
    customActions: canEdit ? (item) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          copyRequest.mutate(item);
        }}
        title="Копировать заявку"
        disabled={copyRequest.isPending}
      >
        <Copy className="h-4 w-4" />
      </Button>
    ) : undefined,
  };

  const handleSubmit = async (data: Partial<Request>) => {
    if (editingRequest) {
      await updateRequest.mutateAsync({ id: editingRequest.id, ...data });
    } else {
      await createRequest.mutateAsync(data);
    }
    setIsFormOpen(false);
    setEditingRequest(undefined);
  };

  if (requestsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Заявки"
        description="Управление заявками на обслуживание"
        buttonLabel={canEdit ? "Создать заявку" : undefined}
        onButtonClick={canEdit ? () => setIsFormOpen(true) : undefined}
      />

      <EntityList
        items={requests}
        config={config}
        emptyMessage="Нет заявок"
        kanbanGroupField="status"
        kanbanColumns={REQUEST_STATUSES}
        pagination={{
          page: currentPage,
          totalCount,
          pageSize: 50,
          onPageChange: setCurrentPage,
        }}
      />

      <Dialog open={isFormOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onMinimize={handleMinimize}>
          <DialogHeader>
            <DialogTitle>{editingRequest ? "Редактировать заявку" : "Создать заявку"}</DialogTitle>
          </DialogHeader>
          <RequestForm
            initialData={editingRequest}
            onSubmit={handleSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingRequest(undefined); }}
            onGoToEstimate={canEdit ? handleGoToEstimate : undefined}
            clients={clients.map(c => ({ id: c.id, companyName: c.companyName }))}
            serviceObjects={serviceObjects.map(o => ({ id: o.id, objectName: o.objectName, clientId: o.clientId }))}
            documents={documents.map(d => ({ id: d.id, contractNumber: d.contractNumber, clientId: d.clientId, responseConditions: d.responseConditions }))}
            employees={employees.map(e => ({ id: e.id, fullName: e.fullName }))}
            teams={teams.map(t => ({ id: t.id, teamName: t.name }))}
          />
        </DialogContent>
      </Dialog>

      <RequestViewDialog
        request={viewingRequest}
        open={!!viewingRequest}
        onOpenChange={(open) => !open && setViewingRequest(null)}
      />
    </div>
  );
}
