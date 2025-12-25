import { LucideIcon, CirclePlus, Calculator, Package, PlayCircle, CircleEllipsis, CheckCircle, XCircle, Wrench, Settings, HardHat, AlertTriangle, Circle } from "lucide-react";

export type RequestStatus = 
  | "new"
  | "needs_calculation"
  | "awaiting_materials"
  | "in_progress"
  | "partially_completed"
  | "completed"
  | "closed";

export type RequestType = "repair" | "maintenance" | "installation";
export type RequestPriority = "urgent" | "normal";

export const REQUEST_STATUSES: { value: RequestStatus; label: string; icon?: LucideIcon }[] = [
  { value: "new", label: "Новая", icon: CirclePlus },
  { value: "needs_calculation", label: "Требует расчёта", icon: Calculator },
  { value: "awaiting_materials", label: "Ожидает материалов", icon: Package },
  { value: "in_progress", label: "В работе", icon: PlayCircle },
  { value: "partially_completed", label: "Частично выполнена", icon: CircleEllipsis },
  { value: "completed", label: "Выполнена", icon: CheckCircle },
  { value: "closed", label: "Закрыта", icon: XCircle },
];

export const REQUEST_TYPES: { value: RequestType; label: string; icon?: LucideIcon }[] = [
  { value: "repair", label: "Ремонт", icon: Wrench },
  { value: "maintenance", label: "ТО", icon: Settings },
  { value: "installation", label: "Монтаж", icon: HardHat },
];

export const REQUEST_PRIORITIES: { value: RequestPriority; label: string; icon?: LucideIcon }[] = [
  { value: "urgent", label: "Срочная", icon: AlertTriangle },
  { value: "normal", label: "Обычная", icon: Circle },
];

export interface Request {
  id: string;
  requestNumber: string;
  createdAt: Date;
  status: RequestStatus;
  type: RequestType;
  priority: RequestPriority;
  clientId: string;
  clientName: string;
  objectId: string;
  objectName: string;
  contractId?: string;
  contractNumber?: string;
  contractConditions?: string;
  problemDescription: string;
  comments: string;
  desiredDate?: string;
  responsibleManagerId?: string;
  responsibleManagerName?: string;
  assignedTeamId?: string;
  assignedTeamName?: string;
  assignedEngineerId?: string;
  assignedEngineerName?: string;
  plannedVisitDate?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  hoursSpent?: number;
}
