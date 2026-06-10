import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listQueryOptions } from "@/lib/queryConfig";
import { Estimate, WorkBlock, Material, PriceWork, CustomerCalculation, DEFAULT_CUSTOMER_CALCULATION } from "@/types/estimate";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
import { getErrorMessage } from "@/lib/errorMessages";

const PAGE_SIZE = 50;

const ESTIMATE_SELECT = `
  *,
  request:requests(
    id, 
    request_number,
    client:clients(id, company_name),
    object:service_objects(id, object_name, address)
  ),
  creator:employees(id, full_name),
  materials:estimate_materials(
    id,
    material_name,
    quantity,
    price_per_unit,
    spare_part_id,
    sort_order
  ),
  price_works:estimate_price_works(
    id,
    price_item_id,
    name,
    unit,
    quantity,
    price_per_unit,
    sort_order
  ),
  work_blocks(
    id,
    description,
    sort_order,
    rows:work_rows(*)
  )
`;

function mapEstimateRow(row: any): Estimate {
  return {
    id: row.id,
    name: row.name,
    requestId: row.request_id || undefined,
    requestName: row.request?.request_number || undefined,
    clientName: row.request?.client?.company_name || undefined,
    objectName: row.request?.object?.object_name || undefined,
    objectAddress: row.request?.object?.address || undefined,
    estimateNumber: row.estimate_number,
    estimateDate: row.estimate_date,
    status: row.status,
    type: row.type,
    createdById: row.created_by_id || "",
    createdByName: row.creator?.full_name || "",
    engineerComment: row.engineer_comment || undefined,
    customerCalculation: (row.customer_calculation as unknown as CustomerCalculation) || DEFAULT_CUSTOMER_CALCULATION,
    workBlocks: row.work_blocks?.map((wb: any): WorkBlock => ({
      id: wb.id,
      description: wb.description || "",
      rows: wb.rows?.map((r: any) => ({
        category: r.category,
        planHours: Number(r.plan_hours) || 0,
        quantity: Number(r.quantity) || 0,
        rate: Number(r.rate) || 0,
      })) || [],
    })) || [],
    materials: row.materials?.map((m: any): Material => ({
      id: m.id,
      materialId: m.spare_part_id || undefined,
      materialName: m.material_name,
      quantity: Number(m.quantity) || 0,
      pricePerUnit: Number(m.price_per_unit) || 0,
    })) || [],
  };
}

/** Returns all estimates (no pagination) - used by other pages for lookups */
export function useEstimates() {
  return useQuery({
    queryKey: ["estimates"],
    ...listQueryOptions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimates")
        .select(ESTIMATE_SELECT)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map(mapEstimateRow);
    },
  });
}

/** Returns paginated estimates with total count */
export function usePaginatedEstimates(page: number) {
  return useQuery({
    queryKey: ["estimates", "page", page],
    ...listQueryOptions,
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from("estimates")
        .select(ESTIMATE_SELECT, { count: 'exact' })
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { items: data.map(mapEstimateRow), totalCount: count || 0 };
    },
  });
}

export function useCreateEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (estimate: Partial<Estimate>) => {
      const { data: estimateData, error: estimateError } = await supabase
        .from("estimates")
        .insert({
          estimate_number: "",
          name: estimate.name || "",
          request_id: estimate.requestId || null,
          estimate_date: estimate.estimateDate || new Date().toISOString().split('T')[0],
          status: estimate.status || "черновик",
          type: estimate.type || "простой ремонт",
          created_by_id: estimate.createdById || null,
          engineer_comment: estimate.engineerComment || null,
          customer_calculation: JSON.parse(JSON.stringify(estimate.customerCalculation || DEFAULT_CUSTOMER_CALCULATION)),
        })
        .select()
        .single();

      if (estimateError) throw estimateError;

      if (estimate.workBlocks && estimate.workBlocks.length > 0) {
        for (let i = 0; i < estimate.workBlocks.length; i++) {
          const wb = estimate.workBlocks[i];
          const { data: blockData, error: blockError } = await supabase
            .from("work_blocks")
            .insert({
              estimate_id: estimateData.id,
              description: wb.description,
              sort_order: i,
            })
            .select()
            .single();

          if (blockError) throw blockError;

          if (wb.rows && wb.rows.length > 0) {
            const rowsToInsert = wb.rows.map(r => ({
              work_block_id: blockData.id,
              category: r.category,
              plan_hours: r.planHours,
              quantity: r.quantity,
              rate: r.rate,
            }));

            await supabase.from("work_rows").insert(rowsToInsert);
          }
        }
      }

      if (estimate.materials && estimate.materials.length > 0) {
        const materialsToInsert = estimate.materials.map((m, i) => ({
          estimate_id: estimateData.id,
          material_name: m.materialName,
          spare_part_id: m.materialId || null,
          quantity: m.quantity,
          price_per_unit: m.pricePerUnit,
          sort_order: i,
        }));

        await supabase.from("estimate_materials").insert(materialsToInsert);
      }

      await logActivity({
        section: 'estimates',
        elementId: estimateData.id,
        elementName: estimateData.name || estimateData.estimate_number,
        action: 'create',
      });

      return estimateData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast.success("Расчёт создан");
    },
    onError: (error) => toast.error(getErrorMessage(error, "создании расчёта")),
  });
}

