import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SparePart } from "@/types/sparePart";
import { toast } from "sonner";

export function useSpareParts() {
  return useQuery({
    queryKey: ["spare_parts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spare_parts")
        .select(`
          *,
          category:warehouse_categories(id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((row): SparePart => ({
        id: row.id,
        name: row.name,
        internalArticle: row.internal_article || "",
        category: row.category?.name || "",
        unit: row.unit,
        currentStock: Number(row.current_stock) || 0,
        minStock: Number(row.min_stock) || 0,
        purchasePrice: Number(row.purchase_price) || 0,
        retailPrice: Number(row.retail_price) || 0,
        notes: row.notes || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
  });
}

export function useCreateSparePart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (part: Omit<SparePart, "id" | "createdAt" | "updatedAt"> & { categoryId?: string }) => {
      const { data, error } = await supabase
        .from("spare_parts")
        .insert({
          name: part.name,
          internal_article: part.internalArticle,
          category_id: part.categoryId || null,
          unit: part.unit,
          current_stock: part.currentStock,
          min_stock: part.minStock,
          purchase_price: part.purchasePrice,
          retail_price: part.retailPrice,
          notes: part.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spare_parts"] });
      toast.success("Материал создан");
    },
    onError: () => toast.error("Ошибка при создании материала"),
  });
}

export function useUpdateSparePart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, categoryId, ...part }: Omit<SparePart, "createdAt" | "updatedAt"> & { categoryId?: string }) => {
      const { error } = await supabase
        .from("spare_parts")
        .update({
          name: part.name,
          internal_article: part.internalArticle,
          category_id: categoryId || null,
          unit: part.unit,
          current_stock: part.currentStock,
          min_stock: part.minStock,
          purchase_price: part.purchasePrice,
          retail_price: part.retailPrice,
          notes: part.notes,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spare_parts"] });
      toast.success("Материал обновлён");
    },
    onError: () => toast.error("Ошибка при обновлении"),
  });
}

export function useDeleteSparePart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("spare_parts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spare_parts"] });
      toast.success("Материал удалён");
    },
    onError: () => toast.error("Ошибка при удалении"),
  });
}
