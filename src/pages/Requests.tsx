import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { Request, REQUEST_STATUSES, REQUEST_TYPES, REQUEST_PRIORITIES } from "@/types/request";
import { RequestForm } from "@/components/requests/RequestForm";
import { RequestViewDialog } from "@/components/requests/RequestViewDialog";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";

const mockClients = [
  { id: "1", companyName: "ООО Ромашка" },
  { id: "2", companyName: "ИП Иванов" },
];

const mockObjects = [
  { id: "1", objectName: "Офис на Ленина 15", clientId: "1" },
  { id: "2", objectName: "Склад на Гагарина 20", clientId: "2" },
];

const mockDocuments = [
  { id: "1", contractNumber: "Д-001/2024", clientId: "1", responseConditions: "Время реагирования: 4 часа. Время устранения неисправности: 24 часа." },
  { id: "2", contractNumber: "Д-002/2024", clientId: "2", responseConditions: "Время реагирования: 8 часов. Плановое ТО: ежеквартально." },
];

const mockEmployees = [
  { id: "1", fullName: "Иванов Иван Иванович" },
  { id: "2", fullName: "Петров Петр Петрович" },
];

const mockTeams = [
  { id: "1", teamName: "Бригада №1" },
  { id: "2", teamName: "Бригада №2" },
];

const mockRequests: Request[] = [
  {
    id: "1",
    requestNumber: "ЗВ-001",
    createdAt: new Date("2024-01-15T10:30:00"),
    status: "new",
    type: "repair",
    priority: "urgent",
    clientId: "1",
    clientName: "ООО Ромашка",
    objectId: "1",
    objectName: "Офис на Ленина 15",
    contractId: "1",
    contractNumber: "Д-001/2024",
    problemDescription: "Не работает кондиционер",
    comments: "Клиент просит приехать сегодня",
    desiredDate: "2024-01-16",
    responsibleManagerId: "1",
    responsibleManagerName: "Иванов Иван Иванович",
    assignedTeamId: "1",
    assignedTeamName: "Бригада №1",
  },
  {
    id: "2",
    requestNumber: "ЗВ-002",
    createdAt: new Date("2024-01-16T14:00:00"),
    status: "in_progress",
    type: "maintenance",
    priority: "normal",
    clientId: "2",
    clientName: "ИП Иванов",
    objectId: "2",
    objectName: "Склад на Гагарина 20",
    problemDescription: "Плановое ТО системы вентиляции",
    comments: "",
    plannedVisitDate: "2024-01-17T09:00",
    assignedTeamId: "2",
    assignedTeamName: "Бригада №2",
  },
];

export default function Requests() {
  const [requests, setRequests] = useState<Request[]>(mockRequests);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Request | undefined>();
  const [viewingRequest, setViewingRequest] = useState<Request | null>(null);
  const { toast } = useToast();

  const config: EntityListConfig<Request> = {
    fields: [
      { 
        key: "requestNumber", 
        label: "Номер", 
        type: "text", 
        sortable: true, 
        searchable: true,
        editable: false,
        render: (value) => <span className="font-medium">{value}</span>,
        cellClassName: (item) => item.priority === "urgent" ? "ring-2 ring-inset ring-red-500 rounded" : ""
      },
      { 
        key: "status", 
        label: "Статус", 
        type: "select",
        options: REQUEST_STATUSES,
        sortable: true,
        filterable: true,
        editable: false,
        render: (value) => {
          const status = REQUEST_STATUSES.find(s => s.value === value);
          const variantMap: Record<string, any> = {
            new: { bg: "bg-blue-500", text: "text-white" },
            needs_calculation: { bg: "bg-purple-500", text: "text-white" },
            awaiting_materials: { bg: "bg-orange-500", text: "text-white" },
            in_progress: { bg: "bg-cyan-500", text: "text-white" },
            partially_completed: { bg: "bg-yellow-500", text: "text-white" },
            completed: { bg: "bg-green-500", text: "text-white" },
            closed: { bg: "bg-gray-400", text: "text-white" },
          };
          const variant = variantMap[value as string];
          return (
            <Badge className={`${variant?.bg} ${variant?.text} border-transparent px-2 text-xs`}>
              {status?.label}
            </Badge>
          );
        }
      },
      { 
        key: "type", 
        label: "Тип", 
        type: "select",
        options: REQUEST_TYPES,
        filterable: true,
        editable: false,
        render: (value) => {
          const type = REQUEST_TYPES.find(t => t.value === value);
          return type?.label;
        }
      },
      { 
        key: "clientObject", 
        label: "Контрагент / Объект", 
        type: "text",
        searchable: true,
        editable: false,
        getValue: (item) => `${item.clientName} / ${item.objectName}`,
        render: (_, item) => (
          <div className="text-sm">
            <div className="font-medium">{item.clientName}</div>
            <div className="text-muted-foreground text-xs">{item.objectName}</div>
          </div>
        )
      },
      { 
        key: "problemDescription", 
        label: "Проблема", 
        type: "textarea",
        searchable: true,
        editable: false,
        render: (value) => (
          <div className="max-w-[200px] truncate" title={value}>
            {value}
          </div>
        )
      },
      { 
        key: "createdAt", 
        label: "Созд.", 
        type: "date",
        sortable: true,
        editable: false,
        render: (value) => new Date(value).toLocaleDateString("ru-RU")
      },
      { 
        key: "desiredDate", 
        label: "Срок", 
        type: "date",
        editable: false,
        render: (value) => value ? new Date(value).toLocaleDateString("ru-RU") : "-"
      },
      { 
        key: "assignedTeamName", 
        label: "Бригада", 
        type: "text",
        editable: false
      },
    ],
    getItemId: (item) => item.id,
    onRowClick: (item) => setViewingRequest(item),
    onDelete: (id) => {
      setRequests(prev => prev.filter(req => req.id !== id));
      toast({ title: "Заявка удалена" });
    },
    onEdit: (item) => {
      setEditingRequest(item);
      setIsFormOpen(true);
    },
  };

  const handleSubmit = (data: Partial<Request>) => {
    if (editingRequest) {
      setRequests(prev =>
        prev.map(req => (req.id === editingRequest.id ? { ...req, ...data } : req))
      );
      toast({ title: "Заявка обновлена" });
    } else {
      const newRequest: Request = {
        id: Math.random().toString(),
        createdAt: new Date(),
        ...data,
      } as Request;
      setRequests(prev => [...prev, newRequest]);
      toast({ title: "Заявка создана" });
    }
    setIsFormOpen(false);
    setEditingRequest(undefined);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Заявки"
        description="Управление заявками на обслуживание"
        buttonLabel="Создать заявку"
        onButtonClick={() => setIsFormOpen(true)}
      />

      <EntityList
        items={requests}
        config={config}
        emptyMessage="Нет заявок"
        kanbanGroupField="status"
        kanbanColumns={REQUEST_STATUSES}
      />

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingRequest(undefined);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRequest ? "Редактировать заявку" : "Создать заявку"}
            </DialogTitle>
          </DialogHeader>
          <RequestForm
            initialData={editingRequest}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingRequest(undefined);
            }}
            clients={mockClients}
            serviceObjects={mockObjects}
            documents={mockDocuments}
            employees={mockEmployees}
            teams={mockTeams}
          />
        </DialogContent>
      </Dialog>

      <RequestViewDialog
        request={viewingRequest}
        open={!!viewingRequest}
        onOpenChange={(open) => !open && setViewingRequest(null)}
      />
    </div>
  );
}
