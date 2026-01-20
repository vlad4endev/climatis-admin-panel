import { useState } from "react";
import { Client } from "@/types/client";
import { ClientForm } from "@/components/clients/ClientForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Building2 } from "lucide-react";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { EntityViewDialog } from "@/components/entity/EntityViewDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClients, useCreateClient, useUpdateClient, useUpdateClientField, useDeleteClient } from "@/hooks/useClients";
import { useCanEdit } from "@/hooks/useUserRoles";
import { Loader2 } from "lucide-react";

const getTypeLabel = (type: string) => {
  switch (type) {
    case "legal_entity":
      return "Юридическое лицо";
    case "individual_entrepreneur":
      return "ИП";
    default:
      return type;
  }
};

export default function Clients() {
  const { data: clients = [], isLoading, error } = useClients();
  const { canEdit } = useCanEdit("clients");
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const updateClientField = useUpdateClientField();
  const deleteClient = useDeleteClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const handleSubmit = async (clientData: Omit<Client, "id" | "createdAt">) => {
    if (editingClient) {
      await updateClient.mutateAsync({ id: editingClient.id, ...clientData });
    } else {
      await createClient.mutateAsync(clientData);
    }
    setIsFormOpen(false);
    setEditingClient(null);
  };

  const handleUpdateField = (id: string, field: string, value: unknown) => {
    updateClientField.mutate({ id, field, value });
  };

  const handleDeleteClient = (id: string) => {
    deleteClient.mutate(id);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const clientsConfig: EntityListConfig<Client> = {
    fields: [
      {
        key: 'companyName',
        label: 'Название организации',
        type: 'text',
        render: (value) => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{value}</span>
          </div>
        ),
      },
      {
        key: 'type',
        label: 'Тип',
        type: 'select',
        options: [
          { value: 'legal_entity', label: 'Юридическое лицо' },
          { value: 'individual_entrepreneur', label: 'ИП' },
        ],
        render: (value) => (
          <span className="text-sm">{getTypeLabel(value)}</span>
        ),
      },
      {
        key: 'division',
        label: 'Подразделение',
        type: 'text',
        searchable: true,
        render: (value) => value ? <span className="text-sm">{value}</span> : <span className="text-muted-foreground text-sm">—</span>,
      },
      {
        key: 'requisites',
        label: 'Реквизиты',
        type: 'textarea',
        render: (value) => (
          <div className="max-w-md text-sm text-muted-foreground line-clamp-2">
            {value || "—"}
          </div>
        ),
      },
      {
        key: 'notes',
        label: 'Примечания',
        type: 'textarea',
        render: (value) => (
          <div className="max-w-md text-sm text-muted-foreground line-clamp-2">
            {value || "—"}
          </div>
        ),
      },
    ],
    getItemId: (client) => client.id,
    onRowClick: (client) => setViewingClient(client),
    onDelete: canEdit ? handleDeleteClient : undefined,
    onEdit: canEdit ? handleEditClient : undefined,
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
        title="Организации"
        description="Управление базой организаций компании"
        buttonLabel={canEdit ? "Добавить организацию" : undefined}
        onButtonClick={canEdit ? () => setIsFormOpen(true) : undefined}
      />

      <EntityList
        items={clients}
        config={clientsConfig}
        emptyMessage="Нет организаций. Создайте первую организацию."
        defaultViewMode="table"
      />

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingClient(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Редактировать организацию" : "Добавить организацию"}
            </DialogTitle>
          </DialogHeader>
          <ClientForm
            client={editingClient}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingClient(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <EntityViewDialog
        item={viewingClient}
        open={!!viewingClient}
        onOpenChange={(open) => !open && setViewingClient(null)}
        config={clientsConfig}
        title={viewingClient?.companyName}
      />
    </div>
  );
}
