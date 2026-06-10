import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { refQueryOptions } from "@/lib/queryConfig";
import { WorkPriceItem } from "@/types/workPriceItem";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorMessages";
import { logActivity } from "@/lib/activityLogger";

function mapRow(row: any): WorkPriceItem {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit || "шт",
    price: Number(row.price) || 0,
    category: row.category || undefined,
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useWorkPriceList() {
  return useQuery({
    queryKey: ["work_price_list"],
    ...refQueryOptions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_price_list")
        .select("*")
        .is("deleted_at", null)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []).map(mapRow);
    },
  });
}

export function useCreateWorkPriceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<WorkPriceItem, "id" | "createdAt" | "updatedAt">) => {
      const { data, error } = await supabase
        .from("work_price_list")
        .insert({
          name: input.name,
          unit: input.unit || "шт",
          price: input.price,
          category: input.category || null,
          is_active: input.isActive,
        })
        .select()
        .single();
      if (error) throw error;
      await logActivity({ section: "work-price-list", elementId: data.id, elementName: data.name, action: "create" });
      return mapRow(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work_price_list"] });
      toast.success("Позиция прайса добавлена");
    },
    onError: (error) => toast.error(getErrorMessage(error, "создании позиции прайса")),
  });
}

export function useUpdateWorkPriceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<WorkPriceItem> & { id: string }) => {
      const { error } = await supabase
        .from("work_price_list")
        .update({
          name: input.name,
          unit: input.unit,
          price: input.price,
          category: input.category ?? null,
          is_active: input.isActive,
        })
        .eq("id", id);
      if (error) throw error;
      await logActivity({ section: "work-price-list", elementId: id, elementName: input.name || "Позиция прайса", action: "update" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work_price_list"] });
      toast.success("Позиция обновлена");
    },
    onError: (error) => toast.error(getErrorMessage(error, "обновлении позиции прайса")),
  });
}

export function useDeleteWorkPriceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: item } = await supabase.from("work_price_list").select("name").eq("id", id).single();
      const { error } = await supabase
        .from("work_price_list")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await logActivity({ section: "work-price-list", elementId: id, elementName: item?.name || "Позиция прайса", action: "delete" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work_price_list"] });
      qc.invalidateQueries({ queryKey: ["trash"] });
      toast.success("Позиция удалена");
    },
    onError: (error) => toast.error(getErrorMessage(error, "удалении позиции прайса")),
  });
}
