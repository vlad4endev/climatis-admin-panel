import { useState } from "react";
import { Task } from "@/types/task";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { EntityViewDialog } from "@/components/entity/EntityViewDialog";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/PageHeader";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useEmployees } from "@/hooks/useEmployees";
import { useRequests } from "@/hooks/useRequests";
import { Skeleton } from "@/components/ui/skeleton";

const statusOptions = [
  { value: "новая", label: "Новая" },
  { value: "в работе", label: "В работе" },
  { value: "частично выполнена", label: "Частично выполнена" },
  { value: "выполнена", label: "Выполнена" },
];

const kanbanColumns = [
  { value: "новая", label: "Новая" },
  { value: "в работе", label: "В работе" },
  { value: "частично выполнена", label: "Частично" },
  { value: "выполнена", label: "Выполнена" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "новая": return "bg-sky-100 text-sky-800";
    case "в работе": return "bg-amber-100 text-amber-800";
    case "частично выполнена": return "bg-violet-100 text-violet-800";
    case "выполнена": return "bg-emerald-100 text-emerald-800";
    default: return "bg-muted text-muted-foreground";
  }
};

const getProgressPercent = (task: Task) => {
  if (!task.checklist || task.checklist.length === 0) return null;
  const completed = task.checklist.filter(item => item.completed).length;
  return Math.round((completed / task.checklist.length) * 100);
};

export default function Tasks() {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: employees = [] } = useEmployees();
  const { data: requests = [] } = useRequests();
  
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const assigneeOptions = employees.map(e => ({ value: e.fullName, label: e.fullName }));

  const config: EntityListConfig<Task> = {
    fields: [
      {
        key: "title",
        label: "Задача",
        type: "text",
        searchable: true,
        editable: true,
        render: (value, item) => (
          <div className="flex items-center gap-2">
            {item.status === "выполнена" && (
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
            )}
            <span className="font-medium">{value}</span>
          </div>
        )
      },
      {
        key: "assigneeName",
        label: "Исполнитель",
        type: "select",
        options: assigneeOptions,
        searchable: true,
        filterable: true,
      },
      {
        key: "requestNumber",
        label: "Заявка",
        type: "text",
        searchable: true,
        render: (value) => value ? (
          <span className="text-primary font-medium">{value}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
      {
        key: "agreedDeadline",
        label: "Срок",
        type: "date",
        render: (value, item) => {
          const deadline = value || item.proposedDeadline;
          if (!deadline) return <span className="text-muted-foreground">—</span>;
          const isOverdue = new Date(deadline) < new Date() && item.status !== "выполнена";
          return (
            <span className={isOverdue ? "text-destructive font-medium" : ""}>
              {new Date(deadline).toLocaleDateString('ru-RU')}
              {!value && item.proposedDeadline && (
                <span className="text-muted-foreground text-xs ml-1">(предл.)</span>
              )}
            </span>
          );
        }
      },
      {
        key: "status",
        label: "Статус",
        type: "select",
        options: statusOptions,
        filterable: true,
        editable: true,
        render: (value) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
            {value}
          </span>
        ),
      },
      {
        key: "checklist",
        label: "Готовность",
        type: "text",
        render: (_, item) => {
          const percent = getProgressPercent(item);
          if (percent === null) return <span className="text-muted-foreground text-sm">—</span>;
          return (
            <div className="flex items-center gap-2 min-w-[100px]">
              <Progress value={percent} className="h-2 flex-1" />
              <span className="text-xs font-medium w-10">{percent}%</span>
            </div>
          );
        }
      },
      {
        key: "comments",
        label: "Комм.",
        type: "text",
        render: (value: Task['comments']) => (
          <span className="text-muted-foreground">{value?.length || "—"}</span>
        )
      }
    ],
    getItemId: (task) => task.id,
    onRowClick: (task) => setViewingTask(task),
    onEdit: (task) => {
      setEditingTask(task);
      setIsDialogOpen(true);
    },
    onDelete: (id) => deleteMutation.mutate(id),
    onUpdate: (id, field, value) => {
      const task = tasks.find(t => t.id === id);
      if (task) {
        updateMutation.mutate({ id, ...task, [field]: value });
      }
    },
  };

  const handleSubmit = (taskData: Omit<Task, 'id' | 'createdAt' | 'createdBy'>) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, ...taskData }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingTask(undefined);
        }
      });
    } else {
      createMutation.mutate(taskData, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingTask(undefined);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Задачи" description="Управление задачами сотрудников" buttonLabel="Добавить задачу" onButtonClick={() => {}} />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Задачи"
        description="Управление задачами сотрудников"
        buttonLabel="Добавить задачу"
        onButtonClick={() => { setEditingTask(undefined); setIsDialogOpen(true); }}
      />

      <EntityList
        items={tasks}
        config={config}
        defaultViewMode="table"
        kanbanGroupField="status"
        kanbanColumns={kanbanColumns}
        emptyMessage="Задачи не найдены"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Редактирование задачи" : "Новая задача"}
            </DialogTitle>
          </DialogHeader>
          <TaskForm
            task={editingTask}
            employees={employees.map(e => ({
              id: e.id,
              fullName: e.fullName,
              phone: e.phone || "",
              position: e.position || "",
              createdAt: new Date(e.createdAt),
            }))}
            requests={requests.map(r => ({
              id: r.id,
              requestNumber: r.requestNumber,
              createdAt: new Date(r.createdAt),
              status: r.status,
              type: r.type,
              priority: r.priority,
              clientId: r.clientId,
              clientName: r.clientName || "",
              objectId: r.objectId,
              objectName: r.objectName || "",
              problemDescription: r.problemDescription || "",
              comments: r.comments || "",
            }))}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <EntityViewDialog
        item={viewingTask}
        open={!!viewingTask}
        onOpenChange={(open) => !open && setViewingTask(null)}
        config={config}
        title={viewingTask?.title}
      />
    </div>
  );
}
