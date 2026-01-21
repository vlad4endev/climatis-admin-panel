import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Document } from "@/types/document";
import { toast } from "sonner";

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
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
        fileName: row.file_name || undefined,
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
          file_name: doc.fileName || null,
          status: doc.status || 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Договор создан");
    },
    onError: () => toast.error("Ошибка при создании договора"),
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
          file_name: doc.fileName || null,
          status: doc.status,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Договор обновлён");
    },
    onError: () => toast.error("Ошибка при обновлении"),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("documents")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      toast.success("Договор перемещён в корзину");
    },
    onError: () => toast.error("Ошибка при удалении"),
  });
}
