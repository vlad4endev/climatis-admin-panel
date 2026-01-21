import { useState } from "react";
import { useActivityLogs, ActivityLog } from "@/hooks/useActivityLogs";
import { getSectionLabel, getActionLabel } from "@/lib/activityLogger";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const SECTIONS = [
  { value: 'all', label: 'Все разделы' },
  { value: 'clients', label: 'Контрагенты' },
  { value: 'serviceObjects', label: 'Объекты' },
  { value: 'documents', label: 'Документы' },
  { value: 'requests', label: 'Заявки' },
  { value: 'estimates', label: 'Расчёты' },
  { value: 'assignments', label: 'Наряды' },
  { value: 'invoices', label: 'Счета' },
  { value: 'tasks', label: 'Задачи' },
  { value: 'employees', label: 'Сотрудники' },
  { value: 'teams', label: 'Бригады' },
  { value: 'spareParts', label: 'Комплектующие' },
  { value: 'stockMovements', label: 'Расход-приход' },
];

const ACTIONS = [
  { value: 'all', label: 'Все действия' },
  { value: 'create', label: 'Создание' },
  { value: 'update', label: 'Редактирование' },
  { value: 'delete', label: 'Удаление' },
];

function getActionIcon(action: string) {
  switch (action) {
    case 'create': return <Plus className="h-4 w-4" />;
    case 'update': return <Pencil className="h-4 w-4" />;
    case 'delete': return <Trash2 className="h-4 w-4" />;
    default: return null;
  }
}

function getActionBadgeVariant(action: string) {
  switch (action) {
    case 'create': return 'default';
    case 'update': return 'secondary';
    case 'delete': return 'destructive';
    default: return 'outline';
  }
}

// Section to route mapping
const SECTION_ROUTES: Record<string, string> = {
  clients: '/clients',
  serviceObjects: '/service-objects',
  documents: '/documents',
  requests: '/requests',
  estimates: '/estimates',
  assignments: '/assignments',
  invoices: '/invoices',
  tasks: '/tasks',
  employees: '/employees',
  teams: '/teams',
  spareParts: '/spare-parts',
  stockMovements: '/stock-movements',
  warehouseCategories: '/warehouse-categories',
};

export default function ActivityLogs() {
  const { data: logs = [], isLoading } = useActivityLogs(500);
  const navigate = useNavigate();
  
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = search === "" || 
      log.elementName?.toLowerCase().includes(search.toLowerCase()) ||
      log.userName?.toLowerCase().includes(search.toLowerCase());
    
    const matchesSection = sectionFilter === "all" || log.section === sectionFilter;
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    
    return matchesSearch && matchesSection && matchesAction;
  });

  const handleRowClick = (log: ActivityLog) => {
    setSelectedLog(log);
  };

  const handleNavigateToElement = () => {
    if (selectedLog?.elementId && selectedLog?.section) {
      const route = SECTION_ROUTES[selectedLog.section];
      if (route) {
        // Navigate to the section - the element opening will be handled by the section
        navigate(route, { state: { openElementId: selectedLog.elementId } });
      }
    }
    setSelectedLog(null);
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
          title="Логи"
          description="История изменений в системе"
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по элементу или пользователю..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={sectionFilter} onValueChange={setSectionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Раздел" />
            </SelectTrigger>
            <SelectContent>
              {SECTIONS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Действие" />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map(a => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Logs table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Дата</TableHead>
                <TableHead>Пользователь</TableHead>
                <TableHead>Раздел</TableHead>
                <TableHead>Элемент</TableHead>
                <TableHead className="w-[140px]">Действие</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Нет записей в логах
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map(log => (
                  <TableRow 
                    key={log.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(log)}
                  >
                    <TableCell className="text-muted-foreground">
                      {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </TableCell>
                    <TableCell>{log.userName || '—'}</TableCell>
                    <TableCell>{getSectionLabel(log.section)}</TableCell>
                    <TableCell className="font-medium">{log.elementName || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action) as any} className="gap-1">
                        {getActionIcon(log.action)}
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Log details dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Детали записи</DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Дата</div>
                  <div className="text-sm">
                    {format(new Date(selectedLog.createdAt), 'dd.MM.yyyy HH:mm:ss', { locale: ru })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Пользователь</div>
                  <div className="text-sm">{selectedLog.userName || '—'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Раздел</div>
                  <div className="text-sm">{getSectionLabel(selectedLog.section)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Действие</div>
                  <Badge variant={getActionBadgeVariant(selectedLog.action) as any} className="gap-1">
                    {getActionIcon(selectedLog.action)}
                    {getActionLabel(selectedLog.action)}
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Элемент</div>
                <div className="text-sm font-medium">{selectedLog.elementName || '—'}</div>
              </div>

              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Изменения</div>
                  <div className="bg-muted rounded-md p-3 text-xs font-mono overflow-auto max-h-48">
                    <pre>{JSON.stringify(selectedLog.changes, null, 2)}</pre>
                  </div>
                </div>
              )}

              {selectedLog.elementId && selectedLog.action !== 'delete' && (
                <div className="pt-2">
                  <button
                    className="text-sm text-primary hover:underline"
                    onClick={handleNavigateToElement}
                  >
                    Перейти к элементу →
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
