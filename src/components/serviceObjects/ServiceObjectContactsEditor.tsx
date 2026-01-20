import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  useContactsByClient,
  useServiceObjectContacts,
  useAssignContactToServiceObject,
  useRemoveContactFromServiceObject,
} from "@/hooks/useServiceObjectContacts";

interface ServiceObjectContactsEditorProps {
  serviceObjectId?: string;
  clientId?: string;
  readOnly?: boolean;
}

export function ServiceObjectContactsEditor({
  serviceObjectId,
  clientId,
  readOnly = false,
}: ServiceObjectContactsEditorProps) {
  const { data: assignedContacts = [], isLoading: assignedLoading } = useServiceObjectContacts(serviceObjectId);
  const { data: clientContacts = [], isLoading: clientContactsLoading } = useContactsByClient(clientId);
  const assignContact = useAssignContactToServiceObject();
  const removeContact = useRemoveContactFromServiceObject();
  
  const [selectedContactId, setSelectedContactId] = useState<string>("");

  // Инициализация выбранного контакта
  useEffect(() => {
    if (assignedContacts.length > 0) {
      setSelectedContactId(assignedContacts[0].id);
    } else if (clientContacts.length === 1) {
      // Если у клиента только один контакт — автовыбор
      setSelectedContactId(clientContacts[0].id);
    } else {
      setSelectedContactId("");
    }
  }, [assignedContacts, clientContacts]);

  // Обработка смены контакта
  const handleContactChange = async (newContactId: string) => {
    if (!serviceObjectId || readOnly) return;
    
    setSelectedContactId(newContactId);

    // Удаляем текущий привязанный контакт (если есть)
    if (assignedContacts.length > 0) {
      await removeContact.mutateAsync({
        serviceObjectId,
        contactId: assignedContacts[0].id,
      });
    }

    // Добавляем новый
    if (newContactId) {
      await assignContact.mutateAsync({
        serviceObjectId,
        contactId: newContactId,
      });
    }
  };

  if (!clientId) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Контактное лицо</Label>
        <div className="text-sm text-muted-foreground p-3 border rounded-lg border-dashed">
          Сначала выберите организацию
        </div>
      </div>
    );
  }

  if (!serviceObjectId) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Контактное лицо</Label>
        <div className="text-sm text-muted-foreground p-3 border rounded-lg border-dashed">
          Сначала сохраните объект, чтобы выбрать контактное лицо
        </div>
      </div>
    );
  }

  if (clientContactsLoading || assignedLoading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Контактное лицо</Label>
        <div className="flex items-center gap-2 p-3">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (clientContacts.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Контактное лицо</Label>
        <div className="text-sm text-muted-foreground p-3 border rounded-lg border-dashed">
          У организации нет контактных лиц
        </div>
      </div>
    );
  }

  const selectedContact = clientContacts.find(c => c.id === selectedContactId);
  const isSingleContact = clientContacts.length === 1;
  const isDisabled = readOnly || isSingleContact || assignContact.isPending || removeContact.isPending;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Контактное лицо</Label>
      
      {isSingleContact ? (
        // Только один контакт — показываем как текст
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
          <span>{clientContacts[0].name}</span>
          {clientContacts[0].isMain && (
            <Badge variant="secondary" className="text-xs">Основной</Badge>
          )}
          {clientContacts[0].phone && (
            <span className="text-sm text-muted-foreground ml-auto">{clientContacts[0].phone}</span>
          )}
        </div>
      ) : (
        // Несколько контактов — выпадающий список
        <Select
          value={selectedContactId}
          onValueChange={handleContactChange}
          disabled={isDisabled}
        >
          <SelectTrigger className={readOnly ? "bg-input-readonly" : ""}>
            <SelectValue placeholder="Выберите контактное лицо">
              {selectedContact && (
                <div className="flex items-center gap-2">
                  <span>{selectedContact.name}</span>
                  {selectedContact.isMain && (
                    <Badge variant="secondary" className="text-xs">Основной</Badge>
                  )}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {clientContacts.map((contact) => (
              <SelectItem key={contact.id} value={contact.id}>
                <div className="flex items-center gap-2">
                  <span>{contact.name}</span>
                  {contact.isMain && (
                    <Badge variant="secondary" className="text-xs">Основной</Badge>
                  )}
                  {contact.phone && (
                    <span className="text-muted-foreground ml-2">{contact.phone}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
