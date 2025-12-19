import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client, AdditionalContact } from "@/types/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

// Transform database row to frontend Client type
const transformToClient = (row: ClientRow): Client => ({
  id: row.id,
  companyName: row.company_name,
  type: row.type,
  division: row.division || "",
  mainContactName: row.main_contact_name,
  phone: row.phone,
  email: row.email || "",
  additionalContacts: (row.additional_contacts as unknown as AdditionalContact[]) || [],
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
  main_contact_name: client.mainContactName,
  phone: client.phone,
  email: client.email || "",
  additional_contacts: client.additionalContacts as unknown as Database["public"]["Tables"]["clients"]["Insert"]["additional_contacts"],
  notes: client.notes || "",
});

export function useClients() {
  return useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
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
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Error creating client:", error);
        throw error;
      }

      return transformToClient(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Клиент успешно создан");
    },
    onError: (error) => {
      console.error("Create client error:", error);
      toast.error("Ошибка при создании клиента");
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
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating client:", error);
        throw error;
      }

      return transformToClient(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Клиент обновлён");
    },
    onError: (error) => {
      console.error("Update client error:", error);
      toast.error("Ошибка при обновлении клиента");
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
        mainContactName: "main_contact_name",
        additionalContacts: "additional_contacts",
        type: "type",
        division: "division",
        phone: "phone",
        email: "email",
        notes: "notes",
      };

      const dbField = fieldMap[field] || field;

      const { error } = await supabase
        .from("clients")
        .update({ [dbField]: value })
        .eq("id", id);

      if (error) {
        console.error("Error updating client field:", error);
        throw error;
      }
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
      const { error } = await supabase.from("clients").delete().eq("id", id);

      if (error) {
        console.error("Error deleting client:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Клиент удалён");
    },
    onError: (error) => {
      console.error("Delete client error:", error);
      toast.error("Ошибка при удалении клиента");
    },
  });
}
