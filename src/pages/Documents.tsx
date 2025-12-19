import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { EntityViewDialog } from "@/components/entity/EntityViewDialog";
import { Document, CONTRACT_TYPES } from "@/types/document";
import { DocumentForm } from "@/components/documents/DocumentForm";
import { Client } from "@/types/client";
import { ServiceObject } from "@/types/serviceObject";
import { PageHeader } from "@/components/layout/PageHeader";

const mockClients: Client[] = [
  { id: '1', companyName: 'ООО "Рога и Копыта"', type: 'legal_entity', division: '', mainContactName: 'Иванов И.И.', phone: '+7 (999) 123-45-67', email: 'info@example.com', additionalContacts: [], notes: '', createdAt: new Date() },
  { id: '2', companyName: 'ИП Сидоров', type: 'individual_entrepreneur', division: '', mainContactName: 'Сидоров П.П.', phone: '+7 (999) 765-43-21', email: 'sidorov@example.com', additionalContacts: [], notes: '', createdAt: new Date() },
];

const mockServiceObjects: ServiceObject[] = [
  { id: '1', clientId: '1', clientName: 'ООО "Рога и Копыта"', objectName: 'Офис 1', address: 'г. Москва, ул. Ленина, 1, оф. 101', accessDescription: 'Код домофона: 1234', notes: '', createdAt: new Date() },
  { id: '2', clientId: '1', clientName: 'ООО "Рога и Копыта"', objectName: 'Склад', address: 'г. Москва, ул. Промышленная, 5', accessDescription: 'Въезд с пропуском', notes: '', createdAt: new Date() },
  { id: '3', clientId: '2', clientName: 'ИП Сидоров', objectName: 'Магазин', address: 'г. Санкт-Петербург, пр. Невский, 10', accessDescription: '', notes: '', createdAt: new Date() },
];

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      contractNumber: 'Д-001/2024',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      contractType: 'maintenance',
      clientId: '1',
      clientName: 'ООО "Рога и Копыта"',
      objectId: '1',
      objectName: 'Офис 1',
      responseConditions: 'Выезд в течение 24 часов с момента заявки',
      notes: 'Ежемесячное обслуживание кондиционеров',
      fileName: 'contract_001.pdf',
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  const config: EntityListConfig<Document> = {
    fields: [
      {
        key: 'contractNumber',
        label: 'Номер договора',
        type: 'text',
        sortable: true,
      },
      {
        key: 'startDate',
        label: 'Дата начала',
        type: 'date',
        sortable: true,
      },
      {
        key: 'endDate',
        label: 'Дата окончания',
        type: 'date',
        sortable: true,
      },
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
        options: mockClients.map(c => ({ value: c.id, label: c.companyName })),
        sortable: true,
        filterable: true,
        render: (value) => mockClients.find(c => c.id === value)?.companyName || '—',
      },
      {
        key: 'objectName',
        label: 'Объект',
        type: 'text',
        sortable: true,
        render: (value) => value || '—',
      },
      {
        key: 'responseConditions',
        label: 'Условия реагирования',
        type: 'textarea',
      },
      {
        key: 'notes',
        label: 'Примечания',
        type: 'textarea',
      },
      {
        key: 'fileName',
        label: 'Файл',
        type: 'text',
        render: (value) => value || '—',
      },
    ],
    getItemId: (item) => item.id,
    onRowClick: (item) => setViewingDocument(item),
    onEdit: (item) => {
      setEditingDocument(item);
      setIsDialogOpen(true);
    },
    onDelete: (id) => {
      setDocuments(documents.filter((doc) => doc.id !== id));
    },
  };

  const handleSubmit = (data: Omit<Document, 'id'>) => {
    if (editingDocument) {
      setDocuments(
        documents.map((doc) =>
          doc.id === editingDocument.id ? { ...data, id: editingDocument.id } : doc
        )
      );
    } else {
      const newDocument: Document = {
        ...data,
        id: Date.now().toString(),
      };
      setDocuments([...documents, newDocument]);
    }
    setIsDialogOpen(false);
    setEditingDocument(null);
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Документы"
          description="Управление договорами и документами"
          buttonLabel="Добавить документ"
          onButtonClick={() => setIsDialogOpen(true)}
        />

        <EntityList
          items={documents}
          config={config}
          emptyMessage="Нет документов. Добавьте первый документ."
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingDocument(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDocument ? 'Редактировать документ' : 'Новый документ'}
            </DialogTitle>
          </DialogHeader>
          <DocumentForm
            initialData={editingDocument || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingDocument(null);
            }}
            clients={mockClients}
            serviceObjects={mockServiceObjects}
          />
        </DialogContent>
      </Dialog>

      <EntityViewDialog
        item={viewingDocument}
        open={!!viewingDocument}
        onOpenChange={(open) => !open && setViewingDocument(null)}
        config={config}
        title={viewingDocument?.contractNumber}
      />
    </>
  );
}
