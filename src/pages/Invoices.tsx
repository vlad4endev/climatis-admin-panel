import { useState } from "react";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { EntityViewDialog } from "@/components/entity/EntityViewDialog";
import { Invoice, INVOICE_STATUSES } from "@/types/invoice";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const mockClients = [
  { id: "1", name: "ООО Теплосеть" },
  { id: "2", name: "АО Энергомаш" },
  { id: "3", name: "ИП Петров" },
];

const mockRequests = [
  { id: "1", name: "Заявка #001 - Ремонт котла", createdAt: "2024-01-15" },
  { id: "2", name: "Заявка #002 - ТО системы", createdAt: "2024-01-20" },
  { id: "3", name: "Заявка #003 - Замена насоса", createdAt: "2024-01-25" },
];

const mockEstimates = [
  { id: "1", name: "Расчёт по ремонту котла", estimateDate: "2024-01-16" },
  { id: "2", name: "Смета на ТО", estimateDate: "2024-01-21" },
  { id: "3", name: "Расчёт замены насоса", estimateDate: "2024-01-26" },
];

const mockInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "СЧ-2024-001",
    invoiceDate: "2024-01-17",
    clientId: "1",
    clientName: "ООО Теплосеть",
    requestId: "1",
    requestName: "Заявка #001 - Ремонт котла",
    estimateId: "1",
    estimateName: "Расчёт по ремонту котла",
    amount: 125000,
    status: "оплачен",
  },
  {
    id: "2",
    invoiceNumber: "СЧ-2024-002",
    invoiceDate: "2024-01-22",
    clientId: "2",
    clientName: "АО Энергомаш",
    requestId: "2",
    requestName: "Заявка #002 - ТО системы",
    estimateId: "2",
    estimateName: "Смета на ТО",
    amount: 85000,
    status: "выставлен",
  },
  {
    id: "3",
    invoiceNumber: "СЧ-2024-003",
    invoiceDate: "2024-01-27",
    clientId: "3",
    clientName: "ИП Петров",
    requestId: "3",
    requestName: "Заявка #003 - Замена насоса",
    estimateId: "3",
    estimateName: "Расчёт замены насоса",
    amount: 45000,
    status: "подготовлен",
  },
];

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>();
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, { bg: string; text: string }> = {
      "подготовлен": { bg: "bg-blue-500", text: "text-white" },
      "выставлен": { bg: "bg-orange-500", text: "text-white" },
      "оплачен": { bg: "bg-green-500", text: "text-white" },
      "отменён": { bg: "bg-gray-400", text: "text-white" },
    };
    return colorMap[status] || { bg: "bg-gray-400", text: "text-white" };
  };

  const config: EntityListConfig<Invoice> = {
    getItemId: (item) => item.id,
    onRowClick: (item) => setViewingInvoice(item),
    fields: [
      {
        key: "invoiceNumber",
        label: "Номер счёта",
        type: "text",
        searchable: true,
        render: (value) => <span className="font-medium">{value}</span>,
      },
      {
        key: "invoiceDate",
        label: "Дата счёта",
        type: "date",
        sortable: true,
      },
      {
        key: "clientName",
        label: "Контрагент",
        type: "text",
        searchable: true,
      },
      {
        key: "requestName",
        label: "Заявка",
        type: "text",
        searchable: true,
      },
      {
        key: "estimateName",
        label: "Основание (расчёт)",
        type: "text",
        searchable: true,
      },
      {
        key: "amount",
        label: "Сумма",
        type: "text",
        sortable: true,
        render: (value) => (
          <span className="font-medium">
            {Math.round(value as number).toLocaleString('ru-RU')} ₽
          </span>
        ),
      },
      {
        key: "status",
        label: "Статус",
        type: "select",
        options: INVOICE_STATUSES,
        filterable: true,
        render: (value) => {
          const colors = getStatusColor(value);
          return (
            <Badge className={`${colors.bg} ${colors.text} border-transparent px-2`}>
              {INVOICE_STATUSES.find((s) => s.value === value)?.label || value}
            </Badge>
          );
        },
      },
    ],
    onUpdate: (id, field, value) => {
      setInvoices((prev) =>
        prev.map((invoice) =>
          invoice.id === id ? { ...invoice, [field]: value } : invoice
        )
      );
      toast({
        title: "Счёт обновлён",
        description: "Изменения сохранены",
      });
    },
    onDelete: (id) => {
      setInvoices((prev) => prev.filter((invoice) => invoice.id !== id));
      toast({
        title: "Счёт удалён",
        description: "Счёт успешно удалён",
      });
    },
    onEdit: (invoice) => {
      setEditingInvoice(invoice);
      setIsFormOpen(true);
    },
  };

  const handleSubmit = (data: Partial<Invoice>) => {
    if (editingInvoice) {
      setInvoices((prev) =>
        prev.map((invoice) =>
          invoice.id === editingInvoice.id
            ? { ...invoice, ...data }
            : invoice
        )
      );
      toast({
        title: "Счёт обновлён",
        description: "Изменения успешно сохранены",
      });
    } else {
      const selectedClient = mockClients.find((c) => c.id === data.clientId);
      const selectedRequest = mockRequests.find((r) => r.id === data.requestId);
      const selectedEstimate = mockEstimates.find((e) => e.id === data.estimateId);

      const newInvoice: Invoice = {
        id: Date.now().toString(),
        invoiceNumber: data.invoiceNumber || "",
        invoiceDate: data.invoiceDate || new Date().toISOString().split('T')[0],
        clientId: data.clientId,
        clientName: selectedClient?.name,
        requestId: data.requestId,
        requestName: selectedRequest?.name,
        estimateId: data.estimateId,
        estimateName: selectedEstimate?.name,
        amount: data.amount || 0,
        status: data.status || "подготовлен",
      };
      setInvoices((prev) => [newInvoice, ...prev]);
      toast({
        title: "Счёт создан",
        description: "Новый счёт успешно создан",
      });
    }
    setIsFormOpen(false);
    setEditingInvoice(undefined);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Счета</h1>
        <Button
          onClick={() => {
            setEditingInvoice(undefined);
            setIsFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Создать счёт
        </Button>
      </div>

      <EntityList
        items={invoices}
        config={config}
        defaultViewMode="table"
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice ? "Редактировать счёт" : "Создать счёт"}
            </DialogTitle>
          </DialogHeader>
          <InvoiceForm
            invoice={editingInvoice}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingInvoice(undefined);
            }}
            clients={mockClients}
            requests={mockRequests}
            estimates={mockEstimates}
          />
        </DialogContent>
      </Dialog>

      <EntityViewDialog
        item={viewingInvoice}
        open={!!viewingInvoice}
        onOpenChange={(open) => !open && setViewingInvoice(null)}
        config={config}
        title={viewingInvoice?.invoiceNumber}
      />
    </div>
  );
}
