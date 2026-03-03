import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listQueryOptions } from "@/lib/queryConfig";
import { Document } from "@/types/document";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
import { getErrorMessage } from "@/lib/errorMessages";

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    ...listQueryOptions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select(`
          *,
          client:clients(id, company_name),
          object:service_objects(id, object_name)
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((row): Document => ({
        id: row.id,
        contractNumber: row.contract_number,
        startDate: row.start_date,
        endDate: row.end_date,
        contractType: row.contract_type,
        clientId: row.client_id,
        clientName: row.client?.company_name || "",
        objectId: row.object_id || undefined,
        objectName: row.object?.object_name || undefined,
        responseConditions: row.response_conditions || "",
        notes: row.notes || "",
        status: row.status || 'draft',
      }));
    },
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: Omit<Document, "id" | "clientName" | "objectName">) => {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          contract_number: doc.contractNumber,
          start_date: doc.startDate,
          end_date: doc.endDate,
          contract_type: doc.contractType,
          client_id: doc.clientId,
          object_id: doc.objectId || null,
          response_conditions: doc.responseConditions,
          notes: doc.notes,
          status: doc.status || 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      
      // Log activity
      await logActivity({
        section: 'documents',
        elementId: data.id,
        elementName: data.contract_number,
        action: 'create',
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Договор создан");
    },
    onError: (error) => toast.error(getErrorMessage(error, "создании договора")),
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...doc }: Omit<Document, "clientName" | "objectName">) => {
      const { error } = await supabase
        .from("documents")
        .update({
          contract_number: doc.contractNumber,
          start_date: doc.startDate,
          end_date: doc.endDate,
          contract_type: doc.contractType,
          client_id: doc.clientId,
          object_id: doc.objectId || null,
          response_conditions: doc.responseConditions,
          notes: doc.notes,
          status: doc.status,
        })
        .eq("id", id);

      if (error) throw error;
      
      await logActivity({
        section: 'documents',
        elementId: id,
        elementName: doc.contractNumber,
        action: 'update',
      });
    },
    onMutate: async ({ id, ...doc }) => {
      await queryClient.cancelQueries({ queryKey: ["documents"] });
      const previous = queryClient.getQueryData<Document[]>(["documents"]);
      if (previous) {
        queryClient.setQueryData<Document[]>(["documents"], old =>
          old?.map(d => d.id === id ? { ...d, ...doc } : d) ?? []
        );
      }
      return { previous };
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["documents"], context.previous);
      }
      toast.error(getErrorMessage(error, "обновлении договора"));
    },
    onSuccess: () => {
      toast.success("Договор обновлён");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: doc } = await supabase
        .from("documents")
        .select("contract_number")
        .eq("id", id)
        .single();
      
      const { error } = await supabase
        .from("documents")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      
      await logActivity({
        section: 'documents',
        elementId: id,
        elementName: doc?.contract_number || 'Документ',
        action: 'delete',
      });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["documents"] });
      const previous = queryClient.getQueryData<Document[]>(["documents"]);
      if (previous) {
        queryClient.setQueryData<Document[]>(["documents"], old =>
          old?.filter(d => d.id !== id) ?? []
        );
      }
      return { previous };
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["documents"], context.previous);
      }
      toast.error(getErrorMessage(error, "удалении договора"));
    },
    onSuccess: () => {
      toast.success("Договор перемещён в корзину");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
    },
  });
}
