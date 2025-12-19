import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WarehouseCategory } from "@/types/warehouseCategory";
import { toast } from "sonner";

export function useWarehouseCategories() {
  return useQuery({
    queryKey: ["warehouse_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("warehouse_categories")
        .select(`
          *,
          spare_parts(id, current_stock, min_stock)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((row): WarehouseCategory => {
        const parts = row.spare_parts || [];
        const totalStock = parts.reduce((sum, p) => sum + (p.current_stock || 0), 0);
        const needsRestock = parts.filter(p => (p.current_stock || 0) < (p.min_stock || 0)).length;
        
        return {
          id: row.id,
          name: row.name,
          itemCount: parts.length,
          totalStock,
          needsRestock,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      });
    },
  });
}

export function useCreateWarehouseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: { name: string }) => {
      const { data, error } = await supabase
        .from("warehouse_categories")
        .insert({ name: category.name })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse_categories"] });
      toast.success("Категория создана");
    },
    onError: () => toast.error("Ошибка при создании категории"),
  });
}

export function useUpdateWarehouseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("warehouse_categories")
        .update({ name })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse_categories"] });
      toast.success("Категория обновлена");
    },
    onError: () => toast.error("Ошибка при обновлении"),
  });
}

export function useDeleteWarehouseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("warehouse_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse_categories"] });
      toast.success("Категория удалена");
    },
    onError: () => toast.error("Ошибка при удалении"),
  });
}
