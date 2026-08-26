import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorMessages";
import { listQueryOptions } from "@/lib/queryConfig";
import { logActivity } from "@/lib/activityLogger";

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

/** Тип элемента корзины -> ключ раздела в журнале действий. */
const TYPE_LOG_SECTIONS: Record<TrashItemType, string> = {
  requests: "requests",
  documents: "documents",
  estimates: "estimates",
  assignments: "assignments",
  clients: "clients",
  service_objects: "serviceObjects",
  contacts: "contacts",
  tasks: "tasks",
};

/** Тип элемента корзины -> ключ раздела в правах доступа (SECTIONS). */
export const TYPE_PERMISSION_SECTIONS: Record<TrashItemType, string> = {
  requests: "requests",
  documents: "documents",
  estimates: "estimates",
  assignments: "assignments",
  clients: "clients",
  service_objects: "service-objects",
  contacts: "contacts",
  tasks: "tasks",
};

export function useTrashItems() {
  return useQuery({
    queryKey: ["trash"],
    ...listQueryOptions,
    queryFn: async () => {
      // Run all 8 queries in parallel instead of sequentially
      const [
        { data: requests },
        { data: documents },
        { data: estimates },
        { data: assignments },
        { data: clients },
        { data: serviceObjects },
        { data: contacts },
        { data: tasks },
      ] = await Promise.all([
        supabase.from("requests").select("id, request_number, deleted_at").not("deleted_at", "is", null),
        supabase.from("documents").select("id, contract_number, deleted_at").not("deleted_at", "is", null),
        supabase.from("estimates").select("id, estimate_number, name, deleted_at").not("deleted_at", "is", null),
        supabase.from("assignments").select("id, assignment_number, deleted_at").not("deleted_at", "is", null),
        supabase.from("clients").select("id, company_name, deleted_at").not("deleted_at", "is", null),
        supabase.from("service_objects").select("id, object_name, deleted_at").not("deleted_at", "is", null),
        supabase.from("contacts").select("id, name, deleted_at").not("deleted_at", "is", null),
        supabase.from("tasks").select("id, title, deleted_at").not("deleted_at", "is", null),
      ]);

      const items: TrashItem[] = [];

      requests?.forEach((r) => items.push({ id: r.id, type: "requests", name: `Заявка №${r.request_number}`, deletedAt: r.deleted_at! }));
      documents?.forEach((d) => items.push({ id: d.id, type: "documents", name: `Договор ${d.contract_number}`, deletedAt: d.deleted_at! }));
      estimates?.forEach((e) => items.push({ id: e.id, type: "estimates", name: `${e.estimate_number} - ${e.name}`, deletedAt: e.deleted_at! }));
      assignments?.forEach((a) => items.push({ id: a.id, type: "assignments", name: `Задание ${a.assignment_number}`, deletedAt: a.deleted_at! }));
      clients?.forEach((c) => items.push({ id: c.id, type: "clients", name: c.company_name, deletedAt: c.deleted_at! }));
      serviceObjects?.forEach((s) => items.push({ id: s.id, type: "service_objects", name: s.object_name, deletedAt: s.deleted_at! }));
      contacts?.forEach((c) => items.push({ id: c.id, type: "contacts", name: c.name, deletedAt: c.deleted_at! }));
      tasks?.forEach((t) => items.push({ id: t.id, type: "tasks", name: t.title, deletedAt: t.deleted_at! }));

      return items.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
    },
  });
}

export function useRestoreItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type, name }: { id: string; type: TrashItemType; name?: string }) => {
      const { error } = await supabase
        .from(type)
        .update({ deleted_at: null })
        .eq("id", id);

      if (error) throw error;

      await logActivity({
        section: TYPE_LOG_SECTIONS[type],
        elementId: id,
        elementName: name || getTypeLabel(type),
        action: "update",
        changes: { restoredFromTrash: name || id },
      });
    },
    onSuccess: (_, { type }) => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      queryClient.invalidateQueries({ queryKey: [type] });
      toast.success("Элемент восстановлен");
    },
    onError: (error) => toast.error(getErrorMessage(error, "восстановлении элемента")),
  });
}

export function usePermanentDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type, name }: { id: string; type: TrashItemType; name?: string }) => {
      const { error } = await supabase
        .from(type)
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Самая необратимая операция в системе — она обязана попадать в журнал.
      await logActivity({
        section: TYPE_LOG_SECTIONS[type],
        elementId: id,
        elementName: name || getTypeLabel(type),
        action: "delete",
        changes: { permanentlyDeleted: name || id },
      });
    },
    onSuccess: (_, { type }) => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      queryClient.invalidateQueries({ queryKey: [type] });
      toast.success("Элемент удалён навсегда");
    },
    onError: (error) => toast.error(getErrorMessage(error, "окончательном удалении")),
  });
}
