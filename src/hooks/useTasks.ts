import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types/task";
import { toast } from "sonner";

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:employees(id, full_name),
          request:requests(id, request_number),
          checklist:task_checklist_items(*),
          comments:task_comments(
            id,
            text,
            created_at,
            author:profiles(id, full_name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((row): Task => ({
        id: row.id,
        title: row.title,
        description: row.description || "",
        assigneeId: row.assignee_id || undefined,
        assigneeName: row.assignee?.full_name || undefined,
        requestId: row.request_id || undefined,
        requestNumber: row.request?.request_number || undefined,
        proposedDeadline: row.proposed_deadline || "",
        agreedDeadline: row.agreed_deadline || "",
        status: row.status,
        checklist: row.checklist?.map((item: any) => ({
          id: item.id,
          text: item.text,
          completed: item.completed,
        })) || [],
        comments: row.comments?.map((c: any) => ({
          id: c.id,
          text: c.text,
          authorId: c.author?.id || "",
          authorName: c.author?.full_name || "Система",
          createdAt: c.created_at,
        })) || [],
        createdAt: row.created_at,
        createdBy: row.created_by || "",
      }));
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Omit<Task, "id" | "createdAt" | "createdBy">) => {
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .insert({
          title: task.title,
          description: task.description,
          assignee_id: task.assigneeId || null,
          request_id: task.requestId || null,
          proposed_deadline: task.proposedDeadline || null,
          agreed_deadline: task.agreedDeadline || null,
          status: task.status,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Create checklist items
      if (task.checklist && task.checklist.length > 0) {
        const itemsToInsert = task.checklist.map((item, index) => ({
          task_id: taskData.id,
          text: item.text,
          completed: item.completed,
          sort_order: index,
        }));

        await supabase.from("task_checklist_items").insert(itemsToInsert);
      }

      return taskData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Задача создана");
    },
    onError: () => toast.error("Ошибка при создании задачи"),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...task }: Partial<Task> & { id: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: task.title,
          description: task.description,
          assignee_id: task.assigneeId || null,
          request_id: task.requestId || null,
          proposed_deadline: task.proposedDeadline || null,
          agreed_deadline: task.agreedDeadline || null,
          status: task.status,
        })
        .eq("id", id);

      if (error) throw error;

      // Update checklist - delete old and insert new
      if (task.checklist) {
        await supabase.from("task_checklist_items").delete().eq("task_id", id);

        if (task.checklist.length > 0) {
          const itemsToInsert = task.checklist.map((item, index) => ({
            task_id: id,
            text: item.text,
            completed: item.completed,
            sort_order: index,
          }));

          await supabase.from("task_checklist_items").insert(itemsToInsert);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Задача обновлена");
    },
    onError: () => toast.error("Ошибка при обновлении"),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Delete related items first
      await supabase.from("task_checklist_items").delete().eq("task_id", id);
      await supabase.from("task_comments").delete().eq("task_id", id);

      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Задача удалена");
    },
    onError: () => toast.error("Ошибка при удалении"),
  });
}
