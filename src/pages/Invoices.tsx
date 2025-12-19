import { useState } from "react";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { EntityViewDialog } from "@/components/entity/EntityViewDialog";
import { Invoice, INVOICE_STATUSES } from "@/types/invoice";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { useInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from "@/hooks/useInvoices";
import { useClients } from "@/hooks/useClients";
import { useRequests } from "@/hooks/useRequests";
import { useEstimates } from "@/hooks/useEstimates";
import { Skeleton } from "@/components/ui/skeleton";

export default function Invoices() {
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: clientsData = [] } = useClients();
  const { data: requestsData = [] } = useRequests();
  const { data: estimatesData = [] } = useEstimates();
  
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  const deleteMutation = useDeleteInvoice();

  const clients = clientsData.map(c => ({ id: c.id, name: c.companyName }));
  const requests = requestsData.map(r => ({ id: r.id, name: r.requestNumber, createdAt: r.createdAt.toString() }));
  const estimates = estimatesData.map(e => ({ id: e.id, name: e.name, estimateDate: e.estimateDate }));

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>();
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

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
      { key: "invoiceDate", label: "Дата счёта", type: "date", sortable: true },
      { key: "clientName", label: "Контрагент", type: "text", searchable: true },
      { key: "requestName", label: "Заявка", type: "text", searchable: true },
      { key: "estimateName", label: "Основание (расчёт)", type: "text", searchable: true },
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
      const invoice = invoices.find(i => i.id === id);
      if (invoice) {
        updateMutation.mutate({ id, ...invoice, [field]: value });
      }
    },
    onDelete: (id) => deleteMutation.mutate(id),
    onEdit: (invoice) => {
      setEditingInvoice(invoice);
      setIsFormOpen(true);
    },
  };

  const handleSubmit = (data: Partial<Invoice>) => {
    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, ...data }, {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingInvoice(undefined);
        }
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false);
          setEditingInvoice(undefined);
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Счета" buttonLabel="Создать счёт" onButtonClick={() => {}} />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Счета"
        buttonLabel="Создать счёт"
        onButtonClick={() => {
          setEditingInvoice(undefined);
          setIsFormOpen(true);
        }}
      />

      <EntityList items={invoices} config={config} defaultViewMode="table" />

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
            clients={clients}
            requests={requests}
            estimates={estimates}
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
