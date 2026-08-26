import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listQueryOptions } from "@/lib/queryConfig";
import { Task } from "@/types/task";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
import { getErrorMessage } from "@/lib/errorMessages";

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    ...listQueryOptions,
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
        .is("deleted_at", null)
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

      if (task.checklist && task.checklist.length > 0) {
        const itemsToInsert = task.checklist.map((item, index) => ({
          task_id: taskData.id,
          text: item.text,
          completed: item.completed,
          sort_order: index,
        }));

        const { error: checklistError } = await supabase
          .from("task_checklist_items")
          .insert(itemsToInsert);

        if (checklistError) throw checklistError;
      }

      await logActivity({
        section: 'tasks',
        elementId: taskData.id,
        elementName: taskData.title,
        action: 'create',
      });

      return taskData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Задача создана");
    },
    onError: (error) => toast.error(getErrorMessage(error, "создании задачи")),
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

      if (task.checklist) {
        const { error: deleteChecklistError } = await supabase
          .from("task_checklist_items")
          .delete()
          .eq("task_id", id);

        if (deleteChecklistError) throw deleteChecklistError;

        if (task.checklist.length > 0) {
          const itemsToInsert = task.checklist.map((item, index) => ({
            task_id: id,
            text: item.text,
            completed: item.completed,
            sort_order: index,
          }));

          const { error: checklistError } = await supabase
            .from("task_checklist_items")
            .insert(itemsToInsert);

          if (checklistError) throw checklistError;
        }
      }

      await logActivity({
        section: 'tasks',
        elementId: id,
        elementName: task.title || 'Задача',
        action: 'update',
        changes: { title: task.title, status: task.status },
      });
    },
    onMutate: async ({ id, ...task }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previous = queryClient.getQueryData<Task[]>(["tasks"]);
      if (previous) {
        queryClient.setQueryData<Task[]>(["tasks"], old =>
          old?.map(t => t.id === id ? { ...t, ...task } : t) ?? []
        );
      }
      return { previous };
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["tasks"], context.previous);
      }
      toast.error(getErrorMessage(error, "обновлении задачи"));
    },
    onSuccess: () => {
      toast.success("Задача обновлена");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: task } = await supabase
        .from("tasks")
        .select("title")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("tasks")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      await logActivity({
        section: 'tasks',
        elementId: id,
        elementName: task?.title || 'Задача',
        action: 'delete',
      });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previous = queryClient.getQueryData<Task[]>(["tasks"]);
      if (previous) {
        queryClient.setQueryData<Task[]>(["tasks"], old =>
          old?.filter(t => t.id !== id) ?? []
        );
      }
      return { previous };
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["tasks"], context.previous);
      }
      toast.error(getErrorMessage(error, "удалении задачи"));
    },
    onSuccess: () => {
      toast.success("Задача перемещена в корзину");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
    },
  });
}
