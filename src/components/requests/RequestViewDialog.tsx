import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { Request, REQUEST_STATUSES, REQUEST_TYPES, REQUEST_PRIORITIES } from "@/types/request";
import { ServiceObject } from "@/types/serviceObject";
import { Separator } from "@/components/ui/separator";

interface RequestViewDialogProps {
  request: Request | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceObject?: ServiceObject;
  onPrint?: (request: Request) => void;
}

export function RequestViewDialog({ request, open, onOpenChange, serviceObject, onPrint }: RequestViewDialogProps) {
  if (!request) return null;

  const status = REQUEST_STATUSES.find(s => s.value === request.status);
  const type = REQUEST_TYPES.find(t => t.value === request.type);
  const priority = REQUEST_PRIORITIES.find(p => p.value === request.priority);
  const mainContact = serviceObject?.assignedContacts?.find(c => c.isMain) || serviceObject?.assignedContacts?.[0];

  const variantMap: Record<string, { bg: string; text: string }> = {
    new: { bg: "bg-blue-500", text: "text-white" },
    needs_calculation: { bg: "bg-purple-500", text: "text-white" },
    awaiting_materials: { bg: "bg-orange-500", text: "text-white" },
    in_progress: { bg: "bg-cyan-500", text: "text-white" },
    partially_completed: { bg: "bg-yellow-500", text: "text-white" },
    completed: { bg: "bg-green-500", text: "text-white" },
    closed: { bg: "bg-gray-400", text: "text-white" },
  };
  const statusVariant = variantMap[request.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Заявка {request.requestNumber}</span>
            {request.priority === "urgent" && (
              <Badge variant="destructive">Срочная</Badge>
            )}
            {onPrint && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto mr-6 h-8 w-8"
                onClick={() => onPrint(request)}
                title="Печать заявки"
              >
                <Printer className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge className={`${statusVariant?.bg} ${statusVariant?.text} border-transparent`}>
              {status?.label}
            </Badge>
            <span className="text-muted-foreground">{type?.label}</span>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Контрагент</div>
              <div className="font-medium">{request.clientName}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Объект</div>
              <div className="font-medium">{request.objectName}</div>
            </div>
          </div>

          {(serviceObject?.address || mainContact) && (
            <div className="grid grid-cols-2 gap-4">
              {serviceObject?.address && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Адрес объекта</div>
                  <div>{serviceObject.address}</div>
                </div>
              )}
              {mainContact && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Контактное лицо</div>
                  <div>{mainContact.name}{mainContact.phone && ` · ${mainContact.phone}`}</div>
                </div>
              )}
            </div>
          )}

          {request.contractNumber && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Договор</div>
              <div>{request.contractNumber}</div>
              {request.contractConditions && (
                <div className="text-sm text-muted-foreground mt-1">{request.contractConditions}</div>
              )}
            </div>
          )}

          <Separator />

          <div>
            <div className="text-xs text-muted-foreground mb-1">Описание проблемы</div>
            <div className="bg-muted/50 p-3 rounded-md">{request.problemDescription}</div>
          </div>

          {request.comments && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Комментарии</div>
              <div className="bg-muted/50 p-3 rounded-md">{request.comments}</div>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Дата создания</div>
              <div>{new Date(request.createdAt).toLocaleString("ru-RU")}</div>
            </div>
            {request.desiredDate && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Желаемая дата</div>
                <div>{new Date(request.desiredDate).toLocaleDateString("ru-RU")}</div>
              </div>
            )}
            {request.plannedVisitDate && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Планируемая дата визита</div>
                <div>{new Date(request.plannedVisitDate).toLocaleString("ru-RU")}</div>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            {request.responsibleManagerName && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Ответственный менеджер</div>
                <div>{request.responsibleManagerName}</div>
              </div>
            )}
            {request.assignedTeamName && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Бригада</div>
                <div>{request.assignedTeamName}</div>
              </div>
            )}
            {request.assignedEngineerName && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Инженер</div>
                <div>{request.assignedEngineerName}</div>
              </div>
            )}
          </div>

          {(request.actualStartTime || request.actualEndTime || request.hoursSpent) && (
            <>
              <Separator />
              <div className="grid grid-cols-3 gap-4 text-sm">
                {request.actualStartTime && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Время начала</div>
                    <div>{new Date(request.actualStartTime).toLocaleString("ru-RU")}</div>
                  </div>
                )}
                {request.actualEndTime && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Время окончания</div>
                    <div>{new Date(request.actualEndTime).toLocaleString("ru-RU")}</div>
                  </div>
                )}
                {request.hoursSpent && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Затрачено часов</div>
                    <div>{request.hoursSpent}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}