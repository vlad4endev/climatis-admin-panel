import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ServiceObject } from "@/types/serviceObject";
import { Building2, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ServiceObjectContactsEditor } from "./ServiceObjectContactsEditor";

interface ServiceObjectViewDialogProps {
  item: ServiceObject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceObjectViewDialog({
  item,
  open,
  onOpenChange,
}: ServiceObjectViewDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item.objectName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Название объекта
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{item.objectName}</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Организация
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">{item.clientName}</Badge>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-xs text-muted-foreground mb-1">Адрес</div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{item.address || "—"}</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Особенности доступа
            </div>
            <div className="text-sm text-muted-foreground">
              {item.accessDescription || "—"}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Примечания</div>
            <div className="text-sm text-muted-foreground">
              {item.notes || "—"}
            </div>
          </div>

          <Separator />

          <ServiceObjectContactsEditor
            serviceObjectId={item.id}
            clientId={item.clientId}
            readOnly
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
