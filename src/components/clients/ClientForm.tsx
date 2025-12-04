import { useState } from "react";
import { Client, ClientType, AdditionalContact } from "@/types/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface ClientFormProps {
  onSubmit: (client: Omit<Client, "id" | "createdAt">) => void;
  onCancel: () => void;
}

export function ClientForm({ onSubmit, onCancel }: ClientFormProps) {
  const [companyName, setCompanyName] = useState("");
  const [type, setType] = useState<ClientType>("legal_entity");
  const [division, setDivision] = useState("");
  const [mainContactName, setMainContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [additionalContacts, setAdditionalContacts] = useState<AdditionalContact[]>([]);

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
    <Card>
      <CardHeader>
        <CardTitle>Новый клиент</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Название компании *</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="ООО 'Пример'"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Тип *</Label>
            <Select value={type} onValueChange={(value) => setType(value as ClientType)}>
              <SelectTrigger id="type">
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mainContactName">Основное контактное лицо (ФИО) *</Label>
            <Input
              id="mainContactName"
              value={mainContactName}
              onChange={(e) => setMainContactName(e.target.value)}
              placeholder="Иванов Иван Иванович"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 123-45-67"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@company.ru"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Дополнительные контактные лица</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddContact}>
                <Plus className="h-4 w-4 mr-1" />
                Добавить контакт
              </Button>
            </div>

            {additionalContacts.map((contact, index) => (
              <Card key={contact.id} className="p-4">
                <div className="space-y-3">
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
              </Card>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Примечания</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительная информация о клиенте"
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Создать клиента
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Отмена
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
