import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { refQueryOptions } from "@/lib/queryConfig";
import { ServiceObject } from "@/types/serviceObject";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
import { getErrorMessage } from "@/lib/errorMessages";

export function useServiceObjects() {
  return useQuery({
    queryKey: ["service_objects"],
    ...refQueryOptions,
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
        .is("deleted_at", null)
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
    mutationFn: async ({ contactId, ...obj }: Omit<ServiceObject, "id" | "createdAt" | "clientName"> & { contactId?: string }) => {
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

      // Привязываем контакт, если указан
      if (contactId && data) {
        const { error: contactError } = await supabase
          .from("service_object_contacts")
          .insert({
            service_object_id: data.id,
            contact_id: contactId,
          });

        if (contactError) throw contactError;
      }

      // Log activity
      await logActivity({
        section: 'serviceObjects',
        elementId: data.id,
        elementName: data.object_name,
        action: 'create',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_objects"] });
      toast.success("Объект создан");
    },
    onError: (error) => toast.error(getErrorMessage(error, "создании объекта")),
  });
}

export function useUpdateServiceObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, contactId, ...obj }: Omit<ServiceObject, "createdAt" | "clientName"> & { contactId?: string }) => {
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

      // Обновляем контакт: удаляем старые и добавляем новый
      const { error: deleteContactsError } = await supabase
        .from("service_object_contacts")
        .delete()
        .eq("service_object_id", id);

      if (deleteContactsError) throw deleteContactsError;

      if (contactId) {
        const { error: contactError } = await supabase
          .from("service_object_contacts")
          .insert({
            service_object_id: id,
            contact_id: contactId,
          });

        if (contactError) throw contactError;
      }

      // Log activity
      await logActivity({
        section: 'serviceObjects',
        elementId: id,
        elementName: obj.objectName,
        action: 'update',
        changes: { objectName: obj.objectName, address: obj.address },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_objects"] });
      toast.success("Объект обновлён");
    },
    onError: (error) => toast.error(getErrorMessage(error, "обновлении объекта")),
  });
}

export function useDeleteServiceObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get name for logging
      const { data: obj } = await supabase
        .from("service_objects")
        .select("object_name")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("service_objects")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      // Log activity
      await logActivity({
        section: 'serviceObjects',
        elementId: id,
        elementName: obj?.object_name || 'Объект',
        action: 'delete',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service_objects"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      toast.success("Объект перемещён в корзину");
    },
    onError: (error) => toast.error(getErrorMessage(error, "удалении объекта")),
  });
}
