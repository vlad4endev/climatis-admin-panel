import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TrashItemType = 
  | "requests" 
  | "documents" 
  | "estimates" 
  | "assignments" 
  | "clients" 
  | "service_objects" 
  | "contacts" 
  | "tasks";

export interface TrashItem {
  id: string;
  type: TrashItemType;
  name: string;
  deletedAt: string;
  metadata?: Record<string, unknown>;
}

const TYPE_LABELS: Record<TrashItemType, string> = {
  requests: "Заявка",
  documents: "Договор",
  estimates: "Расчёт",
  assignments: "Задание",
  clients: "Организация",
  service_objects: "Объект",
  contacts: "Контактное лицо",
  tasks: "Задача",
};

export function getTypeLabel(type: TrashItemType): string {
  return TYPE_LABELS[type];
}

export function useTrashItems() {
  return useQuery({
    queryKey: ["trash"],
    queryFn: async () => {
      const items: TrashItem[] = [];

      // Fetch deleted requests
      const { data: requests } = await supabase
        .from("requests")
        .select("id, request_number, deleted_at")
        .not("deleted_at", "is", null);
      
      requests?.forEach((r) => items.push({
        id: r.id,
        type: "requests",
        name: `Заявка №${r.request_number}`,
        deletedAt: r.deleted_at!,
      }));

      // Fetch deleted documents
      const { data: documents } = await supabase
        .from("documents")
        .select("id, contract_number, deleted_at")
        .not("deleted_at", "is", null);
      
      documents?.forEach((d) => items.push({
        id: d.id,
        type: "documents",
        name: `Договор ${d.contract_number}`,
        deletedAt: d.deleted_at!,
      }));

      // Fetch deleted estimates
      const { data: estimates } = await supabase
        .from("estimates")
        .select("id, estimate_number, name, deleted_at")
        .not("deleted_at", "is", null);
      
      estimates?.forEach((e) => items.push({
        id: e.id,
        type: "estimates",
        name: `${e.estimate_number} - ${e.name}`,
        deletedAt: e.deleted_at!,
      }));

      // Fetch deleted assignments
      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, assignment_number, deleted_at")
        .not("deleted_at", "is", null);
      
      assignments?.forEach((a) => items.push({
        id: a.id,
        type: "assignments",
        name: `Задание ${a.assignment_number}`,
        deletedAt: a.deleted_at!,
      }));

      // Fetch deleted clients
      const { data: clients } = await supabase
        .from("clients")
        .select("id, company_name, deleted_at")
        .not("deleted_at", "is", null);
      
      clients?.forEach((c) => items.push({
        id: c.id,
        type: "clients",
        name: c.company_name,
        deletedAt: c.deleted_at!,
      }));

      // Fetch deleted service objects
      const { data: serviceObjects } = await supabase
        .from("service_objects")
        .select("id, object_name, deleted_at")
        .not("deleted_at", "is", null);
      
      serviceObjects?.forEach((s) => items.push({
        id: s.id,
        type: "service_objects",
        name: s.object_name,
        deletedAt: s.deleted_at!,
      }));

      // Fetch deleted contacts
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, name, deleted_at")
        .not("deleted_at", "is", null);
      
      contacts?.forEach((c) => items.push({
        id: c.id,
        type: "contacts",
        name: c.name,
        deletedAt: c.deleted_at!,
      }));

      // Fetch deleted tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id, title, deleted_at")
        .not("deleted_at", "is", null);
      
      tasks?.forEach((t) => items.push({
        id: t.id,
        type: "tasks",
        name: t.title,
        deletedAt: t.deleted_at!,
      }));

      // Sort by deleted_at descending
      return items.sort((a, b) => 
        new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
      );
    },
  });
}

export function useRestoreItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: TrashItemType }) => {
      const { error } = await supabase
        .from(type)
        .update({ deleted_at: null })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { type }) => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      queryClient.invalidateQueries({ queryKey: [type] });
      toast.success("Элемент восстановлен");
    },
    onError: () => toast.error("Ошибка при восстановлении"),
  });
}

export function usePermanentDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: TrashItemType }) => {
      const { error } = await supabase
        .from(type)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { type }) => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      queryClient.invalidateQueries({ queryKey: [type] });
      toast.success("Элемент удалён навсегда");
    },
    onError: () => toast.error("Ошибка при удалении"),
  });
}
