import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listQueryOptions } from "@/lib/queryConfig";
import { Assignment } from "@/types/assignment";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
import { getErrorMessage } from "@/lib/errorMessages";

export function useAssignments() {
  return useQuery({
    queryKey: ["assignments"],
    ...listQueryOptions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assignments")
        .select(`
          *,
          team:teams(id, name),
          request:requests(
            id,
            request_number,
            client:clients(id, company_name),
            object:service_objects(id, object_name)
          ),
          estimate:estimates(
            id,
            name,
            engineer_comment,
            work_blocks(
              id,
              description,
              rows:work_rows(*)
            ),
            materials:estimate_materials(*)
          )
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((row): Assignment => ({
        id: row.id,
        assignmentNumber: row.assignment_number,
        createdAt: row.created_at,
        status: row.status,
        requestId: row.request_id,
        requestNumber: row.request?.request_number || "",
        estimateId: row.estimate_id,
        estimateName: row.estimate?.name || "",
        teamId: row.team_id,
        teamName: row.team?.name || "",
        clientName: row.request?.client?.company_name || "",
        objectName: row.request?.object?.object_name || "",
        workBlocks: row.estimate?.work_blocks?.map((wb: any) => ({
          id: wb.id,
          description: wb.description || "",
          rows: wb.rows?.map((r: any) => ({
            category: r.category,
            planHours: Number(r.plan_hours) || 0,
            quantity: Number(r.quantity) || 0,
            rate: Number(r.rate) || 0,
          })) || [],
        })) || [],
        materials: row.estimate?.materials?.map((m: any) => ({
          id: m.id,
          materialId: m.spare_part_id || undefined,
          materialName: m.material_name,
          quantity: Number(m.quantity) || 0,
          pricePerUnit: Number(m.price_per_unit) || 0,
        })) || [],
        comments: row.comments || "",
        engineerComment: row.estimate?.engineer_comment || "",
      }));
    },
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignment: Partial<Assignment>) => {
      const { data, error } = await supabase
        .from("assignments")
        .insert({
          assignment_number: assignment.assignmentNumber?.trim() || "",
          status: assignment.status || "draft",
          request_id: assignment.requestId,
          estimate_id: assignment.estimateId,
          team_id: assignment.teamId,
          comments: assignment.comments || "",
        })
        .select()
        .single();

      if (error) throw error;

      await logActivity({
        section: 'assignments',
        elementId: data.id,
        elementName: data.assignment_number,
        action: 'create',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Задание создано");
    },
    onError: (error) => toast.error(getErrorMessage(error, "создании задания")),
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...assignment }: Partial<Assignment> & { id: string }) => {
      const { data: current } = await supabase
        .from("assignments")
        .select("assignment_number")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("assignments")
        .update({
          status: assignment.status,
          team_id: assignment.teamId,
          comments: assignment.comments || "",
        })
        .eq("id", id);

      if (error) throw error;

      await logActivity({
        section: 'assignments',
        elementId: id,
        elementName: current?.assignment_number || 'Наряд',
        action: 'update',
        changes: { status: assignment.status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Задание обновлено");
    },
    onError: (error) => toast.error(getErrorMessage(error, "обновлении задания")),
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: assignment } = await supabase
        .from("assignments")
        .select("assignment_number")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("assignments")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      await logActivity({
        section: 'assignments',
        elementId: id,
        elementName: assignment?.assignment_number || 'Наряд',
        action: 'delete',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      toast.success("Задание перемещено в корзину");
    },
    onError: (error) => toast.error(getErrorMessage(error, "удалении задания")),
  });
}
