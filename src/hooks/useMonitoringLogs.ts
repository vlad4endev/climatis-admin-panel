import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MonitoringLog {
  id: string;
  userId: string | null;
  userName: string | null;
  eventType: string;
  page: string | null;
  element: string | null;
  message: string | null;
  details: Record<string, any> | null;
  createdAt: string;
}

export function useMonitoringLogs(limit = 500) {
  return useQuery({
    queryKey: ["monitoring_logs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monitoring_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((row: any): MonitoringLog => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        eventType: row.event_type,
        page: row.page,
        element: row.element,
        message: row.message,
        details: row.details as Record<string, any> | null,
        createdAt: row.created_at,
      }));
    },
    refetchInterval: 30000, // auto-refresh every 30s
  });
}
