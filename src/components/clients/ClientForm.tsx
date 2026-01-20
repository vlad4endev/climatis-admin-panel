import { useState, useEffect } from "react";
import { Client, ClientType } from "@/types/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [requisites, setRequisites] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (client) {
      setCompanyName(client.companyName);
      setType(client.type);
      setDivision(client.division);
      setRequisites(client.requisites || "");
      setNotes(client.notes);
    }
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      toast.error("Пожалуйста, заполните название организации");
      return;
    }

    onSubmit({
      companyName,
      type,
      division,
      requisites,
      notes,
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
        <Label htmlFor="requisites">Реквизиты</Label>
        <Textarea
          id="requisites"
          value={requisites}
          onChange={(e) => setRequisites(e.target.value)}
          placeholder="ИНН, КПП, ОГРН, расчётный счёт и т.д."
          rows={4}
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          className={readOnly ? "bg-input-readonly" : ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Примечания</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Дополнительная информация об организации"
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
