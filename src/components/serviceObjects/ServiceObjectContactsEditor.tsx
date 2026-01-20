import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Phone, Mail, Star, UserPlus, X } from "lucide-react";
import {
  useContactsByClient,
  useServiceObjectContacts,
  useAssignContactToServiceObject,
  useRemoveContactFromServiceObject,
} from "@/hooks/useServiceObjectContacts";
import { cn } from "@/lib/utils";

interface ServiceObjectContactsEditorProps {
  serviceObjectId: string | undefined;
  clientId: string | undefined;
  readOnly?: boolean;
}

export function ServiceObjectContactsEditor({
  serviceObjectId,
  clientId,
  readOnly = false,
}: ServiceObjectContactsEditorProps) {
  const [isAdding, setIsAdding] = useState(false);

  const { data: clientContacts = [], isLoading: isLoadingClient } =
    useContactsByClient(clientId);
  const { data: assignedContacts = [], isLoading: isLoadingAssigned } =
    useServiceObjectContacts(serviceObjectId);

  const assignContact = useAssignContactToServiceObject();
  const removeContact = useRemoveContactFromServiceObject();

  const assignedIds = new Set(assignedContacts.map((c) => c.id));
  const availableContacts = clientContacts.filter((c) => !assignedIds.has(c.id));

  const handleToggleContact = (contactId: string, isAssigned: boolean) => {
    if (!serviceObjectId) return;

    if (isAssigned) {
      removeContact.mutate({ serviceObjectId, contactId });
    } else {
      assignContact.mutate({ serviceObjectId, contactId });
    }
  };

  if (!clientId) {
    return (
      <div className="text-sm text-muted-foreground p-4 border rounded-lg">
        Сначала выберите организацию
      </div>
    );
  }

  if (!serviceObjectId) {
    return (
      <div className="text-sm text-muted-foreground p-4 border rounded-lg">
        Сначала сохраните объект, чтобы закрепить контактные лица
      </div>
    );
  }

  if (isLoadingClient || isLoadingAssigned) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Контактные лица объекта</h4>
        {!readOnly && availableContacts.length > 0 && assignedContacts.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? (
              <>
                <X className="h-4 w-4 mr-1" />
                Скрыть
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-1" />
                Добавить
              </>
            )}
          </Button>
        )}
      </div>

      {/* Закреплённые контакты */}
      {assignedContacts.length === 0 && !readOnly && availableContacts.length > 0 ? (
        <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
          <p className="text-sm text-muted-foreground mb-2">
            Выберите контактных лиц организации:
          </p>
          {availableContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
              onClick={() => handleToggleContact(contact.id, false)}
            >
              <Checkbox
                checked={false}
                disabled={assignContact.isPending}
              />
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="truncate">{contact.name}</span>
                {contact.isMain && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    Основной
                  </Badge>
                )}
                {contact.phone && (
                  <span className="text-sm text-muted-foreground">{contact.phone}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : assignedContacts.length === 0 ? (
        <div className="text-sm text-muted-foreground p-3 border rounded-lg border-dashed">
          Нет закреплённых контактов
        </div>
      ) : (
        <div className="space-y-2">
          {assignedContacts.map((contact) => (
            <div
              key={contact.id}
              className={cn(
                "flex items-center justify-between p-3 border rounded-lg bg-card",
                contact.isMain && "border-primary/50 bg-primary/5"
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{contact.name}</span>
                    {contact.isMain && (
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </span>
                    )}
                    {contact.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleContact(contact.id, true)}
                  disabled={removeContact.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Выбор контактов для добавления (когда уже есть закреплённые) */}
      {isAdding && availableContacts.length > 0 && (
        <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
          <p className="text-sm text-muted-foreground mb-2">
            Доступные контакты организации:
          </p>
          {availableContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
              onClick={() => handleToggleContact(contact.id, false)}
            >
              <Checkbox
                checked={false}
                disabled={assignContact.isPending}
              />
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="truncate">{contact.name}</span>
                {contact.isMain && (
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    Основной
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {clientContacts.length === 0 && (
        <div className="text-sm text-muted-foreground p-3 border rounded-lg border-dashed">
          У организации нет контактных лиц
        </div>
      )}
    </div>
  );
}
