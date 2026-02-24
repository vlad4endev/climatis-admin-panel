import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listQueryOptions } from "@/lib/queryConfig";
import { Request } from "@/types/request";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
import { getErrorMessage } from "@/lib/errorMessages";

export function useRequests() {
  return useQuery({
    queryKey: ["requests"],
    ...listQueryOptions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select(`
          *,
          client:clients(id, company_name),
          object:service_objects(id, object_name),
          contract:documents(id, contract_number, response_conditions),
          responsible_manager:employees!requests_responsible_manager_id_fkey(id, full_name),
          assigned_team:teams(id, name),
          assigned_engineer:employees!requests_assigned_engineer_id_fkey(id, full_name)
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((row): Request => ({
        id: row.id,
        requestNumber: row.request_number,
        createdAt: new Date(row.created_at),
        status: row.status,
        type: row.type,
        priority: row.priority,
        clientId: row.client_id,
        clientName: row.client?.company_name || "",
        objectId: row.object_id,
        objectName: row.object?.object_name || "",
        contractId: row.contract_id || undefined,
        contractNumber: row.contract?.contract_number || undefined,
        contractConditions: row.contract?.response_conditions || row.contract_conditions || undefined,
        problemDescription: row.problem_description || "",
        comments: row.comments || "",
        desiredDate: row.desired_date || undefined,
        responsibleManagerId: row.responsible_manager_id || undefined,
        responsibleManagerName: row.responsible_manager?.full_name || undefined,
        assignedTeamId: row.assigned_team_id || undefined,
        assignedTeamName: row.assigned_team?.name || undefined,
        assignedEngineerId: row.assigned_engineer_id || undefined,
        assignedEngineerName: row.assigned_engineer?.full_name || undefined,
        plannedVisitDate: row.planned_visit_date || undefined,
        actualStartTime: row.actual_start_time || undefined,
        actualEndTime: row.actual_end_time || undefined,
        hoursSpent: row.hours_spent ? Number(row.hours_spent) : undefined,
      }));
    },
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: Partial<Request>) => {
      const { data, error } = await supabase
        .from("requests")
        .insert({
          request_number: "",
          status: request.status || "new",
          type: request.type || "repair",
          priority: request.priority || "normal",
          client_id: request.clientId!,
          object_id: request.objectId!,
          contract_id: request.contractId || null,
          contract_conditions: request.contractConditions || null,
          problem_description: request.problemDescription || "",
          comments: request.comments || "",
          desired_date: request.desiredDate || null,
          responsible_manager_id: request.responsibleManagerId || null,
          assigned_team_id: request.assignedTeamId || null,
          assigned_engineer_id: request.assignedEngineerId || null,
          planned_visit_date: request.plannedVisitDate || null,
        })
        .select()
        .single();

      if (error) throw error;

      await logActivity({
        section: 'requests',
        elementId: data.id,
        elementName: data.request_number,
        action: 'create',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast.success("Заявка создана");
    },
    onError: (error) => toast.error(getErrorMessage(error, "создании заявки")),
  });
}

export function useUpdateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...request }: Partial<Request> & { id: string }) => {
      const { data: current } = await supabase
        .from("requests")
        .select("request_number")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("requests")
        .update({
          status: request.status,
          type: request.type,
          priority: request.priority,
          client_id: request.clientId,
          object_id: request.objectId,
          contract_id: request.contractId || null,
          contract_conditions: request.contractConditions || null,
          problem_description: request.problemDescription,
          comments: request.comments,
          desired_date: request.desiredDate || null,
          responsible_manager_id: request.responsibleManagerId || null,
          assigned_team_id: request.assignedTeamId || null,
          assigned_engineer_id: request.assignedEngineerId || null,
          planned_visit_date: request.plannedVisitDate || null,
          actual_start_time: request.actualStartTime || null,
          actual_end_time: request.actualEndTime || null,
          hours_spent: request.hoursSpent || null,
        })
        .eq("id", id);

      if (error) throw error;

      await logActivity({
        section: 'requests',
        elementId: id,
        elementName: current?.request_number || 'Заявка',
        action: 'update',
        changes: { status: request.status, priority: request.priority, type: request.type },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast.success("Заявка обновлена");
    },
    onError: (error) => toast.error(getErrorMessage(error, "обновлении заявки")),
  });
}

export function useDeleteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: req } = await supabase
        .from("requests")
        .select("request_number")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("requests")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      await logActivity({
        section: 'requests',
        elementId: id,
        elementName: req?.request_number || 'Заявка',
        action: 'delete',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      toast.success("Заявка перемещена в корзину");
    },
    onError: (error) => toast.error(getErrorMessage(error, "удалении заявки")),
  });
}

export function useCopyRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: Request) => {
      const { data, error } = await supabase
        .from("requests")
        .insert({
          request_number: "",
          status: "draft",
          type: request.type,
          priority: request.priority,
          client_id: request.clientId,
          object_id: request.objectId,
          contract_id: request.contractId || null,
          contract_conditions: request.contractConditions || null,
          problem_description: `Копия: ${request.problemDescription}`,
          comments: request.comments || "",
          desired_date: request.desiredDate || null,
          responsible_manager_id: request.responsibleManagerId || null,
          assigned_team_id: request.assignedTeamId || null,
          assigned_engineer_id: request.assignedEngineerId || null,
          planned_visit_date: null,
        })
        .select()
        .single();

      if (error) throw error;

      await logActivity({
        section: 'requests',
        elementId: data.id,
        elementName: data.request_number,
        action: 'create',
        changes: { copiedFrom: request.requestNumber },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast.success("Заявка скопирована");
    },
    onError: (error) => toast.error(getErrorMessage(error, "копировании заявки")),
  });
}
