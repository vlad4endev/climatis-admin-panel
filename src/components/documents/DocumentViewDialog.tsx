import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Document, CONTRACT_TYPES, DOCUMENT_STATUSES } from "@/types/document";
import { DocumentAttachments } from "./DocumentAttachments";

interface DocumentViewDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentViewDialog({ document, open, onOpenChange }: DocumentViewDialogProps) {
  if (!document) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'active': return 'default';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const statusLabel = DOCUMENT_STATUSES.find(s => s.value === document.status)?.label || document.status;
  const contractTypeLabel = CONTRACT_TYPES.find(t => t.value === document.contractType)?.label || document.contractType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{document.contractNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Номер договора</div>
              <div className="text-sm">{document.contractNumber}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Статус</div>
              <Badge variant={getStatusBadgeVariant(document.status)}>
                {statusLabel}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Дата начала</div>
              <div className="text-sm">{document.startDate || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Дата окончания</div>
              <div className="text-sm">{document.endDate || '—'}</div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-xs text-muted-foreground mb-1">Тип договора</div>
            <div className="text-sm">{contractTypeLabel}</div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Контрагент</div>
            <div className="text-sm">{document.clientName || '—'}</div>
          </div>

          {document.objectName && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Объект</div>
              <div className="text-sm">{document.objectName}</div>
            </div>
          )}

          {document.responseConditions && (
            <>
              <Separator />
              <div>
                <div className="text-xs text-muted-foreground mb-1">Условия реагирования</div>
                <div className="text-sm whitespace-pre-wrap">{document.responseConditions}</div>
              </div>
            </>
          )}

          {document.notes && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Примечания</div>
              <div className="text-sm whitespace-pre-wrap">{document.notes}</div>
            </div>
          )}

          <Separator />

          {/* Прикреплённые документы */}
          <DocumentAttachments documentId={document.id} readOnly />
        </div>
      </DialogContent>
    </Dialog>
  );
}
