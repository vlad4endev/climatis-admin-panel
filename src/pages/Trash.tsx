import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  useTrashItems,
  useRestoreItem,
  usePermanentDelete,
  getTypeLabel,
  TYPE_PERMISSION_SECTIONS,
  TrashItemType,
} from "@/hooks/useTrash";
import { useMyPermissions } from "@/hooks/useUserRoles";
import { Loader2, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const TYPE_OPTIONS: { value: TrashItemType | "all"; label: string }[] = [
  { value: "all", label: "Все типы" },
  { value: "requests", label: "Заявки" },
  { value: "documents", label: "Договоры" },
  { value: "estimates", label: "Расчёты" },
  { value: "assignments", label: "Задания" },
  { value: "clients", label: "Организации" },
  { value: "service_objects", label: "Объекты" },
  { value: "contacts", label: "Контактные лица" },
  { value: "tasks", label: "Задачи" },
];

const NO_ACCESS_HINT = "Нет прав на редактирование в этом разделе";

function getTypeBadgeColor(type: TrashItemType): string {
  const colors: Record<TrashItemType, string> = {
    requests: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    documents: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    estimates: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    assignments: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    clients: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
    service_objects: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    contacts: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    tasks: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  };
  return colors[type];
}

export default function Trash() {
  const { data: items = [], isLoading } = useTrashItems();
  const { data: permissions } = useMyPermissions();
  const restoreItem = useRestoreItem();
  const permanentDelete = usePermanentDelete();
  
  const [typeFilter, setTypeFilter] = useState<TrashItemType | "all">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: TrashItemType; name: string } | null>(null);

  const filteredItems = typeFilter === "all" 
    ? items 
    : items.filter(item => item.type === typeFilter);

  // Восстановление и окончательное удаление — операции уровня "edit" в том
  // разделе, к которому относится элемент. Раньше проверки не было вообще:
  // любой пользователь мог безвозвратно удалить организацию вместе с каскадом
  // её объектов, контактов и заявок.
  const canModify = (type: TrashItemType): boolean =>
    permissions?.get(TYPE_PERMISSION_SECTIONS[type]) === "edit";

  const handleRestore = (id: string, type: TrashItemType, name: string) => {
    if (!canModify(type)) return;
    restoreItem.mutate({ id, type, name });
  };

  const handleDelete = (id: string, type: TrashItemType, name: string) => {
    if (!canModify(type)) return;
    setDeleteConfirm({ id, type, name });
  };

  const confirmDelete = () => {
    if (deleteConfirm && canModify(deleteConfirm.type)) {
      permanentDelete.mutate({
        id: deleteConfirm.id,
        type: deleteConfirm.type,
        name: deleteConfirm.name,
      });
    }
    setDeleteConfirm(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Корзина"
          description="Удалённые элементы. Можно восстановить или удалить навсегда."
        />

        <div className="flex items-center gap-4">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TrashItemType | "all")}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Фильтр по типу" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filteredItems.length} элемент(ов)
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Корзина пуста</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Тип</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Удалено</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={`${item.type}-${item.id}`}>
                    <TableCell>
                      <Badge className={getTypeBadgeColor(item.type)} variant="secondary">
                        {getTypeLabel(item.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(item.deletedAt), "dd MMM yyyy, HH:mm", { locale: ru })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(item.id, item.type, item.name)}
                          disabled={restoreItem.isPending || !canModify(item.type)}
                          title={canModify(item.type) ? undefined : NO_ACCESS_HINT}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Восстановить
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item.id, item.type, item.name)}
                          disabled={permanentDelete.isPending || !canModify(item.type)}
                          title={canModify(item.type) ? undefined : NO_ACCESS_HINT}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Удалить
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Удалить навсегда?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Элемент "{deleteConfirm?.name}" будет удалён без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить навсегда
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
