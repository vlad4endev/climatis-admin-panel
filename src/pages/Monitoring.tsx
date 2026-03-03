import { useState } from "react";
import { useMonitoringLogs, MonitoringLog } from "@/hooks/useMonitoringLogs";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, MousePointerClick, XCircle, Bug } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const EVENT_TYPES = [
  { value: "all", label: "Все типы" },
  { value: "mutation_error", label: "Ошибки сохранения" },
  { value: "query_error", label: "Ошибки загрузки" },
  { value: "button_click", label: "Клики по кнопкам" },
  { value: "js_error", label: "JS-ошибки" },
];

const PAGE_LABELS: Record<string, string> = {
  "/clients": "Организации",
  "/contacts": "Контактные лица",
  "/service-objects": "Объекты",
  "/requests": "Заявки",
  "/documents": "Документы",
  "/estimates": "Расчёты",
  "/assignments": "Задания",
  "/employees": "Сотрудники",
  "/teams": "Бригады",
  "/tasks": "Задачи",
  "/spare-parts": "Комплектующие",
  "/stock-movements": "Расход/Приход",
  "/warehouse-categories": "Категории",
  "/invoices": "Счета",
  "/users": "Пользователи",
  "/trash": "Корзина",
  "/activity-logs": "Логи",
};

function getEventIcon(eventType: string) {
  switch (eventType) {
    case "mutation_error": return <XCircle className="h-4 w-4 text-destructive" />;
    case "query_error": return <AlertTriangle className="h-4 w-4 text-status-warning" />;
    case "button_click": return <MousePointerClick className="h-4 w-4 text-primary" />;
    case "js_error": return <Bug className="h-4 w-4 text-destructive" />;
    default: return null;
  }
}

function getEventBadgeVariant(eventType: string): "default" | "destructive" | "secondary" | "outline" {
  switch (eventType) {
    case "mutation_error":
    case "js_error":
      return "destructive";
    case "query_error":
      return "outline";
    case "button_click":
      return "secondary";
    default:
      return "default";
  }
}

function getEventLabel(eventType: string): string {
  switch (eventType) {
    case "mutation_error": return "Ошибка сохранения";
    case "query_error": return "Ошибка загрузки";
    case "button_click": return "Клик";
    case "js_error": return "JS-ошибка";
    default: return eventType;
  }
}

export default function Monitoring() {
  const { data: logs = [], isLoading } = useMonitoringLogs(500);
  const [search, setSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<MonitoringLog | null>(null);

  // Get unique users for filter
  const uniqueUsers = Array.from(
    new Map(logs.filter(l => l.userName).map(l => [l.userId, l.userName])).entries()
  ).map(([id, name]) => ({ id: id!, name: name! }));

  const filteredLogs = logs.filter(log => {
    const matchesSearch = search === "" ||
      log.message?.toLowerCase().includes(search.toLowerCase()) ||
      log.element?.toLowerCase().includes(search.toLowerCase()) ||
      log.userName?.toLowerCase().includes(search.toLowerCase()) ||
      log.page?.toLowerCase().includes(search.toLowerCase());
    const matchesType = eventTypeFilter === "all" || log.eventType === eventTypeFilter;
    const matchesUser = userFilter === "all" || log.userId === userFilter;
    return matchesSearch && matchesType && matchesUser;
  });

  // Stats
  const errorCount = logs.filter(l => l.eventType === "mutation_error" || l.eventType === "js_error" || l.eventType === "query_error").length;
  const clickCount = logs.filter(l => l.eventType === "button_click").length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Мониторинг" description="Отслеживание действий и ошибок пользователей" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Мониторинг"
          description="Отслеживание действий и ошибок пользователей"
        />

        {/* Stats */}
        <div className="flex gap-4 flex-wrap">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-destructive" />
            <div>
              <div className="text-2xl font-bold text-destructive">{errorCount}</div>
              <div className="text-xs text-muted-foreground">Ошибок</div>
            </div>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-3">
            <MousePointerClick className="h-5 w-5 text-primary" />
            <div>
              <div className="text-2xl font-bold text-primary">{clickCount}</div>
              <div className="text-xs text-muted-foreground">Кликов</div>
            </div>
          </div>
          <div className="bg-muted border rounded-lg px-4 py-3 flex items-center gap-3">
            <div>
              <div className="text-2xl font-bold">{logs.length}</div>
              <div className="text-xs text-muted-foreground">Всего событий</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по сообщению, элементу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Тип события" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Пользователь" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все пользователи</SelectItem>
              {uniqueUsers.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Дата</TableHead>
                <TableHead className="w-[140px]">Пользователь</TableHead>
                <TableHead className="w-[150px]">Тип</TableHead>
                <TableHead className="w-[130px]">Страница</TableHead>
                <TableHead className="w-[130px]">Элемент</TableHead>
                <TableHead>Сообщение</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Нет записей мониторинга
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map(log => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-table-row-hover"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </TableCell>
                    <TableCell className="text-sm">{log.userName || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEventIcon(log.eventType)}
                        <Badge variant={getEventBadgeVariant(log.eventType)} className="text-xs">
                          {getEventLabel(log.eventType)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.page ? (PAGE_LABELS[log.page] || log.page) : '—'}
                    </TableCell>
                    <TableCell className="text-sm max-w-[130px] truncate" title={log.element || ''}>
                      {log.element || '—'}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <span className="text-sm text-muted-foreground truncate block">
                        {log.message || '—'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Details dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детали события</DialogTitle>
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
                  <div className="text-xs text-muted-foreground mb-1">Тип события</div>
                  <div className="flex items-center gap-2">
                    {getEventIcon(selectedLog.eventType)}
                    <Badge variant={getEventBadgeVariant(selectedLog.eventType)}>
                      {getEventLabel(selectedLog.eventType)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Страница</div>
                  <div className="text-sm">
                    {selectedLog.page ? (PAGE_LABELS[selectedLog.page] || selectedLog.page) : '—'}
                  </div>
                </div>
              </div>

              {selectedLog.element && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Элемент</div>
                  <div className="text-sm font-medium">{selectedLog.element}</div>
                </div>
              )}

              <div>
                <div className="text-xs text-muted-foreground mb-1">Сообщение</div>
                <div className="text-sm bg-background/50 border rounded-md p-3">
                  {selectedLog.message || '—'}
                </div>
              </div>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Детали</div>
                  <div className="bg-background/50 border rounded-md p-3 font-mono text-xs overflow-auto max-h-48">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(selectedLog.details, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
