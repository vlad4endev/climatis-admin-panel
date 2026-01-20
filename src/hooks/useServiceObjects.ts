import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ServiceObject } from "@/types/serviceObject";
import { toast } from "sonner";

export function useServiceObjects() {
  return useQuery({
    queryKey: ["service_objects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_objects")
        .select(`
          *,
          client:clients(id, company_name),
          service_object_contacts(
            contact:contacts(id, name, phone, is_main)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((row): ServiceObject => ({
        id: row.id,
        clientId: row.client_id,
        clientName: row.client?.company_name || "",
        objectName: row.object_name,
        address: row.address || "",
        accessDescription: row.access_description || "",
        notes: row.notes || "",
        createdAt: new Date(row.created_at),
        assignedContacts: row.service_object_contacts?.map((soc: any) => ({
          id: soc.contact?.id || "",
          name: soc.contact?.name || "",
          phone: soc.contact?.phone || "",
          isMain: soc.contact?.is_main || false,
        })) || [],
      }));
    },
  });
}

export function useCreateServiceObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (obj: Omit<ServiceObject, "id" | "createdAt" | "clientName">) => {
      const { data, error } = await supabase
        .from("service_objects")
        .insert({
          client_id: obj.clientId,
          object_name: obj.objectName,
          address: obj.address,
          access_description: obj.accessDescription,
          notes: obj.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_objects"] });
      toast.success("Объект создан");
    },
    onError: () => toast.error("Ошибка при создании объекта"),
  });
}

export function useUpdateServiceObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...obj }: Omit<ServiceObject, "createdAt" | "clientName">) => {
      const { error } = await supabase
        .from("service_objects")
        .update({
          client_id: obj.clientId,
          object_name: obj.objectName,
          address: obj.address,
          access_description: obj.accessDescription,
          notes: obj.notes,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_objects"] });
      toast.success("Объект обновлён");
    },
    onError: () => toast.error("Ошибка при обновлении"),
  });
}

export function useDeleteServiceObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_objects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_objects"] });
      toast.success("Объект удалён");
    },
    onError: () => toast.error("Ошибка при удалении"),
  });
}