export function useUpdateEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...estimate }: Partial<Estimate> & { id: string }) => {
      const { error } = await supabase
        .from("estimates")
        .update({
          name: estimate.name,
          request_id: estimate.requestId || null,
          estimate_date: estimate.estimateDate,
          status: estimate.status,
          type: estimate.type,
          created_by_id: estimate.createdById || null,
          engineer_comment: estimate.engineerComment || null,
          customer_calculation: estimate.customerCalculation ? JSON.parse(JSON.stringify(estimate.customerCalculation)) : undefined,
        })
        .eq("id", id);

      if (error) throw error;

      const { data: oldBlocks } = await supabase
        .from("work_blocks")
        .select("id")
        .eq("estimate_id", id);

      if (oldBlocks) {
        for (const block of oldBlocks) {
          await supabase.from("work_rows").delete().eq("work_block_id", block.id);
        }
      }
      await supabase.from("work_blocks").delete().eq("estimate_id", id);
      await supabase.from("estimate_materials").delete().eq("estimate_id", id);

      if (estimate.workBlocks && estimate.workBlocks.length > 0) {
        for (let i = 0; i < estimate.workBlocks.length; i++) {
          const wb = estimate.workBlocks[i];
          const { data: blockData } = await supabase
            .from("work_blocks")
            .insert({
              estimate_id: id,
              description: wb.description,
              sort_order: i,
            })
            .select()
            .single();

          if (blockData && wb.rows && wb.rows.length > 0) {
            const rowsToInsert = wb.rows.map(r => ({
              work_block_id: blockData.id,
              category: r.category,
              plan_hours: r.planHours,
              quantity: r.quantity,
              rate: r.rate,
            }));

            await supabase.from("work_rows").insert(rowsToInsert);
          }
        }
      }

      if (estimate.materials && estimate.materials.length > 0) {
        const materialsToInsert = estimate.materials.map((m, i) => ({
          estimate_id: id,
          material_name: m.materialName,
          spare_part_id: m.materialId || null,
          quantity: m.quantity,
          price_per_unit: m.pricePerUnit,
          sort_order: i,
        }));

        await supabase.from("estimate_materials").insert(materialsToInsert);
      }

      await logActivity({
        section: 'estimates',
        elementId: id,
        elementName: estimate.name || 'Расчёт',
        action: 'update',
        changes: { name: estimate.name, status: estimate.status, type: estimate.type },
      });
    },
    onMutate: async ({ id, ...estimate }) => {
      await queryClient.cancelQueries({ queryKey: ["estimates"] });
      const previous = queryClient.getQueryData<Estimate[]>(["estimates"]);
      if (previous) {
        queryClient.setQueryData<Estimate[]>(["estimates"], old =>
          old?.map(e => e.id === id ? { ...e, ...estimate } : e) ?? []
        );
      }
      return { previous };
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["estimates"], context.previous);
      }
      toast.error(getErrorMessage(error, "обновлении расчёта"));
    },
    onSuccess: () => {
      toast.success("Расчёт обновлён");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
    },
  });
}

export function useDeleteEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: est } = await supabase
        .from("estimates")
        .select("name, estimate_number")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("estimates")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      await logActivity({
        section: 'estimates',
        elementId: id,
        elementName: est?.name || est?.estimate_number || 'Расчёт',
        action: 'delete',
      });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["estimates"] });
      const previous = queryClient.getQueryData<Estimate[]>(["estimates"]);
      if (previous) {
        queryClient.setQueryData<Estimate[]>(["estimates"], old =>
          old?.filter(e => e.id !== id) ?? []
        );
      }
      return { previous };
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["estimates"], context.previous);
      }
      toast.error(getErrorMessage(error, "удалении расчёта"));
    },
    onSuccess: () => {
      toast.success("Расчёт перемещён в корзину");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
    },
  });
}

export function useCopyEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (estimate: Estimate) => {
      const { data: estimateData, error: estimateError } = await supabase
        .from("estimates")
        .insert({
          estimate_number: "",
          name: `Копия: ${estimate.name}`,
          request_id: estimate.requestId || null,
          estimate_date: new Date().toISOString().split('T')[0],
          status: "черновик",
          type: estimate.type,
          created_by_id: estimate.createdById || null,
          engineer_comment: estimate.engineerComment || null,
          customer_calculation: JSON.parse(JSON.stringify(estimate.customerCalculation || DEFAULT_CUSTOMER_CALCULATION)),
        })
        .select()
        .single();

      if (estimateError) throw estimateError;

      if (estimate.workBlocks && estimate.workBlocks.length > 0) {
        for (let i = 0; i < estimate.workBlocks.length; i++) {
          const wb = estimate.workBlocks[i];
          const { data: blockData, error: blockError } = await supabase
            .from("work_blocks")
            .insert({
              estimate_id: estimateData.id,
              description: wb.description,
              sort_order: i,
            })
            .select()
            .single();

          if (blockError) throw blockError;

          if (wb.rows && wb.rows.length > 0) {
            const rowsToInsert = wb.rows.map(r => ({
              work_block_id: blockData.id,
              category: r.category,
              plan_hours: r.planHours,
              quantity: r.quantity,
              rate: r.rate,
            }));

            await supabase.from("work_rows").insert(rowsToInsert);
          }
        }
      }

      if (estimate.materials && estimate.materials.length > 0) {
        const materialsToInsert = estimate.materials.map((m, i) => ({
          estimate_id: estimateData.id,
          material_name: m.materialName,
          spare_part_id: m.materialId || null,
          quantity: m.quantity,
          price_per_unit: m.pricePerUnit,
          sort_order: i,
        }));

        await supabase.from("estimate_materials").insert(materialsToInsert);
      }

      await logActivity({
        section: 'estimates',
        elementId: estimateData.id,
        elementName: `Копия: ${estimate.name}`,
        action: 'create',
        changes: { copiedFrom: estimate.name },
      });

      return estimateData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast.success("Расчёт скопирован");
    },
    onError: (error) => toast.error(getErrorMessage(error, "копировании расчёта")),
  });
}
