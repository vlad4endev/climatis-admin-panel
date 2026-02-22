import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types/employee";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
import { getErrorMessage } from "@/lib/errorMessages";

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((row): Employee => ({
        id: row.id,
        fullName: row.full_name,
        phone: row.phone || "",
        position: row.position || "",
        createdAt: new Date(row.created_at),
      }));
    },
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employee: Omit<Employee, "id" | "createdAt">) => {
      const { data, error } = await supabase
        .from("employees")
        .insert({
          full_name: employee.fullName,
          phone: employee.phone,
          position: employee.position,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await logActivity({
        section: 'employees',
        elementId: data.id,
        elementName: data.full_name,
        action: 'create',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Сотрудник создан");
    },
    onError: (error) => toast.error(getErrorMessage(error, "создании сотрудника")),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...employee }: Omit<Employee, "createdAt">) => {
      const { error } = await supabase
        .from("employees")
        .update({
          full_name: employee.fullName,
          phone: employee.phone,
          position: employee.position,
        })
        .eq("id", id);

      if (error) throw error;

      // Log activity
      await logActivity({
        section: 'employees',
        elementId: id,
        elementName: employee.fullName,
        action: 'update',
        changes: { fullName: employee.fullName, phone: employee.phone, position: employee.position },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Сотрудник обновлён");
    },
    onError: (error) => toast.error(getErrorMessage(error, "обновлении сотрудника")),
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get name for logging
      const { data: emp } = await supabase
        .from("employees")
        .select("full_name")
        .eq("id", id)
        .single();

      // Hard delete for employees (no soft delete column)
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;

      // Log activity
      await logActivity({
        section: 'employees',
        elementId: id,
        elementName: emp?.full_name || 'Сотрудник',
        action: 'delete',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Сотрудник удалён");
    },
    onError: (error) => toast.error(getErrorMessage(error, "удалении сотрудника")),
  });
}
