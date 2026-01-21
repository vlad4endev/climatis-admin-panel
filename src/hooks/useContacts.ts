import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Contact } from "@/types/contact";
import { toast } from "sonner";

interface ContactRow {
  id: string;
  client_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  is_main: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  clients?: {
    company_name: string;
  };
}

// Transform database row to frontend Contact type
const transformToContact = (row: ContactRow): Contact => ({
  id: row.id,
  clientId: row.client_id,
  name: row.name,
  phone: row.phone || "",
  email: row.email || "",
  isMain: row.is_main,
  notes: row.notes || "",
  createdAt: new Date(row.created_at),
  clientName: row.clients?.company_name,
});

// Transform frontend Contact to database insert format
const transformToInsert = (
  contact: Omit<Contact, "id" | "createdAt" | "clientName">
) => ({
  client_id: contact.clientId,
  name: contact.name,
  phone: contact.phone || "",
  email: contact.email || "",
  is_main: contact.isMain,
  notes: contact.notes || "",
});

export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select(`
          *,
          clients (
            company_name
          )
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching contacts:", error);
        throw error;
      }

      return (data as ContactRow[]).map(transformToContact);
    },
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: Omit<Contact, "id" | "createdAt" | "clientName">) => {
      const insertData = transformToInsert(contact);

      const { data, error } = await supabase
        .from("contacts")
        .insert(insertData)
        .select(`
          *,
          clients (
            company_name
          )
        `)
        .single();

      if (error) {
        console.error("Error creating contact:", error);
        throw error;
      }

      return transformToContact(data as ContactRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Контактное лицо создано");
    },
    onError: (error) => {
      console.error("Create contact error:", error);
      toast.error("Ошибка при создании контактного лица");
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...contact
    }: Omit<Contact, "createdAt" | "clientName"> & { id: string }) => {
      const updateData = transformToInsert(contact);

      const { data, error } = await supabase
        .from("contacts")
        .update(updateData)
        .eq("id", id)
        .select(`
          *,
          clients (
            company_name
          )
        `)
        .single();

      if (error) {
        console.error("Error updating contact:", error);
        throw error;
      }

      return transformToContact(data as ContactRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Контактное лицо обновлено");
    },
    onError: (error) => {
      console.error("Update contact error:", error);
      toast.error("Ошибка при обновлении контактного лица");
    },
  });
}

export function useUpdateContactField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      field,
      value,
    }: {
      id: string;
      field: string;
      value: unknown;
    }) => {
      // Map frontend field names to database column names
      const fieldMap: Record<string, string> = {
        clientId: "client_id",
        isMain: "is_main",
        name: "name",
        phone: "phone",
        email: "email",
        notes: "notes",
      };

      const dbField = fieldMap[field] || field;

      const { error } = await supabase
        .from("contacts")
        .update({ [dbField]: value })
        .eq("id", id);

      if (error) {
        console.error("Error updating contact field:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Данные обновлены");
    },
    onError: (error) => {
      console.error("Update field error:", error);
      toast.error("Ошибка при обновлении");
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contacts")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("Error deleting contact:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      toast.success("Контактное лицо перемещено в корзину");
    },
    onError: (error) => {
      console.error("Delete contact error:", error);
      toast.error("Ошибка при удалении контактного лица");
    },
  });
}
