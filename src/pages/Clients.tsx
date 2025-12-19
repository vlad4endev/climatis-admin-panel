import { useState } from "react";
import { Client } from "@/types/client";
import { ClientForm } from "@/components/clients/ClientForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Phone, Building2 } from "lucide-react";
import { toast } from "sonner";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { EntityViewDialog } from "@/components/entity/EntityViewDialog";
import { PageHeader } from "@/components/layout/PageHeader";

const mockClients: Client[] = [
  {
    id: "1",
    companyName: "ООО 'Торговый дом Север'",
    type: "legal_entity",
    division: "Центральный офис",
    mainContactName: "Петров Петр Петрович",
    phone: "+7 (495) 123-45-67",
    email: "p.petrov@sever-td.ru",
    additionalContacts: [
      {
        id: "1",
        name: "Сидорова Анна Ивановна",
        phone: "+7 (495) 123-45-68",
        email: "a.sidorova@sever-td.ru",
      },
    ],
    notes: "Постоянный клиент с 2020 года. Требуется регулярное обслуживание системы кондиционирования в офисе.",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    companyName: "ИП Иванов Иван Иванович",
    type: "individual_entrepreneur",
    division: "",
    mainContactName: "Иванов Иван Иванович",
    phone: "+7 (916) 234-56-78",
    email: "ivanov.ip@gmail.com",
    additionalContacts: [],
    notes: "Ресторан 'У Ивана'. Установка вентиляционной системы на кухне.",
    createdAt: new Date("2024-02-20"),
  },
  {
    id: "3",
    companyName: "ООО 'МедЦентр Здоровье'",
    type: "legal_entity",
    division: "Филиал №2",
    mainContactName: "Смирнова Елена Александровна",
    phone: "+7 (499) 987-65-43",
    email: "info@medcentr-zdorovie.ru",
    additionalContacts: [
      {
        id: "2",
        name: "Козлов Андрей Викторович",
        phone: "+7 (499) 987-65-44",
      },
    ],
    notes: "Медицинский центр. Требуется поддержка специальных требований к микроклимату.",
    createdAt: new Date("2024-03-10"),
  },
];

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
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const handleSubmit = (clientData: Omit<Client, "id" | "createdAt">) => {
    if (editingClient) {
      setClients(prev =>
        prev.map(client =>
          client.id === editingClient.id
            ? { ...client, ...clientData }
            : client
        )
      );
      toast.success("Клиент обновлён");
    } else {
      const newClient: Client = {
        ...clientData,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      setClients([newClient, ...clients]);
      toast.success("Клиент успешно создан");
    }
    setIsFormOpen(false);
    setEditingClient(null);
  };

  const handleUpdateField = (id: string, field: string, value: any) => {
    setClients(prev =>
      prev.map(client =>
        client.id === id ? { ...client, [field]: value } : client
      )
    );
    toast.success("Данные обновлены");
  };

  const handleDeleteClient = (id: string) => {
    setClients(prev => prev.filter(client => client.id !== id));
    toast.success("Клиент удален");
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const clientsConfig: EntityListConfig<Client> = {
    fields: [
      {
        key: 'companyName',
        label: 'Название компании',
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
        editable: true,
        render: (value) => value ? <span className="text-sm">{value}</span> : <span className="text-muted-foreground text-sm">—</span>,
      },
      {
        key: 'mainContactName',
        label: 'Контактное лицо',
        type: 'text',
      },
      {
        key: 'phone',
        label: 'Телефон',
        type: 'phone',
        render: (value) => (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{value}</span>
          </div>
        ),
      },
      {
        key: 'email',
        label: 'Email',
        type: 'email',
        render: (value) => (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{value}</span>
          </div>
        ),
      },
      {
        key: 'notes',
        label: 'Примечания',
        type: 'textarea',
        render: (value) => (
          <div className="max-w-md text-sm text-muted-foreground line-clamp-2">
            {value}
          </div>
        ),
      },
    ],
    getItemId: (client) => client.id,
    onRowClick: (client) => setViewingClient(client),
    onUpdate: handleUpdateField,
    onDelete: handleDeleteClient,
    onEdit: handleEditClient,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Клиенты"
        description="Управление базой клиентов компании"
        buttonLabel="Добавить клиента"
        onButtonClick={() => setIsFormOpen(true)}
      />

      <EntityList
        items={clients}
        config={clientsConfig}
        emptyMessage="Нет клиентов. Создайте первого клиента."
        defaultViewMode="table"
      />

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingClient(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Редактировать клиента" : "Добавить клиента"}
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
