import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StockMovement, StockMovementMaterial } from "@/types/stockMovement";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";

export function useStockMovements() {
  return useQuery({
    queryKey: ["stock_movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select(`
          *,
          request:requests(id, request_number),
          materials:stock_movement_materials(
            id,
            quantity,
            spare_part:spare_parts(id, name)
          )
        `)
        .order("operation_date", { ascending: false });

      if (error) throw error;

      return data.map((row): StockMovement => ({
        id: row.id,
        operationDate: row.operation_date,
        operationType: row.operation_type,
        materials: row.materials?.map((m: any): StockMovementMaterial => ({
          materialId: m.spare_part?.id || "",
          materialName: m.spare_part?.name || "",
          quantity: Number(m.quantity) || 0,
        })) || [],
        relatedRequestId: row.related_request_id || undefined,
        relatedRequestName: row.request?.request_number || undefined,
        comment: row.comment || "",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movement: Partial<StockMovement>) => {
      // Create the stock movement
      const { data: movementData, error: movementError } = await supabase
        .from("stock_movements")
        .insert({
          operation_date: movement.operationDate,
          operation_type: movement.operationType,
          related_request_id: movement.relatedRequestId || null,
          comment: movement.comment || "",
        })
        .select()
        .single();

      if (movementError) throw movementError;

      // Create materials
      if (movement.materials && movement.materials.length > 0) {
        const materialsToInsert = movement.materials
          .filter(m => m.materialId)
          .map(m => ({
            stock_movement_id: movementData.id,
            spare_part_id: m.materialId,
            quantity: m.quantity,
          }));

        if (materialsToInsert.length > 0) {
          const { error: materialsError } = await supabase
            .from("stock_movement_materials")
            .insert(materialsToInsert);

          if (materialsError) throw materialsError;
        }
      }

      // Log activity
      const operationLabel = movement.operationType === 'приход' ? 'Приход' : 'Расход';
      await logActivity({
        section: 'stockMovements',
        elementId: movementData.id,
        elementName: `${operationLabel} ${movement.operationDate}`,
        action: 'create',
      });

      return movementData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock_movements"] });
      toast.success("Операция создана");
    },
    onError: () => toast.error("Ошибка при создании операции"),
  });
}

export function useUpdateStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...movement }: Partial<StockMovement> & { id: string }) => {
      const { error } = await supabase
        .from("stock_movements")
        .update({
          operation_date: movement.operationDate,
          operation_type: movement.operationType,
          related_request_id: movement.relatedRequestId || null,
          comment: movement.comment || "",
        })
        .eq("id", id);

      if (error) throw error;

      // Delete old materials and insert new ones
      await supabase
        .from("stock_movement_materials")
        .delete()
        .eq("stock_movement_id", id);

      if (movement.materials && movement.materials.length > 0) {
        const materialsToInsert = movement.materials
          .filter(m => m.materialId)
          .map(m => ({
            stock_movement_id: id,
            spare_part_id: m.materialId,
            quantity: m.quantity,
          }));

        if (materialsToInsert.length > 0) {
          await supabase
            .from("stock_movement_materials")
            .insert(materialsToInsert);
        }
      }

      // Log activity
      const operationLabel = movement.operationType === 'приход' ? 'Приход' : 'Расход';
      await logActivity({
        section: 'stockMovements',
        elementId: id,
        elementName: `${operationLabel} ${movement.operationDate}`,
        action: 'update',
        changes: { operationType: movement.operationType, operationDate: movement.operationDate },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock_movements"] });
      toast.success("Операция обновлена");
    },
    onError: () => toast.error("Ошибка при обновлении"),
  });
}

export function useDeleteStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get info for logging
      const { data: movement } = await supabase
        .from("stock_movements")
        .select("operation_type, operation_date")
        .eq("id", id)
        .single();

      // Delete materials first
      await supabase
        .from("stock_movement_materials")
        .delete()
        .eq("stock_movement_id", id);

      const { error } = await supabase
        .from("stock_movements")
        .delete()
        .eq("id", id);
      
      if (error) throw error;

      // Log activity
      const operationLabel = movement?.operation_type === 'приход' ? 'Приход' : 'Расход';
      await logActivity({
        section: 'stockMovements',
        elementId: id,
        elementName: `${operationLabel} ${movement?.operation_date || ''}`,
        action: 'delete',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock_movements"] });
      toast.success("Операция удалена");
    },
    onError: () => toast.error("Ошибка при удалении"),
  });
}
