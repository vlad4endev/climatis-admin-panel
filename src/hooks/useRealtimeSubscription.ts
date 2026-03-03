import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export type RealtimeTable =
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
  | "stock_movements"
  | "employees"
  | "teams"
  | "warehouse_categories";

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
  employees: [["employees"]],
  teams: [["teams"]],
  warehouse_categories: [["warehouse_categories"]],
};

/**
 * Маппинг роутов → таблицы, на которые нужно подписаться.
 * Включает как основную таблицу страницы, так и справочные таблицы,
 * которые используются на этой странице (для выпадающих списков и т.д.)
 */
const ROUTE_TABLE_MAP: Record<string, RealtimeTable[]> = {
  "/clients": ["clients"],
  "/contacts": ["contacts", "clients"],
  "/service-objects": ["service_objects", "clients", "contacts"],
  "/documents": ["documents", "clients", "service_objects"],
  "/employees": ["employees"],
  "/teams": ["teams", "employees"],
  "/requests": ["requests", "clients", "service_objects", "documents", "employees", "teams"],
  "/estimates": ["estimates", "requests", "spare_parts"],
  "/assignments": ["assignments", "requests", "estimates", "teams"],
  "/spare-parts": ["spare_parts", "warehouse_categories"],
  "/stock-movements": ["stock_movements", "spare_parts", "requests"],
  "/warehouse-categories": ["warehouse_categories"],
  "/tasks": ["tasks", "employees", "requests"],
  "/invoices": ["invoices", "clients", "requests", "estimates"],
  "/trash": ["requests", "estimates", "tasks", "assignments", "documents", "clients", "service_objects", "contacts"],
  "/users": [],
  "/activity-logs": [],
};

/**
 * Подписывается на Realtime изменения только для таблиц,
 * релевантных текущему роуту. При смене роута переподписывается.
 */
export function useRealtimeSubscriptions() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const prevTablesRef = useRef<string>("");

  useEffect(() => {
    const path = location.pathname;
    const tables = ROUTE_TABLE_MAP[path];

    // Если роут неизвестен — не подписываемся ни на что
    if (!tables || tables.length === 0) {
      prevTablesRef.current = "";
      return;
    }

    // Стабильный ключ для сравнения — не пересоздаём канал если таблицы те же
    const tablesKey = tables.sort().join(",");
    if (tablesKey === prevTablesRef.current) {
      return;
    }
    prevTablesRef.current = tablesKey;

    const channelName = `rt-${path.replace("/", "")}`;
    const channel = supabase.channel(channelName);

    // Подписка на каждую таблицу отдельным фильтром
    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          const changedTable = payload.table as RealtimeTable;
          const queryKeys = TABLE_QUERY_KEY_MAP[changedTable];
          if (queryKeys) {
            queryKeys.forEach((key) => {
              queryClient.invalidateQueries({ queryKey: key });
            });
          }
        }
      );
    });

    channel.subscribe();

    return () => {
      prevTablesRef.current = "";
      supabase.removeChannel(channel);
    };
  }, [location.pathname, queryClient]);
}
