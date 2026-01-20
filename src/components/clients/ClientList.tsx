import { Client } from "@/types/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

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
          <p className="text-muted-foreground">Организации не найдены. Создайте первую организацию.</p>
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
                    {client.division && (
                      <span className="text-sm text-muted-foreground">
                        {client.division}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {client.requisites && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Реквизиты:
                  </p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{client.requisites}</p>
                </div>
              )}
              {client.notes && (
                <div className="pt-2 mt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Примечания:
                  </p>
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
