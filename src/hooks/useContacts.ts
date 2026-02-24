import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { refQueryOptions } from "@/lib/queryConfig";
import { Contact } from "@/types/contact";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
import { getErrorMessage } from "@/lib/errorMessages";

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
    ...refQueryOptions,
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

      // Log activity
      await logActivity({
        section: 'contacts',
        elementId: data.id,
        elementName: data.name,
        action: 'create',
      });

      return transformToContact(data as ContactRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Контактное лицо создано");
    },
    onError: (error) => toast.error(getErrorMessage(error, "создании контактного лица")),
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

      // Log activity
      await logActivity({
        section: 'contacts',
        elementId: id,
        elementName: data.name,
        action: 'update',
        changes: { name: contact.name, phone: contact.phone, email: contact.email },
      });

      return transformToContact(data as ContactRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Контактное лицо обновлено");
    },
    onError: (error) => toast.error(getErrorMessage(error, "обновлении контактного лица")),
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

      // Get current name for logging
      const { data: current } = await supabase
        .from("contacts")
        .select("name")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("contacts")
        .update({ [dbField]: value })
        .eq("id", id);

      if (error) {
        console.error("Error updating contact field:", error);
        throw error;
      }

      // Log activity
      await logActivity({
        section: 'contacts',
        elementId: id,
        elementName: current?.name || 'Контакт',
        action: 'update',
        changes: { [field]: value },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Данные обновлены");
    },
    onError: (error) => toast.error(getErrorMessage(error, "обновлении данных контакта")),
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get name for logging
      const { data: contact } = await supabase
        .from("contacts")
        .select("name")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("contacts")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("Error deleting contact:", error);
        throw error;
      }

      // Log activity
      await logActivity({
        section: 'contacts',
        elementId: id,
        elementName: contact?.name || 'Контакт',
        action: 'delete',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      toast.success("Контактное лицо перемещено в корзину");
    },
    onError: (error) => toast.error(getErrorMessage(error, "удалении контактного лица")),
  });
}
