import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Employee } from "@/types/employee";
import { toast } from "sonner";

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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Сотрудник создан");
    },
    onError: () => toast.error("Ошибка при создании сотрудника"),
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Сотрудник обновлён");
    },
    onError: () => toast.error("Ошибка при обновлении"),
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Сотрудник удалён");
    },
    onError: () => toast.error("Ошибка при удалении"),
  });
}
