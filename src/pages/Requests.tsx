import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { Request, REQUEST_STATUSES, REQUEST_TYPES, REQUEST_PRIORITIES } from "@/types/request";
import { RequestForm } from "@/components/requests/RequestForm";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const mockClients = [
  { id: "1", companyName: "ООО Ромашка" },
  { id: "2", companyName: "ИП Иванов" },
];

const mockObjects = [
  { id: "1", objectName: "Офис на Ленина 15" },
  { id: "2", objectName: "Склад на Гагарина 20" },
];

const mockDocuments = [
  { id: "1", contractNumber: "Д-001/2024" },
  { id: "2", contractNumber: "Д-002/2024" },
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
  const { toast } = useToast();

  const config: EntityListConfig<Request> = {
    fields: [
      { 
        key: "requestNumber", 
        label: "Номер", 
        type: "text", 
        sortable: true, 
        searchable: true,
        render: (value, item) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{value}</span>
            {item.priority === "urgent" && (
              <Badge variant="destructive" className="text-xs">Срочно</Badge>
            )}
          </div>
        )
      },
      { 
        key: "status", 
        label: "Статус", 
        type: "select",
        options: REQUEST_STATUSES,
        sortable: true,
        filterable: true,
        editable: true,
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
            <Badge className={`${variant?.bg} ${variant?.text} border-transparent px-2`}>
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
        render: (value) => {
          const type = REQUEST_TYPES.find(t => t.value === value);
          return type?.label;
        }
      },
      { 
        key: "clientName", 
        label: "Контрагент", 
        type: "text",
        searchable: true
      },
      { 
        key: "objectName", 
        label: "Объект", 
        type: "text",
        searchable: true
      },
      { 
        key: "problemDescription", 
        label: "Проблема", 
        type: "textarea",
        searchable: true
      },
      { 
        key: "createdAt", 
        label: "Дата создания", 
        type: "date",
        sortable: true,
        render: (value) => new Date(value).toLocaleString("ru-RU")
      },
      { 
        key: "desiredDate", 
        label: "Желаемая дата", 
        type: "date",
        render: (value) => value ? new Date(value).toLocaleDateString("ru-RU") : "-"
      },
      { 
        key: "assignedTeamName", 
        label: "Бригада", 
        type: "text"
      },
      { 
        key: "responsibleManagerName", 
        label: "Менеджер", 
        type: "text"
      },
    ],
    getItemId: (item) => item.id,
    onUpdate: (id, field, value) => {
      setRequests(prev =>
        prev.map(req => (req.id === id ? { ...req, [field]: value } : req))
      );
      toast({ title: "Заявка обновлена" });
    },
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Заявки</h1>
          <p className="text-muted-foreground">Управление заявками на обслуживание</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Создать заявку
        </Button>
      </div>

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
    </div>
  );
}
