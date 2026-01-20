import { useState } from "react";
import { Contact } from "@/types/contact";
import { ContactForm } from "@/components/contacts/ContactForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Phone, Building2, Star } from "lucide-react";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { EntityViewDialog } from "@/components/entity/EntityViewDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { useContacts, useCreateContact, useUpdateContact, useUpdateContactField, useDeleteContact } from "@/hooks/useContacts";
import { useClients } from "@/hooks/useClients";
import { useCanEdit } from "@/hooks/useUserRoles";
import { Loader2 } from "lucide-react";

export default function Contacts() {
  const { data: contacts = [], isLoading, error } = useContacts();
  const { data: clients = [] } = useClients();
  const { canEdit } = useCanEdit("contacts");
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const updateContactField = useUpdateContactField();
  const deleteContact = useDeleteContact();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);

  const handleSubmit = async (contactData: Omit<Contact, "id" | "createdAt" | "clientName">) => {
    if (editingContact) {
      await updateContact.mutateAsync({ id: editingContact.id, ...contactData });
    } else {
      await createContact.mutateAsync(contactData);
    }
    setIsFormOpen(false);
    setEditingContact(null);
  };

  const handleUpdateField = (id: string, field: string, value: unknown) => {
    updateContactField.mutate({ id, field, value });
  };

  const handleDeleteContact = (id: string) => {
    deleteContact.mutate(id);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const clientOptions = clients.map((client) => ({
    value: client.id,
    label: client.companyName,
  }));

  const contactsConfig: EntityListConfig<Contact> = {
    fields: [
      {
        key: 'name',
        label: 'ФИО',
        type: 'text',
        render: (value, item) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{value}</span>
            {item?.isMain && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            )}
          </div>
        ),
      },
      {
        key: 'clientId',
        label: 'Организация',
        type: 'select',
        options: clientOptions,
        render: (value, item) => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{item?.clientName || '—'}</span>
          </div>
        ),
      },
      {
        key: 'phone',
        label: 'Телефон',
        type: 'phone',
        render: (value) => value ? (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{value}</span>
          </div>
        ) : <span className="text-muted-foreground">—</span>,
      },
      {
        key: 'email',
        label: 'Email',
        type: 'email',
        render: (value) => value ? (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{value}</span>
          </div>
        ) : <span className="text-muted-foreground">—</span>,
      },
      {
        key: 'notes',
        label: 'Примечания',
        type: 'textarea',
        render: (value) => (
          <div className="max-w-md text-sm text-muted-foreground line-clamp-2">
            {value || '—'}
          </div>
        ),
      },
    ],
    getItemId: (contact) => contact.id,
    onRowClick: (contact) => setViewingContact(contact),
    onUpdate: canEdit ? handleUpdateField : undefined,
    onDelete: canEdit ? handleDeleteContact : undefined,
    onEdit: canEdit ? handleEditContact : undefined,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Ошибка загрузки данных: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Контактные лица"
        description="Управление контактными лицами организаций"
        buttonLabel={canEdit ? "Добавить контакт" : undefined}
        onButtonClick={canEdit ? () => setIsFormOpen(true) : undefined}
      />

      <EntityList
        items={contacts}
        config={contactsConfig}
        emptyMessage="Нет контактных лиц. Добавьте первый контакт."
        defaultViewMode="table"
      />

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingContact(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Редактировать контакт" : "Добавить контактное лицо"}
            </DialogTitle>
          </DialogHeader>
          <ContactForm
            contact={editingContact}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingContact(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <EntityViewDialog
        item={viewingContact}
        open={!!viewingContact}
        onOpenChange={(open) => !open && setViewingContact(null)}
        config={contactsConfig}
        title={viewingContact?.name}
      />
    </div>
  );
}
