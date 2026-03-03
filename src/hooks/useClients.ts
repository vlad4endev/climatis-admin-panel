import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { refQueryOptions } from "@/lib/queryConfig";
import { Client } from "@/types/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { logActivity } from "@/lib/activityLogger";
import { getErrorMessage } from "@/lib/errorMessages";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

const transformToClient = (row: ClientRow): Client => ({
  id: row.id,
  companyName: row.company_name,
  type: row.type,
  division: row.division || "",
  requisites: (row as any).requisites || "",
  notes: row.notes || "",
  createdAt: new Date(row.created_at),
});

const transformToInsert = (
  client: Omit<Client, "id" | "createdAt">
): Omit<ClientInsert, "id" | "created_at" | "updated_at"> => ({
  company_name: client.companyName,
  type: client.type,
  division: client.division || "",
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
    ...refQueryOptions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
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

      if (error) throw error;

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
    onError: (error) => toast.error(getErrorMessage(error, "создании организации")),
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

      if (error) throw error;

      await logActivity({
        section: 'clients',
        elementId: id,
        elementName: data.company_name,
        action: 'update',
        changes: { companyName: client.companyName, type: client.type, division: client.division },
      });

      return transformToClient(data);
    },
    onMutate: async ({ id, ...client }) => {
      await queryClient.cancelQueries({ queryKey: ["clients"] });
      const previous = queryClient.getQueryData<Client[]>(["clients"]);
      if (previous) {
        queryClient.setQueryData<Client[]>(["clients"], old =>
          old?.map(c => c.id === id ? { ...c, ...client } : c) ?? []
        );
      }
      return { previous };
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["clients"], context.previous);
      }
      toast.error(getErrorMessage(error, "обновлении организации"));
    },
    onSuccess: () => {
      toast.success("Организация обновлена");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
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
      const fieldMap: Record<string, string> = {
        companyName: "company_name",
        type: "type",
        division: "division",
        requisites: "requisites",
        notes: "notes",
      };

      const dbField = fieldMap[field] || field;

      const { data: current } = await supabase
        .from("clients")
        .select("company_name")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("clients")
        .update({ [dbField]: value })
        .eq("id", id);

      if (error) throw error;

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
    onError: (error) => toast.error(getErrorMessage(error, "обновлении данных организации")),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: client } = await supabase
        .from("clients")
        .select("company_name")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("clients")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      await logActivity({
        section: 'clients',
        elementId: id,
        elementName: client?.company_name || 'Контрагент',
        action: 'delete',
      });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["clients"] });
      const previous = queryClient.getQueryData<Client[]>(["clients"]);
      if (previous) {
        queryClient.setQueryData<Client[]>(["clients"], old =>
          old?.filter(c => c.id !== id) ?? []
        );
      }
      return { previous };
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["clients"], context.previous);
      }
      toast.error(getErrorMessage(error, "удалении организации"));
    },
    onSuccess: () => {
      toast.success("Организация перемещена в корзину");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
    },
  });
}
