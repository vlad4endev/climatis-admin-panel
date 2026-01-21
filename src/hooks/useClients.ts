import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { logActivity } from "@/lib/activityLogger";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

// Transform database row to frontend Client type
const transformToClient = (row: ClientRow): Client => ({
  id: row.id,
  companyName: row.company_name,
  type: row.type,
  division: row.division || "",
  requisites: (row as any).requisites || "",
  notes: row.notes || "",
  createdAt: new Date(row.created_at),
});

// Transform frontend Client to database insert format
const transformToInsert = (
  client: Omit<Client, "id" | "createdAt">
): Omit<ClientInsert, "id" | "created_at" | "updated_at"> => ({
  company_name: client.companyName,
  type: client.type,
  division: client.division || "",
  // These fields are now managed in contacts table, but still required by DB
  main_contact_name: "-",
  phone: "-",
  email: "",
  additional_contacts: [],
  requisites: client.requisites || "",
  notes: client.notes || "",
});

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching clients:", error);
        throw error;
      }

      return data.map(transformToClient);
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (client: Omit<Client, "id" | "createdAt">) => {
      const insertData = transformToInsert(client);
      
      const { data, error } = await supabase
        .from("clients")
        .insert(insertData as any)
        .select()
        .single();

      if (error) {
        console.error("Error creating client:", error);
        throw error;
      }

      // Log activity
      await logActivity({
        section: 'clients',
        elementId: data.id,
        elementName: data.company_name,
        action: 'create',
      });

      return transformToClient(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Организация успешно создана");
    },
    onError: (error) => {
      console.error("Create client error:", error);
      toast.error("Ошибка при создании организации");
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...client
    }: Omit<Client, "createdAt"> & { id: string }) => {
      const updateData = transformToInsert(client);

      const { data, error } = await supabase
        .from("clients")
        .update(updateData as any)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating client:", error);
        throw error;
      }

      // Log activity
      await logActivity({
        section: 'clients',
        elementId: id,
        elementName: data.company_name,
        action: 'update',
        changes: { companyName: client.companyName, type: client.type, division: client.division },
      });

      return transformToClient(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Организация обновлена");
    },
    onError: (error) => {
      console.error("Update client error:", error);
      toast.error("Ошибка при обновлении организации");
    },
  });
}

export function useUpdateClientField() {
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
        companyName: "company_name",
        type: "type",
        division: "division",
        requisites: "requisites",
        notes: "notes",
      };

      const dbField = fieldMap[field] || field;

      // Get current name for logging
      const { data: current } = await supabase
        .from("clients")
        .select("company_name")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("clients")
        .update({ [dbField]: value })
        .eq("id", id);

      if (error) {
        console.error("Error updating client field:", error);
        throw error;
      }

      // Log activity
      await logActivity({
        section: 'clients',
        elementId: id,
        elementName: current?.company_name || 'Контрагент',
        action: 'update',
        changes: { [field]: value },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Данные обновлены");
    },
    onError: (error) => {
      console.error("Update field error:", error);
      toast.error("Ошибка при обновлении");
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get name for logging before delete
      const { data: client } = await supabase
        .from("clients")
        .select("company_name")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("clients")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("Error deleting client:", error);
        throw error;
      }

      // Log activity
      await logActivity({
        section: 'clients',
        elementId: id,
        elementName: client?.company_name || 'Контрагент',
        action: 'delete',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      toast.success("Организация перемещена в корзину");
    },
    onError: (error) => {
      console.error("Delete client error:", error);
      toast.error("Ошибка при удалении организации");
    },
  });
}
