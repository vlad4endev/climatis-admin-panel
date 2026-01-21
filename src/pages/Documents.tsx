import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { Document, CONTRACT_TYPES, DOCUMENT_STATUSES } from "@/types/document";
import { Badge } from "@/components/ui/badge";
import { DocumentForm } from "@/components/documents/DocumentForm";
import { DocumentViewDialog } from "@/components/documents/DocumentViewDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocuments, useCreateDocument, useUpdateDocument, useDeleteDocument } from "@/hooks/useDocuments";
import { useClients } from "@/hooks/useClients";
import { useServiceObjects } from "@/hooks/useServiceObjects";
import { useCanEdit } from "@/hooks/useUserRoles";
import { useDocumentAttachmentCounts } from "@/hooks/useDocumentAttachmentCounts";
import { DocumentAttachmentsCompact } from "@/components/documents/DocumentAttachmentsCompact";
import { Loader2, Paperclip } from "lucide-react";

export default function Documents() {
  const { data: documents = [], isLoading: documentsLoading } = useDocuments();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: serviceObjects = [] } = useServiceObjects();
  const { canEdit } = useCanEdit("documents");
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();

  // Получаем счётчики вложений для всех документов
  const documentIds = documents.map(d => d.id);
  const { data: attachmentCounts = {} } = useDocumentAttachmentCounts(documentIds);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'active': return 'default';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const config: EntityListConfig<Document> = {
    fields: [
      { key: 'contractNumber', label: 'Номер договора', type: 'text', sortable: true },
      {
        key: 'status',
        label: 'Статус',
        type: 'select',
        options: DOCUMENT_STATUSES.map(s => ({ value: s.value, label: s.label })),
        sortable: true,
        filterable: true,
        render: (value) => {
          const status = DOCUMENT_STATUSES.find(s => s.value === value);
          return (
            <Badge variant={getStatusBadgeVariant(value)}>
              {status?.label || value}
            </Badge>
          );
        },
      },
      { key: 'startDate', label: 'Дата начала', type: 'date', sortable: true },
      { key: 'endDate', label: 'Дата окончания', type: 'date', sortable: true },
      {
        key: 'contractType',
        label: 'Тип договора',
        type: 'select',
        options: CONTRACT_TYPES.map(t => ({ value: t.value, label: t.label })),
        sortable: true,
        filterable: true,
        render: (value) => CONTRACT_TYPES.find(t => t.value === value)?.label || value,
      },
      {
        key: 'clientId',
        label: 'Контрагент',
        type: 'select',
        options: clients.map(c => ({ value: c.id, label: c.companyName })),
        sortable: true,
        filterable: true,
        render: (_, item) => item.clientName || '—',
      },
      { key: 'objectName', label: 'Объект', type: 'text', sortable: true, render: (value) => value || '—' },
      { key: 'responseConditions', label: 'Условия реагирования', type: 'textarea' },
      { key: 'notes', label: 'Примечания', type: 'textarea' },
      {
        key: 'attachments',
        label: 'Файлы',
        type: 'text',
        sortable: false,
        render: (_, item) => {
          const count = attachmentCounts[item.id] || 0;
          if (count === 0) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="flex items-center gap-1.5 text-primary">
              <Paperclip className="h-4 w-4" />
              <span>{count}</span>
            </div>
          );
        },
      },
    ],
    getItemId: (item) => item.id,
    onRowClick: (item) => setViewingDocument(item),
    onEdit: canEdit ? (item) => { setEditingDocument(item); setIsDialogOpen(true); } : undefined,
    onDelete: canEdit ? (id) => deleteDocument.mutate(id) : undefined,
    cardFooter: (item) => <DocumentAttachmentsCompact documentId={item.id} />,
  };

  const handleSubmit = async (data: Omit<Document, 'id' | 'clientName' | 'objectName'>) => {
    if (editingDocument) {
      await updateDocument.mutateAsync({ id: editingDocument.id, ...data });
    } else {
      await createDocument.mutateAsync(data);
    }
    setIsDialogOpen(false);
    setEditingDocument(null);
  };

  if (documentsLoading || clientsLoading) {
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
          title="Документы"
          description="Управление договорами и документами"
          buttonLabel={canEdit ? "Добавить документ" : undefined}
          onButtonClick={canEdit ? () => setIsDialogOpen(true) : undefined}
        />

        <EntityList items={documents} config={config} emptyMessage="Нет документов. Добавьте первый документ." />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingDocument(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDocument ? 'Редактировать документ' : 'Новый документ'}</DialogTitle>
          </DialogHeader>
          <DocumentForm
            initialData={editingDocument || undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setIsDialogOpen(false); setEditingDocument(null); }}
            clients={clients}
            serviceObjects={serviceObjects}
          />
        </DialogContent>
      </Dialog>

      <DocumentViewDialog
        document={viewingDocument}
        open={!!viewingDocument}
        onOpenChange={(open) => !open && setViewingDocument(null)}
      />
    </>
  );
}
