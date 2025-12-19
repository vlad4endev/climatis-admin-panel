import { useState } from "react";
import { ServiceObject } from "@/types/serviceObject";
import { Client } from "@/types/client";
import { ServiceObjectForm } from "@/components/serviceObjects/ServiceObjectForm";
import { MapPin, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { EntityViewDialog } from "@/components/entity/EntityViewDialog";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";

const mockClients: Client[] = [
  {
    id: "1",
    companyName: "ООО 'Торговый дом Север'",
    type: "legal_entity",
    division: "",
    mainContactName: "Петров Петр Петрович",
    phone: "+7 (495) 123-45-67",
    email: "p.petrov@sever-td.ru",
    additionalContacts: [],
    notes: "",
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
    notes: "",
    createdAt: new Date("2024-02-20"),
  },
  {
    id: "3",
    companyName: "ООО 'МедЦентр Здоровье'",
    type: "legal_entity",
    division: "",
    mainContactName: "Смирнова Елена Александровна",
    phone: "+7 (499) 987-65-43",
    email: "info@medcentr-zdorovie.ru",
    additionalContacts: [],
    notes: "",
    createdAt: new Date("2024-03-10"),
  },
];

const mockServiceObjects: ServiceObject[] = [
  {
    id: "1",
    clientId: "1",
    clientName: "ООО 'Торговый дом Север'",
    objectName: "Главный офис",
    address: "г. Москва, ул. Ленина, д. 10",
    accessDescription: "Код домофона 1234. Через охрану.",
    notes: "Режим работы офиса с 9:00 до 18:00",
    createdAt: new Date("2024-01-20"),
  },
  {
    id: "2",
    clientId: "1",
    clientName: "ООО 'Торговый дом Север'",
    objectName: "Склад №1",
    address: "г. Москва, Промзона Север, ул. Складская, 5",
    accessDescription: "Пропуск через КПП. Звонить заранее.",
    notes: "Крупная холодильная установка",
    createdAt: new Date("2024-02-10"),
  },
  {
    id: "3",
    clientId: "2",
    clientName: "ИП Иванов Иван Иванович",
    objectName: "Ресторан 'У Ивана'",
    address: "г. Москва, ул. Пушкина, д. 25",
    accessDescription: "Через черный ход с улицы",
    notes: "Вентиляционная система на кухне",
    createdAt: new Date("2024-03-01"),
  },
];

export default function ServiceObjects() {
  const [objects, setObjects] = useState<ServiceObject[]>(mockServiceObjects);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingObject, setEditingObject] = useState<ServiceObject | null>(null);
  const [viewingObject, setViewingObject] = useState<ServiceObject | null>(null);

  const handleCreateObject = (objectData: Omit<ServiceObject, "id" | "createdAt" | "clientName">) => {
    const client = mockClients.find(c => c.id === objectData.clientId);
    if (!client) return;

    const newObject: ServiceObject = {
      ...objectData,
      id: Date.now().toString(),
      clientName: client.companyName,
      createdAt: new Date(),
    };
    setObjects([newObject, ...objects]);
    setIsFormVisible(false);
    setEditingObject(null);
    toast.success("Объект обслуживания создан");
  };

  const handleUpdateField = (id: string, field: string, value: any) => {
    setObjects(prev =>
      prev.map(obj => {
        if (obj.id !== id) return obj;
        
        if (field === 'clientId') {
          const client = mockClients.find(c => c.id === value);
          return { ...obj, clientId: value, clientName: client?.companyName || '' };
        }
        
        return { ...obj, [field]: value };
      })
    );
    toast.success("Данные обновлены");
  };

  const handleDeleteObject = (id: string) => {
    setObjects(prev => prev.filter(obj => obj.id !== id));
    toast.success("Объект удален");
  };

  const handleEditObject = (obj: ServiceObject) => {
    setEditingObject(obj);
    setIsFormVisible(true);
  };

  const objectsConfig: EntityListConfig<ServiceObject> = {
    fields: [
      {
        key: 'objectName',
        label: 'Название объекта',
        type: 'text',
        render: (value) => (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{value}</span>
          </div>
        ),
      },
      {
        key: 'clientName',
        label: 'Клиент',
        type: 'select',
        editable: false,
        options: mockClients.map(c => ({ value: c.id, label: c.companyName })),
        getValue: (obj) => obj.clientId,
        render: (_, obj) => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline">{obj.clientName}</Badge>
          </div>
        ),
      },
      {
        key: 'address',
        label: 'Адрес',
        type: 'text',
        render: (value) => (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{value}</span>
          </div>
        ),
      },
      {
        key: 'accessDescription',
        label: 'Особенности доступа',
        type: 'textarea',
        render: (value) => (
          <div className="max-w-md text-sm text-muted-foreground line-clamp-2">
            {value || '—'}
          </div>
        ),
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
    getItemId: (obj) => obj.id,
    onRowClick: (obj) => setViewingObject(obj),
    onUpdate: handleUpdateField,
    onDelete: handleDeleteObject,
    onEdit: handleEditObject,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Объекты обслуживания"
        description="Управление объектами клиентов"
        buttonLabel="Добавить объект"
        onButtonClick={() => setIsFormVisible(true)}
      />

      <EntityList
        items={objects}
        config={objectsConfig}
        emptyMessage="Нет объектов обслуживания. Создайте первый объект."
      />

      <Dialog open={isFormVisible} onOpenChange={(open) => {
        setIsFormVisible(open);
        if (!open) setEditingObject(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingObject ? "Редактировать объект" : "Добавить объект"}
            </DialogTitle>
          </DialogHeader>
          <ServiceObjectForm
            clients={mockClients}
            onSubmit={handleCreateObject}
            onCancel={() => {
              setIsFormVisible(false);
              setEditingObject(null);
            }}
            initialData={editingObject || undefined}
          />
        </DialogContent>
      </Dialog>

      <EntityViewDialog
        item={viewingObject}
        open={!!viewingObject}
        onOpenChange={(open) => !open && setViewingObject(null)}
        config={objectsConfig}
        title={viewingObject?.objectName}
      />
    </div>
  );
}
