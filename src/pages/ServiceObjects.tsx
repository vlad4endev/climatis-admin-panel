import { useState } from "react";
import { ServiceObject } from "@/types/serviceObject";
import { ServiceObjectForm } from "@/components/serviceObjects/ServiceObjectForm";
import { ServiceObjectViewDialog } from "@/components/serviceObjects/ServiceObjectViewDialog";
import { MapPin, Building2, User, Loader2, Users } from "lucide-react";
import { EntityList } from "@/components/entity/EntityList";
import { EntityListConfig } from "@/components/entity/types";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { useServiceObjects, useCreateServiceObject, useUpdateServiceObject, useDeleteServiceObject } from "@/hooks/useServiceObjects";
import { useClients } from "@/hooks/useClients";
import { useCanEdit } from "@/hooks/useUserRoles";

export default function ServiceObjects() {
  const { data: objects = [], isLoading: objectsLoading } = useServiceObjects();
  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { canEdit } = useCanEdit("service-objects");
  const createObject = useCreateServiceObject();
  const updateObject = useUpdateServiceObject();
  const deleteObject = useDeleteServiceObject();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingObject, setEditingObject] = useState<ServiceObject | null>(null);
  const [viewingObject, setViewingObject] = useState<ServiceObject | null>(null);

  const handleSubmit = async (objectData: Omit<ServiceObject, "id" | "createdAt" | "clientName">) => {
    if (editingObject) {
      await updateObject.mutateAsync({ id: editingObject.id, ...objectData });
    } else {
      await createObject.mutateAsync(objectData);
    }
    setIsFormVisible(false);
    setEditingObject(null);
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
        label: 'Организация',
        type: 'select',
        editable: false,
        options: clients.map(c => ({ value: c.id, label: c.companyName })),
        getValue: (obj) => obj.clientId,
        render: (_, obj) => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline">{obj.clientName}</Badge>
          </div>
        ),
      },
      {
        key: 'assignedContacts',
        label: 'Контактные лица',
        type: 'text',
        editable: false,
        searchable: false,
        render: (_, obj) => {
          const contacts = obj.assignedContacts || [];
          if (contacts.length === 0) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-wrap gap-1">
                {contacts.map((contact) => (
                  <Badge key={contact.id} variant="secondary" className="text-xs">
                    {contact.name}
                  </Badge>
                ))}
              </div>
            </div>
          );
        },
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
          <div className="max-w-md text-sm text-muted-foreground line-clamp-2">{value || '—'}</div>
        ),
      },
      {
        key: 'notes',
        label: 'Примечания',
        type: 'textarea',
        render: (value) => (
          <div className="max-w-md text-sm text-muted-foreground line-clamp-2">{value || '—'}</div>
        ),
      },
    ],
    getItemId: (obj) => obj.id,
    onRowClick: (obj) => setViewingObject(obj),
    onDelete: canEdit ? (id) => deleteObject.mutate(id) : undefined,
    onEdit: canEdit ? (obj) => { setEditingObject(obj); setIsFormVisible(true); } : undefined,
  };

  if (objectsLoading || clientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Объекты обслуживания"
        description="Управление объектами клиентов"
        buttonLabel={canEdit ? "Добавить объект" : undefined}
        onButtonClick={canEdit ? () => setIsFormVisible(true) : undefined}
      />

      <EntityList items={objects} config={objectsConfig} emptyMessage="Нет объектов обслуживания. Создайте первый объект." />

      <Dialog open={isFormVisible} onOpenChange={(open) => { setIsFormVisible(open); if (!open) setEditingObject(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingObject ? "Редактировать объект" : "Добавить объект"}</DialogTitle>
          </DialogHeader>
          <ServiceObjectForm
            clients={clients}
            onSubmit={handleSubmit}
            onCancel={() => { setIsFormVisible(false); setEditingObject(null); }}
            initialData={editingObject || undefined}
          />
        </DialogContent>
      </Dialog>

      <ServiceObjectViewDialog
        item={viewingObject}
        open={!!viewingObject}
        onOpenChange={(open) => !open && setViewingObject(null)}
      />
    </div>
  );
}
