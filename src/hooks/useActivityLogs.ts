import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityLog {
  id: string;
  userId: string | null;
  userName: string | null;
  section: string;
  elementId: string | null;
  elementName: string | null;
  action: 'create' | 'update' | 'delete';
  changes: Record<string, any> | null;
  createdAt: string;
}

export function useActivityLogs(limit: number = 100) {
  return useQuery({
    queryKey: ["activity-logs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map((item): ActivityLog => ({
        id: item.id,
        userId: item.user_id,
        userName: item.user_name,
        section: item.section,
        elementId: item.element_id,
        elementName: item.element_name,
        action: item.action as 'create' | 'update' | 'delete',
        changes: item.changes as Record<string, any> | null,
        createdAt: item.created_at,
      }));
    },
  });
}

export function useElementActivityLogs(elementId: string | undefined) {
  return useQuery({
    queryKey: ["element-activity-logs", elementId],
    queryFn: async () => {
      if (!elementId) return [];

      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("element_id", elementId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((item): ActivityLog => ({
        id: item.id,
        userId: item.user_id,
        userName: item.user_name,
        section: item.section,
        elementId: item.element_id,
        elementName: item.element_name,
        action: item.action as 'create' | 'update' | 'delete',
        changes: item.changes as Record<string, any> | null,
        createdAt: item.created_at,
      }));
    },
    enabled: !!elementId,
  });
}
