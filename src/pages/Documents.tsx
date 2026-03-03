import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { Document, CONTRACT_TYPES, DOCUMENT_STATUSES } from "@/types/document";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentForm } from "@/components/documents/DocumentForm";
import { DocumentViewDialog } from "@/components/documents/DocumentViewDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { useDocuments, useCreateDocument, useUpdateDocument, useDeleteDocument } from "@/hooks/useDocuments";
import { useClients } from "@/hooks/useClients";
import { useServiceObjects } from "@/hooks/useServiceObjects";
import { useCanEdit } from "@/hooks/useUserRoles";
import { useDocumentAttachmentCounts } from "@/hooks/useDocumentAttachmentCounts";
import { DocumentAttachmentsCompact } from "@/components/documents/DocumentAttachmentsCompact";
import { Loader2, Paperclip, Minimize2, Maximize2, X, FileText } from "lucide-react";

export default function Documents() {
  const { data: documents = [], isLoading: documentsLoading } = useDocuments();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: serviceObjects = [] } = useServiceObjects();
  const { canEdit } = useCanEdit("documents");
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();

  const documentIds = documents.map(d => d.id);
  const { data: attachmentCounts = {} } = useDocumentAttachmentCounts(documentIds);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
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

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsDialogOpen(false);
  };

  const handleRestore = () => {
    setIsMinimized(false);
    setIsDialogOpen(true);
  };

  const handleCloseMinimized = () => {
    setIsMinimized(false);
    setEditingDocument(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && !isMinimized) {
      setIsDialogOpen(false);
      setEditingDocument(null);
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
    onEdit: canEdit ? (item) => { setEditingDocument(item); setIsMinimized(false); setIsDialogOpen(true); } : undefined,
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
    setIsMinimized(false);
    setEditingDocument(null);
  };

  if (documentsLoading || clientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const minimizedTitle = editingDocument
    ? `Редактирование: ${editingDocument.contractNumber}`
    : 'Новый документ';

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Документы"
          description="Управление договорами и документами"
          buttonLabel={canEdit ? "Добавить документ" : undefined}
          onButtonClick={canEdit ? () => { setIsMinimized(false); setIsDialogOpen(true); } : undefined}
        />

        <EntityList items={documents} config={config} emptyMessage="Нет документов. Добавьте первый документ." />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between pr-8">
            <DialogTitle>{editingDocument ? 'Редактировать документ' : 'Новый документ'}</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleMinimize}
              title="Свернуть"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
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

      {/* Свёрнутая плашка */}
      {isMinimized && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-lg animate-in slide-in-from-bottom-4 duration-300">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-medium truncate max-w-[240px]">
            {minimizedTitle}
          </span>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleRestore}
              title="Развернуть"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={handleCloseMinimized}
              title="Закрыть"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <DocumentViewDialog
        document={viewingDocument}
        open={!!viewingDocument}
        onOpenChange={(open) => !open && setViewingDocument(null)}
      />
    </>
  );
}
