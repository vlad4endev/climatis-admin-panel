import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type RealtimeTable =
  | "requests"
  | "estimates"
  | "tasks"
  | "assignments"
  | "documents"
  | "clients"
  | "service_objects"
  | "contacts"
  | "invoices"
  | "spare_parts"
  | "stock_movements";

const TABLE_QUERY_KEY_MAP: Record<RealtimeTable, string[][]> = {
  requests: [["requests"], ["trash"]],
  estimates: [["estimates"], ["trash"]],
  tasks: [["tasks"], ["trash"]],
  assignments: [["assignments"], ["trash"]],
  documents: [["documents"], ["trash"]],
  clients: [["clients"], ["trash"]],
  service_objects: [["service_objects"], ["trash"]],
  contacts: [["contacts"], ["trash"]],
  invoices: [["invoices"]],
  spare_parts: [["spare_parts"]],
  stock_movements: [["stock_movements"]],
};

const ALL_TABLES: RealtimeTable[] = Object.keys(TABLE_QUERY_KEY_MAP) as RealtimeTable[];

/**
 * Подписывается на Realtime изменения во всех основных таблицах
 * и автоматически инвалидирует соответствующие React Query кэши.
 * Должен вызываться один раз в корневом компоненте (AppLayout).
 */
export function useRealtimeSubscriptions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("global-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload) => {
          const table = payload.table as RealtimeTable;
          const queryKeys = TABLE_QUERY_KEY_MAP[table];
          if (queryKeys) {
            queryKeys.forEach((key) => {
              queryClient.invalidateQueries({ queryKey: key });
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
