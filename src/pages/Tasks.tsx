import { useState } from "react";
import { Task } from "@/types/task";
import { Employee } from "@/types/employee";
import { Request } from "@/types/request";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const mockEmployees: Employee[] = [
  { id: "1", fullName: "Иванов Иван", phone: "+7 (999) 123-45-67", position: "Инженер", createdAt: new Date() },
  { id: "2", fullName: "Петров Петр", phone: "+7 (999) 234-56-78", position: "Техник", createdAt: new Date() },
  { id: "3", fullName: "Сидоров Сидор", phone: "+7 (999) 345-67-89", position: "Мастер", createdAt: new Date() },
];

const mockRequests: Request[] = [
  { id: "1", requestNumber: "ЗАЯ-001", createdAt: new Date(), status: "in_progress", type: "repair", priority: "urgent", clientId: "1", clientName: "ООО Альфа", objectId: "1", objectName: "Офис на Ленина", problemDescription: "Не работает кондиционер", comments: "" },
  { id: "2", requestNumber: "ЗАЯ-002", createdAt: new Date(), status: "new", type: "maintenance", priority: "normal", clientId: "2", clientName: "ИП Бета", objectId: "2", objectName: "Склад №3", problemDescription: "Плановое ТО вентиляции", comments: "" },
  { id: "3", requestNumber: "ЗАЯ-003", createdAt: new Date(), status: "completed", type: "repair", priority: "normal", clientId: "1", clientName: "ООО Альфа", objectId: "3", objectName: "Цех №1", problemDescription: "Ремонт чиллера", comments: "" },
];

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

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Проверка системы кондиционирования",
    description: "Провести полную диагностику системы кондиционирования в офисе клиента",
    assigneeId: "1",
    assigneeName: "Иванов Иван",
    requestId: "1",
    requestNumber: "ЗАЯ-001",
    proposedDeadline: "2024-12-10",
    agreedDeadline: "2024-12-12",
    status: "в работе",
    checklist: [
      { id: "1", text: "Проверить компрессор", completed: true },
      { id: "2", text: "Проверить фреон", completed: true },
      { id: "3", text: "Очистить фильтры", completed: false },
      { id: "4", text: "Проверить дренаж", completed: false },
    ],
    comments: [
      { id: "1", text: "Начал работу, компрессор в норме", authorId: "1", authorName: "Иванов Иван", createdAt: "2024-12-05T10:30:00" },
    ],
    createdAt: "2024-12-01",
    createdBy: "admin"
  },
  {
    id: "2",
    title: "Установка вентиляции",
    description: "Монтаж приточно-вытяжной вентиляции",
    assigneeId: "2",
    assigneeName: "Петров Петр",
    proposedDeadline: "2024-12-15",
    agreedDeadline: "",
    status: "новая",
    checklist: [],
    comments: [],
    createdAt: "2024-12-02",
    createdBy: "admin"
  },
  {
    id: "3",
    title: "Ремонт чиллера",
    description: "Замена теплообменника",
    assigneeId: "3",
    assigneeName: "Сидоров Сидор",
    requestId: "3",
    requestNumber: "ЗАЯ-003",
    proposedDeadline: "2024-12-08",
    agreedDeadline: "2024-12-08",
    status: "выполнена",
    checklist: [
      { id: "1", text: "Демонтаж старого теплообменника", completed: true },
      { id: "2", text: "Установка нового", completed: true },
      { id: "3", text: "Тестирование", completed: true },
    ],
    comments: [
      { id: "1", text: "Работа выполнена в срок", authorId: "3", authorName: "Сидоров Сидор", createdAt: "2024-12-08T16:00:00" },
    ],
    createdAt: "2024-12-03",
    createdBy: "admin"
  },
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
  if (task.checklist.length === 0) return null;
  const completed = task.checklist.filter(item => item.completed).length;
  return Math.round((completed / task.checklist.length) * 100);
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();

  const assigneeOptions = mockEmployees.map(e => ({ value: e.fullName, label: e.fullName }));

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
          <span className="text-muted-foreground">{value.length || "—"}</span>
        )
      }
    ],
    getItemId: (task) => task.id,
    onEdit: (task) => {
      setEditingTask(task);
      setIsDialogOpen(true);
    },
    onDelete: (id) => {
      setTasks(tasks.filter((t) => t.id !== id));
    },
    onUpdate: (id, field, value) => {
      setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
    },
  };

  const handleSubmit = (taskData: Omit<Task, 'id' | 'createdAt' | 'createdBy'>) => {
    if (editingTask) {
      setTasks(tasks.map(t =>
        t.id === editingTask.id
          ? { ...t, ...taskData }
          : t
      ));
    } else {
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        createdBy: "admin"
      };
      setTasks([...tasks, newTask]);
    }
    setIsDialogOpen(false);
    setEditingTask(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Задачи</h1>
          <p className="text-muted-foreground">Управление задачами сотрудников</p>
        </div>
        <Button onClick={() => { setEditingTask(undefined); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить задачу
        </Button>
      </div>

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
            employees={mockEmployees}
            requests={mockRequests}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
