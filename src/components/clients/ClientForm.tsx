import { useState, useEffect } from "react";
import { Client, ClientType, AdditionalContact } from "@/types/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface ClientFormProps {
  client?: Client | null;
  onSubmit: (client: Omit<Client, "id" | "createdAt">) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

export function ClientForm({ client, onSubmit, onCancel, readOnly = false }: ClientFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [type, setType] = useState<ClientType>("legal_entity");
  const [division, setDivision] = useState("");
  const [mainContactName, setMainContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [additionalContacts, setAdditionalContacts] = useState<AdditionalContact[]>([]);

  useEffect(() => {
    if (client) {
      setCompanyName(client.companyName);
      setType(client.type);
      setDivision(client.division);
      setMainContactName(client.mainContactName);
      setPhone(client.phone);
      setEmail(client.email);
      setNotes(client.notes);
      setAdditionalContacts(client.additionalContacts || []);
    }
  }, [client]);

  const handleAddContact = () => {
    setAdditionalContacts([
      ...additionalContacts,
      { id: Date.now().toString(), name: "", phone: "", email: "" },
    ]);
  };

  const handleRemoveContact = (id: string) => {
    setAdditionalContacts(additionalContacts.filter((c) => c.id !== id));
  };

  const handleContactChange = (id: string, field: keyof AdditionalContact, value: string) => {
    setAdditionalContacts(
      additionalContacts.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim() || !mainContactName.trim() || !phone.trim() || !email.trim()) {
      toast.error("Пожалуйста, заполните все обязательные поля");
      return;
    }

    onSubmit({
      companyName,
      type,
      division,
      mainContactName,
      phone,
      email,
      notes,
      additionalContacts: additionalContacts.filter((c) => c.name.trim()),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="companyName">Название организации {!readOnly && '*'}</Label>
        <Input
          id="companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="ООО 'Пример'"
          required={!readOnly}
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          className={readOnly ? "bg-input-readonly" : ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Тип {!readOnly && '*'}</Label>
        <Select value={type} onValueChange={(value) => setType(value as ClientType)} disabled={readOnly}>
          <SelectTrigger id="type" className={readOnly ? "bg-input-readonly" : ""}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="legal_entity">Юридическое лицо</SelectItem>
            <SelectItem value="individual_entrepreneur">Индивидуальный предприниматель</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="division">Подразделение</Label>
        <Input
          id="division"
          value={division}
          onChange={(e) => setDivision(e.target.value)}
          placeholder="Филиал / цех / предприятие"
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          className={readOnly ? "bg-input-readonly" : ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mainContactName">Основное контактное лицо (ФИО) {!readOnly && '*'}</Label>
        <Input
          id="mainContactName"
          value={mainContactName}
          onChange={(e) => setMainContactName(e.target.value)}
          placeholder="Иванов Иван Иванович"
          required={!readOnly}
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          className={readOnly ? "bg-input-readonly" : ""}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Телефон {!readOnly && '*'}</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (999) 123-45-67"
            required={!readOnly}
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : undefined}
            className={readOnly ? "bg-input-readonly" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail {!readOnly && '*'}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@company.ru"
            required={!readOnly}
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : undefined}
            className={readOnly ? "bg-input-readonly" : ""}
          />
        </div>
      </div>

      {!readOnly && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Дополнительные контактные лица</Label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddContact}>
              <Plus className="h-4 w-4 mr-1" />
              Добавить контакт
            </Button>
          </div>

          {additionalContacts.map((contact, index) => (
            <div key={contact.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Контакт {index + 1}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveContact(contact.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="ФИО"
                value={contact.name}
                onChange={(e) => handleContactChange(contact.id, "name", e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  placeholder="Телефон"
                  value={contact.phone || ""}
                  onChange={(e) => handleContactChange(contact.id, "phone", e.target.value)}
                />
                <Input
                  placeholder="E-mail"
                  type="email"
                  value={contact.email || ""}
                  onChange={(e) => handleContactChange(contact.id, "email", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {readOnly && additionalContacts.length > 0 && (
        <div className="space-y-3">
          <Label>Дополнительные контактные лица</Label>
          {additionalContacts.map((contact, index) => (
            <div key={contact.id} className="p-4 border rounded-lg space-y-2 bg-input-readonly">
              <div className="font-medium">{contact.name}</div>
              {contact.phone && <div className="text-sm text-muted-foreground">{contact.phone}</div>}
              {contact.email && <div className="text-sm text-muted-foreground">{contact.email}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Примечания</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Дополнительная информация о клиенте"
          rows={4}
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          className={readOnly ? "bg-input-readonly" : ""}
        />
      </div>

      {!readOnly && (
        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            {client ? "Сохранить" : "Создать организацию"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
        </div>
      )}
    </form>
  );
}
