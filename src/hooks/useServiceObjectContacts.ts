import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ServiceObjectContact {
  id: string;
  serviceObjectId: string;
  contactId: string;
}

interface ContactWithDetails {
  id: string;
  name: string;
  phone: string;
  email: string;
  isMain: boolean;
}

export function useServiceObjectContacts(serviceObjectId: string | undefined) {
  return useQuery({
    queryKey: ["service_object_contacts", serviceObjectId],
    queryFn: async () => {
      if (!serviceObjectId) return [];

      const { data, error } = await supabase
        .from("service_object_contacts")
        .select(`
          id,
          contact_id,
          contacts (
            id,
            name,
            phone,
            email,
            is_main
          )
        `)
        .eq("service_object_id", serviceObjectId);

      if (error) {
        console.error("Error fetching service object contacts:", error);
        throw error;
      }

      return data.map((row): ContactWithDetails => ({
        id: row.contacts?.id || "",
        name: row.contacts?.name || "",
        phone: row.contacts?.phone || "",
        email: row.contacts?.email || "",
        isMain: row.contacts?.is_main || false,
      }));
    },
    enabled: !!serviceObjectId,
  });
}

export function useContactsByClient(clientId: string | undefined) {
  return useQuery({
    queryKey: ["contacts_by_client", clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from("contacts")
        .select("id, name, phone, email, is_main")
        .eq("client_id", clientId)
        .order("is_main", { ascending: false })
        .order("name");

      if (error) {
        console.error("Error fetching contacts by client:", error);
        throw error;
      }

      return data.map((row): ContactWithDetails => ({
        id: row.id,
        name: row.name,
        phone: row.phone || "",
        email: row.email || "",
        isMain: row.is_main,
      }));
    },
    enabled: !!clientId,
  });
}

export function useAssignContactToServiceObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceObjectId,
      contactId,
    }: {
      serviceObjectId: string;
      contactId: string;
    }) => {
      const { error } = await supabase
        .from("service_object_contacts")
        .insert({
          service_object_id: serviceObjectId,
          contact_id: contactId,
        });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Контакт уже закреплён за объектом");
        }
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service_object_contacts", variables.serviceObjectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["service_objects"],
      });
      toast.success("Контакт закреплён за объектом");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка при закреплении контакта");
    },
  });
}

export function useRemoveContactFromServiceObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceObjectId,
      contactId,
    }: {
      serviceObjectId: string;
      contactId: string;
    }) => {
      const { error } = await supabase
        .from("service_object_contacts")
        .delete()
        .eq("service_object_id", serviceObjectId)
        .eq("contact_id", contactId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service_object_contacts", variables.serviceObjectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["service_objects"],
      });
      toast.success("Контакт откреплён от объекта");
    },
    onError: () => {
      toast.error("Ошибка при откреплении контакта");
    },
  });
}
