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
  "/monitoring": [],
};

// Debounce invalidation per query key to prevent cascade re-fetches
const pendingInvalidations = new Map<string, ReturnType<typeof setTimeout>>();
const INVALIDATION_DEBOUNCE_MS = 1500;

function debouncedInvalidate(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: string[]
) {
  const keyStr = queryKey.join(".");

  const existing = pendingInvalidations.get(keyStr);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    pendingInvalidations.delete(keyStr);
    queryClient.invalidateQueries({ queryKey });
  }, INVALIDATION_DEBOUNCE_MS);

  pendingInvalidations.set(keyStr, timer);
}

export function useRealtimeSubscriptions() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const prevPathRef = useRef<string>("");

  useEffect(() => {
    const path = location.pathname;
    const tables = ROUTE_TABLE_MAP[path];

    // No tables for this route — skip subscription but don't break hooks
    if (!tables || tables.length === 0) {
      prevPathRef.current = path;
      return;
    }

    // Same path — no need to recreate channel
    if (path === prevPathRef.current) {
      return;
    }
    prevPathRef.current = path;

    const channelName = `rt-${path.replace("/", "")}`;
    const channel = supabase.channel(channelName);

    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          const changedTable = payload.table as RealtimeTable;
          const queryKeys = TABLE_QUERY_KEY_MAP[changedTable];
          if (queryKeys) {
            queryKeys.forEach((key) => {
              debouncedInvalidate(queryClient, key);
            });
          }
        }
      );
    });

    channel.subscribe();

    return () => {
      prevPathRef.current = "";
      supabase.removeChannel(channel);

      // Clear pending invalidations for this route
      pendingInvalidations.forEach((timer, key) => {
        clearTimeout(timer);
        pendingInvalidations.delete(key);
      });
    };
  }, [location.pathname, queryClient]);
}
