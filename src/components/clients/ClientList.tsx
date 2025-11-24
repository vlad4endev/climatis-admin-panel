import { Client } from "@/types/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Building2 } from "lucide-react";

interface ClientListProps {
  clients: Client[];
}

export function ClientList({ clients }: ClientListProps) {
  const getTypeLabel = (type: Client["type"]) => {
    return type === "legal_entity" ? "Юр. лицо" : "ИП";
  };

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Клиенты не найдены. Создайте первого клиента.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {clients.map((client) => (
        <Card key={client.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{client.companyName}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{getTypeLabel(client.type)}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {client.mainContactName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${client.phone}`} className="hover:text-primary transition-colors">
                  {client.phone}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${client.email}`} className="hover:text-primary transition-colors">
                  {client.email}
                </a>
              </div>
              {client.additionalContacts.length > 0 && (
                <div className="pt-2 mt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Дополнительные контакты:
                  </p>
                  {client.additionalContacts.map((contact) => (
                    <div key={contact.id} className="text-sm text-muted-foreground">
                      {contact.name}
                      {contact.phone && ` • ${contact.phone}`}
                      {contact.email && ` • ${contact.email}`}
                    </div>
                  ))}
                </div>
              )}
              {client.notes && (
                <div className="pt-2 mt-2 border-t">
                  <p className="text-sm text-muted-foreground">{client.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
