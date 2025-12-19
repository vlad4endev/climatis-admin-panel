import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Task, TaskChecklistItem, TaskComment } from "@/types/task";
import { Employee } from "@/types/employee";
import { Request } from "@/types/request";
import { Plus, Trash2, Send } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TaskFormProps {
  task?: Task;
  employees: Employee[];
  requests: Request[];
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'createdBy'>) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

export function TaskForm({ task, employees, requests, onSubmit, onCancel, readOnly = false }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || "");
  const [requestId, setRequestId] = useState(task?.requestId || "");
  const [proposedDeadline, setProposedDeadline] = useState(task?.proposedDeadline || "");
  const [agreedDeadline, setAgreedDeadline] = useState(task?.agreedDeadline || "");
  const [status, setStatus] = useState<Task['status']>(task?.status || "новая");
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>(task?.checklist || []);
  const [comments, setComments] = useState<TaskComment[]>(task?.comments || []);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newComment, setNewComment] = useState("");

  const selectedEmployee = employees.find(e => e.id === assigneeId);
  const selectedRequest = requests.find(r => r.id === requestId);
  const getEmployeeName = (emp: Employee | undefined) => emp?.fullName || "";

  const completedItems = checklist.filter(item => item.completed).length;
  const progressPercent = checklist.length > 0 ? Math.round((completedItems / checklist.length) * 100) : 0;

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setChecklist([...checklist, {
      id: Date.now().toString(),
      text: newChecklistItem.trim(),
      completed: false
    }]);
    setNewChecklistItem("");
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments([...comments, {
      id: Date.now().toString(),
      text: newComment.trim(),
      authorId: "current-user",
      authorName: "Текущий пользователь",
      createdAt: new Date().toISOString()
    }]);
    setNewComment("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      assigneeId,
      assigneeName: getEmployeeName(selectedEmployee),
      requestId: requestId || undefined,
      requestNumber: selectedRequest?.requestNumber,
      proposedDeadline,
      agreedDeadline,
      status,
      checklist,
      comments
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="main" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="main">Основное</TabsTrigger>
          <TabsTrigger value="checklist">
            Чек-лист {checklist.length > 0 && `(${progressPercent}%)`}
          </TabsTrigger>
          <TabsTrigger value="comments">
            Комментарии {comments.length > 0 && `(${comments.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название задачи</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название"
              required={!readOnly}
              readOnly={readOnly}
              tabIndex={readOnly ? -1 : undefined}
              className={readOnly ? "bg-input-readonly" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробное описание задачи"
              rows={3}
              readOnly={readOnly}
              tabIndex={readOnly ? -1 : undefined}
              className={readOnly ? "bg-input-readonly" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Исполнитель</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId} disabled={readOnly}>
              <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
                <SelectValue placeholder="Выберите исполнителя" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.fullName} — {employee.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="request">Связанная заявка</Label>
            <Select value={requestId || "__none__"} onValueChange={(v) => setRequestId(v === "__none__" ? "" : v)} disabled={readOnly}>
              <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
                <SelectValue placeholder="Выберите заявку (необязательно)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Без заявки</SelectItem>
                {requests.map((request) => (
                  <SelectItem key={request.id} value={request.id}>
                    {request.requestNumber} — {request.clientName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proposedDeadline">Предложенный срок</Label>
              <Input
                id="proposedDeadline"
                type="date"
                value={proposedDeadline}
                onChange={(e) => setProposedDeadline(e.target.value)}
                readOnly={readOnly}
                tabIndex={readOnly ? -1 : undefined}
                className={readOnly ? "bg-input-readonly" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agreedDeadline">Согласованный срок</Label>
              <Input
                id="agreedDeadline"
                type="date"
                value={agreedDeadline}
                onChange={(e) => setAgreedDeadline(e.target.value)}
                readOnly={readOnly}
                tabIndex={readOnly ? -1 : undefined}
                className={readOnly ? "bg-input-readonly" : ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Статус</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Task['status'])} disabled={readOnly}>
              <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="новая">Новая</SelectItem>
                <SelectItem value="в работе">В работе</SelectItem>
                <SelectItem value="частично выполнена">Частично выполнена</SelectItem>
                <SelectItem value="выполнена">Выполнена</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4 mt-4">
          {checklist.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Готовность: {progressPercent}%</span>
                <span className="text-muted-foreground">{completedItems} из {checklist.length}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          <div className="space-y-2">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-md bg-muted/30 group"
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => !readOnly && handleToggleChecklistItem(item.id)}
                  disabled={readOnly}
                />
                <span className={`flex-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {item.text}
                </span>
                {!readOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveChecklistItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {!readOnly && (
            <div className="flex gap-2">
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="Новый пункт чек-листа"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddChecklistItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}

          {readOnly && checklist.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">
              Чек-лист пуст
            </p>
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-4 mt-4">
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Комментариев пока нет
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-3 rounded-md bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{comment.authorName}</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(comment.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </div>
              ))
            )}
          </div>

          {!readOnly && (
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Написать комментарий..."
                rows={2}
                className="resize-none"
              />
              <Button
                type="button"
                variant="outline"
                className="self-end"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {!readOnly && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit">
            {task ? "Сохранить" : "Создать"}
          </Button>
        </div>
      )}
    </form>
  );
}
