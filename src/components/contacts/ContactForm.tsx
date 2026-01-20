import { useState, useEffect } from "react";
import { Contact } from "@/types/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useClients } from "@/hooks/useClients";

interface ContactFormProps {
  contact?: Contact | null;
  onSubmit: (contact: Omit<Contact, "id" | "createdAt" | "clientName">) => void;
  onCancel: () => void;
  readOnly?: boolean;
}

export function ContactForm({ contact, onSubmit, onCancel, readOnly = false }: ContactFormProps) {
  const { data: clients = [] } = useClients();
  
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isMain, setIsMain] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (contact) {
      setClientId(contact.clientId);
      setName(contact.name);
      setPhone(contact.phone);
      setEmail(contact.email);
      setIsMain(contact.isMain);
      setNotes(contact.notes);
    }
  }, [contact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId || !name.trim()) {
      toast.error("Пожалуйста, заполните все обязательные поля");
      return;
    }

    onSubmit({
      clientId,
      name,
      phone,
      email,
      isMain,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="clientId">Организация {!readOnly && '*'}</Label>
        <Select value={clientId} onValueChange={setClientId} disabled={readOnly}>
          <SelectTrigger id="clientId" className={readOnly ? "bg-input-readonly" : ""}>
            <SelectValue placeholder="Выберите организацию" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">ФИО {!readOnly && '*'}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Иванов Иван Иванович"
          required={!readOnly}
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          className={readOnly ? "bg-input-readonly" : ""}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Телефон</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (999) 123-45-67"
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : undefined}
            className={readOnly ? "bg-input-readonly" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@company.ru"
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : undefined}
            className={readOnly ? "bg-input-readonly" : ""}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isMain"
          checked={isMain}
          onCheckedChange={(checked) => setIsMain(checked === true)}
          disabled={readOnly}
        />
        <Label htmlFor="isMain" className="cursor-pointer">
          Основное контактное лицо
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Примечания</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Дополнительная информация"
          rows={3}
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          className={readOnly ? "bg-input-readonly" : ""}
        />
      </div>

      {!readOnly && (
        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            {contact ? "Сохранить" : "Создать контакт"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
        </div>
      )}
    </form>
  );
}
